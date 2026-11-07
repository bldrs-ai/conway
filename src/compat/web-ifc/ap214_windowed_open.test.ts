/* eslint-disable no-magic-numbers */
// conway#757: STEP (AP214) opens windowed and reopens from an index sidecar,
// through the same compat calls IFC uses (OpenModelStream,
// ExportIndexSidecar, OpenModelFromIndex). What this file proves, on every
// in-repo STEP fixture:
//
//  1. a windowed open (`OpenModelStream` over a store with `readSync`) is
//     the buffered open: the same express IDs, the same product tree, the
//     same properties on every tree node, and the same placed geometry —
//     owner, geometry id, transform, occurrence path and the mesh bytes;
//  2. a sidecar exported from a buffered open and from a windowed one are
//     byte-identical, and a model opened from it is the fresh parse again,
//     re-exporting the same bytes;
//  3. those comparisons can FAIL: a sidecar with one type or one express ID
//     changed is caught by the comparison it feeds;
//  4. a sidecar for other bytes, or stamped for another schema, is
//     refused as INDEX_STALE; a store with no synchronous read is refused
//     as STORE_NOT_SYNCHRONOUS;
//  5. at the engine level, over 4 KiB windows with a 2-window cap — so the
//     reads really fault in and evict — extraction and properties are the
//     same as resident, and a drain stays inside the cap.
import * as fs from 'fs'
import { createHash } from 'crypto'

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { IfcAPI, Loadersettings } from './ifc_api'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'
import { storeOpenRequirementOf } from './store_open_support'
import {
  InMemoryStepByteStore,
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../../step/step_buffer_provider'
import {
  deserializeIndexSidecarToColumns,
  IFC_SIDECAR_SCHEMA,
  serializeIndexSidecarFromColumns,
  SidecarSchemaStamp,
} from '../../step/parsing/index_sidecar'
import { BufferByteSource } from '../../step/parsing/byte_source'
import { ColumnarIndexSink, StepIndexColumns } from '../../step/parsing/columnar_index'
import { buildIndexStreaming } from '../../step/parsing/streaming_index_builder'
import { ParseResult } from '../../step/parsing/step_parser'
import AP214StepParser from '../../AP214E3_2010/ap214_step_parser'
import AP214StepModel, { AP214_SIDECAR_SCHEMA } from '../../AP214E3_2010/ap214_step_model'
import EntityTypesAP214 from '../../AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen'
import { AP214GeometryExtraction } from '../../AP214E3_2010/ap214_geometry_extraction'
import { AP214ProductStructureExtraction } from '../../AP214E3_2010/ap214_product_structure_extraction'
import { AP214PropertyExtraction } from '../../AP214E3_2010/ap214_property_extraction'
import { ConwayGeometry } from '../../../dependencies/conway-geom'


const DEFER = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
  RECORD_SOURCE_HASH: true,
}

// Every in-repo STEP fixture that opens at all. The header-only ones have no
// data section to compare and are filtered by the buffered open itself.
const FIXTURES = fs.readdirSync( 'data' )
    .filter( ( name ) => /\.(step|stp)$/.test( name ) )
    .sort()

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

afterEach( () => {
  jest.restoreAllMocks()
} )


/**
 * @param name A file under `data/`.
 * @return {Uint8Array} Its bytes.
 */
function fixture( name: string ): Uint8Array {
  return new Uint8Array( fs.readFileSync( `data/${name}` ) )
}


/**
 * A store over bytes that reads synchronously, and counts its reads.
 *
 * @param bytes The source.
 * @return {StepExternalByteStore & {syncReads: number}} The store.
 */
function syncStore( bytes: Uint8Array ): StepExternalByteStore & { syncReads: number } {

  const store = {
    byteLength: bytes.byteLength,
    syncReads: 0,
    read: ( offset: number, length: number ) =>
      Promise.resolve( bytes.slice( offset, offset + length ) ),
    readSync: ( offset: number, length: number ) => {
      ++store.syncReads
      return bytes.slice( offset, offset + length )
    },
  }

  return store
}


/** What the parity claim compares, read off one open model. */
interface ModelView {
  expressIDs: number[]
  tree: unknown
  properties: unknown[]
  placements: string[]
}


/**
 * Drain the model's pump and read everything the parity claim covers
 * through the compat surface.
 *
 * @param modelID The open model.
 * @return {Promise<ModelView>} What it reads back.
 */
async function readModel( modelID: number ): Promise< ModelView > {

  const lines = api.GetAllLines( modelID )
  const expressIDs: number[] = []

  for ( let where = 0; where < lines.size(); ++where ) {
    expressIDs.push( lines.get( where ) )
  }

  expressIDs.sort( ( a, b ) => a - b )

  const tree = await api.properties.getSpatialStructure(
      modelID, 'names', { includeSolids: true } )

  const nodeIDs: number[] = []
  const walk = ( node: any ) => {
    nodeIDs.push( node.expressID )
    for ( const child of node.children ?? [] ) {
      walk( child )
    }
  }

  walk( tree )

  const properties: unknown[] = []

  for ( const id of nodeIDs ) {
    properties.push( [
      id,
      await api.properties.getItemProperties( modelID, id ),
      await api.properties.getPropertySets( modelID, id ),
    ] )
  }

  const placements: string[] = []

  for ( ;; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, 8, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )
            const geometry = api.GetGeometry( modelID, placed.geometryExpressID )
            const vertices = api.GetVertexArray(
                geometry.GetVertexData(), geometry.GetVertexDataSize() )
            const indices = api.GetIndexArray(
                geometry.GetIndexData(), geometry.GetIndexDataSize() )

            placements.push( createHash( 'sha256' )
                .update( `${mesh.expressID}|${placed.geometryExpressID}|` +
                  `${JSON.stringify( placed.occurrencePath ?? null )}|` +
                  `${Array.from( placed.flatTransformation ).join( ',' )}|` )
                .update( Buffer.from( vertices.buffer, vertices.byteOffset, vertices.byteLength ) )
                .update( Buffer.from( indices.buffer, indices.byteOffset, indices.byteLength ) )
                .digest( 'hex' ) )
          }
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  // Delivery order is the pump's batching, which a time budget decides;
  // the claim is about WHAT is placed, so compare as a multiset.
  placements.sort()

  return { expressIDs, tree, properties, placements }
}


/**
 * Open, read, export, close.
 *
 * @param open Opens the model; returns its id.
 * @return {Promise<{view: ModelView, sidecar: Uint8Array | undefined, external: boolean}>}
 * What it read, its exported sidecar, and whether it was windowed.
 */
async function openAndRead( open: () => Promise< number > ) {

  // A fresh engine per open: a second AP214 open in one IfcAPI reads some
  // placements back zeroed after the first is closed (pre-existing on main,
  // and nothing to do with windowing — buffered-after-buffered shows it too),
  // which would make every comparison here compare that bug.
  api = new IfcAPI()
  await api.Init()

  const modelID = await open()

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  try {

    const view = await readModel( modelID )
    const proxy = api.getPassthrough( modelID ) as unknown as IfcApiProxyAP214

    // The drain, which reads last, dropped the window views its batches
    // faulted in (IfcApiProxyAP214#pumpDemandUnits_), so a windowed model
    // holds no more windows than the LRU's after a load. Nothing to drop on
    // a resident one.
    expect( proxy.StepModel.releaseCapturedSourceViews() ).toBe( 0 )
    const sidecar = await api.ExportIndexSidecar( modelID )

    return { view, sidecar, external: proxy.sourceIsExternal }
  } finally {
    api.CloseModel( modelID )
  }
}


/**
 * Re-serialise a sidecar with its columns edited (or its stamp replaced),
 * keeping its source identity — the mutants the comparisons must catch.
 *
 * @param sidecar A good sidecar.
 * @param edit Mutates the decoded columns.
 * @param schema The stamp to write (default: the sidecar's own).
 * @return {Uint8Array} The mutant.
 */
function mutate(
    sidecar: Uint8Array,
    edit: ( columns: StepIndexColumns< EntityTypesAP214 > ) => void,
    schema?: SidecarSchemaStamp ): Uint8Array {

  const decoded = deserializeIndexSidecarToColumns< EntityTypesAP214 >( sidecar )

  edit( decoded.columns )

  return serializeIndexSidecarFromColumns(
      decoded.columns, decoded.sourceByteLength, decoded.sourceHash,
      { schema: schema ?? decoded.schema, sampledHash: decoded.sampledHash } )
}


describe( 'STEP opens windowed and reopens from its sidecar, through the compat surface', () => {

  for ( const name of FIXTURES ) {

    test( `${name}: windowed == buffered, and the sidecar reopens the same model`, async () => {

      jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
      jest.spyOn( console, 'error' ).mockImplementation( () => {} )
      jest.spyOn( console, 'info' ).mockImplementation( () => {} )
      jest.spyOn( console, 'log' ).mockImplementation( () => {} )

      const bytes = fixture( name )

      const probeID = await api.OpenModelStreamed( bytes, DEFER )

      if ( probeID < 0 ) {
        // A header-only fixture: nothing for any open to compare.
        expect( await api.OpenModelStream( syncStore( bytes ), DEFER ) ).toBe( -1 )
        return
      }

      api.CloseModel( probeID )

      const buffered = await openAndRead( () => api.OpenModelStreamed( bytes, DEFER ) )
      const windowedStore = syncStore( bytes )
      const windowed = await openAndRead( () => api.OpenModelStream( windowedStore, DEFER ) )

      expect( buffered.external ).toBe( false )
      expect( windowed.external ).toBe( true )
      expect( windowed.view ).toEqual( buffered.view )

      // 2. Byte-identical sidecars from both opens, and the index-first
      // open reads the same model and re-exports the same bytes.
      expect( buffered.sidecar ).toBeDefined()
      expect( Buffer.from( windowed.sidecar! ).equals( Buffer.from( buffered.sidecar! ) ) )
          .toBe( true )

      const reopened = await openAndRead( () =>
        api.OpenModelFromIndex( syncStore( bytes ), buffered.sidecar!, DEFER ) )

      expect( reopened.external ).toBe( true )
      expect( reopened.view ).toEqual( buffered.view )
      expect( Buffer.from( reopened.sidecar! ).equals( Buffer.from( buffered.sidecar! ) ) )
          .toBe( true )
    }, 180000 )
  }
} )


describe( 'the parity comparisons can fail (conway#757)', () => {

  const NAME = 'as1-oc-214.stp'

  test( 'a sidecar with one type, or one express ID, changed reads back differently', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const bytes = fixture( NAME )
    const fresh = await openAndRead( () => api.OpenModelStreamed( bytes, DEFER ) )

    // The first NAUO: a product-structure record, so the tree must notice.
    const decoded = deserializeIndexSidecarToColumns< EntityTypesAP214 >( fresh.sidecar! )
    const nauo = Array.from( decoded.columns.typeID ).indexOf(
        EntityTypesAP214.NEXT_ASSEMBLY_USAGE_OCCURRENCE )

    expect( nauo ).toBeGreaterThanOrEqual( 0 )

    const retyped = mutate( fresh.sidecar!, ( columns ) => {
      columns.typeID[ nauo ] = EntityTypesAP214.CARTESIAN_POINT
    } )
    const renumbered = mutate( fresh.sidecar!, ( columns ) => {
      columns.expressID[ 0 ] += 1000000
    } )

    const afterRetype = await openAndRead( () =>
      api.OpenModelFromIndex( syncStore( bytes ), retyped, DEFER ) )
    const afterRenumber = await openAndRead( () =>
      api.OpenModelFromIndex( syncStore( bytes ), renumbered, DEFER ) )

    expect( afterRetype.view.tree ).not.toEqual( fresh.view.tree )
    expect( afterRenumber.view.expressIDs ).not.toEqual( fresh.view.expressIDs )
  }, 180000 )
} )


describe( 'what a STEP index-first or windowed open refuses (conway#757)', () => {

  const NAME = 'as1-oc-214.stp'

  /**
   * Attempt an index-first open and return the id and the status.
   *
   * @param store The store.
   * @param sidecar The sidecar.
   * @param settings Open settings.
   * @return {Promise<{id: number, status: string | undefined}>} The outcome.
   */
  async function attempt(
      store: StepExternalByteStore, sidecar: Uint8Array, settings: Loadersettings = DEFER ) {

    const attemptedID = api.globalModelIDCounter
    const id = await api.OpenModelFromIndex( store, sidecar, settings )

    if ( id >= 0 ) {
      api.CloseModel( id )
    }

    return { id, status: api.getStatistics( attemptedID )?.getLoadStatus() }
  }

  test( 'other bytes, another schema stamp, and an asynchronous store', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const bytes = fixture( NAME )
    const modelID = await api.OpenModelStreamed( bytes, DEFER )
    const sidecar = ( await api.ExportIndexSidecar( modelID ) )!

    api.CloseModel( modelID )

    // Baseline: it opens.
    expect( ( await attempt( syncStore( bytes ), sidecar ) ).id ).toBeGreaterThanOrEqual( 0 )

    // Truncated.
    expect( await attempt( syncStore( bytes.subarray( 0, bytes.length - 1 ) ), sidecar ) )
        .toEqual( { id: -1, status: 'INDEX_STALE' } )

    // Same length, one byte of a name changed: the length gate passes it,
    // the full and the sampled gates (the whole file is sampled at this
    // size) refuse it.
    const rewritten = bytes.slice()
    const at = new TextDecoder().decode( bytes ).indexOf( '\'', 2000 ) + 1

    rewritten[ at ] = rewritten[ at ] === 0x41 ? 0x42 : 0x41

    expect( ( await attempt( syncStore( rewritten ), sidecar ) ).id ).toBeGreaterThanOrEqual( 0 )

    for ( const verify of [ true, 'sampled' ] as const ) {
      expect( await attempt( syncStore( rewritten ), sidecar,
          { ...DEFER, VERIFY_INDEX_SOURCE_HASH: verify } ) )
          .toEqual( { id: -1, status: 'INDEX_STALE' } )
    }

    // The same columns stamped IFC, or AP214 with another enumeration size.
    for ( const schema of [
      IFC_SIDECAR_SCHEMA,
      { ...AP214_SIDECAR_SCHEMA, typeCount: AP214_SIDECAR_SCHEMA.typeCount - 1 },
    ] ) {
      expect( await attempt( syncStore( bytes ), mutate( sidecar, () => {}, schema ) ) )
          .toEqual( { id: -1, status: 'INDEX_STALE' } )
    }

    // A store that cannot read synchronously: not windowable, said so.
    expect( await attempt( new InMemoryStepByteStore( bytes ), sidecar ) )
        .toEqual( { id: -1, status: 'STORE_NOT_SYNCHRONOUS' } )

    const attemptedID = api.globalModelIDCounter

    expect( await api.OpenModelStream( new InMemoryStepByteStore( bytes ), DEFER ) ).toBe( -1 )
    expect( api.getStatistics( attemptedID ).getLoadStatus() ).toBe( 'STORE_NOT_SYNCHRONOUS' )
  }, 180000 )

  test( 'an IFC sidecar on a STEP store, and a STEP sidecar on an IFC store, are stale', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
    jest.spyOn( console, 'error' ).mockImplementation( () => {} )

    const step = fixture( NAME )
    const stepID = await api.OpenModelStreamed( step, DEFER )
    const stepSidecar = ( await api.ExportIndexSidecar( stepID ) )!

    api.CloseModel( stepID )

    const ifc = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const ifcID = await api.OpenModelStreamed( ifc, DEFER )
    const ifcSidecar = ( await api.ExportIndexSidecar( ifcID ) )!

    api.CloseModel( ifcID )

    // Lengths differ too, so re-target each sidecar's identity at the other
    // store to isolate the schema check.
    const restamp = ( sidecar: Uint8Array, length: number ) => {
      const decoded = deserializeIndexSidecarToColumns( sidecar )
      return serializeIndexSidecarFromColumns(
          decoded.columns, length, decoded.sourceHash, { schema: decoded.schema } )
    }

    expect( await attempt( syncStore( step ), restamp( ifcSidecar, step.length ) ) )
        .toEqual( { id: -1, status: 'INDEX_STALE' } )
    expect( await attempt( new InMemoryStepByteStore( ifc ), restamp( stepSidecar, ifc.length ) ) )
        .toEqual( { id: -1, status: 'INDEX_STALE' } )
  }, 180000 )
} )


describe( 'the AP214 proxy\'s resident-safe readers (conway#757)', () => {

  test( 'getLineResident and visitLineDataInFileOrder read what getLine reads, windowed or not', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const bytes = fixture( 'as1-oc-214.stp' )
    const expected = new Map< number, unknown >()

    for ( const open of [
      () => api.OpenModelStreamed( bytes, DEFER ),
      () => api.OpenModelStream( syncStore( bytes ), DEFER ),
    ] ) {

      const modelID = await open()
      const proxy = api.getPassthrough( modelID ) as unknown as IfcApiProxyAP214
      const lines = api.GetAllLines( modelID )
      const ids: number[] = []

      for ( let where = 0; where < Math.min( lines.size(), 200 ); ++where ) {
        ids.push( lines.get( where ) )
      }

      ids.reverse()

      for ( const id of ids ) {

        const resident = await proxy.getLineResident( id )

        if ( !expected.has( id ) ) {
          expected.set( id, resident )
        }

        expect( resident ).toEqual( expected.get( id ) )
      }

      const visited = new Map< number, unknown >()

      await proxy.visitLineDataInFileOrder( ids, ( id, line ) => visited.set( id, line ) )

      expect( visited.size ).toBe( ids.length )

      for ( const id of ids ) {
        expect( visited.get( id ) ).toEqual( expected.get( id ) )
      }

      // Nothing either reader read is still holding a window view.
      expect( proxy.StepModel.releaseCapturedSourceViews() ).toBe( 0 )

      api.CloseModel( modelID )
    }
  }, 120000 )
} )


describe( 'AP214 over 4 KiB windows with a 2-window cap (conway#757)', () => {

  // The compat opens use the provider's default 4 MiB windows, which hold
  // every fixture whole. This builds the model over windows small enough
  // that every read faults in and evicts, and checks that extraction and
  // properties do not notice.
  const NAMES = [
    'as1-oc-214.stp',
    'nema-23-76mm.step',
    'a-gear-with-3-inch-diameter-and-20-curved-teeth.step',
    'ap214-multibody-part.step',
    'ap214-mapped-item-failure.step',
    'ap242-tessellated-solid.step',
    'ap214-sliced-item-ranges.step',
  ]

  let conwayGeometry: ConwayGeometry

  beforeAll( async () => {
    conwayGeometry = new ConwayGeometry()
    expect( await conwayGeometry.initialize() ).toBe( true )
  }, 120000 )

  /**
   * Extract and read a model, and what its window held at the end.
   *
   * @param model The model.
   * @return {object} The scene's placements, the product tree, the
   * properties, and the peak residency seen between batches.
   */
  function extract( model: AP214StepModel ) {

    const extraction = new AP214GeometryExtraction( conwayGeometry, model )

    extraction.quietRecoverableLogging = true
    extraction.prepareDemandExtraction()

    let peakResident = 0

    while ( extraction.demandUnitCursor < extraction.demandUnitCount ) {
      extraction.extractDemandUnitBatch( 4 )
      model.releaseCapturedSourceViews()
      model.trimSourceResidency()
      peakResident = Math.max( peakResident, model.residentSourceBytes )
    }

    extraction.finishDemandExtraction()

    const placements: string[] = []

    for ( const [ , transform, geometry, , entity, path ] of extraction.scene.walkWithOccurrence() ) {
      placements.push( `${entity?.expressID}|${geometry.localID}|${path.join( '.' )}|` +
        `${transform !== void 0 ? Array.from( transform.getValues() ).join( ',' ) : ''}|` +
        `${geometry.geometry.GetVertexDataSize()}|${geometry.geometry.GetIndexDataSize()}` )
    }

    const tree = new AP214ProductStructureExtraction( model ).extractProductStructure()
    const properties = Array.from(
        new AP214PropertyExtraction( model ).extractProperties().entries() )

    return { placements, tree, properties, peakResident }
  }

  for ( const name of NAMES ) {

    test( `${name}: the same scene, tree and properties as resident, inside the window`, () => {

      jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
      jest.spyOn( console, 'error' ).mockImplementation( () => {} )

      const bytes = fixture( name )
      const index = () => {
        const sink = new ColumnarIndexSink< EntityTypesAP214 >()
        const built = buildIndexStreaming(
            new BufferByteSource( bytes ), AP214StepParser.Instance, 64 * 1024, void 0, sink )
        expect( built.result ).toBe( ParseResult.COMPLETE )
        return sink.finalize()
      }

      const resident = extract( new AP214StepModel( bytes, index() ) )

      const store = syncStore( bytes )
      const provider = new WindowedStepBufferProvider( store, 4096, 2 )
      const windowedModel = new AP214StepModel( void 0, index(), provider )

      windowedModel.trackCapturedSourceViews = true

      const windowed = extract( windowedModel )

      expect( windowed.placements ).toEqual( resident.placements )
      expect( windowed.tree ).toEqual( resident.tree )
      expect( windowed.properties ).toEqual( resident.properties )

      // The reads really were windowed: windows faulted in, and between
      // batches the window held no more than its cap.
      if ( bytes.length > 3 * 4096 ) {
        expect( provider.syncFaultCount ).toBeGreaterThan( 2 )
      }

      expect( windowed.peakResident ).toBeLessThanOrEqual( 2 * 4096 )
    }, 180000 )
  }
} )


describe( 'storeOpenRequirementOf: what a store-backed open needs of its store (conway#757)', () => {

  test( 'IFC takes any store, the AP214 family a synchronous one, anything else none', () => {

    const prefix = ( name: string ) => fixture( name ).subarray( 0, 64 * 1024 )

    expect( storeOpenRequirementOf(
        new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ).subarray( 0, 64 * 1024 ) ) )
        .toBe( 'any' )
    expect( storeOpenRequirementOf( prefix( 'as1-oc-214.stp' ) ) ).toBe( 'synchronous' )
    expect( storeOpenRequirementOf( prefix( 'ap203-mim-header-min.step' ) ) ).toBe( 'synchronous' )
    expect( storeOpenRequirementOf( prefix( 'ap242-tessellated-solid.step' ) ) ).toBe( 'synchronous' )
    expect( storeOpenRequirementOf( new TextEncoder().encode( 'glTF not a part-21 file' ) ) )
        .toBeUndefined()
    expect( storeOpenRequirementOf( new Uint8Array( 0 ) ) ).toBeUndefined()
  } )
} )


describe( 'IFC windowed opens do not track window views (codex review of conway#769)', () => {

  test( 'an IFC drain over many paging batches leaves nothing tracked, with or without readSync', async () => {

    jest.spyOn( console, 'warn' ).mockImplementation( () => {} )

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

    for ( const store of [ syncStore( bytes ), new InMemoryStepByteStore( bytes ) ] ) {

      api = new IfcAPI()
      await api.Init()

      const modelID = await api.OpenModelStream( store, DEFER )

      expect( modelID ).toBeGreaterThanOrEqual( 0 )

      const model = ( api.getPassthrough( modelID ) as unknown as { model: [ IfcStepModelLike ] } ).model[ 0 ]
      let batches = 0

      for ( ;; ) {
        // One product per call: IFC pages each product's closure and drops
        // its views with releaseSourceViews, over and over.
        const { extracted, remaining } = await api.ExtractGeometryBatchAsync( modelID, 1 )

        ++batches

        if ( remaining === 0 && extracted === 0 ) {
          break
        }
      }

      expect( batches ).toBeGreaterThan( 5 )
      expect( model.isSourceExternal ).toBe( true )
      expect( model.trackCapturedSourceViews ).toBe( false )
      expect( model.capturedSourceViewCount ).toBe( 0 )

      api.CloseModel( modelID )
    }
  }, 120000 )

  test( 'a tracked model holds each re-read record once, whatever cleared its view in between', () => {

    const bytes = fixture( 'as1-oc-214.stp' )
    const sink = new ColumnarIndexSink< EntityTypesAP214 >()

    buildIndexStreaming( new BufferByteSource( bytes ), AP214StepParser.Instance,
        64 * 1024, void 0, sink )

    const model = new AP214StepModel( void 0, sink.finalize(),
        new WindowedStepBufferProvider( syncStore( bytes ), 4096, 2 ) )

    model.trackCapturedSourceViews = true

    const localIDs: number[] = []

    for ( const element of model ) {
      element.extractLineArguments()
      localIDs.push( element.localID )
    }

    const once = model.capturedSourceViewCount

    expect( once ).toBeGreaterThan( 0 )

    // IFC's per-closure release, then the same reads again.
    model.releaseSourceViews( localIDs )

    for ( const element of model ) {
      element.extractLineArguments()
    }

    expect( model.capturedSourceViewCount ).toBe( once )
  } )
} )


/** The slice of a StepModelBase the IFC tracking test reads. */
interface IfcStepModelLike {
  isSourceExternal: boolean
  trackCapturedSourceViews: boolean
  capturedSourceViewCount: number
}
