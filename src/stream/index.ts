/**
 * `@bldrs-ai/conway/stream` — the streaming parse/index plane (epic #390;
 * design/new/streaming-federated-loader.md).
 *
 * Fixed-memory opens: a model parses through a bounded moving window over
 * a {@link ByteSource} into a columnar record index ({@link StepIndexColumns}
 * — no per-record object phase), reads its source bytes on demand through a
 * windowed provider over a {@link StepExternalByteStore} (e.g. OPFS), and
 * serializes its index to a revisit sidecar whose payload IS the columns.
 * Incremental consumers (type index, cross-refs) subscribe to per-record
 * events via {@link StreamingRecordDispatcher} while the parse runs.
 *
 * This is the conway-native namespace for new-era consumers. The web-ifc
 * compat shim (`@bldrs-ai/conway/web-ifc`) adapts parts of this surface to
 * web-ifc's API (e.g. `OpenModelStreamed`) and is headed for retirement;
 * new integrations should build against this module directly.
 */
export {
  openStreamedIfcModel,
  StreamedIfcOpen,
  StreamedIfcOpenOptions,
} from '../ifc/ifc_stream_open'
export {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
  StreamingColumnarIndexResult,
  StreamingIndexStats,
} from '../step/parsing/streaming_index_builder'
export { ByteSource, BufferByteSource } from '../step/parsing/byte_source'
export {
  StepExternalByteStore,
  InMemoryStepByteStore,
  StepBufferProvider,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'
export { StepIndexColumns } from '../step/parsing/columnar_index'
export {
  serializeIndexSidecarFromColumns,
  deserializeIndexSidecarToColumns,
  sidecarMatchesSource,
  hashSource,
} from '../step/parsing/index_sidecar'
export {
  StreamingRecordDispatcher,
  RecordHandler,
} from '../step/parsing/streaming_record_dispatcher'
export { IncrementalTypeIndex } from '../step/parsing/incremental_type_index'
