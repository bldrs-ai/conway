import { ByteSource } from '../step/parsing/byte_source'
import { StepIndexColumns } from '../step/parsing/columnar_index'
import {
  buildColumnarIndexStreaming,
  StreamingIndexStats,
} from '../step/parsing/streaming_index_builder'
import { ParseResult, StepHeader } from '../step/parsing/step_parser'
import {
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
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
   * Live per-record event `(localID, expressID, typeID)` — the M2 seam for
   * incremental consumers (type index, roots, cross-refs) that run while
   * the model is still parsing. Must be synchronous and cheap.
   */
  onRecordIndexed?:
    ( localID: number, expressID: number, typeID: EntityTypesIfc | undefined ) => void
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
      options?.onRecordIndexed )

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
