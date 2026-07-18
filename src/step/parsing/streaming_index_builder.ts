import ParsingBuffer from '../../parsing/parsing_buffer'
import { ByteSource } from './byte_source'
import StepParser, {
  ParseResult,
  StepHeader,
  StepIndexEntry,
} from './step_parser'


/**
 * Diagnostics from a streaming index build — how hard the moving window had
 * to work, so a pool-size sweep can compare cost against a resident parse.
 */
export interface StreamingIndexStats {

  /** Target window size in bytes (the pool). */
  pool: number

  /** Physical window buffer size actually used (grows past `pool` only if a
   * single record exceeds the pool). */
  windowBytes: number

  /** Number of times the window slid forward. */
  slides: number

  /** Largest single top-level record observed, in bytes. */
  maxRecordLen: number

  /** Total bytes read from the source (≈ file size + re-reads on growth). */
  bytesRead: number
}


/**
 * The output of a streaming index build: the same element index a resident
 * `parseDataBlock` produces, plus the header and window diagnostics.
 */
export interface StreamingIndexResult<TypeIDType> {
  header: StepHeader
  elements: StepIndexEntry<TypeIDType>[]
  result: ParseResult
  stats: StreamingIndexStats
}


/**
 * Build the entity index by streaming a `ByteSource` through a fixed-size
 * moving window, instead of parsing one resident buffer. The parse loop is
 * byte-for-byte the resident one (`StepParser.parseDataBlockStreamed` drives
 * the same generator); this coordinator only owns the window: it fills it,
 * parses the header from the first fill, then slides the window forward at
 * top-level record boundaries as the parser advances.
 *
 * Because the parser records file-absolute addresses and its rewind stack is
 * empty at every top-level boundary, sliding there is transparent: the
 * unconsumed tail is copied to the front, fresh bytes are appended, and the
 * buffer is rebased so `address` keeps its file-absolute value. Peak JS heap
 * for the index build is therefore `window + index columns`, independent of
 * file size.
 *
 * The window slides only once the cursor passes `pool / 2`, bounding the
 * memmove frequency; a record up to `pool / 2` bytes always fits after a
 * slide. If a single record exceeds that (never on the current corpus, whose
 * largest STEP record is ~25 KB), the whole parse restarts from the
 * beginning with the window doubled, and repeats until every record fits —
 * correctness over the pathological case, at the cost of a re-scan. (M1's
 * production path will instead grow in place / restart from the last
 * boundary; from-scratch keeps the spike simple.)
 *
 * @param source The byte source.
 * @param parser The STEP parser (typed to the schema).
 * @param pool Target window size in bytes.
 * @param onRecordIndexed Optional per-record event, invoked live as each
 * top-level record is indexed with its (localID, expressID, typeID) — the
 * seam for incremental semantic consumers (M2). localIDs are dense and
 * assigned in parse order from 0. On the rare grow-and-restart (a single
 * record larger than the window — never on real files, whose largest STEP
 * record is ~25 KB), the parse re-runs from the start and records re-fire
 * from localID 0; consumers must therefore be idempotent by localID /
 * expressID (the standard consumers — type index keyed by localID, roots
 * registry keyed by expressID — are). Must be synchronous and cheap;
 * expensive work belongs on a demand queue, not the parse path.
 * @return {StreamingIndexResult} The index, header, result and diagnostics.
 */
export function buildIndexStreaming<TypeIDType>(
    source: ByteSource,
    parser: StepParser<TypeIDType>,
    pool: number,
    onRecordIndexed?:
      ( localID: number, expressID: number, typeID: TypeIDType | undefined ) => void ):
    StreamingIndexResult<TypeIDType> {

  const fileSize = source.byteLength

  // Grow-and-restart loop: the body runs a full streamed parse at the current
  // window size. It only re-runs if a single record couldn't fit the window
  // (false end-of-file before true EOF), doubling the window each time.
  let windowBytes = Math.max( pool, MIN_WINDOW )

  for ( ; ; ) {

    const window = new Uint8Array( windowBytes )

    let windowStartFile = 0
    let windowLen = source.read( 0, windowBytes, window, 0 )
    let bytesRead = windowLen

    const input = new ParsingBuffer( window, 0, windowLen )

    const [ header, headerResult ] = parser.parseHeader( input )

    if ( headerResult !== ParseResult.COMPLETE ) {
      // Header didn't complete in the first window: either malformed, or a
      // header larger than the pool. Report it as-is — the resident parse
      // would surface the same header result.
      return {
        header,
        elements: [],
        result: headerResult,
        stats: { pool, windowBytes, slides: 0, maxRecordLen: 0, bytesRead },
      }
    }

    // Slide once the cursor is past half the window; a record up to this much
    // headroom always fits without a false EOF.
    const slideThreshold = windowBytes >> 1

    let slides = 0
    let maxRecordLen = 0
    let prevBoundaryFile = windowStartFile + input.cursor

    const onRecordBoundary = ( buffer: ParsingBuffer ): void => {

      const cursor = buffer.cursor
      const recordFileStart = windowStartFile + cursor

      const recordLen = recordFileStart - prevBoundaryFile

      if ( recordLen > maxRecordLen ) {
        maxRecordLen = recordLen
      }

      prevBoundaryFile = recordFileStart

      // Window already spans to EOF — nothing left to slide in.
      if ( windowStartFile + windowLen >= fileSize ) {
        return
      }

      // Enough headroom remains; defer the slide to bound memmove frequency.
      if ( cursor < slideThreshold ) {
        return
      }

      // Slide: move the unconsumed tail to the front, refill behind it.
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

    const [ index, result ] =
      parser.parseDataBlockStreamed( input, onRecordBoundary, onRecordIndexed )

    // A parse that stopped short of true EOF, with the window not spanning to
    // EOF, means a single record overflowed the window: grow and retry.
    const stoppedShort = result !== ParseResult.COMPLETE
    const notAtEof = windowStartFile + windowLen < fileSize

    if ( stoppedShort && notAtEof ) {
      windowBytes *= 2
      continue
    }

    // Capture the final record's length (no boundary fires after the last).
    const lastRecordLen = ( windowStartFile + input.cursor ) - prevBoundaryFile

    if ( lastRecordLen > maxRecordLen ) {
      maxRecordLen = lastRecordLen
    }

    return {
      header,
      elements: index.elements,
      result,
      stats: { pool, windowBytes, slides, maxRecordLen, bytesRead },
    }
  }
}

// Floor on the window so a pathologically tiny pool still holds the header
// and a record with slide headroom. Tests drive pools down to this to force
// many slides on a small fixture; the pool sweep uses ≥ 128 KB anyway.
// eslint-disable-next-line no-magic-numbers
const MIN_WINDOW = 4 * 1024
