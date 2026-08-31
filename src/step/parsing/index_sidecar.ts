import { ColumnarIndexSink, StepIndexColumns } from './columnar_index'
import { StepIndexEntry, StepIndexEntryBase } from './step_parser'


/**
 * Index sidecar (M4): a compact, version-stamped binary serialisation of a
 * model's parse index, so a revisit — or a worker handed the coordinator's
 * index — can open **index-first** (`openIfcModelFromIndex` /
 * `IfcAPI.OpenModelFromIndex`): reconstruct the entity index without
 * re-scanning the source, then fetch only the byte ranges demand asks for.
 *
 * ## v2 layout (all little-endian)
 *
 * ```
 *   'CIDX'              4    magic
 *   version             u32  (= 2)
 *   sourceByteLength    f64  length of the source the index was built from
 *   sourceHash          u32  FNV-1a over the source bytes — the handshake
 *   count               u32  TOTAL rows: top-level + inline
 *   firstInlineElement  u32  start of the inline range
 *   flags               u32  bit 0 = expressIdsSorted
 *   complexCount        u32  number of multi-mapping holders
 *   address[]           u32 × count
 *   length[]            u32 × count
 *   typeID[]            i32 × count      (−1 = no concrete type)
 *   expressID[]         u32 × firstInlineElement
 *   complexEntries      complexCount × { localID u32, entry }
 *       entry:  address u32, length u32, typeID i32, flags u32,
 *               expressID u32, multiCount u32, multiCount × entry
 * ```
 *
 * A complex entry's `expressID` is **unsigned**, with presence carried in
 * `flags` bit 0 rather than by a sentinel value. The obvious encoding — i32
 * with −1 for absent — fails twice: every express ID at or above
 * `0x80000000` reads back negative, disagreeing with the `expressID` column
 * and with the parser, which both treat IDs as unsigned; and `0xFFFFFFFF`
 * is indistinguishable from the sentinel, so a real ID silently becomes
 * `undefined`. That matters more than a wrong number, because
 * `StepModelBase.entry()` hands back the retained complex descriptor rather
 * than rebuilding it from the unsigned column, so an entity opened from a
 * sidecar would expose the wrong ID with nothing downstream noticing.
 *
 * Absence is real, but only for nested `multiMapping` sub-entries
 * ({@link StepIndexEntryBase} declares `expressID?: number`).
 * A complex HOLDER is keyed into `complexEntries` by top-level localID and typed
 * {@link StepIndexEntry}, which requires one — the same fact the
 * already-unfolded guard in `serializeIndexSidecar` relies on, so the
 * two cannot disagree about what "absent" means.
 *
 * The columns are written verbatim off {@link StepIndexColumns} and read
 * back verbatim, so a restored index is the *same* index — same row order,
 * same localIDs — not an equivalent one. That identity is what makes
 * `[firstInlineElement, count)` safe to carry (see below); nothing here
 * re-derives an order that `ColumnarIndexSink.finalize` already fixed.
 *
 * ## Why v2 exists — v1 silently dropped up to a fifth of the index
 *
 * v1 carried `[0, firstInlineElement)` only: top-level records. The rows it
 * left behind are **inline entities** — ordinary typed values written inside
 * an attribute list, e.g. `IFCNORMALISEDRATIOMEASURE(0.8)` nested in an
 * `IFCSURFACESTYLERENDERING` (`data/index.ifc:94,105`). A model restored
 * from a v1 sidecar has an empty `inlineAddressMap_`, so
 * `StepEntityBase.extractReference` resolves those attributes to `null`
 * under the default `nullOnErrors` and throws on non-optional fields — a
 * model that loads and looks approximately right with its surface styles,
 * transparency and measure-valued attributes quietly degraded.
 *
 * Measured share of the index (conway#541): MB-Khaya 0.274 %, PSB 0.594 %,
 * DOWA 5.414 %, **D3D 20.995 % (720,661 rows)**. The variance across
 * exporters is 77×, so "negligible for IFC" is not a property of the format
 * — it is a property of whoever wrote the file. `complexEntries` is 0 on
 * every corpus model, which is why v1's own framing (multi-mapping holders)
 * watched the right column for the wrong risk; both are carried here.
 *
 * v1 blobs are **rejected by version**, never reinterpreted: a v1 file
 * decoded under v2 field offsets would read its `recordCount` as `count`
 * and its address column as everything else.
 *
 * ## Addresses are u32, and that is now enforced rather than truncated
 *
 * v1 wrote `address` as f64 ("tolerates >4 GB") and read it back into the
 * `Uint32Array` that {@link StepIndexColumns} declares — a silent truncation
 * above 4 GiB. The column type is the real constraint (widening it reaches
 * `StepModelBase.address_` and `InterpolationSearchTable32`, which is its
 * own change), so v2 stores what the column can hold and **throws** on a
 * source too large to address, at both ends. Halving that column also takes
 * ~40 % off the blob.
 *
 * ## What the format still does not carry
 *
 * **The schema.** `typeID` is an index into whichever schema's type
 * enumeration built it, and nothing in the blob says which. An AP214
 * sidecar fed to an IFC open would restore rows typed against the wrong
 * enumeration. Not a live hazard — the only producer and the only consumer
 * are both IFC (`IfcApiModelPassthroughFactory.fromIndex` sniffs the
 * format off the store's prefix and refuses anything else), and
 * `openIfcModelFromIndex` is IFC-typed by signature — but it is the first
 * thing to add if a second schema ever writes one, and it is a header slot,
 * not a reshape.
 *
 * **The STEP header.** An index-first open parses that from a bounded
 * prefix of the source it is opening, which it has in hand anyway.
 *
 * ## The trust gate
 *
 * The sidecar is a **cache, not an interchange format**: it is only trusted
 * after `sourceHash` + `sourceByteLength` match the actual source. A
 * mismatch means fall back to a cold scan — never serve wrong bytes.
 *
 * `hashSource` is a whole-buffer FNV-1a and costs ~1.5 s on a 900 MB model
 * (~580 MiB/s), which is affordable once and not N times: on Share's path
 * the source is never materialised, so a per-consumer full verify would
 * re-read the whole file back out of OPFS — reintroducing exactly the N-way
 * I/O a shared index exists to remove. So there are two gates, and callers
 * pick by case:
 *
 *  - **Distribution** (coordinator → workers, same file, one session):
 *    a coordinator wraps its parse source in
 *    {@link import('./source_hash').HashingByteSource}, which folds the
 *    digest into the pass it was already making — byte-identical to
 *    `hashSource`, no second read — and consumers check `byteLength` only
 *    ({@link sidecarMatchesSourceLength}). What that trusts is that the
 *    store handle a worker holds addresses the bytes the coordinator
 *    hashed; the only divergence is a concurrent rewrite, which would
 *    equally corrupt the per-worker parse it replaces.
 *
 *    **Nothing in this repo wires that yet.** `HashingByteSource` is the
 *    mechanism and is exported for it, but every present use — including
 *    `openIfcModelFromIndex`'s `verifySourceHash` — is a standalone
 *    whole-file pass. The compat surface can *consume* a sidecar
 *    (`OpenModelFromIndex`) but has no method that *produces* one, so a
 *    coordinator has to go through the engine API (`openStreamedIfcModel*`
 *    → `columns` → `serializeIndexSidecarFromColumns`) to build one at all.
 *  - **Revisit** (a persisted sidecar, where the file really may have
 *    changed): full {@link sidecarMatchesSource} against `hashSource`.
 *
 * FNV-1a is not collision-resistant and this is deliberately not a
 * security boundary — it detects a *changed* file, not an *attacker's*
 * file. A sidecar from an untrusted origin must be re-derived, not
 * verified: swapping in SHA-256 would not change that, since a sidecar
 * is bytes-with-offsets and a hostile one aims a model at ranges of the
 * caller's own file. The fixed 32-bit slot is sized for the digest it
 * holds; a stronger one is a version bump, not a reshape.
 */

const MAGIC = 0x58444943 // 'CIDX' little-endian

/** The format version this module writes, and the only one it reads. */
export const SIDECAR_VERSION = 2

/** The first version, carrying top-level rows only — rejected on read. */
export const SIDECAR_VERSION_TOP_LEVEL_ONLY = 1

const UNDEFINED_TYPE = -1

/** Complex-entry `flags` bit 0 — this entry carries an express ID. */
const COMPLEX_FLAG_HAS_EXPRESS_ID = 1

// FNV-1a 32-bit parameters (see hashSource).
const FNV_OFFSET_BASIS = 2166136261
const FNV_PRIME = 16777619
const HEX = 16

/** Largest byte offset a `Uint32Array` address column can hold. */
const MAX_ADDRESSABLE = 0xFFFFFFFF

/** `flags` bit 0 — the columns' `expressIdsSorted`. */
const FLAG_EXPRESS_IDS_SORTED = 1

// Byte sizes of the fixed header fields, in order.
const HEADER_BYTES =
  4 + // magic
  4 + // version
  8 + // sourceByteLength (f64)
  4 + // sourceHash (u32)
  4 + // count (u32)
  4 + // firstInlineElement (u32)
  4 + // flags (u32)
  4   // complexCount (u32)

const U32_BYTES = 4
const F64_BYTES = 8

/** Columns written over every row: address, length, typeID. */
const COLUMNS_OVER_ALL_ROWS = 3

/**
 * Bytes per complex-entry record, excluding its nested multiMapping:
 * address, length, typeID, flags, expressID, multiCount.
 */
const COMPLEX_ENTRY_FIXED_BYTES = 6 * U32_BYTES

// Column reads/writes take a typed-array fast path when the host is
// little-endian and the blob is 4-aligned — a memcpy instead of tens of
// millions of DataView calls on a PSB-class index (9.4 M rows × 4 columns).
// The format stays little-endian by definition, so a big-endian host falls
// back to the explicit DataView path and produces the same bytes.
const IS_LITTLE_ENDIAN =
  new Uint8Array( new Uint32Array( [ 1 ] ).buffer )[ 0 ] === 1


/**
 * A decoded sidecar's source identity — what {@link sidecarMatchesSource}
 * needs, and all it needs. Declared structurally so every decode shape
 * satisfies it without a cast (conway#541: the columns decode used to be
 * cast through `any` to reach the elements-shaped validator).
 */
export interface SidecarSourceIdentity {

  /** Length of the source the index was built from. */
  sourceByteLength: number

  /** Hash of the source bytes (see {@link hashSource}). */
  sourceHash: number
}


/**
 * A decoded sidecar: the source identity it was built against, plus the
 * columnar index itself — the shape {@link StepModelBase} takes directly,
 * with no per-record object phase between the bytes and the model.
 */
export interface DecodedSidecarColumns<TypeIDType extends number>
  extends SidecarSourceIdentity {

  /**
   * The format version read out of the blob (always {@link
   * SIDECAR_VERSION}; a mismatch throws rather than returning).
   */
  version: number

  /** The reconstructed index. */
  columns: StepIndexColumns<TypeIDType>
}


/**
 * A placeholder strong-ish hash of the source bytes (FNV-1a, 32-bit). Only
 * the fixed slot matters to the format; see the module comment's "trust
 * gate" section for what this does and does not establish, and for the
 * streaming equivalent that costs no extra I/O.
 *
 * @param source The source bytes.
 * @return {number} A 32-bit unsigned hash.
 */
export function hashSource( source: Uint8Array ): number {
  let hash = FNV_OFFSET_BASIS >>> 0

  for ( let where = 0; where < source.length; ++where ) {
    hash ^= source[ where ]
    hash = Math.imul( hash, FNV_PRIME ) >>> 0
  }

  return hash >>> 0
}


/**
 * Refuse a source the columnar index cannot address. The `address` column
 * is a `Uint32Array`, so a byte offset past 4 GiB has nowhere to go — v1
 * truncated it silently on the way back in.
 *
 * @param sourceByteLength The source length being serialised or restored.
 */
function requireAddressableSource( sourceByteLength: number ): void {

  if ( sourceByteLength > MAX_ADDRESSABLE ) {
    throw new Error(
        `Source of ${sourceByteLength} bytes exceeds the sidecar's 32-bit ` +
        'address column (4 GiB); the columnar index cannot address it' )
  }
}


/**
 * Count the nested records a complex entry contributes, so the blob can be
 * sized before it is written.
 *
 * @param entry The entry to measure.
 * @return {number} Records, including the entry itself.
 */
function countComplexRecords<TypeIDType>(
    entry: StepIndexEntryBase<TypeIDType> ): number {

  let records = 1

  for ( const mapped of entry.multiMapping ?? [] ) {
    records += countComplexRecords( mapped )
  }

  return records
}


/**
 * Write one complex entry and its multiMapping subtree.
 *
 * @param view The blob view.
 * @param offset Where to write.
 * @param entry The entry to write.
 * @return {number} The offset past what was written.
 */
function writeComplexEntry<TypeIDType>(
    view: DataView,
    offset: number,
    entry: StepIndexEntryBase<TypeIDType> ): number {

  const multiMapping = entry.multiMapping ?? []

  view.setUint32( offset, entry.address, true ); offset += U32_BYTES
  view.setUint32( offset, entry.length, true ); offset += U32_BYTES
  view.setInt32(
      offset,
      entry.typeID === void 0 ? UNDEFINED_TYPE : ( entry.typeID as number ),
      true )
  offset += U32_BYTES
  view.setUint32(
      offset,
      entry.expressID === void 0 ? 0 : COMPLEX_FLAG_HAS_EXPRESS_ID,
      true )
  offset += U32_BYTES
  view.setUint32( offset, ( entry.expressID ?? 0 ) >>> 0, true )
  offset += U32_BYTES
  view.setUint32( offset, multiMapping.length, true ); offset += U32_BYTES

  for ( const mapped of multiMapping ) {
    offset = writeComplexEntry( view, offset, mapped )
  }

  return offset
}


/**
 * Read one complex entry and its multiMapping subtree.
 *
 * @param view The blob view.
 * @param cursor Single-element offset cell, advanced past what is read.
 * @param cursor.offset The byte offset to read from.
 * @return {StepIndexEntryBase} The entry.
 */
function readComplexEntry<TypeIDType>(
    view: DataView, cursor: { offset: number } ): StepIndexEntryBase<TypeIDType> {

  const address = view.getUint32( cursor.offset, true ); cursor.offset += U32_BYTES
  const length = view.getUint32( cursor.offset, true ); cursor.offset += U32_BYTES
  const typeID = view.getInt32( cursor.offset, true ); cursor.offset += U32_BYTES
  const flags = view.getUint32( cursor.offset, true ); cursor.offset += U32_BYTES
  const expressID = view.getUint32( cursor.offset, true ); cursor.offset += U32_BYTES
  const multiCount = view.getUint32( cursor.offset, true ); cursor.offset += U32_BYTES

  const entry: StepIndexEntryBase<TypeIDType> = { address, length }

  if ( typeID !== UNDEFINED_TYPE ) {
    entry.typeID = typeID as unknown as TypeIDType
  }

  if ( ( flags & COMPLEX_FLAG_HAS_EXPRESS_ID ) !== 0 ) {
    entry.expressID = expressID
  }

  if ( multiCount > 0 ) {

    const multiMapping: StepIndexEntryBase<TypeIDType>[] = new Array( multiCount )

    for ( let where = 0; where < multiCount; ++where ) {
      multiMapping[ where ] = readComplexEntry<TypeIDType>( view, cursor )
    }

    entry.multiMapping = multiMapping
  }

  return entry
}


/**
 * Copy a u32-family column into the blob, memcpy-fast where the host allows.
 *
 * @param bytes The blob.
 * @param view The blob's DataView.
 * @param offset Byte offset of the column (4-aligned by construction).
 * @param column The source column.
 * @param rows Rows to write.
 */
function writeColumn(
    bytes: Uint8Array,
    view: DataView,
    offset: number,
    column: Uint32Array | Int32Array,
    rows: number ): void {

  if ( IS_LITTLE_ENDIAN && ( ( bytes.byteOffset + offset ) % U32_BYTES ) === 0 ) {

    new Uint32Array( bytes.buffer, bytes.byteOffset + offset, rows )
        .set( new Uint32Array( column.buffer, column.byteOffset, rows ) )
    return
  }

  for ( let where = 0; where < rows; ++where ) {
    view.setUint32( offset + where * U32_BYTES, column[ where ] >>> 0, true )
  }
}


/**
 * Read a u32-family column out of the blob, memcpy-fast where the host
 * allows.
 *
 * @param bytes The blob.
 * @param view The blob's DataView.
 * @param offset Byte offset of the column.
 * @param into The destination column (its length may exceed `rows` — the
 * inline tail of `expressID` stays zero).
 * @param rows Rows to read.
 */
function readColumn(
    bytes: Uint8Array,
    view: DataView,
    offset: number,
    into: Uint32Array | Int32Array,
    rows: number ): void {

  if ( IS_LITTLE_ENDIAN && ( ( bytes.byteOffset + offset ) % U32_BYTES ) === 0 ) {

    new Uint32Array( into.buffer, into.byteOffset, rows )
        .set( new Uint32Array( bytes.buffer, bytes.byteOffset + offset, rows ) )
    return
  }

  for ( let where = 0; where < rows; ++where ) {
    into[ where ] = view.getUint32( offset + where * U32_BYTES, true )
  }
}


/**
 * Serialise a columnar index to a v2 sidecar blob: **the whole index**,
 * `[0, count)`, including the inline range and the multi-mapping holders.
 *
 * The columns must come from a **completed** parse. This refuses a flagged
 * prefix (`ColumnarIndexSink.snapshot()`), but a parse that stopped short
 * produces columns that carry no flag at all, so the check the caller owns
 * is `result === ParseResult.COMPLETE` — see conway#628 and
 * {@link import('../../ifc/ifc_stream_open').StreamedIfcOpen.columns}.
 *
 * @param columns The columnar index, from a completed parse.
 * @param sourceByteLength The length of the source it was built from.
 * @param sourceHash The source hash (see {@link hashSource}).
 * @return {Uint8Array} The sidecar bytes.
 */
export function serializeIndexSidecarFromColumns<TypeIDType extends number>(
    columns: StepIndexColumns<TypeIDType>,
    sourceByteLength: number,
    sourceHash: number ): Uint8Array {

  requireAddressableSource( sourceByteLength )

  // A mid-parse PREFIX is not an index, it is an index so far, and the
  // format has no slot to say so — restoring one would present "the parse
  // has not reached this record yet" as "this record is not in the file",
  // which is the strong DanglingReferenceError wording conway#580 went out
  // of its way to soften. `ColumnarIndexSink.snapshot()` hands these out to
  // the parse-time preview channel, so this is reachable, not theoretical.
  //
  // This catches only the FLAGGED case, and the limit is in what the sink
  // records rather than in how it is tested here: `finalize()` runs
  // regardless of `ParseResult` and never sets `indexIsPrefix`, so columns
  // from a parse that stopped short are a prefix in substance and complete
  // in signal — indistinguishable from a whole index at this point.
  // **The caller must check `result === ParseResult.COMPLETE`** before
  // serialising columns from `openStreamedIfcModel*`, which returns
  // populated columns alongside a failed result. conway#628 tracks fixing
  // it at the source.
  if ( columns.indexIsPrefix === true ) {
    throw new Error(
        'Refusing to serialise a prefix index: these columns are a mid-parse ' +
        'snapshot (indexIsPrefix), not a finalized index' )
  }

  const count = columns.count
  const firstInlineElement = columns.firstInlineElement
  const complexEntries = columns.complexEntries
  const complexCount = complexEntries?.size ?? 0

  // The column writes below take a memcpy fast path off `column.buffer`,
  // which would happily read past a short column into whatever else shares
  // its buffer. Say so instead: a caller handing in inconsistent columns is
  // a bug, and the alternative is a sidecar full of neighbouring memory.
  if ( firstInlineElement > count ||
    columns.address.length < count ||
    columns.length.length < count ||
    columns.typeID.length < count ||
    columns.expressID.length < firstInlineElement ) {

    throw new Error(
        `Inconsistent columns: count ${count}, firstInlineElement ` +
        `${firstInlineElement}, columns ${columns.address.length}/` +
        `${columns.length.length}/${columns.typeID.length}/` +
        `${columns.expressID.length}` )
  }

  let complexBytes = 0

  for ( const entry of complexEntries?.values() ?? [] ) {
    complexBytes +=
      U32_BYTES + countComplexRecords( entry ) * COMPLEX_ENTRY_FIXED_BYTES
  }

  // address + length + typeID over every row; expressID over the top-level
  // range only (inline entities have none — see StepIndexColumns).
  const total =
    HEADER_BYTES +
    ( count * COLUMNS_OVER_ALL_ROWS + firstInlineElement ) * U32_BYTES +
    complexBytes

  const bytes = new Uint8Array( total )
  const view = new DataView( bytes.buffer )

  let offset = 0

  view.setUint32( offset, MAGIC, true ); offset += U32_BYTES
  view.setUint32( offset, SIDECAR_VERSION, true ); offset += U32_BYTES
  view.setFloat64( offset, sourceByteLength, true ); offset += F64_BYTES
  view.setUint32( offset, sourceHash >>> 0, true ); offset += U32_BYTES
  view.setUint32( offset, count, true ); offset += U32_BYTES
  view.setUint32( offset, firstInlineElement, true ); offset += U32_BYTES
  view.setUint32(
      offset, columns.expressIdsSorted ? FLAG_EXPRESS_IDS_SORTED : 0, true )
  offset += U32_BYTES
  view.setUint32( offset, complexCount, true ); offset += U32_BYTES

  writeColumn( bytes, view, offset, columns.address, count )
  offset += count * U32_BYTES
  writeColumn( bytes, view, offset, columns.length, count )
  offset += count * U32_BYTES
  writeColumn( bytes, view, offset, columns.typeID, count )
  offset += count * U32_BYTES
  writeColumn( bytes, view, offset, columns.expressID, firstInlineElement )
  offset += firstInlineElement * U32_BYTES

  for ( const [ localID, entry ] of complexEntries ?? [] ) {
    view.setUint32( offset, localID, true ); offset += U32_BYTES
    offset = writeComplexEntry( view, offset, entry )
  }

  return bytes
}


/**
 * Serialise a model's element index — the object form a resident
 * `parseDataBlock` produces — to a v2 sidecar blob.
 *
 * The inline unfold runs through {@link ColumnarIndexSink} rather than a
 * second implementation of it: `assemble_`'s breadth-first order over the
 * retained set IS the order localIDs are assigned in, and a sidecar written
 * in any other order would restore a model whose inline addresses no longer
 * line up with its rows. One unfold, one order (conway#541).
 *
 * **Pass a FRESH index, not one a model has taken.** `StepModelBase`'s
 * constructor unfolds inline entities into the caller's array **in place**
 * (it "takes ownership ... will modify values/unfold inline elements",
 * `step_model_base.ts`), so after `new IfcStepModel( bytes, elements )` the
 * array's tail holds the inline entities as if they were top-level records.
 * Serialising that array pushes them through `pushTopLevel` a second time:
 * on `data/index.ifc` the same index yields 287 rows / 280 top-level before
 * a model and **294 / 287 after** one, with seven inline entities promoted
 * to top-level, their absent express IDs written as `0`, and every one of
 * them unfolded again — shifted localIDs and duplicate addresses in
 * `inlineAddressMap_`, with nothing raised.
 *
 * That order — open a model, then serialise its index for the workers — is
 * the natural one, so this throws rather than documenting. An inline entity
 * is exactly an entry with no express ID ({@link StepInlineIndexEntry}
 * types it `expressID?: undefined`), which makes the check a field test on
 * the loop that was already running.
 *
 * @param elements The top-level element index, children attached, not yet
 * handed to a model.
 * @param sourceByteLength The length of the source it was built from.
 * @param sourceHash The source hash (see {@link hashSource}).
 * @return {Uint8Array} The sidecar bytes.
 */
export function serializeIndexSidecar<TypeIDType extends number>(
    elements: StepIndexEntry<TypeIDType>[],
    sourceByteLength: number,
    sourceHash: number ): Uint8Array {

  const sink = new ColumnarIndexSink<TypeIDType>()

  for ( let where = 0; where < elements.length; ++where ) {

    const element = elements[ where ]

    if ( element.expressID === void 0 ) {
      throw new Error(
          `Element ${where} of ${elements.length} has no express ID, so this ` +
          'index has already been unfolded in place by a model constructor ' +
          '(StepModelBase takes ownership of the array it is given). ' +
          'Serialise the index BEFORE constructing a model over it, or ' +
          'serialise the model\'s columns with ' +
          'serializeIndexSidecarFromColumns instead.' )
    }

    sink.pushTopLevel( element )
  }

  return serializeIndexSidecarFromColumns(
      sink.finalize(), sourceByteLength, sourceHash )
}


/**
 * Deserialise a sidecar blob straight to a columnar index — the index-first
 * open path: no per-record objects at any point between the sidecar bytes
 * and a constructed model.
 *
 * A v1 blob (top-level rows only) is **rejected**, not reinterpreted; see
 * the module comment for why carrying `[firstInlineElement, count)` is a
 * correctness requirement rather than a refinement.
 *
 * @param bytes The sidecar bytes.
 * @return {DecodedSidecarColumns} Source identity + the columnar index.
 */
export function deserializeIndexSidecarToColumns<TypeIDType extends number>(
    bytes: Uint8Array ): DecodedSidecarColumns<TypeIDType> {

  const view = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength )

  let offset = 0

  const magic = view.getUint32( offset, true ); offset += U32_BYTES

  if ( magic !== MAGIC ) {
    throw new Error( `Not a sidecar: bad magic 0x${magic.toString( HEX )}` )
  }

  const version = view.getUint32( offset, true ); offset += U32_BYTES

  if ( version !== SIDECAR_VERSION ) {
    throw new Error(
        `Unsupported sidecar version ${version} (expected ${SIDECAR_VERSION})` +
        ( version === SIDECAR_VERSION_TOP_LEVEL_ONLY ?
          ': v1 carries top-level rows only and would silently drop every ' +
          'inline entity — rebuild the index' : '' ) )
  }

  const sourceByteLength = view.getFloat64( offset, true ); offset += F64_BYTES
  const sourceHash = view.getUint32( offset, true ); offset += U32_BYTES
  const count = view.getUint32( offset, true ); offset += U32_BYTES
  const firstInlineElement = view.getUint32( offset, true ); offset += U32_BYTES
  const flags = view.getUint32( offset, true ); offset += U32_BYTES
  const complexCount = view.getUint32( offset, true ); offset += U32_BYTES

  requireAddressableSource( sourceByteLength )

  if ( firstInlineElement > count ) {
    throw new Error(
        `Corrupt sidecar: firstInlineElement ${firstInlineElement} exceeds ` +
        `count ${count}` )
  }

  // The mirror of the writer's consistency guard, and load-bearing for the
  // same reason. `readColumn`'s memcpy fast path is bounded by the backing
  // ArrayBuffer, not by this view, so a sidecar framed as a `subarray` of a
  // larger buffer — a slice out of a concatenated postMessage payload, a
  // partial store read, a pooled Node Buffer — would read whatever follows
  // it and restore those bytes as index rows. Silently: no throw, and the
  // columns look plausible. Header-derived length, checked before the first
  // column read. `complexCount` contributes at least its fixed part per
  // entry; the nested multiMapping reads run through the DataView, which is
  // bounded by the view and throws on overrun.
  const columnBytes = ( count * COLUMNS_OVER_ALL_ROWS + firstInlineElement ) *
    U32_BYTES
  const minimumBytes = HEADER_BYTES + columnBytes +
    complexCount * ( U32_BYTES + COMPLEX_ENTRY_FIXED_BYTES )

  if ( bytes.byteLength < minimumBytes ) {
    throw new Error(
        `Truncated sidecar: header describes ${count} rows ` +
        `(${firstInlineElement} top-level) and ${complexCount} complex ` +
        `entries, needing at least ${minimumBytes} bytes, but the view is ` +
        `${bytes.byteLength}` )
  }

  const address = new Uint32Array( count )
  const length = new Uint32Array( count )
  const typeID = new Int32Array( count )

  // Sized to the TOP-LEVEL count, exactly as ColumnarIndexSink.finalize
  // leaves it — inline rows have no express ID, and a column sized to
  // `count` would restore an index that is not the one that was written.
  const expressID = new Uint32Array( firstInlineElement )

  readColumn( bytes, view, offset, address, count ); offset += count * U32_BYTES
  readColumn( bytes, view, offset, length, count ); offset += count * U32_BYTES
  readColumn( bytes, view, offset, typeID, count ); offset += count * U32_BYTES
  readColumn( bytes, view, offset, expressID, firstInlineElement )
  offset += firstInlineElement * U32_BYTES

  let complexEntries: Map<number, StepIndexEntry<TypeIDType>> | undefined

  if ( complexCount > 0 ) {

    complexEntries = new Map<number, StepIndexEntry<TypeIDType>>()

    const cursor = { offset }

    for ( let where = 0; where < complexCount; ++where ) {

      const localID = view.getUint32( cursor.offset, true )
      cursor.offset += U32_BYTES

      complexEntries.set(
          localID,
          readComplexEntry<TypeIDType>( view, cursor ) as StepIndexEntry<TypeIDType> )
    }
  }

  return {
    version,
    sourceByteLength,
    sourceHash,
    columns: {
      address,
      length,
      typeID,
      expressID,
      count,
      firstInlineElement,
      complexEntries,
      expressIdsSorted: ( flags & FLAG_EXPRESS_IDS_SORTED ) !== 0,
    },
  }
}


/**
 * Validate a decoded sidecar against the actual source identity — the full
 * gate, for the revisit case where the file really may have changed. The
 * index-first open calls this before trusting the sidecar; on false it must
 * fall back to a cold scan.
 *
 * @param sidecar The decoded sidecar's source identity.
 * @param sourceByteLength The actual source length.
 * @param sourceHash The actual source hash.
 * @return {boolean} True if the sidecar matches the source.
 */
export function sidecarMatchesSource(
    sidecar: SidecarSourceIdentity,
    sourceByteLength: number,
    sourceHash: number ): boolean {

  return sidecarMatchesSourceLength( sidecar, sourceByteLength ) &&
    sidecar.sourceHash === ( sourceHash >>> 0 )
}


/**
 * The bounded half of the gate: length only, for the distribution case
 * where the hash was taken by the coordinator over the same store handle
 * within one session (see the module comment's "trust gate"). Hashing here
 * instead would re-read the whole file per consumer — the N-way I/O a
 * shared index exists to remove.
 *
 * @param sidecar The decoded sidecar's source identity.
 * @param sourceByteLength The actual source length.
 * @return {boolean} True if the sidecar was built against a source of this
 * length.
 */
export function sidecarMatchesSourceLength(
    sidecar: SidecarSourceIdentity,
    sourceByteLength: number ): boolean {

  return sidecar.sourceByteLength === sourceByteLength
}
