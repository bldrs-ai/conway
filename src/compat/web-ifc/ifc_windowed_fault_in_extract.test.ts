/* eslint-disable no-magic-numbers */
// A windowed IFC geometry pump over a store that reads synchronously skips
// the per-product #ref closure walk, and its geometry is unchanged
// (conway#786).
//
// The walk pages and pins every record a product's extract will read. Over
// a store with `readSync` the extract faults each missing window in itself,
// so the walk only costs: on a 309 MB faceted-brep IFC2X3 model it walked
// 14.0 M records and was most of the 12.6 s by which windowed geometry
// trailed buffered in headless Chromium. These tests pin what the change
// bets on:
//  - with readSync no product walk runs, and the geometry matches a resident
//    open's exactly, at a window small enough that windows are evicted and
//    faulted back in inside every product (the guarantee the walk's pins
//    gave is not needed for correctness);
//  - without readSync the walk still runs, since a miss there throws;
//  - the views a batch captured are dropped when it ends, and the views
//    readers before the pump left behind are dropped by its first batch, so
//    evicted windows are not kept alive by stale views;
//  - the non-deferred store open (every product extracted inside
//    OpenModelStream) follows the same rule;
//  - a synchronous read that throws fails its product (logged once, by the
//    pump) and nothing else: no product is delivered partial and the load
//    goes on (StepSourceReadError);
//  - the aggregate pass (the second product pass, over IfcRelAggregates)
//    follows the same rule, in both opens, with a failed read contained to
//    its related product rather than abandoning the relationship.
//
// Every open here runs at a 256-byte window with a cap of one chunk from the
// start (WindowedStepBufferProvider.defaultWindowForTests), so the parse,
// the prep and the extract all evict and fault windows in.
import { createHash } from 'crypto'
import * as fs from 'fs'

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { IFCBUILDING, IFCCLASSIFICATION, IFCPROJECT, IFCSITE } from './ifc2x4'
import { FlatMesh, IfcAPI, Loadersettings } from './ifc_api'
import Logger from '../../logging/logger'
import {
  InMemoryStepByteStore,
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../../step/step_buffer_provider'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'

const SETTINGS: Loadersettings = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true }

// The non-deferred store open, which extracts every product inside
// OpenModelStream (IfcApiProxyIfc.finishWindowedOpen).
const EAGER: Loadersettings = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Shared mapped representations, styled items, a faceted brep under an
// aggregate, a grid placement: the shapes whose reads reach beyond the
// product record.
const FIXTURES = [
  'data/index.ifc',
  'data/mapped_shared_representation.ifc',
  'data/surface_style_shading_mapped.ifc',
  'data/aggregate_paged_prefetch.ifc',
  'data/grid_placement.ifc',
]

// Small enough that every product's records span several windows, with a
// cap of 1 so the extract evicts and re-faults windows mid-product.
const TINY_CHUNK_BYTES = 256
const TINY_CAP_CHUNKS = 1

beforeEach( () => {
  WindowedStepBufferProvider.defaultWindowForTests =
    { chunkBytes: TINY_CHUNK_BYTES, maxResidentChunks: TINY_CAP_CHUNKS }
} )

afterEach( () => {
  WindowedStepBufferProvider.defaultWindowForTests = void 0
  jest.restoreAllMocks()
} )

/** The model internals these tests read. */
interface WindowedModel {
  isSourceExternal: boolean
  trackCapturedSourceViews: boolean
  capturedSourceViewCount: number
  bufferProvider_: WindowedStepBufferProvider
  descriptorCache_: ( { buffer?: Uint8Array } | undefined )[]
  resolveExpressID( expressID: number ): number | undefined
  getElementByExpressID( expressID: number ): { extractLineArguments(): unknown } | undefined
  readTrackingSourceViews< T >( reader: () => T ): T
  releaseAllSourceViews(): void
}

/**
 * The most records one batch of the product pump pinned: its closure walk
 * is the only thing that pins into that set, so 0 means no product was
 * walked. (The aggregate pass does not pin into it; see the aggregate tests
 * at the end of this file.)
 *
 * @param api The API.
 * @param modelID The model.
 * @return {number} The batch pin maximum.
 */
function productPinMax( api: IfcAPI, modelID: number ): number {
  return ( api.getPassthrough( modelID ) as unknown as { extractProfile: { pinMax: number, batches: number } } )
      .extractProfile.pinMax
}

/**
 * A store with `readSync` that counts its synchronous reads per offset.
 *
 * @param bytes The source.
 * @return {StepExternalByteStore} The store.
 */
function syncStore( bytes: Uint8Array ): StepExternalByteStore & { syncReadsAt: Map< number, number > } {

  const inner = new InMemoryStepByteStore( bytes, true )
  const syncReadsAt = new Map< number, number >()

  return {
    byteLength: inner.byteLength,
    syncReadsAt,
    read: ( offset: number, length: number ) => inner.read( offset, length ),
    readSync: ( offset: number, length: number ) => {
      syncReadsAt.set( offset, ( syncReadsAt.get( offset ) ?? 0 ) + 1 )
      return inner.readSync!( offset, length )
    },
  }
}

/**
 * Flatten one mesh delta into comparable keys: placement and colour,
 * losslessly, and a hash of each geometry's vertex and index data.
 *
 * @param api The API.
 * @param modelID The model.
 * @param mesh The mesh.
 * @param previous Keys an earlier delta for the entity delivered.
 * @return {string[]} The entity's keys so far.
 */
function flatten( api: IfcAPI, modelID: number, mesh: FlatMesh, previous: string[] = [] ): string[] {

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )
    const geometry = api.GetGeometry( modelID, placed.geometryExpressID )
    const vertices = api.GetVertexArray( geometry.GetVertexData(), geometry.GetVertexDataSize() )
    const indices = api.GetIndexArray( geometry.GetIndexData(), geometry.GetIndexDataSize() )

    previous.push( [
      placed.geometryExpressID,
      JSON.stringify( placed.color ),
      Buffer.from( new Float64Array( placed.flatTransformation ).buffer ).toString( 'base64' ),
      createHash( 'sha256' )
          .update( new Uint8Array( vertices.buffer, vertices.byteOffset, vertices.byteLength ) )
          .update( new Uint8Array( indices.buffer, indices.byteOffset, indices.byteLength ) )
          .digest( 'hex' ),
    ].join( '|' ) )
  }

  return previous
}

/**
 * Pump a deferred model the way Share does, in batches of 3 (so a batch
 * holds several products), checking after every batch that no captured view
 * is left tracked.
 *
 * @param api The API.
 * @param modelID The model.
 * @param model The model, when windowed.
 * @return {Promise<Map<number, string[]>>} Every entity's placed geometry.
 */
async function pump( api: IfcAPI, modelID: number, model?: WindowedModel ):
    Promise< Map< number, string[] > > {

  const meshes = new Map< number, string[] >()

  for ( ;; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync( modelID, 3, ( mesh ) => {
      meshes.set( mesh.expressID, flatten( api, modelID, mesh, meshes.get( mesh.expressID ) ) )
    } )

    if ( model !== void 0 ) {
      expect( model.trackCapturedSourceViews ).toBe( false )
      expect( model.capturedSourceViewCount ).toBe( 0 )
    }

    if ( remaining === 0 && extracted === 0 ) {
      return meshes
    }
  }
}

/**
 * The resident reference: a buffered open, on an API of its own (two
 * deferred loads through one IfcAPI do not place identically; see
 * spill_releases_source.test.ts).
 *
 * @param path The fixture.
 * @return {Promise<Map<number, string[]>>} Its geometry.
 */
async function residentGeometry( path: string ): Promise< Map< number, string[] > > {

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStreamed( new Uint8Array( fs.readFileSync( path ) ), SETTINGS )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const meshes = await pump( api, modelID )

  api.CloseModel( modelID )

  expect( meshes.size ).toBeGreaterThan( 0 )

  return meshes
}

/**
 * Open a fixture windowed over `store` at the tiny window (see the
 * beforeEach), from the start: the parse, the extraction prep and the pump
 * all read through one provider with one chunk size.
 *
 * @param path The fixture.
 * @param store The store.
 * @param settings The open's settings.
 * @return {Promise<object>} The open.
 */
async function openWindowed( path: string, store: StepExternalByteStore, settings: Loadersettings = SETTINGS ):
    Promise< { api: IfcAPI, modelID: number, model: WindowedModel, provider: WindowedStepBufferProvider } > {

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStream( store, settings )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const model =
    ( api.getPassthrough( modelID ) as unknown as { model: [ WindowedModel ] } ).model[ 0 ]

  expect( model.isSourceExternal ).toBe( true )

  const provider = model.bufferProvider_

  expect( provider.residencyCapChunks ).toBe( TINY_CAP_CHUNKS )

  return { api, modelID, model, provider }
}

describe( 'windowed IFC pump over a store that faults windows in (conway#786)', () => {

  test.each( FIXTURES )( '%s: no product closure walk, geometry identical to resident', async ( path ) => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( path )
    const bytes = new Uint8Array( fs.readFileSync( path ) )
    const store = syncStore( bytes )
    const { api, modelID, model, provider } = await openWindowed( path, store )
    const faultsAtOpen = provider.syncFaultCount

    store.syncReadsAt.clear()

    const meshes = await pump( api, modelID, model )

    expect( meshes ).toEqual( expected )
    expect( productPinMax( api, modelID ) ).toBe( 0 )

    // The window really was too small: the pump's reads faulted windows
    // in, and some window was evicted and faulted in again during it.
    expect( provider.syncFaultCount ).toBeGreaterThan( faultsAtOpen )
    expect( Math.max( ...store.syncReadsAt.values() ) ).toBeGreaterThan( 1 )

    api.CloseModel( modelID )
  }, 120000 )

  // Not grid_placement.ifc: an IfcGridPlacement reads the IfcGrid, which no
  // forward #ref walk reaches, so without readSync and at this window the
  // grid read misses and the product degrades to its documented fallback
  // (IfcGridPlacement's "grid records are not resident" warning) on main as
  // here. With readSync that read faults in, which the test above checks.
  test.each( FIXTURES.filter( ( path ) => !path.includes( 'grid_placement' ) ) )(
      '%s: without readSync the walk still pages each product', async ( path ) => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( path )
    const bytes = new Uint8Array( fs.readFileSync( path ) )
    const { api, modelID, model, provider } = await openWindowed( path, new InMemoryStepByteStore( bytes ) )

    const meshes = await pump( api, modelID, model )

    expect( meshes ).toEqual( expected )
    expect( productPinMax( api, modelID ) ).toBeGreaterThan( 0 )
    expect( provider.syncFaultCount ).toBe( 0 )

    api.CloseModel( modelID )
  }, 120000 )

  test( 'the first batch drops the views readers before the pump left behind', async () => {

    const path = 'data/index.ifc'
    const bytes = new Uint8Array( fs.readFileSync( path ) )
    const { api, modelID, model } = await openWindowed( path, syncStore( bytes ) )

    // A record neither the extraction prep nor any product's closure walk
    // reaches: an IfcClassification (only an inverse relationship names
    // it). Reading it before the pump leaves its descriptor holding a view,
    // which the walk path never drops.
    const recordID = api.GetLineIDsWithType( modelID, IFCCLASSIFICATION ).get( 0 )

    model.getElementByExpressID( recordID )?.extractLineArguments()

    const localID = model.resolveExpressID( recordID ) as number

    expect( model.descriptorCache_[ localID ]?.buffer ).toBeDefined()

    await api.ExtractGeometryBatchAsync( modelID, 1 )

    expect( model.descriptorCache_[ localID ]?.buffer ).toBeUndefined()

    api.CloseModel( modelID )
  }, 120000 )
} )

describe( 'StepModelBase.readTrackingSourceViews / releaseAllSourceViews (conway#786)', () => {

  /**
   * @param model The model.
   * @param expressID A record.
   * @return {Uint8Array | undefined} Its descriptor's view, after reading it.
   */
  function read( model: WindowedModel, expressID: number ): Uint8Array | undefined {

    model.getElementByExpressID( expressID )?.extractLineArguments()

    return model.descriptorCache_[ model.resolveExpressID( expressID ) as number ]?.buffer
  }

  /**
   * @param model The model.
   * @param expressID A record.
   * @return {Uint8Array | undefined} Its descriptor's view, without reading it.
   */
  function viewOf( model: WindowedModel, expressID: number ): Uint8Array | undefined {
    return model.descriptorCache_[ model.resolveExpressID( expressID ) as number ]?.buffer
  }

  test( 'drops exactly the views the reader captured and restores the flag, thrown or not', async () => {

    const path = 'data/index.ifc'
    const bytes = new Uint8Array( fs.readFileSync( path ) )
    const { api, modelID, model } = await openWindowed( path, syncStore( bytes ) )
    const projectID = api.GetLineIDsWithType( modelID, IFCPROJECT ).get( 0 )
    const siteID = api.GetLineIDsWithType( modelID, IFCSITE ).get( 0 )
    const buildingID = api.GetLineIDsWithType( modelID, IFCBUILDING ).get( 0 )

    model.releaseAllSourceViews()

    // Captured before: not the reader's, left alone.
    expect( read( model, projectID ) ).toBeDefined()

    const answer = model.readTrackingSourceViews( () => {

      expect( model.trackCapturedSourceViews ).toBe( true )
      expect( read( model, siteID ) ).toBeDefined()
      expect( model.capturedSourceViewCount ).toBeGreaterThan( 0 )

      return 7
    } )

    expect( answer ).toBe( 7 )
    expect( viewOf( model, siteID ) ).toBeUndefined()
    expect( viewOf( model, projectID ) ).toBeDefined()
    expect( model.trackCapturedSourceViews ).toBe( false )
    expect( model.capturedSourceViewCount ).toBe( 0 )

    expect( () => model.readTrackingSourceViews( () => {
      read( model, buildingID )
      throw new Error( 'reader failed' )
    } ) ).toThrow( 'reader failed' )

    expect( viewOf( model, buildingID ) ).toBeUndefined()
    expect( model.trackCapturedSourceViews ).toBe( false )
    expect( model.capturedSourceViewCount ).toBe( 0 )

    // And the sweep drops the view the tracked reads never saw.
    model.releaseAllSourceViews()

    expect( viewOf( model, projectID ) ).toBeUndefined()

    api.CloseModel( modelID )
  }, 120000 )
} )


describe( 'non-deferred windowed IFC open over a store that faults windows in (conway#786)', () => {

  /**
   * Every placed geometry a model delivers through StreamAllMeshes.
   *
   * @param api The API.
   * @param modelID The model.
   * @return {Map<number, string[]>} Per entity.
   */
  function streamAll( api: IfcAPI, modelID: number ): Map< number, string[] > {

    const meshes = new Map< number, string[] >()

    api.StreamAllMeshes( modelID, ( mesh ) => {
      meshes.set( mesh.expressID, flatten( api, modelID, mesh, meshes.get( mesh.expressID ) ) )
    } )

    return meshes
  }

  /**
   * Count the product walks finishWindowedOpen's own product loop issues.
   * The aggregate prefetch in the same open walks its products through the
   * same method, so calls are told apart by the loop that made them.
   *
   * @return {{count: number}} The live count.
   */
  function countProductLoopWalks(): { count: number } {

    const counter = { count: 0 }
    const original = IfcGeometryExtraction.prototype.ensureResidentForProductExtract

    jest.spyOn( IfcGeometryExtraction.prototype, 'ensureResidentForProductExtract' )
        .mockImplementation( function ( this: IfcGeometryExtraction, ...args ) {

          if ( new Error().stack?.includes( 'flushProductBatch' ) === true ) {
            ++counter.count
          }

          return original.apply( this, args )
        } )

    return counter
  }

  test.each( [ 'data/index.ifc', 'data/mapped_shared_representation.ifc', 'data/grid_placement.ifc' ] )(
      '%s: with readSync, no product walk, faults and evictions, geometry identical to resident',
      async ( path ) => {

        jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

        const bytes = new Uint8Array( fs.readFileSync( path ) )
        const reference = new IfcAPI()

        await reference.Init()

        const referenceID = reference.OpenModel( bytes.slice(), EAGER )
        const expected = streamAll( reference, referenceID )

        reference.CloseModel( referenceID )

        expect( expected.size ).toBeGreaterThan( 0 )

        const walks = countProductLoopWalks()
        const store = syncStore( bytes )
        const { api, modelID, provider } = await openWindowed( path, store, EAGER )

        expect( streamAll( api, modelID ) ).toEqual( expected )
        expect( walks.count ).toBe( 0 )
        expect( provider.syncFaultCount ).toBeGreaterThan( 0 )
        expect( Math.max( ...store.syncReadsAt.values() ) ).toBeGreaterThan( 1 )

        api.CloseModel( modelID )
      }, 120000 )

  test( 'data/index.ifc: without readSync the product loop still walks', async () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const walks = countProductLoopWalks()
    const { api, modelID, provider } =
      await openWindowed( 'data/index.ifc', new InMemoryStepByteStore( bytes ), EAGER )

    expect( streamAll( api, modelID ).size ).toBeGreaterThan( 0 )
    expect( walks.count ).toBeGreaterThan( 0 )
    expect( provider.syncFaultCount ).toBe( 0 )

    api.CloseModel( modelID )
  }, 120000 )
} )


describe( 'a failed synchronous read fails its product, not the load (conway#786, conway#526)', () => {

  test( 'the product is logged as failed, the others extract whole, and the pump completes', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const path = 'data/index.ifc'
    const expected = await residentGeometry( path )
    const bytes = new Uint8Array( fs.readFileSync( path ) )

    // The window holding the first faceset's record: product geometry,
    // read only by that product's extract.
    const faceset = Buffer.from( bytes ).indexOf( 'IFCPOLYGONALFACESET(' )
    const failing = Math.floor( faceset / TINY_CHUNK_BYTES ) * TINY_CHUNK_BYTES

    expect( faceset ).toBeGreaterThan( 0 )

    const good = syncStore( bytes )
    let failures = 0
    const store: StepExternalByteStore = {
      byteLength: good.byteLength,
      read: good.read,
      readSync: ( offset: number, length: number ) => {

        if ( offset === failing ) {
          ++failures
          throw new Error( 'simulated handle failure' )
        }

        return good.readSync!( offset, length )
      },
    }

    const errors: string[] = []

    jest.spyOn( Logger, 'error' ).mockImplementation( ( ( message: string ) => {
      errors.push( message )
    } ) as typeof Logger.error )

    const { api, modelID } = await openWindowed( path, store )
    const meshes = await pump( api, modelID )

    expect( failures ).toBeGreaterThan( 0 )

    const failed = errors.filter( ( message ) =>
      message.startsWith( 'Error extracting product' ) && message.includes( 'simulated handle failure' ) )

    // Logged once per failed product, and only for products the read
    // failure actually reached.
    expect( failed.length ).toBeGreaterThan( 0 )
    expect( failed.length ).toBe( new Set( failed ).size )
    expect( meshes.size ).toBe( expected.size - failed.length )

    // No product is delivered partial: everything that arrived is exactly
    // what the resident open delivers for it.
    for ( const [ expressID, placed ] of meshes ) {
      expect( placed ).toEqual( expected.get( expressID ) )
    }

    api.CloseModel( modelID )
  }, 120000 )
} )


describe( 'windowed IFC aggregate pass over a store that faults windows in (conway#786)', () => {

  // Twelve parts, every one of them under one IfcRelAggregates, so the
  // whole model's geometry comes from the aggregate pass.
  const AGGREGATE = 'data/aggregate_paged_prefetch.ifc'

  /**
   * Count the aggregate pass's prefetches: the deferred pump's wave pager
   * and the non-deferred open's whole-relationship prefetch.
   *
   * @return {{pagers: number, prefetches: number}} The live counts.
   */
  function countAggregateWalks(): { pagers: number, prefetches: number } {

    const counter = { pagers: 0, prefetches: 0 }
    const beginPager = IfcGeometryExtraction.prototype.beginAggregateExtract
    const prefetch = IfcGeometryExtraction.prototype.ensureResidentForAggregateExtract

    jest.spyOn( IfcGeometryExtraction.prototype, 'beginAggregateExtract' )
        .mockImplementation( function ( this: IfcGeometryExtraction, ...args ) {
          ++counter.pagers
          return beginPager.apply( this, args )
        } )

    jest.spyOn( IfcGeometryExtraction.prototype, 'ensureResidentForAggregateExtract' )
        .mockImplementation( function ( this: IfcGeometryExtraction, ...args ) {
          ++counter.prefetches
          return prefetch.apply( this, args )
        } )

    return counter
  }

  test( 'deferred pump: no aggregate pager, windows evicted and faulted in, geometry identical to resident', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( AGGREGATE )
    const walks = countAggregateWalks()
    const store = syncStore( new Uint8Array( fs.readFileSync( AGGREGATE ) ) )
    const { api, modelID, model, provider } = await openWindowed( AGGREGATE, store )
    const faultsAtOpen = provider.syncFaultCount

    store.syncReadsAt.clear()

    // pump() also checks, after every batch, that no view is left tracked:
    // the aggregate steps run inside readTrackingSourceViews.
    expect( await pump( api, modelID, model ) ).toEqual( expected )
    expect( walks.pagers ).toBe( 0 )

    // With the pager, the parts' closures were paged and pinned ahead of
    // the stepper and no window was read twice; without it the stepper's
    // own reads evict and fault windows back in.
    expect( provider.syncFaultCount ).toBeGreaterThan( faultsAtOpen )
    expect( Math.max( ...store.syncReadsAt.values() ) ).toBeGreaterThan( 1 )

    api.CloseModel( modelID )
  }, 120000 )

  test( 'deferred pump: without readSync the aggregate pager still pages', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( AGGREGATE )
    const walks = countAggregateWalks()
    const bytes = new Uint8Array( fs.readFileSync( AGGREGATE ) )
    const { api, modelID, model, provider } = await openWindowed( AGGREGATE, new InMemoryStepByteStore( bytes ) )

    expect( await pump( api, modelID, model ) ).toEqual( expected )
    expect( walks.pagers ).toBeGreaterThan( 0 )
    expect( provider.syncFaultCount ).toBe( 0 )

    api.CloseModel( modelID )
  }, 120000 )

  test( 'non-deferred open: no aggregate prefetch with readSync, geometry identical to resident; one without', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const bytes = new Uint8Array( fs.readFileSync( AGGREGATE ) )
    const reference = new IfcAPI()

    await reference.Init()

    const referenceID = reference.OpenModel( bytes.slice(), EAGER )
    const expected = new Map< number, string[] >()

    reference.StreamAllMeshes( referenceID, ( mesh ) => {
      expected.set( mesh.expressID, flatten( reference, referenceID, mesh, expected.get( mesh.expressID ) ) )
    } )
    reference.CloseModel( referenceID )

    expect( expected.size ).toBeGreaterThan( 0 )

    const walks = countAggregateWalks()

    for ( const withReadSync of [ true, false ] ) {

      walks.prefetches = 0

      const store = withReadSync ? syncStore( bytes ) : new InMemoryStepByteStore( bytes )
      const { api, modelID } = await openWindowed( AGGREGATE, store, EAGER )
      const meshes = new Map< number, string[] >()

      api.StreamAllMeshes( modelID, ( mesh ) => {
        meshes.set( mesh.expressID, flatten( api, modelID, mesh, meshes.get( mesh.expressID ) ) )
      } )

      expect( meshes ).toEqual( expected )
      expect( walks.prefetches > 0 ).toBe( !withReadSync )

      api.CloseModel( modelID )
    }
  }, 120000 )

  test( 'a failed synchronous read fails its related product, and the rest of the relationship extracts whole', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( AGGREGATE )
    const bytes = new Uint8Array( fs.readFileSync( AGGREGATE ) )

    // The window holding Part_1's profile: read only by that part's
    // extract (and, at this window size, perhaps a neighbour's).
    const profile = Buffer.from( bytes ).indexOf( '#1025=IFCRECTANGLEPROFILEDEF(' )
    const failing = Math.floor( profile / TINY_CHUNK_BYTES ) * TINY_CHUNK_BYTES

    expect( profile ).toBeGreaterThan( 0 )

    const good = syncStore( bytes )
    let failures = 0
    const store: StepExternalByteStore = {
      byteLength: good.byteLength,
      read: good.read,
      readSync: ( offset: number, length: number ) => {

        if ( offset === failing ) {
          ++failures
          throw new Error( 'simulated handle failure' )
        }

        return good.readSync!( offset, length )
      },
    }

    const errors: string[] = []

    jest.spyOn( Logger, 'error' ).mockImplementation( ( ( message: string ) => {
      errors.push( message )
    } ) as typeof Logger.error )

    const { api, modelID } = await openWindowed( AGGREGATE, store )
    const meshes = await pump( api, modelID )

    expect( failures ).toBeGreaterThan( 0 )

    const failed = errors.filter( ( message ) =>
      message.startsWith( 'Error extracting product' ) && message.includes( 'simulated handle failure' ) )

    // Each failed part logged once, the relationship never abandoned, and
    // only the failed parts missing.
    expect( failed.length ).toBeGreaterThan( 0 )
    expect( failed.length ).toBe( new Set( failed ).size )
    expect( errors.some( ( message ) => message.startsWith( 'Error processing relAggregate' ) ) ).toBe( false )
    expect( meshes.size ).toBe( expected.size - failed.length )
    expect( meshes.size ).toBeGreaterThan( 0 )

    for ( const [ expressID, placed ] of meshes ) {
      expect( placed ).toEqual( expected.get( expressID ) )
    }

    api.CloseModel( modelID )
  }, 120000 )
} )
