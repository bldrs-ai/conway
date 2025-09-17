import { ConwayGeometry, GeometryCollection } from '../../dependencies/conway-geom'
import { CanonicalMaterial, toNativeMaterial } from './canonical_material'
import { CanonicalMeshType } from './canonical_mesh'
import { NativeVectorGeometryCollection, NativeVectorMaterial } from './native_types'
import { WalkableScene } from './scene'


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

  outputSpaces?: boolean
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

  // Linear, non-grouping storage of geometry collections in scene-walk order
  private readonly linearGeometry: Array<{
    material: CanonicalMaterial | undefined
    geometry: GeometryCollection
  }> = []

  /**
   * Construct this with a wasm module.
   *
   * @param wasmModule The current wasm module.
   * @param options
   */
   
  constructor(
    private readonly wasmModule: ConwayGeometry,
     
    public readonly options: Readonly< GeometryAggregatorOptions > ) {}

  /**
   * Add a scene to this aggregator's batch geometry.
   *
   * @param scene
   * @return {void}
   */
  public append< SceneEntityType >( scene: WalkableScene< SceneEntityType > ): void {

    const conwaywasm       = this.wasmModule
    const materialGeometry = this.materialGeometry
    const maxGeometrySize  = this.options.maxGeometrySize

    const identityTransform = conwaywasm.getIdentityTransform()

    const outputSpaces = scene.isAllSpaces() || (!!this.options.outputSpaces)

     
    for (const [_, nativeTransform, geometry, material] of scene.walk( outputSpaces )) {
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

        fullGeometry.addComponentWithTransform(
            geometry.geometry,
            nativeTransform ?? identityTransform)
      }
    }
  }

  /**
   * Append geometry in scene-walk order without grouping by material.
   * Each contiguous run of the same material is appended to the current
   * GeometryCollection until maxGeometrySize is reached, then a new
   * collection is started. Materials are emitted in the same order later
   * by aggregateNativeInOrder().
   */
  public appendInOrder< SceneEntityType >( scene: WalkableScene< SceneEntityType > ): void {

    const conwaywasm       = this.wasmModule
    const maxGeometrySize  = this.options.maxGeometrySize

    const identityTransform = conwaywasm.getIdentityTransform()

    const outputSpaces = scene.isAllSpaces() || (!!this.options.outputSpaces)

  let currentEntry = this.linearGeometry.at(-1)

    for (const [_, nativeTransform, geometry, material] of scene.walk(outputSpaces)) {
      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {

        const incomingSize = geometry.geometry.getAllocationSize()

        // Create a new collection if this is the first entry or material changed
        if (currentEntry === void 0 || currentEntry.material !== material) {
          currentEntry = {
            material,
            geometry: conwaywasm.nativeGeometryCollection(),
          }
          this.linearGeometry.push(currentEntry)
        } else if (
          maxGeometrySize !== void 0 &&
          currentEntry.geometry.currentSize !== 0 &&
          currentEntry.geometry.currentSize + incomingSize > maxGeometrySize
        ) {
          // Split due to size threshold while keeping material the same
          currentEntry = {
            material,
            geometry: conwaywasm.nativeGeometryCollection(),
          }
          this.linearGeometry.push(currentEntry)
        }

        currentEntry.geometry.addComponentWithTransform(
            geometry.geometry,
            nativeTransform ?? identityTransform)
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

      let materialIndex: number | undefined = void 0

      if (material !== void 0) {

        materialIndex = materialVector.size()

        const nativeMaterial = toNativeMaterial( this.wasmModule.wasmModule!, material )

        materialVector.push_back(nativeMaterial)
      }

      for ( const geometry of geometries ) {

        if (materialIndex !== void 0) {

          geometry.materialIndex = materialIndex
          geometry.hasDefaultMaterial = false

        } else {

          geometry.hasDefaultMaterial = true
        }

        const geometryCurrentSize = geometry.currentSize

        if ( geometryCurrentSize === 0 ) {
          continue
        }

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
      chunks: chunks.filter( ( where ) => where.count !== 0 ),
    }
  }

  /**
   * Aggregate non-grouped, walk-order geometry into native/wasm vectors,
   * assigning a material entry per geometry collection in encounter order.
   */
  public aggregateNativeInOrder(): AggregatedNativeGeometry {

    const conwaywasm       = this.wasmModule
    const outputGeometry   =
      conwaywasm.nativeVectorGeometryCollection() as NativeVectorGeometryCollection
    const materialVector   =
      conwaywasm.nativeVectorMaterial() as NativeVectorMaterial
    // eslint-disable-next-line no-magic-numbers
    const maxGeometrySize  = this.options.maxGeometrySize ?? 0xFFFFFFFF
    const chunks : GeometryChunk[] = []

    let currentChunk: GeometryChunk = {
      offset: 0,
      count: 0,
    }

    chunks.push( currentChunk )

    let currentChunkByteSize = 0

    for ( const entry of this.linearGeometry ) {

      let materialIndex: number | undefined = void 0

      if (entry.material !== void 0) {
        materialIndex = materialVector.size()
        const nativeMaterial = toNativeMaterial( this.wasmModule.wasmModule!, entry.material )
        materialVector.push_back(nativeMaterial)
      }

      const geometry = entry.geometry

      if (materialIndex !== void 0) {
        geometry.materialIndex = materialIndex
        geometry.hasDefaultMaterial = false
      } else {
        geometry.hasDefaultMaterial = true
      }

      const geometryCurrentSize = geometry.currentSize

      if ( geometryCurrentSize === 0 ) {
        continue
      }

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

    return {
      geometry: outputGeometry,
      materials: materialVector,
      chunks: chunks.filter( ( where ) => where.count !== 0 ),
    }
  }
}
