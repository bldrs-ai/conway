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

  /**
   * True when these columns are a mid-parse PREFIX ({@link
   * ColumnarIndexSink.snapshot}) rather than a finished index. A model
   * built over them answers "not in the index" for records the parse has
   * simply not reached yet, so the step layer softens the wording it
   * throws (see {@link import('../dangling_reference_error')
   * .DanglingReferenceError}). Absent means complete — a sidecar or a
   * finalized build carries no flag and keeps the strong wording.
   */
  indexIsPrefix?: boolean
}


/**
 * One shard's **unassembled** top-level state, as {@link
 * ColumnarIndexSink.packShard} hands it out: the four columns trimmed to the
 * rows this shard pushed, the entries it retained (keyed by its own
 * shard-local localID), and its own sorted-express-ID verdict.
 *
 * Deliberately not a {@link StepIndexColumns}: there is no inline range and
 * no `count`, because a shard must not unfold its own inline entities — the
 * unfold is global over the merged retained set. See `packShard`'s comment
 * for what goes wrong if it does.
 *
 * Every field is structured-cloneable and the four columns are transferable,
 * so this crosses a worker boundary as-is.
 */
export interface StepIndexShard<TypeIDType> {

  /** Record start offsets, file-absolute. Length is `topLevelCount`. */
  address: Uint32Array

  /** Record byte lengths. Length is `topLevelCount`. */
  length: Uint32Array

  /** Type IDs, −1 for "no concrete type". Length is `topLevelCount`. */
  typeID: Int32Array

  /** Express IDs. Length is `topLevelCount`. */
  expressID: Uint32Array

  /** Top-level records this shard indexed. */
  topLevelCount: number

  /**
   * Entries with inline entities and/or a multi-mapping, keyed by
   * SHARD-LOCAL localID and in ascending localID order — the merge re-keys
   * them by adding the shard's base and relies on that order.
   */
  retained: [ number, StepIndexEntry<TypeIDType> ][]

  /**
   * Whether express IDs were non-decreasing WITHIN this shard. A shard's
   * scan restarts from 0, so it is blind to a descent across a seam; the
   * merge re-derives the seams from the first/last rows of each column.
   */
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

    const columns = this.assemble_()

    // The one thing that separates a snapshot from a finalize, and the only
    // signal downstream has that an unresolved reference may still be
    // ahead of the parse rather than absent from the file (conway#580).
    columns.indexIsPrefix = true

    return columns
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
   * Hand out this sink's top-level state **unassembled** — the four columns
   * trimmed to the rows actually pushed, plus the retained entries and the
   * sorted flag. This is what one shard of a sharded index build produces
   * (see {@link import('./sharded_index_builder').buildColumnarIndexShardedAsync});
   * {@link import('./sharded_index_builder').mergeIndexShards} concatenates
   * the top-level ranges and then runs the unfold ONCE over the union.
   *
   * It cannot be `finalize()` instead, and the reason is the whole hazard of
   * the merge: the inline range is not per-shard concatenable. `assemble_`
   * unfolds breadth-first over the *entire* retained set, so N per-shard
   * unfolds put children in a different order than one global unfold — a
   * difference worth 21 % of D3D's rows and 0.6 % of PSB's, and one that
   * shows up as a silently reordered index rather than as an error.
   *
   * The columns are freshly allocated (not views on the segments), so they
   * are safe to hand to `postMessage` as transfers.
   *
   * @return {StepIndexShard} The shard's unassembled top-level state.
   */
  public packShard(): StepIndexShard<TypeIDType> {

    const rows = this.count_

    return {
      address: concatColumn( this.segments_, 'address', rows, rows ),
      length: concatColumn( this.segments_, 'length', rows, rows ),
      typeID: concatTypeIDColumn( this.segments_, rows, rows ),
      expressID: concatColumn( this.segments_, 'expressID', rows, rows ),
      topLevelCount: rows,
      retained: [ ...this.retained_ ],
      expressIdsSorted: this.expressIdsSorted_,
    }
  }

  /**
   * Shared assembly behind {@link snapshot} and {@link finalize} — pure
   * over the sink's current state.
   *
   * @return {StepIndexColumns} The assembled columnar index.
   */
  private assemble_(): StepIndexColumns<TypeIDType> {

    const topLevel = this.count_

    const unfolded = unfoldInlineEntities( this.retained_.values() )

    const count = topLevel + unfolded.length

    const address = concatColumn( this.segments_, 'address', topLevel, count )
    const length = concatColumn( this.segments_, 'length', topLevel, count )
    const typeID = concatTypeIDColumn( this.segments_, topLevel, count )
    const expressID = concatColumn( this.segments_, 'expressID', topLevel, topLevel )

    writeInlineRows( unfolded, topLevel, address, length, typeID )

    let complexEntries: Map<number, StepIndexEntry<TypeIDType>> | undefined

    for ( const [ localID, entry ] of this.retained_ ) {
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
      expressIdsSorted: this.expressIdsSorted_,
    }
  }
}


/**
 * Unfold retained entries' inline entities into the order the inline column
 * range uses — exactly as `StepModelBase` does over the object array: scan in
 * localID order appending children, then keep scanning the appended region
 * (children of children follow *all* first-level children). Only retained
 * entries can contribute; simple records have no children by construction.
 *
 * Shared rather than inlined because the sharded builder's merge has to
 * reproduce this order over the *union* of the shards' retained entries, and
 * the two must not drift: a divergence here reorders the inline range and
 * every consumer that resolves an inline reference by localID follows it,
 * silently. One implementation, two callers.
 *
 * @param retained The retained entries, in ascending localID order.
 * @return {StepIndexEntryBase[]} The inline entities, in unfold order.
 */
export function unfoldInlineEntities<TypeIDType>(
    retained: Iterable<StepIndexEntryBase<TypeIDType>> ):
    StepIndexEntryBase<TypeIDType>[] {

  const unfolded: StepIndexEntryBase<TypeIDType>[] = []

  for ( const entry of retained ) {
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

  return unfolded
}


/**
 * Write the unfolded inline entities into the inline tail of columns already
 * sized to `firstInlineElement + unfolded.length`. Shared with the sharded
 * merge for the same reason {@link unfoldInlineEntities} is.
 *
 * @param unfolded The inline entities in unfold order.
 * @param firstInlineElement Row the inline range starts at.
 * @param address The address column, sized to the full count.
 * @param length The length column, sized to the full count.
 * @param typeID The type column, sized to the full count.
 */
export function writeInlineRows<TypeIDType>(
    unfolded: readonly StepIndexEntryBase<TypeIDType>[],
    firstInlineElement: number,
    address: Uint32Array,
    length: Uint32Array,
    typeID: Int32Array ): void {

  for ( let where = 0; where < unfolded.length; ++where ) {

    const entry = unfolded[ where ]
    const row = firstInlineElement + where

    address[ row ] = entry.address
    length[ row ] = entry.length
    typeID[ row ] =
      entry.typeID === void 0 ? COLUMN_UNDEFINED_TYPE : ( entry.typeID as number )
  }
}


/**
 * Clone an index entry (and its multiMapping sub-entries, which models
 * also stamp) down to the persistent index fields.
 *
 * Models materialise complex entries by writing lazy parse state —
 * vtable views, buffer references, entity instances — onto the entry
 * objects IN PLACE (see StepModelBase.invalidate, which clears exactly
 * those fields). Handing every snapshot/finalize the same retained
 * object therefore let one model poison every other model built over
 * the same sink: a throwaway prefix model (parse-time preview channel)
 * stamped its own vtable views, and the durable model's short-circuit
 * (`vtableIndex !== undefined`) then read stale views — "Value in STEP
 * was incorrectly typed" on AP214's complex-instance transforms.
 * Cloning per assembly keeps each model's lazy state private.
 * `inlineEntities` stays shared: inline records are unfolded into
 * column scalars above and their objects are never stamped.
 *
 * @param entry The retained entry to clone.
 * @return {StepIndexEntryBase} A fresh holder with persistent fields only.
 */
export function cloneIndexEntry<TypeIDType>(
    entry: StepIndexEntryBase<TypeIDType> ): StepIndexEntryBase<TypeIDType> {

  const clone: StepIndexEntryBase<TypeIDType> = {
    address: entry.address,
    length: entry.length,
  }

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


/**
 * {@link concatColumn} for the signed type column — separate only because
 * `typeID` is an `Int32Array` and the others are `Uint32Array`.
 *
 * @param segments The growth segments.
 * @param rows Valid rows across the segments.
 * @param finalLength Length of the final array (≥ rows; the tail is for
 * inline rows filled by the caller).
 * @return {Int32Array} The concatenated column.
 */
function concatTypeIDColumn(
    segments: ColumnSegment[],
    rows: number,
    finalLength: number ): Int32Array {

  const result = new Int32Array( finalLength )

  for ( let segment = 0; segment * SEGMENT_ROWS < rows; ++segment ) {
    const valid = Math.min( SEGMENT_ROWS, rows - segment * SEGMENT_ROWS )
    result.set(
        segments[ segment ].typeID.subarray( 0, valid ),
        segment * SEGMENT_ROWS )
  }

  return result
}
