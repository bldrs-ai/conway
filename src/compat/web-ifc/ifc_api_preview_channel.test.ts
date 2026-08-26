/* eslint-disable no-magic-numbers */
// Parse-time preview channel (demand/tiled rendering slice A2): prefix
// snapshots of the live columnar sink must be exact prefixes of the final
// columns, and a full drain of the channel (prefix == whole file) must
// reproduce the classic StreamAllMeshes instance set — same entities,
// same geometry ids, same placed transforms — since the durable pump the
// preview hands over to is already pinned to classic parity.
import * as fs from 'fs'

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import IfcStepParser from '../../ifc/ifc_step_parser'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import Logger from '../../logging/logger'
import { BufferByteSource } from '../../step/parsing/byte_source'
import {
  ColumnarIndexSink,
  StepIndexColumns,
} from '../../step/parsing/columnar_index'
import { ParseResult, StepIndexSink } from '../../step/parsing/step_parser'
import { buildIndexStreaming } from '../../step/parsing/streaming_index_builder'
import { FlatMesh, IfcAPI } from './ifc_api'
import {
  ifcPreviewAdapter,
  PreviewMeshPayload,
  StreamedPreviewChannel,
} from './streamed_preview_channel'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }
const POOL = 1024 * 1024

let api: IfcAPI
let conwayGeometry: ConwayGeometry
let data: Uint8Array

/**
 * Parse an IFC data block into a fresh columnar sink.
 *
 * @param wrap Optional sink wrapper (snapshot triggers).
 * @param bytes The source bytes (defaults to index.ifc).
 * @return {ColumnarIndexSink} The filled sink.
 */
function buildSink(
    wrap?: ( sink: ColumnarIndexSink<EntityTypesIfc> ) =>
      StepIndexSink<EntityTypesIfc>,
    bytes?: Uint8Array ): ColumnarIndexSink<EntityTypesIfc> {

  const sink = new ColumnarIndexSink<EntityTypesIfc>()

  const { result } = buildIndexStreaming(
      new BufferByteSource( bytes ?? data ),
      IfcStepParser.Instance,
      POOL,
      void 0,
      wrap !== void 0 ? wrap( sink ) : sink )

  expect( result ).toBe( ParseResult.COMPLETE )

  return sink
}

/**
 * Classic reference: expressID -> list of placed instances.
 *
 * @param modelID An open classic model.
 * @return {Map} expressID -> {geometryExpressID, flatTransformation}[].
 */
function classicInstances( modelID: number ):
  Map<number, { geometryExpressID: number, flatTransformation: number[] }[]> {

  const instances =
    new Map<number, { geometryExpressID: number, flatTransformation: number[] }[]>()

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {

    const list = instances.get( mesh.expressID ) ?? []

    for ( let where = 0; where < mesh.geometries.size(); ++where ) {

      const placed = mesh.geometries.get( where )

      list.push( {
        geometryExpressID: placed.geometryExpressID,
        flatTransformation: [ ...placed.flatTransformation ],
      } )
    }

    instances.set( mesh.expressID, list )
  } )

  return instances
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  conwayGeometry = new ConwayGeometry()
  expect( await conwayGeometry.initialize() ).toBe( true )

  data = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
}, 120000 )

describe( 'ColumnarIndexSink.snapshot', () => {

  test( 'a mid-parse snapshot is an exact prefix of the final columns', () => {

    const snapshotAt = 50
    let snapshot: StepIndexColumns<EntityTypesIfc> | undefined

    const sink = buildSink( ( inner ) => ( {
      pushTopLevel: ( entry ) => {
        inner.pushTopLevel( entry )

        if ( inner.topLevelCount === snapshotAt ) {
          snapshot = inner.snapshot()
        }
      },
      reset: () => inner.reset(),
    } ) )

    const full = sink.finalize()

    expect( snapshot ).toBeDefined()
    expect( snapshot!.firstInlineElement ).toBe( snapshotAt )
    expect( full.firstInlineElement ).toBeGreaterThan( snapshotAt )

    for ( let where = 0; where < snapshotAt; ++where ) {
      expect( snapshot!.address[ where ] ).toBe( full.address[ where ] )
      expect( snapshot!.length[ where ] ).toBe( full.length[ where ] )
      expect( snapshot!.typeID[ where ] ).toBe( full.typeID[ where ] )
      expect( snapshot!.expressID[ where ] ).toBe( full.expressID[ where ] )
    }
  } )

  test( 'snapshotting does not disturb the sink (finalize sees everything)', () => {

    const undisturbed = buildSink().finalize()

    const snapshotted = buildSink( ( inner ) => ( {
      pushTopLevel: ( entry ) => {
        inner.pushTopLevel( entry )

        // Snapshot aggressively — every 25 records.
        if ( inner.topLevelCount % 25 === 0 ) {
          inner.snapshot()
        }
      },
      reset: () => inner.reset(),
    } ) ).finalize()

    expect( snapshotted.count ).toBe( undisturbed.count )
    expect( snapshotted.firstInlineElement ).toBe( undisturbed.firstInlineElement )
    expect( [ ...snapshotted.address ] ).toEqual( [ ...undisturbed.address ] )
    expect( [ ...snapshotted.expressID ] ).toEqual( [ ...undisturbed.expressID ] )
  } )
} )

/* data/grid_placement_tail_axes.ifc, by construction — see that file's
 * header comment. Exact rather than "greater than": the fixture is
 * synthetic and committed alongside this test, and the counts are what pin
 * that the MISTYPED product did not get retried with the three that should
 * have. */
const GRID_TAIL_GRIDS = 3
const GRID_TAIL_DEFERRING = 4

/* The deferrals a longer prefix can fix: #200 on IfcPolyline.Points, #500
 * on IfcVirtualGridIntersection.IntersectingAxes, and #1000 on the
 * IfcGrid.UAxes read inside gridByAxis. All three are reference arrays.
 * #800 is mistyped and must stay out of this count. */
const GRID_TAIL_RETRYABLE = 3

/* One unit per tick (tickMaxAttempts_ = 1), so a generation of seven needs
 * at least seven; a few spare so the assertions are about the channel. */
const GRID_TAIL_TICKS_TO_EXHAUST = 16


describe( 'StreamedPreviewChannel', () => {

  test( 'a full drain reproduces the classic instance set exactly', async () => {

    const classicID = api.OpenModel( data, SETTINGS )
    const classic = classicInstances( classicID )

    let classicTotal = 0

    for ( const list of classic.values() ) {
      classicTotal += list.length
    }

    expect( classicTotal ).toBeGreaterThan( 0 )

    // Channel over a finished sink: the "prefix" is the whole file, so a
    // drain must be a complete, classic-parity extraction.
    const sink = buildSink()
    const payloads: PreviewMeshPayload[] = []

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, sink, ifcPreviewAdapter(), true,
        ( mesh ) => payloads.push( mesh ), void 0, void 0, 1 )

    channel.drainForTest()

    expect( payloads.length ).toBe( classicTotal )

    // Every payload matches a classic instance of the same entity and
    // geometry, with the same placed transform.
    const unmatched = new Map<number, typeof classic extends
      Map<number, infer ListType> ? ListType : never>()

    for ( const [ expressID, list ] of classic ) {
      unmatched.set( expressID, list.map( ( entry ) => ( { ...entry } ) ) )
    }

    for ( const payload of payloads ) {

      const candidates = unmatched.get( payload.expressID )

      expect( candidates ).toBeDefined()

      const matchIndex = candidates!.findIndex( ( candidate ) =>
        candidate.geometryExpressID === payload.geometryExpressID &&
        candidate.flatTransformation.every( ( value, where ) =>
          Math.abs( value - payload.flatTransformation[ where ] ) < 1e-6 ) )

      expect( matchIndex ).toBeGreaterThanOrEqual( 0 )
      candidates!.splice( matchIndex, 1 )
    }

    // Geometry payloads: exactly one carrier per distinct geometry, each
    // carrying a sane interleaved buffer.
    const carriers = payloads.filter( ( payload ) => payload.vertexData !== void 0 )
    const distinctGeometry = new Set( payloads.map( ( p ) => p.geometryExpressID ) )

    expect( carriers.length ).toBe( distinctGeometry.size )

    for ( const carrier of carriers ) {
      expect( carrier.vertexData!.length % 6 ).toBe( 0 )
      expect( carrier.vertexData!.length ).toBeGreaterThan( 0 )
      expect( carrier.indexData!.length % 3 ).toBe( 0 )
      expect( carrier.indexData!.length ).toBeGreaterThan( 0 )
    }

    // The channel derived and pinned a coordination frame (proved
    // equivalent to classic's by the transform parity above), and the
    // deferred open must keep the classic GetCoordinationMatrix
    // contract: identity, because placed transforms are premultiplied
    // and consumers stamp the result onto assembled models — a
    // non-identity return would coordinate twice.
    expect( channel.coordinationMatrix ).toBeDefined()

    const deferredID = await api.OpenModelStreamed(
        data, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api.StreamAllMeshes( deferredID, () => { /* drain */ } )

    const classicCoordination = api.GetCoordinationMatrix( classicID )
    const deferredCoordination = api.GetCoordinationMatrix( deferredID )

    expect( deferredCoordination ).toEqual( classicCoordination )

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'ON_PREVIEW_MESH on a deferred streamed open never breaks the durable path', async () => {

    const classicID = api.OpenModel( data, SETTINGS )
    const classic = classicInstances( classicID )

    const payloads: PreviewMeshPayload[] = []

    const deferredID = await api.OpenModelStreamed( data, {
      ...SETTINGS,
      DEFER_GEOMETRY: true,
      ON_PREVIEW_MESH: ( mesh ) => payloads.push( mesh ),
    } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    // index.ifc parses inside one cooperative slice, so the timer-driven
    // channel usually never fires — the contract here is that its presence
    // changes nothing about the durable pump's output.
    const drained = new Map<number, number>()

    api.StreamAllMeshes( deferredID, ( mesh ) => {
      drained.set(
          mesh.expressID,
          ( drained.get( mesh.expressID ) ?? 0 ) + mesh.geometries.size() )
    } )

    expect( drained.size ).toBe( classic.size )

    for ( const [ expressID, list ] of classic ) {
      expect( drained.get( expressID ) ).toBe( list.length )
    }

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'a throwing prefix build retires the attempt, not the channel', () => {

    // Mid-parse prefixes can be structurally incomplete and the adapter's
    // generation build can THROW (AP214's assembly-tree prep does on
    // dangling references — this killed the whole STEP preview). The
    // channel must swallow the attempt and succeed on a later, larger
    // prefix. The sink is complete here, so growth is simulated by
    // inflating the reported record count past the retry gate.
    const sink = buildSink()
    const realRecords = sink.topLevelCount

    let reportedRecords = realRecords
    const growingSink = {
      get topLevelCount() {
        return reportedRecords
      },
      snapshot: () => sink.snapshot(),
    } as unknown as ColumnarIndexSink<number>

    let buildAttempts = 0
    const inner = ifcPreviewAdapter()
    const flakyAdapter = {
      buildGeneration: (
          source: Uint8Array,
          wasm: ConwayGeometry,
          columns: StepIndexColumns<number> ) => {
        if ( buildAttempts++ === 0 ) {
          throw new Error( 'structurally incomplete prefix' )
        }
        return inner.buildGeneration( source, wasm, columns )
      },
    }

    const payloads: PreviewMeshPayload[] = []

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, growingSink, flakyAdapter, true,
        ( mesh ) => payloads.push( mesh ), void 0, void 0, 1 )

    // First drain: the build throws — no payloads, but the channel
    // survives the attempt.
    channel.drainForTest()

    expect( buildAttempts ).toBe( 1 )
    expect( payloads.length ).toBe( 0 )

    // Same record count: the failure gate must hold the retry.
    channel.drainForTest()
    expect( buildAttempts ).toBe( 1 )

    // The index "grows" past the gate: the retry builds and drains fully.
    reportedRecords = realRecords * 4
    channel.drainForTest()

    expect( buildAttempts ).toBe( 2 )
    expect( payloads.length ).toBeGreaterThan( 0 )
  }, 240000 )

  test( 'retryEmptyUnits re-runs empty units on later generations', () => {

    // AP214-style schema: the unit list is fixed up front but the
    // geometry units reference arrives later in the file. The channel
    // must re-run units that captured nothing against each richer
    // generation, and stop retrying a unit once it captures.
    const UNIT_COUNT = 3
    const runsPerGeneration: number[][] = []

    let reportedRecords = 2048
    const fakeSink = {
      get topLevelCount() {
        return reportedRecords
      },
      snapshot: () => ( {} ),
    } as unknown as ColumnarIndexSink<number>

    const disposed: number[] = []

    const makeGeneration = ( generationIndex: number ) => {
      const runs: number[] = []
      runsPerGeneration.push( runs )
      return {
        // Empty scene: units "execute" but never capture, so no unit
        // ever completes and every generation re-runs all of them.
        scene: { *walk() { /* no instances */ } },
        unitCount: UNIT_COUNT,
        linearScalingFactor: 1,
        runUnits: ( from: number ) => {
          runs.push( from )
          return 1
        },
        geometryExpressID: () => void 0,
        recenter: false,
        dispose: () => disposed.push( generationIndex ),
      }
    }

    let generationIndex = 0
    const adapter = {
      retryEmptyUnits: true,
      buildGeneration: () => makeGeneration( generationIndex++ ),
    }

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, fakeSink, adapter, false,
        () => { /* no payloads expected */ }, void 0, void 0, 1 )

    const forceTick = () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      ( channel as any ).lastInlineTick_ = 0;
      ( channel as any ).tickIntervalMs_ = 0;
      // Lift the per-tick wall-clock budget too. The assertions below count
      // exactly which units ran in a tick, and against the real 25ms budget
      // that is a coin flip on a loaded runner — this expected [0,1,2] and
      // got [0,1] in CI while passing locally.
      ( channel as any ).tickBudgetMs_ = Number.MAX_SAFE_INTEGER
      /* eslint-enable @typescript-eslint/no-explicit-any */
      channel.maybeTickInline()
    }

    // Generation 1: all units run once (none capture).
    forceTick()
    expect( runsPerGeneration[ 0 ] ).toEqual( [ 0, 1, 2 ] )

    // Same record count: growth-gated, no rebuild, no re-runs.
    forceTick()
    expect( runsPerGeneration.length ).toBe( 1 )
    expect( runsPerGeneration[ 0 ] ).toEqual( [ 0, 1, 2 ] )

    // Records double: a fresh generation re-runs every empty unit and
    // the outgoing generation is disposed.
    reportedRecords *= 4
    forceTick()
    expect( runsPerGeneration.length ).toBe( 2 )
    expect( runsPerGeneration[ 1 ] ).toEqual( [ 0, 1, 2 ] )
    expect( disposed ).toContain( 0 )

    channel.stop()
  }, 240000 )

  test( 'a product whose placement is beyond the prefix defers instead of extracting unplaced', () => {

    // Revit writes placements near the end of the file, so a mid-parse
    // prefix can hold a product and its geometry while the product's
    // IFCLOCALPLACEMENT is still unparsed. Lenient reads null that
    // dangling reference — indistinguishable from "no placement" — and
    // the product extracted at the origin: on a georeferenced model the
    // preview payloads then sat a whole site-offset from the model
    // (Share#1744, Snowdon door #5014, 88 payloads ~425km out).
    //
    // Model the file shape directly: move one product's placement
    // record to the end of the data section (record order carries no
    // meaning in STEP) and snapshot the prefix just before it.
    const DEFERRED_PRODUCT = 396
    const PLACEMENT_RECORD = '#334='

    const text = new TextDecoder().decode( data )
    const lines = text.split( '\n' )

    const placementIndex =
      lines.findIndex( ( line ) => line.startsWith( PLACEMENT_RECORD ) )
    expect( placementIndex ).toBeGreaterThanOrEqual( 0 )

    const [ placementLine ] = lines.splice( placementIndex, 1 )

    let endsecIndex = -1
    for ( let where = lines.length - 1; where >= 0; --where ) {
      if ( lines[ where ].startsWith( 'ENDSEC' ) ) {
        endsecIndex = where
        break
      }
    }
    expect( endsecIndex ).toBeGreaterThanOrEqual( 0 )

    lines.splice( endsecIndex, 0, placementLine )
    const reordered = new TextEncoder().encode( lines.join( '\n' ) )

    const totalRecords = buildSink( void 0, reordered ).topLevelCount

    // The moved placement is the final record: a prefix of every record
    // but the last holds the product + geometry, not the placement.
    let prefix: StepIndexColumns<EntityTypesIfc> | undefined
    const fullColumns = buildSink( ( inner ) => ( {
      pushTopLevel: ( entry ) => {
        inner.pushTopLevel( entry )
        if ( inner.topLevelCount === totalRecords - 1 ) {
          prefix = inner.snapshot()
        }
      },
      reset: () => inner.reset(),
    } ), reordered ).finalize()

    expect( prefix ).toBeDefined()

    // Entity expressID -> parent native transforms of its walked
    // instances, for one generation over the given columns.
    const placedInstances = (
        bytes: Uint8Array,
        columns: StepIndexColumns<EntityTypesIfc> ): Map<number, number[][]> => {

      const generation =
        ifcPreviewAdapter().buildGeneration( bytes, conwayGeometry, columns )
      expect( generation ).toBeDefined()

      generation!.runUnits( 0, generation!.unitCount )

      const instances = new Map<number, number[][]>()

      for ( const walked of generation!.scene.walk() ) {

        const [ , nativeTransform, , , entity ] = walked as [
          unknown,
          { getValues(): Float64Array | number[] } | undefined,
          unknown,
          unknown,
          { expressID?: number } | undefined,
        ]

        if ( entity?.expressID === void 0 ) {
          continue
        }

        const list = instances.get( entity.expressID ) ?? []
        list.push( nativeTransform !== void 0 ? [ ...nativeTransform.getValues() ] : [] )
        instances.set( entity.expressID, list )
      }

      generation!.dispose()
      return instances
    }

    const prefixInstances = placedInstances( reordered, prefix! )

    // Other products still preview from the prefix...
    expect( prefixInstances.size ).toBeGreaterThan( 0 )

    // ...but the dangling-placement product emitted NOTHING. Before the
    // fix it extracted with an identity parent — these are exactly the
    // mis-placed payloads Share#1744 chased.
    expect( prefixInstances.has( DEFERRED_PRODUCT ) ).toBe( false )

    // A full-file prefix extracts it, placed identically to the
    // original record order — deferral changes WHEN the product
    // extracts, never WHERE.
    const fullInstances = placedInstances( reordered, fullColumns )
    const reorderedTransforms = fullInstances.get( DEFERRED_PRODUCT )

    expect( reorderedTransforms ).toBeDefined()
    expect( reorderedTransforms!.length ).toBeGreaterThan( 0 )
    expect( reorderedTransforms![ 0 ].length ).toBe( 16 )

    const originalInstances = placedInstances( data, buildSink().finalize() )
    const originalTransforms = originalInstances.get( DEFERRED_PRODUCT )

    expect( originalTransforms ).toBeDefined()
    expect( reorderedTransforms!.length ).toBe( originalTransforms!.length )

    for ( let where = 0; where < originalTransforms!.length; ++where ) {
      for ( let component = 0; component < 16; ++component ) {
        expect( reorderedTransforms![ where ][ component ] )
            .toBeCloseTo( originalTransforms![ where ][ component ], 10 )
      }
    }
  }, 240000 )

  test( 'a tail-placement file recovers its deferred products', () => {

    // The resident twin of the store channel's test for conway#542.
    // data/index_tail_placements.ifc is index_georeferenced_multicell.ifc
    // with every leaf point/direction record moved to the end of DATA —
    // same ids, same text, hostile order. It is the Archicad shape at
    // fixture scale: its products reference a placement chain that bottoms
    // out after them, so an index stopping short of the tail cannot place
    // any of them. The multicell fixture rather than index.ifc because it
    // carries enough products that one attempt cannot exhaust the
    // generation — which is what leaves the preemption path, not the
    // exhaustion path, as the only way to rebuild.
    const tailText = fs.readFileSync( 'data/index_tail_placements.ifc', 'utf8' )
    const lines = tailText.split( '\n' )
    const firstLeaf = lines.findIndex(
        ( line ) => /=\s*IFC(CARTESIANPOINT|DIRECTION)/.test( line ) )

    expect( firstLeaf ).toBeGreaterThan( 0 )

    // A genuine prefix, closed off so it parses: every record up to the
    // leaf block, and nothing after it. The full file is stage two.
    const prefixText =
      `${lines.slice( 0, firstLeaf ).join( '\n' )}\nENDSEC;\nEND-ISO-10303-21;\n`
    const prefixBytes = new Uint8Array( Buffer.from( prefixText, 'latin1' ) )
    const tailBytes = new Uint8Array( Buffer.from( tailText, 'latin1' ) )

    const sink = new ColumnarIndexSink<EntityTypesIfc>()
    const payloads: PreviewMeshPayload[] = []

    // The source buffer is the WHOLE file throughout, as it is on a
    // resident open — only the index grows.
    const channel = new StreamedPreviewChannel(
        tailBytes, conwayGeometry, sink, ifcPreviewAdapter(), true,
        ( mesh ) => payloads.push( mesh ), void 0, void 0, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // One unit per tick, so stage one leaves units UNATTEMPTED. That is
    // what forces the preemption path: with units still pending, a channel
    // that only rebuilds on exhaustion keeps its starved generation and
    // never looks at the deferrals again.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1

    // Stage one: index only the prefix, then let the channel work it.
    expect( buildIndexStreaming(
        new BufferByteSource( prefixBytes ),
        IfcStepParser.Instance,
        POOL,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    internals.lastInlineTick_ = 0
    channel.maybeTickInline()

    const afterPrefix = channel.previewYield

    // The fixture has to actually exercise the path, or the rest proves
    // nothing about it — and units must be left over, or the rebuild would
    // happen by exhaustion and prove nothing about preemption.
    expect( afterPrefix.deferredOnPlacement ).toBeGreaterThan( 0 )
    expect( afterPrefix.emitted ).toBe( 0 )
    expect( afterPrefix.firstMeshMs ).toBeUndefined()
    expect( internals.unitOrdinal_ )
        .toBeLessThan( internals.generation_.generation.unitCount )

    // Stage two: the same reset-and-replay the streaming builder performs
    // when it grows its window, so top-level localIDs stay in dense parse
    // order and the deferred ORDINALS the channel is holding still mean
    // what they meant (see ColumnarIndexSink.reset).
    sink.reset()

    expect( buildIndexStreaming(
        new BufferByteSource( tailBytes ),
        IfcStepParser.Instance,
        POOL,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    // Exactly one attempt in this tick. That is what makes this an
    // assertion about PREEMPTION: with units still pending, a channel that
    // rebuilds only on exhaustion spends the attempt on the next fresh unit
    // against the old starved generation, and the retry never happens.
    internals.lastInlineTick_ = 0
    channel.maybeTickInline()

    const afterFull = channel.previewYield

    // Both halves of the fix, and `retried` is what separates them from a
    // channel that merely got lucky on a later unit. Without the retry
    // queue a deferred unit is attempted once, at the most index-starved
    // generation it appears in, and abandoned. Without preemptive rebuilds
    // the generation is kept while units remain, so the deferrals are never
    // revisited against the longer index. Either one missing holds this at
    // zero.
    expect( afterFull.retried ).toBeGreaterThan( 0 )
    expect( afterFull.emitted ).toBeGreaterThan( 0 )

    // And the recovered products become pixels: one attempt per tick is
    // what makes the assertions above about preemption, but a single unit
    // need not be one that carries geometry (a site or a storey extracts
    // and walks no buffer geometry), so let the channel run out the
    // recovered queue before reading time-to-first-pixel.
    internals.tickMaxAttempts_ = Number.MAX_SAFE_INTEGER
    internals.lastInlineTick_ = 0
    channel.maybeTickInline()

    expect( payloads.length ).toBeGreaterThan( 0 )
    expect( channel.previewYield.firstMeshMs ).toBeGreaterThanOrEqual( 0 )

    channel.stop()
  }, 240000 )


  test( 'a grid-placed product blocked on a reference array is retried', () => {

    // The resident twin of the store channel's conway#546 test — the two
    // channels carry independent copies of the deferral catch
    // (streamed_preview_channel.ts:322 against store_preview_channel.ts:498),
    // so a classification fix has to be demonstrated on both or half of it
    // is untested.
    //
    // data/grid_placement_tail_axes.ifc writes the reference-array hops of
    // a grid placement chain after the products that need them:
    // IfcPolyline.Points (#200), IfcVirtualGridIntersection.IntersectingAxes
    // (#500), and IfcGrid.UAxes as read by gridByAxis's inverse scan
    // (#1000). Product #800 is the counterweight — its intersection names
    // an IFCDIRECTION where an IFCGRIDAXIS belongs, which no amount of
    // extra parse can fix.
    const text =
      fs.readFileSync( 'data/grid_placement_tail_axes.ifc', 'utf8' )
    const lines = text.split( '\n' )
    const tailAt = lines.findIndex( ( line ) => line.startsWith( '/* ---- TAIL' ) )

    expect( tailAt ).toBeGreaterThan( 0 )

    const prefixText =
      `${lines.slice( 0, tailAt ).join( '\n' )}\nENDSEC;\nEND-ISO-10303-21;\n`
    const prefixBytes = new Uint8Array( Buffer.from( prefixText, 'latin1' ) )
    const fullBytes = new Uint8Array( Buffer.from( text, 'latin1' ) )

    const sink = new ColumnarIndexSink<EntityTypesIfc>()
    const payloads: PreviewMeshPayload[] = []

    // The source buffer is the WHOLE file throughout, as it is on a
    // resident open — only the index grows.
    const channel = new StreamedPreviewChannel(
        fullBytes, conwayGeometry, sink, ifcPreviewAdapter(), true,
        ( mesh ) => payloads.push( mesh ), void 0, void 0, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1

    expect( buildIndexStreaming(
        new BufferByteSource( prefixBytes ),
        IfcStepParser.Instance,
        POOL,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    for ( let tick = 0; tick < GRID_TAIL_TICKS_TO_EXHAUST; ++tick ) {
      internals.lastInlineTick_ = 0
      channel.maybeTickInline()
    }

    const afterPrefix = channel.previewYield

    expect( afterPrefix.emitted ).toBe( GRID_TAIL_GRIDS )
    expect( afterPrefix.deferred ).toBe( GRID_TAIL_DEFERRING )

    // THE assertion, and it reads 0 without the fix: all three array hops
    // are records that had simply not been scanned yet, and the fourth
    // deferral — the mistyped one — must stay out of the retry queue.
    expect( afterPrefix.deferredOnPlacement ).toBe( GRID_TAIL_RETRYABLE )
    expect( afterPrefix.retried ).toBe( 0 )
    expect( payloads ).toHaveLength( 0 )

    sink.reset()

    expect( buildIndexStreaming(
        new BufferByteSource( fullBytes ),
        IfcStepParser.Instance,
        POOL,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    for ( let tick = 0; tick < GRID_TAIL_TICKS_TO_EXHAUST; ++tick ) {
      internals.lastInlineTick_ = 0
      channel.maybeTickInline()
    }

    const afterFull = channel.previewYield

    expect( afterFull.retried ).toBe( GRID_TAIL_RETRYABLE )
    expect( afterFull.emitted ).toBe( GRID_TAIL_GRIDS + GRID_TAIL_RETRYABLE )
    expect( payloads ).toHaveLength( GRID_TAIL_RETRYABLE )
    expect( payloads.every( ( p ) => p.vertexData !== void 0 ) ).toBe( true )

    // And the mistyped product never joined them.
    expect( afterFull.deferredOnPlacement ).toBe( GRID_TAIL_RETRYABLE )
    expect( afterFull.deferred ).toBe( GRID_TAIL_DEFERRING )

    channel.stop()
  }, 240000 )

  test( 'a generation is preempted only when it is deferring', () => {

    // The counterweight. Rebuilding on index growth alone regressed the
    // case that already worked: PSB, which defers nothing, went from a
    // first mesh at 269ms to 495ms on the store path because it kept paying
    // for rebuilds it had no use for. index.ifc is that shape at fixture
    // scale, so the same two-stage growth must leave its generation alone.
    const sink = new ColumnarIndexSink<EntityTypesIfc>()

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, sink, ifcPreviewAdapter(), true,
        () => { /* nothing asserted about payloads */ }, void 0, void 0, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // One unit per tick, so the generation is nowhere near exhausted when
    // the index grows — otherwise the exhaustion path would rebuild and
    // this would assert nothing about preemption.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1

    expect( buildIndexStreaming(
        new BufferByteSource( data ),
        IfcStepParser.Instance,
        POOL,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    internals.lastInlineTick_ = 0
    channel.maybeTickInline()

    const snapshotRecords = internals.lastSnapshotRecords_ as number

    expect( snapshotRecords ).toBeGreaterThan( 0 )
    expect( channel.previewYield.deferredOnPlacement ).toBe( 0 )

    // Index growth well past GENERATION_GROWTH_FACTOR, with units still
    // pending and nothing deferring: the generation must be kept.
    sink.reset()

    for ( let repeat = 0; repeat < 3; ++repeat ) {
      expect( buildIndexStreaming(
          new BufferByteSource( data ),
          IfcStepParser.Instance,
          POOL,
          void 0,
          sink ).result ).toBe( ParseResult.COMPLETE )
    }

    expect( sink.topLevelCount ).toBeGreaterThan( snapshotRecords * 2 )

    internals.lastInlineTick_ = 0
    channel.maybeTickInline()

    expect( internals.lastSnapshotRecords_ ).toBe( snapshotRecords )
    expect( channel.previewYield.retried ).toBe( 0 )

    channel.stop()
  }, 240000 )

  test( 'retry mode preempts a generation whose units captured nothing', () => {

    // AP214's half of conway#542. `retryEmptyUnits` already re-runs empty
    // units, so that schema never abandoned a deferral — but it kept a
    // stale generation for the same reason the IFC path did: the growth
    // gate sat behind "this generation still has units", and a scan that
    // never finishes never reaches it. An empty unit is this schema's
    // deferral signal (the adapter cannot classify a failure — an assembly
    // unit simply produces no instances until the solids it references are
    // indexed), so index growth must preempt mid-scan.
    const UNIT_COUNT = 3
    const runsPerGeneration: number[][] = []

    let reportedRecords = 2048
    const fakeSink = {
      get topLevelCount() {
        return reportedRecords
      },
      snapshot: () => ( {} ),
    } as unknown as ColumnarIndexSink<EntityTypesIfc>

    const makeGeneration = () => {
      const runs: number[] = []
      runsPerGeneration.push( runs )
      return {
        // Empty scene: units "execute" but never capture, so no unit ever
        // completes and every generation re-runs all of them.
        scene: { *walk() { /* no instances */ } },
        unitCount: UNIT_COUNT,
        linearScalingFactor: 1,
        runUnits: ( from: number ) => {
          runs.push( from )
          return 1
        },
        geometryExpressID: () => void 0,
        recenter: false,
        dispose: () => { /* nothing native here */ },
      }
    }

    const adapter = {
      retryEmptyUnits: true,
      buildGeneration: () => makeGeneration(),
    }

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, fakeSink, adapter, false,
        () => { /* no payloads expected */ }, void 0, void 0, 1 )

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const internals = channel as any

    // One unit per tick, so the scan is deliberately left unfinished.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const forceTick = () => {
      internals.lastInlineTick_ = 0
      internals.tickIntervalMs_ = 0
      channel.maybeTickInline()
    }

    // Generation 1 runs one unit, which captures nothing.
    forceTick()
    expect( runsPerGeneration.length ).toBe( 1 )
    expect( runsPerGeneration[ 0 ] ).toEqual( [ 0 ] )

    // The index grows past the gate with the scan still mid-list. Without
    // preemption the channel keeps generation 1 and runs its unit 1; with
    // it, a fresh generation restarts the scan against the longer index.
    reportedRecords *= 4
    forceTick()

    expect( runsPerGeneration.length ).toBe( 2 )
    expect( runsPerGeneration[ 1 ] ).toEqual( [ 0 ] )

    channel.stop()
  }, 240000 )

  test( 'preemption preserves the unconsumed suffix of the retry queue', () => {

    // Codex round 1 on #543: preemption replaced retryQueue_ outright with
    // this generation's fresh deferredForRetry_, discarding whatever the
    // OLD queue's tail had not yet been popped. A retry queue can easily
    // span more than one tick's attempt budget (bounded per tick, unbounded
    // in total), so index growth can preempt a generation mid-drain of it
    // — and every un-popped entry is a unit whose unitOrdinal_ has already
    // passed, so replacing rather than concatenating strands it exactly
    // the way abandoned deferrals were stranded before this queue existed
    // (conway#542).
    //
    // The bug is purely mechanical (which array wins the assignment), so
    // this seeds the private queue state directly and forces the growth
    // gate via lastSnapshotRecords_ rather than engineering a real
    // multi-tick deferral sequence.
    const fakeGeneration = () => ( {
      scene: { *walk() { /* no instances */ } },
      unitCount: 1,
      linearScalingFactor: 1,
      runUnits: () => 0,
      geometryExpressID: () => void 0,
      recenter: false,
      dispose: () => { /* nothing native here */ },
    } )

    const fakeSink = {
      get topLevelCount() {
        return 2048
      },
      snapshot: () => ( {} ),
    } as unknown as ColumnarIndexSink<EntityTypesIfc>

    const adapter = { buildGeneration: () => fakeGeneration() }

    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, fakeSink, adapter, false,
        () => { /* no payloads expected */ }, void 0, void 0, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // Generation 1: a real, successful build (active must be defined for
    // the preemption branch to even be reachable).
    expect( internals.ensureGeneration_() ).toBe( true )

    // A retry queue spanning more than one tick's budget: 6 queued
    // retries, only the first 3 consumed (retryCursor_ short of
    // retryQueue_.length is exactly "mid-drain") before the index grew
    // again. deferredForRetry_ is this generation's OWN fresh deferral —
    // the only thing the buggy version kept.
    internals.retryQueue_ = [ 10, 11, 12, 13, 14, 15 ]
    internals.retryCursor_ = 3
    internals.deferredForRetry_ = [ 99 ]

    // Force the growth gate trivially open on the next check, without
    // needing the sink to actually grow: the gate is a ratio against
    // lastSnapshotRecords_, not an absolute count.
    internals.lastSnapshotRecords_ = 1

    // Preemption fires: active is defined, growthReady (2048 >= 1 * factor),
    // and hasDeferred_() is true (deferredForRetry_.length > 0).
    expect( internals.ensureGeneration_() ).toBe( true )

    // The unconsumed suffix of the old queue (indices 3..5) must survive,
    // carried ahead of this generation's own fresh deferral — not replaced
    // by it.
    expect( internals.retryQueue_ ).toEqual( [ 13, 14, 15, 99 ] )
    expect( internals.retryCursor_ ).toBe( 0 )

    channel.stop()
  }, 240000 )

  test( 'reports a preview line even when nothing was ever attempted', () => {

    // Codex round 1 on #543: stop() suppressed the Preview line unless
    // emittedUnits_ or deferredUnits_ was nonzero. A channel that never
    // reached firstGenerationMinRecords -- or whose every generation build
    // threw -- leaves both at zero, and that is exactly the worst-case
    // blank-first-load conway#542 exists to make diagnosable: an enabled
    // preview that produced nothing must not read the same as a preview
    // that never ran. formatPreviewLine already renders the zero case as
    // "no mesh, 0 meshes from 0 units, 0 deferred".
    const fakeSink = {
      get topLevelCount() {
        return 0
      },
      snapshot: () => ( {} ),
    } as unknown as ColumnarIndexSink<EntityTypesIfc>

    const infoSpy = jest.spyOn( Logger, 'info' ).mockImplementation( () => { /* silence */ } )

    // Default firstGenerationMinRecords (1024): with topLevelCount pinned
    // at 0, ensureGeneration_ never builds a generation, so the channel
    // reaches stop() having attempted nothing at all.
    const channel = new StreamedPreviewChannel(
        data, conwayGeometry, fakeSink,
        { buildGeneration: () => { throw new Error( 'must not be called' ) } },
        false, () => { /* no payloads possible */ } )

    channel.stop()

    expect( infoSpy ).toHaveBeenCalledWith(
        expect.stringContaining( 'Preview: no mesh, 0 meshes from 0 units, 0 deferred' ) )

    infoSpy.mockRestore()
  } )
} )
