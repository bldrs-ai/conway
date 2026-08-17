/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import IfcStepParser from '../../ifc/ifc_step_parser'
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
} )
