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
//    evicted windows are not kept alive by stale views.
import { createHash } from 'crypto'
import * as fs from 'fs'

import { afterEach, describe, expect, jest, test } from '@jest/globals'

import { IFCBUILDING, IFCCLASSIFICATION, IFCPROJECT, IFCSITE } from './ifc2x4'
import { FlatMesh, IfcAPI } from './ifc_api'
import {
  InMemoryStepByteStore,
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../../step/step_buffer_provider'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true }

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

// The fixtures whose product pump reads enough at the tiny window to evict
// a window and fault it in again. aggregate_paged_prefetch.ifc's geometry is
// all under its aggregate, which the aggregate pager pages ahead.
const REREADS = new Set( FIXTURES.filter( ( path ) => !path.includes( 'aggregate_paged_prefetch' ) ) )

// Small enough that every product's records span several windows, with a
// cap of 1 so the extract evicts and re-faults windows mid-product.
const TINY_CHUNK_BYTES = 256
const TINY_CAP_CHUNKS = 1

afterEach( () => {
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
 * walked. (The aggregate pager walks its related products through its own
 * pins, outside this change's scope.)
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
 * Open a fixture windowed over `store`, then swap the model's provider for
 * one with a tiny window, so the pump's reads cross windows and evict.
 * The open itself runs at the default 4 MiB window, which holds these
 * fixtures whole; descriptors it read keep views of those windows, which
 * hold the same bytes, and are what the first batch's sweep must drop.
 *
 * @param path The fixture.
 * @param store The store.
 * @return {Promise<object>} The open.
 */
async function openWindowed( path: string, store: StepExternalByteStore ):
    Promise< { api: IfcAPI, modelID: number, model: WindowedModel, provider: WindowedStepBufferProvider } > {

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStream( store, SETTINGS )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const model =
    ( api.getPassthrough( modelID ) as unknown as { model: [ WindowedModel ] } ).model[ 0 ]

  expect( model.isSourceExternal ).toBe( true )

  const provider = new WindowedStepBufferProvider( store, TINY_CHUNK_BYTES, TINY_CAP_CHUNKS )

  model.bufferProvider_ = provider

  return { api, modelID, model, provider }
}

describe( 'windowed IFC pump over a store that faults windows in (conway#786)', () => {

  test.each( FIXTURES )( '%s: no product closure walk, geometry identical to resident', async ( path ) => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const expected = await residentGeometry( path )
    const bytes = new Uint8Array( fs.readFileSync( path ) )
    const store = syncStore( bytes )
    const { api, modelID, model, provider } = await openWindowed( path, store )

    const meshes = await pump( api, modelID, model )

    expect( meshes ).toEqual( expected )
    expect( productPinMax( api, modelID ) ).toBe( 0 )

    // The window really was too small: reads faulted windows in, and some
    // window was evicted and faulted in again during the pump.
    expect( provider.syncFaultCount ).toBeGreaterThan( 0 )
    expect( Math.max( ...store.syncReadsAt.values() ) > 1 ).toBe( REREADS.has( path ) )

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
