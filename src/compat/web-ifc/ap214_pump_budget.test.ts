import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'


/**
 * conway#579 / codex review round 3: `extractGeometryBatch` is a public
 * entry point, and `ExtractGeometryBatch`'s contract lets a consumer omit
 * the mesh callback and pump on the returned `remaining` instead. The
 * wall-clock budget was originally applied only when a callback was
 * supplied — using "no callback" as a stand-in for "this is the internal
 * drain" — so such a consumer got no deadline AND the batch-size
 * multiplier, which is the multi-second block this work exists to remove.
 *
 * The budget is now a parameter of the private pump, and the one caller
 * entitled to skip it (streamAllMeshes' drain) says so by name.
 *
 * The fixture needs materially more geometry than one budget's worth or
 * the assertion is vacuous: nema-23-76mm is ~437 ms of geometry across
 * ten demand units, against a 50 ms budget.
 */
const FIXTURE = 'data/nema-23-76mm.step'

/** Far above the model's unit count, so only the budget can end the call. */
const UNBOUNDED_BATCH = 1000

const OPEN_TIMEOUT_MS = 120_000

let wasmModule: unknown

beforeAll( async () => {

  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  wasmModule =
    ( conwayGeometry as unknown as { wasmModule: unknown } ).wasmModule
}, OPEN_TIMEOUT_MS )


/**
 * Open the fixture without extracting, the way Share's deferred path does.
 *
 * @return {Promise<IfcApiProxyAP214>} A deferred proxy with every demand
 * unit still pending.
 */
async function openDeferred(): Promise<IfcApiProxyAP214> {

  const data = new Uint8Array( fs.readFileSync( FIXTURE ) )

  return await IfcApiProxyAP214.createDeferred( 0, data, wasmModule )
}


describe( 'AP214 pump budget (conway#579)', () => {

  test( 'a callback-less batch is still bounded by the budget', async () => {

    const proxy = await openDeferred()

    const first = proxy.extractGeometryBatch( UNBOUNDED_BATCH )

    // It did work...
    expect( first.extracted ).toBeGreaterThan( 0 )

    // ...but did NOT run the whole model in one synchronous call, which is
    // what it would do if the budget were skipped for callback-less
    // callers. This is the assertion that fails without the fix.
    expect( first.remaining ).toBeGreaterThan( 0 )
  }, OPEN_TIMEOUT_MS )

  test( 'a callback-less pump still drains to completion', async () => {

    const proxy = await openDeferred()

    let calls = 0
    let remaining = Number.POSITIVE_INFINITY

    while ( remaining > 0 ) {
      remaining = proxy.extractGeometryBatch( UNBOUNDED_BATCH ).remaining
      ++calls
    }

    // More than one call, since the budget bounded each of them, and a
    // bounded number, since each call makes progress.
    expect( calls ).toBeGreaterThan( 1 )
    expect( remaining ).toBe( 0 )
  }, OPEN_TIMEOUT_MS )

  test( 'streamAllMeshes drains a deferred model in one call', async () => {

    const proxy = await openDeferred()

    let meshes = 0

    proxy.streamAllMeshes( () => {
      ++meshes
    } )

    // The internal drain is the one caller that runs unbudgeted, so a
    // single streamAllMeshes still returns a fully extracted model.
    expect( meshes ).toBeGreaterThan( 0 )
    expect( proxy.extractGeometryBatch( UNBOUNDED_BATCH ).remaining ).toBe( 0 )
  }, OPEN_TIMEOUT_MS )
} )
