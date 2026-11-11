import ParsingBuffer from '../parsing/parsing_buffer'
import { StoreByteSource } from './parsing/byte_source'
import { StepIndexColumns } from './parsing/columnar_index'
import {
  deserializeIndexSidecarToColumns,
  hashSampledSource,
  IndexSidecarStaleError,
  isKnownSidecarHashAlgorithm,
  readSidecarSourceIdentity,
  SIDECAR_HASH_FNV1A_32,
  SIDECAR_HASH_SHA256_BLOCKS,
  SidecarSchemaStamp,
  SidecarSourceIdentity,
  sidecarMatchesSource,
  sidecarMatchesSourceLength,
} from './parsing/index_sidecar'
import { hashSourceAsync, nativeDigestProvider } from './parsing/source_hash'
import StepParser, { ParseResult, StepHeader } from './parsing/step_parser'
import { StepExternalByteStore } from './step_buffer_provider'


/**
 * The schema-neutral half of an index-first open, and of the trust gate
 * every one runs (conway#757). The IFC open (`openIfcModelFromIndex`,
 * `ifc_stream_open.ts`) and the AP214 one (`IfcApiProxyAP214`'s index
 * path) both come through here and differ only in the model they build
 * over the columns, the parser that reads the header, and the schema stamp
 * the sidecar must carry. Everything else — the identity check before the
 * column copy, the bounded header sniff and its one retry — is one body, so
 * the two formats cannot drift on what a stale sidecar is.
 */


// The header prefix an index-first open reads. 64 KiB is the same slice the
// store-backed open already pulls for format detection, so the common case
// costs one read of bytes the caller has in hand anyway. A header longer
// than that is legal STEP (a large FILE_DESCRIPTION), so the open grows the
// prefix once before it refuses — a valid model must not be turned away by
// the size of a buffer.
// eslint-disable-next-line no-magic-numbers
export const HEADER_PREFIX_BYTES = 64 * 1024

// eslint-disable-next-line no-magic-numbers
export const HEADER_PREFIX_RETRY_BYTES = 4 * 1024 * 1024


/**
 * How hard the trust gate checks a sidecar against its store:
 *
 *  - `false` — length only: the distribution gate (a coordinator's index
 *    handed to workers over the same store, one session);
 *  - `'sampled'` — length plus the sampled digest, about 0.5 MB read
 *    (`sampledSourceSpans`): the revisit gate for a store keyed by content
 *    or revision (conway#758). A sidecar with no sampled digest recorded
 *    falls back to the full check rather than to none;
 *  - `true` — length plus the whole-source digest, one full read.
 */
export type SidecarVerifyMode = boolean | 'sampled'


/**
 * Read and parse a STEP header from a bounded prefix of a random-access
 * store, growing the prefix once (to {@link HEADER_PREFIX_RETRY_BYTES}) on
 * failure before giving up.
 *
 * An index-first open has no data parse at all — the index comes from the
 * sidecar — so a bounded prefix sniff is the only place its header is ever
 * visible. Every other native open reads the header from its real parse
 * (`buildIndexStreaming`'s `onHeaderParsed` seam); do not use this as a
 * substitute for that seam (codex review of bldrs-ai/conway#713, round 4).
 *
 * Retried on ANY non-COMPLETE result, not on some "truncated" one:
 * `parseHeader` runs off the end of a short buffer into its ordinary
 * `syntaxError()` returns (it never reports INCOMPLETE), so a header that
 * did not fit is indistinguishable from a malformed one here. The retry is
 * bounded and only happens on the path that was about to throw.
 *
 * @param store The random-access store to read the header prefix from.
 * @param parser The schema's parser (its `parseHeader` is schema-neutral
 * STEP, but the caller's parser is the one its open uses).
 * @return {Promise<{header: StepHeader, result: ParseResult, prefixLength: number}>}
 * The parsed header, the parse result (check against `ParseResult.COMPLETE`
 * before trusting `header`), and the prefix length actually read.
 */
export async function parseStepHeaderFromStore< TypeIDType >(
    store: StepExternalByteStore,
    parser: StepParser< TypeIDType > ):
    Promise<{ header: StepHeader, result: ParseResult, prefixLength: number }> {

  let prefixLength = Math.min( store.byteLength, HEADER_PREFIX_BYTES )

  let [ header, headerResult ] =
    parser.parseHeader( new ParsingBuffer( await store.read( 0, prefixLength ) ) )

  if ( headerResult !== ParseResult.COMPLETE && prefixLength < store.byteLength ) {

    prefixLength = Math.min( store.byteLength, HEADER_PREFIX_RETRY_BYTES )

    ;( [ header, headerResult ] =
      parser.parseHeader( new ParsingBuffer( await store.read( 0, prefixLength ) ) ) )
  }

  return { header, result: headerResult, prefixLength }
}


/**
 * The sampled digest of a store's bytes (`hashSampledSource` over
 * `store.read`), synchronously when the store can (`readSync`).
 *
 * @param store The store.
 * @return {Promise<number>} The digest.
 */
export async function hashSampledStore( store: StepExternalByteStore ): Promise< number > {

  const readSync = store.readSync

  return await hashSampledSource( store.byteLength, readSync !== void 0 ?
    ( offset, length ) => readSync.call( store, offset, length ) :
    ( offset, length ) => store.read( offset, length ) )
}


/**
 * The sidecar trust gate, on its own: refuse with an
 * {@link IndexSidecarStaleError} unless `identity` (a decoded sidecar's
 * source identity) describes what `store` holds — its length always, plus
 * the sampled or whole-source digest by `verify` (see
 * {@link SidecarVerifyMode}, and `index_sidecar.ts` §"The trust gate").
 *
 * What each `verify` mode does with each `hashAlgorithm` (bldrs-ai/Share#2092,
 * codex review of conway#783). The sampled digest is FNV-1a over the
 * ~0.5 MB `sampledSourceSpans` under BOTH known ids — only the
 * whole-source digest differs — so `'sampled'` verifies an id-2 sidecar
 * with no WebCrypto at all, and `false` checks the length alone, as it
 * always has:
 *
 * | | id 1 (FNV) | id 2, WebCrypto | id 2, no WebCrypto | unknown id |
 * |---|---|---|---|---|
 * | `true` | FNV of the store | block digest of the store | **stale** (`'algorithm'`) | **stale** (`'algorithm'`) |
 * | `'sampled'` | sampled FNV | sampled FNV | sampled FNV | **stale** (`'algorithm'`) |
 * | `false` | length | length | length | **stale** (`'algorithm'`) |
 *
 * (`'sampled'` on a sidecar with no sampled digest runs the `true` row.)
 * Every row checks the length first.
 *
 * Exported so the compat factory can classify a source it is about to
 * refuse for another reason: a store truncated inside its header no longer
 * sniffs as a STEP format, and without this check first that open would
 * report "not IFC" rather than "this sidecar is for another file" (codex
 * review of conway#760).
 *
 * @param identity The sidecar's recorded source identity.
 * @param store The store being opened.
 * @param verify How hard to check.
 */
export async function assertSidecarDescribesStore(
    identity: SidecarSourceIdentity,
    store: StepExternalByteStore,
    verify: SidecarVerifyMode ): Promise<void> {

  if ( !sidecarMatchesSourceLength( identity, store.byteLength ) ) {
    throw new IndexSidecarStaleError(
        'length', identity.sourceByteLength, store.byteLength )
  }

  // A `hashAlgorithm` id this reader does not know is stale in EVERY mode,
  // here, before the column decode would throw a plain Error on it (codex
  // review of conway#783): the remedy is the caller's parse, and only
  // `INDEX_STALE` says so. A known id this runtime cannot compute (id 2
  // with no WebCrypto) is refused only where its digest would be computed,
  // the full check below — see the mode table in the doc comment.
  const algorithm = identity.hashAlgorithm ?? SIDECAR_HASH_FNV1A_32

  if ( !isKnownSidecarHashAlgorithm( algorithm ) ) {
    throw new IndexSidecarStaleError( 'algorithm', algorithm, 0 )
  }

  if ( verify === 'sampled' && identity.sampledHash !== void 0 ) {

    const sampled = await hashSampledStore( store )

    if ( sampled !== identity.sampledHash ) {
      throw new IndexSidecarStaleError( 'hash', identity.sampledHash, sampled )
    }

    return
  }

  if ( verify !== false ) {

    // The digest the sidecar was written with (bldrs-ai/Share#2092): every
    // sidecar persisted before the SHA-256 block digest existed is FNV-1a
    // and still verifies as such. One that names the block digest on a
    // platform with no WebCrypto digest cannot be checked, so it is stale —
    // the caller parses, as for any refusal — never trusted unverified.
    const provider =
      algorithm === SIDECAR_HASH_SHA256_BLOCKS ? nativeDigestProvider() : void 0

    if ( algorithm !== SIDECAR_HASH_FNV1A_32 && provider === void 0 ) {
      throw new IndexSidecarStaleError( 'algorithm', algorithm, 0 )
    }

    // Chunked, rather than materialising the file — the digest is
    // identical either way, and a windowed open must not need the whole
    // file resident to check its own index. Yields between chunks so a
    // worker stays responsive through it.
    const hashed = await hashSourceAsync(
        new StoreByteSource( store ), void 0,
        provider !== void 0 ? { algorithm: 'sha256Blocks', provider } : void 0 )

    if ( !sidecarMatchesSource( identity, store.byteLength, hashed ) ) {
      throw new IndexSidecarStaleError( 'hash', identity.sourceHash, hashed )
    }
  }
}


/**
 * An index restored from a sidecar, with the header read off its store.
 */
export interface RestoredStepIndex< TypeIDType extends number > {

  /** The restored columns — the sidecar's rows, in its row order. */
  columns: StepIndexColumns< TypeIDType >

  /** The sidecar's whole-source digest (the model adopts it). */
  sourceHash: number

  /** Its `hashAlgorithm` id (the model adopts that too). */
  hashAlgorithm: number

  /** The sidecar's sampled digest, when it recorded one. */
  sampledHash?: number

  /** The sidecar's field-mask table, when it carries one. */
  fieldMasks?: Map< number, number >

  /** The STEP header, from a bounded prefix of the store. */
  header: StepHeader

  /** Bytes read for the header. */
  prefixLength: number
}


/**
 * Restore an index from a sidecar against the store it describes: the
 * trust gate off the header alone (a stale sidecar is refused as stale
 * before the column copy — ~0.2 s and 151 MB on a 9 M-row index — and a
 * valid header over a corrupt body against the wrong store reports stale
 * rather than a decode failure, conway#760 round 2), then the schema check
 * and the column copy, then the header.
 *
 * Throws {@link IndexSidecarStaleError} for a sidecar that is for some
 * other file or schema, and a plain `Error` for a corrupt blob or a store
 * whose prefix is not a STEP header. No fallback: the caller decides.
 *
 * @param store The random-access store holding the source bytes.
 * @param sidecar The serialised index.
 * @param parser The schema's parser (for the header).
 * @param schema The stamp the sidecar must carry.
 * @param verify How hard to check the sidecar against the store.
 * @return {Promise<RestoredStepIndex>} The columns, identity and header.
 */
export async function restoreStepIndexFromSidecar< TypeIDType extends number >(
    store: StepExternalByteStore,
    sidecar: Uint8Array,
    parser: StepParser< TypeIDType >,
    schema: SidecarSchemaStamp,
    verify: SidecarVerifyMode ): Promise< RestoredStepIndex< TypeIDType > > {

  await assertSidecarDescribesStore( readSidecarSourceIdentity( sidecar ), store, verify )

  const restored = deserializeIndexSidecarToColumns< TypeIDType >( sidecar, schema )

  const { header, result, prefixLength } = await parseStepHeaderFromStore( store, parser )

  if ( result !== ParseResult.COMPLETE ) {
    // The length check passed but the bytes are not the file the index
    // describes (or not a STEP file at all). Loud, because the alternative
    // is a model built over an index that addresses someone else's bytes.
    throw new Error(
        `Index-first open could not parse a STEP header from the first ` +
        `${prefixLength} bytes (result ${result})` )
  }

  return {
    columns: restored.columns,
    sourceHash: restored.sourceHash,
    hashAlgorithm: restored.hashAlgorithm ?? SIDECAR_HASH_FNV1A_32,
    sampledHash: restored.sampledHash,
    fieldMasks: restored.fieldMasks,
    header,
    prefixLength,
  }
}
