/**
 * Sharded index build (#394 M2): N workers each index a byte range of one
 * STEP file, and the merged result is **byte-identical** to what the
 * single-threaded builder produces.
 *
 * This is the productionised form of `scripts/index_shard_spike.mjs`, whose
 * measurements are recorded in
 * [`design/new/parallel-load-pipeline.md`](../../../design/new/parallel-load-pipeline.md)
 * §3.5. Read §3.5 before changing anything here — in particular the two
 * things that are not obvious and fail silently when got wrong (record
 * boundaries, and the inline range in the merge).
 *
 * ---------------------------------------------------------------------------
 * Opt-in, with the serial builder as the default and the fallback
 * ---------------------------------------------------------------------------
 * Nothing calls this unless it asks for it. {@link
 * buildColumnarIndexShardedAsync} is the only entry point, it shards only
 * when it resolves a shard count above one, and **at N = 1 it delegates
 * straight to {@link buildColumnarIndexStreaming}** — the same function the
 * rest of the engine calls, not a one-shard imitation of it. That delegation
 * is deliberate: it makes the degenerate case exercise the shipped serial
 * path rather than a parallel path pretending to be it, so a regression in
 * this file cannot reach a caller that did not ask for sharding.
 *
 * Anything that stops the sharded build from running — a header that will not
 * parse, a data section with no line-anchored record heads, a shard that
 * fails — falls back to the serial build and **says so** in
 * {@link ShardedColumnarIndexResult.fallbackReason}. A fallback is reported,
 * never silent: a build that quietly took the slow path because the merge is
 * broken is indistinguishable from one that never had a problem.
 *
 * ---------------------------------------------------------------------------
 * Record boundaries: how a shard knows it started in the right place
 * ---------------------------------------------------------------------------
 * A shard must begin on a top-level record boundary, and a naive scan cannot
 * establish that: a `'`-quoted string (with `''` escapes) or a `/* … *\/`
 * comment can contain `";\n#123="`, and nothing local to the scan can tell
 * that apart from a real record head. Worse, a mis-split is silent — the
 * shard simply indexes different records and the merge concatenates them.
 *
 * So the split is a *candidate*, and the candidate is verified rather than
 * trusted:
 *
 * **(a)** {@link findRecordBoundaryCandidate} looks for a line-anchored
 * record head — a `#` starting a line, digits, `=`, whose preceding
 * non-whitespace byte is `;` — and returns the offset just after that `;`.
 * That offset is chosen because it is exactly where the parse loop's own
 * `onRecordBoundary` fires (`step_parser.ts`, top of the record loop, cursor
 * immediately after the previous record's terminating `;`). Identical
 * definitions on both sides make (b) an equality test rather than an
 * approximation.
 *
 * **(b)** Shard *k* stops at the first **true** boundary at or past its end
 * offset and reports it. Shard 0 starts at the data-block start, which is a
 * true boundary by construction (the header parse leaves the cursor there).
 * So:
 *
 *     stop(0) is a true boundary
 *     start(k+1) === stop(k)  ⟹  start(k+1) is a true boundary
 *
 * Checking `stop(k) === start(k+1)` at every seam therefore *establishes*, by
 * induction, that every shard began on a real record boundary and that the
 * union of the shards' record sets is the sequential parse's. A candidate
 * that landed inside a string or a comment cannot satisfy it. On a mismatch
 * the affected shard is re-run from the verified offset and the repair is
 * counted in {@link ShardedColumnarIndexResult.seamRepairs} — the gate never
 * papers over one.
 *
 * ---------------------------------------------------------------------------
 * The merge, and the trap in it
 * ---------------------------------------------------------------------------
 * `StepIndexColumns` is two ranges, not a flat list: `[0,
 * firstInlineElement)` is top-level records in parse order, and
 * `[firstInlineElement, count)` is inline entities in the model's unfold
 * order. Concatenating finished shard columns end to end interleaves the two
 * and destroys both. Concatenating the *inline* ranges per shard is also
 * wrong, and less obviously so: the unfold is breadth-first over the whole
 * retained set, so per-shard unfolds order children differently than one
 * global unfold. It matters in proportion to how inline-heavy the model is —
 * 20.995 % of D3D's rows, 0.594 % of PSB's.
 *
 * {@link mergeIndexShards} therefore concatenates only the top-level ranges,
 * re-keys every retained entry by its merged localID, and runs ONE global
 * unfold — through `unfoldInlineEntities`, the same function
 * `ColumnarIndexSink.assemble_` uses, so the two cannot drift.
 */
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ByteSource } from './byte_source'
import {
  ColumnarIndexSink,
  StepIndexColumns,
  StepIndexShard,
  cloneIndexEntry,
  unfoldInlineEntities,
  writeInlineRows,
} from './columnar_index'
import StepParser, {
  ParseResult,
  StepHeader,
  StepIndexEntry,
} from './step_parser'
import {
  StreamingColumnarIndexResult,
  buildColumnarIndexStreaming,
} from './streaming_index_builder'


/** ASCII bytes the boundary scan tests for. */
const ASCII_HASH = 0x23
const ASCII_TAB = 0x09
const ASCII_NEWLINE = 0x0a
const ASCII_RETURN = 0x0d
const ASCII_SPACE = 0x20
const ASCII_ZERO = 0x30
const ASCII_NINE = 0x39
const ASCII_SEMICOLON = 0x3b
const ASCII_EQUALS = 0x3d

/** Bytes the boundary scan reads at a time when hunting over a source. */
// eslint-disable-next-line no-magic-numbers
const BOUNDARY_SCAN_CHUNK = 256 * 1024

/**
 * Overlap between boundary-scan windows. Must exceed the longest record
 * head (`#`, digits, whitespace, `=`) so a head straddling a chunk edge is
 * still seen whole, and it is also how far the scan starts BEFORE its target
 * so the backward walk for the preceding `;` has bytes to walk.
 */
// eslint-disable-next-line no-magic-numbers
const BOUNDARY_SCAN_OVERLAP = 4 * 1024

/**
 * Ceiling on the derived shard count. The measurements behind this only
 * reach N = 4 (§3.5); beyond that the merge and the worker-boundary transfer
 * grow while the parse term shrinks, so a larger cap would be extrapolation.
 * An explicit `shardCount` is honoured above it — this bounds the *derived*
 * value only.
 */
export const MAX_DERIVED_SHARD_COUNT = 8

/**
 * Data bytes a derived shard must be worth. Below this the fixed costs —
 * spawning or waking a worker, the boundary scan, the merge — dominate the
 * parse they are splitting. MB-Khaya (31 MB) still gained 1.88× at N = 4,
 * i.e. ~8 MB per shard pays; 4 MB is the conservative floor under that, and
 * it makes anything under 8 MB build serially.
 */
// eslint-disable-next-line no-magic-numbers
export const MIN_BYTES_PER_SHARD = 4 * 1024 * 1024

/**
 * Floor on the shard window, mirroring the serial builder's own so a
 * pathologically small pool still holds a record with slide headroom.
 */
// eslint-disable-next-line no-magic-numbers
const MIN_WINDOW = 4 * 1024

/**
 * Head bytes read to parse the header and locate the data-block start.
 * A header larger than this reports as a header that did not parse and
 * falls back to the serial builder, which grows its window until the header
 * fits — so the outcome is the right index by the slower route, not a
 * failure. The corpus's largest header is a few kilobytes.
 */
// eslint-disable-next-line no-magic-numbers
const HEADER_SCAN_BYTES = 1024 * 1024


/**
 * Why one shard's parse stopped.
 */
export enum ShardStop {

  /**
   * It reached the first true record boundary at or past its end offset —
   * the expected outcome for every shard but the last.
   */
  BOUNDARY,

  /**
   * It ran to the data section's `ENDSEC` — the expected outcome for the
   * last shard, and a wrong-start symptom for any other.
   */
  END_OF_DATA,

  /**
   * The parse returned a non-`COMPLETE` result or threw. Not necessarily a
   * defect: a shard handed a false boundary candidate starts mid-record and
   * fails exactly like this, which is what the seam gate then repairs.
   */
  FAILED,
}


/** One shard of work: a byte range of the data section. */
export interface ShardJob {

  /** Ordinal in file order, 0-based. */
  readonly index: number

  /** Absolute offset to begin parsing at (believed to be a boundary). */
  readonly startOffset: number

  /** Absolute offset to stop at or after. */
  readonly endOffset: number
}


/** What one shard produced, plus what the seam gate needs to judge it. */
export interface ShardOutcome<TypeIDType extends number> {

  /** The shard's unassembled columns and retained entries. */
  readonly shard: StepIndexShard<TypeIDType>

  /** Absolute offset the parse stopped at — the seam gate's left side. */
  readonly stopOffset: number

  /** Why it stopped. */
  readonly stop: ShardStop

  /** The parse result, when the parse returned one rather than throwing. */
  readonly result?: ParseResult

  /** The thrown message, when it threw. */
  readonly error?: string

  /** Window slides this shard performed. */
  readonly slides: number

  /** Bytes this shard read from its source. */
  readonly bytesRead: number

  /** Largest top-level record this shard saw, in bytes. */
  readonly maxRecordLen: number
}


/**
 * Runs one shard job somewhere — in this thread, in a worker, in a process,
 * in a browser Worker. **This is the transport contract**, and it is
 * deliberately the only thing this module knows about parallelism: the
 * coordinator never touches the runner's byte source, which is why a job
 * carries byte offsets and nothing else. A worker opens its own source from
 * whatever it was configured with.
 *
 * Two implementations exist, and neither is a peer of the other:
 *
 * - {@link inProcessShardRunner} is the **default and the only one that
 *   ships**. It runs shards one after another in this thread — correct, no
 *   faster than the serial build, and with no worker lifecycle at all, so
 *   none of a pool's failure modes are reachable through it.
 * - `scripts/shard_worker_pool_node.mjs` is a **bench-grade** Node
 *   `worker_threads` pool. It is what produces the speedup numbers in
 *   `design/new/parallel-load-pipeline.md` §3.5a, it is not published, and
 *   its header lists lifecycle defects that are known and unfixed. Read it
 *   as a reference implementation of this contract, not as a component to
 *   depend on; promoting it into `src/` means owning that lifecycle first.
 *
 * A caller wanting real parallelism supplies its own runner. Anything that
 * can move `ShardJob` offsets out and a {@link ShardOutcome} back satisfies
 * it — the builder is indifferent to how.
 */
export type ShardRunner<TypeIDType extends number> =
  ( job: ShardJob ) => Promise<ShardOutcome<TypeIDType>>


/** Options for {@link buildColumnarIndexShardedAsync}. */
export interface ShardedIndexOptions<TypeIDType extends number> {

  /**
   * Exact shard count. Honoured as given (clamped only to ≥ 1), bypassing
   * both the parallelism derivation and {@link MIN_BYTES_PER_SHARD} — tests
   * need to force N shards over a 20 KB fixture. Omit it to derive one.
   */
  readonly shardCount?: number

  /**
   * Ceiling on the DERIVED shard count. Default
   * {@link MAX_DERIVED_SHARD_COUNT}.
   */
  readonly maxShardCount?: number

  /**
   * Where shards run. Default: in this thread, one after another — correct,
   * and no faster than the serial build. Parallelism comes from supplying a
   * runner backed by workers; see {@link ShardRunner} for the contract and
   * for why the Node pool that measures this lives in `scripts/`.
   */
  readonly runner?: ShardRunner<TypeIDType>

  /**
   * Fall back to the serial build when the sharded one cannot proceed,
   * rather than throwing. Default true. The reason is always reported.
   */
  readonly fallbackToSerial?: boolean
}


/** A sharded build's result: the serial builder's, plus how it was built. */
export interface ShardedColumnarIndexResult<TypeIDType extends number>
  extends StreamingColumnarIndexResult<TypeIDType> {

  /**
   * Shards actually used, which can be FEWER than the count requested: a
   * file with fewer usable record-boundary split points than shards
   * collapses rather than failing. 1 means the serial path ran.
   */
  shardCount: number

  /** Seams whose candidate was rejected and whose shard was re-run. */
  seamRepairs: number

  /** True when the serial builder produced this result. */
  fellBackToSerial: boolean

  /** Why the fallback happened, when it did. */
  fallbackReason?: string
}


/**
 * Whether a byte is STEP whitespace for boundary purposes.
 *
 * @param value The byte.
 * @return {boolean} True for space, tab, CR or LF.
 */
function isSpace( value: number ): boolean {
  return value === ASCII_SPACE || value === ASCII_TAB ||
    value === ASCII_NEWLINE || value === ASCII_RETURN
}


/**
 * Whether a byte is an ASCII digit.
 *
 * @param value The byte.
 * @return {boolean} True for 0-9.
 */
function isDigit( value: number ): boolean {
  return value >= ASCII_ZERO && value <= ASCII_NINE
}


/**
 * Find a **candidate** top-level record boundary at or after `target`.
 *
 * Returns the offset just after the `;` that terminates the record preceding
 * a line-anchored `#<digits>=` head — the same point the parser's own
 * `onRecordBoundary` reports, which is what makes the seam gate an equality
 * test.
 *
 * This is a candidate and nothing more. A quoted string or a block comment
 * containing `";\n#123="` produces a false positive and no local scan can
 * tell; callers must verify with the seam gate rather than trust it (see the
 * module comment).
 *
 * @param bytes The file, or a window containing `[target, limit)`.
 * @param target Offset to search from.
 * @param limit Exclusive end of the search.
 * @return {number} The candidate offset, or −1 if none was found.
 */
export function findRecordBoundaryCandidate(
    bytes: Uint8Array, target: number, limit: number ): number {

  for ( let where = Math.max( target, 1 ); where < limit; ++where ) {

    if ( bytes[ where ] !== ASCII_HASH ) {
      continue
    }

    // Line-anchored: only spaces or tabs between the previous newline and
    // here. A `#` mid-line is an entity reference, not a record head.
    let back = where - 1

    while ( back >= 0 &&
      ( bytes[ back ] === ASCII_SPACE || bytes[ back ] === ASCII_TAB ) ) {
      --back
    }

    if ( back < 0 || bytes[ back ] !== ASCII_NEWLINE ) {
      continue
    }

    // `#` <digits> ws* `=`
    let ahead = where + 1

    while ( ahead < limit && isDigit( bytes[ ahead ] ) ) {
      ++ahead
    }

    if ( ahead === where + 1 ) {
      continue
    }

    while ( ahead < limit && isSpace( bytes[ ahead ] ) ) {
      ++ahead
    }

    if ( ahead >= limit || bytes[ ahead ] !== ASCII_EQUALS ) {
      continue
    }

    // The previous non-whitespace byte must be the previous record's `;`.
    let prior = back

    while ( prior >= 0 && isSpace( bytes[ prior ] ) ) {
      --prior
    }

    if ( prior < 0 || bytes[ prior ] !== ASCII_SEMICOLON ) {
      continue
    }

    return prior + 1
  }

  return -1
}


/**
 * {@link findRecordBoundaryCandidate} over a {@link ByteSource}, reading a
 * window at a time so the file never has to be resident. Windows overlap by
 * {@link BOUNDARY_SCAN_OVERLAP} so a record head straddling a chunk edge is
 * still seen whole, and the scan starts one overlap BEFORE `target` so the
 * backward look for the preceding `;` has bytes to walk.
 *
 * @param source The byte source.
 * @param target Offset to search from.
 * @return {number} The candidate offset, or −1 if none was found.
 */
export function findRecordBoundaryInSource(
    source: ByteSource, target: number ): number {

  const sourceBytes = source.byteLength
  const window = new Uint8Array( BOUNDARY_SCAN_CHUNK )

  for ( let base = Math.max( 0, target - BOUNDARY_SCAN_OVERLAP );
    base < sourceBytes;
    base += BOUNDARY_SCAN_CHUNK - BOUNDARY_SCAN_OVERLAP ) {

    const got = source.read( base, BOUNDARY_SCAN_CHUNK, window, 0 )

    if ( got <= 0 ) {
      return -1
    }

    const from = Math.max( 0, target - base )
    const found = findRecordBoundaryCandidate( window, from, got )

    // A hit inside the trailing overlap may be an artefact of the chunk edge
    // (the forward `#<digits>=` check could have been truncated), so let the
    // next, overlapping window decide it instead.
    if ( found >= 0 &&
      ( base + got >= sourceBytes || found < got - BOUNDARY_SCAN_OVERLAP ) ) {
      return base + found
    }
  }

  return -1
}


/** Thrown out of the parse to stop a shard at its end boundary. */
class ShardComplete extends Error {

  /**
   * @param stopOffset The absolute offset the shard stopped at.
   */
  constructor( public readonly stopOffset: number ) {
    super( 'shard complete' )
  }
}


/**
 * Index one byte range of a STEP source into a {@link ColumnarIndexSink} and
 * hand back its unassembled shard.
 *
 * This is `buildIndexStreaming`'s moving window with two changes, both
 * forced by sharding: the parse starts at an arbitrary absolute offset
 * (`ParsingBuffer.rebaseWindow` is what keeps `address` file-absolute)
 * instead of after a header parse, and it stops at the first record boundary
 * at or past `endOffset` instead of at `ENDSEC`. The window slide and the
 * parse loop are the serial builder's, unchanged.
 *
 * There is deliberately **no grow-and-restart** here. The serial builder can
 * double its window and re-run from byte zero; a shard cannot, because a
 * restart would also have to re-derive its start boundary. A record larger
 * than half the window is therefore reported as a failed shard, which the
 * caller turns into a serial fallback rather than a wrong index. The corpus's
 * largest STEP record is ~25 KB against a 16 MB window.
 *
 * @param source The byte source.
 * @param parser The STEP parser (typed to the schema).
 * @param startOffset Absolute offset to begin at — a record boundary.
 * @param endOffset Absolute offset to stop at or after.
 * @param pool Window size in bytes.
 * @return {ShardOutcome} The shard, where it stopped, and why.
 */
export function buildIndexShardRange<TypeIDType extends number>(
    source: ByteSource,
    parser: StepParser<TypeIDType>,
    startOffset: number,
    endOffset: number,
    pool: number ): ShardOutcome<TypeIDType> {

  const sourceBytes = source.byteLength
  const windowBytes = Math.max( pool, MIN_WINDOW )
  const window = new Uint8Array( windowBytes )

  let windowStartFile = startOffset
  let windowLen = source.read( startOffset, windowBytes, window, 0 )
  let bytesRead = windowLen

  const input = new ParsingBuffer( window, 0, windowLen )

  // Make `address` file-absolute from the first byte. The parse records
  // `input.address`, which is `cursor - initialOffset`, so a window opening
  // at `startOffset` needs that as its address base. The serial builder gets
  // this for free because its first window begins at file offset 0.
  input.rebaseWindow( window, 0, windowLen, windowStartFile )

  const slideThreshold = windowBytes >> 1
  const sink = new ColumnarIndexSink<TypeIDType>()

  let slides = 0
  let maxRecordLen = 0
  let prevBoundaryFile = startOffset
  let stopOffset = -1

  const onRecordBoundary = ( buffer: ParsingBuffer ): void => {

    const cursor = buffer.cursor
    const recordFileStart = windowStartFile + cursor

    const recordLen = recordFileStart - prevBoundaryFile

    if ( recordLen > maxRecordLen ) {
      maxRecordLen = recordLen
    }

    prevBoundaryFile = recordFileStart

    // This shard's records end here — and this is the offset the seam gate
    // compares against the next shard's start.
    if ( recordFileStart >= endOffset ) {
      throw new ShardComplete( recordFileStart )
    }

    if ( windowStartFile + windowLen >= sourceBytes ) {
      return
    }

    if ( cursor < slideThreshold ) {
      return
    }

    const tail = windowLen - cursor

    window.copyWithin( 0, cursor, windowLen )

    const want = windowBytes - tail
    const got = source.read( windowStartFile + windowLen, want, window, tail )

    bytesRead += got
    windowLen = tail + got
    windowStartFile = recordFileStart

    buffer.rebaseWindow( window, 0, windowLen, windowStartFile )

    ++slides
  }

  let stop: ShardStop
  let result: ParseResult | undefined
  let error: string | undefined

  try {

    const [ , parseResult ] = parser.parseDataBlockStreamed(
        input, onRecordBoundary, void 0, void 0, sink )

    result = parseResult
    stop = parseResult === ParseResult.COMPLETE ?
      ShardStop.END_OF_DATA : ShardStop.FAILED

  } catch ( thrown ) {

    if ( thrown instanceof ShardComplete ) {

      stopOffset = thrown.stopOffset
      stop = ShardStop.BOUNDARY

    } else {

      // A shard that started inside a record — a false boundary candidate —
      // can throw out of the parse rather than return SYNTAX_ERROR. That is
      // a DETECTED wrong start, not a crash: keep what it indexed, report
      // the throw, and let the seam gate reject and repair it.
      error = thrown instanceof Error ? thrown.message : String( thrown )
      stop = ShardStop.FAILED
    }
  }

  if ( stopOffset < 0 ) {
    // Ran to ENDSEC, to a parse error, or threw. Wherever the cursor landed
    // is the stop offset; the seam gate decides whether that is a legitimate
    // end or a wrong start.
    stopOffset = windowStartFile + input.cursor

    const lastRecordLen = stopOffset - prevBoundaryFile

    if ( lastRecordLen > maxRecordLen ) {
      maxRecordLen = lastRecordLen
    }
  }

  return {
    shard: sink.packShard(),
    stopOffset,
    stop,
    result,
    error,
    slides,
    bytesRead,
    maxRecordLen,
  }
}


/**
 * A {@link ShardRunner} that runs every shard in this thread, one after
 * another, over one byte source.
 *
 * Correctness without parallelism: the merge, the seam gate and the shard
 * parse are all exercised, and the wall-clock is the serial build's plus the
 * merge. This is the default so that asking for shards never *requires* a
 * worker runtime, and it is what the equivalence test drives.
 *
 * @param source The byte source every shard reads.
 * @param parser The STEP parser (typed to the schema).
 * @param pool Window size in bytes.
 * @return {ShardRunner} The runner.
 */
export function inProcessShardRunner<TypeIDType extends number>(
    source: ByteSource,
    parser: StepParser<TypeIDType>,
    pool: number ): ShardRunner<TypeIDType> {

  return ( job: ShardJob ) => Promise.resolve(
      buildIndexShardRange(
          source, parser, job.startOffset, job.endOffset, pool ) )
}


/**
 * How many shards to build with.
 *
 * An explicit `shardCount` wins outright — that is the testing and
 * benchmarking seam, and clamping it to the byte floor would make an N-shard
 * test over a 20 KB fixture impossible to write. Otherwise the count is
 * derived from the host's reported parallelism, capped by
 * {@link MAX_DERIVED_SHARD_COUNT} and by {@link MIN_BYTES_PER_SHARD} of
 * actual data — and it is **1 whenever parallelism is unknown**, so an
 * environment that does not report it gets the serial builder rather than a
 * guess.
 *
 * @param dataBytes Bytes in the data section (file size minus the header).
 * @param options The caller's options.
 * @return {number} The shard count, at least 1.
 */
export function resolveShardCount<TypeIDType extends number>(
    dataBytes: number,
    options: ShardedIndexOptions<TypeIDType> = {} ): number {

  if ( options.shardCount !== void 0 ) {
    return Math.max( 1, Math.floor( options.shardCount ) )
  }

  const cap = options.maxShardCount ?? MAX_DERIVED_SHARD_COUNT
  const byBytes = Math.floor( dataBytes / MIN_BYTES_PER_SHARD )

  return Math.max(
      1, Math.min( availableParallelism(), cap, byBytes ) )
}


/**
 * The host's reported hardware parallelism, or 1 when it does not report
 * any. `navigator.hardwareConcurrency` is the one spelling both browsers and
 * Node (≥ 21) answer, which is why it is read off `globalThis` rather than
 * through a Node import this module must not have.
 *
 * @return {number} Usable parallelism, at least 1.
 */
function availableParallelism(): number {

  const concurrency =
    ( globalThis as { navigator?: { hardwareConcurrency?: number } } )
        .navigator?.hardwareConcurrency

  return typeof concurrency === 'number' && concurrency >= 1 ?
    Math.floor( concurrency ) : 1
}


/**
 * Merge shards, in file order, into one {@link StepIndexColumns}.
 *
 * Reproduces `ColumnarIndexSink.assemble_` over merged inputs. Three things
 * make it more than a concatenation, each of which fails silently:
 *
 * - the top-level ranges concatenate, but the inline range is rebuilt by one
 *   **global** unfold over all shards' retained entries in merged-localID
 *   order (a per-shard unfold orders children differently);
 * - `expressID` is sized to the top-level count, not to `count`;
 * - `expressIdsSorted` has to carry the previous shard's last express ID
 *   across each seam, because each shard's own scan restarts from 0 and is
 *   blind to a descent that happens exactly at a boundary.
 *
 * @param shards The shards, in file order.
 * @return {StepIndexColumns} The merged index.
 */
export function mergeIndexShards<TypeIDType extends number>(
    shards: readonly StepIndexShard<TypeIDType>[] ): StepIndexColumns<TypeIDType> {

  let topLevel = 0

  for ( const shard of shards ) {
    topLevel += shard.topLevelCount
  }

  // Retained entries re-keyed to merged localIDs. Insertion order is merged
  // localID ascending — shards are in file order and each shard's own list is
  // in its localID order — which is the order the unfold has to see.
  const retained = new Map<number, StepIndexEntry<TypeIDType>>()

  let base = 0

  for ( const shard of shards ) {

    for ( const [ localID, entry ] of shard.retained ) {
      retained.set( base + localID, entry )
    }

    base += shard.topLevelCount
  }

  const unfolded = unfoldInlineEntities( retained.values() )
  const count = topLevel + unfolded.length

  const address = new Uint32Array( count )
  const length = new Uint32Array( count )
  const typeID = new Int32Array( count )
  const expressID = new Uint32Array( topLevel )

  let row = 0

  for ( const shard of shards ) {
    address.set( shard.address, row )
    length.set( shard.length, row )
    typeID.set( shard.typeID, row )
    expressID.set( shard.expressID, row )
    row += shard.topLevelCount
  }

  writeInlineRows( unfolded, topLevel, address, length, typeID )

  let complexEntries: Map<number, StepIndexEntry<TypeIDType>> | undefined

  for ( const [ localID, entry ] of retained ) {
    if ( entry.multiMapping !== void 0 ) {
      ( complexEntries ??= new Map() ).set(
          localID, cloneIndexEntry( entry ) as StepIndexEntry<TypeIDType> )
    }
  }

  return {
    address,
    length,
    typeID,
    expressID,
    count,
    firstInlineElement: topLevel,
    complexEntries,
    expressIdsSorted: mergeExpressIdsSorted( shards ),
  }
}


/**
 * Re-derive the non-decreasing-express-ID verdict across the seams.
 *
 * Each shard's own flag restarts its scan from `previousExpressID = 0`, so
 * a shard cannot see a descent that happens at a boundary — the last express
 * ID of shard *k* against the first of shard *k+1*. Empty shards carry no
 * express IDs and are skipped rather than resetting the carry.
 *
 * @param shards The shards, in file order.
 * @return {boolean} True if express IDs are non-decreasing across the merge.
 */
function mergeExpressIdsSorted<TypeIDType extends number>(
    shards: readonly StepIndexShard<TypeIDType>[] ): boolean {

  let previous = 0

  for ( const shard of shards ) {

    if ( !shard.expressIdsSorted ) {
      return false
    }

    if ( shard.topLevelCount === 0 ) {
      continue
    }

    if ( shard.expressID[ 0 ] < previous ) {
      return false
    }

    previous = shard.expressID[ shard.topLevelCount - 1 ]
  }

  return true
}


/**
 * Compare two columnar indices field by field, reporting the FIRST
 * difference in each column. A mismatch count is useless for diagnosis; the
 * first differing row, and which range it falls in, is not.
 *
 * The column comparison is a byte compare of the backing buffers first — a
 * 20 M-row column decides in milliseconds — and only walks elements when
 * that has already said they differ.
 *
 * @param candidate The index under test.
 * @param reference The index it must equal.
 * @return {string[]} One line per difference; empty means byte-identical.
 */
export function compareIndexColumns<TypeIDType extends number>(
    candidate: StepIndexColumns<TypeIDType>,
    reference: StepIndexColumns<TypeIDType> ): string[] {

  const failures: string[] = []

  for ( const scalar of
    [ 'count', 'firstInlineElement', 'expressIdsSorted' ] as const ) {

    if ( candidate[ scalar ] !== reference[ scalar ] ) {
      failures.push(
          `${scalar}: candidate=${candidate[ scalar ]} ` +
          `reference=${reference[ scalar ]}` )
    }
  }

  for ( const column of
    [ 'address', 'length', 'typeID', 'expressID' ] as const ) {

    const left = candidate[ column ]
    const right = reference[ column ]

    if ( left.length !== right.length ) {
      failures.push(
          `${column}.length: candidate=${left.length} ` +
          `reference=${right.length}` )
      continue
    }

    if ( sameBytes( left, right ) ) {
      continue
    }

    for ( let where = 0; where < left.length; ++where ) {

      if ( left[ where ] === right[ where ] ) {
        continue
      }

      const range = where < reference.firstInlineElement ? 'TOP-LEVEL' : 'INLINE'

      failures.push(
          `${column}: first difference at row ${where} ` +
          `(candidate=${left[ where ]} reference=${right[ where ]}); ` +
          `firstInlineElement=${reference.firstInlineElement}, ` +
          `so that row is ${range}` )
      break
    }
  }

  const candidateComplex = candidate.complexEntries
  const referenceComplex = reference.complexEntries
  const candidateSize = candidateComplex?.size ?? 0
  const referenceSize = referenceComplex?.size ?? 0

  if ( candidateSize !== referenceSize ) {

    failures.push(
        `complexEntries.size: candidate=${candidateSize} ` +
        `reference=${referenceSize}` )

  } else if ( referenceComplex !== void 0 ) {

    for ( const [ localID, entry ] of referenceComplex ) {

      const other = candidateComplex?.get( localID )

      if ( other === void 0 ) {
        failures.push( `complexEntries: candidate is missing localID ${localID}` )
        break
      }

      if ( JSON.stringify( other ) !== JSON.stringify( entry ) ) {
        failures.push(
            `complexEntries: localID ${localID} differs\n` +
            `  candidate=${JSON.stringify( other )}\n` +
            `  reference=${JSON.stringify( entry )}` )
        break
      }
    }
  }

  return failures
}


/**
 * Byte-compare two typed arrays' contents.
 *
 * @param left One array.
 * @param right The other, of equal element length.
 * @return {boolean} True if every backing byte matches.
 */
function sameBytes(
    left: Uint32Array | Int32Array, right: Uint32Array | Int32Array ): boolean {

  const leftBytes =
    new Uint8Array( left.buffer, left.byteOffset, left.byteLength )
  const rightBytes =
    new Uint8Array( right.buffer, right.byteOffset, right.byteLength )

  if ( leftBytes.length !== rightBytes.length ) {
    return false
  }

  for ( let where = 0; where < leftBytes.length; ++where ) {
    if ( leftBytes[ where ] !== rightBytes[ where ] ) {
      return false
    }
  }

  return true
}


/**
 * Parse the header off the front of a source and return the data-block
 * start — shard 0's start offset, and the anchor the boundary induction
 * begins from.
 *
 * @param source The byte source.
 * @param parser The STEP parser (typed to the schema).
 * @return {{ header: StepHeader, dataStart: number, result: ParseResult }}
 * The header, where the data block begins, and whether it parsed.
 */
function parseHeaderForShards<TypeIDType extends number>(
    source: ByteSource, parser: StepParser<TypeIDType> ):
    { header: StepHeader, dataStart: number, result: ParseResult } {

  const headBytes = Math.min( HEADER_SCAN_BYTES, source.byteLength )
  const head = new Uint8Array( headBytes )
  const got = source.read( 0, headBytes, head, 0 )

  const input = new ParsingBuffer( head, 0, got )
  const [ header, result ] = parser.parseHeader( input )

  return { header, dataStart: input.cursor, result }
}


/**
 * Build the columnar index by sharding the data section across
 * `shardCount` ranges and merging the results — byte-identical to
 * {@link buildColumnarIndexStreaming}, which is what runs at N = 1 and
 * whenever the sharded build cannot proceed.
 *
 * Read the module comment before changing this: the seam gate is what makes
 * the shards' union the sequential parse's record set, and the merge's
 * global unfold is what makes the inline range match.
 *
 * @param source The byte source. The coordinator reads the header and the
 * boundary candidates from it; shards read through the runner's own sources,
 * which is why a worker runner needs no access to this one.
 * @param parser The STEP parser (typed to the schema).
 * @param pool Target window size in bytes, per shard.
 * @param options Shard count, runner and fallback policy.
 * @return {Promise<ShardedColumnarIndexResult>} Columns, header, result,
 * stats, and how it was built.
 */
export async function buildColumnarIndexShardedAsync<TypeIDType extends number>(
    source: ByteSource,
    parser: StepParser<TypeIDType>,
    pool: number,
    options: ShardedIndexOptions<TypeIDType> = {} ):
    Promise<ShardedColumnarIndexResult<TypeIDType>> {

  const sourceBytes = source.byteLength

  /**
   * Run the serial builder and label the result.
   *
   * @param reason Why the serial path ran, or undefined at N = 1.
   * @return {ShardedColumnarIndexResult} The serial build.
   */
  const serial = ( reason?: string ): ShardedColumnarIndexResult<TypeIDType> => {

    return {
      ...buildColumnarIndexStreaming( source, parser, pool ),
      shardCount: 1,
      seamRepairs: 0,
      fellBackToSerial: reason !== void 0,
      fallbackReason: reason,
    }
  }

  // Decide the shard count BEFORE touching the header, so that N = 1 reaches
  // `serial()` without this function having parsed anything at all. Ordering
  // these the other way round is what made N = 1 observably different from
  // `buildColumnarIndexStreaming`: the shard-only header pre-scan ran first,
  // so a malformed header threw under `fallbackToSerial: false`, and a valid
  // header larger than HEADER_SCAN_BYTES could fail even though the caller's
  // own `pool` would have parsed it. N = 1 is the cheapest correctness
  // guarantee here only if it is *literally* the serial builder.
  //
  // The byte floor is applied to the whole source rather than to the data
  // section, because the header is at most a few kilobytes against a
  // megabyte-scale MIN_BYTES_PER_SHARD and measuring it would cost the very
  // pre-scan this ordering exists to avoid.
  const shardCount = resolveShardCount( sourceBytes, options )

  if ( shardCount <= 1 ) {
    return serial()
  }

  const { header, dataStart, result: headerResult } =
    parseHeaderForShards( source, parser )

  if ( headerResult !== ParseResult.COMPLETE ) {
    // Either a malformed header or one larger than HEADER_SCAN_BYTES. Both
    // go to the serial builder, which reports a malformed header in its own
    // terms and grows its window for an oversized one, rather than this
    // inventing a second spelling of either.
    return failOrFallback(
        options, `header did not parse (result ${headerResult})`, serial )
  }

  const starts = [ dataStart ]

  for ( let shard = 1; shard < shardCount; ++shard ) {

    const target =
      dataStart + Math.floor( ( sourceBytes - dataStart ) * shard / shardCount )
    const candidate = findRecordBoundaryInSource( source, target )

    // Two ways a split target yields nothing usable, and both mean "this
    // file supports fewer shards than were asked for" rather than "this file
    // cannot be sharded": no line-anchored record head at or after the
    // target (−1), or one that does not advance past the previous start
    // (records coarser than the split spacing — routine on small files).
    // Collapsing to fewer shards is strictly better than giving up, so skip
    // the split. Falling back is decided below, on the collapsed count.
    if ( candidate > starts[ starts.length - 1 ] ) {
      starts.push( candidate )
    }
  }

  // Nothing to split on anywhere. This is the known limit of the
  // line-anchored candidate scan — a data section written without newlines —
  // and it fails loudly into the serial build rather than splitting wrongly.
  if ( starts.length < 2 ) {
    return failOrFallback(
        options,
        `no usable record-boundary candidate for any of the ` +
        `${shardCount - 1} split points`,
        serial )
  }

  const ends = starts.slice( 1 )

  ends.push( sourceBytes )

  const run = options.runner ?? inProcessShardRunner( source, parser, pool )

  // A runner REJECTS on the failures most likely to happen for real: a
  // worker that crashes or exits, a transport error, an I/O failure opening
  // the model in a worker. Those have to reach the same policy as every
  // other failure — an unhandled rejection out of `Promise.all` would sail
  // straight past `fallbackToSerial`, which is exactly the guarantee this
  // module claims. Both the initial dispatch and the seam-repair re-runs are
  // inside the guard, because a repair runs a shard again and can reject the
  // same way.
  let outcomes: ShardOutcome<TypeIDType>[]
  let seamRepairs = 0

  try {

    outcomes = await Promise.all(
        starts.map( ( startOffset, index ) =>
          run( { index, startOffset, endOffset: ends[ index ] } ) ) )

    seamRepairs = await repairSeams( outcomes, starts, ends, run )

  } catch ( thrown ) {

    const detail = thrown instanceof Error ? thrown.message : String( thrown )

    return failOrFallback(
        options, `a shard runner failed: ${detail}`, serial, thrown )
  }

  const failure = describeShardFailure( outcomes )

  if ( failure !== void 0 ) {
    return failOrFallback( options, failure, serial )
  }

  const columns = mergeIndexShards( outcomes.map( ( outcome ) => outcome.shard ) )

  let slides = 0
  let bytesRead = 0
  let maxRecordLen = 0

  for ( const outcome of outcomes ) {
    slides += outcome.slides
    bytesRead += outcome.bytesRead
    maxRecordLen = Math.max( maxRecordLen, outcome.maxRecordLen )
  }

  return {
    header,
    columns,
    result: ParseResult.COMPLETE,
    stats: {
      pool,
      windowBytes: Math.max( pool, MIN_WINDOW ),
      slides,
      maxRecordLen,
      bytesRead,
    },
    // The count actually used, which is `starts.length` — a requested count
    // collapses when the file has fewer usable split points than shards.
    shardCount: starts.length,
    seamRepairs,
    fellBackToSerial: false,
  }
}


/**
 * Run the seam gate left to right, repairing any shard whose start was a
 * false boundary candidate.
 *
 * `stop(k) === start(k+1)` at every seam proves, from the header-anchored
 * `start(0)`, that every shard began on a true record boundary. Left to
 * right matters: a repair changes that shard's own stop offset, and it is
 * the repaired value the next seam has to be checked against.
 *
 * Mutates `outcomes` and `starts` in place. Extracted from the coordinator
 * so the repair re-runs sit inside the same rejection guard as the initial
 * dispatch — a repair calls the runner again and can reject the same way.
 *
 * @param outcomes The shard outcomes, in file order.
 * @param starts Each shard's start offset, in file order.
 * @param ends Each shard's end offset, in file order.
 * @param run The shard runner.
 * @return {Promise<number>} How many seams needed a repair.
 */
async function repairSeams<TypeIDType extends number>(
    outcomes: ShardOutcome<TypeIDType>[],
    starts: number[],
    ends: readonly number[],
    run: ShardRunner<TypeIDType> ): Promise<number> {

  let seamRepairs = 0

  for ( let seam = 0; seam + 1 < outcomes.length; ++seam ) {

    const stop = outcomes[ seam ].stopOffset

    if ( stop === starts[ seam + 1 ] ) {
      continue
    }

    ++seamRepairs
    starts[ seam + 1 ] = stop
    outcomes[ seam + 1 ] = await run(
        { index: seam + 1, startOffset: stop, endOffset: ends[ seam + 1 ] } )
  }

  return seamRepairs
}


/**
 * Name the first shard that did not end the way its position requires: every
 * shard but the last must stop at its boundary, and the last must reach
 * `ENDSEC`. Called after the seam gate, so anything still wrong here is a
 * genuine failure rather than a repairable false candidate.
 *
 * @param outcomes The shard outcomes, in file order.
 * @return {string | undefined} A description, or undefined if all are well.
 */
function describeShardFailure<TypeIDType extends number>(
    outcomes: readonly ShardOutcome<TypeIDType>[] ): string | undefined {

  for ( let index = 0; index < outcomes.length; ++index ) {

    const outcome = outcomes[ index ]
    const last = index === outcomes.length - 1
    const wanted = last ? ShardStop.END_OF_DATA : ShardStop.BOUNDARY

    if ( outcome.stop === wanted ) {
      continue
    }

    const detail = outcome.error !== void 0 ?
      `threw: ${outcome.error}` : `parse result ${outcome.result}`

    return `shard ${index} of ${outcomes.length} stopped as ` +
      `${ShardStop[ outcome.stop ]} (wanted ${ShardStop[ wanted ]}), ${detail}`
  }

  return void 0
}


/**
 * Apply the fallback policy: serial build with the reason recorded, or throw.
 *
 * @param options The caller's options.
 * @param reason Why the sharded build could not proceed.
 * @param serial Runs the serial build with a reason attached.
 * @param cause The underlying error, when there was one — a runner's own
 * rejection, attached so `fallbackToSerial: false` does not lose it.
 * @return {ShardedColumnarIndexResult} The serial build, when falling back.
 */
function failOrFallback<TypeIDType extends number>(
    options: ShardedIndexOptions<TypeIDType>,
    reason: string,
    serial: ( reason?: string ) => ShardedColumnarIndexResult<TypeIDType>,
    cause?: unknown ):
    ShardedColumnarIndexResult<TypeIDType> {

  if ( options.fallbackToSerial === false ) {

    const error = new Error( `sharded index build failed: ${reason}` )

    // `cause` carries the runner's own rejection so a caller that opted out
    // of the fallback still gets the underlying worker error, not just this
    // wrapper's summary of it. Assigned rather than passed to the Error
    // constructor: the two-argument form is ES2022 and this package targets
    // ES2021, so `new Error( message, { cause } )` does not type-check here.
    if ( cause !== void 0 ) {
      ( error as { cause?: unknown } ).cause = cause
    }

    throw error
  }

  return serial( reason )
}
