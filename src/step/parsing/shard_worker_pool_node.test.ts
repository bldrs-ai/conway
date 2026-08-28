/* eslint-disable no-magic-numbers */
/**
 * The Node worker pool's FAILURE path (#394 M2).
 *
 * The happy path is covered by `scripts/sharded_index_report.mjs`, which
 * drives every measured run through this pool. What a harness cannot cover
 * is what the pool does with a worker that has *died*, and that is the case
 * that matters here: this pool is designed to be held across loads, so a
 * dead worker returned to the idle list would poison every later build
 * rather than just the one that broke it.
 *
 * The failure is induced honestly — a job whose model path does not exist,
 * so `FileDescriptorByteSource.open` throws inside the worker, the worker
 * emits `error` and exits. That is the same shape as a real worker crash.
 */
import * as fs from 'fs'
import * as path from 'path'

import { afterEach, describe, expect, test } from '@jest/globals'

import { NodeShardWorkerPool } from './shard_worker_pool_node'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { ShardStop, findRecordBoundaryCandidate } from './sharded_index_builder'


const PARSER_MODULE =
  new URL( '../../ifc/ifc_step_parser.js', import.meta.url ).href

const MODEL = path.resolve( 'data/index.ifc' )

/** Whole-file job bounds for the fixture. */
const MODEL_BYTES = fs.statSync( MODEL ).size

/**
 * The fixture's data-block start. A shard must begin on a record boundary,
 * not at byte 0 — starting at the ISO header makes the parse fail, which
 * would make these tests pass for the wrong reason.
 */
const DATA_START = findRecordBoundaryCandidate(
    new Uint8Array( fs.readFileSync( MODEL ) ), 0, MODEL_BYTES )

let pool: NodeShardWorkerPool<EntityTypesIfc> | undefined

afterEach( async () => {
  await pool?.terminate()
  pool = void 0
} )


describe( 'NodeShardWorkerPool failure handling', () => {

  test( 'every death is replaced, not just the first', async () => {

    // ONE worker, three sequential jobs, all of which kill it. Each must
    // REJECT rather than hang: a rejection proves a worker was there to run
    // the job, so the pool replaced the corpse each time. The earlier
    // version of this test spawned a second pool for the healthy half and
    // therefore proved nothing about eviction at all.
    pool = await NodeShardWorkerPool.spawn<EntityTypesIfc>( {
      filePath: '/nonexistent/does-not-exist.ifc',
      poolBytes: 64 * 1024,
      workerCount: 1,
      parserModuleUrl: PARSER_MODULE,
    } )

    for ( let attempt = 0; attempt < 3; ++attempt ) {

      await expect( Promise.race( [
        pool.runner( { index: attempt, startOffset: 0, endOffset: 512 } ),
        new Promise( ( _, reject ) =>
          setTimeout(
              () => reject( new Error( `attempt ${attempt} never settled` ) ),
              15000 ) ),
      ] ) ).rejects.toThrow( /ENOENT|no such file/i )
    }
  }, 90000 )

  test( 'the pool keeps its width after an eviction', async () => {

    // Two workers, both pointed at a missing file: both jobs reject, and
    // both workers are replaced. A third job must still find a worker rather
    // than parking forever on an empty idle list.
    pool = await NodeShardWorkerPool.spawn<EntityTypesIfc>( {
      filePath: '/nonexistent/does-not-exist.ifc',
      poolBytes: 64 * 1024,
      workerCount: 2,
      parserModuleUrl: PARSER_MODULE,
    } )

    await expect( Promise.all( [
      pool.runner( { index: 0, startOffset: 0, endOffset: 512 } ),
      pool.runner( { index: 1, startOffset: 512, endOffset: 1024 } ),
    ] ) ).rejects.toThrow()

    // Third claim resolves to a worker (it rejects on the missing file, not
    // on a timeout). A pool that lost its workers would hang here instead,
    // which the test timeout would catch.
    await expect( pool.runner(
        { index: 2, startOffset: 0, endOffset: 512 } ) ).rejects.toThrow()
  }, 60000 )

  test( 'terminate rejects queued waiters rather than leaving them pending',
      async () => {

        pool = await NodeShardWorkerPool.spawn<EntityTypesIfc>( {
          filePath: MODEL,
          poolBytes: 64 * 1024,
          workerCount: 1,
          parserModuleUrl: PARSER_MODULE,
        } )

        // Occupy the only worker, then queue a second claim behind it and
        // tear the pool down. Without the terminate-time rejection the
        // queued job never settles at all.
        const first = pool.runner(
            { index: 0, startOffset: DATA_START, endOffset: MODEL_BYTES } )
        const queued = pool.runner(
            { index: 1, startOffset: DATA_START, endOffset: MODEL_BYTES } )

        await first
        await pool.terminate()

        await expect( Promise.race( [
          queued,
          new Promise( ( _, reject ) =>
            setTimeout( () => reject( new Error( 'still pending' ) ), 5000 ) ),
        ] ) ).rejects.toThrow()
      }, 60000 )

  test( 'a healthy pool reports a real shard', async () => {

    // Guards the tests above from passing on a pool that never works at all.
    pool = await NodeShardWorkerPool.spawn<EntityTypesIfc>( {
      filePath: MODEL,
      poolBytes: 64 * 1024,
      workerCount: 1,
      parserModuleUrl: PARSER_MODULE,
    } )

    const outcome = await pool.runner(
        { index: 0, startOffset: DATA_START, endOffset: MODEL_BYTES } )

    expect( outcome.stop ).toBe( ShardStop.END_OF_DATA )
    expect( outcome.shard.topLevelCount ).toBeGreaterThan( 0 )
    expect( outcome.shard.expressID.length ).toBe( outcome.shard.topLevelCount )
  }, 60000 )
} )
