import { ConwayGeometry, GeometryCollection } from '../../dependencies/conway-geom/conway_geometry'
import { CanonicalMaterial } from './canonical_material'
import { CanonicalMeshType } from './canonical_mesh'
import { NativeVectorGeometryCollection, NativeVectorMaterial } from './native_types'
import { Scene } from './scene'


export interface GeometryAggregatorOptions {

  /**
   * The maximum aggregate total geometry size that will be passed
   * through as a chunk (total allocation) on output. The aggregator
   * will break into chunks by size. Chunks will be output in material
   * order, but in the case where all the components in a particular
   * element don't fit in a chunk size, be broken up.
   *
   * Individual geometry components will not be broken below this size, but will effectively stand
   * alone.
   */
  maxGeometrySize?: number
}

export interface GeometryChunk {

  offset: number

  count: number
}

export interface AggregatedNativeGeometry {

  geometry: NativeVectorGeometryCollection

  materials: NativeVectorMaterial

  chunks: GeometryChunk[]

}

/**
 * Aggregates scene geometry and then allows incremental batches
 * of geometry output to be fed to a convertor.
 */
export default class GeometryAggregator {

  private readonly materialGeometry = new Map<CanonicalMaterial | undefined, GeometryCollection[]>()

  /**
   * Construct this with a wasm module.
   *
   * @param wasmModule The current wasm module.
   */
  // eslint-disable-next-line no-useless-constructor, require-jsdoc
  constructor(
    private readonly wasmModule: ConwayGeometry,
    // eslint-disable-next-line no-empty-function
    public readonly options: Readonly< GeometryAggregatorOptions > ) {}

  /**
   * Add a scene to this aggregator's batch geometry.
   *
   * @return {void}
   */
  public append< SceneEntityType >( scene: Scene< SceneEntityType > ): void {

    const conwaywasm       = this.wasmModule
    const materialGeometry = this.materialGeometry
    const maxGeometrySize  = this.options.maxGeometrySize

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material] of scene.walk()) {
      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {

        let geometryCollections = materialGeometry.get(material)

        if (geometryCollections === void 0) {

          geometryCollections = []

          geometryCollections.push( conwaywasm.nativeGeometryCollection() )
          materialGeometry.set( material, geometryCollections )
        }

        let fullGeometry = geometryCollections.at( -1 ) as GeometryCollection

        if (
          maxGeometrySize !== void 0 &&
          fullGeometry.currentSize !== 0 &&
          fullGeometry.currentSize + geometry.geometry.getAllocationSize() > maxGeometrySize ) {

          fullGeometry = conwaywasm.nativeGeometryCollection()
          geometryCollections.push( fullGeometry )
        }

        fullGeometry.addComponentWithTransform(geometry.geometry, nativeTransform)
      }
    }
  }

  /**
   * Aggregate this into a set of native/wasm objects to be passed to conway-geom,
   * and also partition the aggregate into chunks based on the max data size.
   *
   * @return {AggregatedNativeGeometry} The aggregated & chunked geometry.
   */
  public aggregateNative(): AggregatedNativeGeometry {

    const conwaywasm       = this.wasmModule
    const outputGeometry   =
      conwaywasm.nativeVectorGeometryCollection() as NativeVectorGeometryCollection
    const materialVector   =
      conwaywasm.nativeVectorMaterial() as NativeVectorMaterial
    const materialGeometry = this.materialGeometry
    // eslint-disable-next-line no-magic-numbers
    const maxGeometrySize  = this.options.maxGeometrySize ?? 0xFFFFFFFF
    const chunks : GeometryChunk[] = []

    let currentChunk: GeometryChunk = {
      offset: 0,
      count: 0,
    }

    chunks.push( currentChunk )

    let currentChunkByteSize = 0

    for (const [material, geometries] of materialGeometry) {

      for ( const geometry of geometries ) {

        if (material !== void 0) {

          geometry.materialIndex = materialVector.size()
          geometry.hasDefaultMaterial = false

          const nativeMaterial = conwaywasm.nativeMaterial(material)

          materialVector.push_back(nativeMaterial)
        }

        const geometryCurrentSize = geometry.currentSize

        if (
          currentChunkByteSize !== 0 &&
          currentChunkByteSize + geometryCurrentSize > maxGeometrySize ) {

          currentChunk = {
            offset: outputGeometry.size(),
            count: 0,
          }

          chunks.push( currentChunk )
          currentChunkByteSize = 0
        }

        ++currentChunk.count
        currentChunkByteSize += geometryCurrentSize

        outputGeometry.push_back(geometry)
      }
    }

    return {
      geometry: outputGeometry,
      materials: materialVector,
      chunks: chunks,
    }
  }
}
