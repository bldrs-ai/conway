/**
 * Sharded index build — spike (issue #394, M3 measurement item M8, and the
 * boundary-correctness item M7).
 *
 * **A spike, not a product.** Nothing here is wired into `IfcAPI`, the
 * loaders, or any production path. It exists to answer two questions and
 * then be argued about:
 *
 *   1. Can N workers each index a byte range of one STEP file and have the
 *      merged result be **byte-identical** to a single-threaded index of the
 *      same file? (M0 held itself to exactly this bar —
 *      `design/new/streaming-federated-loader.md:329-345`.)
 *   2. What does that actually buy in wall-clock at N = 1, 2, 4?
 *
 * ---------------------------------------------------------------------------
 * Why sharding the INDEX BUILD and not the parse the preview reads
 * ---------------------------------------------------------------------------
 * conway#542 rejected parse sharding, but it measured *preview coverage at
 * equal bytes scanned* — equal CPU, not equal wall-clock. The durable index
 * build has no such objective: nothing needs a contiguous leading prefix,
 * every record is scanned exactly once, and at completion there are no holes.
 * `scripts/layout_report.mjs:41-44` already states this in its own doc
 * comment. The parse→geometry barrier stays exactly where it is; this shards
 * only what happens *before* it.
 *
 * ---------------------------------------------------------------------------
 * Record boundaries: the hard part, and how this proves it rather than
 * assuming it
 * ---------------------------------------------------------------------------
 * A shard must begin on a top-level record boundary. A naive scan for `;` or
 * `#` mis-splits, because a STEP record can contain `'`-quoted strings (with
 * `''` escapes) that hold `;`, `#` and `/*`, and `/* ... *​/` comments that
 * hold anything at all. Worse, a mis-split is *silent*: the shard simply
 * indexes different records, and the merge dutifully concatenates them.
 *
 * Two mechanisms, in order:
 *
 * **(a) Candidate.** `findBoundaryCandidate` looks for a line-anchored record
 * head: a `#` that starts a line, followed by digits and `=`, whose preceding
 * non-whitespace byte is `;`. The boundary it returns is the offset *just
 * after that `;`* — which is exactly where the parse loop's own
 * `onRecordBoundary` fires (`step_parser.ts:860-876`: the callback runs at
 * the top of the record loop, with the cursor sitting immediately after the
 * previous record's terminating `charws(SEMICOLON)`). Same definition on both
 * sides is what makes (b) an equality test rather than an approximation.
 *
 * **(b) Inductive verification — this is the actual proof.** Shard *k* stops
 * at the first *true* boundary at or past its end offset, and reports that
 * offset. Shard 0 starts at the data-block start, which is true by
 * construction (the header parse leaves the cursor there). So:
 *
 *     stop(0) is a true boundary
 *     start(k+1) == stop(k)  ⟹  start(k+1) is a true boundary
 *
 * The gate `stop(k) === start(k+1)` for every k therefore establishes, by
 * induction, that every shard started on a real record boundary and that the
 * union of the shards' record sets is exactly the sequential parse's. A
 * candidate that landed inside a string or a comment cannot satisfy it: the
 * owning shard's real boundary would fall elsewhere. On a mismatch this
 * script does **not** paper over it — it reports the offsets and re-runs the
 * affected shard from the verified offset, counting the repair.
 *
 * ---------------------------------------------------------------------------
 * The merge, and the trap in it
 * ---------------------------------------------------------------------------
 * `StepIndexColumns` is not a flat list. Its rows are two ranges
 * (`columnar_index.ts:8-25`):
 *
 *     [0, firstInlineElement)      top-level records, in parse order
 *     [firstInlineElement, count)  inline entities, in the model's unfold order
 *
 * `firstInlineElement` is a **partition point, not a count**. Concatenating
 * shards' finished columns end-to-end would interleave the two ranges and
 * destroy both. And the inline range cannot be concatenated per-shard either:
 * the unfold is breadth-first over the *whole* retained set (all first-level
 * children of every record, then their children), so per-shard unfolds
 * produce a different order than one global unfold. This matters in
 * proportion to how inline-heavy the model is — measured tonight at
 * **20.995 % of D3D's index**, 0.594 % of PSB's — so a merge that gets it
 * wrong loses or reorders a fifth of D3D and 0.6 % of PSB, which is exactly
 * the kind of difference that hides in a smoke test.
 *
 * So `mergeShards` concatenates only the top-level ranges, re-keys every
 * retained entry by its merged localID, and then runs the *global* unfold and
 * the `complexEntries` clone in one pass — the same algorithm as
 * `ColumnarIndexSink.assemble_`, over merged inputs.
 *
 * Usage:
 *   node --max-old-space-size=8192 scripts/index_shard_spike.mjs \
 *     [--shards 1,2,4] [--repeats 1] [--pool 16] [--no-asyncref] \
 *     [--json out.json] <model>
 *   node scripts/index_shard_spike.mjs --selftest      # adversarial fixtures
 */
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { performance } from 'node:perf_hooks'

const HERE = path.dirname( fileURLToPath( import.meta.url ) )
const COMPILED = path.join( HERE, '..', 'compiled' )

/** Type sentinel for "no concrete type" (columnar_index.ts:58-59). */
const COLUMN_UNDEFINED_TYPE = -1

const ASCII = {
  HASH: 0x23,
  SEMICOLON: 0x3b,
  EQUALS: 0x3d,
  NEWLINE: 0x0a,
  RETURN: 0x0d,
  SPACE: 0x20,
  TAB: 0x09,
  ZERO: 0x30,
  NINE: 0x39,
}


/**
 * Whether a byte is STEP whitespace for boundary purposes.
 *
 * @param {number} b The byte.
 * @return {boolean} True if space, tab, CR or LF.
 */
function isSpace( b ) {
  return b === ASCII.SPACE || b === ASCII.TAB ||
    b === ASCII.NEWLINE || b === ASCII.RETURN
}


/**
 * Whether a byte is an ASCII digit.
 *
 * @param {number} b The byte.
 * @return {boolean} True if 0-9.
 */
function isDigit( b ) {
  return b >= ASCII.ZERO && b <= ASCII.NINE
}


/**
 * Find a candidate top-level record boundary at or after `target`.
 *
 * Returns the offset **just after** the `;` that terminates the record
 * preceding a line-anchored `#<digits>=` head — the same point the parser's
 * own `onRecordBoundary` reports, so the verification gate in
 * {@link buildSharded} is an equality test.
 *
 * This is a *candidate*. It can be fooled: a quoted string or a block comment
 * containing `";\n#123="` produces a false positive, and nothing local to the
 * scan can tell the difference. That is why the caller verifies rather than
 * trusts (see the header comment, and `--selftest`).
 *
 * @param {Uint8Array} bytes The whole file, or a window containing [target, …].
 * @param {number} target Offset to search from.
 * @param {number} limit Exclusive end of the search.
 * @return {number} The candidate boundary offset, or -1 if none was found.
 */
export function findBoundaryCandidate( bytes, target, limit ) {

  for ( let where = Math.max( target, 1 ); where < limit; ++where ) {

    if ( bytes[ where ] !== ASCII.HASH ) {
      continue
    }

    // Line-anchored: only whitespace between the previous newline and here.
    let back = where - 1

    while ( back >= 0 && ( bytes[ back ] === ASCII.SPACE || bytes[ back ] === ASCII.TAB ) ) {
      --back
    }

    if ( back < 0 || bytes[ back ] !== ASCII.NEWLINE ) {
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

    if ( ahead >= limit || bytes[ ahead ] !== ASCII.EQUALS ) {
      continue
    }

    // The previous non-whitespace byte must be the previous record's `;`.
    let prior = back

    while ( prior >= 0 && isSpace( bytes[ prior ] ) ) {
      --prior
    }

    if ( prior < 0 || bytes[ prior ] !== ASCII.SEMICOLON ) {
      continue
    }

    return prior + 1
  }

  return -1
}


/** Window the file scan reads at a time when hunting for a boundary. */
const BOUNDARY_SCAN_CHUNK = 256 * 1024

/** Overlap between scan windows; must exceed the longest record head. */
const BOUNDARY_SCAN_OVERLAP = 4 * 1024


/**
 * {@link findBoundaryCandidate} over a file descriptor, reading a window at a
 * time instead of requiring the file resident. Windows overlap by
 * {@link BOUNDARY_SCAN_OVERLAP} bytes so a record head that straddles a chunk
 * edge is still seen whole; the scan starts one overlap BEFORE the target so
 * the backward look for the preceding `;` has bytes to walk.
 *
 * @param {number} fd An fd open for reading.
 * @param {number} target Offset to search from.
 * @param {number} fileSize The file size.
 * @return {number} The candidate boundary offset, or -1.
 */
export function findBoundaryInFile( fd, target, fileSize ) {

  const buffer = Buffer.allocUnsafe( BOUNDARY_SCAN_CHUNK )

  for ( let base = Math.max( 0, target - BOUNDARY_SCAN_OVERLAP );
    base < fileSize;
    base += BOUNDARY_SCAN_CHUNK - BOUNDARY_SCAN_OVERLAP ) {

    const got = fs.readSync( fd, buffer, 0, BOUNDARY_SCAN_CHUNK, base )

    if ( got <= 0 ) {
      return -1
    }

    const view = new Uint8Array( buffer.buffer, buffer.byteOffset, got )
    const from = Math.max( 0, target - base )
    const found = findBoundaryCandidate( view, from, got )

    // A hit in the last overlap bytes may be an artefact of the chunk edge
    // (the forward `#<digits>=` check could have been truncated), so let the
    // next, overlapping window decide it instead.
    if ( found >= 0 && ( base + got >= fileSize || found < got - BOUNDARY_SCAN_OVERLAP ) ) {
      return base + found
    }
  }

  return -1
}


/** Rows per growth segment, matching ColumnarIndexSink (columnar_index.ts:66). */
const SEGMENT_ROWS = 64 * 1024


/**
 * A minimal {@link StepIndexSink} that keeps top-level rows as chunked
 * typed-array columns plus the retained (inline / multi-mapping) entries, and
 * does **no** assembly. Deliberately not `ColumnarIndexSink`: a shard must
 * not unfold its own inline range (the unfold is global — see the header
 * comment), and an independent implementation makes the byte-identity gate
 * against production's sink a real comparison rather than a tautology.
 *
 * The segmented typed arrays are not a micro-optimisation. The first version
 * of this class pushed into plain JS arrays and converted at `pack()`; on PSB
 * that cost 15.7 % against the single-threaded reference at N=1, i.e. the
 * spike's own bookkeeping, not sharding, was what a reader would have seen in
 * the N=1 row. Production's sink writes into segments for the same reason
 * (columnar_index.ts:60-66), so matching it removes a confound rather than
 * adding a trick.
 */
class ShardSink {

  /** Construct an empty sink. */
  constructor() {
    this.segments = []
    this.count = 0
    this.retained = new Map()
    this.expressIdsSorted = true
    this.previousExpressID = 0
    this.firstExpressID = undefined
    this.lastExpressID = 0
  }

  /**
   * Consume one completed top-level entry. Mirrors
   * `ColumnarIndexSink.pushTopLevel` field for field, including the
   * `typeID === undefined → -1` sentinel and the sorted-express-ID rule.
   *
   * @param {object} entry The completed top-level index entry.
   */
  pushTopLevel( entry ) {

    const localID = this.count++
    const segmentIndex = Math.floor( localID / SEGMENT_ROWS )
    const row = localID % SEGMENT_ROWS

    if ( segmentIndex === this.segments.length ) {
      this.segments.push( {
        address: new Uint32Array( SEGMENT_ROWS ),
        length: new Uint32Array( SEGMENT_ROWS ),
        typeID: new Int32Array( SEGMENT_ROWS ),
        expressID: new Uint32Array( SEGMENT_ROWS ),
      } )
    }

    const segment = this.segments[ segmentIndex ]

    segment.address[ row ] = entry.address
    segment.length[ row ] = entry.length
    segment.typeID[ row ] =
      entry.typeID === void 0 ? COLUMN_UNDEFINED_TYPE : entry.typeID
    segment.expressID[ row ] = entry.expressID

    if ( entry.expressID < this.previousExpressID ) {
      this.expressIdsSorted = false
    }

    this.previousExpressID = entry.expressID
    this.firstExpressID ??= entry.expressID
    this.lastExpressID = entry.expressID

    if ( entry.inlineEntities !== void 0 || entry.multiMapping !== void 0 ) {
      this.retained.set( localID, entry )
    }
  }

  /**
   * Concatenate one column's segments into a single array.
   *
   * @param {string} column Column name.
   * @param {Function} ArrayType Uint32Array or Int32Array.
   * @return {object} The concatenated column.
   */
  concat_( column, ArrayType ) {

    const result = new ArrayType( this.count )

    for ( let segment = 0; segment * SEGMENT_ROWS < this.count; ++segment ) {
      const valid = Math.min( SEGMENT_ROWS, this.count - segment * SEGMENT_ROWS )

      result.set(
          this.segments[ segment ][ column ].subarray( 0, valid ),
          segment * SEGMENT_ROWS )
    }

    return result
  }

  /**
   * Pack into a structured-cloneable payload for the worker boundary.
   *
   * @return {object} Transferable shard result.
   */
  pack() {
    return {
      address: this.concat_( 'address', Uint32Array ),
      length: this.concat_( 'length', Uint32Array ),
      typeID: this.concat_( 'typeID', Int32Array ),
      expressID: this.concat_( 'expressID', Uint32Array ),
      topLevel: this.count,
      retained: [ ...this.retained.entries() ],
      expressIdsSorted: this.expressIdsSorted,
      firstExpressID: this.firstExpressID,
      lastExpressID: this.lastExpressID,
    }
  }
}


/** Thrown out of the parse generator to stop a shard at its end boundary. */
class ShardComplete extends Error {

  /**
   * @param {number} stopOffset The absolute file offset the shard stopped at.
   */
  constructor( stopOffset ) {
    super( 'shard complete' )
    this.stopOffset = stopOffset
  }
}


/**
 * Index one byte range of a STEP file into a {@link ShardSink}.
 *
 * This is `buildIndexStreaming`'s moving window (streaming_index_builder.ts:
 * 88-200) with two changes: the parse starts at an arbitrary absolute offset
 * instead of after a header parse, and it stops at the first record boundary
 * at or past `endOffset` instead of at `ENDSEC`. The window slide, the
 * `rebaseWindow` call that keeps `address` file-absolute, and the parse loop
 * itself are the production ones, untouched.
 *
 * There is no grow-and-restart here: a record larger than half the window is
 * reported as a hard failure rather than silently re-scanned, because in a
 * shard a restart would also have to re-derive the boundary and the spike
 * should say so rather than hide it. The corpus's largest STEP record is
 * ~25 KB against a 16 MB window.
 *
 * @param {object} source A ByteSource over the file.
 * @param {object} parser The STEP parser.
 * @param {number} startOffset Absolute offset to begin at (a record boundary).
 * @param {number} endOffset Absolute offset to stop at or after.
 * @param {number} pool Window size in bytes.
 * @return {object} `{ sink, stopOffset, slides, bytesRead }`.
 */
export function buildIndexShard( source, parser, startOffset, endOffset, pool ) {

  const ParsingBuffer = buildIndexShard.ParsingBuffer
  const fileSize = source.byteLength
  const windowBytes = pool

  const window = new Uint8Array( windowBytes )

  let windowStartFile = startOffset
  let windowLen = source.read( startOffset, windowBytes, window, 0 )
  let bytesRead = windowLen

  const input = new ParsingBuffer( window, 0, windowLen )

  // Make `address` file-absolute from the first byte: the parse records
  // `input.address`, which is `cursor - initialOffset`, so a window that
  // begins at `startOffset` needs that as its address base. Production gets
  // this for free because its first window begins at file offset 0.
  input.rebaseWindow( window, 0, windowLen, windowStartFile )

  const slideThreshold = windowBytes >> 1
  const sink = new ShardSink()

  let slides = 0
  let stopOffset = -1

  const onRecordBoundary = ( buffer ) => {

    const cursor = buffer.cursor
    const recordFileStart = windowStartFile + cursor

    if ( recordFileStart >= endOffset ) {
      throw new ShardComplete( recordFileStart )
    }

    if ( windowStartFile + windowLen >= fileSize ) {
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

  let result
  let error

  try {
    ;[ , result ] =
      parser.parseDataBlockStreamed( input, onRecordBoundary, void 0, void 0, sink )
  } catch ( thrown ) {

    if ( thrown instanceof ShardComplete ) {
      stopOffset = thrown.stopOffset
      result = 'SHARD_STOP'
    } else {
      // A shard that started inside a record (a false boundary candidate) can
      // throw out of the parse rather than return SYNTAX_ERROR. That is a
      // detected wrong start, not a crash: keep whatever it indexed, report
      // the throw, and let the seam gate reject and repair it.
      error = String( thrown && thrown.message ? thrown.message : thrown )
      result = 'THREW'
    }
  }

  if ( stopOffset < 0 ) {
    // Ran to ENDSEC, to a syntax error, or threw. The stop offset is wherever
    // the cursor landed; the seam gate is what decides whether that is a
    // legitimate end or a wrong start.
    stopOffset = windowStartFile + input.cursor
  }

  return { sink, stopOffset, slides, bytesRead, result, error }
}


/**
 * Merge N shard payloads into one {@link StepIndexColumns}.
 *
 * Reproduces `ColumnarIndexSink.assemble_` (columnar_index.ts:207-281) over
 * merged inputs. The three things that make this more than a concatenation:
 *
 *  - the top-level range is concatenated, but the inline range is rebuilt by
 *    one **global** breadth-first unfold over all shards' retained entries in
 *    merged-localID order — a per-shard unfold produces a different order;
 *  - `expressID` is sized to the top-level count only, not to `count`
 *    (columnar_index.ts:247);
 *  - `expressIdsSorted` carries the previous shard's last express ID across
 *    each seam, because each shard's own scan restarts from 0 and so cannot
 *    see a descent that happens at a boundary.
 *
 * @param {object[]} shards Packed shard payloads, in file order.
 * @return {object} The merged columnar index.
 */
export function mergeShards( shards ) {

  let topLevel = 0

  for ( const shard of shards ) {
    topLevel += shard.topLevel
  }

  // Retained entries re-keyed to merged localIDs. Insertion order is merged
  // localID ascending (shards are in file order, and each shard's Map is in
  // its own localID order), which is the order assemble_ unfolds in.
  const retained = new Map()

  let offset = 0

  for ( const shard of shards ) {

    for ( const [ localID, entry ] of shard.retained ) {
      retained.set( offset + localID, entry )
    }

    offset += shard.topLevel
  }

  const unfolded = []

  for ( const entry of retained.values() ) {
    if ( entry.inlineEntities !== void 0 ) {
      unfolded.push( ...entry.inlineEntities )
    }
  }

  for ( let where = 0; where < unfolded.length; ++where ) {

    const inlineEntities = unfolded[ where ].inlineEntities

    if ( inlineEntities !== void 0 ) {
      unfolded.push( ...inlineEntities )
    }
  }

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
    row += shard.topLevel
  }

  for ( let where = 0; where < unfolded.length; ++where ) {

    const entry = unfolded[ where ]
    const at = topLevel + where

    address[ at ] = entry.address
    length[ at ] = entry.length
    typeID[ at ] =
      entry.typeID === void 0 ? COLUMN_UNDEFINED_TYPE : entry.typeID
  }

  let complexEntries

  for ( const [ localID, entry ] of retained ) {
    if ( entry.multiMapping !== void 0 ) {
      ( complexEntries ??= new Map() ).set( localID, cloneIndexEntry( entry ) )
    }
  }

  // Each shard's own sorted flag restarts its scan from previousExpressID = 0,
  // so it is blind to a descent across a seam. Re-derive across the seams.
  let expressIdsSorted = true
  let previous = 0

  for ( const shard of shards ) {

    if ( !shard.expressIdsSorted ) {
      expressIdsSorted = false
      break
    }

    if ( shard.firstExpressID !== void 0 ) {

      if ( shard.firstExpressID < previous ) {
        expressIdsSorted = false
        break
      }

      previous = shard.lastExpressID
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
    expressIdsSorted,
  }
}


/**
 * Clone an index entry down to its persistent fields — the same shape
 * `columnar_index.ts`'s `cloneIndexEntry` produces, so a structural compare
 * against production's `complexEntries` is comparing like with like.
 *
 * @param {object} entry The entry to clone.
 * @return {object} The clone.
 */
function cloneIndexEntry( entry ) {

  const clone = { address: entry.address, length: entry.length }

  if ( entry.typeID !== void 0 ) {
    clone.typeID = entry.typeID
  }

  if ( entry.expressID !== void 0 ) {
    clone.expressID = entry.expressID
  }

  if ( entry.inlineEntities !== void 0 ) {
    clone.inlineEntities = entry.inlineEntities
  }

  if ( entry.multiMapping !== void 0 ) {
    clone.multiMapping = entry.multiMapping.map( cloneIndexEntry )
  }

  return clone
}


/**
 * Compare a merged index against the single-threaded reference, column by
 * column, and report the FIRST difference in each — a count of mismatches is
 * useless for diagnosis, the first differing row is not.
 *
 * @param {object} merged The merged columns.
 * @param {object} reference The reference columns.
 * @return {object} `{ ok, failures[] }`.
 */
export function compareColumns( merged, reference ) {

  const failures = []

  for ( const scalar of [ 'count', 'firstInlineElement', 'expressIdsSorted' ] ) {
    if ( merged[ scalar ] !== reference[ scalar ] ) {
      failures.push(
          `${scalar}: merged=${merged[ scalar ]} reference=${reference[ scalar ]}` )
    }
  }

  for ( const column of [ 'address', 'length', 'typeID', 'expressID' ] ) {

    const a = merged[ column ]
    const b = reference[ column ]

    if ( a.length !== b.length ) {
      failures.push( `${column}.length: merged=${a.length} reference=${b.length}` )
      continue
    }

    // Fast path first: a memcmp over the backing bytes decides equality for a
    // 20 M-row column in milliseconds. Only a difference is worth an
    // element-by-element scan, and then only to name the first differing row.
    const aBytes = Buffer.from( a.buffer, a.byteOffset, a.byteLength )
    const bBytes = Buffer.from( b.buffer, b.byteOffset, b.byteLength )

    if ( aBytes.compare( bBytes ) === 0 ) {
      continue
    }

    let firstDiff = -1

    for ( let i = 0; i < a.length; ++i ) {
      if ( a[ i ] !== b[ i ] ) {
        firstDiff = i
        break
      }
    }

    if ( firstDiff >= 0 ) {
      failures.push(
          `${column}: first difference at row ${firstDiff} ` +
          `(merged=${a[ firstDiff ]} reference=${b[ firstDiff ]}); ` +
          `firstInlineElement=${reference.firstInlineElement} so this row is ` +
          `${firstDiff < reference.firstInlineElement ? 'TOP-LEVEL' : 'INLINE'}` )
    }
  }

  const mergedComplex = merged.complexEntries
  const referenceComplex = reference.complexEntries
  const mergedSize = mergedComplex?.size ?? 0
  const referenceSize = referenceComplex?.size ?? 0

  if ( mergedSize !== referenceSize ) {
    failures.push(
        `complexEntries.size: merged=${mergedSize} reference=${referenceSize}` )
  } else if ( mergedSize > 0 ) {

    for ( const [ localID, entry ] of referenceComplex ) {

      const other = mergedComplex.get( localID )

      if ( other === void 0 ) {
        failures.push( `complexEntries: merged is missing localID ${localID}` )
        break
      }

      if ( JSON.stringify( other ) !== JSON.stringify( entry ) ) {
        failures.push(
            `complexEntries: localID ${localID} differs\n` +
            `      merged=${JSON.stringify( other )}\n` +
            `   reference=${JSON.stringify( entry )}` )
        break
      }
    }
  }

  return { ok: failures.length === 0, failures }
}


/**
 * SHA-256 over the four scalar columns plus the two partition scalars — one
 * number to quote in a report, computed over exactly the bytes the equality
 * gate compares.
 *
 * @param {object} columns The columnar index.
 * @return {string} Hex digest.
 */
export function digestColumns( columns ) {

  const hash = createHash( 'sha256' )

  hash.update( `${columns.count}:${columns.firstInlineElement}:` +
    `${columns.expressIdsSorted}:${columns.complexEntries?.size ?? 0}` )

  for ( const column of [ 'address', 'length', 'typeID', 'expressID' ] ) {
    const view = columns[ column ]

    hash.update( new Uint8Array( view.buffer, view.byteOffset, view.byteLength ) )
  }

  return hash.digest( 'hex' )
}


/* -------------------------------------------------------------------------
 * Worker side
 * ---------------------------------------------------------------------- */

if ( !isMainThread && workerData?.kind === 'shard' ) {

  // Two-phase, so the spike can price the parse without the harness's own
  // startup on top of it: import the engine, say `ready`, and only then wait
  // for a job. On a 31 MB model the imports alone cost more than the parse,
  // which would otherwise read as "sharding is slower than not sharding".
  // A production sharder would keep a warm pool for the same reason —
  // scripts/m3_worker_pool.mjs already does.
  const { FileDescriptorByteSource } =
    await import( path.join( COMPILED, 'src/step/parsing/byte_source_node.js' ) )
  const parserModule =
    await import( path.join( COMPILED, 'src/ifc/ifc_step_parser.js' ) )
  const parsingBufferModule =
    await import( path.join( COMPILED, 'src/parsing/parsing_buffer.js' ) )

  buildIndexShard.ParsingBuffer =
    parsingBufferModule.default ?? parsingBufferModule.ParsingBuffer

  const parser = ( parserModule.default ?? parserModule.IfcStepParser ).Instance

  parentPort.on( 'message', ( job ) => {

    if ( job.kind !== 'job' ) {
      return
    }

    const source = FileDescriptorByteSource.open( job.file )

    const t0 = performance.now()
    const { sink, stopOffset, slides, bytesRead, result, error } =
      buildIndexShard( source, parser, job.start, job.end, job.pool )
    const parseMs = performance.now() - t0

    source.close()

    const tPack = performance.now()
    const packed = sink.pack()
    const packMs = performance.now() - tPack

    parentPort.postMessage(
        {
          kind: 'result',
          index: job.index,
          start: job.start,
          stopOffset,
          slides,
          bytesRead,
          result,
          error,
          ms: parseMs,
          packMs,
          ...packed,
        },
        [ packed.address.buffer, packed.length.buffer,
          packed.typeID.buffer, packed.expressID.buffer ] )
  } )

  parentPort.postMessage( { kind: 'ready' } )
}


/* -------------------------------------------------------------------------
 * Main side
 * ---------------------------------------------------------------------- */

/**
 * Spawn a worker and wait for it to finish importing the engine.
 *
 * @return {Promise<object>} A warm worker, ready for a job.
 */
function spawnWorker() {

  return new Promise( ( resolve, reject ) => {

    const worker = new Worker(
        fileURLToPath( import.meta.url ),
        { workerData: { kind: 'shard' } } )

    worker.once( 'message', ( message ) => {

      if ( message.kind === 'ready' ) {
        resolve( worker )
      } else {
        reject( new Error( `unexpected first message ${message.kind}` ) )
      }
    } )

    worker.once( 'error', reject )
  } )
}


/**
 * Dispatch one shard job to an already-warm worker.
 *
 * @param {object} worker A warm worker.
 * @param {string} file Model path.
 * @param {number} index Shard ordinal.
 * @param {number} start Absolute start offset.
 * @param {number} end Absolute end offset.
 * @param {number} pool Window bytes.
 * @return {Promise<object>} The packed shard result.
 */
function runShardJob( worker, file, index, start, end, pool ) {

  return new Promise( ( resolve, reject ) => {

    worker.once( 'message', resolve )
    worker.once( 'error', reject )
    worker.postMessage( { kind: 'job', file, index, start, end, pool } )
  } )
}


/**
 * Locate the data-block start: parse the header out of the first window and
 * take the cursor the parse left behind. This is a true record boundary by
 * construction, and it is the anchor the induction in the header comment
 * starts from.
 *
 * @param {Uint8Array} head The first bytes of the file.
 * @param {object} parser The STEP parser.
 * @param {Function} ParsingBuffer The ParsingBuffer constructor.
 * @return {number} Absolute offset of the data-block start.
 */
function dataBlockStart( head, parser, ParsingBuffer ) {

  const input = new ParsingBuffer( head, 0, head.length )
  const [ , headerResult ] = parser.parseHeader( input )

  if ( headerResult !== 0 /* ParseResult.COMPLETE */ ) {
    throw new Error( `header parse did not complete (${headerResult})` )
  }

  return input.cursor
}


/**
 * Build the index in N shards, verify the partition, and merge.
 *
 * @param {string} file Model path.
 * @param {number} shardCount Number of shards.
 * @param {number} pool Window bytes.
 * @param {number} dataStart Data-block start offset.
 * @param {number} fileSize The file size in bytes.
 * @return {Promise<object>} Timings, the merged columns and the gate result.
 */
async function buildSharded( file, shardCount, pool, dataStart, fileSize ) {

  const tBoundaries = performance.now()
  const starts = [ dataStart ]
  const fd = fs.openSync( file, 'r' )

  try {

    for ( let k = 1; k < shardCount; ++k ) {

      const target =
        dataStart + Math.floor( ( fileSize - dataStart ) * k / shardCount )
      const candidate = findBoundaryInFile( fd, target, fileSize )

      if ( candidate < 0 ) {
        throw new Error( `no boundary candidate at or after ${target}` )
      }

      starts.push( candidate )
    }
  } finally {
    fs.closeSync( fd )
  }

  const boundaryMs = performance.now() - tBoundaries

  const ends = starts.slice( 1 )

  ends.push( fileSize )

  // Warm the pool before the clock that matters starts. Reported separately
  // (poolWarmMs) rather than hidden: a production sharder amortises it across
  // loads, but it is real and a reader is entitled to see it.
  const tWarm = performance.now()
  const workers = await Promise.all(
      starts.map( () => spawnWorker() ) )
  const poolWarmMs = performance.now() - tWarm

  const tShards = performance.now()
  const results = await Promise.all(
      starts.map( ( start, k ) =>
        runShardJob( workers[ k ], file, k, start, ends[ k ], pool ) ) )
  const shardMs = performance.now() - tShards

  results.sort( ( a, b ) => a.index - b.index )

  // The gate. stop(k) === start(k+1) for every seam ⟹ by induction from the
  // header-anchored start(0), every shard began on a true record boundary.
  const seams = []
  let repairs = 0

  for ( let k = 0; k + 1 < results.length; ++k ) {

    const stop = results[ k ].stopOffset
    const start = results[ k + 1 ].start

    seams.push( { seam: k, stop, start, ok: stop === start } )

    if ( stop !== start ) {

      ++repairs

      console.error(
          `  SEAM ${k} MISMATCH: shard ${k} stopped at ${stop}, shard ` +
          `${k + 1} started at ${start} — re-running shard ${k + 1} from ` +
          `the verified offset` )

      results[ k + 1 ] =
        await runShardJob( workers[ k + 1 ], file, k + 1, stop, ends[ k + 1 ], pool )
      results[ k + 1 ].start = stop
      seams[ k ].repaired = true
    }
  }

  const tMerge = performance.now()
  const merged = mergeShards( results )
  const mergeMs = performance.now() - tMerge

  for ( const worker of workers ) {
    await worker.terminate()
  }

  return {
    shardCount,
    boundaryMs,
    poolWarmMs,
    shardMs,
    mergeMs,
    totalMs: boundaryMs + shardMs + mergeMs,
    coldTotalMs: boundaryMs + poolWarmMs + shardMs + mergeMs,
    shardErrors: results.filter( ( r ) => r.error !== void 0 )
        .map( ( r ) => `shard ${r.index}: ${r.error}` ),
    repairs,
    seams,
    perShardMs: results.map( ( r ) => r.ms ),
    perShardPackMs: results.map( ( r ) => r.packMs ),
    perShardRows: results.map( ( r ) => r.topLevel ),
    // What the worker boundary costs on top of the slowest shard: pack, the
    // structured clone of the retained inline/complex entries, and the main
    // thread's deserialization of them. The four scalar columns move by
    // transfer (zero-copy); the retained entries cannot, because they are
    // objects. On an inline-heavy model this is the term that decides
    // whether sharding is worth anything.
    transferMs: shardMs - Math.max( ...results.map( ( r ) => r.ms ) ),
    merged,
  }
}


/**
 * Adversarial self-test for the boundary scan and the merge. Run with
 * `--selftest`; needs no model, no wasm and no worker threads.
 *
 * This is issue #394's M7 item ("construct a STEP file with a `;` and a `#`
 * inside a quoted string positioned exactly at an L/N boundary"), done
 * exhaustively rather than at one offset: for every fixture, EVERY byte
 * offset in the data section is used as the N=2 split target, and a strided
 * sweep of offset pairs as the N=3 split targets. For each split the merged
 * index must be byte-identical to the single-threaded reference.
 *
 * Two outcomes are counted separately, because they mean different things:
 *
 *   falseCandidateCaught  the scan proposed an offset that is NOT a record
 *                         boundary — it sat inside a quoted string or a
 *                         block comment — and the seam gate rejected it.
 *                         This is the case the fixtures exist to produce; a
 *                         fixture that never produces one has tested nothing.
 *   pastEndOfData         the scan proposed an offset beyond the last
 *                         record, so the owning shard reached ENDSEC first.
 *                         Benign, and not evidence about boundary detection.
 *
 * @return {Promise<boolean>} True if every split of every fixture merged
 * byte-identically.
 */
async function selfTest() {

  const parsingBufferModule =
    await import( path.join( COMPILED, 'src/parsing/parsing_buffer.js' ) )
  const parserModule =
    await import( path.join( COMPILED, 'src/ifc/ifc_step_parser.js' ) )
  const { ColumnarIndexSink } =
    await import( path.join( COMPILED, 'src/step/parsing/columnar_index.js' ) )
  const { buildIndexStreaming } =
    await import( path.join( COMPILED, 'src/step/parsing/streaming_index_builder.js' ) )
  const { BufferByteSource } =
    await import( path.join( COMPILED, 'src/step/parsing/byte_source.js' ) )

  const ParsingBuffer = parsingBufferModule.default ?? parsingBufferModule.ParsingBuffer

  buildIndexShard.ParsingBuffer = ParsingBuffer

  const parser = ( parserModule.default ?? parserModule.IfcStepParser ).Instance

  const header =
    'ISO-10303-21;\nHEADER;\n' +
    "FILE_DESCRIPTION((''),'2;1');\n" +
    "FILE_NAME('t','2026-08-27T00:00:00',(''),(''),'','','');\n" +
    "FILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n"

  /**
   * A run of ordinary records, so each trap sits in a body rather than being
   * the whole file.
   *
   * @param {number} from First express ID.
   * @param {number} howMany How many records.
   * @return {string} The records.
   */
  const filler = ( from, howMany ) => {

    let text = ''

    for ( let i = 0; i < howMany; ++i ) {
      text += `#${from + i}=IFCPERSON($,$,'p${from + i}',$,$,$,$,$);\n`
    }

    return text
  }

  // Each fixture's data-section body. Every one contains the byte sequence
  // the scan looks for (`;` newline `#` digits `=`) somewhere it must NOT
  // split, except the last two, which exercise the merge rather than the scan.
  const fixtures = [
    [ 'quoted-semicolon-hash',
      `${filler( 1, 6 )}` +
      "#7=IFCPERSON($,$,';\\n#9999=IFCFAKE(0);',$,$,$,$,$);\n" +
      `${filler( 8, 6 )}` ],
    [ 'quoted-real-newline-then-record-head',
      `${filler( 1, 6 )}` +
      "#7=IFCPERSON($,$,'trap;\n#4444=IFCFAKE(1);\nstill inside the string',$,$,$,$,$);\n" +
      `${filler( 8, 6 )}` ],
    [ 'block-comment-with-record-head',
      `${filler( 1, 6 )}` +
      '/* a comment holding ;\n#5555=IFCFAKE(2);\n and more text */\n' +
      `${filler( 8, 6 )}` ],
    [ 'doubled-quote-escape',
      `${filler( 1, 6 )}` +
      "#7=IFCPERSON($,$,'it''s a trap ;\n#6666=IFCFAKE(3); still inside',$,$,$,$,$);\n" +
      `${filler( 8, 6 )}` ],
    [ 'two-traps-back-to-back',
      `${filler( 1, 4 )}` +
      "#5=IFCPERSON($,$,'trap A ;\n#7777=IFCFAKE(4);',$,$,$,$,$);\n" +
      "#6=IFCPERSON($,$,'trap B ;\n#8888=IFCFAKE(5);',$,$,$,$,$);\n" +
      `${filler( 7, 4 )}` ],
    [ 'inline-entities-and-a-trap',
      "#1=IFCPROPERTYSINGLEVALUE('p',$,IFCTEXT('v'),$);\n" +
      "#2=IFCPROPERTYSINGLEVALUE('q',$,IFCINTEGER(3),$);\n" +
      "#3=IFCPROPERTYSINGLEVALUE('r',$,IFCTEXT(';\n#3333=IFCFAKE(6);'),$);\n" +
      "#4=IFCPROPERTYSINGLEVALUE('s',$,IFCLABEL('w'),$);\n" +
      "#5=IFCPROPERTYSINGLEVALUE('t',$,IFCREAL(1.5),$);\n" +
      "#6=IFCPROPERTYSINGLEVALUE('u',$,IFCTEXT('y'),$);\n" ],
    [ 'multi-mapping-complex-instance',
      `${filler( 1, 3 )}` +
      '#4=(IFCLENGTHMEASURE(1.0)IFCPOSITIVELENGTHMEASURE(1.0));\n' +
      `${filler( 5, 3 )}` +
      '#8=(IFCLENGTHMEASURE(2.0)IFCPOSITIVELENGTHMEASURE(2.0));\n' +
      `${filler( 9, 3 )}` ],
    [ 'descending-express-ids',
      '#30=IFCPERSON($,$,$,$,$,$,$,$);\n' +
      '#20=IFCPERSON($,$,$,$,$,$,$,$);\n' +
      '#25=IFCPERSON($,$,$,$,$,$,$,$);\n' +
      '#10=IFCPERSON($,$,$,$,$,$,$,$);\n' +
      '#40=IFCPERSON($,$,$,$,$,$,$,$);\n' ],
  ]

  let allPassed = true

  for ( const [ name, body ] of fixtures ) {

    const text = `${header}${body}ENDSEC;\nEND-ISO-10303-21;\n`
    const bytes = new TextEncoder().encode( text )
    const source = new BufferByteSource( bytes )

    const referenceSink = new ColumnarIndexSink()

    buildIndexStreaming( source, parser, 4096, void 0, referenceSink )

    const reference = referenceSink.finalize()
    const dataStart = dataBlockStart( bytes, parser, ParsingBuffer )

    let splits = 0
    let falseCandidates = 0
    let pastEndOfData = 0
    let mismatches = 0
    const firstMismatch = []

    /**
     * Candidate boundary at or after `target`, clamped to end-of-file when
     * the scan finds nothing.
     *
     * @param {number} target Offset to search from.
     * @return {number} The candidate.
     */
    const candidateAt = ( target ) => {

      const found = findBoundaryCandidate( bytes, target, bytes.length )

      return found < 0 ? bytes.length : found
    }

    /**
     * Split at the given candidate offsets, let the seam gate repair any that
     * were wrong, merge, and compare the merge with the reference.
     *
     * @param {number[]} candidates Candidate split offsets, ascending.
     */
    const checkSplit = ( candidates ) => {

      ++splits

      const shards = []
      let cursor = dataStart

      for ( let k = 0; k <= candidates.length; ++k ) {

        // `cursor` is the PREVIOUS shard's verified stop — the repair. The
        // candidate is only ever used as an end offset and as the thing the
        // gate is checked against.
        const end = k < candidates.length ?
          Math.max( candidates[ k ], cursor ) : bytes.length

        const shard = buildIndexShard( source, parser, cursor, end, 4096 )

        shards.push( shard )

        if ( k < candidates.length && shard.stopOffset !== candidates[ k ] ) {

          // ParseResult.COMPLETE === 0: the shard reached ENDSEC, so the
          // candidate was past the last record rather than inside one.
          if ( shard.result === 0 ) {
            ++pastEndOfData
          } else {
            ++falseCandidates
          }
        }

        cursor = shard.stopOffset
      }

      const merged = mergeShards( shards.map( ( s ) => s.sink.pack() ) )
      const { ok, failures } = compareColumns( merged, reference )

      if ( !ok ) {

        ++mismatches

        if ( firstMismatch.length === 0 ) {
          firstMismatch.push(
              `candidates=[${candidates}] ${failures.join( '; ' )}` )
        }
      }
    }

    // N=2: every byte offset in the data section as the split target.
    for ( let target = dataStart; target <= bytes.length; ++target ) {
      checkSplit( [ candidateAt( target ) ] )
    }

    // N=3: a strided sweep of offset PAIRS. Stride 7 so the grid cannot
    // align with the record pitch.
    const STRIDE = 7

    for ( let a = dataStart; a <= bytes.length; a += STRIDE ) {
      for ( let b = a; b <= bytes.length; b += STRIDE ) {
        checkSplit( [ candidateAt( a ), candidateAt( b ) ] )
      }
    }

    const passed = mismatches === 0

    allPassed &&= passed

    console.log(
        `${passed ? 'PASS' : 'FAIL'}  ${name.padEnd( 36 )} ` +
        `rows=${String( reference.count ).padStart( 3 )} ` +
        `inline=${String( reference.count - reference.firstInlineElement )
            .padStart( 2 )} ` +
        `complex=${reference.complexEntries?.size ?? 0} ` +
        `sorted=${reference.expressIdsSorted ? 'y' : 'n'} | ` +
        `splits=${String( splits ).padStart( 5 )} ` +
        `falseCandidatesCaught=${String( falseCandidates ).padStart( 5 )} ` +
        `pastEndOfData=${String( pastEndOfData ).padStart( 5 )} ` +
        `mismatches=${mismatches}` )

    for ( const note of firstMismatch ) {
      console.log( `        ${note}` )
    }
  }

  return allPassed
}


/**
 * Entry point.
 *
 * @return {Promise<void>} Resolves when the run is done.
 */
async function main() {

  const argv = process.argv.slice( 2 )

  if ( argv.includes( '--selftest' ) ) {
    const ok = await selfTest()

    console.log( `\nself-test ${ok ? 'PASSED' : 'FAILED'}` )
    process.exit( ok ? 0 : 1 )
  }

  /**
   * Read a `--flag value` pair.
   *
   * @param {string} name Flag name.
   * @param {string} fallback Default.
   * @return {string} The value.
   */
  const flag = ( name, fallback ) => {
    const index = argv.indexOf( name )

    return index >= 0 ? argv[ index + 1 ] : fallback
  }

  const shardCounts = flag( '--shards', '1,2,4' ).split( ',' ).map( Number )
  const repeats = Number( flag( '--repeats', '1' ) )
  // Default 16 MB: production's own streamed-parse window
  // (STORE_PARSE_POOL_BYTES, ifc_api_proxy_ifc.ts:89).
  const pool = Number( flag( '--pool', '16' ) ) * 1024 * 1024
  const jsonOut = flag( '--json', void 0 )
  const file = argv.find( ( a, i ) =>
    !a.startsWith( '--' ) &&
    ![ '--shards', '--repeats', '--pool', '--json' ].includes( argv[ i - 1 ] ) )

  if ( file === void 0 ) {
    console.error(
        'usage: index_shard_spike.mjs [--shards 1,2,4] [--repeats 1] ' +
        '[--pool 16] [--no-asyncref] [--json out.json] <model>' +
        '   |   --selftest' )
    process.exit( 2 )
  }

  const parsingBufferModule =
    await import( path.join( COMPILED, 'src/parsing/parsing_buffer.js' ) )
  const parserModule =
    await import( path.join( COMPILED, 'src/ifc/ifc_step_parser.js' ) )
  const { ColumnarIndexSink } =
    await import( path.join( COMPILED, 'src/step/parsing/columnar_index.js' ) )
  const { buildIndexStreaming, buildIndexStreamingAsync } =
    await import( path.join( COMPILED, 'src/step/parsing/streaming_index_builder.js' ) )
  const { FileDescriptorByteSource } =
    await import( path.join( COMPILED, 'src/step/parsing/byte_source_node.js' ) )

  const ParsingBuffer = parsingBufferModule.default ?? parsingBufferModule.ParsingBuffer

  buildIndexShard.ParsingBuffer = ParsingBuffer

  const parser = ( parserModule.default ?? parserModule.IfcStepParser ).Instance
  const fileSize = fs.statSync( file ).size

  console.log( `model    ${file}  ${( fileSize / ( 1024 * 1024 ) ).toFixed( 1 )} MB` )
  console.log( `host     ${os.cpus().length} cpus, pool=${pool / ( 1024 * 1024 )} MB` )

  // Header parse off a small head read — the induction's anchor.
  const headFd = fs.openSync( file, 'r' )
  const head = Buffer.allocUnsafe( Math.min( 1 << 20, fileSize ) )

  fs.readSync( headFd, head, 0, head.length, 0 )
  fs.closeSync( headFd )

  const dataStart = dataBlockStart( new Uint8Array( head ), parser, ParsingBuffer )

  console.log( `dataStart ${dataStart}` )

  // Single-threaded reference, through production's own sink and builder —
  // this pairing IS `buildColumnarIndexStreaming` (streaming_index_builder.ts:
  // 403-415), spelled out so the sink is visible. The browser path runs the
  // cooperative twin instead; `streaming_index_builder_async.test.ts:51`
  // ("produces identical columns to the sync build") is the committed
  // assertion that the two agree, which is what lets the sync one stand as
  // the reference here.
  const referenceRuns = []
  let reference

  for ( let repeat = 0; repeat < repeats; ++repeat ) {

    const source = FileDescriptorByteSource.open( file )
    const sink = new ColumnarIndexSink()
    const t0 = performance.now()

    buildIndexStreaming( source, parser, pool, void 0, sink )

    const columns = sink.finalize()
    const ms = performance.now() - t0

    source.close()
    referenceRuns.push( ms )
    reference ??= columns
  }

  const referenceMs = Math.min( ...referenceRuns )
  const referenceDigest = digestColumns( reference )

  // Cross-check the reference against the path Share actually runs: the
  // cooperative builder over a StoreByteSource, which is what
  // `IfcApiProxyIfc.parseColumnarFromStore` calls (ifc_api_proxy_ifc.ts:1206).
  // `streaming_index_builder_async.test.ts:51` asserts the two agree on a
  // fixture; this asserts it on the model under test, so the byte-identity
  // claim below reaches production output rather than stopping at the sync
  // twin. Skipped with --no-asyncref (it costs one more whole-file parse).
  let asyncDigest = 'skipped'

  if ( !argv.includes( '--no-asyncref' ) ) {

    const { StoreByteSource } =
      await import( path.join( COMPILED, 'src/step/parsing/byte_source.js' ) )

    const fd = fs.openSync( file, 'r' )

    const store = {
      byteLength: fileSize,
      /**
       * Positioned read, the shape StepExternalByteStore requires.
       *
       * @param {number} offset Absolute offset.
       * @param {number} length Byte count.
       * @return {Promise<Uint8Array>} The bytes.
       */
      async read( offset, length ) {
        const buffer = Buffer.allocUnsafe( length )
        const got = fs.readSync( fd, buffer, 0, length, offset )

        return new Uint8Array( buffer.buffer, buffer.byteOffset, got )
      },
    }

    const asyncSink = new ColumnarIndexSink()

    await buildIndexStreamingAsync(
        new StoreByteSource( store ), parser, pool, void 0, asyncSink )

    asyncDigest = digestColumns( asyncSink.finalize() )
    fs.closeSync( fd )

    console.log(
        `\nasync production reference (buildIndexStreamingAsync over a ` +
        `StoreByteSource)\n  digest ${asyncDigest}\n  ` +
        `${asyncDigest === referenceDigest ?
          'MATCHES the sync reference — the gate below is against production ' +
          'output' :
          'DIFFERS from the sync reference — the gate below is NOT against ' +
          'production output'}` )
  }

  console.log( '' )
  console.log(
      `reference (single-threaded, production ColumnarIndexSink)\n` +
      `  wall ${referenceMs.toFixed( 0 )} ms  rows=${reference.count} ` +
      `firstInlineElement=${reference.firstInlineElement} ` +
      `inline=${reference.count - reference.firstInlineElement} ` +
      `(${( 100 * ( reference.count - reference.firstInlineElement ) /
        reference.count ).toFixed( 3 )} %)\n` +
      `  complexEntries=${reference.complexEntries?.size ?? 0} ` +
      `expressIdsSorted=${reference.expressIdsSorted}\n` +
      `  digest ${referenceDigest}` )

  const rows = []

  for ( const shardCount of shardCounts ) {

    let best

    for ( let repeat = 0; repeat < repeats; ++repeat ) {

      const run =
        await buildSharded( file, shardCount, pool, dataStart, fileSize )

      if ( best === void 0 || run.totalMs < best.totalMs ) {
        best = run
      }
    }

    const { ok, failures } = compareColumns( best.merged, reference )
    const digest = digestColumns( best.merged )

    console.log( '' )
    console.log(
        `N=${shardCount}  warm wall ${best.totalMs.toFixed( 0 )} ms ` +
        `(boundary ${best.boundaryMs.toFixed( 0 )} + shards ` +
        `${best.shardMs.toFixed( 0 )} + merge ${best.mergeMs.toFixed( 0 )})  ` +
        `speedup ${( referenceMs / best.totalMs ).toFixed( 2 )}x` )
    console.log(
        `      cold wall ${best.coldTotalMs.toFixed( 0 )} ms ` +
        `(pool warm-up ${best.poolWarmMs.toFixed( 0 )} ms on top)  ` +
        `speedup ${( referenceMs / best.coldTotalMs ).toFixed( 2 )}x` )
    console.log(
        `      per-shard parse ms ${best.perShardMs.map( ( m ) => m.toFixed( 0 ) )
            .join( ', ' )}  (pack ${best.perShardPackMs
            .map( ( m ) => m.toFixed( 0 ) ).join( ', ' )})` )
    console.log(
        `      worker-boundary cost ${best.transferMs.toFixed( 0 )} ms ` +
        `(shards wall minus slowest shard's parse: pack + structured clone ` +
        `of retained inline entries + deserialize)` )
    console.log(
        `      per-shard rows ${best.perShardRows.join( ', ' )}` )
    console.log(
        `      seam gate: ${best.seams.length} seams, ${best.repairs} repairs ` +
        `— ${best.seams.every( ( s ) => s.ok ) ?
          'every candidate verified as a true boundary' :
          'candidate(s) rejected and repaired'}` )
    console.log(
        `      equivalence: ${ok ? 'PASS — byte-identical' : 'FAIL'}  ` +
        `digest ${digest}` )

    for ( const failure of failures ) {
      console.log( `        ${failure}` )
    }

    rows.push( {
      shardCount,
      totalMs: best.totalMs,
      coldTotalMs: best.coldTotalMs,
      poolWarmMs: best.poolWarmMs,
      shardErrors: best.shardErrors,
      boundaryMs: best.boundaryMs,
      shardMs: best.shardMs,
      mergeMs: best.mergeMs,
      perShardMs: best.perShardMs,
      perShardPackMs: best.perShardPackMs,
      transferMs: best.transferMs,
      perShardRows: best.perShardRows,
      repairs: best.repairs,
      seams: best.seams,
      equivalent: ok,
      failures,
      digest,
      speedup: referenceMs / best.totalMs,
    } )
  }

  if ( jsonOut !== void 0 ) {
    fs.writeFileSync( jsonOut, `${JSON.stringify( {
      file,
      fileSize,
      pool,
      repeats,
      dataStart,
      reference: {
        ms: referenceMs,
        runs: referenceRuns,
        asyncDigest,
        count: reference.count,
        firstInlineElement: reference.firstInlineElement,
        inlineFraction:
          ( reference.count - reference.firstInlineElement ) / reference.count,
        complexEntries: reference.complexEntries?.size ?? 0,
        expressIdsSorted: reference.expressIdsSorted,
        digest: referenceDigest,
      },
      shards: rows,
    }, null, 2 )}\n` )

    console.log( `\nwrote ${jsonOut}` )
  }
}

if ( isMainThread ) {
  await main()
}
