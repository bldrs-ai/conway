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
   * The assets (meshes) a product references, extracting it on first ask.
   *
   * Attribution walks the product's **representation-item closure**
   * (recursing through mapped items into their shared source
   * representations) and claims every item that has an extracted mesh —
   * NOT a before/after diff of the mesh set. The distinction is the
   * mapped-item case: a shared source's meshes already exist when the
   * second product asks, so a diff would omit them and its tile would not
   * hold references to geometry it renders. Closure attribution is
   * extraction-order independent.
   *
   * @param productLocalID The product's local ID.
   * @return {GeometryAsset<number>[]} One asset per referenced mesh, keyed
   * by the mesh's representation-item localID (shared across products for
   * mapped sources), sized at exact reified cost.
   */
  public assetsOf( productLocalID: number ): GeometryAsset<number>[] {

    const cached = this.assetsByProduct_.get( productLocalID )

    if ( cached !== void 0 ) {
      return cached
    }

    this.extraction_.extractProductGeometryByLocalID( productLocalID )

    const geometry = this.extraction_.model.geometry
    const assets: GeometryAsset<number>[] = []

    for ( const itemLocalID of this.representationItemIDs_( productLocalID ) ) {

      const mesh = geometry.getByLocalID( itemLocalID )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wasmGeometry = ( mesh as any )?.geometry

      if ( wasmGeometry === void 0 ||
        typeof wasmGeometry.GetVertexDataSize !== 'function' ) {
        continue
      }

      const byteSize = TILE_HEADER_BYTES +
        wasmGeometry.GetVertexDataSize() * FLOAT_BYTES +
        wasmGeometry.GetIndexDataSize() * INDEX_BYTES

      assets.push( { assetID: itemLocalID, byteSize } )
    }

    this.assetsByProduct_.set( productLocalID, assets )

    return assets
  }

  /**
   * The localIDs of every representation item in a product's Body /
   * Facetation representations, recursing through mapped items into their
   * (shared) source representations — the key space extraction stores
   * meshes under.
   *
   * @param productLocalID The product's local ID.
   * @return {Set<number>} The representation-item localIDs.
   */
  private representationItemIDs_( productLocalID: number ): Set<number> {

    const ids = new Set<number>()
    const element = this.extraction_.model.getElementByLocalID( productLocalID )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const representations = ( element as any )?.Representation?.Representations

    if ( representations === void 0 || representations === null ) {
      return ids
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addItems = ( items: any[] ): void => {
      for ( const item of items ) {

        ids.add( item.localID )

        // Mapped item: recurse into the shared source representation.
        const source = item.MappingSource?.MappedRepresentation?.Items

        if ( source !== void 0 && source !== null ) {
          addItems( source )
        }
      }
    }

    for ( const representation of representations ) {

      const identifier = representation.RepresentationIdentifier

      if ( identifier !== null && identifier !== 'Body' &&
        identifier !== 'Facetation' ) {
        continue
      }

      addItems( representation.Items )
    }

    return ids
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
