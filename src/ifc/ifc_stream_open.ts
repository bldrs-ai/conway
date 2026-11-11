import { ByteSource, ReadableByteSource, StoreByteSource } from '../step/parsing/byte_source'
import { ColumnarIndexSink, StepIndexColumns } from '../step/parsing/columnar_index'
import { IFC_SIDECAR_SCHEMA } from '../step/parsing/index_sidecar'
import {
  HashingByteSource,
  HashingSyncByteSource,
  sidecarHashAlgorithmId,
  SourceHashAlgorithm,
  sourceHashOptionsFor,
} from '../step/parsing/source_hash'
import {
  assertSidecarDescribesStore,
  HEADER_PREFIX_BYTES,
  HEADER_PREFIX_RETRY_BYTES,
  parseStepHeaderFromStore,
  restoreStepIndexFromSidecar,
  SidecarVerifyMode,
} from '../step/step_index_open'
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
import { assertNativeSchemaSupported } from './ifc_schema_selection'


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

  /**
   * Fold the FNV-1a of the parsed bytes into the parse and record it on the
   * model (`StepModelBase.indexedSourceHash`), so `exportIfcIndexSidecar`
   * can write a sidecar for it (conway#756). Off by default: ~12 % of the
   * index build, for a feature most opens never use.
   */
  recordSourceHash?: boolean

  /**
   * Which digest `recordSourceHash` takes (default `'fnv1a32'`);
   * `'sha256Blocks'` is the native block digest (`source_hash.ts`
   * #SourceHashAlgorithm, bldrs-ai/Share#2092). Only the asynchronous open
   * ({@link openStreamedIfcModelAsync}) takes it; the synchronous one
   * always records FNV-1a.
   */
  sourceHashAlgorithm?: SourceHashAlgorithm
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
   *
   * **Check `result === ParseResult.COMPLETE` first.** These columns are
   * populated even when the parse stopped short: a truncated or malformed
   * file yields the rows indexed before the failure, and `model` is
   * withheld while `columns` is not. Those rows are a prefix in substance
   * but carry no `indexIsPrefix` flag — `ColumnarIndexSink.finalize()` sets
   * it only for an explicit `snapshot()` — so nothing downstream, including
   * the sidecar writer's own prefix guard, can tell them from a whole
   * index. `data/index.ifc` truncated to 60 % serialises happily and
   * restores as complete, 167 rows where the file has 287. conway#628
   * tracks closing that at the source; until then the check is the
   * caller's.
   */
  columns: StepIndexColumns<EntityTypesIfc>

  /** Window diagnostics from the streaming build. */
  stats: StreamingIndexStats
}


// eslint-disable-next-line no-magic-numbers
const DEFAULT_STREAM_POOL_BYTES = 1024 * 1024

// Re-exported from their schema-neutral home (step_index_open.ts,
// conway#757), where the AP214 index-first open reads them too.
export {
  assertSidecarDescribesStore,
  HEADER_PREFIX_BYTES,
  HEADER_PREFIX_RETRY_BYTES,
}


/**
 * Read and parse an IFC file's STEP header from a bounded prefix of a
 * store — {@link parseStepHeaderFromStore} with the IFC parser. See that
 * function for the prefix, its one retry, and why only the index-first open
 * may sniff a header this way.
 *
 * @param store The random-access store to read the header prefix from.
 * @return {Promise<{header: StepHeader, result: ParseResult, prefixLength: number}>}
 * The parsed header, the parse result, and the prefix length read.
 */
export function parseIfcHeaderFromStore( store: StepExternalByteStore ):
    Promise<{ header: StepHeader, result: ParseResult, prefixLength: number }> {

  return parseStepHeaderFromStore( store, IfcStepParser.Instance )
}


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

  // Gate through the builder's `onHeaderParsed` seam rather than a sniff of
  // our own (codex review of #713, P1 round 3 fixed a post-parse gate here;
  // round 4 then found that ANY bounded pre-parse sniff can disagree with
  // the real parse's own window and let a header slip through ungated —
  // see streaming_index_builder.ts's doc-comment on the seam). The hook
  // fires after `buildColumnarIndexStreaming` parses the header COMPLETE
  // and strictly before it fires `onRecordIndexed` or writes to
  // `options?.indexSink`, so a throw here still reaches the caller with
  // zero typed side effects — the same guarantee the old sniff-based gate
  // measured at 15 callback firings (five `IFCFACETEDBREP` records reported
  // at IFC4's ordinal 422 instead of IFC4X3's 488) when it ran too late.
  //
  // This open does NOT take the IFC4-compatible IFC4X3 route
  // (ifc4x3_ifc4_compat.ts), even for an eligible file: its contract is to
  // hand records to `onRecordIndexed` and `indexSink` AS they are indexed,
  // and that route must index the whole file privately before anything is
  // emitted. So `Ifc4x3CompatRouteRequired` propagates here as a refusal of
  // every 4X3 file. Use the loader, the compat surface or
  // `IfcStepParser.parseStreamToModel` for those.
  //
  // Under `recordSourceHash` the source is read through a hasher so the
  // model records the digest of exactly the bytes its index came from
  // (conway#756; see `StepModelBase.indexedSourceHash`).
  const hashing = options?.recordSourceHash === true ?
    new HashingSyncByteSource( source ) : void 0
  const { header, columns, result, stats } = buildColumnarIndexStreaming(
      hashing ?? source,
      IfcStepParser.Instance,
      options?.pool ?? DEFAULT_STREAM_POOL_BYTES,
      options?.onRecordIndexed,
      options?.indexSink,
      assertNativeSchemaSupported )

  if ( result !== ParseResult.COMPLETE ) {
    return { model: void 0, result, header, columns, stats }
  }

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  const model = new IfcStepModel( void 0, columns, provider )

  model.indexedSourceHash = hashing?.finish()
  model.indexedSampledHash = hashing?.sampledHash

  return {
    model,
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

  // Gate through the builder's `onHeaderParsed` seam (see
  // {@link openStreamedIfcModel}'s identical note) rather than a bounded
  // pre-parse sniff of the store: the hook fires from the real parse's own
  // header, after it parses COMPLETE and strictly before any
  // `onRecordIndexed`/`onProgress`/`indexSink` side effect of the
  // (potentially long-running, cooperative) build below — codex review of
  // #713, P1/P2/round 4.
  //
  // Under `recordSourceHash`, read through a hasher as in the synchronous
  // open: the model records the digest of exactly the bytes its index came
  // from (conway#756).
  const hashing = options?.recordSourceHash === true ?
    new HashingByteSource( source, sourceHashOptionsFor( options.sourceHashAlgorithm ) ) :
    void 0
  const { header, columns, result, stats } = await buildColumnarIndexStreamingAsync(
      hashing ?? source,
      IfcStepParser.Instance,
      options?.pool ?? DEFAULT_STREAM_POOL_BYTES,
      options?.onRecordIndexed,
      options?.onProgress,
      void 0,
      options?.indexSink,
      assertNativeSchemaSupported )

  if ( result !== ParseResult.COMPLETE ) {
    return { model: void 0, result, header, columns, stats }
  }

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  const model = new IfcStepModel( void 0, columns, provider )

  model.indexedSourceHash = await hashing?.finishAsync()
  model.indexedSourceHashAlgorithm =
    hashing !== void 0 ? sidecarHashAlgorithmId( hashing.algorithm ) : void 0
  model.indexedSampledHash = hashing?.sampledHash

  return {
    model,
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
   * Re-read the whole store to verify the sidecar's source hash (`true`),
   * or just its sampled blocks (`'sampled'`, conway#758), rather than
   * checking `byteLength` alone (the default).
   *
   * Off is right for **distribution** — a coordinator that hashed the
   * bytes during its own parse, handing the index to consumers addressing
   * the same store within one session; verifying there would re-read the
   * file per consumer, which is the N-way I/O a shared index exists to
   * remove. On is right for **revisit**, where a persisted sidecar may
   * describe a file that has since changed. See `index_sidecar.ts`
   * §"The trust gate".
   */
  verifySourceHash?: SidecarVerifyMode
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
 * unreadable sidecar throws — a mismatch as
 * {@link IndexSidecarStaleError}, so the caller can key its fallback on it
 * (conway#756) — and it does not quietly re-parse the file. Silently
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

  // The trust gate, the schema stamp (conway#757), the column copy and the
  // bounded header read — the schema-neutral half every index-first open
  // shares (step_index_open.ts). A sidecar for another file or another
  // schema throws IndexSidecarStaleError before any column is copied.
  const restored = await restoreStepIndexFromSidecar< EntityTypesIfc >(
      store, sidecar, IfcStepParser.Instance, IFC_SIDECAR_SCHEMA,
      options?.verifySourceHash ?? false )

  const { header, prefixLength } = restored

  // Gate before constructing/returning a model (codex review of #713, P1).
  // Every other native open passes this function as `buildIndexStreaming`'s
  // `onHeaderParsed` hook and never sniffs a header itself; this path
  // CANNOT do that — there is no data parse here at all, the sidecar
  // supplies the index — so the bounded prefix read above is the only place
  // the schema is ever visible before a caller could reach IFC4-typed
  // extraction, and a plain explicit call is the only option.
  assertNativeSchemaSupported( header )

  const provider = new WindowedStepBufferProvider(
      store, options?.chunkBytes, options?.maxResidentChunks )

  const model = new IfcStepModel( void 0, restored.columns, provider )

  // The index is the sidecar's, so the sidecar's recorded hash is the
  // identity of the bytes it describes — re-exporting this model reproduces
  // the sidecar byte for byte (conway#756).
  model.indexedSourceHash = restored.sourceHash
  model.indexedSourceHashAlgorithm = restored.hashAlgorithm
  model.indexedSampledHash = restored.sampledHash

  return {
    model,
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
