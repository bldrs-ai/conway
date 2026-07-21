/**
 * `@bldrs-ai/conway/mem` — the general memory system (src/core/mem;
 * design/new/streaming-federated-loader.md, resident-memory design).
 *
 * Domain-neutral primitives for explicitly budgeted residency:
 * {@link ChunkedPool} (accounting-only fixed-chunk freelist),
 * {@link SharedAssetPool} (refcounted instance⇄asset sharing), and
 * {@link SharedByteBudget} (a byte budget shareable across consumers).
 * The geometry narrowing over these lives in `@bldrs-ai/conway/demand`
 * ({@link import('../core/geometry_tile_pool').GeometryTilePool}); other
 * asset domains (textures, property blocks) are expected to narrow the
 * same way.
 */
export { ChunkedPool, ChunkSpan } from '../core/mem/chunked_pool'
export { SharedAssetPool } from '../core/mem/shared_asset_pool'
export { SharedByteBudget } from '../core/shared_byte_budget'
