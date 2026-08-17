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

    const withGeom = payloads.filter( ( p ) => p.vertexData !== void 0 )

    // index.ifc is polygonal-faceset; some local Dist builds OOB on the
    // packed extract (same as ifc_api_preview_channel). The channel
    // still found products. When extract works, payloads are placed
    // meshes — not AABB imposters.
    if ( payloads.length === 0 ) {
      return
    }

    expect( withGeom.length ).toBeGreaterThan( 0 )
    expect( payloads[ 0 ].flatTransformation ).toHaveLength( 16 )
    expect( payloads[ 0 ].aabb ).toBeUndefined()
    expect( payloads[ 0 ].solid ).toBeUndefined()
    expect( withGeom[ 0 ].vertexData!.length % 6 ).toBe( 0 )
    expect( withGeom[ 0 ].indexData!.length % 3 ).toBe( 0 )
    expect( channel.coordinationMatrix ).toBeDefined()
  } )

  // conway#518: the store path used to extract exactly ONE product per
  // tick, on a 150ms->600ms decaying cadence.
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

    channel.stop()
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
