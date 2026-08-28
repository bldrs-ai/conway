import { ByteSource, ReadableByteSource, StoreByteSource } from '../step/parsing/byte_source'
import { ColumnarIndexSink, StepIndexColumns } from '../step/parsing/columnar_index'
import {
  deserializeIndexSidecarToColumns,
  sidecarMatchesSource,
  sidecarMatchesSourceLength,
} from '../step/parsing/index_sidecar'
import { HashingByteSource } from '../step/parsing/source_hash'
import ParsingBuffer from '../parsing/parsing_buffer'
import { RecordEventHandler } from '../step/parsing/record_event'
import {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
  StreamingIndexStats,
} from '../step/parsing/streaming_index_builder'
import { ParseResult, StepHeader } from '../step/parsing/step_parser'
import {
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'
import EntityTypesIfc, { EntityTypesIfcCount } from './ifc4_gen/entity_types_ifc.gen'
import { PrefixTypeIndex } from '../step/parsing/prefix_type_index'
import { StepTypeIndexer } from '../step/indexing/step_type_indexer'
import IfcStepModel from './ifc_step_model'
import IfcStepParser from './ifc_step_parser'


/**
 * Options for a streamed IFC open. All optional; defaults suit a browser
 * worker over an OPFS-backed store.
 */
export interface StreamedIfcOpenOptions {

  /** Parse window size in bytes (default 1 MiB). */
  pool?: number

  /** Windowed provider chunk size (default: provider's). */
  chunkBytes?: number

  /** Windowed provider LRU cap in chunks (default: provider's). */
  maxResidentChunks?: number

  /**
   * Live per-record event — the M2 seam for incremental consumers (type
   * index, roots, cross-refs, names skeleton) that run while the model is
   * still parsing. Must be synchronous and cheap; see
   * {@link RecordEventHandler} for the payload and the window-lifetime rule
   * on the record bytes it hands over.
   */
  onRecordIndexed?: RecordEventHandler<EntityTypesIfc>

  /**
   * Caller-owned index sink. Pass one to hold the columns *while* the parse
   * runs — the seam a prefix-derived consumer reads
   * ({@link ifcPrefixTypeIndex}). Without it the columns only exist once the
   * open returns, which is too late for anything mid-parse.
   */
  indexSink?: ColumnarIndexSink<EntityTypesIfc>
}


/**
 * The result of a streamed IFC open: the windowed-source model plus the
 * artifacts a consumer needs around it.
 */
export interface StreamedIfcOpen {

  /** The model over the windowed source (undefined if the parse failed). */
  model: IfcStepModel | undefined

  /** The parse result. */
  result: ParseResult

  /** The STEP header (available even on some failed parses). */
  header: StepHeader

  /**
   * The columnar index the model was built from. Hand to
   * `serializeIndexSidecarFromColumns` (with a source hash) to produce the
   * revisit sidecar — the columns ARE the sidecar payload (M7 identity).
   */
  columns: StepIndexColumns<EntityTypesIfc>

  /** Window diagnostics from the streaming build. */
  stats: StreamingIndexStats
}


// eslint-disable-next-line no-magic-numbers
const DEFAULT_STREAM_POOL_BYTES = 1024 * 1024

// The header prefix an index-first open reads. 64 KiB is the same slice the
// store-backed open already pulls for format detection, so the common case
// costs one read of bytes the caller has in hand anyway. A header longer
// than that is legal STEP (a large FILE_DESCRIPTION), so the open grows the
// prefix once before it refuses — a valid model must not be turned away by
// the size of a buffer, least of all on the path with no CI coverage.
// eslint-disable-next-line no-magic-numbers
const HEADER_PREFIX_BYTES = 64 * 1024

// eslint-disable-next-line no-magic-numbers
const HEADER_PREFIX_RETRY_BYTES = 4 * 1024 * 1024


/**
 * Open an IFC model from a streamed source with a **fixed-memory parse**
 * (the release-facing Phase B API; composes M0/M1a/M7):
 *
 *  - the index builds through a moving window over `source` — the source is
 *    never resident in the JS heap, and the index is columnar from birth
 *    (no per-record object phase);
 *  - the model reads source bytes on demand through a windowed LRU provider
 *    over `store` (`ensureResidentByLocalID`/`ByExpressID` page ranges in
 *    before synchronous reads — see `DemandResidencyPump` for the demand
 *    orchestration).
 *
 * The typical browser wiring: a worker streams the network body **through**
 * to OPFS while feeding the same bytes to `source`; `store` reads back from
 * OPFS. `source.byteLength` and `store.byteLength` must agree.
 *
 * @param source The sequential parse source.
 * @param store The random-access store the model reads from afterwards.
 * @param options See {@link StreamedIfcOpenOptions}.
 * @return {StreamedIfcOpen} The model + header, columns, and diagnostics.
 */
export function openStreamedIfcModel(
    source: ByteSource,
    store: StepExternalByteStore,
    options?: StreamedIfcOpenOptions ): StreamedIfcOpen {

  if ( store.byteLength !== source.byteLength ) {
    throw new Error(
        `Streaming store byteLength ${store.byteLength} does not match ` +
        `source byteLength ${source.byteLength}` )
  }

  const { header, columns, result, stats } = buildColumnarIndexStreaming(
      source,
      IfcStepParser.Instance,
      options?.pool ?? DEFAULT_STREAM_POOL_BYTES,
      options?.onRecordIndexed,
      options?.indexSink )

  if ( result !== ParseResult.COMPLETE ) {
    return { model: void 0, result, header, columns, stats }
  }

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  return {
    model: new IfcStepModel( void 0, columns, provider ),
    result,
    header,
    columns,
    stats,
  }
}


/**
 * A type index over the IFC records parsed so far, paired with the schema's
 * production indexer — the composed form of {@link PrefixTypeIndex} that a
 * caller needs, since the index is only useful mid-parse if it reads the same
 * live sink the open is filling.
 *
 * ```ts
 * const indexSink = new ColumnarIndexSink<EntityTypesIfc>()
 * const types = ifcPrefixTypeIndex( indexSink )
 * const open = await openStreamedIfcModelAsync( source, store, {
 *   indexSink,
 *   onProgress: () => reveal( types.expressIDsOfTypes( IfcProduct ) ),
 * } )
 * ```
 *
 * @param sink The sink passed to the open as `indexSink`.
 * @param options Rebuild pacing (see {@link PrefixTypeIndex}).
 * @param options.growthFactor Record growth before a query rebuilds.
 * @param options.minimumRecords Count below which pacing is skipped.
 * @return {PrefixTypeIndex<EntityTypesIfc>} The index over that sink.
 */
export function ifcPrefixTypeIndex(
    sink: ColumnarIndexSink<EntityTypesIfc>,
    options?: { growthFactor?: number, minimumRecords?: number } ):
    PrefixTypeIndex<EntityTypesIfc> {

  return new PrefixTypeIndex<EntityTypesIfc>(
      sink, new StepTypeIndexer<EntityTypesIfc>( EntityTypesIfcCount ), options )
}


/**
 * Cooperative twin of {@link openStreamedIfcModel}: the index build
 * yields to the event loop and can fill windows from an async
 * {@link ReadableByteSource}. Pass a {@link StoreByteSource} wrapping
 * `store` to parse a file that is already in OPFS without ever
 * holding it as one `ArrayBuffer`.
 *
 * @param source Sync or async parse source.
 * @param store The random-access store the model reads from afterwards.
 * @param options See {@link StreamedIfcOpenOptions} plus `onProgress`.
 * @return {Promise<StreamedIfcOpen>} The model + header, columns, diagnostics.
 */
export async function openStreamedIfcModelAsync(
    source: ReadableByteSource,
    store: StepExternalByteStore,
    options?: StreamedIfcOpenOptions & {
      onProgress?: ( absoluteByteCursor: number ) => void
    } ): Promise<StreamedIfcOpen> {

  if ( store.byteLength !== source.byteLength ) {
    throw new Error(
        `Streaming store byteLength ${store.byteLength} does not match ` +
        `source byteLength ${source.byteLength}` )
  }

  const { header, columns, result, stats } = await buildColumnarIndexStreamingAsync(
      source,
      IfcStepParser.Instance,
      options?.pool ?? DEFAULT_STREAM_POOL_BYTES,
      options?.onRecordIndexed,
      options?.onProgress,
      void 0,
      options?.indexSink )

  if ( result !== ParseResult.COMPLETE ) {
    return { model: void 0, result, header, columns, stats }
  }

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  return {
    model: new IfcStepModel( void 0, columns, provider ),
    result,
    header,
    columns,
    stats,
  }
}


/**
 * Open a windowed IFC model from a store alone — parse windows and
 * post-parse reads share `store`. This is the M1b embedder entry for
 * a file already sitting in OPFS.
 *
 * @param store The source of truth for the file bytes.
 * @param options See {@link openStreamedIfcModelAsync}.
 * @return {Promise<StreamedIfcOpen>} The model + header, columns, diagnostics.
 */
export function openStreamedIfcModelFromStore(
    store: StepExternalByteStore,
    options?: StreamedIfcOpenOptions & {
      onProgress?: ( absoluteByteCursor: number ) => void
    } ): Promise<StreamedIfcOpen> {

  return openStreamedIfcModelAsync( new StoreByteSource( store ), store, options )
}


/**
 * Options for an index-first IFC open.
 */
export interface IndexFirstIfcOpenOptions {

  /** Windowed provider chunk size (default: provider's). */
  chunkBytes?: number

  /** Windowed provider LRU cap in chunks (default: provider's). */
  maxResidentChunks?: number

  /**
   * Re-read the whole store to verify the sidecar's source hash, rather
   * than checking `byteLength` alone (the default).
   *
   * Off is right for **distribution** — a coordinator that hashed the
   * bytes during its own parse, handing the index to consumers addressing
   * the same store within one session; verifying there would re-read the
   * file per consumer, which is the N-way I/O a shared index exists to
   * remove. On is right for **revisit**, where a persisted sidecar may
   * describe a file that has since changed. See `index_sidecar.ts`
   * §"The trust gate".
   */
  verifySourceHash?: boolean
}


/**
 * Open a windowed IFC model **from a prebuilt index** instead of parsing
 * one: the sidecar supplies the entity index, and the model reads source
 * bytes on demand through the same windowed provider a streamed open uses.
 *
 * This is the whole point of the sidecar. Everything after the index —
 * `WindowedStepBufferProvider` → `IfcStepModel` → demand residency — is
 * index-agnostic and identical to {@link openStreamedIfcModelFromStore};
 * only the way the index is obtained differs. A worker in a geometry pool
 * therefore consumes the coordinator's index rather than re-parsing the
 * whole model, which is what makes such a pool pay at all (conway#541).
 *
 * **No internal cold-parse fallback, deliberately.** A mismatched or
 * unreadable sidecar throws; it does not quietly re-parse the file. Silently
 * spending a full parse is exactly the cost the caller asked to avoid, and
 * hiding a stale sidecar behind a slow success makes the mismatch
 * unobservable. Callers that want the fallback take it explicitly — the
 * compat surface's `OpenModelFromIndex` returns `-1` so a worker can fall
 * back to `OpenModelStream`.
 *
 * The STEP header is parsed from a bounded prefix of `store` (the sidecar
 * carries the index, not the header), so the load report's `Model` line is
 * real on this path rather than blank.
 *
 * @param store The random-access store holding the source bytes.
 * @param sidecar The serialised index (see `serializeIndexSidecarFromColumns`).
 * @param options See {@link IndexFirstIfcOpenOptions}.
 * @return {Promise<StreamedIfcOpen>} The model + header, columns, diagnostics.
 */
export async function openIfcModelFromIndex(
    store: StepExternalByteStore,
    sidecar: Uint8Array,
    options?: IndexFirstIfcOpenOptions ): Promise<StreamedIfcOpen> {

  const restored = deserializeIndexSidecarToColumns<EntityTypesIfc>( sidecar )

  if ( !sidecarMatchesSourceLength( restored, store.byteLength ) ) {
    throw new Error(
        `Sidecar was built against ${restored.sourceByteLength} bytes but ` +
        `the store holds ${store.byteLength}` )
  }

  if ( options?.verifySourceHash === true ) {

    // Chunked through the same hasher the coordinator folds into its parse,
    // rather than materialising the file to call `hashSource` — the digest is
    // identical either way, and a windowed open must not need the whole file
    // resident to check its own index.
    const hashed =
      await new HashingByteSource( new StoreByteSource( store ) ).finishAsync()

    if ( !sidecarMatchesSource( restored, store.byteLength, hashed ) ) {
      throw new Error( 'Sidecar hash does not match the store contents' )
    }
  }

  let prefixLength = Math.min( store.byteLength, HEADER_PREFIX_BYTES )

  let [ header, headerResult ] =
    IfcStepParser.Instance.parseHeader(
        new ParsingBuffer( await store.read( 0, prefixLength ) ) )

  // Retried on ANY non-COMPLETE result, not on some "truncated" one:
  // `parseHeader` runs off the end of a short buffer into its ordinary
  // `syntaxError()` returns (step_parser.ts — it never reports INCOMPLETE),
  // so a header that simply did not fit is indistinguishable from a
  // malformed one at this point. The retry is bounded and only happens on
  // the path that was about to throw, so the cost of being unable to tell
  // them apart is one read of at most 4 MiB on a failing open.
  if ( headerResult !== ParseResult.COMPLETE &&
    prefixLength < store.byteLength ) {

    prefixLength = Math.min( store.byteLength, HEADER_PREFIX_RETRY_BYTES )

    ;( [ header, headerResult ] =
      IfcStepParser.Instance.parseHeader(
          new ParsingBuffer( await store.read( 0, prefixLength ) ) ) )
  }

  if ( headerResult !== ParseResult.COMPLETE ) {
    // The length check passed but the bytes are not the file the index
    // describes (or not a STEP file at all). Loud, because the alternative
    // is a model built over an index that addresses someone else's bytes.
    throw new Error(
        `Index-first open could not parse a STEP header from the first ` +
        `${prefixLength} bytes (result ${headerResult})` )
  }

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  return {
    model: new IfcStepModel( void 0, restored.columns, provider ),
    result: ParseResult.COMPLETE,
    header,
    columns: restored.columns,
    stats: {
      pool: 0,
      windowBytes: prefixLength,
      slides: 0,
      maxRecordLen: 0,
      bytesRead: prefixLength,
    },
  }
}
