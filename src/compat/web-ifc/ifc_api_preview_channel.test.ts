/* eslint-disable no-magic-numbers */
// Parse-time preview channel (demand/tiled rendering slice A2): prefix
// snapshots of the live columnar sink must be exact prefixes of the final
// columns, and a full drain of the channel (prefix == whole file) must
// reproduce the classic StreamAllMeshes instance set — same entities,
// same geometry ids, same placed transforms — since the durable pump the
// preview hands over to is already pinned to classic parity.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import IfcStepParser from '../../ifc/ifc_step_parser'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
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
} )
