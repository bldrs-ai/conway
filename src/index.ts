export { ParseResult } from './step/parsing/step_parser'
export { IfcGeometryExtraction } from './ifc/ifc_geometry_extraction'
export { IfcPropertyExtraction } from './ifc/ifc_property_extraction'
export { ConwayGeometry, GeometryObject, FileHandlerFunction} from '../dependencies/conway-geom'
export { versionString } from './version/version'
// Replace your current Logger export with this
export { default as Logger, LogLevel, LogEntry, LoggingProxy, LogSink } from './logging/logger'

export { product, shape_definition_representation } from './AP214E3_2010/AP214E3_2010_gen'
export { CanonicalMeshType } from './core/canonical_mesh'
export { CanonicalMaterial } from './core/canonical_material'
export { ExtractResult } from './core/shared_constants'
export {
  ProgressEvent,
  ProgressCallback,
  ProgressPhase,
  ProgressUnit,
  ProgressTracker,
  CountProgressCallback,
  yieldToEventLoop,
} from './core/progress'
export { ModelLoadOptions } from './loaders/conway_model_loader'
export {
  LoadLogAccumulator,
  ModelInfo,
  ProgressEventLike,
  formatBar,
  formatMb,
  formatModelLine,
  formatSeconds,
  stageLabel,
} from './core/progress_log'

// --- Streaming / demand-geometry surface (epic #390; design doc
// design/new/streaming-federated-loader.md). The release-facing API for
// fixed-memory opens and demand-driven residency.
export { openStreamedIfcModel, StreamedIfcOpen, StreamedIfcOpenOptions } from './ifc/ifc_stream_open'
export { ByteSource, BufferByteSource } from './step/parsing/byte_source'
export {
  StepExternalByteStore,
  InMemoryStepByteStore,
  StepBufferProvider,
  WindowedStepBufferProvider,
} from './step/step_buffer_provider'
export { StepIndexColumns } from './step/parsing/columnar_index'
export {
  serializeIndexSidecarFromColumns,
  deserializeIndexSidecarToColumns,
  sidecarMatchesSource,
  hashSource,
} from './step/parsing/index_sidecar'
export { StreamingRecordDispatcher, RecordHandler } from './step/parsing/streaming_record_dispatcher'
export { IncrementalTypeIndex } from './step/parsing/incremental_type_index'
export { DemandGeometryQueue, GeometryTiles, DemandQueueStats } from './core/demand_geometry_queue'
export { DemandResidencyPump, ResidencyPrefetcher, PumpResult } from './core/demand_residency_pump'
export {
  GeometryTilePoolBindings,
  TileAssetExtractor,
  WasmTileBackend,
  createWasmTileBackend,
  readGeometryTilePayload,
  GeometryTilePayload,
} from './core/geometry_tile_bindings'
export { IfcTileAssetExtractor, TileCommitBindings } from './ifc/ifc_tile_extractor'
export { ChunkedPool, ChunkSpan } from './core/mem/chunked_pool'
export { SharedAssetPool } from './core/mem/shared_asset_pool'
export { GeometryTilePool, InstanceAssetSource, GeometryAsset } from './core/geometry_tile_pool'
