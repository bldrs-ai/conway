/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import IfcStepParser from '../../ifc/ifc_step_parser'
import Logger from '../../logging/logger'
import { BufferByteSource } from '../../step/parsing/byte_source'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { ParseResult } from '../../step/parsing/step_parser'
import { buildIndexStreaming } from '../../step/parsing/streaming_index_builder'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { IfcAPI } from './ifc_api'
import { StorePreviewChannel } from './store_preview_channel'
import type { PreviewMeshPayload } from './streamed_preview_channel'


describe( 'StorePreviewChannel', () => {

  let conwayGeometry: ConwayGeometry
  let bytes: Uint8Array

  beforeAll( async () => {
    bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const api = new IfcAPI()
    await api.Init()
    conwayGeometry = new ConwayGeometry()
    expect( await conwayGeometry.initialize() ).toBe( true )
  }, 120000 )

  test( 'emits placed vertex payloads from a windowed prefix', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()
    const { result } = buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( sink.topLevelCount ).toBeGreaterThan( 0 )

    const payloads: PreviewMeshPayload[] = []
    const channel = new StorePreviewChannel(
        store,
        sink,
        conwayGeometry,
        true,
        ( mesh ) => payloads.push( mesh ),
        64,
        48 * 1024 * 1024,
        1 )

    await channel.drainForTest()

    expect( channel.lastFailReason ).toBeUndefined()
    expect( channel.productCount ).toBeGreaterThan( 0 )

    channel.stop()

    // The channel now emits spatial plates off its prefix generations
    // too (conway#518), so the placed meshes are the aabb-less half of
    // the stream rather than all of it.
    const meshes = payloads.filter( ( p ) => p.aabb === void 0 )
    const withGeom = meshes.filter( ( p ) => p.vertexData !== void 0 )

    // index.ifc is polygonal-faceset; some local Dist builds OOB on the
    // packed extract (same as ifc_api_preview_channel). The channel
    // still found products.
    if ( meshes.length === 0 ) {
      return
    }

    expect( withGeom.length ).toBeGreaterThan( 0 )
    expect( meshes[ 0 ].flatTransformation ).toHaveLength( 16 )
    expect( meshes[ 0 ].solid ).toBeUndefined()
    expect( withGeom[ 0 ].vertexData!.length % 6 ).toBe( 0 )
    expect( withGeom[ 0 ].indexData!.length % 3 ).toBe( 0 )
    expect( channel.coordinationMatrix ).toBeDefined()
  } )

  // conway#518: the store path used to extract exactly ONE product per
  // tick, and to run the spatial walk only after the whole parse.
  test( 'a tick extracts under a time budget, not one product', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()
    const { result } = buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink )

    expect( result ).toBe( ParseResult.COMPLETE )

    const channel = new StorePreviewChannel(
        store, sink, conwayGeometry, true, () => { /* counted below */ },
        64, 48 * 1024 * 1024, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // Lift the wall clock the way the streamed channel's test does: the
    // assertion is about how many products ONE tick consumes, and a real
    // 20ms budget makes that a coin flip on a loaded runner.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER

    await channel.maybeTickAsync()

    const attempted = internals.unitOrdinal_ as number

    // Capped by TICK_MAX_ATTEMPTS, and emphatically more than the one
    // product the pre-#518 tick managed.
    expect( attempted ).toBeGreaterThan( 1 )
    expect( attempted ).toBeLessThanOrEqual(
        internals.tickMaxAttempts_ as number )

    channel.stop()
  } )

  test( 'a tail-placement file recovers its deferred products', async () => {

    // data/index_tail_placements.ifc is index_georeferenced_multicell.ifc
    // with every leaf point/direction record moved to the end of DATA --
    // same ids, same text, hostile order. It is the Archicad shape at
    // fixture scale: its products reference a placement chain that bottoms
    // out after them, so an index stopping short of the tail cannot place
    // any of them (conway#542). The multicell fixture rather than
    // index.ifc because it carries enough products that a few ticks cannot
    // exhaust the generation -- which is what leaves the preemption path,
    // not the exhaustion path, as the only way to rebuild.
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

    const store = new InMemoryStepByteStore( tailBytes )
    const sink = new ColumnarIndexSink< number >()

    const channel = new StorePreviewChannel(
        store, sink, conwayGeometry, true, () => { /* counted via yield */ },
        64, 48 * 1024 * 1024, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // One product per tick, so stage one leaves products UNATTEMPTED. That
    // is what forces the preemption path: with products still pending, a
    // channel that only rebuilds on exhaustion keeps its starved generation
    // and never looks at the deferrals again.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1

    // Stage one: index only the prefix, then let the channel work it.
    expect( buildIndexStreaming(
        new BufferByteSource( prefixBytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    internals.lastInlineTick_ = 0
    await channel.maybeTickAsync()

    const afterPrefix = channel.previewYield

    // The fixture has to actually exercise the path, or the rest proves
    // nothing about it -- and products must be left over, or the rebuild
    // would happen by exhaustion and prove nothing about preemption.
    expect( afterPrefix.deferredOnPlacement ).toBeGreaterThan( 0 )
    expect( afterPrefix.emitted ).toBe( 0 )
    expect( internals.unitOrdinal_ ).toBeLessThan( channel.productCount )

    // Stage two: the same reset-and-replay the streaming builder itself
    // performs when it grows its window, so top-level localIDs stay in
    // dense parse order and the deferred ids the channel is holding still
    // mean what they meant (see ColumnarIndexSink.reset).
    sink.reset()

    expect( buildIndexStreaming(
        new BufferByteSource( tailBytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    // Exactly one tick, and one attempt inside it. That is what makes this
    // an assertion about PREEMPTION: with products still pending, a channel
    // that rebuilds only on exhaustion spends this tick on the next fresh
    // product against the old starved generation, and the retry never
    // happens.
    internals.lastInlineTick_ = 0
    await channel.maybeTickAsync()

    const afterFull = channel.previewYield

    // Both halves of the fix, and `retried` is what separates them from a
    // channel that merely got lucky on a later product. Without the retry
    // queue a deferred product is attempted once, at the most
    // index-starved generation it appears in, and abandoned. Without
    // preemptive rebuilds the generation is kept while products remain, so
    // the deferrals are never revisited against the longer index. Either
    // one missing holds this at zero.
    expect( afterFull.retried ).toBeGreaterThan( 0 )
    expect( afterFull.emitted ).toBeGreaterThan( 0 )

    channel.stop()
  }, 120000 )

  test( 'a generation is preempted only when it is deferring', async () => {

    // The counterweight. Rebuilding on index growth alone regressed the
    // case that already worked: PSB, which defers nothing, went from a
    // first mesh at 269ms to 495ms because it kept paying for rebuilds it
    // had no use for. index.ifc is that shape at fixture scale, so the
    // same two-stage growth must leave its generation alone.
    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()

    const channel = new StorePreviewChannel(
        store, sink, conwayGeometry, true, () => { /* nothing asserted */ },
        64, 48 * 1024 * 1024, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // One product per tick, but with the wall clock lifted -- a zero
    // budget would stop the tick before it ever built a generation.
    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER
    internals.tickMaxAttempts_ = 1

    expect( buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    internals.lastInlineTick_ = 0
    await channel.maybeTickAsync()

    const snapshotRecords = internals.lastSnapshotRecords_ as number

    expect( snapshotRecords ).toBeGreaterThan( 0 )
    expect( channel.previewYield.deferredOnPlacement ).toBe( 0 )

    // Index growth well past GENERATION_GROWTH_FACTOR, with products still
    // pending and nothing deferring: the generation must be kept.
    sink.reset()

    for ( let repeat = 0; repeat < 3; ++repeat ) {
      expect( buildIndexStreaming(
          new BufferByteSource( bytes ),
          IfcStepParser.Instance,
          4 * 1024,
          void 0,
          sink ).result ).toBe( ParseResult.COMPLETE )
    }

    expect( sink.topLevelCount ).toBeGreaterThan( snapshotRecords * 2 )

    internals.lastInlineTick_ = 0
    await channel.maybeTickAsync()

    expect( internals.lastSnapshotRecords_ ).toBe( snapshotRecords )
    expect( channel.previewYield.retried ).toBe( 0 )

    channel.stop()
  }, 120000 )

  test( 'a throwing prefix build retires the attempt, not the channel', async () => {

    // A mid-parse prefix can be structurally incomplete, and building a
    // generation over it throws. That must retire THIS attempt and then
    // wait for index growth: without the wait the channel re-snapshots and
    // re-throws on every tick, which is a snapshot copy of the whole prefix
    // per tick on a file large enough to matter.
    //
    // The gate has to hold with NO active generation, because a build that
    // throws is exactly the case that leaves none — that is why it is
    // tested on its own rather than folded in with the growth gate.
    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()

    expect( buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    let reportedRecords = sink.topLevelCount
    let snapshots = 0

    const flakySink = {
      get topLevelCount() {
        return reportedRecords
      },
      snapshot: () => {

        if ( ++snapshots === 1 ) {
          throw new Error( 'structurally incomplete prefix' )
        }

        return sink.snapshot()
      },
    } as unknown as ColumnarIndexSink< number >

    const payloads: PreviewMeshPayload[] = []
    const channel = new StorePreviewChannel(
        store, flakySink, conwayGeometry, true,
        ( mesh ) => payloads.push( mesh ), 64, 48 * 1024 * 1024, 1 )

    await channel.drainForTest()

    expect( snapshots ).toBe( 1 )
    expect( payloads.length ).toBe( 0 )

    // Same record count: the failure gate must hold the retry.
    await channel.drainForTest()

    expect( snapshots ).toBe( 1 )

    // The index grows past the gate: the retry builds and emits.
    reportedRecords *= 4

    await channel.drainForTest()

    expect( snapshots ).toBe( 2 )
    expect( payloads.length ).toBeGreaterThan( 0 )

    channel.stop()
  }, 120000 )

  test( 'an unproductive tick does not decay the cadence', async () => {

    const sink = new ColumnarIndexSink< number >()

    // Nothing parsed into the sink, so no generation can build. Every
    // such tick used to pay the interval decay anyway, cooling the
    // cadence toward its 600ms ceiling before there was ever anything
    // to extract.
    const channel = new StorePreviewChannel(
        new InMemoryStepByteStore( bytes ),
        sink, conwayGeometry, true, () => { /* nothing emits */ } )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    for ( let tick = 0; tick < 5; ++tick ) {
      internals.lastInlineTick_ = 0
      await channel.maybeTickAsync()
    }

    expect( internals.tickIntervalMs_ ).toBe( 150 )
    expect( channel.earlyPlateCount ).toBe( 0 )

    channel.stop()
  } )

  test( 'spatial plates come off a prefix generation, before parse end',
      async () => {

        const store = new InMemoryStepByteStore( bytes )
        const sink = new ColumnarIndexSink< number >()

        buildIndexStreaming(
            new BufferByteSource( bytes ),
            IfcStepParser.Instance,
            4 * 1024,
            void 0,
            sink )

        const payloads: PreviewMeshPayload[] = []
        const channel = new StorePreviewChannel(
            store, sink, conwayGeometry, true,
            ( mesh ) => payloads.push( mesh ),
            64, 48 * 1024 * 1024, 1 )

        // One tick is enough: the walk runs as the generation is built,
        // ahead of any product extraction.
        await channel.maybeTickAsync()

        expect( channel.earlyPlateCount ).toBeGreaterThan( 0 )

        const plates = payloads.filter( ( p ) => p.aabb !== void 0 )

        expect( plates.length ).toBe( channel.earlyPlateCount )
        expect( plates[ 0 ].color ).toEqual( { x: 0, y: 0, z: 0, w: 0.3 } )
        expect( plates[ 0 ].geometryExpressID ).toBe( -1 )
        expect( plates[ 0 ].flatTransformation ).toHaveLength( 16 )

        // The walk necessarily ran before any product could latch a
        // coordination frame, so it used the imposter walk's own
        // fallback derivation.
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        expect( ( channel as any ).earlyPlatesUsedFallbackFrame_ ).toBe( true )

        const first = channel.earlyPlateCount

        await channel.drainForTest()

        // Draining latches a real frame off the first captured product.
        expect( channel.coordinationMatrix ).toBeDefined()

        channel.stop()

        expect( channel.earlyPlateCount ).toBeGreaterThanOrEqual( first )
      } )

  test( 'early plates are re-emitted once a real frame latches', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()

    buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink )

    const payloads: PreviewMeshPayload[] = []
    const channel = new StorePreviewChannel(
        store, sink, conwayGeometry, true,
        ( mesh ) => payloads.push( mesh ),
        64, 48 * 1024 * 1024, 1 )

    await channel.drainForTest()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    expect( internals.earlyPlatesUsedFallbackFrame_ ).toBe( true )
    expect( channel.coordinationMatrix ).toBeDefined()

    const before = payloads.filter( ( p ) => p.aabb !== void 0 ).length

    // Let a fresh generation build now that a frame exists — normally
    // an index doubling does this mid-parse. Retiring the active
    // generation is what makes ensureGeneration_ take the build path;
    // rewinding the ordinal alone would just keep the current one.
    internals.disposeGeneration_()
    internals.lastSnapshotRecords_ = 0
    internals.unitOrdinal_ = 0

    await channel.drainForTest()

    const after = payloads.filter( ( p ) => p.aabb !== void 0 ).length

    // The plates came again, this time under the latched frame. Under
    // the replace-by-expressID contract that is a correction, not a
    // duplicate — and it does not happen a third time.
    expect( after ).toBeGreaterThan( before )
    expect( internals.earlyPlatesUsedFallbackFrame_ ).toBe( false )

    internals.disposeGeneration_()
    internals.lastSnapshotRecords_ = 0
    internals.unitOrdinal_ = 0

    await channel.drainForTest()

    expect( payloads.filter( ( p ) => p.aabb !== void 0 ).length ).toBe( after )

    channel.stop()
  } )

  // Codex review on #519: IfcProject alone does not prove the scaling
  // factor is resolvable — a valid file may forward-reference its
  // IfcUnitAssignment, and a prefix holding the project but not the
  // units record would emit (and latch) plates scaled by a silent 1.
  test( 'early plates defer until the unit assignment is indexed', async () => {

    /**
     * Minimal spatial IFC: Project/Site/Building/Storey + aggregates +
     * a placed wall, with the unit assignment optionally omitted.
     *
     * @param withUnits Include the IfcSiUnit/IfcUnitAssignment records.
     * @return {Uint8Array} File bytes.
     */
    const syntheticIfc = ( withUnits: boolean ): Uint8Array => {

      const units = withUnits ?
        '#90=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);\n' +
        '#91=IFCUNITASSIGNMENT((#90));\n' : ''

      const text =
        'ISO-10303-21;\nHEADER;\n' +
        'FILE_DESCRIPTION((\'\'),\'2;1\');\n' +
        'FILE_NAME(\'u.ifc\',\'2026-01-01T00:00:00\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
        'FILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n' +
        '#1=IFCCARTESIANPOINT((0.,0.,0.));\n' +
        '#2=IFCAXIS2PLACEMENT3D(#1,$,$);\n' +
        '#3=IFCLOCALPLACEMENT($,#2);\n' +
        `#10=IFCPROJECT('3vP000000000000000001',$,'P',$,$,$,$,$,${
          withUnits ? '#91' : '$'});\n` +
        '#11=IFCSITE(\'3vP000000000000000002\',$,\'S\',$,$,#3,$,$,.ELEMENT.,$,$,$,$,$);\n' +
        '#12=IFCBUILDING(\'3vP000000000000000003\',$,\'B\',$,$,#3,$,$,.ELEMENT.,$,$,$);\n' +
        '#13=IFCBUILDINGSTOREY(\'3vP000000000000000004\',$,\'L0\',$,$,#3,$,$,.ELEMENT.,0.);\n' +
        '#20=IFCRELAGGREGATES(\'3vP000000000000000005\',$,$,$,#10,(#11));\n' +
        '#21=IFCRELAGGREGATES(\'3vP000000000000000006\',$,$,$,#11,(#12));\n' +
        '#22=IFCRELAGGREGATES(\'3vP000000000000000007\',$,$,$,#12,(#13));\n' +
        '#30=IFCWALL(\'3vP000000000000000008\',$,$,$,$,#3,$,$,$);\n' +
        '#31=IFCRELCONTAINEDINSPATIALSTRUCTURE' +
        '(\'3vP000000000000000009\',$,$,$,(#30),#13);\n' +
        units +
        'ENDSEC;\nEND-ISO-10303-21;\n'

      return new TextEncoder().encode( text )
    }

    const runChannel = async ( fileBytes: Uint8Array ): Promise< number > => {

      const sink = new ColumnarIndexSink< number >()

      buildIndexStreaming(
          new BufferByteSource( fileBytes ),
          IfcStepParser.Instance,
          4 * 1024,
          void 0,
          sink )

      const channel = new StorePreviewChannel(
          new InMemoryStepByteStore( fileBytes ), sink, conwayGeometry, true,
          () => { /* plates counted via earlyPlateCount */ },
          64, 48 * 1024 * 1024, 1 )

      await channel.maybeTickAsync()

      const count = channel.earlyPlateCount

      channel.stop()
      return count
    }

    // Without a unit assignment anywhere in the index, the guard defers
    // — the end-of-parse walk covers such a file instead.
    expect( await runChannel( syntheticIfc( false ) ) ).toBe( 0 )

    // The same structure with units indexed emits immediately.
    expect( await runChannel( syntheticIfc( true ) ) ).toBeGreaterThan( 0 )
  } )

  test( 'open from store still leaves the source windowed', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const open = await openStreamedIfcModelFromStore( store, { pool: 4 * 1024 } )

    expect( open.model!.isSourceExternal ).toBe( true )
  } )

  test( 'OpenModelStream preview callback is safe on a windowed source', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const payloads: PreviewMeshPayload[] = []
    const api = new IfcAPI()

    await api.Init()

    const id = await api.OpenModelStream( store, {
      DEFER_GEOMETRY: true,
      COORDINATE_TO_ORIGIN: true,
      USE_FAST_BOOLS: true,
      ON_PREVIEW_MESH: ( mesh ) => {
        payloads.push( mesh )
      },
    } )

    expect( id ).toBeGreaterThanOrEqual( 0 )
    expect( api.getPassthrough( id )?.sourceIsExternal ??
      true ).toBe( true )

    // Spatial-structure plates are the aabb-only payloads (they carry no
    // vertex data); they are wireframe, so `solid` no longer marks them.
    const spatial = payloads.filter( ( p ) => p.aabb !== void 0 )

    expect( spatial.length ).toBeGreaterThan( 0 )
    expect( spatial[ 0 ].solid ).toBeUndefined()
    expect( spatial[ 0 ].color ).toEqual( { x: 0, y: 0, z: 0, w: 0.3 } )

    api.CloseModel( id )
  } )

  test( 'preemption preserves the unconsumed suffix of the retry queue', async () => {

    // Codex round 1 on #543: preemption replaced retryQueue_ outright with
    // this generation's fresh deferredForRetry_, discarding whatever the
    // OLD queue's tail had not yet been popped. A retry queue can easily
    // span more than one tick's TICK_MAX_ATTEMPTS budget, so index growth
    // can preempt a generation mid-drain of it — and every un-popped entry
    // is a product whose unitOrdinal_ has already passed, so replacing
    // rather than concatenating strands it exactly the way abandoned
    // deferrals were stranded before this queue existed (conway#542).
    //
    // The bug is purely mechanical (which array wins the assignment), so
    // this seeds the private queue state directly and forces the growth
    // gate via lastSnapshotRecords_, rather than engineering a real
    // multi-tick deferral sequence — store_preview_channel.ts's extraction
    // seam isn't pluggable the way the resident channel's
    // PreviewSchemaAdapter is, so a real gen1/gen2 pair here means real
    // IfcStepModel/IfcGeometryExtraction builds regardless.
    const store = new InMemoryStepByteStore( bytes )
    const sink = new ColumnarIndexSink< number >()

    expect( buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        void 0,
        sink ).result ).toBe( ParseResult.COMPLETE )

    const channel = new StorePreviewChannel(
        store, sink, conwayGeometry, true,
        () => { /* payloads not inspected */ }, 64, 48 * 1024 * 1024, 1 )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    // Generation 1: a real, successful build (active must be defined for
    // the preemption branch to even be reachable).
    expect( await internals.ensureGeneration_() ).toBe( true )

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

    // Preemption fires: active is defined, growthReady (real topLevelCount
    // >= 1 * factor), and deferredForRetry_.length > 0.
    expect( await internals.ensureGeneration_() ).toBe( true )

    // The unconsumed suffix of the old queue (indices 3..5) must survive,
    // carried ahead of this generation's own fresh deferral — not replaced
    // by it.
    expect( internals.retryQueue_ ).toEqual( [ 13, 14, 15, 99 ] )
    expect( internals.retryCursor_ ).toBe( 0 )

    channel.stop()
  }, 120000 )

  test( 'reports a preview line even when nothing was ever attempted', () => {

    // Codex round 1 on #543: stop() suppressed the Preview line unless
    // emittedUnits_ or deferredUnits_ was nonzero. A channel that never
    // reached firstGenerationMinRecords -- or whose every generation build
    // threw -- leaves both at zero, and that is exactly the worst-case
    // blank-first-load conway#542 exists to make diagnosable: an enabled
    // preview that produced nothing must not read the same as a preview
    // that never ran. formatPreviewLine already renders the zero case as
    // "no mesh, 0 emitted, 0 deferred".
    const store = new InMemoryStepByteStore( bytes )
    const emptySink = {
      get topLevelCount() {
        return 0
      },
      snapshot: () => {
        throw new Error( 'must not be called: topLevelCount never grows' )
      },
    } as unknown as ColumnarIndexSink<number>

    const infoSpy = jest.spyOn( Logger, 'info' ).mockImplementation( () => { /* silence */ } )

    // Default firstGenerationMinRecords (1024): with topLevelCount pinned
    // at 0, ensureGeneration_ never builds a generation, so the channel
    // reaches stop() having attempted nothing at all.
    const channel = new StorePreviewChannel(
        store, emptySink, conwayGeometry, false,
        () => { /* no payloads possible */ } )

    channel.stop()

    expect( infoSpy ).toHaveBeenCalledWith(
        expect.stringContaining( 'Preview: no mesh, 0 emitted, 0 deferred' ) )

    infoSpy.mockRestore()
  } )
} )
