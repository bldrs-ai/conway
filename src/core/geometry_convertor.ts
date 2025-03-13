import {
  ConwayGeometry,
  GeometryObject,
  ResultsGltf,
} from '../../dependencies/conway-geom'
import { AggregatedNativeGeometry } from './geometry_aggregator'
import { NativeVectorGeometryCollection, NativeVectorMaterial } from './native_types'


/**
 * Converts geometry using the native wasm module.
 */
export default class GeometryConvertor {

  /**
   * Construct this given a wasm module.
   *
   * @param wasmModule The wasm module.
   */
   
  constructor( private readonly wasmModule: ConwayGeometry ) {}

  /**
   * @param geometry - GeometryObject to convert to OBJ
   * @return {string} - Obj string or blank string
   */
  toObj(
      geometry: GeometryObject ): string {
    if (this.wasmModule !== void 0) {
      return this.wasmModule.toObj(geometry)
    }

    return ''
  }

  /**
   * Convert chunked geometry to one or more GLTF/GLBs
   *
   * @param geometry - GeometryObject to convert to GLTF / GLB
   * @param isGlb boolean - Should the output be a single GLB file?
   * @param outputDraco boolean - Should the output be Draco compressed?
   * @param fileUri string - base filenames for GLTF / GLB files
   * @yields {ResultsGltf} - Structure containing GLTF / GLB filenames + data vectors
   * corresponding to each chunk.
   */
  public* toGltfs(
      geometry: AggregatedNativeGeometry,
      isGlb: boolean,
      outputDraco: boolean,
      fileUri: string ): IterableIterator< ResultsGltf > {

    if (this.wasmModule !== void 0) {

      const geometryVector = geometry.geometry
      const materialsVector = geometry.materials

      let currentChunkIndex = 0

      const chunkDigits = geometry.chunks.length.toString().length

      for ( const chunk of geometry.chunks ) {

        const chunkUri =
          geometry.chunks.length > 0 ?
          `${fileUri}${currentChunkIndex.toString().padStart( chunkDigits, '0' )}` :
          fileUri

        yield this.toGltf(
            geometryVector,
            materialsVector,
            isGlb,
            outputDraco,
            chunkUri,
            chunk.offset,
            chunk.count )

        ++currentChunkIndex
      }
    }
  }

  /**
   * Convert geometry to a GLTF/GLB
   *
   * @param geometry - GeometryObject to convert to GLTF / GLB
   * @param materials
   * @param isGlb boolean - Should the output be a single GLB file?
   * @param outputDraco boolean - Should the output be Draco compressed?
   * @param fileUri string - base filenames for GLTF / GLB files
   * @param geometryOffset The starting offset of the geometry span to convert (default 0).
   * @param geometryCount The number of items to convert (default )
   * @return {ResultsGltf} - Structure containing GLTF / GLB filenames + data vectors
   */
  public toGltf(
      geometry: NativeVectorGeometryCollection,
      materials: NativeVectorMaterial,
      isGlb: boolean,
      outputDraco: boolean,
      fileUri: string,
      geometryOffset: number = 0,
      geometryCount: number = geometry.size() - geometryOffset ): ResultsGltf {

    const noResults: ResultsGltf = { success: false, bufferUris: undefined, buffers: undefined }

    if (this.wasmModule !== void 0) {

      return this.wasmModule.toGltf(
          geometry,
          materials,
          isGlb,
          outputDraco,
          fileUri,
          geometryOffset,
          geometryCount)
    }

    return noResults
  }
}
