/**
 * A Node `worker_threads` pool for the sharded index build — **bench
 * transport, not shipped code** (#394 M2, conway#624).
 *
 * This lives in `scripts/` deliberately. It is the transport that
 * `sharded_index_report.mjs` drives to produce the speedup numbers in
 * `design/new/parallel-load-pipeline.md` §3.5a, and nothing else uses it.
 * It is not published (the package ships `compiled/**`, and this is neither
 * compiled nor under `src/`), it is not in any export barrel, and no test
 * runs it — Jest matches `compiled/**\/*.test.js` only.
 *
 * ---------------------------------------------------------------------------
 * Known unfixed defects. Read this before trusting it with anything.
 * ---------------------------------------------------------------------------
 * Its lifecycle has a class of bug that five review findings have now hit,
 * all the same shape: **a transition that leaves a promise unresolved or an
 * invariant unrecorded.** Three were fixed while it was still in `src/`
 * (a dead worker returned to the pool; a job left pending because
 * `terminate()` emits `exit` rather than `error`; a failed replacement not
 * recorded, so a later claim hung). Two are known and **not** fixed:
 *
 *  - `terminate()` can resolve while an eviction is still inside
 *    `spawnWarmWorker`, so a replacement is born after the call that was
 *    supposed to have cleaned everything up. It is retired when it lands, so
 *    nothing leaks permanently — but `terminate()` is not a quiescence
 *    barrier, despite reading like one.
 *  - The same window makes `terminate()` racing a replacement unordered in
 *    general.
 *
 * Neither matters for a benchmark that spawns a pool, runs it, and exits.
 * Both would matter in a load path. **Whoever promotes this to `src/` owns
 * the state-machine pass first** — see the issue linked from conway#624.
 *
 * ---------------------------------------------------------------------------
 * What it is for
 * ---------------------------------------------------------------------------
 * `ShardRunner` in `src/step/parsing/sharded_index_builder.ts` is the real
 * contract; this is one bench-grade implementation of it. The builder's
 * default runner is `inProcessShardRunner`, which has no workers and no
 * lifecycle at all, so none of the defects above are reachable from anything
 * the package exports.
 *
 * **The pool is warm before the clock that matters starts.** Each worker
 * imports the engine and answers `ready` before it is given any work. On a
 * 31 MB model the imports alone cost more than the parse, so a pool spawned
 * per build reads as "sharding is slower than not sharding" (0.47–0.73 s of
 * spawn on the measured corpus, reported separately as the cold-wall
 * column).
 *
 * **This file is both the pool and the worker entry.** The worker is spawned
 * against this module's own URL and the bottom of the file serves jobs when
 * loaded in that role — one file, so the two halves of the protocol cannot
 * drift apart. The role check is on `workerData`, not just `isMainThread`,
 * so being imported inside somebody else's worker does not turn this into a
 * shard server.
 *
 * The four scalar columns cross `postMessage` as **transfers** — zero copy.
 * The retained inline/complex entries cannot: they are nested plain objects
 * and are structured-cloned, which is the term that decides whether sharding
 * pays on an inline-heavy model (D3D: 720,661 of them — §3.6).
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

import { FileDescriptorByteSource } from '../compiled/src/step/parsing/byte_source_node.js'
import { buildIndexShardRange } from '../compiled/src/step/parsing/sharded_index_builder.js'


/** Marks `workerData` as ours rather than another framework's. */
const SHARD_WORKER_ROLE = 'conway-step-index-shard'


/**
 * A warm pool of shard workers. Spawn it once, hand {@link runner} to
 * `buildColumnarIndexShardedAsync`, and {@link terminate} it when done.
 */
export class NodeShardWorkerPool {

  /**
   * @param {object[]} workers Every worker in the pool, warm.
   * @param {object} spawnData The data every worker was spawned with.
   */
  constructor( workers, spawnData ) {
    this.workers_ = workers
    this.idle_ = [ ...workers ]
    this.waiting_ = []
    this.spawnData_ = spawnData
    this.failure_ = void 0
    this.retiring_ = new Set()
  }

  /**
   * Spawn `workerCount` workers and resolve once every one has imported the
   * engine — see the module comment for why that is not left to the first
   * job.
   *
   * @param {object} options `{filePath, poolBytes, workerCount,
   * parserModuleUrl, parserExport}`.
   * @return {Promise<NodeShardWorkerPool>} A warm pool.
   */
  static async spawn( options ) {

    const data = {
      role: SHARD_WORKER_ROLE,
      filePath: options.filePath,
      poolBytes: options.poolBytes,
      parserModuleUrl: options.parserModuleUrl,
      parserExport: options.parserExport,
    }

    const spawning = []

    for ( let index = 0; index < options.workerCount; ++index ) {
      spawning.push( spawnWarmWorker( data ) )
    }

    return new NodeShardWorkerPool( await Promise.all( spawning ), data )
  }

  /**
   * The runner to hand `buildColumnarIndexShardedAsync`. Jobs beyond the
   * worker count queue rather than oversubscribing the box.
   *
   * @return {Function} The runner.
   */
  get runner() {

    return async ( job ) => {

      const worker = await this.claim_()

      let outcome

      try {
        outcome = await runJob( worker, job )
      } catch ( thrown ) {
        // NOT a `finally` release: a job rejects because the worker died, so
        // handing it back would give a later shard a worker that can never
        // answer.
        await this.evict_( worker )
        throw thrown
      }

      this.release_( worker )

      return outcome
    }
  }

  /**
   * Terminate every worker.
   *
   * See the module comment: this can resolve while an eviction is still
   * spawning a replacement, so it is a teardown request rather than a
   * quiescence barrier.
   *
   * @return {Promise<void>} Resolves when the known workers are gone.
   */
  async terminate() {

    this.failure_ ??= new Error( 'shard worker pool terminated' )

    while ( this.waiting_.length > 0 ) {
      this.waiting_.shift()?.reject( this.failure_ )
    }

    await Promise.all( this.workers_.splice( 0 ).map( ( worker ) =>
      worker.terminate().then( () => void 0, () => void 0 ) ) )

    await Promise.all( [ ...this.retiring_ ] )
  }

  /**
   * How many workers the pool currently holds.
   *
   * @return {number} Live worker count.
   */
  get size() {
    return this.workers_.length
  }

  /**
   * Take an idle worker, waiting if every one of them is busy.
   *
   * @return {Promise<object>} An idle worker.
   */
  claim_() {

    if ( this.failure_ !== void 0 ) {
      return Promise.reject( this.failure_ )
    }

    const idle = this.idle_.pop()

    if ( idle !== void 0 ) {
      return Promise.resolve( idle )
    }

    return new Promise( ( resolve, reject ) => {
      this.waiting_.push( { resolve, reject } )
    } )
  }

  /**
   * Retire a worker that failed a job and put a fresh one in its place.
   *
   * If the replacement cannot be spawned there is no worker to give anyone,
   * so queued waiters are rejected rather than left pending — a hung claim
   * never reaches the coordinator's fallback at all.
   *
   * @param {object} worker The worker to retire.
   * @return {Promise<void>} Resolves once replaced or the pool is down.
   */
  async evict_( worker ) {

    this.retire_( worker )

    let replacement

    try {
      replacement = await spawnWarmWorker( this.spawnData_ )
    } catch ( thrown ) {

      const error = thrown instanceof Error ? thrown : new Error( String( thrown ) )

      this.failure_ ??= error

      while ( this.waiting_.length > 0 ) {
        this.waiting_.shift()?.reject( error )
      }

      return
    }

    this.workers_.push( replacement )
    this.release_( replacement )
  }

  /**
   * Hand a worker back — to the longest-waiting claimant if there is one.
   *
   * @param {object} worker The worker that just finished.
   */
  release_( worker ) {

    // Closed while this worker was busy, or while its replacement was still
    // spawning: pooling it would leak a live thread nothing terminates.
    if ( this.failure_ !== void 0 ) {
      this.retire_( worker )
      return
    }

    const waiter = this.waiting_.shift()

    if ( waiter !== void 0 ) {
      waiter.resolve( worker )
      return
    }

    this.idle_.push( worker )
  }

  /**
   * Drop a worker from the pool and terminate it.
   *
   * @param {object} worker The worker to retire.
   */
  retire_( worker ) {

    const at = this.workers_.indexOf( worker )

    if ( at >= 0 ) {
      this.workers_.splice( at, 1 )
    }

    const retiring = worker.terminate()
        .then( () => void 0, () => void 0 )
        .finally( () => {
          this.retiring_.delete( retiring )
        } )

    this.retiring_.add( retiring )
  }
}


/**
 * Spawn one worker against this module and wait for it to import the engine.
 *
 * @param {object} data What the worker is told at spawn.
 * @return {Promise<object>} A warm worker.
 */
function spawnWarmWorker( data ) {

  return new Promise( ( resolve, reject ) => {

    const worker = new Worker( new URL( import.meta.url ), { workerData: data } )

    worker.once( 'message', ( message ) => {

      if ( message.kind === 'ready' ) {
        resolve( worker )
        return
      }

      reject( new Error(
          `shard worker failed to start: ${message.error ?? message.kind}` ) )
    } )

    worker.once( 'error', reject )
  } )
}


/**
 * Send one job to a warm worker and await its shard.
 *
 * @param {object} worker The worker to run it.
 * @param {object} job The shard job.
 * @return {Promise<object>} What the shard produced.
 */
function runJob( worker, job ) {

  return new Promise( ( resolve, reject ) => {

    /** Drop every listener, so a worker outliving this job settles nothing. */
    const cleanup = () => {
      worker.off( 'message', onMessage )
      worker.off( 'error', onError )
      worker.off( 'exit', onExit )
    }

    const onMessage = ( message ) => {
      cleanup()
      resolve( {
        shard: message.shard,
        stopOffset: message.stopOffset,
        stop: message.stop,
        result: message.result,
        error: message.error,
        slides: message.slides,
        bytesRead: message.bytesRead,
        maxRecordLen: message.maxRecordLen,
      } )
    }

    const onError = ( thrown ) => {
      cleanup()
      reject( thrown )
    }

    // `worker.terminate()` on a worker with a job in flight emits `exit`,
    // NOT `error`; without this the job's promise stays pending forever.
    const onExit = ( code ) => {
      cleanup()
      reject( new Error(
          `shard worker exited (code ${code}) before returning shard ` +
          `${job.index}` ) )
    }

    worker.on( 'message', onMessage )
    worker.on( 'error', onError )
    worker.on( 'exit', onExit )
    worker.postMessage( { kind: 'job', job } )
  } )
}


/**
 * Resolve the parser instance a worker was told to use.
 *
 * @param {object} data The worker's spawn data.
 * @return {Promise<object>} The parser singleton.
 */
async function resolveParser( data ) {

  const module_ = await import( data.parserModuleUrl )

  const holder = data.parserExport !== void 0 ?
    module_[ data.parserExport ] : module_.default

  const instance = holder?.Instance

  if ( instance === void 0 ) {
    throw new Error(
        `${data.parserModuleUrl} has no ` +
        `${data.parserExport ?? 'default'} export with a static Instance` )
  }

  return instance
}


/**
 * Serve shard jobs on this worker until it is terminated. Opens the model
 * per job and closes it again, so a pool held across loads holds no file
 * descriptors between them.
 *
 * @param {object} data This worker's spawn data.
 * @return {Promise<void>} Resolves once the job handler is installed.
 */
async function serveShardJobs( data ) {

  const port = parentPort

  if ( port === null ) {
    throw new Error( 'shard worker has no parent port' )
  }

  let parser

  try {
    parser = await resolveParser( data )
  } catch ( thrown ) {
    port.postMessage( {
      kind: 'failed',
      error: thrown instanceof Error ? thrown.message : String( thrown ),
    } )
    return
  }

  port.on( 'message', ( message ) => {

    if ( message.kind !== 'job' ) {
      return
    }

    const source = FileDescriptorByteSource.open( data.filePath )

    let outcome

    try {
      outcome = buildIndexShardRange(
          source,
          parser,
          message.job.startOffset,
          message.job.endOffset,
          data.poolBytes )
    } finally {
      source.close()
    }

    const shard = outcome.shard

    port.postMessage(
        {
          kind: 'result',
          index: message.job.index,
          stopOffset: outcome.stopOffset,
          stop: outcome.stop,
          result: outcome.result,
          error: outcome.error,
          slides: outcome.slides,
          bytesRead: outcome.bytesRead,
          maxRecordLen: outcome.maxRecordLen,
          shard,
        },
        [
          shard.address.buffer,
          shard.length.buffer,
          shard.typeID.buffer,
          shard.expressID.buffer,
        ] )
  } )

  port.postMessage( { kind: 'ready' } )
}


// Worker entry. The role check keeps this inert when the module is merely
// imported inside somebody else's worker thread.
if ( !isMainThread && workerData?.role === SHARD_WORKER_ROLE ) {

  serveShardJobs( workerData ).catch( ( thrown ) => {
    parentPort?.postMessage( {
      kind: 'failed',
      error: thrown instanceof Error ? thrown.message : String( thrown ),
    } )
  } )
}
