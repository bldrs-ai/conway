/**
 * A Node `worker_threads` pool for the sharded index build — the transport
 * half of `sharded_index_builder.ts`, kept in its own node-flavoured module
 * the same way `byte_source_node.ts` is the node twin of `byte_source.ts`.
 * Nothing in the builder imports this; a caller that wants real parallelism
 * hands the pool's {@link NodeShardWorkerPool.runner} to
 * `buildColumnarIndexShardedAsync`, and a caller that does not gets the
 * in-process runner and a correct, serial build.
 *
 * **The pool is warm before the clock that matters starts.** Each worker
 * imports the engine and answers `ready` before it is given any work. That
 * ordering is not tidiness: on a 31 MB model the imports alone cost more
 * than the parse, so a pool spawned per build reads as "sharding is slower
 * than not sharding" (0.47–0.73 s of spawn on the measured corpus, reported
 * separately in the design doc's cold-wall column). {@link
 * NodeShardWorkerPool.spawn} pays it once; keep it out of the measured
 * region and out of the load path by holding the pool across loads.
 *
 * **This file is both the pool and the worker entry.** The worker is spawned
 * against this module's own URL and the bottom of the file serves jobs when
 * it is loaded in that role — one file, so the two halves of the protocol
 * cannot drift apart. The role check is on `workerData`, not just on
 * `isMainThread`, so being imported inside somebody else's worker (jest's,
 * for instance) does not turn this module into a shard server.
 *
 * The four scalar columns cross `postMessage` as **transfers** — zero copy.
 * The retained inline/complex entries cannot: they are nested plain objects
 * and are structured-cloned, which is the term that decides whether sharding
 * pays on an inline-heavy model (D3D: 720,661 of them, 1.67 s at N = 4 —
 * `design/new/parallel-load-pipeline.md` §3.6). Packing them flat is the
 * named fix and it is not done here.
 */
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'

import { FileDescriptorByteSource } from './byte_source_node'
import { StepIndexShard } from './columnar_index'
import {
  ShardJob,
  ShardOutcome,
  ShardRunner,
  ShardStop,
  buildIndexShardRange,
} from './sharded_index_builder'
import StepParser, { ParseResult } from './step_parser'


/** Marks `workerData` as ours rather than another framework's. */
const SHARD_WORKER_ROLE = 'conway-step-index-shard'


/** What a worker is told once, at spawn. */
interface ShardWorkerData {

  /** Always {@link SHARD_WORKER_ROLE}. */
  role: string

  /** Model path each shard opens for itself. */
  filePath: string

  /** Window size in bytes, per shard. */
  poolBytes: number

  /**
   * Module the worker imports to get its parser — an absolute `file:` URL or
   * a resolvable specifier for the COMPILED module (e.g.
   * `compiled/src/ifc/ifc_step_parser.js`). Passed in rather than hardcoded
   * because the schema layer is the caller's choice: IFC and AP214 have
   * different parsers over the same shard machinery.
   */
  parserModuleUrl: string

  /**
   * Named export holding the parser class. Defaults to the module's default
   * export. Whatever it resolves to must expose a static `Instance`.
   */
  parserExport?: string
}


/** A shard result on the wire: the outcome, flattened for structured clone. */
interface ShardResultMessage<TypeIDType extends number> {
  kind: 'result'
  index: number
  stopOffset: number
  stop: ShardStop
  result?: ParseResult
  error?: string
  slides: number
  bytesRead: number
  maxRecordLen: number
  shard: StepIndexShard<TypeIDType>
}


/** Options for {@link NodeShardWorkerPool.spawn}. */
export interface NodeShardWorkerPoolOptions {

  /** Model path every worker opens. */
  filePath: string

  /** Window size in bytes, per shard. */
  poolBytes: number

  /** Workers to spawn. */
  workerCount: number

  /** See {@link ShardWorkerData.parserModuleUrl}. */
  parserModuleUrl: string

  /** See {@link ShardWorkerData.parserExport}. */
  parserExport?: string
}


/**
 * A warm pool of shard workers. Spawn it once, hand {@link runner} to
 * `buildColumnarIndexShardedAsync`, and {@link terminate} it when the
 * process is done with it.
 */
export class NodeShardWorkerPool<TypeIDType extends number> {

  /** Workers with no job in flight. */
  private readonly idle_: Worker[]

  /** Waiters for an idle worker, in arrival order. */
  private readonly waiting_: ( ( worker: Worker ) => void )[] = []

  /**
   * @param workers_ Every worker in the pool, warm.
   */
  private constructor( private readonly workers_: Worker[] ) {
    this.idle_ = [ ...workers_ ]
  }

  /**
   * Spawn `workerCount` workers and resolve once every one of them has
   * imported the engine — see the module comment for why that is not left
   * to the first job.
   *
   * @param options Model, window, worker count and parser module.
   * @return {Promise<NodeShardWorkerPool>} A warm pool.
   */
  public static async spawn<TypeIDType extends number>(
      options: NodeShardWorkerPoolOptions ):
      Promise<NodeShardWorkerPool<TypeIDType>> {

    const data: ShardWorkerData = {
      role: SHARD_WORKER_ROLE,
      filePath: options.filePath,
      poolBytes: options.poolBytes,
      parserModuleUrl: options.parserModuleUrl,
      parserExport: options.parserExport,
    }

    const spawning: Promise<Worker>[] = []

    for ( let index = 0; index < options.workerCount; ++index ) {
      spawning.push( spawnWarmWorker( data ) )
    }

    const workers = await Promise.all( spawning )

    return new NodeShardWorkerPool<TypeIDType>( workers )
  }

  /**
   * The runner to hand `buildColumnarIndexShardedAsync`. Jobs beyond the
   * worker count queue rather than oversubscribing the box.
   *
   * @return {ShardRunner} The runner.
   */
  public get runner(): ShardRunner<TypeIDType> {

    return async ( job: ShardJob ): Promise<ShardOutcome<TypeIDType>> => {

      const worker = await this.claim_()

      try {
        return await runJob<TypeIDType>( worker, job )
      } finally {
        this.release_( worker )
      }
    }
  }

  /**
   * Terminate every worker.
   *
   * @return {Promise<void>} Resolves when they are all gone.
   */
  public async terminate(): Promise<void> {
    await Promise.all( this.workers_.map( ( worker ) => worker.terminate() ) )
  }

  /**
   * Take an idle worker, waiting if every one of them is busy.
   *
   * @return {Promise<Worker>} An idle worker.
   */
  private claim_(): Promise<Worker> {

    const idle = this.idle_.pop()

    if ( idle !== void 0 ) {
      return Promise.resolve( idle )
    }

    return new Promise<Worker>( ( resolve ) => {
      this.waiting_.push( resolve )
    } )
  }

  /**
   * Hand a worker back — to the longest-waiting claimant if there is one, so
   * a queued job starts without a trip through the idle list.
   *
   * @param worker The worker that just finished.
   */
  private release_( worker: Worker ): void {

    const waiter = this.waiting_.shift()

    if ( waiter !== void 0 ) {
      waiter( worker )
      return
    }

    this.idle_.push( worker )
  }
}


/**
 * Spawn one worker against this module and wait for it to finish importing
 * the engine.
 *
 * @param data What the worker is told at spawn.
 * @return {Promise<Worker>} A warm worker.
 */
function spawnWarmWorker( data: ShardWorkerData ): Promise<Worker> {

  return new Promise<Worker>( ( resolve, reject ) => {

    const worker = new Worker( new URL( import.meta.url ), { workerData: data } )

    worker.once( 'message', ( message: { kind: string, error?: string } ) => {

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
 * `once` rather than `on` for both listeners, and both are removed by the
 * settle — a worker outlives many jobs, so a listener left behind would
 * resolve somebody else's promise on the next job.
 *
 * @param worker The worker to run it.
 * @param job The shard job.
 * @return {Promise<ShardOutcome>} What the shard produced.
 */
function runJob<TypeIDType extends number>(
    worker: Worker, job: ShardJob ): Promise<ShardOutcome<TypeIDType>> {

  return new Promise<ShardOutcome<TypeIDType>>( ( resolve, reject ) => {

    const onMessage = ( message: ShardResultMessage<TypeIDType> ): void => {
      worker.off( 'error', onError )
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

    const onError = ( thrown: Error ): void => {
      worker.off( 'message', onMessage )
      reject( thrown )
    }

    worker.once( 'message', onMessage )
    worker.once( 'error', onError )
    worker.postMessage( { kind: 'job', job } )
  } )
}


/**
 * Resolve the parser instance a worker was told to use.
 *
 * @param data The worker's spawn data.
 * @return {Promise<StepParser>} The parser singleton.
 */
async function resolveParser<TypeIDType extends number>(
    data: ShardWorkerData ): Promise<StepParser<TypeIDType>> {

  const module_ =
    await import( data.parserModuleUrl ) as Record<string, unknown>

  const holder = data.parserExport !== void 0 ?
    module_[ data.parserExport ] : module_.default

  const instance = ( holder as { Instance?: StepParser<TypeIDType> } )?.Instance

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
 * @param data This worker's spawn data.
 * @return {Promise<void>} Resolves once the job handler is installed.
 */
async function serveShardJobs( data: ShardWorkerData ): Promise<void> {

  const port = parentPort

  if ( port === null ) {
    throw new Error( 'shard worker has no parent port' )
  }

  let parser: StepParser<number>

  try {
    parser = await resolveParser<number>( data )
  } catch ( thrown ) {
    port.postMessage( {
      kind: 'failed',
      error: thrown instanceof Error ? thrown.message : String( thrown ),
    } )
    return
  }

  port.on( 'message', ( message: { kind: string, job: ShardJob } ) => {

    if ( message.kind !== 'job' ) {
      return
    }

    const source = FileDescriptorByteSource.open( data.filePath )

    let outcome: ShardOutcome<number>

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
// imported inside somebody else's worker thread. Not a top-level `await`:
// the tsconfig targets `module: es2020`, which does not allow one, and the
// spawn handshake already waits for `ready` rather than for module
// evaluation.
if ( !isMainThread &&
  ( workerData as ShardWorkerData | null )?.role === SHARD_WORKER_ROLE ) {

  serveShardJobs( workerData as ShardWorkerData ).catch( ( thrown ) => {
    parentPort?.postMessage( {
      kind: 'failed',
      error: thrown instanceof Error ? thrown.message : String( thrown ),
    } )
  } )
}
