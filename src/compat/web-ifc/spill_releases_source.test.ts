/* eslint-disable no-magic-numbers */
// A BUFFERED open's source must be collectable once SpillModelSource has
// moved the model onto an external store (bldrs-ai/Share#2139).
//
// Share opens a model buffered (OpenModelStreamed over one in-memory copy of
// the file), pumps its geometry with ExtractGeometryBatchAsync, then spills
// the source to a store so the worker can drop the copy. A Chromium heap
// snapshot of that sequence on an 860 MB IFC showed the copy surviving the
// spill through IfcApiProxyIfc.demandAggregates_ -> an IfcRelAggregates ->
// RelatingObject_ -> its descriptor's `buffer`, a view of the source. The
// same sequence here, in Node, reaches each retainer that pinned it: the IFC
// aggregate worklist (index.ifc), the IFC grid-axis map (grid_placement.ifc,
// which the worklist fix alone left pinned) and the AP214 demand plan.
//
// Retention is observed directly: a WeakRef to the model's own source
// ArrayBuffer, settled with real collections. Jest runs without --expose-gc,
// so the flag is switched on here and the hook fetched from a fresh context,
// which is where V8 installs it once the flag is set.
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as v8 from 'v8'
import * as vm from 'vm'

import { describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true }

v8.setFlagsFromString( '--expose-gc' )

const collectGarbage = vm.runInNewContext( 'gc' ) as () => void

/** The private field the open hands its source to. */
interface ModelWithSource {
  buffer_?: Uint8Array
}

/** A buffered open, and a WeakRef to the source it holds. */
interface BufferedOpen {
  api: IfcAPI
  modelID: number
  source: WeakRef< ArrayBufferLike >
}

/**
 * Open a fixture buffered, keeping no strong reference to its bytes: what
 * comes back besides the model is a WeakRef to the ArrayBuffer the MODEL
 * holds, read from the model rather than assumed to be the one passed in.
 *
 * One IfcAPI per open. Two deferred loads of index.ifc through ONE IfcAPI
 * do not place their geometry identically even with no spill anywhere —
 * the second load's placements come out at the origin — so comparing a
 * spilled load against a reference only means something when each has an
 * API of its own. That is a separate defect from the one tested here.
 *
 * @param path The fixture.
 * @return {Promise<BufferedOpen>} The open.
 */
async function openBuffered( path: string ): Promise< BufferedOpen > {

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStreamed(
      new Uint8Array( fs.readFileSync( path ) ), SETTINGS )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const passthrough = api.getPassthrough( modelID ) as unknown as
    { model: [ ModelWithSource ] }
  const held = passthrough.model[ 0 ].buffer_

  // A model without a resident buffer would make the WeakRef meaningless:
  // this is a test of the buffered open.
  expect( held ).toBeDefined()

  return { api, modelID, source: new WeakRef( held!.buffer ) }
}

/**
 * A spill store over a copy of the fixture — never over the model's own
 * bytes, which would keep them alive by construction.
 *
 * Synchronous for STEP: AP214's extraction reads records synchronously, so
 * a windowed AP214 model needs a store that can fault a window in
 * (`StepExternalByteStore.readSync`), as Share's stores can.
 *
 * @param path The fixture.
 * @return {InMemoryStepByteStore} The store.
 */
function storeFor( path: string ): InMemoryStepByteStore {
  return new InMemoryStepByteStore(
      new Uint8Array( fs.readFileSync( path ) ), !path.endsWith( '.ifc' ) )
}

/**
 * Flatten a mesh delta into comparable data, appending to what an earlier
 * delta for the same entity delivered. Transforms are encoded losslessly,
 * and each geometry's vertex and index data is hashed: a face that fails to
 * extract after the spill changes the geometry, not its ID or placement, so
 * a comparison without the data cannot see it.
 *
 * @param api The API the mesh came from.
 * @param modelID The model.
 * @param mesh The mesh.
 * @param previous The entity's accumulated geometry so far.
 * @return {string[]} One key per placed geometry.
 */
function flatten(
    api: IfcAPI,
    modelID: number,
    mesh: FlatMesh,
    previous: string[] = [] ): string[] {

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )
    const transform = new Float64Array( placed.flatTransformation )
    const geometry = api.GetGeometry( modelID, placed.geometryExpressID )
    const vertices = api.GetVertexArray(
        geometry.GetVertexData(), geometry.GetVertexDataSize() )
    const indices = api.GetIndexArray(
        geometry.GetIndexData(), geometry.GetIndexDataSize() )

    previous.push( [
      placed.geometryExpressID,
      JSON.stringify( placed.color ),
      Buffer.from( transform.buffer ).toString( 'base64' ),
      createHash( 'sha256' )
          .update( new Uint8Array( vertices.buffer, vertices.byteOffset, vertices.byteLength ) )
          .update( new Uint8Array( indices.buffer, indices.byteOffset, indices.byteLength ) )
          .digest( 'hex' ),
    ].join( '|' ) )
  }

  return previous
}

/** When to spill: before the batch for which this first answers true. */
type SpillWhen = ( batch: number, passthrough: DemandState ) => boolean

/** The proxy's demand-pump state the spill points are chosen from. */
interface DemandState {
  demandAggregateStepper_?: unknown
  demandAggregateSteps_?: number
}

/**
 * Pump a deferred model's geometry the way Share does — async batches until
 * a call extracts nothing with nothing remaining — optionally spilling the
 * source once, before the first batch `spill.when` picks.
 *
 * @param open The model.
 * @param spill When to spill, and onto which store.
 * @return {Promise<Map<number, string[]>>} Every entity's placed geometry.
 */
async function pump(
    open: BufferedOpen,
    spill?: { when: SpillWhen, store: InMemoryStepByteStore } ):
    Promise< Map< number, string[] > > {

  const { api, modelID } = open
  const meshes = new Map< number, string[] >()
  const passthrough = api.getPassthrough( modelID ) as unknown as DemandState
  let spilled = false

  for ( let batch = 0; ; ++batch ) {

    if ( spill !== void 0 && !spilled && spill.when( batch, passthrough ) ) {
      expect( api.SpillModelSource( modelID, spill.store ) ).toBe( true )
      spilled = true
    }

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, 1, ( mesh ) => {
          meshes.set(
              mesh.expressID,
              flatten( api, modelID, mesh, meshes.get( mesh.expressID ) ) )
        } )

    if ( remaining === 0 && extracted === 0 ) {

      // Mid-pump means mid-pump: the spill has to have happened before the
      // work ran out, or the test is the after-the-pump one again.
      expect( spill === void 0 || spilled ).toBe( true )

      return meshes
    }
  }
}

/**
 * Collect until a WeakRef target is gone, or give up.
 *
 * A WeakRef's target is kept alive until the end of the job that last
 * dereferenced it, so a round that collects right after a `deref()` can
 * never free it: each round yields to a macrotask BEFORE collecting, and
 * again before looking.
 *
 * @param ref The reference to watch.
 * @return {Promise<boolean>} True when the target was collected.
 */
async function collected( ref: WeakRef< object > ): Promise< boolean > {

  const turn = () => new Promise( ( resolve ) => setImmediate( resolve ) )

  for ( let round = 0; round < 5; ++round ) {

    await turn()

    collectGarbage()

    await turn()

    if ( ref.deref() === void 0 ) {
      return true
    }
  }

  return false
}

/**
 * Pump to completion, spill, and check the source goes.
 *
 * @param fixture The model.
 */
async function spillAfterPump( fixture: string ): Promise< void > {

  const open = await openBuffered( fixture )
  const meshes = await pump( open )

  expect( meshes.size ).toBeGreaterThan( 0 )

  // The WeakRef watches the right buffer: the model alone keeps it.
  expect( await collected( open.source ) ).toBe( false )

  expect( open.api.SpillModelSource( open.modelID, storeFor( fixture ) ) ).toBe( true )

  expect( await collected( open.source ) ).toBe( true )

  // The spilled model still answers: a whole-model re-walk serves every
  // entity the pump delivered, and a property read pages from the store.
  const rewalked = new Set< number >()

  await open.api.StreamAllMeshesAsync( open.modelID, ( mesh ) => {
    rewalked.add( mesh.expressID )
  } )

  expect( [ ...rewalked ].sort() ).toEqual( [ ...meshes.keys() ].sort() )

  const expressID = [ ...meshes.keys() ][ 0 ]
  const item = await open.api.properties.getItemProperties( open.modelID, expressID )

  expect( item?.expressID ).toBe( expressID )

  open.api.CloseModel( open.modelID )
}

/**
 * Spill part-way through the pump: the geometry must match an unspilled
 * load's exactly, and the source must go once the pump has drained.
 *
 * @param fixture The model.
 * @param when When to spill.
 * @return {Promise<object>} The open, for further reads.
 */
async function spillMidPump( fixture: string, when: SpillWhen ):
    Promise< { open: BufferedOpen, meshes: Map< number, string[] > } > {

  const reference = await openBuffered( fixture )
  const expected = await pump( reference )

  reference.api.CloseModel( reference.modelID )

  expect( expected.size ).toBeGreaterThan( 0 )

  const open = await openBuffered( fixture )
  const meshes = await pump( open, { when, store: storeFor( fixture ) } )

  expect( meshes ).toEqual( expected )
  expect( await collected( open.source ) ).toBe( true )

  return { open, meshes }
}

describe( 'invalidate(true) and complex records', () => {

  test( 'AP214 STEP: a property sweep then ReleaseEntityCache before the ' +
      'pump leaves the geometry unchanged', async () => {

    // No spill: the AP214 spill runs this same sequence (it primes the
    // property indexes, then invalidates), and before the fix the assembly
    // placements, complex records the sweep had read, came back with no
    // sub-entities after the invalidate and dropped out of the pump.
    const fixture = 'data/as1-oc-214.stp'
    const reference = await openBuffered( fixture )
    const expected = await pump( reference )

    reference.api.CloseModel( reference.modelID )

    const open = await openBuffered( fixture )

    await open.api.properties.getSpatialStructure(
        open.modelID, 'names', { includeSolids: true } )

    open.api.ReleaseEntityCache( open.modelID )

    expect( await pump( open ) ).toEqual( expected )

    open.api.CloseModel( open.modelID )
  }, 240000 )
} )

describe( 'SpillModelSource releases a buffered open\'s source', () => {

  test( 'IFC aggregates (index.ifc): pump, then spill, frees the source', async () => {
    await spillAfterPump( 'data/index.ifc' )
  }, 240000 )

  test( 'IFC grid placements (grid_placement.ifc): pump, then spill, ' +
      'frees the source', async () => {
    await spillAfterPump( 'data/grid_placement.ifc' )
  }, 240000 )

  test( 'IFC: a spill mid-pump leaves the geometry unchanged and the ' +
      'source collectable once it drains', async () => {

    // One batch in: the worklists exist and the per-product pass has
    // started, so every relationship the aggregates pass extracts is
    // resolved after the spill and pages through the store.
    const { open, meshes } = await spillMidPump( 'data/index.ifc', ( batch ) => batch === 1 )

    // And the spilled model still answers property reads, from the store.
    const expressID = [ ...meshes.keys() ][ 0 ]
    const product = await open.api.properties.getItemProperties(
        open.modelID, expressID )

    expect( product?.expressID ).toBe( expressID )

    open.api.CloseModel( open.modelID )
  }, 240000 )

  test( 'IFC: a spill before the first batch leaves the geometry unchanged ' +
      'and the source collectable once it drains', async () => {

    // Before the worklists exist: they are built over the store.
    const { open } = await spillMidPump( 'data/index.ifc', ( batch ) => batch === 0 )

    open.api.CloseModel( open.modelID )
  }, 240000 )

  test( 'IFC: a spill part-way through one relationship\'s steps leaves ' +
      'the geometry unchanged', async () => {

    // The aggregates pass steps one related product per batch here, so this
    // spills with a relationship's stepper live and its pager begun over the
    // resident source: what is left of the relationship has to page through
    // the store.
    const { open } = await spillMidPump(
        'data/aggregate_paged_prefetch.ifc',
        ( _batch, state ) =>
          state.demandAggregateStepper_ !== void 0 &&
          ( state.demandAggregateSteps_ ?? 0 ) > 0 )

    open.api.CloseModel( open.modelID )
  }, 240000 )

  test( 'AP214 STEP: pump, then spill, frees the source', async () => {
    await spillAfterPump( 'data/as1-oc-214.stp' )
  }, 240000 )

  test( 'AP214 STEP: a spill before the first batch leaves the geometry ' +
      'unchanged and the source collectable once it drains', async () => {

    // Before the demand units are planned: they are planned over the store.
    const { open } = await spillMidPump( 'data/as1-oc-214.stp', ( batch ) => batch === 0 )

    open.api.CloseModel( open.modelID )
  }, 240000 )

  test( 'AP214 STEP: a spill mid-pump leaves the geometry unchanged and ' +
      'the source collectable once it drains', async () => {

    const { open } = await spillMidPump( 'data/as1-oc-214.stp', ( batch ) => batch === 2 )

    open.api.CloseModel( open.modelID )
  }, 240000 )
} )
