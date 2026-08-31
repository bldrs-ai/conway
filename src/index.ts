export { ParseResult } from './step/parsing/step_parser'
export { IfcGeometryExtraction } from './ifc/ifc_geometry_extraction'
export { IfcPropertyExtraction } from './ifc/ifc_property_extraction'
export {
  ConwayGeometry,
  GeometryObject,
  FileHandlerFunction,
  setModulePrefix,
} from '../dependencies/conway-geom'
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
  DemandPrepYieldLike,
  LoadLogAccumulator,
  ModelInfo,
  ProgressEventLike,
  formatBar,
  formatDemandPrepLine,
  formatMb,
  formatModelLine,
  formatSeconds,
  stageLabel,
} from './core/progress_log'

// --- Streaming / demand-geometry surface (epic #390; design doc
// design/new/streaming-federated-loader.md). The release-facing API for
// fixed-memory opens and demand-driven residency.
//
// Canonical homes are the plane subpath modules — `@bldrs-ai/conway/stream`,
// `/demand`, and `/mem` — which is where new conway-native APIs land (the
// web-ifc compat shim stays an adapter and is headed for retirement). The
// flat re-exports below are kept for root-import compatibility.
export {
  openStreamedIfcModel,
  openStreamedIfcModelAsync,
  openStreamedIfcModelFromStore,
  openIfcModelFromIndex,
  ifcPrefixTypeIndex,
  StreamedIfcOpen,
  StreamedIfcOpenOptions,
  IndexFirstIfcOpenOptions,
} from './ifc/ifc_stream_open'
export {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
} from './step/parsing/streaming_index_builder'
export {
  ByteSource,
  BufferByteSource,
  AsyncByteSource,
  ReadableByteSource,
  StoreByteSource,
  SyncAccessHandleByteSource,
  SyncAccessHandleLike,
} from './step/parsing/byte_source'
export { scanExpressRefs } from './step/parsing/express_ref_scan'
export {
  StepExternalByteStore,
  InMemoryStepByteStore,
  StepBufferProvider,
  WindowedStepBufferProvider,
} from './step/step_buffer_provider'
export { StepIndexColumns, StepIndexShard, ColumnarIndexSink } from './step/parsing/columnar_index'
export {
  buildColumnarIndexShardedAsync,
  compareIndexColumns,
  inProcessShardRunner,
  mergeIndexShards,
  resolveShardCount,
  MAX_DERIVED_SHARD_COUNT,
  MIN_BYTES_PER_SHARD,
  ShardStop,
  ShardJob,
  ShardOutcome,
  ShardRunner,
  ShardedColumnarIndexResult,
  ShardedIndexOptions,
} from './step/parsing/sharded_index_builder'
export {
  serializeIndexSidecar,
  serializeIndexSidecarFromColumns,
  deserializeIndexSidecarToColumns,
  sidecarMatchesSource,
  sidecarMatchesSourceLength,
  hashSource,
  SIDECAR_VERSION,
  DecodedSidecarColumns,
  SidecarSourceIdentity,
} from './step/parsing/index_sidecar'
export { HashingByteSource } from './step/parsing/source_hash'
export { StreamingRecordDispatcher, RecordHandler } from './step/parsing/streaming_record_dispatcher'
export { PrefixTypeIndex } from './step/parsing/prefix_type_index'
export { StepTypeIndexer } from './step/indexing/step_type_indexer'
export { RecordEventHandler } from './step/parsing/record_event'
export { RecordFieldCursor } from './step/parsing/record_field_cursor'
export { IfcSpatialSkeleton, SkeletonNode } from './ifc/ifc_spatial_skeleton'
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
export {
  computeDispatchKeys,
  computeRelatingLocalIDs,
  geometryDispatchKey,
  relatingLocalIDOf,
  shardOfDispatchKey,
} from './ifc/geometry_dispatch'
export { GeometryTilePool, InstanceAssetSource, GeometryAsset } from './core/geometry_tile_pool'
