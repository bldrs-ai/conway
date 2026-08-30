/* eslint-disable no-magic-numbers */
// The ASYNC whole-model ask (conway#660), and specifically the one case that
// had no answer before it: a deferred model whose source is WINDOWED.
//
// conway#657 gave a STREAMING_CONSUMER model a late whole-model ask served by
// re-walking the live scene. That ask drains the pump first, and the
// synchronous entry point drains through the synchronous pump, which refuses
// an external source outright — "ExtractGeometryBatch is synchronous and
// cannot page a windowed source". So on a model opened with OpenModelStream
// the ask threw before serving anything, flag or no flag. GitHub/OPFS File
// loads take that open by default, i.e. the large models the memory work is
// aimed at are exactly the ones it could not serve.
//
// StreamAllMeshesAsync closes that in the one place the gap existed — the
// DRAIN — and shares everything after it with the sync path. What each test
// below pins:
//
//   1. the async ask agrees with the sync one on a model both can serve, so
//      "async" is a way of draining and not a second set of semantics;
//   2. on a windowed model it serves the whole model, matching an
//      independently-produced buffered reference placement for placement,
//      and repeats exactly;
//   3. the budget accounting survives the move: partial loss warns with the
//      exact count, total loss throws, on the windowed path;
//   4. a released model throws, loudly, through the new entry point too;
//   5. the SYNC entry point still refuses a windowed source with the same
//      message it always did — this change must not quietly relax it.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import Logger, { LogLevel } from '../../logging/logger'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const DEFERRED = { ...SETTINGS, DEFER_GEOMETRY: true }

const DEFERRED_OWNED = { ...DEFERRED, STREAMING_CONSUMER: true }

/* Same fixtures as the #657 suite, and for the same reasons: the IFC one has
 * shared/mapped representations, so an entity's instance set grows across
 * batches; the STEP one actually serves geometry (as1-assembly has none even
 * classically). Sharing them also makes the two suites' counts comparable. */
const IFC_FIXTURE = 'data/mapped_shared_representation.ifc'

const STEP_FIXTURE = 'data/nema-23-76mm.step'

/** Products (IFC) / scaled units (AP214) per pump call. */
const BATCH = 4

/* MB is the API's unit and bytes are the engine's, so a budget small enough
 * to bind on a fixture this size has to be expressed as a fraction. */
const BYTES_PER_MIB = 1024 * 1024

/* The message the SYNCHRONOUS pump has always refused a windowed source
 * with. Spelled out rather than matched loosely because pinning it is the
 * whole point of the test that uses it: this work adds an entry point beside
 * that refusal and must not soften it. */
const SYNC_WINDOWED_REFUSAL =
  'ExtractGeometryBatch is synchronous and cannot page a windowed source'

let ifcFixture: Uint8Array
let stepFixture: Uint8Array


/** One delivered placement, flattened to something comparable by value. */
interface Placement {
  expressID: number
  geometryExpressID: number
  flatTransformation: number[]
  color: number[]
  occurrencePath?: readonly number[]
}


/**
 * Flatten a delivered FlatMesh into comparable placement records.
 *
 * Colour and occurrencePath are included, not just the identifying fields:
 * colour comes off the material and occurrencePath off the AP214 scene walk,
 * so both are things a differently-drained re-walk could plausibly get wrong
 * while still agreeing on which geometry goes where.
 *
 * @param mesh The mesh handed to a callback.
 * @return {Placement[]} One record per placed instance on it.
 */
function placements( mesh: FlatMesh ): Placement[] {

  const out: Placement[] = []

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )

    out.push( {
      expressID: mesh.expressID,
      geometryExpressID: placed.geometryExpressID,
      flatTransformation: [ ...placed.flatTransformation ],
      color: [ placed.color.x, placed.color.y, placed.color.z, placed.color.w ],
      occurrencePath: placed.occurrencePath === void 0 ?
        void 0 : [ ...placed.occurrencePath ],
    } )
  }

  return out
}


/**
 * Order-independent comparison key for a set of placements. The pump
 * delivers per batch and a whole-model walk delivers per entity, so the two
 * agree on content, not on sequence.
 *
 * @param all The placements to key.
 * @return {string[]} Sorted, one string per placement.
 */
function asSortedKeys( all: Placement[] ): string[] {

  return all.map( ( placement ) =>
    `${placement.expressID}/${placement.geometryExpressID}/` +
    `${placement.flatTransformation.join( ',' )}/` +
    `${placement.color.join( ',' )}/` +
    `${placement.occurrencePath?.join( '.' ) ?? '-'}` ).sort()
}


/**
 * Drain a deferred model through the SYNC pump.
 *
 * Stops on `remaining === 0 && extracted === 0`, the documented consumer
 * stopping condition rather than a test convenience: the final zero-work call
 * is what runs the geometry budget's head eviction (conway#654's copy window).
 *
 * @param api The API instance owning the model.
 * @param modelID The deferred model to drain.
 */
function drain( api: IfcAPI, modelID: number ): void {

  for ( ; ; ) {

    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH, () => { /* delivery is not what this pins */ } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }
}


/**
 * Drain a deferred model through the ASYNC pump — the only one that can page
 * a windowed source, and the one Share drives.
 *
 * @param api The API instance owning the model.
 * @param modelID The deferred model to drain.
 * @return {Promise<Placement[]>} Every placement the pump delivered.
 */
async function drainAsync(
    api: IfcAPI, modelID: number ): Promise< Placement[] > {

  const delivered: Placement[] = []

  for ( ; ; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, BATCH, ( mesh ) => {
          delivered.push( ...placements( mesh ) )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return delivered
}


/**
 * Collect a whole-model StreamAllMeshes into placement records.
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {Placement[]} Every placement served.
 */
function streamAll( api: IfcAPI, modelID: number ): Placement[] {

  const served: Placement[] = []

  api.StreamAllMeshes( modelID, ( mesh ) => {
    served.push( ...placements( mesh ) )
  } )

  return served
}


/**
 * Collect a whole-model StreamAllMeshesAsync into placement records.
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {Promise<Placement[]>} Every placement served.
 */
async function streamAllAsync(
    api: IfcAPI, modelID: number ): Promise< Placement[] > {

  const served: Placement[] = []

  await api.StreamAllMeshesAsync( modelID, ( mesh ) => {
    served.push( ...placements( mesh ) )
  } )

  return served
}


/**
 * Run an async whole-model ask with the log sink captured.
 *
 * The partial-loss path's ONLY output to a consumer is a warning line — the
 * placements it lost are simply not in what it returns — so the line has to
 * be asserted on directly rather than inferred from a count.
 *
 * @param api The API instance owning the model.
 * @param modelID The open model.
 * @return {Promise<object>} What was served, and every line the call logged.
 */
async function streamAllAsyncCapturingLogs( api: IfcAPI, modelID: number ):
  Promise< { served: Placement[], logged: string[] } > {

  const logged: string[] = []

  Logger.clearLogs()
  Logger.setLogLevel( LogLevel.WARNING )
  Logger.setSink( ( _level, message ) => {
    logged.push( message )
  } )

  try {
    return { served: await streamAllAsync( api, modelID ), logged }
  } finally {
    Logger.setSink()
    Logger.setLogLevel( LogLevel.INFO )
    Logger.clearLogs()
  }
}


/**
 * The whole-model answer of an ordinary retaining deferred open, produced
 * entirely through pre-#660 machinery: buffered source, synchronous pump,
 * synchronous ask, cumulative cache. Every windowed expectation below is
 * anchored to this rather than to a hand-written count, so a test can only
 * pass by agreeing with the path production already trusts.
 *
 * @param api The API instance to open the reference model on.
 * @param fixture The source bytes.
 * @return {Promise<Placement[]>} The reference placements.
 */
async function bufferedRetainingReference(
    api: IfcAPI, fixture: Uint8Array ): Promise< Placement[] > {

  const retainingID = await api.OpenModelStreamed( fixture, DEFERRED )

  drain( api, retainingID )

  return streamAll( api, retainingID )
}


beforeAll( () => {
  ifcFixture = new Uint8Array( fs.readFileSync( IFC_FIXTURE ) )
  stepFixture = new Uint8Array( fs.readFileSync( STEP_FIXTURE ) )
} )


describe.each( [
  [ 'IFC', () => ifcFixture ],
  [ 'AP214/STEP', () => stepFixture ],
] )( 'StreamAllMeshesAsync on %s', ( _format, fixture ) => {

  test( 'the async whole-model ask serves what the sync one serves, and ' +
    'repeats exactly',
  async () => {

    // Format parity for the entry point itself, on a source both entry
    // points can serve. If the async one is a second implementation of the
    // semantics rather than a second way of draining into them, this is
    // where the two diverge.
    const api = new IfcAPI()

    await api.Init()

    const reference = await bufferedRetainingReference( api, fixture() )

    expect( reference.length ).toBeGreaterThan( 0 )

    const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )

    drain( api, ownedID )

    const first = await streamAllAsync( api, ownedID )

    expect( asSortedKeys( first ) ).toEqual( asSortedKeys( reference ) )

    // Idempotent, as the sync ask is and the retaining path is not: each
    // call clears the rebuilt cache and re-walks from instance zero.
    const second = await streamAllAsync( api, ownedID )

    expect( asSortedKeys( second ) ).toEqual( asSortedKeys( first ) )
  }, 240000 )

  test( 'an async whole-model ask after the natives are released throws by ' +
    'contract',
  async () => {

    const api = new IfcAPI()

    await api.Init()

    const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )

    drain( api, ownedID )

    expect( api.ReleaseModelGeometry( ownedID ) ).toBe( true )

    // Never a silent empty model, on this entry point either: the cache is
    // gone by contract and the natives a re-walk needs are gone by request.
    await expect( streamAllAsync( api, ownedID ) )
        .rejects.toThrow( /STREAMING_CONSUMER/ )

    // ...and it names the entry point that was actually asked, so a
    // consumer driving both can tell which one failed.
    await expect( streamAllAsync( api, ownedID ) )
        .rejects.toThrow( /StreamAllMeshesAsync/ )
  }, 240000 )
} )


describe.each( [
  [ 'IFC', () => ifcFixture ],
  [ 'AP214/STEP', () => stepFixture ],
] )( 'StreamAllMeshesAsync yields to the event loop on %s',
( _format, fixture ) => {

  test( 'the drain yields before it extracts, so the signature is not a lie',
      async () => {

        // An async function runs SYNCHRONOUSLY until its first await, so a
        // drain containing no event-loop yield would not hand the caller a
        // promise until the whole model had been extracted — an awaiting
        // consumer starved exactly as the sync StreamAllMeshes starves it,
        // while the signature said otherwise. Microtasks do not fix that:
        // the pump lock and the worklist check are microtask awaits, and a
        // microtask checkpoint does not let timers or I/O run.
        //
        // The probe is a setImmediate scheduled BEFORE the ask: it is a
        // macrotask, so it can only run ahead of the ask's resolution if the
        // drain actually crossed an event-loop task boundary. A drain that
        // awaited nothing, or only microtasks, settles during the current
        // task's microtask drain and leaves this false.
        //
        // A timer is the WRONG probe here and was tried first: `setInterval`
        // at 0 ms recorded zero ticks across a measured 74 ms drain, because
        // yieldToEventLoop posts through MessageChannel — deliberately, so
        // background tabs do not clamp it — and those tasks keep cycling
        // without the timers phase getting a turn. Zero ticks there means
        // "timers were starved", not "nothing yielded", which is exactly the
        // wrong conclusion.
        const api = new IfcAPI()

        await api.Init()

        const ownedID = await api.OpenModelStreamed( fixture(), DEFERRED_OWNED )

        let crossedATask = false

        setImmediate( () => {
          crossedATask = true
        } )

        await streamAllAsync( api, ownedID )

        expect( crossedATask ).toBe( true )
      }, 240000 )
} )


describe( 'StreamAllMeshesAsync on a WINDOWED source (IFC only — ' +
  'store-backed opens are IFC-only)', () => {

  // The case conway#660 exists for. OpenModelStream keeps the model windowed
  // from birth, which is what a GitHub/OPFS File load takes by default in
  // Share, and it is exactly where the whole-model ask had no answer.

  test( 'the sync whole-model ask still refuses a windowed source',
      async () => {

        // Pinned FIRST and separately, because it is the pre-existing
        // behaviour this change is most likely to relax by accident: adding
        // an async drain beside the sync one must not turn the sync one into
        // something that quietly half-works on a source it cannot page.
        // Asserted with and without the flag, since the refusal is the sync
        // PUMP's and has nothing to do with the ownership contract.
        const api = new IfcAPI()

        await api.Init()

        for ( const settings of [ DEFERRED, DEFERRED_OWNED ] ) {

          const windowedID = await api.OpenModelStream(
              new InMemoryStepByteStore( ifcFixture ), settings )

          expect( api.getPassthrough( windowedID )!.sourceIsExternal )
              .toBe( true )

          await drainAsync( api, windowedID )

          expect( () => streamAll( api, windowedID ) )
              .toThrow( SYNC_WINDOWED_REFUSAL )
        }
      }, 240000 )

  test( 'a windowed streaming-consumer model serves its whole model, and ' +
    'repeats exactly',
  async () => {

    const api = new IfcAPI()

    await api.Init()

    // Produced through pre-#660 machinery end to end — buffered, sync pump,
    // sync ask, retaining — so agreement below is a cross-check against the
    // path production already trusts, not a comparison of the new code with
    // itself.
    const reference = await bufferedRetainingReference( api, ifcFixture )

    expect( reference.length ).toBeGreaterThan( 0 )

    const ownedID = await api.OpenModelStream(
        new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

    expect( api.getPassthrough( ownedID )!.sourceIsExternal ).toBe( true )

    const delivered = await drainAsync( api, ownedID )

    // The pump delivered normally, so what follows is about the late ask
    // rather than about a load that never worked.
    expect( asSortedKeys( delivered ) ).toEqual( asSortedKeys( reference ) )

    // Nothing retained to replay: this is a fresh walk of the live scene on
    // a model whose bytes are a moving window, reached through a drain that
    // paged them.
    const first = await streamAllAsync( api, ownedID )

    expect( asSortedKeys( first ) ).toEqual( asSortedKeys( reference ) )

    const second = await streamAllAsync( api, ownedID )

    expect( asSortedKeys( second ) ).toEqual( asSortedKeys( first ) )
  }, 240000 )

  test( 'a windowed RETAINING model is served by the async ask too',
      async () => {

        // The leak guard for the test above: the windowed ask must work
        // because the drain can page, not because STREAMING_CONSUMER routes
        // it somewhere special. An unflagged windowed model has no sync
        // whole-model ask either, and gets one here.
        const api = new IfcAPI()

        await api.Init()

        const reference = await bufferedRetainingReference( api, ifcFixture )

        const windowedID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED )

        await drainAsync( api, windowedID )

        expect( asSortedKeys( await streamAllAsync( api, windowedID ) ) )
            .toEqual( asSortedKeys( reference ) )
      }, 240000 )

  test( 'overlapping async pump calls queue instead of extracting the same ' +
    'products twice',
  async () => {

    // The pump body selects its batch — productEnd and batchIDs off
    // demandCursor_ — synchronously, awaits the prefetch, and only then
    // writes the cursor back. Two calls in flight therefore read the SAME
    // un-advanced cursor and extract the same products, duplicating scene
    // nodes so a later whole-model re-walk serves each twice; and each
    // writes its own saved productEnd, so the later finisher can move the
    // cursor BACKWARD over ground a call that started after it already
    // covered.
    //
    // conway#660 is what makes this reachable: streamAllMeshesAsync is a
    // second door into this same pump, and asking for the whole model while
    // a batch pump is still in flight is an ordinary thing for a consumer
    // to do (Share's degraded end-of-load fires from an error handler, not
    // from inside its pump loop).
    //
    // Two concurrent pump calls are the direct, deterministic form of that
    // hazard, and what this pins. Measured against a build with the lock
    // removed: both calls returned {extracted: 4, remaining: 12} for the
    // SAME four products, 8 placements were delivered of which only 4 were
    // distinct, and the whole-model ask afterwards served 20 against this
    // model's true 16.
    //
    // What is pinned vs reasoned, stated plainly: this pins the pump's
    // serialisation, which is where the corruption lives. It does NOT force
    // the specific interleaving of a pump call against a whole-model ask —
    // that composes with the same lock, but it cannot be forced here
    // because InMemoryStepByteStore resolves its reads within a microtask,
    // so an in-test pump call finishes before the ask's leading
    // event-loop yield returns. Against a real store, whose prefetch spans
    // many tasks, that overlap is ordinary.
    const api = new IfcAPI()

    await api.Init()

    const reference = await bufferedRetainingReference( api, ifcFixture )

    expect( reference.length ).toBeGreaterThan( 0 )

    const ownedID = await api.OpenModelStream(
        new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

    const delivered: Placement[] = []

    const collect = ( mesh: FlatMesh ): void => {
      delivered.push( ...placements( mesh ) )
    }

    // Both issued before either is awaited: the second enters while the
    // first is suspended on its prefetch.
    const [ firstCall, secondCall ] = await Promise.all( [
      api.ExtractGeometryBatchAsync( ownedID, BATCH, collect ),
      api.ExtractGeometryBatchAsync( ownedID, BATCH, collect ),
    ] )

    // The second call must have advanced PAST the first rather than
    // repeating it, so the two together cover twice one batch's work.
    expect( secondCall.remaining )
        .toBeLessThan( firstCall.remaining )

    // ...and nothing was delivered twice.
    const deliveredKeys = asSortedKeys( delivered )

    expect( deliveredKeys.length ).toBe( new Set( deliveredKeys ).size )

    // Finish the drain and ask for the whole model: a duplicated extraction
    // or a cursor that moved backward both show up here as a served set
    // that no longer matches the model's true content.
    await drainAsync( api, ownedID )

    expect( asSortedKeys( await streamAllAsync( api, ownedID ) ) )
        .toEqual( asSortedKeys( reference ) )
  }, 240000 )

  test( 'total eviction throws rather than serving an empty model',
      async () => {

        // conway#657's budget tests, moved onto the windowed path: eviction
        // DELETES the mesh from the store, so the re-walk resolves nothing
        // for that scene node, parks it, and the placement is absent from
        // the rebuilt map rather than sitting in it with a dead handle.
        // Nothing about that is different when the SOURCE is windowed — the
        // walk reads the geometry store, never the source — and these two
        // tests are what makes "nothing different" a checked claim.
        const api = new IfcAPI()

        await api.Init()

        const ownedID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

        // One byte: nothing survives a pump call, so by the end of the drain
        // the model's whole geometry store has been evicted.
        expect( api.SetGeometryBudget( ownedID, 1 / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( 1 )

        const delivered = await drainAsync( api, ownedID )

        // The pump still DELIVERED — the copy window is intact, this is a
        // model that streamed correctly and then lost its natives — so the
        // rejection below is about the late ask, not a broken load.
        expect( delivered.length ).toBeGreaterThan( 0 )

        await expect( streamAllAsync( api, ownedID ) )
            .rejects.toThrow( /STREAMING_CONSUMER/ )

        // ...and it names what it could not resolve, rather than reporting
        // the "0 instance(s) across 0 entit(ies)" a filter-based count did.
        await expect( streamAllAsync( api, ownedID ) )
            .rejects.toThrow( /[1-9][0-9]* placed instance\(s\) unresolved/ )
      }, 240000 )

  test( 'partial eviction serves what survived and reports the exact loss',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        // The unevicted anchor: what the same windowed ask returns when
        // nothing was evicted. Without it "served fewer" is unanchored.
        const wholeID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

        await drainAsync( api, wholeID )

        const whole = await streamAllAsync( api, wholeID )

        expect( whole.length ).toBeGreaterThan( 0 )

        const ownedID = await api.OpenModelStream(
            new InMemoryStepByteStore( ifcFixture ), DEFERRED_OWNED )

        // 2 KiB binds on this fixture without evicting everything.
        expect( api.SetGeometryBudget( ownedID, 2048 / BYTES_PER_MIB )
            ?.budgetBytes ).toBe( 2048 )

        await drainAsync( api, ownedID )

        const { served: partial, logged } =
          await streamAllAsyncCapturingLogs( api, ownedID )

        // Partial loss is a warning, not a throw: something is still there
        // to hand back, and refusing to hand it back would be worse than the
        // silence this contract is fixing.
        expect( partial.length ).toBeGreaterThan( 0 )
        expect( partial.length ).toBeLessThan( whole.length )

        // The warning is the ONLY thing that tells a consumer it received a
        // partial model, so assert both that the line exists and that the
        // number in it is the REAL loss. `served === whole - unresolved` is
        // an identity: a warning that reported any other number would fail
        // here even though the served set is unchanged, which is what makes
        // this pin the reporting rather than the serving. It also pins that
        // the async entry point names ITSELF in the line, not the sync one.
        const warned = logged.find( ( line ) =>
          line.includes(
              'StreamAllMeshesAsync re-walked a STREAMING_CONSUMER' ) )

        expect( warned ).toBeDefined()

        const reported =
          /(\d+) placed instance\(s\) could not be resolved/.exec( warned! )

        expect( reported ).not.toBeNull()

        const unresolved = Number( reported![ 1 ] )

        expect( unresolved ).toBeGreaterThan( 0 )
        expect( partial.length ).toBe( whole.length - unresolved )
      }, 240000 )
} )
