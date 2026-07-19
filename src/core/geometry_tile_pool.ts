import { GeometryTiles } from './demand_geometry_queue'
import { ChunkedPool } from './mem/chunked_pool'
import { SharedAssetPool } from './mem/shared_asset_pool'


/**
 * One shareable geometry payload an instance needs resident: the asset's
 * identity and its byte size. For IFC, the asset is a representation's
 * tessellated geometry and `byteSize` comes from the wasm-side extract.
 */
export interface GeometryAsset<AssetID> {
  assetID: AssetID
  byteSize: number
}


/**
 * The domain half the tile pool delegates to: what assets an instance is made
 * of, and how to materialise / discard one asset's payload. This is the seam
 * the production conway-geom surface implements (extract → tessellate into
 * the asset's chunks; discard on last release); tests implement it with
 * recording mocks.
 */
export interface InstanceAssetSource<AssetID> {

  /**
   * The assets an instance requires resident, with their byte sizes. For a
   * simple product this is one asset; mapped/instanced representations return
   * the same assetID from many instances — that sharing is the point.
   *
   * @param instanceID The instance (product local ID in the geometry case).
   * @return {GeometryAsset<AssetID>[]} The instance's assets.
   */
  assetsOf( instanceID: number ): GeometryAsset<AssetID>[]

  /**
   * Materialise an asset's payload (called exactly once per residency, on
   * the 0→1 reference). In production: run the wasm extract/tessellate and
   * write the result into the asset's pool chunks.
   *
   * @param assetID The asset to materialise.
   */
  materialize( assetID: AssetID ): void

  /**
   * Discard an asset's payload (called exactly once per residency, on the
   * 1→0 reference, after its chunks are already back in the pool).
   *
   * @param assetID The asset to discard.
   */
  discard( assetID: AssetID ): void
}


/**
 * The geometry narrowing of the general memory system (`src/core/mem/`): a
 * {@link GeometryTiles} backend where a product's "tile" is a set of
 * refcounted, chunk-resident **assets** in a {@link SharedAssetPool}.
 *
 * Composed with {@link DemandGeometryQueue} this completes the M3 resident
 * design: the queue owns demand ordering and the logical budget; this pool
 * owns physical residency. Two accounting views, one invariant:
 *
 * - **Logical (queue-side):** `extract` charges an instance the full
 *   chunk-rounded cost of *every* asset it references, shared or not. Sharing
 *   is thus double-charged logically — deliberately conservative: summed
 *   logical charges always cover physical use, so with the queue's budget set
 *   to the pool's budget, an acquire can never fail mid-extract. (Heavy
 *   sharing under-utilises the logical budget; the production wiring can
 *   widen the queue budget once measured. The safe direction first.)
 * - **Physical (pool-side):** `bytesInUse` counts real chunks. Shared assets
 *   are stored once, refcounted, and freed only on the last release — so
 *   evicting product A never discards the representation product B still
 *   renders (the mapped-item correctness rule, held structurally).
 */
export class GeometryTilePool<AssetID> implements GeometryTiles {

  private readonly assets_: SharedAssetPool<AssetID>

  private readonly source_: InstanceAssetSource<AssetID>

  /** Assets each extracted instance holds references on. */
  private readonly held_ = new Map<number, GeometryAsset<AssetID>[]>()

  /**
   * @param pool The chunk pool residents live in.
   * @param source The domain half (asset composition + materialise/discard).
   */
  constructor( pool: ChunkedPool, source: InstanceAssetSource<AssetID> ) {
    this.assets_ = new SharedAssetPool<AssetID>( pool )
    this.source_ = source
  }

  /**
   * @return {SharedAssetPool<AssetID>} The refcounted asset layer (physical
   * accounting lives here / on its pool).
   */
  public get assets(): SharedAssetPool<AssetID> {
    return this.assets_
  }

  /**
   * Materialise an instance's tile: take a reference on each of its assets,
   * materialising the ones not yet resident.
   *
   * @param instanceID The instance (product local ID).
   * @return {number} The instance's logical byte cost (chunk-rounded, every
   * asset fully charged — see class docs for why sharing is double-charged).
   */
  public extract( instanceID: number ): number {

    if ( this.held_.has( instanceID ) ) {
      throw new Error( `Instance ${instanceID} already extracted` )
    }

    const assets = this.source_.assetsOf( instanceID )
    const pool = this.assets_.pool

    let logicalBytes = 0

    for ( const asset of assets ) {

      const { retained, wasAbsent } =
        this.assets_.retain( asset.assetID, asset.byteSize )

      if ( !retained ) {
        // Unwind references already taken so a failed extract has no effect.
        for ( const taken of assets ) {
          if ( taken === asset ) {
            break
          }
          this.assets_.release( taken.assetID )
        }

        throw new Error(
            `Geometry pool exhausted materialising instance ${instanceID} — ` +
            'the scheduler budget must not exceed the pool budget' )
      }

      if ( wasAbsent ) {
        this.source_.materialize( asset.assetID )
      }

      logicalBytes += pool.chunkRound( asset.byteSize )
    }

    this.held_.set( instanceID, assets )

    return logicalBytes
  }

  /**
   * Release an instance's tile: drop the reference on each of its assets,
   * discarding those this instance was the last holder of.
   *
   * @param instanceID The instance (product local ID).
   */
  public release( instanceID: number ): void {

    const assets = this.held_.get( instanceID )

    if ( assets === void 0 ) {
      throw new Error( `Release of un-extracted instance ${instanceID}` )
    }

    this.held_.delete( instanceID )

    for ( const asset of assets ) {
      if ( this.assets_.release( asset.assetID ) ) {
        this.source_.discard( asset.assetID )
      }
    }
  }
}
