import {
  StepIndexEntry,
  StepIndexEntryBase,
  StepIndexSink,
} from './step_parser'


/**
 * The entity index in its **columnar (SoA) form** — the same packed typed-array
 * columns `StepModelBase` compacts the object index into at construction, but
 * produced *directly by the parse* so the per-record object phase never exists
 * (M7; "Structural memory" in the design doc).
 *
 * Layout mirrors the model's internal columns exactly:
 *
 *   [0, firstInlineElement)   top-level records, in parse order (localID)
 *   [firstInlineElement, count)  inline entities, in the model's unfold order
 *
 * `expressID` covers only the top-level range (inline entities have none).
 * `typeID` uses −1 for "no concrete type" (matching the sidecar sentinel);
 * 0 is a valid type (external mapping). The rare records with children —
 * inline entities or a multi-mapping — are additionally retained as objects
 * in `complexEntries` / consumed during the unfold, exactly the set the model
 * keeps today; everything else is scalars only.
 */
export interface StepIndexColumns<TypeIDType> {

  address: Uint32Array
  length: Uint32Array
  typeID: Int32Array
  expressID: Uint32Array

  /** Total rows (top-level + inline). */
  count: number

  /** Top-level record count == start of the inline range. */
  firstInlineElement: number

  /** Records with a multiMapping, keyed by localID (rare; retained). */
  complexEntries?: Map<number, StepIndexEntry<TypeIDType>>

  /** True if top-level express IDs arrived in non-decreasing order. */
  expressIdsSorted: boolean
}


/** Type sentinel for "no concrete type" in the typeID column. */
export const COLUMN_UNDEFINED_TYPE = -1

// Records per growth segment. 64 K rows × 16 B ≈ 1 MB per segment — growth
// never copies previously written rows, and finalize concatenates one column
// at a time so the transient overhead is one column's segments, not 2× the
// index.
// eslint-disable-next-line no-magic-numbers
const SEGMENT_ROWS = 64 * 1024


/** One growth segment of the four scalar columns. */
interface ColumnSegment {
  address: Uint32Array
  length: Uint32Array
  typeID: Int32Array
  expressID: Uint32Array
}


/**
 * A {@link StepIndexSink} that encodes top-level records straight into
 * chunked-segment typed-array columns, so the parse holds **no per-record
 * objects** for the (overwhelmingly common) simple records. Records with
 * children keep their object form — inline entities are unfolded into the
 * inline column range at {@link finalize}, and multi-mapping holders are
 * retained for the model's `complexEntries`, matching the object path's
 * behaviour entry-for-entry.
 *
 * `reset` supports the streaming builder's rare grow-and-restart: columns
 * rewind to empty without reallocating the first segment.
 */
export class ColumnarIndexSink<TypeIDType extends number>
implements StepIndexSink<TypeIDType> {

  private segments_: ColumnSegment[] = []

  private count_ = 0

  /** Entries with inlineEntities and/or multiMapping, keyed by localID. */
  private retained_ = new Map<number, StepIndexEntry<TypeIDType>>()

  private expressIdsSorted_ = true

  private previousExpressID_ = 0

  /**
   * @return {number} Top-level records pushed so far.
   */
  public get topLevelCount(): number {
    return this.count_
  }

  /**
   * Encode one completed top-level record into the columns. The entry object
   * is not kept unless it carries children (inline entities / multi-mapping).
   *
   * @param entry The completed top-level index entry.
   */
  public pushTopLevel( entry: StepIndexEntry<TypeIDType> ): void {

    const localID = this.count_++
    const segmentIndex = Math.floor( localID / SEGMENT_ROWS )
    const row = localID % SEGMENT_ROWS

    if ( segmentIndex === this.segments_.length ) {
      this.segments_.push( {
        address: new Uint32Array( SEGMENT_ROWS ),
        length: new Uint32Array( SEGMENT_ROWS ),
        typeID: new Int32Array( SEGMENT_ROWS ),
        expressID: new Uint32Array( SEGMENT_ROWS ),
      } )
    }

    const segment = this.segments_[ segmentIndex ]

    segment.address[ row ] = entry.address
    segment.length[ row ] = entry.length
    segment.typeID[ row ] =
      entry.typeID === void 0 ? COLUMN_UNDEFINED_TYPE : ( entry.typeID as number )
    segment.expressID[ row ] = entry.expressID

    if ( entry.expressID < this.previousExpressID_ ) {
      this.expressIdsSorted_ = false
    }

    this.previousExpressID_ = entry.expressID

    if ( entry.inlineEntities !== void 0 || entry.multiMapping !== void 0 ) {
      this.retained_.set( localID, entry )
    }
  }

  /**
   * Rewind to empty (the streaming builder's grow-and-restart). The first
   * segment is kept for reuse.
   */
  public reset(): void {
    this.segments_.length = Math.min( this.segments_.length, 1 )
    this.count_ = 0
    this.retained_.clear()
    this.expressIdsSorted_ = true
    this.previousExpressID_ = 0
  }

  /**
   * Snapshot the columns pushed SO FAR into a self-contained prefix index,
   * without disturbing the sink — the parse can keep pushing afterwards and
   * a later snapshot/finalize sees the full data. Safe to call between the
   * cooperative parse's yields (the parser only suspends at top-level
   * record boundaries, where the sink is consistent). Top-level localIDs
   * are stable across snapshots (dense parse order), so consumers can carry
   * per-localID cursors from one snapshot to the next; inline-range
   * localIDs are NOT stable (the inline tail re-packs after the growing
   * top-level range) and must not be carried across snapshots.
   *
   * @return {StepIndexColumns} A prefix columnar index over the records
   * pushed so far.
   */
  public snapshot(): StepIndexColumns<TypeIDType> {
    return this.assemble_()
  }

  /**
   * Assemble the final columns: concatenate the top-level segments (one
   * column at a time, bounding transient overhead to a single column's
   * segments) and unfold retained inline entities into the inline range in
   * the model's exact unfold order.
   *
   * @return {StepIndexColumns} The finished columnar index.
   */
  public finalize(): StepIndexColumns<TypeIDType> {
    return this.assemble_()
  }

  /**
   * Shared assembly behind {@link snapshot} and {@link finalize} — pure
   * over the sink's current state.
   *
   * @return {StepIndexColumns} The assembled columnar index.
   */
  private assemble_(): StepIndexColumns<TypeIDType> {

    const topLevel = this.count_

    // Unfold inline entities exactly as StepModelBase does over the object
    // array: scan in localID order appending children, then keep scanning
    // the appended region (children of children follow all first-level
    // children). Only retained entries can contribute — simple records have
    // no children by construction.
    const unfolded: StepIndexEntryBase<TypeIDType>[] = []

    for ( const entry of this.retained_.values() ) {
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

    const address = concatColumn( this.segments_, 'address', topLevel, count )
    const length = concatColumn( this.segments_, 'length', topLevel, count )

    const typeID = new Int32Array( count )

    for ( let segment = 0; segment * SEGMENT_ROWS < topLevel; ++segment ) {
      const rows = Math.min( SEGMENT_ROWS, topLevel - segment * SEGMENT_ROWS )
      typeID.set(
          this.segments_[ segment ].typeID.subarray( 0, rows ),
          segment * SEGMENT_ROWS )
    }

    const expressID = concatColumn( this.segments_, 'expressID', topLevel, topLevel )

    for ( let where = 0; where < unfolded.length; ++where ) {

      const entry = unfolded[ where ]
      const row = topLevel + where

      address[ row ] = entry.address
      length[ row ] = entry.length
      typeID[ row ] =
        entry.typeID === void 0 ? COLUMN_UNDEFINED_TYPE : ( entry.typeID as number )
    }

    let complexEntries: Map<number, StepIndexEntry<TypeIDType>> | undefined

    for ( const [ localID, entry ] of this.retained_ ) {
      if ( entry.multiMapping !== void 0 ) {
        ( complexEntries ??= new Map() ).set( localID, entry )
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
      expressIdsSorted: this.expressIdsSorted_,
    }
  }
}


/**
 * Concatenate one Uint32 column's segments into a final array of
 * `finalLength`, copying `rows` valid rows.
 *
 * @param segments The growth segments.
 * @param column Which column to concatenate.
 * @param rows Valid rows across the segments.
 * @param finalLength Length of the final array (≥ rows; the tail is for
 * inline rows filled by the caller).
 * @return {Uint32Array} The concatenated column.
 */
function concatColumn(
    segments: ColumnSegment[],
    column: 'address' | 'length' | 'expressID',
    rows: number,
    finalLength: number ): Uint32Array {

  const result = new Uint32Array( finalLength )

  for ( let segment = 0; segment * SEGMENT_ROWS < rows; ++segment ) {
    const valid = Math.min( SEGMENT_ROWS, rows - segment * SEGMENT_ROWS )
    result.set(
        segments[ segment ][ column ].subarray( 0, valid ),
        segment * SEGMENT_ROWS )
  }

  return result
}
