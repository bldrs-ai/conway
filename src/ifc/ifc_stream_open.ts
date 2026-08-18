import { ByteSource, ReadableByteSource, StoreByteSource } from '../step/parsing/byte_source'
import { ColumnarIndexSink, StepIndexColumns } from '../step/parsing/columnar_index'
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
