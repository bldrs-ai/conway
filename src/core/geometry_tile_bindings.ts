import { ChunkedPool } from './mem/chunked_pool'
import {
  GeometryAsset,
  GeometryTilePool,
  InstanceAssetSource,
} from './geometry_tile_pool'


/**
 * The wasm module's geometry tile pool surface (conway-geom
 * `tile_pool_api.h` via the embind bindings in conway-api.cpp) — Phase B of
 * the demand-geometry track. Typed narrowly here rather than through the
 * vendored module d.ts; asset ids and sizes cross the boundary as JS numbers
 * (< 2^53 by construction).
 *
 * Division of labour (see "Resident memory: two regimes" in the design doc):
 * the TS side (`ChunkedPool` + `SharedAssetPool` + `GeometryTilePool`) is the
 * accounting/policy layer — it holds no payload bytes — while the wasm
 * `TilePool` owns the physical chunks. In this composition the TS layer calls
 * `materialize`/`discard` exactly once per residency, so the wasm-side
 * refcount stays at 1 for TS-managed tiles; the wasm refcounting exists for
 * future direct-C++ holders, not for this path.
 */
export interface GeometryTilePoolBindings {

  initGeometryTilePool( budgetBytes: number, chunkBytes: number ): boolean
  geometryTilePoolInitialized(): boolean

  commitGeometryTileBytes(
    assetID: number, sourceAddress: number, byteLength: number ): boolean

  retainGeometryTile( assetID: number ): boolean
  releaseGeometryTile( assetID: number ): boolean
  geometryTileResident( assetID: number ): boolean
  geometryTileRefCount( assetID: number ): number
  geometryTileByteSize( assetID: number ): number

  geometryTileSegmentCount( assetID: number ): number
  geometryTileSegmentAddress( assetID: number, segment: number ): number
  geometryTileSegmentByteLength( assetID: number, segment: number ): number
  geometryTileVertexByteLength( assetID: number ): number
  geometryTileIndexByteLength( assetID: number ): number

  geometryTilePoolBytesInUse(): number
  geometryTilePoolTotalBytes(): number
  geometryTilePoolFreeChunks(): number
  geometryTilePoolFailedCommits(): number
}


/**
 * The domain extractor the wasm-backed source delegates to: which assets a
 * product is made of, and how to run the wasm extract → tessellate →
 * `commitGeometryTile` for one asset. Implemented over the real extraction
 * pipeline in the Phase B wiring of `IfcModelGeometry`; tests use recording
 * fakes.
 */
export interface TileAssetExtractor {

  /**
   * The assets (representation geometries) a product requires resident,
   * with their reified byte sizes. Mapped items return the same assetID from
   * many products — the sharing the pools are built around.
   *
   * @param productLocalID The product's local ID.
   * @return {GeometryAsset<number>[]} The product's assets.
   */
  assetsOf( productLocalID: number ): GeometryAsset<number>[]

  /**
   * Extract + tessellate one asset and commit its reified payload into the
   * wasm tile pool (`commitGeometryTile`). Called exactly once per residency.
   * Must throw if the commit fails — under the budget invariant it cannot,
   * so a failure is a contract violation, not a recoverable state.
   *
   * @param assetID The asset to materialise.
   */
  extractIntoTile( assetID: number ): void
}


/**
 * The Phase B backend composition: the TS accounting stack
 * (`ChunkedPool` → `GeometryTilePool`) wired over the wasm tile pool, ready
 * to hand to `DemandGeometryQueue`.
 */
export interface WasmTileBackend {

  /** The TS accounting pool (mirrors the wasm pool's budget and chunking). */
  pool: ChunkedPool

  /** The `GeometryTiles` backend for the demand queue. */
  tiles: GeometryTilePool<number>
}


/**
 * Initialise the wasm tile pool and build the TS accounting stack over it,
 * with identical budget and chunking on both sides so the TS all-or-nothing
 * admission mirrors the wasm pool's exactly (the queue-budget ≤ pool-budget
 * invariant then guarantees a wasm commit can never fail mid-extract).
 *
 * @param bindings The wasm module's tile pool surface.
 * @param extractor The domain extract/commit implementation.
 * @param budgetBytes The resident geometry budget (both sides).
 * @param chunkBytes The chunk size (both sides; ≥ the wasm 16-byte floor).
 * @return {WasmTileBackend} The composed backend.
 */
export function createWasmTileBackend(
    bindings: GeometryTilePoolBindings,
    extractor: TileAssetExtractor,
    budgetBytes: number,
    chunkBytes: number ): WasmTileBackend {

  if ( !bindings.initGeometryTilePool( budgetBytes, chunkBytes ) ) {
    throw new Error(
        `Wasm tile pool rejected init (budget ${budgetBytes}, ` +
        `chunk ${chunkBytes})` )
  }

  const source: InstanceAssetSource<number> = {
    assetsOf: ( productLocalID ) => extractor.assetsOf( productLocalID ),
    materialize: ( assetID ) => {
      extractor.extractIntoTile( assetID )
    },
    discard: ( assetID ) => {
      bindings.releaseGeometryTile( assetID )
    },
  }

  const pool = new ChunkedPool( budgetBytes, chunkBytes )

  return { pool, tiles: new GeometryTilePool<number>( pool, source ) }
}


/**
 * A resident tile's reified payload, gathered from the wasm pool's segments
 * into typed arrays ready for GPU upload (three.js BufferAttributes). The
 * arrays are standalone copies — valid after the tile is evicted.
 */
export interface GeometryTilePayload {
  vertexData: Float32Array
  indexData: Uint32Array
}

// Geometry tile payload layout (tile_pool_api.h): 8-byte header of two u32
// byte lengths, then float vertex data, then u32 index data.
const TILE_HEADER_BYTES = 8


/**
 * Gather a resident tile's payload out of the wasm heap by walking its
 * (generally non-contiguous) segments. This is the copying consumption path;
 * a zero-copy per-segment upload can walk the same segment accessors
 * directly.
 *
 * @param bindings The wasm module's tile pool surface.
 * @param heap The module's HEAPU8 view (re-read after any wasm memory
 * growth; pass the module's current view, do not cache across calls).
 * @param assetID The resident tile to read.
 * @return {GeometryTilePayload} The gathered payload.
 */
export function readGeometryTilePayload(
    bindings: GeometryTilePoolBindings,
    heap: Uint8Array,
    assetID: number ): GeometryTilePayload {

  const byteSize = bindings.geometryTileByteSize( assetID )

  if ( byteSize < TILE_HEADER_BYTES ) {
    throw new Error( `Tile ${assetID} is not resident or has no header` )
  }

  const gathered = new Uint8Array( byteSize )

  let copied = 0

  const segments = bindings.geometryTileSegmentCount( assetID )

  for ( let segment = 0; segment < segments; ++segment ) {
    const address = bindings.geometryTileSegmentAddress( assetID, segment )
    const length = bindings.geometryTileSegmentByteLength( assetID, segment )

    gathered.set( heap.subarray( address, address + length ), copied )
    copied += length
  }

  const view = new DataView( gathered.buffer )
  const vertexBytes = view.getUint32( 0, true )
  const indexBytes = view.getUint32( 4, true )

  if ( TILE_HEADER_BYTES + vertexBytes + indexBytes !== byteSize ) {
    throw new Error(
        `Tile ${assetID} header inconsistent with payload size ` +
        `(${vertexBytes} + ${indexBytes} + ${TILE_HEADER_BYTES} !== ${byteSize})` )
  }

  // Slice to aligned standalone buffers (gathered's offsets are 8/`+vertex`,
  // which may misalign Float32Array/Uint32Array views over the same buffer).
  const vertexData = new Float32Array(
      gathered.buffer.slice( TILE_HEADER_BYTES, TILE_HEADER_BYTES + vertexBytes ) )
  const indexData = new Uint32Array(
      gathered.buffer.slice(
          TILE_HEADER_BYTES + vertexBytes, TILE_HEADER_BYTES + vertexBytes + indexBytes ) )

  return { vertexData, indexData }
}
