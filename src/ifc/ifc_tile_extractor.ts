import {
  GeometryTilePoolBindings,
  TileAssetExtractor,
} from '../core/geometry_tile_bindings'
import { GeometryAsset } from '../core/geometry_tile_pool'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'


/**
 * The wasm module surface the extractor commits through: the tile pool
 * bindings plus the Geometry-taking commit (embind `commitGeometryTile`,
 * which serialises a reified Geometry's payload straight into pool chunks).
 */
export interface TileCommitBindings extends GeometryTilePoolBindings {

  /**
   * Commit a reified geometry's payload into the wasm tile pool.
   *
   * @param assetID The tile's asset id.
   * @param geometry The wasm Geometry object (reified on access).
   * @return {boolean} True on success.
   */
  commitGeometryTile( assetID: number, geometry: unknown ): boolean
}


// Reified payload framing: 8-byte header + float vertex data + u32 indices
// (tile_pool_api.h layout).
const TILE_HEADER_BYTES = 8
const FLOAT_BYTES = 4
const INDEX_BYTES = 4


/**
 * The production {@link TileAssetExtractor} (Phase B3): drives the
 * per-product demand extraction seam (Phase B2) and commits the resulting
 * meshes into the wasm tile pool.
 *
 * Asset identity: one asset per produced **mesh**, keyed by the mesh's
 * localID (the representation item). Mapped items reuse representation
 * geometry across products, so shared representations become shared assets —
 * the sharing the pools refcount.
 *
 * Contract notes:
 * - `assetsOf` runs the (expensive) per-product extraction on first call and
 *   caches the asset list; sizes are exact reified byte costs, so the TS
 *   accounting layer admits with real numbers. This front-loads cost into
 *   `assetsOf` by design — see `GeometryTilePool.extract`'s pricing pass.
 * - `materialize` commits an already-extracted mesh into the pool;
 *   `discard` releases the wasm tile. The CPU-side canonical mesh is left in
 *   place in this phase (serving uploads from tiles — and dropping the fat
 *   working geometry — is the Phase C flip).
 */
export class IfcTileAssetExtractor implements TileAssetExtractor {

  /** Product localID → its assets, cached after first extraction. */
  private readonly assetsByProduct_ = new Map<number, GeometryAsset<number>[]>()

  /**
   * @param extraction_ The geometry extraction (its model provides meshes).
   * @param bindings_ The wasm tile pool surface to commit through.
   */
  constructor(
    private readonly extraction_: IfcGeometryExtraction,
    private readonly bindings_: TileCommitBindings ) {

    this.extraction_.prepareDemandExtraction()
  }

  /**
   * The assets (produced meshes) for a product, extracting it on first ask.
   *
   * @param productLocalID The product's local ID.
   * @return {GeometryAsset<number>[]} One asset per produced mesh, keyed by
   * the mesh's representation-item localID, sized at exact reified cost.
   */
  public assetsOf( productLocalID: number ): GeometryAsset<number>[] {

    const cached = this.assetsByProduct_.get( productLocalID )

    if ( cached !== void 0 ) {
      return cached
    }

    const geometry = this.extraction_.model.geometry

    // Snapshot existing mesh keys so this product's contribution is the
    // difference. O(meshes) per first ask — acceptable for the demand path;
    // an extraction-side "produced meshes" report can replace it if
    // profiling ever flags it.
    const before = new Set<number>()

    for ( const mesh of geometry ) {
      before.add( mesh.localID )
    }

    this.extraction_.extractProductGeometryByLocalID( productLocalID )

    const assets: GeometryAsset<number>[] = []

    for ( const mesh of geometry ) {

      if ( before.has( mesh.localID ) ) {
        continue
      }

      const wasmGeometry =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ( mesh as any ).geometry

      if ( wasmGeometry === void 0 ||
        typeof wasmGeometry.GetVertexDataSize !== 'function' ) {
        continue
      }

      const byteSize = TILE_HEADER_BYTES +
        wasmGeometry.GetVertexDataSize() * FLOAT_BYTES +
        wasmGeometry.GetIndexDataSize() * INDEX_BYTES

      assets.push( { assetID: mesh.localID, byteSize } )
    }

    this.assetsByProduct_.set( productLocalID, assets )

    return assets
  }

  /**
   * Commit one extracted mesh into the wasm tile pool.
   *
   * @param assetID The mesh (representation item) localID.
   */
  public extractIntoTile( assetID: number ): void {

    const mesh = this.extraction_.model.geometry.getByLocalID( assetID )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wasmGeometry = ( mesh as any )?.geometry

    if ( wasmGeometry === void 0 ) {
      throw new Error( `No extracted mesh for asset ${assetID}` )
    }

    if ( !this.bindings_.commitGeometryTile( assetID, wasmGeometry ) ) {
      throw new Error(
          `Wasm tile commit failed for asset ${assetID} — ` +
          'the scheduler budget must not exceed the pool budget' )
    }
  }
}
