/**
 * Serial vs sharded index build, over the SHIPPED builder (#394 M2).
 *
 * This is the measurement half of `src/step/parsing/sharded_index_builder.ts`
 * and `shard_worker_pool_node.mjs`: it imports the compiled library rather
 * than reimplementing it, so a number quoted from here is a number about the
 * code that ships. (Its ancestor, `scripts/index_shard_spike.mjs`, carried
 * its own copy of the shard and merge logic — that was the point of a spike
 * and is exactly what this replaces.)
 *
 * Every row is gated on **byte-identity** with the single-threaded build:
 * `compareIndexColumns` over all four columns plus the partition scalars and
 * `complexEntries`, and a SHA-256 over the same bytes so a run can be quoted
 * as one number. A row that is not byte-identical is reported as FAIL and
 * its timing is meaningless.
 *
 * Two things the output separates rather than blends, because blending them
 * is how a sharded build gets oversold:
 *
 *  - **warm wall vs cold wall.** Warm is boundary scan + shards + merge with
 *    the pool already spawned; cold adds the spawn. A production sharder
 *    holds the pool across loads, so warm is the honest steady-state number
 *    and cold is the honest first-load one. Both are printed.
 *  - **the forced N=1 row.** The shipped builder DELEGATES to the serial
 *    builder at N=1 (see the module comment), so a "sharded N=1" row would
 *    otherwise just be the serial row again. This harness therefore drives
 *    one shard through the worker path explicitly to price the machinery —
 *    it is a measurement, not something any caller can reach.
 *
 * Usage:
 *   node --max-old-space-size=8192 scripts/sharded_index_report.mjs \
 *     [--shards 1,2,4] [--repeats 1] [--pool 16] [--parser ifc|ap214] \
 *     [--json out.json] <model>
 */
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'

const HERE = path.dirname( fileURLToPath( import.meta.url ) )
const COMPILED = path.join( HERE, '..', 'compiled' )

const BYTES_PER_MB = 1024 * 1024
const DEFAULT_POOL_MB = 16
const PERCENT = 100


/**
 * Import one compiled module.
 *
 * @param {string} relative Path under `compiled/`.
 * @return {Promise<object>} The module.
 */
function load( relative ) {
  return import( pathToFileURL( path.join( COMPILED, relative ) ).href )
}


/**
 * SHA-256 over the four columns plus the partition scalars — computed over
 * exactly the bytes the equality gate compares, so the digest and the gate
 * cannot disagree.
 *
 * @param {object} columns The columnar index.
 * @return {string} Hex digest.
 */
function digestColumns( columns ) {

  const hash = createHash( 'sha256' )

  hash.update( `${columns.count}:${columns.firstInlineElement}:` +
    `${columns.expressIdsSorted}:${columns.complexEntries?.size ?? 0}` )

  for ( const column of [ 'address', 'length', 'typeID', 'expressID' ] ) {
    const view = columns[ column ]

    hash.update( new Uint8Array( view.buffer, view.byteOffset, view.byteLength ) )
  }

  return hash.digest( 'hex' )
}


/**
 * Read a `--flag value` pair out of argv.
 *
 * @param {string[]} argv The arguments.
 * @param {string} name Flag name.
 * @param {string|undefined} fallback Default.
 * @return {string|undefined} The value.
 */
function flag( argv, name, fallback ) {
  const at = argv.indexOf( name )

  return at >= 0 ? argv[ at + 1 ] : fallback
}


/**
 * Entry point.
 *
 * @return {Promise<void>} Resolves when the report is written.
 */
async function main() {

  const argv = process.argv.slice( 2 )
  const VALUED = [ '--shards', '--repeats', '--pool', '--json', '--parser' ]

  const shardCounts =
    flag( argv, '--shards', '1,2,4' ).split( ',' ).map( Number )
  const repeats = Number( flag( argv, '--repeats', '1' ) )
  const poolBytes =
    Number( flag( argv, '--pool', String( DEFAULT_POOL_MB ) ) ) * BYTES_PER_MB
  const jsonOut = flag( argv, '--json', void 0 )

  const file = argv.find( ( argument, at ) =>
    !argument.startsWith( '--' ) && !VALUED.includes( argv[ at - 1 ] ) )

  if ( file === void 0 ) {
    console.error(
        'usage: sharded_index_report.mjs [--shards 1,2,4] [--repeats 1] ' +
        '[--pool 16] [--parser ifc|ap214] [--json out.json] <model>' )
    process.exit( 2 )
  }

  const parserKind = flag( argv, '--parser',
      /\.(?:step|stp)$/i.test( file ) ? 'ap214' : 'ifc' )
  const parserModule = parserKind === 'ap214' ?
    'src/AP214E3_2010/ap214_step_parser.js' : 'src/ifc/ifc_step_parser.js'

  const { FileDescriptorByteSource } =
    await load( 'src/step/parsing/byte_source_node.js' )
  const parsingBufferModule = await load( 'src/parsing/parsing_buffer.js' )
  const ParsingBuffer = parsingBufferModule.default
  const { buildColumnarIndexStreaming } =
    await load( 'src/step/parsing/streaming_index_builder.js' )
  const {
    buildColumnarIndexShardedAsync,
    compareIndexColumns,
    mergeIndexShards,
  } = await load( 'src/step/parsing/sharded_index_builder.js' )
  // Bench transport, and deliberately a sibling script rather than a
  // shipped module — see its header. `ShardRunner` in the builder is the
  // contract; this is one bench-grade implementation of it.
  const { NodeShardWorkerPool } =
    await import( './shard_worker_pool_node.mjs' )
  const parserExports = await load( parserModule )

  const parser = parserExports.default.Instance
  const parserModuleUrl =
    pathToFileURL( path.join( COMPILED, parserModule ) ).href

  const fileSize = fs.statSync( file ).size
  const dataStart = dataBlockStart( file, fileSize, parser, ParsingBuffer )

  console.log(
      `model    ${file}  ${( fileSize / BYTES_PER_MB ).toFixed( 1 )} MB ` +
      `(${parserKind})` )
  console.log(
      `host     ${os.cpus().length} cpus, loadavg ` +
      `${os.loadavg().map( ( value ) => value.toFixed( 2 ) ).join( '/' )}, ` +
      `pool=${poolBytes / BYTES_PER_MB} MB` )

  // Single-threaded reference, through the production sink and builder.
  const referenceRuns = []
  let reference

  for ( let repeat = 0; repeat < repeats; ++repeat ) {

    const source = FileDescriptorByteSource.open( file )
    const started = performance.now()

    const built = buildColumnarIndexStreaming( source, parser, poolBytes )

    referenceRuns.push( performance.now() - started )
    source.close()
    reference ??= built.columns
  }

  const referenceMs = Math.min( ...referenceRuns )
  const referenceDigest = digestColumns( reference )
  const inlineRows = reference.count - reference.firstInlineElement

  console.log( '' )
  console.log(
      `reference (serial buildColumnarIndexStreaming)\n` +
      `  wall ${referenceMs.toFixed( 0 )} ms  rows=${reference.count} ` +
      `top-level=${reference.firstInlineElement} inline=${inlineRows} ` +
      `(${( PERCENT * inlineRows / reference.count ).toFixed( 3 )} %)\n` +
      `  complexEntries=${reference.complexEntries?.size ?? 0} ` +
      `expressIdsSorted=${reference.expressIdsSorted}\n` +
      `  digest ${referenceDigest}` )

  const rows = []

  for ( const shardCount of shardCounts ) {

    let best

    for ( let repeat = 0; repeat < repeats; ++repeat ) {

      const run = await measure(
          {
            file,
            fileSize,
            dataStart,
            shardCount,
            poolBytes,
            parser,
            parserModuleUrl,
            FileDescriptorByteSource,
            NodeShardWorkerPool,
            buildColumnarIndexShardedAsync,
            mergeIndexShards,
          } )

      if ( best === void 0 || run.warmMs < best.warmMs ) {
        best = run
      }
    }

    const failures = compareIndexColumns( best.columns, reference )
    const digest = digestColumns( best.columns )

    const worstShard = Math.max( ...best.perShardMs )
    // Shard-only efficiency, the quantity comparable to the design doc's
    // 0.935: how close N shards come to N× the work of one, measured on the
    // slowest shard (the wall the others wait on) against the serial parse.
    const efficiency = referenceMs / ( worstShard * shardCount )

    console.log( '' )
    console.log(
        `N=${shardCount}${best.forced ? ' (shard path forced — see header)' : ''}` +
        `  warm wall ${best.warmMs.toFixed( 0 )} ms ` +
        `(slowest shard ${Math.max( ...best.perShardMs, 0 ).toFixed( 0 )} + ` +
        `boundary/merge/transfer ${best.overheadMs.toFixed( 0 )})  ` +
        `speedup ${( referenceMs / best.warmMs ).toFixed( 2 )}x` )
    console.log(
        `      cold wall ${( best.warmMs + best.spawnMs ).toFixed( 0 )} ms ` +
        `(pool spawn ${best.spawnMs.toFixed( 0 )} ms on top)  ` +
        `speedup ${( referenceMs / ( best.warmMs + best.spawnMs ) ).toFixed( 2 )}x` )
    console.log(
        `      per-shard ms ${best.perShardMs
            .map( ( value ) => value.toFixed( 0 ) ).join( ', ' )}  ` +
        `worst ${worstShard.toFixed( 0 )}  shard-only efficiency ` +
        `${efficiency.toFixed( 3 )}` )
    console.log(
        `      seam repairs ${best.seamRepairs}  ` +
        `fellBackToSerial ${best.fellBackToSerial}` +
        `${best.fallbackReason !== void 0 ? ` (${best.fallbackReason})` : ''}` )
    console.log(
        `      equivalence: ${failures.length === 0 ?
          'PASS — byte-identical' : 'FAIL'}  digest ${digest}` )

    for ( const failure of failures ) {
      console.log( `        ${failure}` )
    }

    rows.push( {
      shardCount,
      forced: best.forced,
      warmMs: best.warmMs,
      spawnMs: best.spawnMs,
      overheadMs: best.overheadMs,
      perShardMs: best.perShardMs,
      efficiency,
      seamRepairs: best.seamRepairs,
      fellBackToSerial: best.fellBackToSerial,
      fallbackReason: best.fallbackReason,
      speedup: referenceMs / best.warmMs,
      equivalent: failures.length === 0,
      failures,
      digest,
    } )
  }

  if ( jsonOut !== void 0 ) {

    fs.writeFileSync( jsonOut, `${JSON.stringify( {
      file,
      fileSize,
      poolBytes,
      repeats,
      loadavg: os.loadavg(),
      cpus: os.cpus().length,
      reference: {
        ms: referenceMs,
        runs: referenceRuns,
        count: reference.count,
        firstInlineElement: reference.firstInlineElement,
        inlineFraction: inlineRows / reference.count,
        complexEntries: reference.complexEntries?.size ?? 0,
        expressIdsSorted: reference.expressIdsSorted,
        digest: referenceDigest,
      },
      shards: rows,
    }, null, 2 )}\n` )

    console.log( `\nwrote ${jsonOut}` )
  }
}


/**
 * Locate the data-block start by parsing the header off the front of the
 * file — the same anchor the builder uses, and a true record boundary by
 * construction.
 *
 * @param {string} file The model path.
 * @param {number} fileSize The file size.
 * @param {object} parser The STEP parser.
 * @param {Function} ParsingBuffer The ParsingBuffer constructor.
 * @return {number} Absolute offset of the first record.
 */
function dataBlockStart( file, fileSize, parser, ParsingBuffer ) {

  const HEAD_BYTES = Math.min( BYTES_PER_MB, fileSize )
  const head = Buffer.allocUnsafe( HEAD_BYTES )
  const fd = fs.openSync( file, 'r' )

  fs.readSync( fd, head, 0, HEAD_BYTES, 0 )
  fs.closeSync( fd )

  const input = new ParsingBuffer( new Uint8Array( head ), 0, HEAD_BYTES )
  const [ , result ] = parser.parseHeader( input )

  if ( result !== 0 /* ParseResult.COMPLETE */ ) {
    throw new Error( `header parse did not complete (${result})` )
  }

  return input.cursor
}


/**
 * One sharded run: spawn a warm pool, build, and time the pieces.
 *
 * At N = 1 the shipped coordinator delegates to the serial builder, so this
 * drives the single shard through the worker path directly instead — the
 * only way to price the shard machinery's own overhead, and labelled
 * `forced` in the output so nobody mistakes it for a reachable path.
 *
 * @param {object} context Everything the run needs, including the compiled
 * modules the caller already imported.
 * @return {Promise<object>} Timings and the merged columns.
 */
async function measure( context ) {

  const {
    file, fileSize, dataStart, shardCount, poolBytes, parser, parserModuleUrl,
    FileDescriptorByteSource, NodeShardWorkerPool,
    buildColumnarIndexShardedAsync, mergeIndexShards,
  } = context

  const spawnStarted = performance.now()

  const pool = await NodeShardWorkerPool.spawn( {
    filePath: file,
    poolBytes,
    workerCount: shardCount,
    parserModuleUrl,
  } )

  const spawnMs = performance.now() - spawnStarted

  // Per-shard timing rides on the runner seam: the coordinator calls this,
  // and it calls the pool. Nothing in the library has to know it is being
  // measured.
  const perShardMs = []

  /**
   * The pool's runner with a stopwatch around each job.
   *
   * @param {object} job The shard job.
   * @return {Promise<object>} The shard outcome.
   */
  const timedRunner = async ( job ) => {

    const started = performance.now()
    const outcome = await pool.runner( job )

    perShardMs[ job.index ] = performance.now() - started

    return outcome
  }

  const source = FileDescriptorByteSource.open( file )

  try {

    if ( shardCount === 1 ) {

      const started = performance.now()
      const outcome = await timedRunner(
          { index: 0, startOffset: dataStart, endOffset: fileSize } )
      const columns = mergeIndexShards( [ outcome.shard ] )

      return {
        forced: true,
        warmMs: performance.now() - started,
        spawnMs,
        overheadMs: 0,
        perShardMs,
        seamRepairs: 0,
        fellBackToSerial: false,
        columns,
      }
    }

    const started = performance.now()

    const built = await buildColumnarIndexShardedAsync(
        source, parser, poolBytes, { shardCount, runner: timedRunner } )

    const warmMs = performance.now() - started

    return {
      forced: false,
      warmMs,
      spawnMs,
      // Everything the wall costs beyond the slowest shard: the boundary
      // scan, the merge, and the worker-boundary transfer of the retained
      // entries (the term that decides D3D — design doc 3.6).
      overheadMs: warmMs - Math.max( ...perShardMs, 0 ),
      perShardMs,
      seamRepairs: built.seamRepairs,
      fellBackToSerial: built.fellBackToSerial,
      fallbackReason: built.fallbackReason,
      columns: built.columns,
    }
  } finally {
    source.close()
    await pool.terminate()
  }
}


await main()
