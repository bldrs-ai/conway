/* eslint-disable camelcase */
import {
  ConwayGeometry,
  GeometryObject,
  ParamsAxis2Placement3D,
  ParamsCartesianTransformationOperator3D,
  Vector3,
  CurveObject,
  ParamsGetAxis2Placement2D,
  ParamsGetCircleCurve,
  ParamsGetExtrudedAreaSolid,
  ParamsGetBooleanResult,
  MaterialObject,
  BlendMode,
  toAlphaMode,
  Vector2,
  ParamsGetIfcCircle,
  ParamsGetIfcTrimmedCurve,
  ParamsGetHalfspaceSolid,
  ParamsGetLoop,
  Bound3DObject,
  ParamsCreateBound3D,
  ParamsAddFaceToGeometry,
  SurfaceObject,
  StdVector,
  ParamsAxis1Placement3D,
  ParamsGetBSplineCurve,
  BSplineSurface,
  TrimmingArguments,
  ParamsGetEllipseCurve,
  ParamsTransformProfile,
  ParamsGetTriangulatedFaceSetGeometry,
  ParamsGetPolyCurve,
  TrimmingSelect,
  ParamsCreateNativeIfcProfile,
  NativeTransform3x3,
  NativeTransform4x4,
} from '../../dependencies/conway-geom'
import { CanonicalMaterial, ColorRGBA } from '../core/canonical_material'
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { CanonicalProfile } from '../core/canonical_profile'
import { ObjectPool } from '../core/native_pool'
import {
  NativeULongVector,
  NativeUintVector,
  NativeVectorBound3D,
  NativeVectorCurve,
  NativeVectorGeometryCollection,
  NativeVectorGlmVec2,
  NativeVectorGlmVec3,
  NativeVectorIndexedPolygonalFace,
  NativeVectorProfile,
  NativeVectorSegment,
  WasmModule,
} from '../core/native_types'
import { ExtractResult } from '../core/shared_constants'
import {
  advanced_face, axis1_placement,
  axis2_placement_2d,
  axis2_placement_3d,
  b_spline_curve,
  b_spline_curve_with_knots,
  b_spline_surface,
  b_spline_surface_with_knots,
  boolean_result,
  cartesian_point,
  cartesian_transformation_operator_2d,
  cartesian_transformation_operator_3d,
  circle,
  colour_rgb,
  composite_curve,
  connected_face_set,
  curve,
  cylindrical_surface,
  direction,
  edge_curve,
  edge_loop,
  ellipse,
  extruded_area_solid,
  face,
  face_based_surface_model,
  faceted_brep,
  half_space_solid,
  line,
  loop,
  manifold_solid_brep,
  mapped_item,
  parameter_value,
  pcurve,
  placement, plane,
  poly_loop,
  polyline,
  product,
  ratio_measure,
  rational_b_spline_curve,
  rational_b_spline_surface,
  representation_item,
  shape_definition_representation,
  shell_based_surface_model,
  si_prefix,
  styled_item,
  surface_curve,
  surface_of_linear_extrusion,
  surface_of_revolution,
  surface_side,
  surface_style_rendering,
  surface_style_usage,
  trimmed_curve,
  trimming_preference,
  vertex_point,
} from './AP214E3_2010_gen'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import { AP214MaterialCache } from './ap214_material_cache'
import { AP214SceneBuilder, AP214SceneTransform } from './ap214_scene_builder'
import AP214StepModel from './ap214_step_model'


type Mutable<T> = { -readonly [P in keyof T]: T[P] }


/**
 * Extract an AP214 Colour into our RGBA color, using premultiplied alpha.
 *
 * Transparency is usually handled via pre-multiplied alpha, and this is what
 * gltf (for example) expects.
 *
 * @param from The color to extract.
 * @param alpha The alpha value to be associated with the colour.
 * @return {ColorRGBA} The created colour.
 */
export function extractColorRGBPremultiplied(from: colour_rgb, alpha: number = 1): ColorRGBA {
  return [from.red * alpha, from.green * alpha, from.blue * alpha, alpha]
}

/**
 * Extract an AP214 Colour into our RGBA color.
 *
 * @param from The color to extract.
 * @param alpha The alpha value to be associated with the colour.
 * @return {ColorRGBA} The created colour.
 */
export function extractColorRGB(from: colour_rgb, alpha: number = 1): ColorRGBA {

  return [from.red, from.green, from.blue, alpha]
}

/**
 * Use to extract a color or a factor from a color/factor select.
 *
 * @param from The color or factor to extract this from.
 * @param surfaceColor The surface color (if this is a factor), which will be used to
 * create the factor.
 * @param alpha The alpha to use for this.
 * @return {ColorRGBA}
 */
export function extractColorOrFactor(
    from: colour_rgb | ratio_measure,
    surfaceColor: ColorRGBA, alpha: number = 1): ColorRGBA {

  if (from instanceof colour_rgb) {
    return extractColorRGB(from, alpha)
  } else {

    const factor = from.Value

    return [
      factor * surfaceColor[0],
      factor * surfaceColor[1],
      factor * surfaceColor[2],
      alpha * surfaceColor[3],
    ]
  }
}

/**
 * Handles Geometry data extraction from a populated AP214StepModel
 * Can export to OBJ, GLTF (Draco), GLB (Draco)
 */
export class AP214GeometryExtraction {

  /* eslint-disable no-magic-numbers */
  private readonly TWO_DIMENSIONS: number = 2
  private readonly THREE_DIMENSIONS: number = 3

  private wasmModule: WasmModule

  public readonly scene: AP214SceneBuilder

  public readonly materials: AP214MaterialCache

  private linearScalingFactor: number

  private circleSegments: number = 12

  private paramsGetBooleanResultPool: ObjectPool<ParamsGetBooleanResult> | undefined
  private paramsTransformProfilePool: ObjectPool<ParamsTransformProfile> | undefined
  private paramsGetTriangulatedFaceSetPool:
  ObjectPool<ParamsGetTriangulatedFaceSetGeometry> | undefined

  private paramsGetPolyCurvePool:ObjectPool<ParamsGetPolyCurve> | undefined

  private identity2DNativeMatrix: any
  private identity3DNativeMatrix: any

  /**
   * Construct a geometry extraction from an AP214 step model and conway model
   *
   * @param conwayModel
   * @param model
   */
  constructor(
    private readonly conwayModel: ConwayGeometry,
    public readonly model: AP214StepModel) {

    this.materials = new AP214MaterialCache()
    this.scene = new AP214SceneBuilder(model, conwayModel, this.materials)

    this.linearScalingFactor = 1
    this.wasmModule = conwayModel.wasmModule
    this.getIdentityMatrices()
    this.initializeMemoryPools()
  }

  /**
   * Get the product name for this.
   *
   * @return {string} The product name or an empty struct if none can be found.
   */
  getAP214ProductName(): string {

    for ( const productValue of this.model.types( product ) ) {

      if ( productValue.name.length > 0 ) {
        return productValue.name
      }
    }

    return ''
  }


  /**
   * Initializes memory pools for various parameter objects.
   */
  initializeMemoryPools() {
    this.createParamsGetBooleanResultPool()
    this.createParamsTransformProfilePool()
    this.createParamsGetTriangulatedFaceSetPool()
    this.createParamsGetPolyCurvePool()
  }

  /**
   * Creates a memory pool for `ParamsGetPolyCurve` objects if it does not exist.
   */
  createParamsGetPolyCurvePool() {
    if (this.paramsGetPolyCurvePool === void 0) {
      // Create a pool for ParamsTransformProfile
      this.paramsGetPolyCurvePool = new
      ObjectPool<ParamsGetPolyCurve>(
          () => new (this.wasmModule.ParamsGetPolyCurve)() as
           ParamsGetPolyCurve,
          (obj) => obj.delete(),
      )
    }
  }

  /**
   * Creates a memory pool for `ParamsGetTriangulatedFaceSet` objects if it does not exist.
   */
  createParamsGetTriangulatedFaceSetPool() {
    if (this.paramsGetTriangulatedFaceSetPool === void 0) {
      // Create a pool for ParamsTransformProfile
      this.paramsGetTriangulatedFaceSetPool = new
      ObjectPool<ParamsGetTriangulatedFaceSetGeometry>(
          () => new (this.wasmModule.ParamsGetTriangulatedFaceSetGeometry)() as
           ParamsGetTriangulatedFaceSetGeometry,
          (obj) => obj.delete(),
      )
    }
  }

  /**
   * Creates a memory pool for `ParamsTransformProfile` objects if it does not exist.
   */
  createParamsTransformProfilePool() {
    if (this.paramsTransformProfilePool === void 0) {
      // Create a pool for ParamsTransformProfile
      this.paramsTransformProfilePool = new ObjectPool<ParamsTransformProfile>(
          () => new (this.wasmModule.ParamsTransformProfile)() as ParamsTransformProfile,
          (obj) => obj.delete(),
      )
    }
  }

  /**
   * Creates a memory pool for `ParamsGetBooleanResult` objects if it does not exist.
   */
  createParamsGetBooleanResultPool() {
    if (this.paramsGetBooleanResultPool === void 0) {
      // Create a pool for ParamsGetBooleanResult
      this.paramsGetBooleanResultPool = new ObjectPool<ParamsGetBooleanResult>(
          () => new (this.wasmModule.ParamsGetBooleanResult)() as ParamsGetBooleanResult,
          (obj) => obj.delete(),
      )
    }
  }

  /**
   * Retrieves and stores identity matrices from the WebAssembly module.
   */
  getIdentityMatrices() {
    this.identity2DNativeMatrix = this.wasmModule.getIdentity2DMatrix()
    this.identity3DNativeMatrix = this.wasmModule.getIdentity3DMatrix()
  }


  /**
   *
   * @return {number} linear matrix scaling factor for geometry
   */
  getLinearScalingFactor(): number {
    // console.log(`linearScalingFactor: ${this.linearScalingFactor}`)
    return this.linearScalingFactor
  }

  /**
   *
   * @return {WasmModule} - A handle to the loaded wasm module
   */
  getWasmModule(): WasmModule {
    return this.wasmModule
  }


  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {StdVector<GeometryObject>} - a native std::vector<GeometryObject> from the wasm module
   */
  nativeVectorGeometry(initialSize?: number): StdVector<GeometryObject> {
    const nativeVectorGeometry_ =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.geometryArray)()) as StdVector<GeometryObject>

    if (initialSize) {
      const defaultGeometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject
      // resize has a required second parameter to set default values
      nativeVectorGeometry_.resize(initialSize, defaultGeometry)
    }

    return nativeVectorGeometry_
  }

  /**
   * Create a native vector of geometry collections.
   *
   * @return {NativeVectorGeometryCollection} A newly initialised native
   * vector of geometry collections
   */
  nativeVectorGeometryCollection(): NativeVectorGeometryCollection {
    const nativeVectorGeometryCollection =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.geometryCollectionArray)()) as NativeVectorGeometryCollection

    return nativeVectorGeometryCollection
  }

  /**
   * Create a native material from a canonical one.
   *
   * @param from The material to create the native material from
   * @return {MaterialObject} The created canonical material.
   */
  nativeMaterial(from: CanonicalMaterial): MaterialObject {
    const native: MaterialObject = {

      alphaCutoff: 0,
      alphaMode: toAlphaMode(this.wasmModule, from.blend),
      base: {
        x: from.baseColor[0],
        y: from.baseColor[1],
        z: from.baseColor[2],
        w: from.baseColor[3],
      },
      doubleSided: from.doubleSided,
      /* eslint-disable no-magic-numbers */
      ior: from.ior ?? 1.4,
      metallic: from.metalness ?? 1.0,
      roughness: from.roughness ?? 1.0,
      specular: from.specular !== void 0 ? {
        x: from.specular[0],
        y: from.specular[1],
        z: from.specular[2],
        w: from.specular[3],
      } : void 0,
    }
    /* eslint-enable no-magic-numbers */
    return native
  }

  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec2} - a native std::vector<glm::vec2> from the wasm module
   */
  nativeVectorGlmVec2(initialSize?: number): NativeVectorGlmVec2 {
    // eslint-disable-next-line new-cap
    const nativeVectorGlmVec2_ = new (this.wasmModule.vec2Array)() as NativeVectorGlmVec2

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorGlmVec2_.resize(initialSize, { x: 0, y: 0 })
    }

    return nativeVectorGlmVec2_
  }

  /**
   * Create a native vector profile to pass across the boundary.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorProfile} - a native std::vector<AP214Profile> from the wasm module
   */
  nativeVectorProfile(initialSize?: number): NativeVectorProfile {
    // eslint-disable-next-line new-cap
    const nativeVectorProfile_ = new (this.wasmModule.profileArray)() as NativeVectorProfile

    if (initialSize) {
      // resize has a required second parameter to set default values
      const defaultProfile = new (this.wasmModule.AP214Profile as any)
      nativeVectorProfile_.resize(initialSize, defaultProfile)
    }

    return nativeVectorProfile_
  }

  /**
   * Create a native version of a vector curve to parse across the boundary.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorCurve} - a native std::vector<AP214Curve> from the wasm module
   */
  nativeVectorCurve(initialSize?: number): StdVector<CurveObject> {
    // eslint-disable-next-line new-cap
    const nativeVectorCurve_ = new (this.wasmModule.curveArray)() as NativeVectorCurve

    if (initialSize) {
      // resize has a required second parameter to set default values
      const defaultCurve = new (this.wasmModule.AP214Curve as any)
      nativeVectorCurve_.resize(initialSize, defaultCurve)
    }

    return nativeVectorCurve_
  }

  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec3} - a native std::vector<glm::vec3> from the wasm module
   */
  nativeVectorGlmVec3(initialSize?: number): NativeVectorGlmVec3 {
    const nativeVectorGlmVec3_ =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.glmVec3Array)()) as NativeVectorGlmVec3

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorGlmVec3_.resize(initialSize, { x: 0, y: 0, z: 0 })
    }

    return nativeVectorGlmVec3_
  }

  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec3} - a native std::vector<glm::vec3> from the wasm module
   */
  nativeVectorVectorGlmdVec3(): StdVector<NativeVectorGlmVec3> {
    const nativeVectorVectorGlmdVec3_ =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.glmdVec3ArrayArray)()) as StdVector<NativeVectorGlmVec3>

    return nativeVectorVectorGlmdVec3_
  }

  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec3} - a native std::vector<glm::vec3> from the wasm module
   */
  nativeVectorGlmdVec3(initialSize?: number): NativeVectorGlmVec3 {
    const nativeVectorGlmdVec3_ =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.glmdVec3Array)()) as NativeVectorGlmVec3

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorGlmdVec3_.resize(initialSize, { x: 0, y: 0, z: 0 })
    }

    return nativeVectorGlmdVec3_
  }


  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec3} - a native std::vector<glm::vec3> from the wasm module
   */
  nativeVectorGlmdVec2(initialSize?: number): NativeVectorGlmVec2 {
    const nativeVectorGlmdVec2_ =
      // eslint-disable-next-line new-cap
      (new (this.wasmModule.glmdVec2Array)()) as NativeVectorGlmVec2

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorGlmdVec2_.resize(initialSize, { x: 0, y: 0 })
    }

    return nativeVectorGlmdVec2_
  }

  /**
   * Create a native 32bit uint vector.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeUintVector} - a native std::vector<uint32_t> from the wasm module
   */
  nativeUintVector(initialize?: number): NativeUintVector {
    const nativeUintVector_ = (new (this.wasmModule.UintVector)()) as NativeUintVector

    if (initialize) {
      // resize has a required second parameter to set default values
      nativeUintVector_.resize(initialize, 0)
    }

    return nativeUintVector_
  }

  /**
   * Create a native 32bit size_t vector.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeULongVector} - a native std::vector<size_t> from the wasm module
   */
  nativeULongVector(initialize?: number): NativeULongVector {
    const nativeULongVector_ = new (this.wasmModule.ULongVector)() as NativeULongVector

    if (initialize) {
      // resize has a required second parameter to set default values
      nativeULongVector_.resize(initialize, 0)
    }

    return nativeULongVector_
  }

  private readonly freeVectorPolygonalFaces_: NativeVectorIndexedPolygonalFace[] = []

  /**
   * Drop and delete all the indexed polygonal face vectors.
   */
  dropAllNativeIndexedPolygonalFaceVector(): void {

    while (this.freeVectorPolygonalFaces_.length > 0) {

      this.freeVectorPolygonalFaces_.pop()?.delete()
    }
  }

  /**
   * Free the native indexed polygon face.
   *
   * @param nativeVectorIndexedPolygonalFace The native item to free.
   */
  freeNativeIndexedPolygonalFaceVector(
      nativeVectorIndexedPolygonalFace: NativeVectorIndexedPolygonalFace): void {

    this.freeVectorPolygonalFaces_.push(nativeVectorIndexedPolygonalFace)
  }

  /**
   * Create a native vector of indexed polygonal faces uint vector.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorIndexedPolygonalFace} - a native object from the wasm module
   */
  nativeIndexedPolygonalFaceVector(initialize?: number): NativeVectorIndexedPolygonalFace {
    let nativeVectorIndexedPolygonalFace: NativeVectorIndexedPolygonalFace

    if (this.freeVectorPolygonalFaces_.length > 0) {
      nativeVectorIndexedPolygonalFace = this.freeVectorPolygonalFaces_.pop() as
        NativeVectorIndexedPolygonalFace

      if (nativeVectorIndexedPolygonalFace.size() > 0) {

        nativeVectorIndexedPolygonalFace.resize(0, nativeVectorIndexedPolygonalFace.get(0))
      }
    } else {
      nativeVectorIndexedPolygonalFace = new
        (this.wasmModule.VectorIndexedPolygonalFace)() as NativeVectorIndexedPolygonalFace
    }

    if (initialize) {
      // resize has a required second parameter to set default values
      nativeVectorIndexedPolygonalFace.resize(initialize)
    }

    return nativeVectorIndexedPolygonalFace
  }

  /**
   * Create a native vector of segments.
   *
   * @param initialize number - initial size of the vector (optional)
   * @return {NativeVectorSegment} - a native object from the wasm module
   */
  nativeSegmentVector(initialize?: number): NativeVectorSegment {
    const nativeVectorSegment =
      new (this.wasmModule.VectorSegment)() as NativeVectorSegment

    if (initialize) {
      // resize has a required second parameter to set default values
      nativeVectorSegment.resize(initialize)
    }

    return nativeVectorSegment
  }

  /**
   *
   * @param initialize
   * @return {NativeVectorBound3D}
   */
  nativeBound3DVector(initialize?: number): NativeVectorBound3D {
    const nativeVectorBound3D =
      new (this.wasmModule.Bound3DArray)() as NativeVectorBound3D

    if (initialize) {
      // resize has a required second parameter to set default values
      nativeVectorBound3D.resize(initialize)
    }

    return nativeVectorBound3D
  }


  /**
   * Has the wasm module been initialised?
   *
   * @return {boolean} indicating if the wasm module has been initialized
   */
  isInitialized(): boolean {
    if (this.conwayModel !== void 0) {
      return this.conwayModel.initialized
    }

    return false
  }

  /**
   * Destroy geometry processor and deinitialize
   */
  destroy(modelId: number = 0) {
    if (this.conwayModel !== void 0) {
      this.conwayModel.destroy()
      this.conwayModel.initialized = false
    }
  }

  /**
   *
   * @param arr - a 2D number array
   * @return {number} - total length of all 2D array elements
   */
  private getTotalLength(arr: number[][]): number {
    return arr.reduce((totalLength, innerArray) => totalLength + innerArray.length, 0)
  }

  /**
   *
   * @param indices
   * @return {NativeUintVector}
   */
  private createAndPopulateNativeIndices(indices: number[]): NativeUintVector {
    // Create native indices array
    const indexArray: NativeUintVector = this.nativeUintVector(indices.length)

    // Populate the array
    for (let j = 0; j < indices.length; j++) {
      indexArray.set(j, indices[j])
    }

    return indexArray
  }

  /**
   * Create and populate a list of native profiles from an array of canonical profiles.
   *
   * @param profiles The profiles to convert to native profiles.
   * @return {NativeVectorProfile} The populated native profiles.
   */
  private createAndPopulateNativeProfiles(profiles: CanonicalProfile[]): NativeVectorProfile {
    // Create native indices array
    const profileArray: NativeVectorProfile = this.nativeVectorProfile(profiles.length)

    // Populate the array
    for (let j = 0; j < profiles.length; j++) {
      profileArray.set(j, profiles[j].nativeProfile!)
    }

    return profileArray
  }


  /** @return {number} Pointer/memory address */
  arrayToWasmHeap(array:Float32Array | Uint32Array): any {
    // Allocate memory for the array within the Wasm module
    const bytesPerElement = array.BYTES_PER_ELEMENT
    const numBytes = array.length * bytesPerElement
    const arrayPtr = this.wasmModule._malloc(numBytes)

    // Create a new Uint8Array view on the Wasm memory buffer, then set the array to it
    const arrayWasm = new Uint8Array(this.wasmModule.HEAPU8.buffer, arrayPtr, numBytes)
    arrayWasm.set(new Uint8Array(array.buffer))

    return arrayPtr
  }

  /** @return {Uint8Array}  */
  arrayToSharedHeap(array:Float32Array | Uint32Array): Uint8Array {
    // Allocate memory for the array within the Wasm module
    const bytesPerElement = array.BYTES_PER_ELEMENT
    const numBytes = array.length * bytesPerElement
    // const arrayPtr = this.wasmModule._malloc(numBytes);
    const sharedBuffer = new SharedArrayBuffer(numBytes)


    // Create a new Uint8Array view on the Wasm memory buffer, then set the array to it
    const arrayWasm = new Uint8Array(sharedBuffer)
    arrayWasm.set(new Uint8Array(array.buffer))

    return arrayWasm
  }

  /**
   * Extract a 3D direction vector from an AP214 direction.
   *
   * @param from The AP214 direction to extract the vector from.
   * @return {Vector3 | undefined} The vector, or undefined if it can't be extracted.
   */
  static extractDirection(from: direction | null): Vector3 | undefined {

    if (from === null) {
      return void 0
    }

    return {
      x: from.direction_ratios[0],
      y: from.direction_ratios[1],
      // eslint-disable-next-line no-magic-numbers
      z: (from.direction_ratios.length > 2) ? from.direction_ratios[2] : 0,
    }
  }

  /**
   * Extract an AP214 3D cartesian transform operator as a transform matrix.
   *
   * @param from The AP214 cartesian transform to extract from.
   * @return {any} The internal matrix type extract.
   */
  extractCartesianTransformOperator3D(from: cartesian_transformation_operator_3d) {
    const conwayModel = this.conwayModel

    const position: Vector3 = {
      x: from.local_origin.coordinates[0],
      y: from.local_origin.coordinates[1],
      z: from.local_origin.coordinates[2],
    }

    const axis1Ref: Vector3 =
      AP214GeometryExtraction.extractDirection(from.axis1) ?? { x: 1, y: 0, z: 0 }
    const axis2Ref: Vector3 =
      AP214GeometryExtraction.extractDirection(from.axis2) ?? { x: 0, y: 1, z: 0 }
    const axis3Ref: Vector3 =
      AP214GeometryExtraction.extractDirection(from.axis3) ?? { x: 0, y: 0, z: 1 }

    const parameters: ParamsCartesianTransformationOperator3D = {
      position: position,
      axis1Ref: axis1Ref,
      axis2Ref: axis2Ref,
      axis3Ref: axis3Ref,
      normalizeAxis1: true,
      normalizeAxis2: true,
      normalizeAxis3: true,
      nonUniform: false,
      realScale: true,
      scale1_: from.scl,
      scale2_: from.scl,
      scale3_: from.scl,
    }

    return conwayModel.getCartesianTransformationOperator3D(parameters)
  }

  /**
   * Drop geometry that isn't in the scene.
   *
   * @param localID The id of the mesh to drop.
   */
  dropNonSceneGeometry( localID: number ) {

    if ( !this.scene.hasGeometry( localID ) ) {
      this.model.geometry.delete( localID )
    }
  }

  /**
   * Accepts AP214BooleanResult and AP214BooleanClippingResult
   *
   * @param from
   */
  extractBooleanResult( from: boolean_result ) {

    const firstOperand = from.first_operand

    if (
      firstOperand instanceof extruded_area_solid ||
      firstOperand instanceof boolean_result ||
      firstOperand instanceof half_space_solid ||
      firstOperand instanceof faceted_brep) {
      this.extractBooleanOperand( firstOperand )
    }

    const secondOperand = from.second_operand

    if (
      secondOperand instanceof extruded_area_solid ||
      secondOperand instanceof boolean_result ||
      secondOperand instanceof half_space_solid ||
      secondOperand instanceof faceted_brep ) {
      this.extractBooleanOperand( secondOperand )
    }

    // get geometry TODO(nickcastel50): eventually support flattening meshes
    let flatFirstMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()

    const firstMesh =
      this.model.geometry.getByLocalID( firstOperand.localID )

    if ( firstMesh !== void 0 && firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY ) {

      flatFirstMeshVector = this.nativeVectorGeometry()
      flatFirstMeshVector.push_back(firstMesh.geometry)
    } else {
      console.log(
          `Error extracting firstOperand geometry for expressID: 
        ${from.first_operand.expressID} - type: 
        ${EntityTypesAP214[from.first_operand.type]}`)
      return
    }

    let flatSecondMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()

    const secondMesh =
      this.model.geometry.getByLocalID( from.second_operand.localID )

    if ( secondMesh !== void 0 && secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY ) {

      flatSecondMeshVector = this.nativeVectorGeometry()
      flatSecondMeshVector.push_back(secondMesh.geometry)
    } else {
      console.log(
          `Error extracting secondOperand geometry for expressID: 
        ${from.second_operand.localID} - type:
         ${EntityTypesAP214[from.second_operand.type]}`)
      return
    }

    const parameters = this.paramsGetBooleanResultPool!.acquire()

    parameters.flatFirstMesh = flatFirstMeshVector
    parameters.flatSecondMesh = flatSecondMeshVector
    parameters.operatorType = from.operator.valueOf()

    const booleanGeometryObject: GeometryObject = this.conwayModel.getBooleanResult(parameters)

    if ( firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY &&
         secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY ) {

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: booleanGeometryObject,
        localID: from.localID,
        model: this.model,
        temporary: false,
      }

      this.dropNonSceneGeometry(firstMesh.localID)
      this.dropNonSceneGeometry(secondMesh.localID)
      this.model.geometry.add(canonicalMesh)
    }

    // console.log("deleting paramsGetBooleanResult...")
    // this.wasmModule.deleteParamsGetBooleanResult(parameters)
    this.paramsGetBooleanResultPool!.release( parameters )
  }

  /**
   * Extract a boolean operand from a boolean result.
   *
   * @param from The operand to extract.
   * @return {void}
   */
  extractBooleanOperand( from:
    extruded_area_solid |
    boolean_result |
    half_space_solid |
    faceted_brep ) {

    if ( from instanceof extruded_area_solid ) {
      // mark as temporary
      this.extractExtrudedAreaSolid( from, true )

    } else if (from instanceof half_space_solid ) {

      this.extractHalfspaceSolid(from, true)

    } else if (from instanceof faceted_brep) {

      this.extractAP214FacetedBrep(from, true)

    } else if (from instanceof boolean_result) {

      if (
        from.first_operand instanceof extruded_area_solid ||
        from.first_operand instanceof boolean_result ||
        from.first_operand instanceof half_space_solid ||
        from.first_operand instanceof faceted_brep) {

        this.extractBooleanOperand(from.first_operand)
      }

      if (
        from.second_operand instanceof extruded_area_solid ||
        from.second_operand instanceof boolean_result ||
        from.second_operand instanceof half_space_solid ||
        from.second_operand instanceof faceted_brep) {

        this.extractBooleanOperand(from.second_operand)
      }

      // get geometry TODO(nickcastel50): eventually support flattening meshes
      let flatFirstMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
      const flatFirstMeshVectorFromParts: boolean = false
      const firstMesh =
        this.model.geometry.getByLocalID(from.first_operand.localID)

      if (firstMesh !== void 0 && firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        flatFirstMeshVector = this.nativeVectorGeometry()
        flatFirstMeshVector.push_back(firstMesh.geometry)
      } else {
        console.log(
            `(Operand) Error extracting firstOperand geometry for expressID: 
          ${from.first_operand.expressID} - type: 
          ${EntityTypesAP214[from.first_operand.type]}`)
        return
      }

      let flatSecondMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
      const flatSecondMeshVectorFromParts: boolean = false
      const secondMesh =
        this.model.geometry.getByLocalID(from.second_operand.localID)

      if (secondMesh !== void 0 && secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        flatSecondMeshVector = this.nativeVectorGeometry()
        flatSecondMeshVector.push_back(secondMesh.geometry)
      } else {
        console.log(
            `(Operand) Error extracting secondOperand geometry for expressID: 
          ${from.second_operand.expressID} - type:
           ${EntityTypesAP214[from.second_operand.type]}`)
        return
      }

      const parameters = this.paramsGetBooleanResultPool!.acquire()

      parameters.flatFirstMesh = flatFirstMeshVector
      parameters.flatSecondMesh = flatSecondMeshVector
      parameters.operatorType = from.operator

      const booleanGeometryObject: GeometryObject = this.conwayModel.getBooleanResult(parameters)

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: booleanGeometryObject,
        localID: from.localID,
        model: this.model,
        temporary: true,
      }

      this.dropNonSceneGeometry(firstMesh.localID)
      this.dropNonSceneGeometry(secondMesh.localID)
      this.model.geometry.add(canonicalMesh)

      if (!flatFirstMeshVectorFromParts) {
        flatFirstMeshVector.delete()
      }

      if (!flatSecondMeshVectorFromParts) {
        flatSecondMeshVector.delete()
      }

      // console.log("deleting params get boolean result [operand]...")
      // this.wasmModule.deleteParamsGetBooleanResult(parameters)
      this.paramsGetBooleanResultPool!.release(parameters)

      // console.log("element type: " +
      // EntityTypesAP214[from.type] + " - expressID: " + from.expressID)
    }
  }

  /* eslint-disable no-magic-numbers */ // No magic numbers disabled
  // Cos we have *lots* of default material values.
  /**
   * Extract a canonical material from a surface style.
   *
   * @param from The surface style to extract a material from.
   */
  extractSurfaceStyle(from: surface_style_usage) {

    const materials = this.materials

    const material = materials.get(from.localID)

    if (material === void 0) {

      const readDoubleSided = from.side === surface_side.BOTH ||
        from.side === surface_side.POSITIVE

      const newMaterial: Mutable<CanonicalMaterial> = {
        name: `#${from.expressID}`,
        baseColor: [0.8, 0.8, 0.8, 1],
        legacyColor: [0.8, 0.8, 0.8, 1],
        doubleSided: readDoubleSided,
        blend: BlendMode.OPAQUE,
      }

      for (const style of from.style.styles ) {

        if ( style instanceof surface_style_rendering ) {

          if ( !( style.surface_colour instanceof colour_rgb ) ) {
            continue
          }

          const surfaceColor = extractColorRGBPremultiplied(style.surface_colour, 1)

          newMaterial.legacyColor = surfaceColor
          newMaterial.roughness = 1

        }

        /* TODO - other surface styles */

      }

      const isTransparent = newMaterial.baseColor[3] < 1.0

      newMaterial.metalness ??= 0
      newMaterial.roughness ??= 0
      newMaterial.ior ??= 1.4
      newMaterial.doubleSided = isTransparent || newMaterial.doubleSided
      newMaterial.blend = isTransparent ? BlendMode.BLEND : BlendMode.OPAQUE

      materials.add(from.localID, newMaterial)
    }

  }
  /* eslint-enable no-magic-numbers */

  /**
   * Extract a style item.
   *
   * @param from The styled item to extract from
   * @return {number | undefined}
   */
  extractStyledItem(
      from: styled_item,
      representationItem?: representation_item ): number | undefined {

    let surfaceStyleID: number | undefined = void 0

    for ( const style of from.styles ) {

      for ( const innerStyle of style.styles ) {

        if (innerStyle instanceof surface_style_usage ) {

          surfaceStyleID = innerStyle.localID
          this.extractSurfaceStyle(innerStyle)
          break
        }
      }
    }

    if (surfaceStyleID === void 0) {
      return
    }

    if ( representationItem !== undefined ) {

      this.materials.addGeometryMapping( representationItem.localID, surfaceStyleID )

    } else if ( from.item !== null ) {

      this.materials.addGeometryMapping( from.item.localID, surfaceStyleID )
    }

    return surfaceStyleID
  }

  /**
   *
   * @param from
   * @param temporary
   */
  extractHalfspaceSolid(
      from: half_space_solid,
      temporary: boolean = false ) {

    if ( from.base_surface instanceof plane ) {
      const paramsAxis2Placement3D: ParamsAxis2Placement3D =
        this.extractAxis2Placement3D( from.base_surface.position, from.localID, true )
      const axis2PlacementTransform = this.conwayModel
          .getAxis2Placement3D( paramsAxis2Placement3D )

      // get geometry
      const parameters: ParamsGetHalfspaceSolid = {
        flipWinding: from.agreement_flag,
        optionalLinearScalingFactor: this.linearScalingFactor,
      }

      const geometry: GeometryObject = this.conwayModel.getHalfSpaceSolid(parameters)

      // apply transform
      if (axis2PlacementTransform !== void 0) {
        geometry.applyTransform(axis2PlacementTransform)
      }

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: geometry,
        localID: from.localID,
        model: this.model,
        temporary: temporary,
      }

      this.model.geometry.add(canonicalMesh)
    }
  }

  /**
   *
   * @param from
   * @param temporary
   */
  /* extractPolygonalBoundedHalfSpace(from: AP214PolygonalBoundedHalfSpace,
    temporary: boolean = false) {
    // TODO(nickcastel50):unfinished - not needed at the moment -
    //also pass this.linearScalingFactor in parameters
    // extract position
    let axis2PlacementTransform: any | undefined = (void 0)

    const paramsAxis2Placement3D: ParamsAxis2Placement3D =
      this.extractAxis2Placement3D(from.Position, from.localID, true)
    axis2PlacementTransform = this.conwayModel
        .getAxis2Placement3D(paramsAxis2Placement3D)
  }*/

  /**
   *
   * @param from
   * @param temporary
   */
  extractExtrudedAreaSolid(
      from: extruded_area_solid,
      temporary: boolean = false ) {

    const axis2PlacementTransform: any | undefined = (void 0)

    const profile: CanonicalProfile | undefined = this.extractProfile( from.swept_area )

    if ( profile !== void 0 && profile.nativeProfile !== void 0 ) {

      const dir = {
        x: from.extruded_direction.direction_ratios[0],
        y: from.extruded_direction.direction_ratios[1],
        z: from.extruded_direction.direction_ratios[2],
      }

      // get geometry
      const parameters: ParamsGetExtrudedAreaSolid = {
        depth: from.depth,
        dir: dir,
        profile: profile.nativeProfile,
      }

      const geometry: GeometryObject = this.conwayModel.getExtrudedAreaSolid( parameters )

      // apply transform
      if ( axis2PlacementTransform !== void 0 ) {
        geometry.applyTransform( axis2PlacementTransform )
      }

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: geometry,
        localID: from.localID,
        model: this.model,
        temporary: temporary,
      }

      // add mesh to the list of mesh objects
      this.model.geometry.add(canonicalMesh)

    } else {
      console.log(`Couldn't parse profile, 
      expressID: ${from.swept_area.expressID} type: ${EntityTypesAP214[from.swept_area.type]}`)
    }
  }

  /**
   * Extract a canonical profile from a profile definition.
   *
   * @param from The profile definition to extract from.
   * @return {CanonicalProfile | undefined} The extracted profile,
   * or undefined if one cannot be extracted.
   */
  extractProfile(from: curve): CanonicalProfile | undefined {

    const foundProfile = this.model.profiles.getByLocalID(from.localID)

    if (foundProfile !== void 0) {

      // we already have this profile, return it and exit
      return foundProfile
    }

    const profile: CanonicalProfile = {
      localID: from.localID,
      curve: this.extractCurve( from ),
      holes: (void 0),
      profiles: (void 0),
      nativeProfile: (void 0),
    }

    this.model.profiles.add( profile )

    return profile
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractCompositeCurve( from: composite_curve ): CurveObject | undefined {

    let compositeCurve: CurveObject | undefined

    for (let i = 0; i < from.segments.length; i++) {
      const parentCurve = from.segments[i].parent_curve

      let currentCurveObject: CurveObject | undefined = void 0

      if ( parentCurve instanceof composite_curve ) {

        currentCurveObject = this.extractCompositeCurve(parentCurve)

      } else {

        currentCurveObject = this.extractCurve(from.segments[i].parent_curve)

      }

      if ( currentCurveObject !== void 0 ) {
        if (i === 0) {
          compositeCurve = currentCurveObject
        } else {

          // Note, copying 3D points is fine here because 2D points are just 3D points with Z = 0
          for (let j = 0; j < currentCurveObject.getPointsSize(); ++j) {
            compositeCurve!.add3d(currentCurveObject.get3d(j))
          }
        }
      }
    }

    return compositeCurve
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractCurve(
      from: curve |
      trimmed_curve |
      polyline |
      circle |
      b_spline_curve |
      b_spline_curve_with_knots |
      rational_b_spline_curve |
      line,
      trimmingArguments: TrimmingArguments | undefined = void 0) :
    CurveObject | undefined {

    // console.log("[extractCurve]: curve express ID: "
    // + from.expressID + " type: " + EntityTypesAP214[from.type])

    if ( from instanceof b_spline_curve ) {

      const bsplineCurve = this.extractBSplineCurve(from)

      return bsplineCurve
    }

    if ( from instanceof trimmed_curve ) {

      const trimmedCurve = this.extractAP214TrimmedCurve(from)

      return trimmedCurve
    }

    if (from instanceof polyline) {

      const polyCurve = this.extractPolyline(from)

      return polyCurve
    }

    if ( from instanceof circle ) {

      const circleCurve = this.extractAP214Circle(from)

      return circleCurve
    }

    if ( from instanceof surface_curve ) {

      return this.extractCurve(from.curve_3d, trimmingArguments)
    }

    if ( from instanceof line ) {

      const lineCurve = this.extractLine( from, trimmingArguments )

      return lineCurve
    }

    console.log(`Unsupported Curve! Type: ${EntityTypesAP214[from.type]}`)
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractPScurve1( from: pcurve ): CurveObject | undefined {

    const surface = from.basis_surface

    if ( !( surface instanceof plane ) ) {
      console.log( 'not a plane')
      return
    }

    const point = surface.position.location.coordinates


    const dim   = point.length

    const pointsFlattened = new Float32Array( dim * 1 )

    pointsFlattened[ 0 ] = point[ 0 ]
    pointsFlattened[ 1 ] = point[ 1 ]

    // eslint-disable-next-line no-magic-numbers
    if ( dim > 2 ) {

      pointsFlattened[ 2 ] = point[ 2 ]

      // pointsFlattened[ 3 ] = point[ 0 ] + ( dir[ 0 ] * mag )
      // pointsFlattened[ 4 ] = point[ 1 ] + ( dir[ 1 ] * mag )
      // pointsFlattened[ 5 ] = point[ 2 ] + ( dir[ 2 ] * mag )
    } else {
      // pointsFlattened[ 2 ] = point[ 0 ] + ( dir[ 0 ] * mag )
      // pointsFlattened[ 3 ] = point[ 1 ] + ( dir[ 1 ] * mag )
    }

    const pointsPtr = this.arrayToWasmHeap(pointsFlattened)

    const parameters = this.paramsGetPolyCurvePool!.acquire()

    parameters.points = pointsPtr
    parameters.pointsLength = 1
    parameters.dimensions = dim

    const curve_ = this.conwayModel.getPolyCurve(parameters)

    this.paramsGetPolyCurvePool!.release(parameters)

    this.wasmModule._free(pointsPtr)

    return curve_
  }

  /**
   * Extract a line
   *
   * @param from The line to extract.
   * @return {CurveObject | undefined} The curve object for the line.
   */
  extractLine( from: line, trimmingArguments?: TrimmingArguments ): CurveObject | undefined {

    if ( trimmingArguments === void 0 ) {
      const point = from.pnt.coordinates


      const dim   = point.length

      const pointsFlattened = new Float32Array( dim * 1 )

      pointsFlattened[ 0 ] = point[ 0 ]
      pointsFlattened[ 1 ] = point[ 1 ]

      // eslint-disable-next-line no-magic-numbers
      if ( dim > 2 ) {

        pointsFlattened[ 2 ] = point[ 2 ]

      }

      const pointsPtr = this.arrayToWasmHeap(pointsFlattened)

      const parameters = this.paramsGetPolyCurvePool!.acquire()

      parameters.points = pointsPtr
      parameters.pointsLength = 1
      parameters.dimensions = dim

      const curve_ = this.conwayModel.getPolyCurve(parameters)

      this.paramsGetPolyCurvePool!.release(parameters)

      this.wasmModule._free(pointsPtr)

      return curve_

    } else {

      // eslint-disable-next-line no-magic-numbers
      const pointsFlattened = new Float32Array( 6 )

      pointsFlattened[ 0 ] = trimmingArguments.start?.pos3D?.x ?? 0
      pointsFlattened[ 1 ] = trimmingArguments.start?.pos3D?.y ?? 0
      pointsFlattened[ 2 ] = trimmingArguments.start?.pos3D?.z ?? 0
      pointsFlattened[ 3 ] = trimmingArguments.end?.pos3D?.x ?? 0
      pointsFlattened[ 4 ] = trimmingArguments.end?.pos3D?.y ?? 0
      pointsFlattened[ 5 ] = trimmingArguments.end?.pos3D?.z ?? 0

      const pointsPtr = this.arrayToWasmHeap(pointsFlattened)

      const parameters = this.paramsGetPolyCurvePool!.acquire()

      parameters.points = pointsPtr
      parameters.pointsLength = 2
      parameters.dimensions = 3

      const curve_ = this.conwayModel.getPolyCurve(parameters)

      this.paramsGetPolyCurvePool!.release(parameters)

      this.wasmModule._free(pointsPtr)

      return curve_

    }
  }

  /**
   * Exctact a BSpline Curve
   *
   * @param from The bspline curve, potentially with knots/rational.
   * @return {CurveObject} The constructed curve object.
   */
  extractBSplineCurve(from: b_spline_curve): CurveObject {

    // degree is NOT dimensions (NC)
    let dimensions: number = 3

    if (from.control_points_list.length > 0) {

      dimensions = from.control_points_list[0].coordinates.length
    }

    const params: ParamsGetBSplineCurve = {
      dimensions: dimensions,
      degree: from.degree,
      points2: this.nativeVectorGlmdVec2(),
      points3: this.nativeVectorGlmdVec3(),
      knots: this.conwayModel.nativeVectorDouble(),
      weights: this.conwayModel.nativeVectorDouble(),
      senseAgreement: true,
      isEdge: false,
    }

    // eslint-disable-next-line no-magic-numbers
    if (dimensions === 2) {

      const outputPoints = params.points2

      for (const point of from.control_points_list) {

        const coords = point.coordinates

        outputPoints.push_back({ x: coords[0], y: coords[1] })
      }

    } else {

      const outputPoints = params.points3

      for (const point of from.control_points_list) {

        // eslint-disable-next-line no-magic-numbers
        if (point.coordinates.length !== 3) {
          continue
        }

        const coords = point.coordinates

        // console.log(`express ID: ${from.expressID} -  coords: ${coords}`)

        outputPoints.push_back({ x: coords[0], y: coords[1], z: coords[2] })
      }

    }

    if (from instanceof rational_b_spline_curve) {

      const outputWeights = params.weights

      for (const weight of from.weights_data) {

        outputWeights.push_back(weight)
      }
    } else {
      // create default weights
      const outputWeights = params.weights

      if (dimensions === this.TWO_DIMENSIONS) {
        for (let weightIndex = 0; weightIndex < params.points2.size(); ++weightIndex) {
          outputWeights.push_back(1.0)
        }
      } else if (dimensions === this.THREE_DIMENSIONS) {
        for (let weightIndex = 0; weightIndex < params.points3.size(); ++weightIndex) {
          outputWeights.push_back(1.0)
        }
      }
    }

    if (from instanceof b_spline_curve_with_knots) {
      const knots = params.knots

      for (let knotIndex = 0; knotIndex < from.knots.length; ++knotIndex) {
        const knot = from.knots[knotIndex]

        for (let knotMultiplicityIndex = 0;
          knotMultiplicityIndex < from.knot_multiplicities[knotIndex]; ++knotMultiplicityIndex) {
          knots.push_back(knot)
        }
      }

    } else {
      // This is just a AP214BsplineCurve, build default parameter lists
      // eslint-disable-next-line no-lonely-if
      if (dimensions === this.TWO_DIMENSIONS) {
        // build default knots
        const outputKnots = params.knots
        for (let pointIndex = 0;
          pointIndex < params.points2.size() + params.degree + 1; ++pointIndex) {
          outputKnots.push_back(pointIndex)
        }

        const outputWeights = params.weights

        for (let pointIndex = 0; pointIndex < params.points2.size(); ++pointIndex) {

          outputWeights.push_back(1.0)
        }
      } else if (dimensions === this.THREE_DIMENSIONS) {
        // build default knots
        const outputKnots = params.knots
        for (let pointIndex = 0;
          pointIndex < params.points3.size() + params.degree + 1; ++pointIndex) {
          outputKnots.push_back(pointIndex)
        }

        const outputWeights = params.weights

        for (let pointIndex = 0; pointIndex < params.points3.size(); ++pointIndex) {

          outputWeights.push_back(1.0)
        }
      }
    }

    return this.conwayModel.getBSplineCurve(params)
  }


  /**
   *
   * @param from
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined}
   */
  extractAP214Circle( from: circle, parametersTrimmedCurve: ParamsGetIfcTrimmedCurve = {
    masterRepresentation: 0,
    dimensions: 0,
    senseAgreement: true,
    trim1Cartesian2D: undefined,
    trim1Cartesian3D: undefined,
    trim1Double: 0,
    trim2Cartesian2D: undefined,
    trim2Cartesian3D: undefined,
    trim2Double: 0,
    trimExists: false,
  }): CurveObject | undefined {

    let axis2Placement2D: any = void 0 // glmdmat3
    let axis2Placement3D: any = void 0 // glmdmat4
    let dimension: number

    if ( from.position instanceof axis2_placement_2d ) {

      axis2Placement2D = this.extractAxis2Placement2D(from.position)
      axis2Placement3D = (new (this.wasmModule.Glmdmat4)) as any
      dimension = this.TWO_DIMENSIONS

    } else {

      axis2Placement3D = this.conwayModel.getAxis2Placement3D(
          this.extractAxis2Placement3D(from.position, from.localID, true) )
      axis2Placement2D = (new (this.wasmModule.Glmdmat3)) as any
      dimension = this.THREE_DIMENSIONS
    }

    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    const radius = from.radius

    const parametersCircle: ParamsGetIfcCircle = {
      dimensions: dimension,
      axis2Placement2D: axis2Placement2D,
      axis2Placement3D: axis2Placement3D,
      radius: radius,
      radius2: radius,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
    }

    return this.conwayModel.getIfcCircle(parametersCircle)
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractAP214TrimmedCurve(from: trimmed_curve): CurveObject | undefined {

    let trim1Cartesian2D: Vector2 = { x: 0, y: 0 }
    let trim1Cartesian3D: Vector3 = { x: 0, y: 0, z: 0 }
    let trim1Double: number = 0
    let trim2Cartesian2D: Vector2 = { x: 0, y: 0 }
    let trim2Cartesian3D: Vector3 = { x: 0, y: 0, z: 0 }
    let trim2Double: number = 0

    let dimension: number | undefined = void 0

    // use Cartesian if unspecified
    if (
      from.master_representation === trimming_preference.CARTESIAN ||
      from.master_representation === trimming_preference.UNSPECIFIED) {

      for (let trimIndex = 0; trimIndex < from.trim_1.length; trimIndex++) {

        const trim1 = from.trim_1[ trimIndex ]

        if ( trim1 instanceof cartesian_point ) {

          dimension = trim1.coordinates.length

          if ( dimension === this.TWO_DIMENSIONS ) {
            trim1Cartesian2D = {
              x: trim1.coordinates[0],
              y: trim1.coordinates[1],
            }
          } else if ( dimension === this.THREE_DIMENSIONS ) {
            trim1Cartesian3D = {
              x: trim1.coordinates[0],
              y: trim1.coordinates[1],
              z: trim1.coordinates[2],
            }
          }

          break
        }
      }

      for (let trimIndex = 0; trimIndex < from.trim_2.length; trimIndex++) {

        const trim2 = from.trim_2[trimIndex]

        if ( trim2 instanceof cartesian_point ) {

          dimension ??= trim2.coordinates.length

          if ( dimension === this.TWO_DIMENSIONS ) {
            trim2Cartesian2D = {
              x: trim2.coordinates[0],
              y: trim2.coordinates[1],
            }
          } else if ( dimension === this.THREE_DIMENSIONS ) {
            trim2Cartesian3D = {
              x: trim2.coordinates[0],
              y: trim2.coordinates[1],
              z: trim2.coordinates[2],
            }
          }

          break
        }
      }
    } else {
      // use parameter value
      for (let trimIndex = 0; trimIndex < from.trim_1.length; trimIndex++) {
        const trim1 = from.trim_1[trimIndex]
        if (trim1 instanceof parameter_value) {
          trim1Double = trim1.Value
          break
        }
      }

      for (let trimIndex = 0; trimIndex < from.trim_2.length; trimIndex++) {
        const trim2 = from.trim_2[trimIndex]
        if (trim2 instanceof parameter_value) {
          trim2Double = trim2.Value
          break
        }
      }
    }


    const paramsGetAP214TrimmedCurve: ParamsGetIfcTrimmedCurve = {
      masterRepresentation: from.master_representation.valueOf(),
      dimensions: dimension ?? 0,
      senseAgreement: from.sense_agreement,
      trim1Cartesian2D: trim1Cartesian2D,
      trim1Cartesian3D: trim1Cartesian3D,
      trim1Double: trim1Double,
      trim2Cartesian2D: trim2Cartesian2D,
      trim2Cartesian3D: trim2Cartesian3D,
      trim2Double: trim2Double,
      trimExists: true,
    }

    if ( from.basis_curve instanceof circle) {

      const curveObject = this.extractAP214Circle( from.basis_curve, paramsGetAP214TrimmedCurve)

      if (curveObject !== void 0) {
        return curveObject
      }
    }

    return undefined
  }

  /**
   * Efficiently flatten the points into a Float32Array
   *
   * @param points - Array of AP214CartesianPoint
   * @param dimensions - dimensions of points
   * @return {Float32Array}
   */
  flattenPointsToFloat32Array( points: cartesian_point[], dimensions:number ): Float32Array {

    const totalCoordinates = points.length * dimensions
    const flatCoordinates = new Float32Array(totalCoordinates)

    let offset = 0

    points.forEach((point) => {
      flatCoordinates.set( point.coordinates, offset )
      offset += point.coordinates.length // move the offset by the number of coordinates
    })

    return flatCoordinates
  }


  /**
   *
   * @param from
   * @return {CurveObject | undefined }
   */
  extractPolyline( from: polyline ): CurveObject | undefined {

    const points = from.points
    const pointsLength = points.length
    const dim = pointsLength > 0 ? points[ 0 ].coordinates.length : this.THREE_DIMENSIONS

    if (pointsLength > 0) {

      const pointsFlattened = this.flattenPointsToFloat32Array(points, dim)

      const pointsPtr = this.arrayToWasmHeap(pointsFlattened)

      const parameters = this.paramsGetPolyCurvePool!.acquire()

      parameters.points = pointsPtr
      parameters.pointsLength = pointsLength
      parameters.dimensions = dim

      const curve_ = this.conwayModel.getPolyCurve(parameters)

      this.paramsGetPolyCurvePool!.release(parameters)

      this.wasmModule._free(pointsPtr)

      return curve_
    }
  }


  /**
   * Extract a curve object from a circle profile.
   *
   * @param from The circle definition to extract from.
   * @return {CurveObject | undefined} The extracted circle curve,
   * or undefined if one cannot be extracted.
   */
  extractCircleCurve( from: circle ): CurveObject | undefined {

    const position = from.position

    if ( position !== null) {

      // if ( position instanceof axis2_placement_2d ) {

      const placement2D = this.extractAxis2Placement2D( position as axis2_placement_2d )

      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.radius,
        hasPlacement: true,
        placement: placement2D,
        thickness: -1,
      }

      // Note - we may need to handle the 3D case for STEP that we don't for IFC

      return this.conwayModel.getCircleCurve(paramsGetCircleCurve)

    } else {

      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.radius,
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        thickness: -1,
      }

      return this.conwayModel.getCircleCurve(paramsGetCircleCurve)
    }
  }

  /**
   * Extracts the curve for an ellipse from an AP214 ellipse profile definition.
   *
   * @param from The AP214 ellipse profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the ellipse curve,
   *  or undefined if not extractable.
   */
  extractEllipseProfileCurve(from: ellipse): CurveObject | undefined {

    const position = from.position

    if ( position !== null) {

      //   if ( position instanceof axis2_placement_2d ) {

      const placement2D = this.extractAxis2Placement2D( position as axis2_placement_2d )

      const paramsGetEllipseCurve: ParamsGetEllipseCurve = {
        radiusX: from.semi_axis_1,
        radiusY: from.semi_axis_2,
        hasPlacement: true,
        placement: placement2D,
        circleSegments: this.circleSegments,
      }

      return this.conwayModel.getEllipseCurve(paramsGetEllipseCurve)

      // Note - we may need to handle the 3D case for STEP that we don't for IFC

    } else {

      const paramsGetEllipseCurve: ParamsGetEllipseCurve = {
        radiusX: from.semi_axis_1,
        radiusY: from.semi_axis_2,
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        circleSegments: this.circleSegments,
      }

      return this.conwayModel.getEllipseCurve(paramsGetEllipseCurve)
    }
  }

  /**
   * Extract a mapped item to add its transform to instance an item.
   *
   * @param from The mapped item to extract.
   */
  extractMappedItem(
      from: mapped_item,
      owningElementLocalID?: number ) {

    const representationMap = from.mapping_source
    const mappingTarget = from.mapping_target

    let popTransform = false

    if ( mappingTarget instanceof cartesian_transformation_operator_3d ) {

      const nativeCartesianTransform =
        this.extractCartesianTransformOperator3D(mappingTarget)

      this.scene.addTransform(
          from.localID,
          nativeCartesianTransform.getValues(),
          nativeCartesianTransform)

      popTransform = true
    }

    for ( const representationItem of representationMap.mapped_representation.items ) {

      this.extractRepresentationItem( representationItem, owningElementLocalID )

      const styledItemLocalID_ = this.materials.styledItemMap.get(representationItem.localID)

      if ( styledItemLocalID_ !== void 0 ) {

        const styledItem_ = this.model.getElementByLocalID(styledItemLocalID_) as styled_item
        this.extractStyledItem(styledItem_)

      } else {

        // get material from parent
        const styledItemParentLocalID = this.materials.styledItemMap.get( from.localID )

        if ( styledItemParentLocalID !== void 0 ) {

          const styledItemParent =
            this.model.getElementByLocalID(styledItemParentLocalID) as styled_item

          this.extractStyledItem( styledItemParent, representationItem )
        }
      }
    }

    if ( popTransform ) {

      this.scene.popTransform()
    }
  }

  /**
   * Extract a representation item, including its geometry if necessary,
   * adding it to the current scene walk.
   *
   * Note - memoized result for instancing.
   *
   * @param from The representation to extract from.
   */
  extractRepresentationItem(
      from: representation_item,
      owningElementLocalID?: number) {

    const foundGeometry = this.model.geometry.getByLocalID(from.localID)

    if ( foundGeometry !== void 0 ) {

      this.scene.addGeometry( from.localID, owningElementLocalID )
      return
    }

    if ( from instanceof boolean_result ) {

      // also handles AP214BooleanClippingResult
      this.extractBooleanResult( from )
      this.scene.addGeometry( from.localID, owningElementLocalID )

    } else if ( from instanceof extruded_area_solid ) {

      this.extractExtrudedAreaSolid(from, false)
      this.scene.addGeometry( from.localID, owningElementLocalID )

    } else if ( from instanceof half_space_solid ) {

      this.extractHalfspaceSolid( from, false )
      this.scene.addGeometry( from.localID, owningElementLocalID )

    } else if ( from instanceof mapped_item ) {

      this.extractMappedItem( from, owningElementLocalID )

    } else if ( from instanceof polyline ) {
      // web-AP214 ignores AP214Polylines as meshes
      // //console.log(`AP214POLYLINE, expressID: ${from.expressID}`)
    } else if ( from instanceof faceted_brep ) {

      this.extractAP214FacetedBrep(from, false)
      this.scene.addGeometry(from.localID, owningElementLocalID)

    } else if (from instanceof shell_based_surface_model ) {

      this.extractAP214ShellBasedSurfaceModel(from, owningElementLocalID)
      this.scene.addGeometry(from.localID, owningElementLocalID)

    } else if ( from instanceof face_based_surface_model ) {

      this.extractAP214FaceBasedSurfaceModel(from)
      this.scene.addGeometry(from.localID, owningElementLocalID)

    } else if ( from instanceof manifold_solid_brep ) {

      this.extractManifoldSolidBrep(from)
      this.scene.addGeometry(from.localID, owningElementLocalID)

    } else {

      console.log(`Unsupported type: ${EntityTypesAP214[from.type]} 
      expressID: ${from.expressID}`)
    }
  }

  /**
   * Extract geometry from a manifold solid brep.
   *
   * @param from The brep to extract from.
   */
  extractManifoldSolidBrep(from: manifold_solid_brep) {

    const faces = from.outer.cfs_faces

    this.extractFaces(faces, from.localID)
  }

  /**
   *
   * @param from array of AP214ConnectedFaceSet
   * @param isRelVoid is from a relative void (default false)
   * @param parentLocalID parent element local ID
   */
  extractConnectedFaceSets(
      from: connected_face_set[],
      parentLocalID: number) {

    let geometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

    for (let faceSetIndex = 0; faceSetIndex < from.length; ++faceSetIndex) {
      const faceSet: connected_face_set = from[faceSetIndex]

      geometry = this.extractFaces( faceSet.cfs_faces, faceSet.localID, geometry )
    }

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: parentLocalID,
      model: this.model,
      temporary: false,
    }

    this.model.geometry.add(canonicalMesh)
  }


  /**
   *
   * @param from
   * @param isRelVoid
   */
  extractAP214FaceBasedSurfaceModel(from: face_based_surface_model) {
    const fbsmFaces = from.fbsm_faces

    this.extractConnectedFaceSets(fbsmFaces, from.localID)
  }

  /**
   *
   * @param from
   */
  extractAP214FacetedBrep(
      from: faceted_brep,
      temporary: boolean = false) {

    const faces = from.outer.cfs_faces

    this.extractFaces(faces, from.localID, void 0, temporary)
  }


  /**
   *
   * @param from
   */
  extractAP214ShellBasedSurfaceModel(
      from: shell_based_surface_model,
      owningElementLocalID?: number ) {
    const sbsmBoundary = from.sbsm_boundary

    for ( const currentBoundary of sbsmBoundary ) {
      const faces = currentBoundary.cfs_faces

      this.extractFaces(faces, currentBoundary.localID, undefined, false )
      this.scene.addGeometry(currentBoundary.localID, owningElementLocalID )
    }
  }

  /**
   *
   * @param from
   * @param parentLocalID
   * @param geometry_
   * @param isRelVoid
   * @return {GeometryObject}
   */
  extractFaces(
      from: face[],
      parentLocalID: number,
      geometry_?: GeometryObject | undefined,
      temporary: boolean = false): GeometryObject {

    let passedGeometry: boolean = true
    if (geometry_ === void 0) {
      passedGeometry = false
      geometry_ = (new (this.wasmModule.IfcGeometry)) as GeometryObject
    }

    for (const face_ of from) {

      // console.log(`face express ID: ${face.expressID} - type: ${EntityTypesAP214[face.type]}`)
      if ( face_ instanceof advanced_face ) {

        this.extractAdvancedFace( face_, geometry_ )

      } else {

        this.extractFace( face_, geometry_ )
      }
    }

    if (!passedGeometry) {

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: geometry_,
        localID: parentLocalID,
        model: this.model,
        temporary: temporary,
      }

      this.model.geometry.add(canonicalMesh)
    }

    return geometry_
  }

  /**
   * Extract an AP214 plane.
   *
   * @param from The plane to extract from
   * @return {NativeTransform4x4} The transform matching the plane.
   */
  extractPlane( from: plane ): NativeTransform4x4 {

    const location = from.position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    return this.conwayModel.getAxis2Placement3D( transform )
  }

  /**
   * Extract a pointlist to a native vector.
   *
   * @param from
   * @return {StdVector< Vector3 >} The native vector of 3D vectors.
   */
  extractPointList3D(from: Array< cartesian_point >): StdVector< Vector3 > {

    const result = this.nativeVectorGlmdVec3()

    for ( const point of from ) {

      const coords = point.coordinates

      if (coords.length !== this.THREE_DIMENSIONS) {
        continue
      }

      result.push_back({ x: coords[0], y: coords[1], z: coords[2] })
    }

    return result
  }

  /**
   * Extract a list of a list of points to a native object.
   *
   * @param from the list of lists of cartesian points
   * @param to {out} the native vector of vector of points.
   * @return {void}
   */
  extractPointListList3D(
      from: Array<Array< cartesian_point >>,
      to: StdVector<StdVector< Vector3 >>): void {

    for (const list of from) {
      to.push_back( this.extractPointList3D( list ) )
    }
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface}
   */
  extractBSplineSurface( from: b_spline_surface ): BSplineSurface {

    const bsplineSurface: BSplineSurface = {
      active: true,
      uDegree: from.u_degree,
      vDegree: from.v_degree,
      closedU: from.u_closed ?? false,
      closedV: from.v_closed ?? false,
      controlPoints: this.nativeVectorVectorGlmdVec3(),
      uMultiplicity: this.conwayModel.nativeVectorDouble(),
      vMultiplicity: this.conwayModel.nativeVectorDouble(),
      uKnots: this.conwayModel.nativeVectorDouble(),
      vKnots: this.conwayModel.nativeVectorDouble(),
      weightPoints: this.conwayModel.nativeVectorVectorDouble(),
    }

    this.extractPointListList3D( from.control_points_list, bsplineSurface.controlPoints )

    return bsplineSurface
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @param to The surface to extract to
   */
  extractToDoubleVector(
      from: Array<number>,
      to: StdVector<number>,
      start = 0,
      end = from.length): void {

    to.resize( end - start, 0 )

    for ( let where = start; where < end; ++where ) {
      to.set( where - start, from[ where ] )
    }
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @param to The surface to extract to
   */
  extractToDoubleVectorVector(
      from: Array< Array < number > >,
      to: StdVector< StdVector< number > >): void {

    to.resize( from.length )

    for (let where = 0, end = from.length; where < end; ++where) {

      this.extractToDoubleVector( from[ where ], to.get( where ) )
    }
  }


  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface}
   */
  extractBSplineSurfaceWithKnots( from: b_spline_surface_with_knots ): BSplineSurface {

    const result = this.extractBSplineSurface(from)

    // console.log(`selfIntersect: ${from.SelfIntersect}` ? 'True' : 'False')
    /* from.UDegree // UDegree (0)
    from.VDegree // VDegree (1)
    from.ControlPoints //ControlPoints (2)
    from.SurfaceForm //curve type, unused (3)
    from.UClosed //closedU (4)
    from.VClosed //closedV (5)
    from.SelfIntersect //selfIntersect (6)
    from.UMultiplicities //knotSetU (7)
    from.VMultiplicities //knotSetV (8)
    from.UKnots //indexesSetU (9)
    from.VKnots //indexesSetV (10)*/


    this.extractToDoubleVector( from.u_multiplicities, result.uMultiplicity )
    this.extractToDoubleVector( from.v_multiplicities, result.vMultiplicity )
    this.extractToDoubleVector( from.u_knots, result.uKnots )
    this.extractToDoubleVector( from.v_knots, result.vKnots )

    return result
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface} The extracted surface
   */
  extractRationalBSplineSurface(
      from: rational_b_spline_surface ): BSplineSurface {

    const result = this.extractBSplineSurface(from)

    this.extractToDoubleVectorVector( from.weights_data, result.weightPoints )

    return result
  }

  /**
   * Checks if a given point is not present in a collection of points.
   *
   * @param pt The point to check for presence.
   * @param points A collection of points to compare against.
   * @return {boolean} A boolean indicating whether the point
   * is not present in the collection.
   */
  notPresent(pt: Vector3, points: NativeVectorGlmVec3): boolean {
    for (let pointIndex = 0; pointIndex < points.size(); ++pointIndex) {
      const pt2 = points.get(pointIndex)
      if (pt.x === pt2.x && pt.y === pt2.y && pt.z === pt2.z) {
        return false
      }
    }
    return true
  }

  /**
   *
   * @param from
   * @param points
   * @param curves
   */
  extractLoop(from: loop, points: StdVector< Vector3 >, curves: StdVector< CurveObject > ) {

    if ( from instanceof poly_loop ) {

      console.log( 'poly _loop' )

      let prevLocalID: number = -1

      for ( const point of from.polygon ) {

        const coords = point.coordinates
        const vec3 = {
          x: coords[0],
          y: coords[1],
          z: coords[2],
        }

        const currentLocalID: number = point.localID

        if ( currentLocalID !== prevLocalID ) {
          points.push_back(vec3)
          prevLocalID = currentLocalID
        }
      }
    } else if ( from instanceof edge_loop ) {

      for ( const edge of from.edge_list ) {

        if (edge.edge_element instanceof edge_curve) {

          const edgeCurve = edge.edge_element.edge_geometry

          // console.log("curve type: " +
          //   EntityTypesAP214[edgeCurve.type] + " express ID: " + edgeCurve.expressID)

          const edgeStart = edge.edge_element.edge_start
          const edgeEnd = edge.edge_element.edge_end

          let trimmingStart: TrimmingSelect | undefined
          let trimmingEnd: TrimmingSelect | undefined

          if (edgeStart instanceof vertex_point) {

            const startPoint = edgeStart.vertex_geometry

            // eslint-disable-next-line no-magic-numbers
            if (startPoint instanceof cartesian_point && startPoint.coordinates.length === 3) {

              const startCoords = startPoint.coordinates

              trimmingStart = {
                hasParam: false,
                hasPos: true,
                hasLength: false,
                param: 0.0,
                pos: void 0,
                pos3D: {
                  x: startCoords[0],
                  y: startCoords[1],
                  z: startCoords[2],
                },
              }
            }
          }

          if (edgeEnd instanceof vertex_point) {

            const endPoint = edgeEnd.vertex_geometry

            // eslint-disable-next-line no-magic-numbers
            if (endPoint instanceof cartesian_point && endPoint.coordinates.length === 3) {

              const endCoords = endPoint.coordinates

              trimmingEnd = {
                hasParam: false,
                hasPos: true,
                hasLength: false,
                param: 0.0,
                pos: void 0,
                pos3D: {
                  x: endCoords[0],
                  y: endCoords[1],
                  z: endCoords[2],
                },
              }
            }
          }

          const trimmingArguments: TrimmingArguments = {
            exist: !!((trimmingStart !== void 0 && trimmingEnd !== void 0)),
            start: trimmingStart,
            end: trimmingEnd,
          }

          const curveValue = this.extractCurve(edgeCurve, trimmingArguments)

          if (curveValue !== void 0) {

            if ( !edge.orientation ) {
              // reverse curve
              curveValue.invert()
            }

            curves.push_back(curveValue)

          } else {
            console.log(`curve === undefined, type: ${EntityTypesAP214[edgeCurve.type]}`)
          }

        } else {

          console.log( 'oriented_edge case' )

          //  console.log("curve === null")
          const start = edge.edge_start

          if (start instanceof vertex_point) {

            const startPoint = start.vertex_geometry

            // eslint-disable-next-line no-magic-numbers
            if (startPoint instanceof cartesian_point && startPoint.coordinates.length === 3) {

              const startCoords = startPoint.coordinates

              points.push_back({
                x: startCoords[0],
                y: startCoords[1],
                z: startCoords[2],
              })
            }
          }
        }
      }
    } else {
      console.log(`Unsupported bound ${loop}`)
    }
  }

  /**
   * Extract an advanced (NURBS) b-rep face.
   *
   * @param from
   * @param geometry
   */
  extractAdvancedFace(from: advanced_face, geometry: GeometryObject) {

    if ( from.bounds.length > 0 ) {

      const bound3DVector = this.nativeBound3DVector()

      for ( const bound of from.bounds ) {
        const vec3Array = this.nativeVectorGlmdVec3()

        const innerBound = bound.bound
        const nativeEdgeCurves = this.nativeVectorCurve()
        // console.log("innerBound type: " + EntityTypesAP214[innerBound.type])

        this.extractLoop( innerBound, vec3Array, nativeEdgeCurves )

        // get curve
        const parameters: ParamsGetLoop = {
          points: vec3Array,
          edges: nativeEdgeCurves,
        }

        // console.log("isEdgeLoop: " + (isEdgeLoop) ? "TRUE" : "FALSE")
        const curve_: CurveObject = this.conwayModel.getLoop(parameters)

        // create bound vector
        const parametersCreateBounds3D: ParamsCreateBound3D = {
          curve: curve_,
          orientation: bound.orientation,
          type: (bound.type === EntityTypesAP214.FACE_OUTER_BOUND) ? 0 : 1,
        }

        const bound3D: Bound3DObject = this.conwayModel.createBound3D(parametersCreateBounds3D)

        bound3DVector.push_back(bound3D)
        vec3Array.delete()
        nativeEdgeCurves.delete()
      }

      const surface = from.face_geometry

      // add face to geometry
      const nativeSurface = (new (this.wasmModule.IfcSurface)) as SurfaceObject

      if ( surface instanceof plane ) {

        nativeSurface.transformation = this.extractPlane(surface)

      } else if (surface instanceof rational_b_spline_surface) {

        nativeSurface.bspline = this.extractRationalBSplineSurface(surface)

        if ( !nativeSurface.bspline.active ) {
          return
        }

      } else if ( surface instanceof b_spline_surface_with_knots ) {

        nativeSurface.bspline = this.extractBSplineSurfaceWithKnots(surface)

        if ( !nativeSurface.bspline.active ) {
          return
        }

      } else if ( surface instanceof b_spline_surface ) {

        nativeSurface.bspline = this.extractBSplineSurface( surface )

        if (!nativeSurface.bspline.active) {
          return
        }

      } else if ( surface instanceof cylindrical_surface ) {

        this.extractCylindricalSurface( surface, nativeSurface )

        if ( !nativeSurface.cylinder.active ) {
          return
        }

      } else if ( surface instanceof surface_of_revolution ) {

        this.extractSurfaceOfRevolution( surface, nativeSurface )

        if ( !nativeSurface.revolution.active ) {
          return
        }

      } else if ( surface instanceof surface_of_linear_extrusion ) {

        this.extractSurfaceOfLinearExtrusion( surface, nativeSurface )

        if (!nativeSurface.extrusion.active) {
          return
        }

      } else {

        console.log(`Unknown surface type: ${surface}`)
      }

      const parameters: ParamsAddFaceToGeometry = {
        boundsArray: bound3DVector,
        advancedBrep: true,
        surface: nativeSurface,
        scaling: this.getLinearScalingFactor(),
      }

      this.conwayModel.addFaceToGeometry(parameters, geometry)

      bound3DVector.delete()
    }
  }

  /**
   * Extract a linear extrusion/sweep surface
   *
   * @param from
   * @param nativeSurface
   */
  extractSurfaceOfLinearExtrusion(from: surface_of_linear_extrusion, nativeSurface: SurfaceObject) {

    const profile = this.extractProfile( from.swept_curve )

    if (profile?.nativeProfile === void 0) {

      console.log('Couldn\'t get curve profile for linear extrusion surface')
      return
    }

    const extrusionAxis = from.extrusion_axis
    const depth = extrusionAxis.magnitude
    const directionCoords = extrusionAxis.orientation.direction_ratios

    nativeSurface.extrusion = {
      active: true,
      length: depth,
      direction: {
        x: directionCoords[0],
        y: directionCoords[1],
        z: directionCoords[2],
      },
      profile: profile?.nativeProfile,
    }
  }

  /**
   * Extract a surface of revolution/rotational sweep surface
   *
   * @param from
   * @param nativeSurface
   */
  extractSurfaceOfRevolution(from: surface_of_revolution, nativeSurface: SurfaceObject) {

    const sweptCurve = from.swept_curve

    const nativeCurve = this.extractCurve(sweptCurve)

    if ( nativeCurve === void 0 ) {
      return
    }

    const axisDirection = this.extractAxis1Placement3D( from.axis_position, from.localID, true )

    // create native IfcProfile vector
    const parameters: ParamsCreateNativeIfcProfile = {
      curve: nativeCurve,
      // TODO(nickcastel50): support profiles with holes (out of scope at the moment)
      holes: void 0,
      isConvex: false,
      isComposite: false,
      profiles: void 0,
    }

    const nativeProfile = this.conwayModel.createNativeIfcProfile(parameters)

    nativeSurface.revolution = {
      active: true,
      direction: this.conwayModel.getAxis1Placement3D(axisDirection),
      profile: nativeProfile,
    }
  }

  /**
   * Extract a cylindrical surface.
   *
   * @param from The AP214 object to extract from.
   * @param nativeSurface The native surface representation.
   */
  extractCylindricalSurface(from: cylindrical_surface, nativeSurface: SurfaceObject) {

    const location = from.position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    nativeSurface.transformation = this.conwayModel.getAxis2Placement3D(transform)
    nativeSurface.cylinder = { active: true, radius: from.radius }
  }

  /**
   *
   * @param from
   * @param geometry
   */
  extractFace(from: face, geometry: GeometryObject) {
    if (from.bounds.length > 0) {

      const bound3DVector = this.nativeBound3DVector()

      for (let boundIndex = 0; boundIndex < from.bounds.length; ++boundIndex) {
        const vec3Array = this.nativeVectorGlmdVec3()
        const bound = from.bounds[boundIndex]

        if (bound.bound instanceof poly_loop) {

          let prevLocalID: number = -1

          for (let pointIndex = 0; pointIndex < bound.bound.polygon.length; ++pointIndex) {
            const vec3 = {
              x: bound.bound.polygon[pointIndex].coordinates[0],
              y: bound.bound.polygon[pointIndex].coordinates[1],
              z: bound.bound.polygon[pointIndex].coordinates[2],
            }

            const currentLocalID: number = bound.bound.polygon[pointIndex].localID

            if (currentLocalID !== prevLocalID) {
              vec3Array.push_back(vec3)
              prevLocalID = currentLocalID
            }
          }
        }

        const edgesDummy: StdVector<CurveObject> = this.nativeVectorCurve()
        // get curve
        const parameters: ParamsGetLoop = {
          points: vec3Array,
          edges: edgesDummy,
        }

        const curve_: CurveObject = this.conwayModel.getLoop(parameters)

        // create bound vector
        const parametersCreateBounds3D: ParamsCreateBound3D = {
          curve: curve_,
          orientation: bound.orientation,
          type: (bound.type === EntityTypesAP214.FACE_OUTER_BOUND) ? 0 : 1,
        }

        const bound3D: Bound3DObject = this.conwayModel.createBound3D(parametersCreateBounds3D)

        bound3DVector.push_back(bound3D)
        vec3Array.delete()
        edgesDummy.delete()
      }

      // add face to geometry
      const defaultSurface = (new (this.wasmModule.IfcSurface)) as SurfaceObject
      const parameters: ParamsAddFaceToGeometry = {
        boundsArray: bound3DVector,
        advancedBrep: false,
        surface: defaultSurface,
        scaling: this.getLinearScalingFactor(),
      }

      this.conwayModel.addFaceToGeometry(parameters, geometry)

      bound3DVector.delete()
      defaultSurface.delete()
    }
  }

  /**
   * Extract an axis placement 2D native object.
   *
   * @param from The axis 2 placement to extract.
   * @return {any} The native placement transform.
   */
  extractAxis2Placement2D( from: axis2_placement_2d ): NativeTransform3x3 {

    let normalizeX: boolean = false

    const refDirection = from.ref_direction

    if (refDirection !== null) {
      normalizeX = true
    }

    const position2D = {
      x: from.location.coordinates[0],
      y: from.location.coordinates[1],
    }


    const xAxisRef = refDirection !== null ? {
      x: refDirection.direction_ratios[0],
      y: refDirection.direction_ratios[1],
    } : { x: 1, y: 0 }

    const axis2Placement2DParameters: ParamsGetAxis2Placement2D = {
      isAxis2Placement2D: true,
      isCartesianTransformationOperator2D: false,
      isCartesianTransformationOperator2DNonUniform: false,
      position2D: position2D,
      customAxis1Ref: normalizeX,
      axis1Ref: xAxisRef,
      customAxis2Ref: false,
      axis2Ref: xAxisRef,
      customScale: false,
      scale1: 0,
      customScale2: false,
      scale2: 0,
    }

    const axis2Placement2DTransform = this.conwayModel
        .getAxis2Placement2D(axis2Placement2DParameters)

    return axis2Placement2DTransform
  }


  /**
   * Extracts a 2D Cartesian transformation operator from an AP214 Cartesian
   *  transformation operator definition. The transformation can be uniform or non-uniform.
   *
   * @param from The AP214 Cartesian transformation operator definition,
   *  which can be either uniform or non-uniform.
   * @return {any} The resulting transformation operator parameters.
   */
  extractCartesianTransformOperator2D( from: cartesian_transformation_operator_2d ): any {
    let scale1: number = 1.0
    let scale2: number = 1.0

    if ( from.scale !== null) {
      scale1 = from.scale
      scale2 = scale1
    }

    const position: Vector2 = {
      x: from.local_origin.coordinates[0],
      y: from.local_origin.coordinates[1],
    }

    const axis1Ref: Vector3 =
      AP214GeometryExtraction.extractDirection(from.axis1) ?? { x: 1, y: 0, z: 0 }
    const axis2Ref: Vector3 =
      AP214GeometryExtraction.extractDirection(from.axis2) ?? { x: 0, y: 1, z: 0 }

    const axis2Placement2DParameters: ParamsGetAxis2Placement2D = {
      isAxis2Placement2D: false,
      isCartesianTransformationOperator2D: true,
      isCartesianTransformationOperator2DNonUniform: false,
      position2D: position,
      customAxis1Ref: true,
      axis1Ref: axis1Ref,
      customAxis2Ref: true,
      axis2Ref: axis2Ref,
      customScale: true,
      scale1: scale1,
      customScale2: true,
      scale2: scale2,
    }

    return this.conwayModel.getAxis2Placement2D(axis2Placement2DParameters)
  }

  /**
   * Extract a placement, adding it to the scene.
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @return {void}
   */
  extractAxis1Placement3D(from: axis1_placement, parentLocalId: number): void
  /**
   * Extract a placement (no memoization/scene creation)
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @param extractOnly {true} Only extract, don't memoize and add to the scene
   * @return {ParamsAxis1Placement3D} The extracted placement.
   */
  // eslint-disable-next-line no-dupe-class-members
  extractAxis1Placement3D(
    from: axis1_placement,
    parentLocalId: number,
    extractOnly: true): ParamsAxis1Placement3D
  // eslint-disable-next-line no-dupe-class-members
  extractAxis1Placement3D(
      from: axis1_placement,
      parentLocalId: number,
      extractOnly: boolean = false): void | ParamsAxis1Placement3D {

    if (from === null) {
      return
    }

    const result = this.scene.getTransform(parentLocalId)

    if (result !== void 0) {

      this.scene.pushTransform(result)

      return
    }

    let normalizeZ: boolean = false

    if ( from.axis !== null ) {
      normalizeZ = true
    }

    const position = {
      x: from.location.coordinates[0],
      y: from.location.coordinates[1],
      z: from.location.coordinates[2],
    }

    const zAxisRef = {
      x: from.axis?.direction_ratios[0] ?? 0,
      y: from.axis?.direction_ratios[1] ?? 0,
      z: from.axis?.direction_ratios[2] ?? 1,
    }

    const axis1Placement3DParameters: ParamsAxis1Placement3D = {
      position: position,
      zAxisRef: zAxisRef,
      normalizeZ: normalizeZ,
    }

    if (extractOnly) {
      return axis1Placement3DParameters
    }

    const axis1PlacementTransform = this.conwayModel
        .getAxis1Placement3D(axis1Placement3DParameters)

    this.scene.addTransform(
        parentLocalId,
        axis1PlacementTransform.getValues(),
        axis1PlacementTransform)
  }

  /**
   * Extract a placement, adding it to the scene.
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @return {void}
   */
  extractAxis2Placement3D(from: axis2_placement_3d, parentLocalId: number): void
  /**
   * Extract a placement (no memoization/scene creation)
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @param extractOnly {true} Only extract, don't memoize and add to the scene
   * @return {ParamsAxis2Placement3D} The extracted placement.
   */
  // eslint-disable-next-line no-dupe-class-members
  extractAxis2Placement3D(
    from: axis2_placement_3d,
    parentLocalId: number,
    extractOnly: true): ParamsAxis2Placement3D
  // eslint-disable-next-line no-dupe-class-members
  extractAxis2Placement3D(
      from: axis2_placement_3d,
      parentLocalId: number,
      extractOnly: boolean = false): void | ParamsAxis2Placement3D {

    if (from === null) {
      return
    }

    const result = this.scene.getTransform(parentLocalId)

    if (result !== void 0) {

      this.scene.pushTransform(result)

      return
    }

    let normalizeZ: boolean = false
    let normalizeX: boolean = false

    if (from.axis !== null) {
      normalizeZ = true
    }

    if (from.ref_direction !== null) {
      normalizeX = true
    }

    const position = {
      x: from.location.coordinates[0],
      y: from.location.coordinates[1],
      z: from.location.coordinates[2],
    }

    const zAxisRef = {
      x: from.axis?.direction_ratios[0] ?? 0,
      y: from.axis?.direction_ratios[1] ?? 0,
      z: from.axis?.direction_ratios[2] ?? 1,
    }

    const xAxisRef = {
      x: from.ref_direction?.direction_ratios[0] ?? 1,
      y: from.ref_direction?.direction_ratios[1] ?? 0,
      z: from.ref_direction?.direction_ratios[2] ?? 0,
    }

    const axis2Placement3DParameters: ParamsAxis2Placement3D = {
      position: position,
      zAxisRef: zAxisRef,
      xAxisRef: xAxisRef,
      normalizeZ: normalizeZ,
      normalizeX: normalizeX,
    }

    if (extractOnly) {
      return axis2Placement3DParameters
    }

    const axis2PlacementTransform = this.conwayModel
        .getAxis2Placement3D(axis2Placement3DParameters)

    this.scene.addTransform(
        parentLocalId,
        axis2PlacementTransform.getValues(),
        axis2PlacementTransform)
  }


  /**
   *
   * @param from
   */
  extractPlacement(from: placement) {

    const result: AP214SceneTransform | undefined =
      this.scene.getTransform(from.localID)

    if (result !== void 0) {

      this.scene.pushTransform(result)
      return
    }

    if (from instanceof axis2_placement_3d) {

      this.extractAxis2Placement3D(from, from.localID)

    }
  }

  /**
   *
   * @param from
   * @return {number | undefined}
   */
  // extractMaterial(
  //     from: AP214Material |
  //     AP214MaterialList |
  //     AP214MaterialProfile |
  //     AP214MaterialProfileSet |
  //     AP214MaterialConstituent |
  //     AP214MaterialLayerSetUsage |
  //     AP214MaterialConstituentSet): number | undefined {
  //   if (from instanceof AP214Material) {
  //     return this.materials.materialDefinitionsMap.get(from.localID)
  //   } else if (from instanceof AP214MaterialLayerSetUsage) {
  //     for (const layer of from.ForLayerSet.MaterialLayers) {
  //       if (layer.Material) {
  //         const styledItemID = this.extractMaterial(layer.Material)
  //         if (styledItemID !== undefined) {
  //           return styledItemID
  //         }
  //       }
  //     }
  //   } else if (from instanceof AP214MaterialList) {
  //     for (const _material of from.Materials) {
  //       if (_material instanceof AP214Material) {
  //         const styledItemID = this.extractMaterial(_material)
  //         if (styledItemID !== undefined) {
  //           return styledItemID
  //         }
  //       }
  //     }
  //   } else if (from instanceof AP214MaterialProfile) {
  //     if (from.Material !== null) {
  //       const styledItemID = this.extractMaterial(from.Material)
  //       if (styledItemID !== undefined) {
  //         return styledItemID
  //       }
  //     } else {
  //       console.log(`from.Material === null`)
  //     }
  //   } else if (from instanceof AP214MaterialProfileSet) {
  //     for (const material of from.MaterialProfiles) {
  //       const styledItemID = this.extractMaterial(material)

  //       if (styledItemID !== undefined) {
  //         return styledItemID
  //       }
  //     }
  //   } else if (from instanceof AP214MaterialConstituent) {
  //     const styledItemID = this.extractMaterial(from.Material)
  //     if (styledItemID !== undefined) {
  //       return styledItemID
  //     }
  //   } else if (from instanceof AP214MaterialConstituentSet) {
  //     if (from.MaterialConstituents !== null) {
  //       for (const materialConstituents of from.MaterialConstituents) {
  //         const styledItemID = this.extractMaterial(materialConstituents)
  //         if (styledItemID !== undefined) {
  //           return styledItemID
  //         }
  //       }
  //     }
  //   }
  // }

  /**
   *
   * @param from
   * @return {number | undefined}
   */
  // extractMaterialStyle(from: AP214Product): number | undefined {
  //   let styledItemID: number | undefined
  //   const materialID = this.materials.relMaterialsMap.get(from.localID)
  //   if ( materialID !== void 0 ) {
  //     if (this.materials.materialDefinitionsMap.has(materialID)) {
  //       // found material for mesh
  //       styledItemID = this.materials.materialDefinitionsMap.get(materialID)
  //     } else {
  //       const material = this.model.getElementByLocalID(materialID)
  //       if (material) {
  //         if (material instanceof AP214Material) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialLayerSetUsage) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialList) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialProfile) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialProfileSet) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialConstituent) {
  //           styledItemID = this.extractMaterial(material)
  //         } else if (material instanceof AP214MaterialConstituentSet) {
  //           styledItemID = this.extractMaterial(material)
  //         } else {
  //           console.log(`Material type not supported - type: ${EntityTypesAP214[material.type]}`)
  //         }
  //       }
  //     }
  //   }

  //   return styledItemID
  // }

  /**
   *
   */
  populateStyledItemsMap() {

    const styledItems = this.model.types(styled_item)

    for ( const styledItem of styledItems ) {

      if ( styledItem.item !== null ) {
        this.materials.styledItemMap.set( styledItem.item.localID, styledItem.localID )
      }
    }
  }

  /**
   *
   */
  // populateMaterialDefinitionsMap() {
  //   // populate MaterialDefinitionsMap
  //   const materialDefinitionRepresentations =
  //     this.model.types(AP214MaterialDefinitionRepresentation)

  //   for (const materialDefinitionRep of materialDefinitionRepresentations) {

  //     for (const representation of materialDefinitionRep.Representations) {
  //       for (let itemIndex = 0; itemIndex < representation.Items.length; ++itemIndex) {
  //         // save mapping of AP214Material --> AP214StyledItem
  //         this.materials.materialDefinitionsMap.set(
  //             materialDefinitionRep.RepresentedMaterial.localID,
  //             representation.Items[itemIndex].localID)
  //       }
  //     }
  //   }
  // }

  /**
   * Extracts linear scaling factor
   */
  // extractLinearScalingFactor() {
  //   const projects = this.model.types(AP214Project)

  //   const projectsArray = Array.from(projects)

  //   if (projectsArray.length <= 0) {
  //     console.log('No AP214Projects found?')
  //     return
  //   }

  //   const project = projectsArray[0]
  //   const unitsInContext = project.UnitsInContext

  //   if (unitsInContext === null) {
  //     console.log('No units defined.')
  //     return
  //   }

  //   // console.log(`UnitsInContext expressID: ${unitsInContext.expressID}`)
  //   for (const unit of unitsInContext.Units) {
  //     // console.log(`Unit type: ${EntityTypesAP214[unit.type]}, expressID: ${unit.expressID}`)

  //     if (unit instanceof AP214SIUnit) {
  //       const unitType = unit.UnitType
  //       const unitName = unit.Name
  //       const unitPrefix = unit.Prefix

  //       if (unitPrefix === null) {
  //         // console.log("Unit prefix not found")
  //         continue
  //       }

  //       const unitPrefixVal = this.convertPrefix(unitPrefix)
  //       if (unitType === AP214UnitEnum.LENGTHUNIT &&
  //         unitName === AP214SIUnitName.METRE &&
  //         unitPrefixVal !== null) {
  //         this.linearScalingFactor *= unitPrefixVal
  //         continue
  //       } else {
  //         // console.log("linear scaling factor not set for AP214SIUnit")
  //       }
  //     } else if (unit instanceof AP214ConversionBasedUnit) {
  //       // TODO: Linear scaling factor for AP214ConversionBasedUnit
  //       /* const unitType = unit.UnitType
  //       unit.ConversionFactor.UnitComponent
  //       unit.Dimensions
  //       console.log("unit.Name: " + unit.Name)*/
  //     }
  //   }
  // }

  /**
   *
   * @param prefix
   * @return {number | null}
   */
  convertPrefix(prefix: si_prefix): number | null {
    /* eslint-disable no-magic-numbers */
    switch (prefix) {
      case si_prefix.EXA:
        return 1e18
      case si_prefix.PETA:
        return 1e15
      case si_prefix.TERA:
        return 1e12
      case si_prefix.GIGA:
        return 1e9
      case si_prefix.MEGA:
        return 1e6
      case si_prefix.KILO:
        return 1e3
      case si_prefix.HECTO:
        return 1e2
      case si_prefix.DECA:
        return 1e1
      case si_prefix.DECI:
        return 1e-1
      case si_prefix.CENTI:
        return 1e-2
      case si_prefix.MILLI:
        return 1e-3
      case si_prefix.MICRO:
        return 1e-6
      case si_prefix.NANO:
        return 1e-9
      case si_prefix.PICO:
        return 1e-12
      case si_prefix.FEMTO:
        return 1e-15
      case si_prefix.ATTO:
        return 1e-18
      default:
        return null
    }

  }

  /**
   * Extract the geometry data from the AP214
   *
   * @param model - Input AP214StepModel to extract geometry data from
   * @param logTime boolean - print execution time (default no)
   * @return {[ExtractResult, AP214SceneBuilder]} - Enum indicating extraction result
   * + Geometry array
   */
  extractAP214GeometryData(logTime: boolean = false):
    [ExtractResult, AP214SceneBuilder] {

    let result: ExtractResult = ExtractResult.INCOMPLETE

    const startTime = Date.now()

    //  this.extractLinearScalingFactor()
    const previousMemoizationState = this.model.elementMemoization

    // populate relMaterialsMap
    // const relAssociatesMaterials = this.model.types(AP214RelAssociatesMaterial)

    try {

      this.model.elementMemoization = false

      const shapeDefinitions = this.model.types(shape_definition_representation)

      for ( const shapeDefinition of shapeDefinitions ) {

        this.scene.clearParentStack()

        const representation = shapeDefinition.used_representation
        const representationItems = representation.items

        const objectPlacement =
          representationItems.find(
              ( where ) => where instanceof placement ) as placement | undefined

        if ( objectPlacement !== void 0 ) {

          this.extractPlacement( objectPlacement )
        }

        for ( const item of representationItems ) {

          if ( item instanceof placement ) {
            continue
          }

          this.extractRepresentationItem( item, shapeDefinition.localID )

          const styledItemLocalID = this.materials.styledItemMap.get(item.localID)

          if ( styledItemLocalID !== void 0 ) {

            const styledItem =
              this.model.getElementByLocalID( styledItemLocalID ) as styled_item

            this.extractStyledItem( styledItem )

          }
        }
      }

      result = ExtractResult.COMPLETE

      const endTime = Date.now()
      const executionTimeInMs = endTime - startTime

      if (logTime) {
        console.log(`Geometry Extraction took ${executionTimeInMs} milliseconds to execute.`)
      }

      return [result, this.scene]
    } finally {
      this.model.elementMemoization = previousMemoizationState
    }
  }
}
