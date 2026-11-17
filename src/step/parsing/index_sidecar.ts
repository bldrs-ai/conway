import { ColumnarIndexSink, StepIndexColumns } from './columnar_index'
import { StepIndexEntry, StepIndexEntryBase } from './step_parser'
import EntityTypesIfc, { EntityTypesIfcCount } from '../../ifc/ifc4_gen/entity_types_ifc.gen'


/**
 * Index sidecar (M4): a compact, version-stamped binary serialisation of a
 * model's parse index, so a revisit — or a worker handed the coordinator's
 * index — can open **index-first** (`openIfcModelFromIndex` /
 * `IfcAPI.OpenModelFromIndex`): reconstruct the entity index without
 * re-scanning the source, then fetch only the byte ranges demand asks for.
 *
 * ## v3 layout (all little-endian)
 *
 * ```
 *   'CIDX'              4    magic
 *   version             u32  (= 3)
 *   sourceByteLength    f64  length of the source the index was built from
 *   sourceHash          u32  digest of the whole source — the handshake
 *   count               u32  TOTAL rows: top-level + inline
 *   firstInlineElement  u32  start of the inline range
 *   flags               u32  bit 0 = expressIdsSorted,
 *                            bit 1 = field-mask table present
 *   complexCount        u32  number of multi-mapping holders
 *   schema              u32  which type enumeration `typeID` indexes
 *                            (SidecarSchema: 1 = IFC, 2 = AP214)
 *   schemaTypeCount     u32  that enumeration's size when written
 *   schemaTypeDigest    u32  FNV-1a of its ordinal → name mapping
 *                            (sidecarSchemaStamp)
 *   hashAlgorithm       u32  what `sourceHash` is (1 = FNV-1a 32,
 *                            chained; 2 = SHA-256 of 4 MiB blocks,
 *                            chained, truncated — source_hash.ts
 *                            #Sha256BlockFold). `sampledHash` is FNV-1a
 *                            under both
 *   sampledHash         u32  digest of the sampled source blocks
 *                            (sampledSourceSpans), 0 = not recorded
 *   fieldMaskCount      u32  rows in the field-mask table
 *   address[]           u32 × count
 *   length[]            u32 × count
 *   typeID[]            i32 × count      (−1 = no concrete type)
 *   expressID[]         u32 × firstInlineElement
 *   complexEntries      complexCount × { localID u32, entry }
 *       entry:  address u32, length u32, typeID i32, flags u32,
 *               expressID u32, multiCount u32, multiCount × entry
 *   fieldMasks          fieldMaskCount × { expressID u32, decodedFieldCount u32 }
 * ```
 *
 * ## Why v3 exists — the schema, and one bump for three asks
 *
 * v2 did not say which schema built it (conway#757): `typeID` is an index
 * into a type enumeration, and an AP214 index read against IFC's would
 * restore rows typed as whatever IFC entity happens to share the ordinal.
 * v3 stamps the schema, the enumeration's size, and a digest of its whole
 * ordinal → name mapping, and every reader that builds a model refuses a
 * mismatch with {@link IndexSidecarStaleError} (reason `'schema'`), whose
 * remedy — parse — is the right one: a persisted sidecar written before a
 * schema regeneration renumbered the enumeration is refused rather than
 * retyping the model. The digest is what catches a regeneration that
 * reorders members without changing their count (codex review of
 * conway#769); the size alone would let that through.
 *
 * The same bump carries conway#758's two slots, so the format changes
 * once: the field-mask table the IFC4-compatible IFC4X3 route needs
 * (written when the caller supplies masks; the index-first open that would
 * consume one for an IFC4X3 header is conway#758's), and a sampled digest
 * beside the whole-source one, which lets a revisit verify a persisted
 * sidecar against its store by reading about 0.5 MB instead of the file
 * ({@link sampledSourceSpans}). `hashAlgorithm` makes a faster digest an
 * algorithm id rather than another version.
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
 *    Every streaming IFC open does that fold when asked to
 *    (`RECORD_SOURCE_HASH` / `recordSourceHash`), recording the digest on
 *    the model (`StepModelBase.indexedSourceHash`, conway#756), so the
 *    coordinator half of this gate has its hash in hand when the parse
 *    ends.
 *  - **Revisit** (a persisted sidecar, where the file really may have
 *    changed): full {@link sidecarMatchesSource} against a fresh digest of
 *    the store, taken with the algorithm the sidecar names.
 *
 * ## Which digest (`hashAlgorithm`, bldrs-ai/Share#2092)
 *
 * Id 1 is the chained FNV-1a above: a per-byte JS loop. Id 2
 * ({@link SIDECAR_HASH_SHA256_BLOCKS}) is a native SHA-256 of each 4 MiB
 * block, chained and truncated to the same 32-bit slot
 * (`source_hash.ts#Sha256BlockFold`), recorded when an open is asked for it
 * (`SOURCE_HASH_ALGORITHM: 'sha256Blocks'`). It exists because the FNV loop,
 * ~1.2 s of V8 CPU on a 902 MB model, cost about 10 s of PSB's parse in
 * Firefox's engine worker; the block digest runs no JS loop over the bytes
 * at all. A verify always runs the id the sidecar carries, so FNV sidecars
 * persisted before id 2 keep verifying. The sampled digest is FNV-1a under
 * both ids, so what each verify mode does is (`step_index_open.ts`
 * #assertSidecarDescribesStore has the table): an id this reader does not
 * know is stale (`'algorithm'`) in every mode, before any decode; id 2 with
 * no WebCrypto is stale under the full check (`true`), which would need the
 * block digest, while `'sampled'` still verifies it (sampled FNV) and
 * `false` checks its length, exactly as those modes treat id 1. A reader
 * that predates id 2 refuses it under `true` (its FNV does not match) and
 * fails its decode otherwise (a plain error, not `INDEX_STALE`: that
 * reader knows no `'algorithm'` reason).
 *
 * ## The producer: export from an open model (conway#756)
 *
 * `exportIfcIndexSidecar` (`src/ifc/ifc_index_sidecar_export.ts`) and the
 * compat `IfcAPI.ExportIndexSidecar` write a sidecar from a model that is
 * already open — resident, windowed from birth, spilled, or itself opened
 * from a sidecar — so an embedder that terminates an engine to free it can
 * bring the next one up index-first instead of re-parsing. The columns come
 * straight off the model (`StepModelBase.indexColumns`), and the hash is
 * the one the open recorded (`StepModelBase.indexedSourceHash`) — folded
 * into the streaming parse's own pass through `HashingByteSource`, so it is
 * the digest of exactly the bytes the index describes, never of whatever
 * the source holds by the time the export runs (codex review of
 * conway#760).
 *
 * A mismatch at open is an {@link IndexSidecarStaleError}, not a generic
 * throw, so a caller can tell "this sidecar is for another file — parse"
 * from "the store failed"; the compat surface records it as load status
 * `INDEX_STALE`. A model whose index the format cannot carry (the IFC4X3
 * compat route's field masks; any non-IFC schema) is refused at export
 * with an {@link IndexSidecarUnsupportedError}, never written lossily.
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
export const SIDECAR_VERSION = 3

/** The schema-less version (conway#541/#756) — rejected on read. */
export const SIDECAR_VERSION_UNSTAMPED = 2

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

/** `flags` bit 1 — a field-mask table follows the complex entries. */
const FLAG_FIELD_MASKS = 2

/** `hashAlgorithm`: chained FNV-1a 32 ({@link hashSource}). */
export const SIDECAR_HASH_FNV1A_32 = 1

/**
 * `hashAlgorithm`: native SHA-256 over 4 MiB blocks, chained and truncated
 * to 32 bits (`source_hash.ts#Sha256BlockFold`, bldrs-ai/Share#2092). The
 * sampled digest stays FNV-1a. Added without a version bump, which is what
 * the slot is for: a reader that predates it refuses the blob (its full
 * verify computes FNV, which does not match, so the open is stale; without
 * a verify, its decode throws on the id), and this reader still verifies
 * every id-1 sidecar already persisted.
 */
export const SIDECAR_HASH_SHA256_BLOCKS = 2

/**
 * Is `id` a `hashAlgorithm` this reader can decode?
 *
 * @param id The slot's value.
 * @return {boolean} True for {@link SIDECAR_HASH_FNV1A_32} and
 * {@link SIDECAR_HASH_SHA256_BLOCKS}.
 */
export function isKnownSidecarHashAlgorithm( id: number ): boolean {
  return id === SIDECAR_HASH_FNV1A_32 || id === SIDECAR_HASH_SHA256_BLOCKS
}


/**
 * Which type enumeration a sidecar's `typeID` column indexes. One value per
 * enumeration, not per FILE_SCHEMA spelling: IFC2X3 and IFC4 files both
 * index `EntityTypesIfc`, and AP203/AP242 files open through the AP214
 * engine and index its extended enumeration.
 */
export enum SidecarSchema {
  IFC = 1,
  AP214 = 2,
}


/**
 * The schema stamp a sidecar is written with and checked against: the
 * enumeration, its size, and a digest of its ordinal → name mapping at the
 * time, so an index written before a schema regeneration renumbered it is
 * refused rather than retyped. Build one with {@link sidecarSchemaStamp}.
 */
export interface SidecarSchemaStamp {
  schema: SidecarSchema
  typeCount: number
  typeDigest: number
}


/**
 * Build a schema stamp from the enumeration itself: FNV-1a over every
 * ordinal's name in ordinal order, newline-separated (an ordinal with no
 * name contributes an empty one). Computed once per schema at module load
 * — about a thousand names.
 *
 * @param schema The enumeration.
 * @param typeCount Its size.
 * @param nameOf The name of each ordinal.
 * @return {SidecarSchemaStamp} The frozen stamp.
 */
export function sidecarSchemaStamp(
    schema: SidecarSchema,
    typeCount: number,
    nameOf: ( ordinal: number ) => string | undefined ): SidecarSchemaStamp {

  const encoder = new TextEncoder()
  let digest = FNV_OFFSET_BASIS >>> 0

  for ( let ordinal = 0; ordinal < typeCount; ++ordinal ) {
    digest = foldFnv1a( digest, encoder.encode( `${nameOf( ordinal ) ?? ''}\n` ) )
  }

  return Object.freeze( { schema, typeCount, typeDigest: digest >>> 0 } )
}


/**
 * The IFC stamp — `EntityTypesIfc` as generated now. The default for
 * {@link serializeIndexSidecarFromColumns}, since IFC was the only schema
 * that wrote sidecars before v3; every other schema passes its own.
 */
export const IFC_SIDECAR_SCHEMA: SidecarSchemaStamp = sidecarSchemaStamp(
    SidecarSchema.IFC, EntityTypesIfcCount, ( ordinal ) => EntityTypesIfc[ ordinal ] )


/**
 * Everything beyond the columns and the whole-source identity that a v3
 * sidecar can carry. All optional.
 */
export interface SidecarExtras {

  /** The schema stamp (default {@link IFC_SIDECAR_SCHEMA}). */
  schema?: SidecarSchemaStamp

  /**
   * The sampled digest ({@link hashSampledSource}) of the same bytes as
   * `sourceHash`; omitted, the slot reads 0 and a sampled verify of this
   * sidecar falls back to the full one.
   */
  sampledHash?: number

  /**
   * The `hashAlgorithm` id `sourceHash` was taken with (default
   * {@link SIDECAR_HASH_FNV1A_32}).
   */
  hashAlgorithm?: number

  /**
   * Decoded-field counts by express ID (`StepModelBase.setFieldMasks`), for
   * an index translated by the IFC4-compatible IFC4X3 route.
   */
  fieldMasks?: ReadonlyMap< number, number >
}

// Byte sizes of the fixed header fields, in order.
const HEADER_BYTES =
  4 + // magic
  4 + // version
  8 + // sourceByteLength (f64)
  4 + // sourceHash (u32)
  4 + // count (u32)
  4 + // firstInlineElement (u32)
  4 + // flags (u32)
  4 + // complexCount (u32)
  4 + // schema (u32)
  4 + // schemaTypeCount (u32)
  4 + // schemaTypeDigest (u32)
  4 + // hashAlgorithm (u32)
  4 + // sampledHash (u32)
  4   // fieldMaskCount (u32)

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


/** Which half of the trust gate an {@link IndexSidecarStaleError} failed. */
export type IndexSidecarStaleReason = 'length' | 'hash' | 'schema' | 'algorithm'


/**
 * A sidecar that does not describe the source it is being opened against:
 * the source's length differs from the one recorded, or (when the full gate
 * runs) its hash does. The caller's move is a cold parse — the index
 * addresses some other byte string, and trusting it would serve wrong
 * records rather than fail (conway#756).
 *
 * Typed rather than a plain `Error` so that move can be keyed on: a store
 * that rejected a read, or a corrupt blob, is a different failure with a
 * different remedy.
 */
export class IndexSidecarStaleError extends Error {

  /**
   * @param reason Which check failed.
   * @param expected What the sidecar recorded (length in bytes, hash, or —
   * for `'schema'` — the packed stamp, `schema * 1e6 + typeCount`).
   * @param actual What the source or open actually has, in the same unit.
   */
  constructor(
      public readonly reason: IndexSidecarStaleReason,
      public readonly expected: number,
      public readonly actual: number ) {

    super( reason === 'length' ?
      `Sidecar was built against ${expected} bytes but the store holds ` +
      `${actual}` :
      reason === 'algorithm' ?
        `Sidecar's source hash (algorithm ${expected}) cannot be verified ` +
        'here (no crypto.subtle.digest, or an unknown algorithm); rebuild ' +
        'it with a parse' :
      reason === 'schema' ?
        `Sidecar indexes a different type enumeration (sidecar schema ` +
        `${expected}, this open ${actual}); rebuild it with a parse` :
        `Sidecar hash does not match the store contents (sidecar ` +
        `0x${( expected >>> 0 ).toString( HEX )}, store ` +
        `0x${( actual >>> 0 ).toString( HEX )})` )

    this.name = 'IndexSidecarStaleError'
  }
}


/**
 * An open model whose index the sidecar format cannot represent, refused at
 * export rather than written lossily (conway#756) — e.g. an IFC4X3 model on
 * the IFC4-compatible route, whose per-record field masks have no slot in
 * v2, or a model of a schema the index-first open does not take.
 */
export class IndexSidecarUnsupportedError extends Error {

  /**
   * @param message Why the export was refused.
   */
  constructor( message: string ) {
    super( message )
    this.name = 'IndexSidecarUnsupportedError'
  }
}


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

  /**
   * The `hashAlgorithm` id `sourceHash` was taken with
   * ({@link SIDECAR_HASH_FNV1A_32} or {@link SIDECAR_HASH_SHA256_BLOCKS});
   * absent reads as FNV, the only id before bldrs-ai/Share#2092.
   */
  hashAlgorithm?: number

  /**
   * Sampled digest of the source ({@link hashSampledSource}), when the
   * sidecar recorded one.
   */
  sampledHash?: number

  /** The schema stamp, when the blob carries one (every v3 blob does). */
  schema?: SidecarSchemaStamp
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

  /** The field-mask table, when the blob carries one. */
  fieldMasks?: Map< number, number >
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


/** Bytes hashed at each end of the source by {@link sampledSourceSpans}. */
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (64 KiB)
export const SAMPLED_HASH_EDGE_BYTES = 64 * 1024

/** Bytes per interior block of {@link sampledSourceSpans}. */
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (4 KiB)
export const SAMPLED_HASH_BLOCK_BYTES = 4 * 1024

/** Interior blocks {@link sampledSourceSpans} takes, evenly strided. */
export const SAMPLED_HASH_BLOCKS = 96


/**
 * The byte ranges the sampled digest covers for a source of this length
 * (conway#758): the first and last {@link SAMPLED_HASH_EDGE_BYTES}, and
 * {@link SAMPLED_HASH_BLOCKS} blocks of {@link SAMPLED_HASH_BLOCK_BYTES}
 * strided evenly between them — about 0.5 MB on any file, with positions
 * that depend on the length alone, so a writer and a later verifier agree
 * on them without storing them. Sorted, non-overlapping, half-open; a
 * source no longer than the samples would be is one span over the whole.
 *
 * What it catches: truncation and extension (the length check already
 * does), replacement by a different file, and an edit that lands in any
 * sampled block. What it misses: a same-length in-place edit outside every
 * block — which a store keyed by content or revision (Share's OPFS cache)
 * does not produce. The whole-source `sourceHash` stays for stores that
 * might.
 *
 * @param byteLength The source length.
 * @return {Array<[number, number]>} `[start, end)` spans in file order.
 */
export function sampledSourceSpans( byteLength: number ): Array< [ number, number ] > {

  const sampledTotal =
    2 * SAMPLED_HASH_EDGE_BYTES + SAMPLED_HASH_BLOCKS * SAMPLED_HASH_BLOCK_BYTES

  if ( byteLength <= sampledTotal ) {
    return byteLength > 0 ? [ [ 0, byteLength ] ] : []
  }

  const spans: Array< [ number, number ] > = [ [ 0, SAMPLED_HASH_EDGE_BYTES ] ]
  const interiorStart = SAMPLED_HASH_EDGE_BYTES
  const interiorEnd = byteLength - SAMPLED_HASH_EDGE_BYTES
  const stride = ( interiorEnd - interiorStart ) / SAMPLED_HASH_BLOCKS

  for ( let block = 0; block < SAMPLED_HASH_BLOCKS; ++block ) {

    // Each block starts at the beginning of its stride and is clamped to
    // it, so blocks never overlap each other or the tail span.
    const start = interiorStart + Math.floor( block * stride )
    const end = Math.min( start + SAMPLED_HASH_BLOCK_BYTES, interiorEnd )

    if ( end > start ) {
      spans.push( [ start, end ] )
    }
  }

  spans.push( [ interiorEnd, byteLength ] )

  return spans
}


/**
 * FNV-1a over the {@link sampledSourceSpans} of a source, chained in file
 * order and seeded with the length (so two sources whose samples happen to
 * agree but whose lengths do not still differ in the digest, not only in
 * the separate length check).
 *
 * @param byteLength The source length.
 * @param read Reads one span's bytes.
 * @return {Promise<number>} The 32-bit digest.
 */
export async function hashSampledSource(
    byteLength: number,
    read: ( offset: number, length: number ) => Uint8Array | Promise< Uint8Array > ):
    Promise< number > {

  let hash = foldFnv1a( FNV_OFFSET_BASIS >>> 0, lengthBytes( byteLength ) )

  for ( const [ start, end ] of sampledSourceSpans( byteLength ) ) {
    hash = foldFnv1a( hash, await read( start, end - start ) )
  }

  return hash >>> 0
}


/**
 * {@link hashSampledSource}, folded incrementally from bytes that arrive
 * once, in file order — the form a streaming parse can carry in the pass it
 * already makes (`HashingByteSource`), so recording the sampled digest at
 * open costs no read of its own. Feed every byte of the source exactly
 * once, from offset 0 upward; {@link digest} then equals
 * `hashSampledSource` over the same bytes.
 */
export class SampledHashFold {

  private hash_: number

  private readonly spans_: Array< [ number, number ] >

  private span_ = 0

  /**
   * @param byteLength The length of the source that will be fed.
   */
  constructor( byteLength: number ) {
    this.hash_ = foldFnv1a( FNV_OFFSET_BASIS >>> 0, lengthBytes( byteLength ) )
    this.spans_ = sampledSourceSpans( byteLength )
  }

  /**
   * Fold the sampled part of `bytes[from, to)`, which holds the source's
   * bytes starting at absolute offset `absoluteStart`.
   *
   * @param bytes The buffer.
   * @param from First index in `bytes`.
   * @param to One past the last index in `bytes`.
   * @param absoluteStart The source offset of `bytes[from]`.
   */
  public fold( bytes: Uint8Array, from: number, to: number, absoluteStart: number ): void {

    const absoluteEnd = absoluteStart + ( to - from )

    while ( this.span_ < this.spans_.length ) {

      const [ spanStart, spanEnd ] = this.spans_[ this.span_ ]

      if ( spanStart >= absoluteEnd ) {
        return
      }

      const start = Math.max( spanStart, absoluteStart )
      const end = Math.min( spanEnd, absoluteEnd )

      if ( end > start ) {
        this.hash_ = foldFnv1a(
            this.hash_,
            bytes.subarray( from + start - absoluteStart, from + end - absoluteStart ) )
      }

      if ( spanEnd > absoluteEnd ) {
        return
      }

      ++this.span_
    }
  }

  /**
   * @return {number} The digest of what has been fed.
   */
  public get digest(): number {
    return this.hash_ >>> 0
  }
}


/**
 * Synchronous twin of {@link hashSampledSource}, for a resident buffer.
 *
 * @param source The whole source.
 * @return {number} The 32-bit digest.
 */
export function hashSampledBuffer( source: Uint8Array ): number {

  let hash = foldFnv1a( FNV_OFFSET_BASIS >>> 0, lengthBytes( source.byteLength ) )

  for ( const [ start, end ] of sampledSourceSpans( source.byteLength ) ) {
    hash = foldFnv1a( hash, source.subarray( start, end ) )
  }

  return hash >>> 0
}


/**
 * The length as 8 little-endian bytes (an f64), the digest's seed.
 *
 * @param byteLength The source length.
 * @return {Uint8Array} The bytes.
 */
function lengthBytes( byteLength: number ): Uint8Array {

  const bytes = new Uint8Array( F64_BYTES )

  new DataView( bytes.buffer ).setFloat64( 0, byteLength, true )

  return bytes
}


/**
 * Continue an FNV-1a 32 over more bytes.
 *
 * @param hash The running hash.
 * @param bytes The bytes to fold.
 * @return {number} The updated hash.
 */
function foldFnv1a( hash: number, bytes: Uint8Array ): number {

  for ( let where = 0; where < bytes.length; ++where ) {
    hash ^= bytes[ where ]
    hash = Math.imul( hash, FNV_PRIME ) >>> 0
  }

  return hash
}


/**
 * Pack a schema stamp into one number, for {@link IndexSidecarStaleError}'s
 * expected/actual pair.
 *
 * @param stamp The stamp.
 * @return {number} `schema * 1e6 + typeCount`.
 */
function packStamp( stamp: SidecarSchemaStamp ): number {
  // eslint-disable-next-line no-magic-numbers
  return stamp.schema * 1e6 + stamp.typeCount
}


/**
 * The stamp field pair an {@link IndexSidecarStaleError} reports: the
 * packed schema and size when those differ, else the two digests.
 *
 * @param actual The sidecar's stamp.
 * @param expected The open's stamp.
 * @return {[number, number]} `[sidecar's, open's]`.
 */
function stampDifference(
    actual: SidecarSchemaStamp, expected: SidecarSchemaStamp ): [ number, number ] {

  return packStamp( actual ) !== packStamp( expected ) ?
    [ packStamp( actual ), packStamp( expected ) ] :
    [ actual.typeDigest, expected.typeDigest ]
}


/**
 * Refuse a decoded sidecar whose schema stamp is not the one this open
 * types its model with — the check v2 had no slot for (conway#757). A
 * {@link IndexSidecarStaleError} with reason `'schema'`, because the remedy
 * is the same as for a changed file: parse.
 *
 * @param identity The decoded sidecar's identity.
 * @param expected The stamp of the schema this open builds.
 */
export function assertSidecarSchema(
    identity: SidecarSourceIdentity,
    expected: SidecarSchemaStamp ): void {

  const actual = identity.schema

  if ( actual === void 0 ||
       actual.schema !== expected.schema ||
       actual.typeCount !== expected.typeCount ||
       actual.typeDigest !== expected.typeDigest ) {

    const [ sidecar, open ] =
      actual === void 0 ? [ 0, packStamp( expected ) ] : stampDifference( actual, expected )

    throw new IndexSidecarStaleError( 'schema', sidecar, open )
  }
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
 * @param extras The schema stamp (default IFC), sampled digest and field
 * masks — see {@link SidecarExtras}.
 * @return {Uint8Array} The sidecar bytes.
 */
export function serializeIndexSidecarFromColumns<TypeIDType extends number>(
    columns: StepIndexColumns<TypeIDType>,
    sourceByteLength: number,
    sourceHash: number,
    extras?: SidecarExtras ): Uint8Array {

  const schema = extras?.schema ?? IFC_SIDECAR_SCHEMA
  const hashAlgorithm = extras?.hashAlgorithm ?? SIDECAR_HASH_FNV1A_32
  const fieldMasks = extras?.fieldMasks

  if ( !isKnownSidecarHashAlgorithm( hashAlgorithm ) ) {
    throw new Error( `Unknown sidecar hash algorithm ${hashAlgorithm}` )
  }
  const fieldMaskCount = fieldMasks?.size ?? 0

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
    complexBytes +
    fieldMaskCount * 2 * U32_BYTES

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
      offset,
      ( columns.expressIdsSorted ? FLAG_EXPRESS_IDS_SORTED : 0 ) |
        ( fieldMasks !== void 0 ? FLAG_FIELD_MASKS : 0 ),
      true )
  offset += U32_BYTES
  view.setUint32( offset, complexCount, true ); offset += U32_BYTES
  view.setUint32( offset, schema.schema, true ); offset += U32_BYTES
  view.setUint32( offset, schema.typeCount, true ); offset += U32_BYTES
  view.setUint32( offset, schema.typeDigest >>> 0, true ); offset += U32_BYTES
  view.setUint32( offset, hashAlgorithm, true ); offset += U32_BYTES
  view.setUint32( offset, ( extras?.sampledHash ?? 0 ) >>> 0, true ); offset += U32_BYTES
  view.setUint32( offset, fieldMaskCount, true ); offset += U32_BYTES

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

  for ( const [ expressID, decodedFieldCount ] of fieldMasks ?? [] ) {
    view.setUint32( offset, expressID >>> 0, true ); offset += U32_BYTES
    view.setUint32( offset, decodedFieldCount >>> 0, true ); offset += U32_BYTES
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
 * Refuse a blob that is not a sidecar this module reads: wrong magic, or any
 * version but {@link SIDECAR_VERSION}. One helper for both the header-only
 * read and the full decode, so the v1 explanation — the one an embedder
 * holding persisted v1 sidecars needs, "rebuild the index" — reads the same
 * whichever runs first (conway#760 round 3).
 *
 * @param view A view over at least the first 8 bytes.
 * @return {number} The version (always {@link SIDECAR_VERSION}).
 */
function requireSidecarMagicAndVersion( view: DataView ): number {

  const magic = view.getUint32( 0, true )

  if ( magic !== MAGIC ) {
    throw new Error( `Not a sidecar: bad magic 0x${magic.toString( HEX )}` )
  }

  const version = view.getUint32( U32_BYTES, true )

  if ( version !== SIDECAR_VERSION ) {
    throw new Error(
        `Unsupported sidecar version ${version} (expected ${SIDECAR_VERSION})` +
        ( version === SIDECAR_VERSION_TOP_LEVEL_ONLY ?
          ': v1 carries top-level rows only and would silently drop every ' +
          'inline entity — rebuild the index' :
          version === SIDECAR_VERSION_UNSTAMPED ?
            ': v2 does not record which schema built it — rebuild the index' :
            '' ) )
  }

  return version
}


/**
 * Read only a sidecar's header: its source identity, without restoring the
 * index. Checks the magic and version exactly as the full decode does, and
 * throws on the same blobs, so a caller can apply the trust gate before
 * paying for the column copy — or before some other refusal would mask a
 * stale sidecar as a different failure (codex review of conway#760).
 *
 * @param bytes The sidecar bytes.
 * @return {SidecarSourceIdentity} The recorded source length and hash.
 */
export function readSidecarSourceIdentity( bytes: Uint8Array ): SidecarSourceIdentity {

  if ( bytes.byteLength < HEADER_BYTES ) {
    throw new Error(
        `Truncated sidecar: ${bytes.byteLength} bytes is shorter than the ` +
        `${HEADER_BYTES}-byte header` )
  }

  const view = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength )

  requireSidecarMagicAndVersion( view )

  return readIdentityFields( view )
}


// Byte offset of the v3 header's schema slot: magic, version, length,
// hash, count, firstInlineElement, flags, complexCount.
const SCHEMA_OFFSET = U32_BYTES * 2 + F64_BYTES + U32_BYTES * 5


/**
 * Read the identity fields — length, hash, sampled hash, schema stamp — of
 * a header already checked by {@link requireSidecarMagicAndVersion}.
 *
 * @param view A view over at least the header.
 * @return {SidecarSourceIdentity} The identity.
 */
function readIdentityFields( view: DataView ): SidecarSourceIdentity {

  const sampledHash = view.getUint32( SCHEMA_OFFSET + U32_BYTES * 4, true )

  return {
    sourceByteLength: view.getFloat64( U32_BYTES * 2, true ),
    sourceHash: view.getUint32( U32_BYTES * 2 + F64_BYTES, true ),
    hashAlgorithm: view.getUint32( SCHEMA_OFFSET + U32_BYTES * 3, true ),
    sampledHash: sampledHash === 0 ? void 0 : sampledHash,
    schema: {
      schema: view.getUint32( SCHEMA_OFFSET, true ) as SidecarSchema,
      typeCount: view.getUint32( SCHEMA_OFFSET + U32_BYTES, true ),
      typeDigest: view.getUint32( SCHEMA_OFFSET + U32_BYTES * 2, true ),
    },
  }
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
 * @param expectedSchema The stamp of the schema the caller will type the
 * model with; a mismatch throws {@link IndexSidecarStaleError} (`'schema'`)
 * before any column is read. Omit for a raw decode.
 * @return {DecodedSidecarColumns} Source identity + the columnar index.
 */
export function deserializeIndexSidecarToColumns<TypeIDType extends number>(
    bytes: Uint8Array,
    expectedSchema?: SidecarSchemaStamp ): DecodedSidecarColumns<TypeIDType> {

  if ( bytes.byteLength < HEADER_BYTES ) {
    throw new Error(
        `Truncated sidecar: ${bytes.byteLength} bytes is shorter than the ` +
        `${HEADER_BYTES}-byte header` )
  }

  const view = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength )

  const version = requireSidecarMagicAndVersion( view )
  const identity = readIdentityFields( view )

  // Before any column is copied: an index typed against another
  // enumeration is refused as stale, not decoded (conway#757).
  if ( expectedSchema !== void 0 ) {
    assertSidecarSchema( identity, expectedSchema )
  }

  let offset = 2 * U32_BYTES

  const sourceByteLength = view.getFloat64( offset, true ); offset += F64_BYTES
  const sourceHash = view.getUint32( offset, true ); offset += U32_BYTES
  const count = view.getUint32( offset, true ); offset += U32_BYTES
  const firstInlineElement = view.getUint32( offset, true ); offset += U32_BYTES
  const flags = view.getUint32( offset, true ); offset += U32_BYTES
  const complexCount = view.getUint32( offset, true ); offset += U32_BYTES

  // schema, schemaTypeCount, schemaTypeDigest, hashAlgorithm, sampledHash —
  // read above via readIdentityFields — then the field-mask count.
  offset += U32_BYTES * 5

  const hashAlgorithm = view.getUint32( SCHEMA_OFFSET + U32_BYTES * 3, true )
  const fieldMaskCount = view.getUint32( offset, true ); offset += U32_BYTES

  if ( !isKnownSidecarHashAlgorithm( hashAlgorithm ) ) {
    throw new Error( `Unsupported sidecar hash algorithm ${hashAlgorithm}` )
  }

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
    complexCount * ( U32_BYTES + COMPLEX_ENTRY_FIXED_BYTES ) +
    fieldMaskCount * 2 * U32_BYTES

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

  const cursor = { offset }

  if ( complexCount > 0 ) {

    complexEntries = new Map<number, StepIndexEntry<TypeIDType>>()

    for ( let where = 0; where < complexCount; ++where ) {

      const localID = view.getUint32( cursor.offset, true )
      cursor.offset += U32_BYTES

      complexEntries.set(
          localID,
          readComplexEntry<TypeIDType>( view, cursor ) as StepIndexEntry<TypeIDType> )
    }
  }

  let fieldMasks: Map< number, number > | undefined

  if ( ( flags & FLAG_FIELD_MASKS ) !== 0 ) {

    fieldMasks = new Map< number, number >()

    for ( let where = 0; where < fieldMaskCount; ++where ) {

      const expressID = view.getUint32( cursor.offset, true )
      const decodedFieldCount = view.getUint32( cursor.offset + U32_BYTES, true )

      cursor.offset += 2 * U32_BYTES
      fieldMasks.set( expressID, decodedFieldCount )
    }
  }

  return {
    version,
    sourceByteLength,
    sourceHash,
    hashAlgorithm,
    sampledHash: identity.sampledHash,
    schema: identity.schema,
    fieldMasks,
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
 * @param sourceHash The actual source hash, taken with the algorithm the
 * sidecar names (`sidecar.hashAlgorithm`).
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
