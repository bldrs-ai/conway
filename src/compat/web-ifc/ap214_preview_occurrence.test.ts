/* eslint-disable no-magic-numbers */
// STEP previews at parity with IFC (Share engine-worker.md §11, "STEP
// previews"): a deferred AP214 open puts preview meshes out before it
// returns, each carrying the occurrence path of the placement it draws, and
// the durable geometry is the same with or without them.
import * as fs from 'fs'

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { FlatMesh, IfcAPI } from './ifc_api'
import {
  PREVIEW_FINISH_PARSE,
  PreviewMeshPayload,
  PreviewPrefixGeneration,
  StreamedPreviewChannel,
} from './streamed_preview_channel'
import { formatPreviewLine } from '../../core/progress_log'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// nema-23: multibody parts under occurrences (non-empty paths). Two root
// parts: root-level placements, whose path is the empty array.
const OCCURRENCE_FIXTURE = 'data/nema-23-76mm.step'
const ROOT_LEVEL_FIXTURE = 'data/ap214-two-root-parts.step'

type Placed = {
  expressID: number,
  geometryExpressID: number,
  flatTransformation: number[],
  occurrencePath?: readonly number[],
}

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
  // The parse-end tick is off by default until conway#773; these tests are
  // about what it delivers, so they run with it on.
  PREVIEW_FINISH_PARSE.enabled = true
}, 120000 )

afterAll( () => {
  PREVIEW_FINISH_PARSE.enabled = false
} )

/**
 * Every durable placement of a model, flattened.
 *
 * @param modelID The open model.
 * @return {Placed[]} One row per PlacedGeometry.
 */
function durable( modelID: number ): Placed[] {

  const rows: Placed[] = []

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {
    for ( let where = 0; where < mesh.geometries.size(); ++where ) {
      const placed = mesh.geometries.get( where )

      rows.push( {
        expressID: mesh.expressID,
        geometryExpressID: placed.geometryExpressID,
        flatTransformation: [ ...placed.flatTransformation ],
        occurrencePath: placed.occurrencePath,
      } )
    }
  } )

  return rows
}

/**
 * A placement's identity for matching: owner, geometry, transform to 1e-6,
 * and the occurrence path (`absent` distinct from `[]`).
 *
 * @param row The placement.
 * @return {string} The key.
 */
function key( row: Placed ): string {
  const transform = row.flatTransformation.map( ( value ) => value.toFixed( 6 ) ).join( ',' )
  const path = row.occurrencePath === void 0 ? 'absent' : `[${row.occurrencePath.join( '/' )}]`

  return `${row.expressID}|${row.geometryExpressID}|${transform}|${path}`
}

/**
 * Open deferred with a preview callback; return the payloads seen before
 * the open returned and the model id.
 *
 * @param fixture The STEP file.
 * @return {Promise<{modelID: number, payloads: PreviewMeshPayload[]}>}
 */
async function openWithPreview( fixture: string ):
    Promise<{ modelID: number, payloads: PreviewMeshPayload[] }> {

  const data = new Uint8Array( fs.readFileSync( fixture ) )
  const payloads: PreviewMeshPayload[] = []

  const modelID = await api.OpenModelStreamed( data, {
    ...SETTINGS,
    DEFER_GEOMETRY: true,
    ON_PREVIEW_MESH: ( payload ) => payloads.push( payload ),
  } )

  return { modelID, payloads: payloads.slice() }
}

describe( 'AP214 preview payloads', () => {

  // Each model opened once for the whole describe: a deferred open is never
  // closed here (closing destroys the shared wasm processor and degrades
  // later opens), so every extra open is held by this jest worker for the
  // rest of its run, and the worker goes on to other suites.
  const opened = new Map<string, { modelID: number, payloads: PreviewMeshPayload[] }>()
  let plainID = -1

  beforeAll( async () => {
    for ( const fixture of [ OCCURRENCE_FIXTURE, ROOT_LEVEL_FIXTURE ] ) {
      opened.set( fixture, await openWithPreview( fixture ) )
    }

    plainID = await api.OpenModelStreamed(
        new Uint8Array( fs.readFileSync( OCCURRENCE_FIXTURE ) ),
        { ...SETTINGS, DEFER_GEOMETRY: true } )
  }, 240000 )

  test.each( [ OCCURRENCE_FIXTURE, ROOT_LEVEL_FIXTURE ] )(
      'a deferred open emits previews before it returns, each on a durable placement: %s',
      ( fixture ) => {

        // These fixtures parse in one cooperative slice, so no parse-time
        // tick ever fires: every payload here comes from finishParse's
        // tick over the complete index. Without it the count is zero.
        const { modelID, payloads } = opened.get( fixture )!

        expect( modelID ).toBeGreaterThanOrEqual( 0 )
        expect( payloads.length ).toBeGreaterThan( 0 )

        const placements = new Set( durable( modelID ).map( key ) )

        for ( const payload of payloads ) {
          // Every AP214 payload says where it is in the assembly…
          expect( Array.isArray( payload.occurrencePath ) ).toBe( true )
          // …and that is exactly the path the durable placement it draws
          // carries (same owner, geometry and transform).
          expect( placements.has( key( payload ) ) ).toBe( true )
        }
      }, 240000 )

  test( 'a placement under an occurrence carries its path; a root-level one carries []', () => {

    expect( opened.get( OCCURRENCE_FIXTURE )!.payloads.some(
        ( payload ) => ( payload.occurrencePath?.length ?? 0 ) > 0 ) ).toBe( true )

    expect( opened.get( ROOT_LEVEL_FIXTURE )!.payloads.some(
        ( payload ) => payload.occurrencePath !== void 0 &&
          payload.occurrencePath.length === 0 ) ).toBe( true )
  }, 240000 )

  test( 'the durable geometry is the same with and without previews', () => {

    const { modelID, payloads } = opened.get( OCCURRENCE_FIXTURE )!

    // Non-vacuous: the preview ran and extracted on its own throwaway
    // generation before the durable pump.
    expect( payloads.length ).toBeGreaterThan( 0 )

    const plain = durable( plainID )
    const previewed = durable( modelID )

    expect( previewed.map( key ).sort() ).toEqual( plain.map( key ).sort() )

    // And the served vertices: the throwaway generation shares the wasm
    // module with the durable extraction, so it is the module's state, not
    // just the placement set, that has to come out untouched.
    const vertexBytes = ( id: number, rows: Placed[] ) =>
      [ ...new Set( rows.map( ( row ) => row.geometryExpressID ) ) ].sort().map( ( geometryID ) => {
        const geometry = api.GetGeometry( id, geometryID )
        return Array.from( api.GetVertexArray(
            geometry.GetVertexData(), geometry.GetVertexDataSize() ) ).join( ',' )
      } )

    expect( vertexBytes( modelID, previewed ) ).toEqual( vertexBytes( plainID, plain ) )
  }, 240000 )
} )

describe( 'AP214 previews on a windowed open (conway#757)', () => {

  test( 'a store-backed open emits previews, each on a placement the buffered open makes', async () => {

    // The windowed open's channel builds its prefix models over the store
    // (windowedAP214PrefixModel), faulting windows in synchronously as the
    // durable model does. HOW MANY payloads fit is the tick budget's, a
    // wall-clock matter, so the comparison is membership, not equality: every
    // windowed payload is a placement the buffered open's durable model has.
    const bytes = new Uint8Array( fs.readFileSync( OCCURRENCE_FIXTURE ) )
    const placements = new Set( durable( ( await openWithPreview( OCCURRENCE_FIXTURE ) ).modelID ).map( key ) )
    const payloads: PreviewMeshPayload[] = []

    const modelID = await api.OpenModelStream( new InMemoryStepByteStore( bytes, true ), {
      ...SETTINGS,
      DEFER_GEOMETRY: true,
      ON_PREVIEW_MESH: ( payload ) => payloads.push( payload ),
    } )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( payloads.length ).toBeGreaterThan( 0 )
    for ( const payload of payloads ) {
      expect( placements.has( key( payload ) ) ).toBe( true )
    }
    expect( payloads.every( ( payload ) => Array.isArray( payload.occurrencePath ) ) ).toBe( true )
  }, 240000 )
} )

describe( 'a windowed prefix model holds no window views between units', () => {

  test( 'not after planning, not after estimating a unit, not after disposal', async () => {

    // Codex on #772: estimates read records through the windowed prefix
    // model, and a unit the gate passes over never ran, so nothing released
    // what its estimate captured.
    const { ColumnarIndexSink: Sink } = await import( '../../step/parsing/columnar_index' )
    const { buildIndexStreaming } = await import( '../../step/parsing/streaming_index_builder' )
    const { BufferByteSource } = await import( '../../step/parsing/byte_source' )
    const AP214StepParser = ( await import( '../../AP214E3_2010/ap214_step_parser' ) ).default
    const { ap214PreviewAdapter, windowedAP214PrefixModel } = await import( './streamed_preview_channel' )

    const bytes = new Uint8Array( fs.readFileSync( OCCURRENCE_FIXTURE ) )
    const sink = new Sink<number>()

    buildIndexStreaming( new BufferByteSource( bytes ), AP214StepParser.Instance, 1 << 20, void 0, sink )

    const conwayGeometry = new ConwayGeometry()

    expect( await conwayGeometry.initialize() ).toBe( true )

    const models: { capturedSourceViewCount: number }[] = []
    const channel = new StreamedPreviewChannel(
        new InMemoryStepByteStore( bytes, true ), conwayGeometry, sink,
        ap214PreviewAdapter( ( store, columns ) => {
          const model = windowedAP214PrefixModel( store, columns )
          models.push( model )
          return model
        } ),
        true, () => { /* no payloads */ }, void 0, void 0, 1 )

    // Planning, then estimating every unit, with nothing run in between: a
    // unit that runs releases on its own, which is what hid this (a unit the
    // gate passes over never runs).
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect( ( channel as any ).ensureGeneration_( true ) ).toBe( true )

    const generation = ( channel as any ).generation_.generation as PreviewPrefixGeneration
    /* eslint-enable @typescript-eslint/no-explicit-any */

    expect( models.length ).toBe( 1 )
    expect( models[ 0 ].capturedSourceViewCount ).toBe( 0 )

    let faces = 0

    for ( let ordinal = 0; ordinal < generation.unitCount; ++ordinal ) {
      faces += generation.unitFaceEstimate!( ordinal ) ?? 0
      expect( models[ 0 ].capturedSourceViewCount ).toBe( 0 )
    }

    // Non-vacuous: the estimates did read records through the window.
    expect( faces ).toBeGreaterThan( 0 )

    channel.stop()

    expect( models[ 0 ].capturedSourceViewCount ).toBe( 0 )
  }, 240000 )
} )

describe( 'retry-mode preview channel: cost and the parse-end tick', () => {

  const makeSink = ( records: { count: number } ) => ( {
    get topLevelCount() {
      return records.count
    },
    snapshot: () => ( {} ),
  } as unknown as ColumnarIndexSink<number> )

  const makeGeneration = (
      runs: number[],
      estimates?: ( number | undefined )[] ): PreviewPrefixGeneration => ( {
    scene: { *walk() { /* no instances */ } },
    unitCount: 3,
    linearScalingFactor: 1,
    runUnits: ( from: number ) => {
      runs.push( from )
      return 1
    },
    unitFaceEstimate: estimates !== void 0 ? ( ordinal ) => estimates[ ordinal ] : void 0,
    geometryExpressID: () => void 0,
    recenter: false,
    dispose: () => { /* nothing native */ },
  } )

  let conwayGeometry: ConwayGeometry

  beforeAll( async () => {
    conwayGeometry = new ConwayGeometry()
    expect( await conwayGeometry.initialize() ).toBe( true )
  }, 120000 )

  test( 'a unit estimated over the remaining budget is passed over, not run', () => {

    const runs: number[] = []
    const records = { count: 2048 }

    // 1e9 faces cannot fit any budget; 1 face always does; undefined is a
    // unit the adapter cannot estimate, which runs as before estimates.
    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( records ),
        { retryEmptyUnits: true,
          buildGeneration: () => makeGeneration( runs, [ 1e9, 1, void 0 ] ) },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    channel.finishParse()

    expect( runs ).toEqual( [ 1, 2 ] )
    expect( channel.previewYield.overBudget ).toBe( 1 )
    expect( formatPreviewLine( channel.previewYield ) ).toMatch( /, 1 over budget$/ )

    channel.stop()
  }, 240000 )

  test( 'without estimates every unit runs, and the Preview line is unchanged', () => {

    const runs: number[] = []

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( { count: 2048 } ),
        { retryEmptyUnits: true, buildGeneration: () => makeGeneration( runs ) },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    channel.finishParse()

    expect( runs ).toEqual( [ 0, 1, 2 ] )
    expect( formatPreviewLine( channel.previewYield ) ).toMatch( / retried$/ )

    channel.stop()
  }, 240000 )

  test( 'finishParse builds over the complete index without waiting for growth', () => {

    const builds: number[] = []
    const records = { count: 2048 }
    const runs: number[] = []

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( records ),
        { retryEmptyUnits: true,
          buildGeneration: () => {
            builds.push( records.count )
            return makeGeneration( runs )
          } },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const internals = channel as any

    internals.tickIntervalMs_ = 0
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    /* eslint-enable @typescript-eslint/no-explicit-any */

    channel.maybeTickInline()
    expect( builds ).toEqual( [ 2048 ] )

    // The parse ends having grown 1.5x: under the 2x growth gate, so a tick
    // would not rebuild — the parse-end tick must.
    records.count = 3072
    channel.finishParse()
    expect( builds ).toEqual( [ 2048, 3072 ] )

    // Already complete: a second call reuses it rather than rebuilding.
    channel.finishParse()
    expect( builds ).toEqual( [ 2048, 3072 ] )

    channel.stop()
  }, 240000 )

  test( 'finishParse is skipped once the parse-time ticks have emitted a mesh', () => {

    const builds: number[] = []
    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( { count: 2048 } ),
        { retryEmptyUnits: true,
          buildGeneration: () => {
            builds.push( 1 )
            return makeGeneration( [] )
          } },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    /* eslint-disable @typescript-eslint/no-explicit-any */
    ;( channel as any ).meshesEmitted_ = 1
    /* eslint-enable @typescript-eslint/no-explicit-any */
    channel.finishParse()

    expect( builds ).toEqual( [] )

    channel.stop()
  }, 240000 )

  test( 'finishParse is off by default (conway#773)', () => {

    const builds: number[] = []
    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( { count: 2048 } ),
        { retryEmptyUnits: true,
          buildGeneration: () => {
            builds.push( 1 )
            return makeGeneration( [] )
          } },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    PREVIEW_FINISH_PARSE.enabled = false
    try {
      channel.finishParse()
    } finally {
      PREVIEW_FINISH_PARSE.enabled = true
    }

    expect( builds ).toEqual( [] )

    channel.stop()
  }, 240000 )

  test( 'finishParse is a no-op for a schema whose units grow with the parse (IFC)', () => {

    const builds: number[] = []

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( { count: 2048 } ),
        { buildGeneration: () => {
          builds.push( 1 )
          return makeGeneration( [] )
        } },
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    channel.finishParse()

    expect( builds ).toEqual( [] )

    channel.stop()
  }, 240000 )
} )
