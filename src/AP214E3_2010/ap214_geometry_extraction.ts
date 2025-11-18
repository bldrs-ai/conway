import {
  ConwayGeometry,
  GeometryObject,
  ParamsAxis2Placement3D,
  ParamsCartesianTransformationOperator3D,
  Vector3,
  CurveObject,
  ParamsGetAxis2Placement2D,
  ParamsGetExtrudedAreaSolid,
  ParamsGetBooleanResult,
  BlendMode,
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
  FlattenedPointsResult,
  ParamsAddFaceToGeometrySimple,
  ParamsGetIfcLine,
  ParamsLocalPlacement,
} from '../../dependencies/conway-geom'
import { CanonicalMaterial, ColorRGBA } from '../core/canonical_material'
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { CanonicalProfile } from '../core/canonical_profile'
import { CsgMemoization } from '../core/csg_operations'
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
import { MemoizationCapture, RegressionCaptureState } from '../core/regression_capture_state'
import { ExtractResult } from '../core/shared_constants'
import Logger from '../logging/logger'
import {
  advanced_brep_shape_representation,
  advanced_face,
  annotation_occurrence,
  axis1_placement,
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
  composite_curve_segment,
  conical_surface,
  connected_face_set,
  context_dependent_shape_representation,
  conversion_based_unit,
  curve,
  cylindrical_surface,
  direction,
  draughting_model,
  edge_curve,
  edge_loop,
  ellipse,
  extruded_area_solid,
  face,
  face_based_surface_model,
  faceted_brep,
  fill_area_style_colour,
  geometric_curve_set,
  geometrically_bounded_2d_wireframe_representation,
  geometrically_bounded_wireframe_shape_representation,
  global_unit_assigned_context,
  half_space_solid,
  item_defined_transformation,
  length_measure,
  length_unit,
  line,
  manifold_solid_brep,
  mapped_item,
  mechanical_design_geometric_presentation_area,
  mechanical_design_geometric_presentation_representation,
  over_riding_styled_item,
  parameter_value,
  pcurve,
  placement, plane,
  poly_loop,
  polyline,
  presentation_layer_assignment,
  product,
  ratio_measure,
  rational_b_spline_curve,
  rational_b_spline_surface,
  representation_item,
  representation_relationship_with_transformation,
  seam_curve,
  shape_definition_representation,
  shape_representation,
  shape_representation_relationship,
  shell_based_surface_model,
  si_prefix,
  si_unit,
  spherical_surface,
  styled_item,
  surface,
  surface_curve,
  surface_of_linear_extrusion,
  surface_of_revolution,
  surface_side,
  surface_style_fill_area,
  surface_style_rendering,
  surface_style_usage,
  toroidal_surface,
  trimmed_curve,
  trimming_preference,
  vertex_loop,
  vertex_point,
  view_volume,
} from './AP214E3_2010_gen'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import { AP214MaterialCache } from './ap214_material_cache'
import AP214ModelCurves from './ap214_model_curves'
import { AP214ProductShapeMap } from './ap214_product_shape_map'
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

  private readonly TWO_DIMENSIONS: number = 2
  private readonly THREE_DIMENSIONS: number = 3

  private wasmModule: WasmModule

  public readonly scene: AP214SceneBuilder

  public readonly materials: AP214MaterialCache

  public readonly productShapeMap: AP214ProductShapeMap

 // private readonly 

  private linearScalingFactor: number

  private circleSegments: number = 12

  private paramsGetBooleanResultPool: ObjectPool<ParamsGetBooleanResult> | undefined
  private paramsTransformProfilePool: ObjectPool<ParamsTransformProfile> | undefined
  private paramsGetTriangulatedFaceSetPool:
  ObjectPool<ParamsGetTriangulatedFaceSetGeometry> | undefined

  private paramsGetPolyCurvePool:ObjectPool<ParamsGetPolyCurve> | undefined

  public pointBuffer: FlattenedPointsResult | null = null

  private identity2DNativeMatrix: NativeTransform3x3
  private identity3DNativeMatrix: NativeTransform4x4
  
  private csgMemoization: boolean = true

  private csgDepth: number = 0

  public readonly curves: AP214ModelCurves

  public readonly csgOperations: CsgMemoization

  /**
   * Construct a geometry extraction from an AP214 step model and conway model
   *
   * @param conwayModel
   * @param model
   * @param limitCSGDepth Whether to limit the depth of CSG operations.
   * @param csgDepthLimit The maximum depth for CSG operations when limit CSG depth is used,
   * or the maximum level for CSG memoization if it is not.
   * @param lowMemoryMode Whether to enable low memory mode for geometry extraction.
   */
  constructor(
    private readonly conwayModel: ConwayGeometry,
    public readonly model: AP214StepModel,
    private readonly limitCSGDepth: boolean = true,
    private readonly csgDepthLimit: number = 20,
    private readonly lowMemoryMode: boolean = false ) {

    this.csgMemoization = !this.lowMemoryMode

    this.materials = model.materials
    this.scene = new AP214SceneBuilder(model, conwayModel, this.materials)
    this.productShapeMap = new AP214ProductShapeMap()

    this.linearScalingFactor = 1
    this.wasmModule = conwayModel.wasmModule

    this.identity2DNativeMatrix = this.wasmModule.getIdentity2DMatrix()
    this.identity3DNativeMatrix = this.wasmModule.getIdentity3DMatrix()

    this.initializeMemoryPools()
    this.curves = model.curves
    this.csgOperations = model.csgOperations
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
       
      (new (this.wasmModule.geometryCollectionArray)()) as NativeVectorGeometryCollection

    return nativeVectorGeometryCollection
  }

  /**
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorGlmVec2} - a native std::vector<glm::vec2> from the wasm module
   */
  nativeVectorGlmVec2(initialSize?: number): NativeVectorGlmVec2 {
     
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
     
    const nativeVectorProfile_ = new (this.wasmModule.profileArray)() as NativeVectorProfile

    if (initialSize) {
      // resize has a required second parameter to set default values
      const defaultProfile = new (this.wasmModule.IfcProfile as any)
      nativeVectorProfile_.resize(initialSize, defaultProfile)
    }

    return nativeVectorProfile_
  }

  nativeCurve(): CurveObject {
  
    return new (this.wasmModule.IfcCurve) as CurveObject
  }

  /**
   * Create a native version of a vector curve to parse across the boundary.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorCurve} - a native std::vector<AP214Curve> from the wasm module
   */
  nativeVectorCurve(initialSize?: number): StdVector<CurveObject> {
     
    const nativeVectorCurve_ = new (this.wasmModule.curveArray)() as NativeVectorCurve

    if (initialSize) {
      // resize has a required second parameter to set default values
      const defaultCurve = new (this.wasmModule.IfcCurve as any)
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
       
      (new (this.wasmModule.glmVec3Array)()) as NativeVectorGlmVec3

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorGlmVec3_.resize(initialSize, { x: 0, y: 0, z: 0 })
    }

    return nativeVectorGlmVec3_
  }

  /**
   *
   * @return {NativeVectorGlmVec3} - a native std::vector<glm::vec3> from the wasm module
   */
  nativeVectorVectorGlmdVec3(): StdVector<NativeVectorGlmVec3> {
    const nativeVectorVectorGlmdVec3_ =
       
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
  nativeUintVector(initialSize?: number): NativeUintVector {
    const nativeUintVector_ = (new (this.wasmModule.UintVector)()) as NativeUintVector

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeUintVector_.resize(initialSize, 0)
    }

    return nativeUintVector_
  }

  /**
   * Create a native 32bit size_t vector.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeULongVector} - a native std::vector<size_t> from the wasm module
   */
  nativeULongVector(initialSize?: number): NativeULongVector {
    const nativeULongVector_ = new (this.wasmModule.ULongVector)() as NativeULongVector

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeULongVector_.resize(initialSize, 0)
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
  nativeIndexedPolygonalFaceVector(initialSize?: number): NativeVectorIndexedPolygonalFace {
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

    if (initialSize) {
      // resize has a required second parameter to set default values
      nativeVectorIndexedPolygonalFace.resize(initialSize)
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
   *
   * @param modelId
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


  /**
   * @param array
   * @return {number} Pointer/memory address
   */
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

  /**
   * @param array
   * @return {Uint8Array}
   */
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
      Logger.error(
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
      Logger.error(
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
        Logger.error(
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
        Logger.error(
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

  /**
   * Extract a canonical material from a surface style.
   *
   * @param from The surface style to extract a material from.
   */
  extractSurfaceStyle(from: surface_style_usage) {

    const materials = this.materials

    const material = materials.get(from.localID)

    /* eslint-disable no-magic-numbers */

    const lightGrey = 0.8

    if (material === void 0) {

      const readDoubleSided = from.side === surface_side.BOTH

      const newMaterial: Mutable<CanonicalMaterial> = {
        name: `#${from.expressID}`,
        baseColor: [lightGrey, lightGrey, lightGrey, 1],
        legacyColor: [lightGrey, lightGrey, lightGrey, 1],
        doubleSided: readDoubleSided,
        blend: BlendMode.OPAQUE,
      }

      for (const style of from.style.styles ) {

        try {
          if ( style instanceof surface_style_rendering ) {

            if ( !( style.surface_colour instanceof colour_rgb ) ) {
              continue
            }

            const surfaceColor = extractColorRGBPremultiplied(style.surface_colour, 1)

            newMaterial.baseColor  = surfaceColor
            newMaterial.legacyColor = surfaceColor
            newMaterial.roughness = 1

          } else if ( style instanceof surface_style_fill_area ) {

            const fillAreaStyles = style.fill_area.fill_styles

            const fillAreaColor =
              fillAreaStyles.find(
                ( value => value instanceof fill_area_style_colour ) ) as fill_area_style_colour |
                undefined

            if ( fillAreaColor !== void 0 ) {

              try {
                const fillColor = fillAreaColor.fill_colour

                if ( !(fillColor instanceof colour_rgb ) ) {

                  continue
                }

                const surfaceColor = extractColorRGBPremultiplied(fillColor, 1)

                newMaterial.baseColor   = surfaceColor
                newMaterial.legacyColor = surfaceColor
                newMaterial.roughness   = 1            
              }
              catch ( error ) {
                Logger.warning(
                    `Error extracting fill area style color for expressID: 
                  #${from.expressID} - type: 
                  ${EntityTypesAP214[style.type]} - error: ${error}`)
              }
            }
          }
        } catch ( error ) {
          Logger.warning(
              `Error extracting surface style for expressID: 
            #${from.expressID} - type: 
            ${EntityTypesAP214[style.type]} - error: ${error}`)
        }

        /* TODO - other surface styles */

      }

      const isTransparent = newMaterial.baseColor[3] < 1.0

      newMaterial.metalness ??= 0
      newMaterial.roughness ??= isTransparent ? 0.05 : 0.9
      newMaterial.ior       ??= isTransparent ? 1.52 : 1.4
      newMaterial.doubleSided = isTransparent || newMaterial.doubleSided
      newMaterial.blend       = isTransparent ? BlendMode.BLEND : BlendMode.OPAQUE

      /* eslint-enable no-magic-numbers */

      materials.add(from.localID, newMaterial)
    }

  }


  /**
   * @param from The styled item to extract from
   * @param representationItem
   * @return surafceStyleId or undefined if could not be determined
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

  extractStyledItemWithProcessing(
      from: styled_item,
      owningElementLocalID?: number ): void {

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

    if ( from.item !== null ) {
    
      if ( from.item instanceof mapped_item ) {

        this.extractMappedItem( from.item, owningElementLocalID )

      } else if ( from.item instanceof representation_item ) {

        this.materials.addGeometryMapping( from.item.localID, surfaceStyleID )

        this.extractRepresentationItem( from.item, owningElementLocalID )
      }
    }
  }

  /**
   * @param from Geometry source
   * @param temporary Is the extracted mesh temporary
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
   * @param from Geometry source
   * @param temporary Is this temporary
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
   * @param from Geometry source
   * @param temporary Is this extracted mesh temporary
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
      Logger.error(`Couldn't parse profile, 
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
   * @param parentSense
   * @param isEdge
   * @param trimmingArguments
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
      parentSense:boolean = true,
      isEdge:boolean = false,
      trimmingArguments: TrimmingArguments | undefined = void 0) :
    CurveObject | undefined {

    let stepCurve: CurveObject | undefined

    stepCurve = this.curves.get( from.localID )

    if ( stepCurve !== void 0 ) {
      
      return stepCurve
    }

      // console.log("[extractCurve]: curve express ID: "
    // + from.expressID + " type: " + EntityTypesAP214[from.type])

    if ( from instanceof b_spline_curve ) {
      
      let paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve | undefined
      
      if ( trimmingArguments?.exist ) {
        paramsGetIfcTrimmedCurve = {
          masterRepresentation: trimmingArguments.start?.hasPos ? 0 : 1,
          dimensions: 3,
          senseAgreement: true,
          trim1Cartesian2D: trimmingArguments.start?.pos,
          trim1Cartesian3D: trimmingArguments.start?.pos3D,
          trim1Double: trimmingArguments.start?.param ?? 0,
          trim2Cartesian2D:  trimmingArguments.end?.pos,
          trim2Cartesian3D:  trimmingArguments.end?.pos3D,
          trim2Double:  trimmingArguments.end?.param ?? 0,
          trimExists: true
        }
      }

      stepCurve = this.extractBSplineCurve( from, parentSense, isEdge, paramsGetIfcTrimmedCurve )
    
    } else if ( from instanceof trimmed_curve ) {

      stepCurve = this.extractAP214TrimmedCurve(from, parentSense, isEdge)

    } else if ( from instanceof polyline ) {

      stepCurve = this.extractPolyline(from, parentSense, isEdge)

    } else  if ( from instanceof circle ) {

      let paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve | undefined
      
      if ( trimmingArguments?.exist ) {
        paramsGetIfcTrimmedCurve = {
          masterRepresentation: trimmingArguments.start?.hasPos ? 0 : 1,
          dimensions: 3,
          senseAgreement: true,
          trim1Cartesian2D: trimmingArguments.start?.pos,
          trim1Cartesian3D: trimmingArguments.start?.pos3D,
          trim1Double: trimmingArguments.start?.param ?? 0,
          trim2Cartesian2D:  trimmingArguments.end?.pos,
          trim2Cartesian3D:  trimmingArguments.end?.pos3D,
          trim2Double:  trimmingArguments.end?.param ?? 0,
          trimExists: true
        }
      }

      stepCurve = this.extractAP214Circle(from, isEdge, parentSense, paramsGetIfcTrimmedCurve)

    } else if ( from instanceof ellipse ) {

      let paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve | undefined
      
      if ( trimmingArguments?.exist ) {
        paramsGetIfcTrimmedCurve = {
          masterRepresentation: trimmingArguments.start?.hasPos ? 0 : 1,
          dimensions: 3,
          senseAgreement: true,
          trim1Cartesian2D: trimmingArguments.start?.pos,
          trim1Cartesian3D: trimmingArguments.start?.pos3D,
          trim1Double: trimmingArguments.start?.param ?? 0,
          trim2Cartesian2D:  trimmingArguments.end?.pos,
          trim2Cartesian3D:  trimmingArguments.end?.pos3D,
          trim2Double:  trimmingArguments.end?.param ?? 0,
          trimExists: true
        }
      }

      stepCurve = this.extractAP214Ellipse(from, isEdge, parentSense, paramsGetIfcTrimmedCurve)

    } else if ( from instanceof surface_curve ) {

      stepCurve = this.extractCurve(from.curve_3d, parentSense, isEdge, trimmingArguments)

    } else if ( from instanceof line ) {

      let paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve | undefined
      
      if ( trimmingArguments?.exist ) {
        paramsGetIfcTrimmedCurve = {
          masterRepresentation: ( trimmingArguments.start?.hasPos ) ? 0 : 1,
          dimensions: 3,
          senseAgreement: true,
          trim1Cartesian2D: trimmingArguments.start?.pos,
          trim1Cartesian3D: trimmingArguments.start?.pos3D,
          trim1Double: trimmingArguments.start?.param ?? 0,
          trim2Cartesian2D:  trimmingArguments.end?.pos,
          trim2Cartesian3D:  trimmingArguments.end?.pos3D,
          trim2Double:  trimmingArguments.end?.param ?? 0,
          trimExists: true
        }
      }  

      stepCurve = this.extractLine( from, parentSense, isEdge, paramsGetIfcTrimmedCurve)
 
    } else if ( from instanceof composite_curve ) {

      stepCurve = this.extractCompositeCurve( from, parentSense )

    } else if ( from instanceof composite_curve_segment ) {

      const parentCurve = from.parent_curve
      const sameSense = from.same_sense === parentSense

      stepCurve = this.extractCurve( parentCurve, sameSense, isEdge )

    } else if ( from instanceof pcurve ) {

      const seamCurve = from.findVariant( seam_curve )

      if ( seamCurve !== void 0 ) {

        stepCurve = this.extractCurve( seamCurve.curve_3d, parentSense, isEdge, trimmingArguments )

      } else {

        stepCurve = this.extractPScurve1( from )
      }

    } 
    
    if ( stepCurve === void 0 ) {
 
      Logger.warning(`Unsupported Curve! Type: ${EntityTypesAP214[from.type]}`)
      return
    }

    this.curves.add( from.localID, stepCurve )

    return stepCurve
  }


  /**
   *
   * @param from
   * @param parentSense
   * @param close
   * @return {CurveObject | undefined}
   */
  extractCompositeCurve(from: composite_curve,
      parentSense:boolean = true,
      close:boolean = false,
  ): CurveObject | undefined {
    let compositeCurve: CurveObject | undefined
    for (let i = 0; i < from.segments.length; i++) {
      const parentCurve = from.segments[i].parent_curve
      let currentCurveObject

      const sameSense = from.segments[i].same_sense === parentSense

      if (parentCurve instanceof composite_curve) {
        currentCurveObject = this.extractCompositeCurve(parentCurve, true)
      } else {
        currentCurveObject = this.extractCurve(from.segments[i].parent_curve, true)
      }

      if (currentCurveObject !== undefined) {

        if ( !sameSense ) {

          currentCurveObject = currentCurveObject.clone()
          currentCurveObject.invert()
        }

        if (i === 0) {
          compositeCurve = currentCurveObject
        } else if (from.segments[i].Dim === this.TWO_DIMENSIONS) {
          for (let j = 0; j < currentCurveObject.getPointsSize(); ++j) {
            compositeCurve!.add2d(currentCurveObject.get2d(j))
          }
        } else if (from.segments[i].Dim === this.THREE_DIMENSIONS) {
          for (let j = 0; j < currentCurveObject.getPointsSize(); ++j) {
            compositeCurve!.add3d(currentCurveObject.get3d(j))
          }
        }
      }
    }

    if ( close ) {
      compositeCurve?.add3d( compositeCurve.get3d( 0 ) )
    }

    return compositeCurve
  }  

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractPScurve1( from: pcurve ): CurveObject | undefined {

    const surface = from.basis_surface

    if ( !( surface instanceof plane ) ) {
      Logger.error( 'PSCurve not a plane, other curves unsupported')
      return
    }

    const point = surface.position.location.coordinates

    const dim   = point.length

    const pointsFlattened = new Float32Array( dim * 1 )

    pointsFlattened[ 0 ] = point[ 0 ]
    pointsFlattened[ 1 ] = point[ 1 ]

     
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
   * @param trimmingArguments
   * @param parentSense
   * @param isEdge
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined} The curve object for the line.
   */
  extractLine(
      from: line,
      parentSense:boolean = true,
      isEdge:boolean = false,
      parametersTrimmedCurve?: ParamsGetIfcTrimmedCurve ): CurveObject | undefined {

    parametersTrimmedCurve ??= {
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
    }
    // This potentially mutates a paremeter, but the trimming parameters should always be
    // specific to this single curve. - CS
    parametersTrimmedCurve.senseAgreement = parametersTrimmedCurve.senseAgreement === parentSense

    let cartesianPoint2D: Vector2 = { x: 0, y: 0 }
    let cartesianPoint3D: Vector3 = { x: 0, y: 0, z: 0 }
    let vectorOrientation: Vector3 = { x: 0, y: 0, z: 0 }

    const cartesianPointArray =  from.pnt.coordinates

    if ( cartesianPointArray.length === this.TWO_DIMENSIONS) {
      cartesianPoint2D = {
        x: cartesianPointArray[0],
        y: cartesianPointArray[1],
      }
    } else if ( cartesianPointArray.length === this.THREE_DIMENSIONS) {
      cartesianPoint3D = {
        x: cartesianPointArray[0],
        y: cartesianPointArray[1],
        z: cartesianPointArray[2],
      }
    }

    const vectorDirectionRatios = from.dir.orientation.direction_ratios

    vectorOrientation = {
      x: vectorDirectionRatios[0],
      y: vectorDirectionRatios[1],
      z: vectorDirectionRatios[2] ?? 0,
    }

    const vectorMagnitude = from.dir.magnitude

    const parametersIfcLine: ParamsGetIfcLine = {
      dimensions: vectorDirectionRatios.length,
      cartesianPoint2D: cartesianPoint2D,
      cartesianPoint3D: cartesianPoint3D,
      vectorOrientation: vectorOrientation,
      vectorMagnitude: vectorMagnitude,
      isEdge: isEdge,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
    }

    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    const curve: CurveObject = this.conwayModel.getIfcLine(parametersIfcLine)

    return curve
  }

  /**
   * Exctact a BSpline Curve
   *
   * @param from The bspline curve, potentially with knots/rational.
   * @param parentSense
   * @param isEdge
   * @param parametersTrimmedCurve
   * @return {CurveObject} The constructed curve object.
   */
  extractBSplineCurve(
    from: b_spline_curve,
    parentSense: boolean = true,
    isEdge: boolean = false,
    parametersTrimmedCurve: ParamsGetIfcTrimmedCurve = {
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
  } ): CurveObject {

    // degree is NOT dimensions (NC)
    let dimensions: number = 3

    if (from.control_points_list.length > 0) {

      dimensions = from.control_points_list[0].coordinates.length
    }

    parametersTrimmedCurve.senseAgreement = parentSense === parametersTrimmedCurve.senseAgreement

    const params: ParamsGetBSplineCurve = {
      dimensions: dimensions,
      degree: from.degree,
      points2: this.nativeVectorGlmdVec2(),
      points3: this.nativeVectorGlmdVec3(),
      knots: this.conwayModel.nativeVectorDouble(),
      weights: this.conwayModel.nativeVectorDouble(),
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
      isEdge: isEdge,
    }
    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    if (dimensions === 2) {

      const outputPoints = params.points2

      for (const point of from.control_points_list) {

        const coords = point.coordinates

        outputPoints.push_back({ x: coords[0], y: coords[1] })
      }

    } else {

      const outputPoints = params.points3

      for ( const point of from.control_points_list ) {
         
        if (point.coordinates.length !== 3) {
          continue
        }

        const coords = point.coordinates

        // console.log(`express ID: ${from.expressID} -  coords: ${coords}`)

        outputPoints.push_back({ x: coords[0], y: coords[1], z: coords[2] })
      }

    }

    const rational = from.findVariant( rational_b_spline_curve )
    const knotsCurve = from.findVariant( b_spline_curve_with_knots )

    // TODO - handle multiple inheritence case - CS

    if ( rational !== void 0 ) {

      const outputWeights = params.weights

      for (const weight of rational.weights_data) {

        outputWeights.push_back( weight )
      }

    } else  {
      // create default weights
      const outputWeights = params.weights

      if ( dimensions === this.TWO_DIMENSIONS ) {
        for (let weightIndex = 0; weightIndex < params.points2.size(); ++weightIndex) {
          outputWeights.push_back(1.0)
        }
      } else if ( dimensions === this.THREE_DIMENSIONS ) {
        for (let weightIndex = 0; weightIndex < params.points3.size(); ++weightIndex) {
          outputWeights.push_back(1.0)
        }
      }
    }

    if ( knotsCurve !== void 0 ) {

      const knots = params.knots
      const knotsValues = knotsCurve.knots
      const knotMultiplicities = knotsCurve.knot_multiplicities

      for (let knotIndex = 0; knotIndex < knotsValues.length; ++knotIndex) {
        const knot = knotsValues[knotIndex]

        for (let knotMultiplicityIndex = 0;
          knotMultiplicityIndex < knotMultiplicities[knotIndex]; ++knotMultiplicityIndex) {
          knots.push_back(knot)
        }
      }

    } else {

      if (dimensions === this.TWO_DIMENSIONS) {
        // build default knots
        const outputKnots = params.knots
        for (let pointIndex = 0;
          pointIndex < params.points2.size() + params.degree + 1; ++pointIndex) {
          outputKnots.push_back(pointIndex)
        }

      } else if (dimensions === this.THREE_DIMENSIONS) {
        // build default knots
        const outputKnots = params.knots
        for (let pointIndex = 0;
          pointIndex < params.points3.size() + params.degree + 1; ++pointIndex) {
          outputKnots.push_back(pointIndex)
        }
      }
    }
       
    return this.conwayModel.getBSplineCurve(params)
  }


  /**
   *
   * @param from
   * @param isEdge
   * @param parentSense
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined}
   */
  extractAP214Circle(
    from: circle, 
    isEdge: boolean = false,
    parentSense:boolean = true,
    parametersTrimmedCurve: ParamsGetIfcTrimmedCurve = {
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

    let axis2Placement2D: NativeTransform3x3 = this.identity2DNativeMatrix // glmdmat3
    let axis2Placement3D: NativeTransform4x4 = this.identity3DNativeMatrix // glmdmat4
    let dimension: number

    // This potentially mutates a paremeter, but the trimming parameters should always be
    // specific to this single curve. - CS
    parametersTrimmedCurve.senseAgreement = parentSense === parametersTrimmedCurve.senseAgreement

    if ( from.position instanceof axis2_placement_2d ) {

      axis2Placement2D = this.extractAxis2Placement2D(from.position)
      dimension = this.TWO_DIMENSIONS

    } else {

      axis2Placement3D = this.conwayModel.getAxis2Placement3D(
          this.extractAxis2Placement3D(from.position, from.localID, true) )
      dimension = this.THREE_DIMENSIONS
    }

    const radius = from.radius

    const parametersCircle: ParamsGetIfcCircle = {
      dimensions: dimension,
      axis2Placement2D: axis2Placement2D,
      axis2Placement3D: axis2Placement3D,
      radius: radius,
      radius2: radius,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
      isEdge: isEdge
    }   
    
    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    return this.conwayModel.getAP214Circle(parametersCircle)
  }

  

  /**
   *
   * @param from
   * @param isEdge
   * @param parentSense
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined}
   */
  extractAP214Ellipse(
    from: ellipse, 
    isEdge: boolean = false,
    parentSense:boolean = true,
    parametersTrimmedCurve: ParamsGetIfcTrimmedCurve = {
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

    let axis2Placement2D: NativeTransform3x3 = this.identity2DNativeMatrix // glmdmat3
    let axis2Placement3D: NativeTransform4x4 = this.identity3DNativeMatrix // glmdmat4
    let dimension: number

    // This potentially mutates a paremeter, but the trimming parameters should always be
    // specific to this single curve. - CS
    parametersTrimmedCurve.senseAgreement = parametersTrimmedCurve.senseAgreement === parentSense

    if ( from.position instanceof axis2_placement_2d ) {

      axis2Placement2D = this.extractAxis2Placement2D(from.position)
      dimension = this.TWO_DIMENSIONS

    } else {

      axis2Placement3D = this.conwayModel.getAxis2Placement3D(
          this.extractAxis2Placement3D(from.position, from.localID, true) )
      dimension = this.THREE_DIMENSIONS
    }

    const radius0 = from.semi_axis_1
    const radius1 = from.semi_axis_2

    const parametersCircle: ParamsGetIfcCircle = {
      dimensions: dimension,
      axis2Placement2D: axis2Placement2D,
      axis2Placement3D: axis2Placement3D,
      radius: radius0,
      radius2: radius1,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
      isEdge: isEdge
    }   
    
    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    return this.conwayModel.getAP214Circle(parametersCircle)
  }

  /**
   *
   * @param from
   * @param parentSense
   * @param isEdge
   * @return {CurveObject | undefined}
   */
  extractAP214TrimmedCurve(
    from: trimmed_curve,
    parentSense:boolean = true,
    isEdge:boolean = false ): CurveObject | undefined {

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

        const trim2 = from.trim_2[ trimIndex ]

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

    const basisCurve = from.basis_curve

    if ( basisCurve instanceof circle) {

      const curveObject = this.extractAP214Circle( basisCurve, isEdge, parentSense, paramsGetAP214TrimmedCurve )

      if (curveObject !== void 0) {
        return curveObject
      }

    } else if ( basisCurve instanceof line ) {

      const curveObject = this.extractLine( basisCurve, parentSense, isEdge, paramsGetAP214TrimmedCurve )

      if (curveObject !== void 0) {
        return curveObject
      }
    } else if ( basisCurve instanceof ellipse ) {
      const curveObject =
        this.extractAP214Ellipse(basisCurve, isEdge, parentSense, paramsGetAP214TrimmedCurve)

      if (curveObject !== void 0) {
        return curveObject
      }
    } else {
      Logger.warning(`Unsupported basis curve type: ${  EntityTypesAP214[basisCurve.type]}`)
    }

    return void 0
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
   * @param parentSense
   * @param isEdge
   * @return {CurveObject | undefined }
   */
  extractPolyline(
    from: polyline,
    parentSense: boolean = true,
    isEdge: boolean = false ): CurveObject | undefined {

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
      parameters.senseAgreement = parentSense
      parameters.isEdge = isEdge

      const curve_ = this.conwayModel.getPolyCurve(parameters)

      this.paramsGetPolyCurvePool!.release(parameters)

      this.wasmModule._free(pointsPtr)

      return curve_
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
   * @param owningElementLocalID
   * @param parents The parent mapped items, if any.
   */
  extractMappedItem(
      from: mapped_item,
      owningElementLocalID?: number,
      parents: mapped_item[] | undefined = void 0 ) {

    const representationMap = from.mapping_source
    const mappingTarget = from.mapping_target
    const mappingOrigin = representationMap.mapping_origin

    let pushedTransforms = 0

    const pushTransform = ( nativeTransform: NativeTransform4x4 ) => {

      this.scene.addTransform(
          from.localID,
          nativeTransform.getValues(),
          nativeTransform,
          true )

      ++pushedTransforms
    }

    if ( mappingTarget instanceof cartesian_transformation_operator_3d ) {

      const nativeCartesianTransform =
        this.extractCartesianTransformOperator3D(mappingTarget)
      const originTransform =
        mappingOrigin instanceof placement ?
          this.extractRawPlacement( mappingOrigin ) : void 0

      if ( originTransform !== void 0 ) {

        const originInverse = originTransform.invert()
        const combinedTransform = this.conwayModel
          .multiplyNativeMatrices( nativeCartesianTransform, originInverse )

        pushTransform( combinedTransform )

      } else {

        pushTransform( nativeCartesianTransform )
      }

    } else if ( mappingTarget instanceof placement ) {

      const targetTransform = this.extractRawPlacement( mappingTarget )
      const originTransform =
        mappingOrigin instanceof placement ?
          this.extractRawPlacement( mappingOrigin ) : void 0

      if ( targetTransform !== void 0 ) {

        const localPlacementParameters: ParamsLocalPlacement = {
          useRelPlacement: true,
          axis2Placement: originTransform?.invert() ?? this.identity3DNativeMatrix,
          relPlacement: targetTransform,
        }

        const transform =
          this.conwayModel.getLocalPlacement( localPlacementParameters )

        pushTransform( transform )
      }
    }

    for ( const representationItem of representationMap.mapped_representation.items ) {

      if ( representationItem instanceof mapped_item ) {

        // if this is a mapped item, we need to extract it recursively
        // and add the transform to the scene
        this.extractMappedItem(
          representationItem,
          owningElementLocalID,
          parents !== void 0 ? [from, ...parents] : [ from ] )

      } else {

        this.extractRepresentationItem( representationItem, owningElementLocalID )

        const styledItemLocalID_ = this.materials.styledItemMap.get( representationItem.localID )

        let materialOverrideID: number | undefined = void 0

        if ( styledItemLocalID_ !== void 0 ) {

          const styledItem_ = this.model.getElementByLocalID(styledItemLocalID_) as styled_item
          this.extractStyledItem(styledItem_)

        } else {

          // get material from parent
          let styledItemParentLocalID = this.materials.styledItemMap.get( from.localID )
          let styleParent = from

          if ( parents !== void 0 ) {
            for ( const parent of parents ) {
              if ( styledItemParentLocalID !== void 0 ) {
                break
              }

              styledItemParentLocalID = this.materials.styledItemMap.get( parent.localID )
              styleParent = parent
            }
          }

          if ( styledItemParentLocalID !== void 0 ) {

            const styledItemParent =
              this.model.getElementByLocalID(styledItemParentLocalID) as styled_item

            this.extractStyledItem( styledItemParent, representationItem )
            materialOverrideID = styleParent.localID
          }
        }

        this.scene.addGeometry(
          representationItem.localID,
          owningElementLocalID,
          materialOverrideID )
      }
    }

    for ( ; pushedTransforms > 0; --pushedTransforms ) {

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
   * @param owningElementLocalID
   * @param isMappedItem Whether this is a mapped item.
   */
  extractRepresentationItem(
      from: representation_item,
      owningElementLocalID?: number,
      isMappedItem: boolean = false) {

    if (
      from instanceof polyline ||
      from instanceof draughting_model || 
      from instanceof geometrically_bounded_2d_wireframe_representation ||
      from instanceof annotation_occurrence ||
      from instanceof presentation_layer_assignment ||
      from instanceof view_volume ||
      from instanceof geometric_curve_set ||
      from instanceof placement ||
      from instanceof advanced_face ||
      from instanceof face ||
      from instanceof cartesian_point ) {
      
      return // skip these types, not 3D geometry or top level types

    }

    const foundGeometry = this.model.geometry.getByLocalID(from.localID)

    if ( foundGeometry !== void 0 ) {

      if ( foundGeometry.temporary ) {

        foundGeometry.temporary = false
      }

      if ( !isMappedItem ) {

        this.scene.addGeometry(from.localID, owningElementLocalID)
      }

      return
    }

    if ( from instanceof mapped_item ) {

      return

    } else if ( from instanceof boolean_result ) {

      // also handles AP214BooleanClippingResult
      this.extractBooleanResult( from )

    } else if ( from instanceof extruded_area_solid ) {

      this.extractExtrudedAreaSolid(from, false)

    } else if ( from instanceof half_space_solid ) {

      this.extractHalfspaceSolid( from, false )

    } else if ( from instanceof faceted_brep ) {

      this.extractAP214FacetedBrep(from, false)

    } else if ( from instanceof shell_based_surface_model ) {

      this.extractAP214ShellBasedSurfaceModel(from)

    } else if ( from instanceof face_based_surface_model ) {

      this.extractAP214FaceBasedSurfaceModel(from)

    } else if ( from instanceof manifold_solid_brep ) {

      this.extractManifoldSolidBrep(from)

    } else  {

      Logger.warning( `Unsupported type: ${EntityTypesAP214[from.type]} ` +
      `expressID: ${from.expressID}`)
    }
    
    if ( !isMappedItem) {
      this.scene.addGeometry( from.localID, owningElementLocalID )
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
   * @param parentLocalID parent element local ID
   */
  extractConnectedFaceSets(
      from: connected_face_set[],
      parentLocalID: number) {

    let geometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

    for (let faceSetIndex = 0; faceSetIndex < from.length; ++faceSetIndex) {
      const faceSet: connected_face_set = from[faceSetIndex]

      geometry = this.extractFaces( faceSet.cfs_faces, parentLocalID, geometry )
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
   */
  extractAP214FaceBasedSurfaceModel(from: face_based_surface_model) {
    const fbsmFaces = from.fbsm_faces

    this.extractConnectedFaceSets(fbsmFaces, from.localID)
  }

  /**
   *
   * @param from
   * @param temporary
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
   * @param owningElementLocalID
   */
  extractAP214ShellBasedSurfaceModel(
      from: shell_based_surface_model ) {
    const sbsmBoundary = from.sbsm_boundary
    
    let geometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

    for ( const currentBoundary of sbsmBoundary ) {
      const faces = currentBoundary.cfs_faces

      geometry = this.extractFaces(faces, from.localID, geometry, false )
    }
    
    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: from.localID,
      model: this.model,
      temporary: false,
    }

    this.model.geometry.add(canonicalMesh)
  }

  /**
   *
   * @param from
   * @param parentLocalID
   * @param geometry_
   * @param temporary
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

      try {
        if ( face_ instanceof advanced_face ) {

          this.extractAdvancedFace( face_, geometry_, parentLocalID )

        } else {

          this.extractFace( face_, geometry_ )
        }
      } catch (error) {

        if ( error instanceof Error ) {
          Logger.error(
            `Error extracting face ${EntityTypesAP214[face_.type]} - ${
              error.message}\t\n${error.stack} - expressID: #${face_.expressID}`)
        } else {
          Logger.error(
            `Error extracting face ${EntityTypesAP214[face_.type]} - ${
              error} - expressID: #${face_.expressID}`)
        }
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
   * @param to The surface to extract to
   * @param start
   * @param end
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

    to.resize( from.length, this.conwayModel.nativeVectorDouble() )

    for (let where = 0, end = from.length; where < end; ++where) {

      this.extractToDoubleVector( from[ where ], to.get( where ) )
    }
  }


  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface} The extracted surface
   */
  extractBSplineSurface(
      from: b_spline_surface ): BSplineSurface {

    const result: BSplineSurface = {
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

    this.extractPointListList3D( from.control_points_list, result.controlPoints )

    const knots = from.findVariant( b_spline_surface_with_knots )
    const rational = from.findVariant( rational_b_spline_surface )

    if ( rational !== void 0 ) {
      this.extractToDoubleVectorVector( rational.weights_data, result.weightPoints )
    }

    if ( knots !== void 0 ) {
        
      this.extractToDoubleVector( knots.u_multiplicities, result.uMultiplicity)
      this.extractToDoubleVector( knots.v_multiplicities, result.vMultiplicity)
      this.extractToDoubleVector( knots.u_knots, result.uKnots)
      this.extractToDoubleVector( knots.v_knots, result.vKnots)
    }

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
   * Extract an advanced (NURBS) b-rep face.
   *
   * @param from
   * @param geometry
   * @param parentLocalID
   */
  extractAdvancedFace(from: advanced_face, geometry: GeometryObject, parentLocalID?: number) {

    const bounds = from.bounds
    const previousFaceGeometry = this.model.geometry.getByLocalID(from.localID)
    
    if ( previousFaceGeometry !== void 0  ) {
    
      previousFaceGeometry.temporary = false
      return
    }

    if ( from.bounds.length === 0 ) {
    
      return
    }
    
   const conwayModel = this.conwayModel

   const bound3DVector = this.nativeBound3DVector()

   for ( const bound of bounds ) {

      let vec3Array: StdVector< Vector3 >

      const innerBound       = bound.bound
      const nativeEdgeCurves = this.nativeVectorCurve()

      if ( innerBound instanceof vertex_loop ) {

        vec3Array = this.nativeVectorGlmdVec3()

        const loopVertex = innerBound.loop_vertex

        if ( loopVertex instanceof vertex_point ) {

          const vertexPoint = loopVertex.vertex_geometry
          
          if ( vertexPoint instanceof cartesian_point && vertexPoint.coordinates.length === 3 ) {
        
            const coords = vertexPoint.coordinates
            
            vec3Array.push_back({
              x: coords[0],
              y: coords[1],
              z: coords[2],
            })
          }
        }
        
      } else if ( innerBound instanceof poly_loop ) {

       const coordParseBuffer = conwayModel.nativeParseBuffer()

        if ( !innerBound.extractParseBuffer(
            0, 0, 0, coordParseBuffer, this.wasmModule, true ) ) {

          coordParseBuffer.resize( 0 )
        }

        vec3Array = this.wasmModule.parseVertexVector( coordParseBuffer )

        conwayModel.freeParseBuffer( coordParseBuffer )

      }  else if ( innerBound instanceof edge_loop ) {

        vec3Array = this.nativeVectorGlmdVec3()
        
        for ( const edge of innerBound.edge_list ) {

          const edgeElement = edge.edge_element

          if ( edgeElement instanceof edge_curve ) {

            const edgeCurve = edgeElement.edge_geometry

            //Logger.info("curve type: " + EntityTypesAP214[edgeCurve.type] +
            //  " express ID: " + edgeCurve.expressID)

            const edgeStart = edge.edge_element.edge_start
            const edgeEnd   = edge.edge_element.edge_end

            let trimmingStart: TrimmingSelect | undefined
            let trimmingEnd: TrimmingSelect | undefined

            if ( edgeStart instanceof vertex_point ) {

              const startPoint = edgeStart.vertex_geometry

              if ( startPoint instanceof cartesian_point && startPoint.coordinates.length === 3 ) {

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

            if ( edgeEnd instanceof vertex_point ) {

              const endPoint = edgeEnd.vertex_geometry
                
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

            let curve = this.extractCurve( edgeCurve, true, true, trimmingArguments )
            
            if (curve !== void 0) {

              if ( !edge.orientation ) {
                // reverse curve
                // Logger.info("edge orientation == true, inverting curve")
                curve = curve.clone()

                curve.invert()
              }

              nativeEdgeCurves.push_back(curve)

            } else {
              Logger.error(`curve === undefined, type: ${EntityTypesAP214[edgeCurve.type]}`)
            }

          } else {

            let start = edge.edge_start
            let end = edge.edge_end

            if ( edge.orientation ) {

              [start, end] = [end, start]
            }

           // console.log( `edge start: ${start.expressID}, end: ${end.expressID}`)

            const curve = this.nativeCurve()

            if (start instanceof vertex_point) {

              const startPoint = start.vertex_geometry
                
              if (startPoint instanceof cartesian_point && startPoint.coordinates.length === 3) {

                const startCoords = startPoint.coordinates

                curve.add3d( {
                  x: startCoords[0],
                  y: startCoords[1],
                  z: startCoords[2],
                })
              }
            }

            if (end instanceof vertex_point) {

              const endPoint = end.vertex_geometry
                
              if (endPoint instanceof cartesian_point && endPoint.coordinates.length === 3) {

                const endCoords = endPoint.coordinates

                curve.add3d( {
                  x: endCoords[0],
                  y: endCoords[1],
                  z: endCoords[2],
                })
              }
            }

            nativeEdgeCurves.push_back(curve)
          }
        }
      } else {
          Logger.warning(`Unsupported bound ${bound.bound}`)
          return
      }

      const parameters: ParamsGetLoop = {
        points: vec3Array,
        edges: nativeEdgeCurves,
      }
     
      // Logger.info("isEdgeLoop: " + (isEdgeLoop) ? "TRUE" : "FALSE")
      const curve: CurveObject = this.conwayModel.getLoop(parameters)

      // create bound vector
      const parametersCreateBounds3D: ParamsCreateBound3D = {
        curve: curve,
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
    
    this.extractSurface(surface, nativeSurface)

    nativeSurface.sameSense = from.same_sense

    const parameters: ParamsAddFaceToGeometry = {
      boundsArray: bound3DVector,
      advancedBrep: true,
      surface: nativeSurface,
      scaling: this.getLinearScalingFactor(),
    }

    const styledItemLocalID = this.materials.styledItemMap.get(from.localID)

    if ( styledItemLocalID !== void 0 ) {

      const styledItem =
        this.model.getElementByLocalID( styledItemLocalID ) as styled_item

      this.extractStyledItem( styledItem, from )

      const faceGeometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

      this.conwayModel.addFaceToGeometry(parameters, faceGeometry)
 
      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: faceGeometry,
        localID: from.localID,
        model: this.model
      }

      this.model.geometry.add( canonicalMesh, parentLocalID )

    } else {

      this.conwayModel.addFaceToGeometry(parameters, geometry)
    }
 
    nativeSurface.delete()
    bound3DVector.delete()
  }


  /**
   * Extract a surface
   *
   * @param from
   * @param nativeSurface
   */
  extractSurface( from: surface, nativeSurface:SurfaceObject) {
      
    if ( from instanceof plane ) {

      nativeSurface.transformation = this.extractPlane(from)

    } else if ( from instanceof b_spline_surface ) {

      nativeSurface.bspline = this.extractBSplineSurface(from)

      if (!nativeSurface.bspline.active) {
        return
      }

    } else if ( from instanceof cylindrical_surface ) {

      this.extractCylindricalSurface( from, nativeSurface )

      if ( !nativeSurface.cylinder.active ) {
        return
      }

    } else if ( from instanceof spherical_surface ) {
      
      this.extractSphericalSurface( from, nativeSurface )

      if ( !nativeSurface.sphere.active ) {
        return
      }

    } else if ( from instanceof toroidal_surface ) {
      
      this.extractToroidalSurface( from, nativeSurface )

      if ( !nativeSurface.torus.active ) {
        return
      }

    } else if ( from instanceof conical_surface ) {

      this.extractConicalSurface( from, nativeSurface )

      if ( !nativeSurface.cone.active ) {
        return
      }

    } else if ( from instanceof surface_of_revolution ) {

      this.extractSurfaceOfRevolution( from, nativeSurface )

      if ( !nativeSurface.revolution.active ) {
        return
      }

    } else if ( from instanceof surface_of_linear_extrusion ) {

      this.extractSurfaceOfLinearExtrusion( from, nativeSurface )

      if (!nativeSurface.extrusion.active) {
        return
      }

    } else {

      Logger.warning(`Unknown surface express id: ${from}, type: ${EntityTypesAP214[from.type]}`)
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

      Logger.warning('Couldn\'t get curve profile for linear extrusion surface')
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
      holes: this.nativeVectorCurve(),
      isConvex: false,
      isComposite: false,
      profiles: this.nativeVectorProfile(),
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
   * Extract a cylindrical surface.
   *
   * @param from The AP214 object to extract from.
   * @param nativeSurface The native surface representation.
   */
  extractSphericalSurface(from: spherical_surface, nativeSurface: SurfaceObject) {

    const location = from.position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    nativeSurface.transformation = this.conwayModel.getAxis2Placement3D(transform)
    nativeSurface.sphere = { active: true, radius: from.radius }
  }

  
  /**
   * Extract a cylindrical surface.
   *
   * @param from The AP214 object to extract from.
   * @param nativeSurface The native surface representation.
   */
  extractConicalSurface(from: conical_surface, nativeSurface: SurfaceObject) {

    const location = from.position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    nativeSurface.transformation = this.conwayModel.getAxis2Placement3D(transform)
    nativeSurface.cone = { active: true, radius: from.radius, semiAngle: from.semi_angle }
  }

  /**
   * Extract a cylindrical surface.
   *
   * @param from The AP214 object to extract from.
   * @param nativeSurface The native surface representation.
   */
  extractToroidalSurface(from: toroidal_surface, nativeSurface: SurfaceObject) {

    const location = from.position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    nativeSurface.transformation = this.conwayModel.getAxis2Placement3D(transform)
    nativeSurface.torus = {
      active: true,
      majorRadius: from.major_radius,
      minorRadius: from.minor_radius }
  }


  /**
   * Flatten the points into WASM memory (skipping consecutive duplicates).
   * Reuses an existing WASM buffer if provided and large enough.
   *
   * @param points - Array of IfcCartesianPoint
   * @param dimensions - Number of coordinates per point (e.g. 3 for x,y,z)
   * @param existingPtr - (Optional) Pointer to an existing WASM buffer
   * @param existingCapacity - (Optional) Capacity of that buffer in Float64 elements
   * @return {FlattenedPointsResult} pointer, length used, total capacity
   */
  flattenCartesianPointsToWasmFiltered(
      points: cartesian_point[],
      dimensions: number,
      existingPtr?: number,
      existingCapacity?: number,
  ): FlattenedPointsResult {

    // The maximum we might need if we do NOT skip duplicates
    const maxPossibleFloats = points.length * dimensions
    const bytesPerElement = 8 // Float64

    // 1) Allocate or reuse memory in WASM
    let pointer: number = existingPtr ?? 0
    let capacity: number = existingCapacity ?? 0

    // If we have no existing buffer OR it's too small, allocate a new one
    if (!pointer || capacity < maxPossibleFloats) {
    // Free the old buffer if it exists and is too small
      if (pointer) {
        this.wasmModule._free(pointer)
      }

      const numBytes = maxPossibleFloats * bytesPerElement

      pointer = this.wasmModule._malloc(numBytes)
      capacity = maxPossibleFloats
    }

    // 2) Create a Float64Array view into WASM memory
    // We only need to create a subarray up to the capacity
    const wasmFloat64View = this.wasmModule.HEAPF64.subarray(
        pointer / bytesPerElement,
         
        pointer / bytesPerElement + capacity,
    )

    // 3) Single pass to skip consecutive duplicates, fill up the wasm array
    let offset = 0
    let prevLocalID = -1
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (i === 0 || point.localID !== prevLocalID) {
      // Copy 'dimensions' values for the current point
        wasmFloat64View.set( point.coordinates, offset )
        offset += dimensions
        prevLocalID = point.localID
      }
    }

    // 4) Return the pointer, the actual usage, and the capacity
    return {
      pointer,
      length: offset,  // how many Float64 values were used
      capacity,
    }
  }

  /**
   *
   * @param from
   * @param geometry
   */
  extractFace(from: face, geometry: GeometryObject ) {

    const bounds = from.bounds

     if ( bounds.length > 0 ) {

      const bound3DVector = this.nativeBound3DVector()

      // let pointsPtrs:any[]

      const bounds = from.bounds

      for (let boundIndex = 0; boundIndex < bounds.length; ++boundIndex) {
        
        const bound = from.bounds[ boundIndex ]
        const innerBound = bound.bound

        if ( innerBound instanceof poly_loop ) {

          // Attempt to reuse the pointer/capacity from `pointBuffer`
          const result = this.flattenCartesianPointsToWasmFiltered(
              innerBound.polygon,
              this.THREE_DIMENSIONS,
              this.pointBuffer?.pointer,
              this.pointBuffer?.capacity,
          )

          // Now `result.pointer` is your up-to-date pointer (maybe a new allocation).
          // `result.length` is how many Float64 coords are valid.
          // `result.capacity` is how many Float64 coords that pointer can hold.
           
           
          const { pointer, length } = result

          // Use them in your WASM call
          const bound3D: Bound3DObject = this.wasmModule.createSimpleBound3D(
            pointer,
            length,
            bound.orientation,
            bound.type === EntityTypesAP214.FACE_OUTER_BOUND ? 0 : 1,
          )

          // Push your result somewhere
          bound3DVector.push_back(bound3D)

          // Save the buffer for reuse in the next iteration
          this.pointBuffer = result
        }
      }

      // add face to geometry
      const parameters: ParamsAddFaceToGeometrySimple = {
        boundsArray: bound3DVector,
        scaling: this.getLinearScalingFactor(),
      }

      this.conwayModel.addFaceToGeometrySimple(parameters, geometry)

      bound3DVector.delete()
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
  extractCartesianTransformOperator2D( from: cartesian_transformation_operator_2d ):
    NativeTransform3x3 {
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
   
  extractAxis1Placement3D(
    from: axis1_placement,
    parentLocalId: number,
    extractOnly: true): ParamsAxis1Placement3D
   
  extractAxis1Placement3D(
      from: axis1_placement,
      parentLocalId: number,
      extractOnly: boolean = false): void | ParamsAxis1Placement3D {

    if (from === null) {
      return
    }

    // if ( !extractOnly ) {
    //   const result = this.scene.getTransform(parentLocalId)

    //   if (result !== void 0) {

    //     this.scene.pushTransform(result)

    //     return
    //   }
    // }

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
        axis1PlacementTransform,
        true)
  }

  /**
   * Extract a placement, adding it to the scene.
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @return {void}
   */
  extractAxis2Placement3D(from: axis2_placement_3d, parentLocalId: number, extractOnly: false, mappedItem?: boolean): AP214SceneTransform
  /**
   * Extract a placement (no memoization/scene creation)
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @param extractOnly {true} Only extract, don't memoize and add to the scene
   * @return {ParamsAxis2Placement3D} The extracted placement.
   */
   
  extractAxis2Placement3D(
    from: axis2_placement_3d,
    parentLocalId: number,
    extractOnly: true,
    mappedItem?: boolean): ParamsAxis2Placement3D
   
  extractAxis2Placement3D(
    from: axis2_placement_3d,
    parentLocalId: number,
    extractOnly: boolean = false,
    mappedItem: boolean = false): AP214SceneTransform | ParamsAxis2Placement3D | undefined {

    // if ( !mappedItem && !extractOnly ) {
      
    //   const result = this.scene.getTransform(parentLocalId)

    //   if ( result !== void 0 ) {
    //     this.scene.pushTransform(result)

    //     return result
    //   }
    // }

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

    if ( from.ref_direction === null && ( zAxisRef.x === 1 || zAxisRef.x === -1 ) ) {
      xAxisRef.x = 0
      xAxisRef.y = 1
      xAxisRef.z = 0
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

    return this.scene.addTransform(
        parentLocalId,
        axis2PlacementTransform.getValues(),
        axis2PlacementTransform,
        true)
  }


  /**
   *
   * @param from
   * @param mappedItem
   */
  extractPlacement(from: placement, mappedItem: boolean = false ): AP214SceneTransform | undefined {

    // if ( !mappedItem ) {
    //   const result: AP214SceneTransform | undefined =
    //     this.scene.getTransform(from.localID)

    //   if (result !== void 0) {

    //     this.scene.pushTransform(result)
    //     return result
    //   }
    // }

    if (from instanceof axis2_placement_3d) {

      return this.extractAxis2Placement3D(from, from.localID, false, true)

    }

    return
  }

  extractRawPlacement(from: placement ): NativeTransform4x4 | undefined {

    if (from instanceof axis2_placement_3d) {

      const parameters = this.extractAxis2Placement3D(from, from.localID, true )

      return this.conwayModel.getAxis2Placement3D(parameters)
    }

    return
  }

  /**
   *
   */
  populateStyledItemsMap() {

    const overridingStyledItems = this.model.types(over_riding_styled_item)
    const styledItems = this.model.types(styled_item)
    const styledItemMap = this.materials.styledItemMap

    for ( const styledItem of styledItems ) {

      if ( styledItem instanceof over_riding_styled_item ) {
        continue
      }

      try {
        if ( styledItem.item !== null ) {
          styledItemMap.set( styledItem.item.localID, styledItem.localID )
        }
      } catch (error) {
        Logger.error(`Error populating styled item map for item ${styledItem.localID}: ${error}`)
      }
    }
    
    for ( const overridingStyledItem of overridingStyledItems ) {

      try {
        if ( overridingStyledItem.item !== null ) {
          styledItemMap.set( overridingStyledItem.item.localID, overridingStyledItem.localID )
        }
      } catch (error) {
        Logger.error(`Error populating styled item map for item ${overridingStyledItem.localID}: ${error}`)
      }
    }
  }

  /**
   *
   * @param prefix
   * @return {number | null}
   */
  convertPrefix(prefix?: si_prefix | null): number {
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
        return 1
    }

  }

  convertToMetres( fromUnit: length_unit ): number | undefined {

    const conversionUnit = fromUnit.findVariant( conversion_based_unit )

    if ( conversionUnit !== void 0 ) {

      const baseUnit = conversionUnit.conversion_factor.unit_component.findVariant( length_unit )
     
      if ( baseUnit === void 0 ) {
      
        return
      }

      const baseUnitMetres = this.convertToMetres( baseUnit )

      if ( baseUnitMetres === void 0 ) {
      
        return
      }

      const factor = ( conversionUnit.conversion_factor.value_component as length_measure ).Value

      return factor * baseUnitMetres
    }

    const siUnit = fromUnit.findVariant( si_unit )

    if ( siUnit === void 0 ) {

      return
    }

    return this.convertPrefix( siUnit.prefix )
  }

  lengthUnitConversionRatio( fromUnit: length_unit, toUnit: length_unit ): number | undefined {

    const fromFactor = this.convertToMetres( fromUnit )
    const toFactor = this.convertToMetres( toUnit )

    if ( fromFactor === void 0 || toFactor === void 0 ) {

      return
    }


    return fromFactor / toFactor
  }


  /**
   * Extract the geometry data from the AP214
   *
   * @param logTime boolean - print execution time (default no)
   * @return {[ExtractResult, AP214SceneBuilder]} - Enum indicating extraction result
   * + Geometry array
   */
  extractAP214GeometryData(logTime: boolean = false):
    [ExtractResult, AP214SceneBuilder, AP214ProductShapeMap] {

    let result: ExtractResult = ExtractResult.INCOMPLETE

    const startTime = Date.now()

    //  this.extractLinearScalingFactor()
    const previousMemoizationState = this.model.elementMemoization

    // populate relMaterialsMap
    // const relAssociatesMaterials = this.model.types(AP214RelAssociatesMaterial)

    const model = this.model
  
    type MappedSceneNode = {
      children?: [number, number, NativeTransform4x4?][];
      parents?: number;
      thunk?: ( owningLocalID?: number, transform?: NativeTransform4x4 ) => void;
      node?: AP214SceneTransform;
      processed?: boolean;
    }

    const treeMap = new Map<number, MappedSceneNode>()

    const makeThunk = ( representation: shape_representation, owningElementLocalID?: number, mappedTreeNode?: MappedSceneNode ) => {

      return ( owningLocalID?: number, parentTransform?: NativeTransform4x4 ) => {

        owningLocalID ??= owningElementLocalID

        const mappedItem = mappedTreeNode !== void 0 || parentTransform !== void 0 

        const entryTransformDepth = this.scene.stackLength
        const currentParent = this.scene.currentParent

        if ( parentTransform !== void 0 ) {

          this.scene.addTransform(
            representation.localID,
            parentTransform.getValues(),
            parentTransform,
            true )

        } 

        if ( mappedTreeNode?.children !== void 0 ) {

          for ( const [childLocalID, childOwningLocalID, childTransform] of mappedTreeNode.children ) {

            const mappedChild = treeMap.get( childLocalID )!

            const enterChildStackDepth = this.scene.stackLength
            const enterChildParent = this.scene.currentParent

            try {
              mappedChild.thunk!( childOwningLocalID, childTransform )
            } catch ( ex ) {

              if ( ex instanceof Error ) {

                Logger.error( `Error processing child shape_representation: \n\t${ex.name}\n\t${ex.message}\n\texpressID: #${this.model.getExpressIDByLocalID( childLocalID )}` )
              } else {

                Logger.error( `Unknown exception processing child shape_representation (${ex}) expressID: #${this.model.getExpressIDByLocalID( childLocalID )}` )
              }
            }
                
            while ( this.scene.stackLength > enterChildStackDepth ) {
              this.scene.popTransform()
            }

            if( this.scene.stackLength !== enterChildStackDepth || this.scene.currentParent !== enterChildParent ) {
              Logger.error( `Stack length mismatch after processing child shape_representation ${this.scene.currentParent} ${enterChildParent} expressID: #${representation.expressID}` )
            }
          }
        }
                
        for ( const item of representation.items ) {

          try {             

            if ( item instanceof placement ) {
          
              this.extractPlacement( item, mappedItem )
              continue
            }

            if ( item instanceof styled_item ) {

              this.extractStyledItemWithProcessing( item, owningLocalID )
              continue
            }

            if ( item instanceof mapped_item ) {

              this.extractMappedItem( item, owningLocalID )

            } else {

              this.extractRepresentationItem( item, owningLocalID )

              const styledItemLocalID = this.materials.styledItemMap.get(item.localID)

              if ( styledItemLocalID !== void 0 ) {

                const styledItem =
                  model.getElementByLocalID( styledItemLocalID ) as styled_item

                this.extractStyledItem( styledItem, item )
              }
            }
          } catch ( ex ) {

            if (ex instanceof Error) {

                Logger.error( `Error processing representation item: \n\t${ex.name}\n\t${ex.message}\n\texpressID: #${item.expressID}` )

            } else {

                Logger.error(`Unknown exception processing representation item (${ex}) expressID: #${item.expressID}`)
            }
          }
        }

        while ( this.scene.stackLength > entryTransformDepth ) {
          this.scene.popTransform()
        }

        if( this.scene.stackLength !== entryTransformDepth || this.scene.currentParent !== currentParent ) {
          Logger.error( `Stack length mismatch after processing shape_representation  ${this.scene.currentParent} ${currentParent} expressID: #${representation.expressID}` )
        }
      }
    }

    try {

      this.scene.clearParentStack()

      // 256 meg limit for memoization - smaller models get a big
      // win from memoization, but much larger models it uses far too much heap.
       
      const MEMOIZATION_THRESHOLD = 256 * 1024 * 1024

      if ( this.lowMemoryMode || model.bufferBytesize > MEMOIZATION_THRESHOLD ) {
        this.model.elementMemoization = false
      }

      this.populateStyledItemsMap()

      const contextDependentShapeRepresentations = model.types(context_dependent_shape_representation)

      const shapeRepresentationRelationshipsSeen = new Set<number>() 

      for ( const contextDependentShapeRepresentation of 
        contextDependentShapeRepresentations ) {

        const assembly = contextDependentShapeRepresentation.represented_product_relation
        const owningLocalID = assembly.localID

        const shapeRelationship = contextDependentShapeRepresentation.representation_relation

        shapeRepresentationRelationshipsSeen.add( shapeRelationship.localID )

        const sourceShape = shapeRelationship.rep_1
        const targetShape = shapeRelationship.rep_2
        
        const transformInstance = shapeRelationship.findVariant( representation_relationship_with_transformation )
      
        let transform: NativeTransform4x4 | undefined = void 0
        let scaleTransform : NativeTransform4x4 | undefined = void 0

        if( transformInstance !== void 0 ) {

          const transformOperator = transformInstance.transformation_operator

          if( !(transformOperator instanceof item_defined_transformation ) ) {
            continue
          }

          const placement1 = transformOperator.transform_item_1

          if( !(placement1 instanceof placement) ) {
            continue
          }
          
          const placement2 = transformOperator.transform_item_2

          if( !(placement2 instanceof placement) ) {
            continue
          }

          const from = this.extractRawPlacement( placement1 )?.invert() ?? this.identity3DNativeMatrix
          const to = this.extractRawPlacement( placement2 ) ?? this.identity3DNativeMatrix

          const localPlacementParameters: ParamsLocalPlacement = {
            useRelPlacement: true,
            axis2Placement: from,
            relPlacement: to,
          }
    
          transform = this.conwayModel.getLocalPlacement(localPlacementParameters)
        }

        const sourceShapeContext = 
          sourceShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
          find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined
          
        const targetShapeContext =
          targetShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
            find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined

        if ( sourceShapeContext !== void 0 && targetShapeContext !== void 0 ) {

          const scaleRatio = this.lengthUnitConversionRatio( sourceShapeContext, targetShapeContext )

          if ( scaleRatio !== void 0 && scaleRatio !== 1.0 ) {

            scaleTransform = this.identity3DNativeMatrix.uniformScale( scaleRatio ) 
          }
        }

        if ( scaleTransform !== void 0 ) {

          if ( transform !== void 0 ) {
              
            const localPlacementParameters: ParamsLocalPlacement = {
              useRelPlacement: true,
              axis2Placement: transform,
              relPlacement: scaleTransform,
            }
            
            transform = this.conwayModel.getLocalPlacement(localPlacementParameters)

          } else {

            transform = scaleTransform
          }
        }

        const sourceID = sourceShape.localID
        const targetID = targetShape.localID
        let sourceNode = treeMap.get( sourceID )

        if ( sourceNode === void 0 ) {

          sourceNode = { parents: 1 }

          treeMap.set( sourceID, sourceNode )

          sourceNode.thunk = makeThunk( sourceShape, owningLocalID, sourceNode )

        } else {
          sourceNode.parents ??= 0
          ++sourceNode.parents
        }

        let targetNode = treeMap.get( targetID )       

        if ( targetNode === void 0 ) {
          targetNode = { children: [[sourceID, owningLocalID, transform]] }
          treeMap.set( targetID, targetNode )
          
        } else {
          targetNode.children ??= []
          targetNode.children.push( [sourceID, owningLocalID, transform] )
        }
      }

      const shapeRelationships = [...model.types(shape_representation_relationship)]     

      for ( const shapeRelationship of shapeRelationships ) {
      
        if ( shapeRepresentationRelationshipsSeen.has( shapeRelationship.localID ) ) {
        
          continue
        }

        const owningLocalID = shapeRelationship.localID

        shapeRepresentationRelationshipsSeen.add( owningLocalID )

        /* Note, the rep_1 and rep_2 are swapped here compared to the
         * context_dependent_shape_representation case above. This is because
         * in a plain shape_representation_relationship, rep_1 is the
         * source and rep_2 is the target, whereas in
         * context_dependent_shape_representation, the relationship is inverted.
         */
        const sourceShape = shapeRelationship.rep_2
        const targetShape = shapeRelationship.rep_1
        
        const transformInstance = shapeRelationship.findVariant( representation_relationship_with_transformation )
      
        let transform: NativeTransform4x4 | undefined = void 0
        let scaleTransform : NativeTransform4x4 | undefined = void 0

        if ( transformInstance !== void 0 ) {

          const transformOperator = transformInstance.transformation_operator

          if( !(transformOperator instanceof item_defined_transformation ) ) {
            continue
          }

          const placement1 = transformOperator.transform_item_1

          if( !(placement1 instanceof placement) ) {
            continue
          }
          
          const placement2 = transformOperator.transform_item_2

          if( !(placement2 instanceof placement) ) {
            continue
          }

          const from = this.extractRawPlacement( placement1 )?.invert() ?? this.identity3DNativeMatrix
          const to = this.extractRawPlacement( placement2 ) ?? this.identity3DNativeMatrix

          const localPlacementParameters: ParamsLocalPlacement = {
            useRelPlacement: true,
            axis2Placement: from,
            relPlacement: to,
          }
    
          transform = this.conwayModel.getLocalPlacement(localPlacementParameters)
        }        

        const sourceShapeContext = 
          sourceShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
          find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined
          
        const targetShapeContext =
          targetShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
            find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined

        if ( sourceShapeContext !== void 0 && targetShapeContext !== void 0 ) {

          const scaleRatio = this.lengthUnitConversionRatio( sourceShapeContext, targetShapeContext )

          if ( scaleRatio !== void 0 && scaleRatio !== 1.0 ) {

            scaleTransform = this.identity3DNativeMatrix.uniformScale( scaleRatio )
          }
        }

        if ( scaleTransform !== void 0 ) {

          if ( transform !== void 0 ) {
              
            const localPlacementParameters: ParamsLocalPlacement = {
              useRelPlacement: true,
              axis2Placement: transform,
              relPlacement: scaleTransform,
            }
            
            transform = this.conwayModel.getLocalPlacement(localPlacementParameters)

          } else {

            transform = scaleTransform
          }
        }

        const sourceID = sourceShape.localID
        const targetID = targetShape.localID
        let sourceNode = treeMap.get( sourceID )

        if ( sourceNode === void 0 ) {

          sourceNode = { parents: 1 }

          treeMap.set( sourceID, sourceNode )

        } else {
          sourceNode.parents ??= 0
          ++sourceNode.parents
        }

        sourceNode.thunk = makeThunk( sourceShape, owningLocalID, sourceNode )

        let targetNode = treeMap.get( targetID )       

        if ( targetNode === void 0 ) {

          targetNode = { parents: 0, children: [[sourceID, owningLocalID, transform]] }
          treeMap.set( targetID, targetNode )
          
        } else {
          targetNode.children ??= []
          targetNode.children.push( [sourceID, owningLocalID, transform] )
        }        
      }

      const shapeDefinitions = model.types( shape_definition_representation )
      
      for ( const shapeDefinitionRepresentation of shapeDefinitions ) {

        const shapeRepresentation = shapeDefinitionRepresentation.used_representation

        if ( !( shapeRepresentation instanceof shape_representation ) ) {

          continue
        }

        //this.scene.clearParentStack()

        const definition = shapeDefinitionRepresentation.definition
        const owningElementLocalID = definition.localID

        let treeNode = treeMap.get( shapeRepresentation.localID )

        const hasMappedNode = treeNode !== void 0

        if ( treeNode === void 0 ) {

          treeNode = { parents: 0 }
          treeMap.set( shapeRepresentation.localID, treeNode )

        } else {

          treeNode.parents ??= 0
        }

        const mappedTreeNode = treeNode

        const thunk = makeThunk( shapeRepresentation, owningElementLocalID, mappedTreeNode )

        mappedTreeNode.thunk = thunk

        if ( !hasMappedNode ) {

          mappedTreeNode.processed = true
            
          const sourceShapeContext = 
            shapeRepresentation.context_of_items.findVariant( global_unit_assigned_context )?.units?.
            find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined

          let scaleTransform : NativeTransform4x4 | undefined = void 0

          if ( sourceShapeContext !== void 0 ) {

            const sourceUnitInM = ( this.convertToMetres( sourceShapeContext ) ?? 1.0 )

            scaleTransform = this.identity3DNativeMatrix.uniformScale( 1.0 / sourceUnitInM )
          }

          // not an assembly mapped item, just extract the representation
          thunk( void 0, scaleTransform )
          continue

        }
      }

      const shapeRepresentations = model.types(
        shape_representation,
        advanced_brep_shape_representation,
        geometrically_bounded_wireframe_shape_representation)

      for ( const shapeRepresentation of shapeRepresentations ) {

        let treeNode = treeMap.get( shapeRepresentation.localID )

        if ( treeNode === void 0 ) {

          treeNode = { parents: 0 }
          treeMap.set( shapeRepresentation.localID, treeNode )
        }

        // This is only for completely free geometry nodes.
        if ( ( treeNode.parents ?? 0 ) !== 0 || treeNode.thunk !== void 0 || treeNode.processed === true ) {
          continue        
        }

        const mappedTreeNode = treeNode

        const owningElementLocalID = shapeRepresentation.localID

        mappedTreeNode.thunk = makeThunk( shapeRepresentation, owningElementLocalID, mappedTreeNode )
      }

      // All thunks are set, now we can execute the full
      // assembly tree.
      for ( const [sourceID, mappedNode] of treeMap.entries() ) {

        if ( ( mappedNode.parents ?? 0 ) === 0 && mappedNode.thunk !== void 0 && mappedNode.processed !== true ) {

          //this.scene.clearParentStack()

          const shapeRepresentation = this.model.getTypedElementByLocalID( sourceID, shape_representation )! as shape_representation
   
          const sourceShapeContext = 
            shapeRepresentation.context_of_items.findVariant( global_unit_assigned_context )?.units?.
            find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined

          let scaleTransform : NativeTransform4x4 | undefined = void 0

          if ( sourceShapeContext !== void 0 ) {

            const sourceUnitInM = ( this.convertToMetres( sourceShapeContext ) ?? 1.0 )

            scaleTransform = this.identity3DNativeMatrix.uniformScale( 1.0 / sourceUnitInM )
          }

          // not an assembly mapped item, just extract the representation
          mappedNode.thunk( void 0, scaleTransform )
        }
      }
      
      if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
        this.model.geometry.deleteTemporaries()
      }

      result = ExtractResult.COMPLETE

      // free buffer at the end if you don't need it anymore
      if (this.pointBuffer?.pointer) {
        this.wasmModule._free(this.pointBuffer.pointer)
        this.pointBuffer = null
      }
      return [result, this.scene, this.productShapeMap]

    } finally {
      this.model.elementMemoization = previousMemoizationState
    }
  }
}
