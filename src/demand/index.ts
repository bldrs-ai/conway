/**
 * `@bldrs-ai/conway/demand` — demand-driven geometry residency (epic #390;
 * design/new/streaming-federated-loader.md, "two regimes").
 *
 * The synchronous half: a priority {@link DemandGeometryQueue} admits
 * instances under a byte budget against {@link GeometryTiles} — in
 * production the wasm-backed {@link GeometryTilePool} composition created
 * by {@link createWasmTileBackend}, extracting through
 * {@link IfcTileAssetExtractor} into the conway-geom TilePool. The
 * asynchronous half: {@link DemandResidencyPump} pages source-byte ranges
 * in (via the stream plane's windowed provider) before forwarding demand,
 * so a pump cycle never hits a non-resident range mid-extract.
 *
 * Conway-native namespace; see `@bldrs-ai/conway/stream` for the parse
 * plane and `@bldrs-ai/conway/mem` for the general pool primitives this
 * builds on.
 */
export {
  DemandGeometryQueue,
  GeometryTiles,
  DemandQueueStats,
} from '../core/demand_geometry_queue'
export {
  DemandResidencyPump,
  ResidencyPrefetcher,
  PumpResult,
} from '../core/demand_residency_pump'
export {
  GeometryTilePool,
  InstanceAssetSource,
  GeometryAsset,
} from '../core/geometry_tile_pool'
export {
  GeometryTilePoolBindings,
  TileAssetExtractor,
  WasmTileBackend,
  createWasmTileBackend,
  readGeometryTilePayload,
  GeometryTilePayload,
} from '../core/geometry_tile_bindings'
export { IfcTileAssetExtractor, TileCommitBindings } from '../ifc/ifc_tile_extractor'
