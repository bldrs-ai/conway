import {
  ConwayGeometry,
  ParamsGetSweptDiskSolid,
  ParamsPolygonalFaceSet,
  GeometryObject,
  ParamsAxis2Placement3D,
  ParamsCartesianTransformationOperator3D,
  Vector3,
  Segment,
  ParamsGetIfcIndexedPolyCurve,
  CurveObject,
  ParamsGetAxis2Placement2D,
  ParamsGetCircleCurve,
  ParamsCreateNativeIfcProfile,
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
  ParamsGetRectangleProfileCurve,
  ParamsRelVoidSubtract,
  StdVector,
  ParamsAxis1Placement3D,
  ParamsGetBSplineCurve,
  BSplineSurface,
  TrimmingArguments,
  TrimmingSelect,
  ParamsGetEllipseCurve,
  ParamsTransformProfile,
  ParamsGetCShapeCurve,
  ParamsGetIShapeCurve,
  ParamsGetLShapeCurve,
  ParamsGetTShapeCurve,
  ParamsGetUShapeCurve,
  ParamsGetZShapeCurve,
  ParamsGetTriangulatedFaceSetGeometry,
  ParamsGetPolyCurve,
  ParamsGetPolygonalBoundedHalfspace,
  ParamsGetIfcLine,
  NativeTransform4x4,
  NativeTransform3x3,
} from '../../dependencies/conway-geom'
import { CanonicalMaterial, ColorRGBA, exponentToRoughness } from '../core/canonical_material'
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { CanonicalProfile } from '../core/canonical_profile'
import { ObjectPool } from '../core/native_pool'
import {
  NativeULongVector,
  NativeUintVector,
  NativeVectorBound3D,
  NativeVectorCurve,
  NativeVectorGeometry,
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
  IfcArbitraryClosedProfileDef,
  IfcAxis2Placement2D,
  IfcAxis2Placement3D,
  IfcBooleanResult,
  IfcCartesianPointList2D,
  IfcCartesianPointList3D,
  IfcCartesianTransformationOperator3D,
  IfcCircleProfileDef,
  IfcColourRgb,
  IfcCompositeProfileDef,
  IfcDirection,
  IfcExtrudedAreaSolid,
  IfcGridPlacement,
  IfcIndexedPolyCurve,
  IfcIndexedPolygonalFaceWithVoids,
  IfcLocalPlacement,
  IfcMappedItem,
  IfcNormalisedRatioMeasure,
  IfcObjectPlacement,
  IfcOpeningElement,
  IfcOpeningStandardCase,
  IfcPolygonalFaceSet,
  IfcProduct,
  IfcReflectanceMethodEnum,
  IfcProfileDef,
  IfcRepresentationItem,
  IfcSpace,
  IfcSpecularExponent,
  IfcSpecularRoughness,
  IfcStyledItem,
  IfcSurfaceStyle,
  IfcSurfaceStyleRefraction,
  IfcSurfaceStyleRendering,
  IfcSurfaceStyleShading,
  IfcPresentationStyleAssignment,
  IfcSurfaceSide,
  IfcBooleanClippingResult,
  IfcCompositeCurve,
  IfcPolyline,
  IfcTrimmedCurve,
  IfcCartesianPoint,
  IfcParameterValue,
  IfcCurve,
  IfcTrimmingPreference,
  IfcCircle,
  IfcHalfSpaceSolid,
  IfcPlane,
  IfcBoundingBox,
  IfcShellBasedSurfaceModel,
  IfcFace,
  IfcPolyLoop,
  IfcFacetedBrep,
  IfcRelAssociatesMaterial,
  IfcShapeRepresentation,
  IfcMaterialList,
  IfcMaterialDefinitionRepresentation,
  IfcMaterialLayerSetUsage,
  IfcMaterial,
  IfcRelVoidsElement,
  IfcRectangleProfileDef,
  IfcFeatureElementSubtraction,
  IfcMaterialProfileSet,
  IfcMaterialConstituentSet,
  IfcMaterialConstituent,
  IfcMaterialProfile,
  IfcProject,
  IfcSIUnit,
  IfcSIPrefix,
  IfcUnitEnum,
  IfcSIUnitName,
  IfcConversionBasedUnit,
  IfcFaceBasedSurfaceModel,
  IfcConnectedFaceSet,
  IfcArbitraryProfileDefWithVoids,
  IfcAdvancedBrep,
  IfcAdvancedFace,
  IfcBSplineCurve,
  IfcBSplineSurface,
  IfcBSplineSurfaceWithKnots,
  IfcRationalBSplineSurfaceWithKnots,
  IfcCylindricalSurface,
  IfcSurfaceOfRevolution,
  IfcSurfaceOfLinearExtrusion,
  IfcRationalBSplineCurveWithKnots,
  IfcAxis1Placement,
  IfcArbitraryOpenProfileDef,
  IfcBSplineCurveWithKnots,
  IfcEdgeLoop,
  IfcEdgeCurve,
  IfcVertexPoint,
  IfcRectangleHollowProfileDef,
  IfcEllipseProfileDef,
  IfcCircleHollowProfileDef,
  IfcIShapeProfileDef,
  IfcUShapeProfileDef,
  IfcDerivedProfileDef,
  IfcCartesianTransformationOperator2D,
  IfcCartesianTransformationOperator2DnonUniform,
  IfcLShapeProfileDef,
  IfcCShapeProfileDef,
  IfcTShapeProfileDef,
  IfcZShapeProfileDef,
  IfcRelAggregates,
  IfcTriangulatedFaceSet,
  IfcPolygonalBoundedHalfSpace,
  IfcSurface,
  IfcLine,
  IfcEllipse,
  IfcMaterialLayerSet,
  IfcSweptDiskSolid,
} from './ifc4_gen'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { IfcMaterialCache } from './ifc_material_cache'
import { IfcSceneBuilder, IfcSceneTransform } from './ifc_scene_builder'
import IfcStepModel from './ifc_step_model'
import Logger from '../logging/logger'
// import fs from 'fs'
import Environment, { EnvironmentType } from '../utilities/environment'
import { REFLECTANCE_METHOD_PERMISSIVE,
  MATERIAL_RELATED_OBJECTS_PERMISSIVE } from './ifc_parser_quirks'
import IfcModelCurves from './ifc_model_curves'
import { CsgMemoization, CsgOperationType } from '../core/csg_operations'
import { MemoizationCapture, RegressionCaptureState } from '../core/regression_capture_state'


type Mutable<T> = { -readonly [P in keyof T]: T[P] }


/**
 * Extract a specular highlight, converting specular exponents to a roughness value.
 *
 * @param from The scalar of either an exponent or a roughness to extract.
 * @return {number} A roughness value 1 (roughest) to zero (full specular/mirror).
 */
export function extractSpecularHighlight(
    from: IfcSpecularExponent | IfcSpecularRoughness | null): number | undefined {

  if (from === null) {
    return void 0
  }

  if (from instanceof IfcSpecularExponent) {

    return exponentToRoughness(from.Value)
  }

  return from.Value
}

/**
 * Extract an IFC Colour into our RGBA color, using premultiplied alpha.
 *
 * Transparency is usually handled via pre-multiplied alpha, and this is what
 * gltf (for example) expects.
 *
 * @param from The color to extract.
 * @param alpha The alpha value to be associated with the colour.
 * @return {ColorRGBA} The created colour.
 */
export function extractColorRGBPremultiplied(from: IfcColourRgb, alpha: number = 1): ColorRGBA {
  return [from.Red * alpha, from.Green * alpha, from.Blue * alpha, alpha]
}

/**
 * Extract an IFC Colour into our RGBA color.
 *
 * @param from The color to extract.
 * @param alpha The alpha value to be associated with the colour.
 * @return {ColorRGBA} The created colour.
 */
export function extractColorRGB(from: IfcColourRgb, alpha: number = 1): ColorRGBA {

  return [from.Red, from.Green, from.Blue, alpha]
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
    from: IfcColourRgb | IfcNormalisedRatioMeasure,
    surfaceColor: ColorRGBA, alpha: number = 1): ColorRGBA {

  if (from instanceof IfcColourRgb) {
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
 * Use to extract a color or a factor from a color/factor select.
 *
 * @param from The color or factor to extract this from.
 * @param surfaceColor The surface color (if this is a factor), which will be used to
 * create the factor.
 * @param alpha The alpha to use for this.
 * @return {ColorRGBA}
 */
export function extractColorOrFactorMultiply(
    from: IfcColourRgb | IfcNormalisedRatioMeasure,
    surfaceColor: ColorRGBA, alpha: number = 1): ColorRGBA {

  if (from instanceof IfcColourRgb) {
    const extracted = extractColorRGB(from, alpha)

    return [
      extracted[ 0 ] * surfaceColor[ 0 ],
      extracted[ 1 ] * surfaceColor[ 1 ],
      extracted[ 2 ] * surfaceColor[ 2 ],
      extracted[ 3 ] * surfaceColor[ 3 ],
    ]
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
 * Handles Geometry data extraction from a populated IfcStepModel
 * Can export to OBJ, GLTF (Draco), GLB (Draco)
 */
export class IfcGeometryExtraction {

  /* eslint-disable no-magic-numbers */
  private readonly TWO_DIMENSIONS: number = 2
  private readonly THREE_DIMENSIONS: number = 3

  private wasmModule: WasmModule

  public readonly scene: IfcSceneBuilder

  public readonly voidScene: IfcSceneBuilder

  public readonly materials: IfcMaterialCache

  public readonly voidMaterials: IfcMaterialCache

  private readonly relVoidsMap: Map<number, number>

  public readonly curves: IfcModelCurves

  public readonly csgOperations: CsgMemoization

  private readonly productToVoidGeometryMap: Map<number, number[]>
  private linearScalingFactor: number

  private ifcProjectName:string | null

  private circleSegments: number = 12

  private paramsGetBooleanResultPool: ObjectPool<ParamsGetBooleanResult> | undefined
  private paramsTransformProfilePool: ObjectPool<ParamsTransformProfile> | undefined
  private paramsGetTriangulatedFaceSetPool:
  ObjectPool<ParamsGetTriangulatedFaceSetGeometry> | undefined

  private paramsGetPolyCurvePool: ObjectPool<ParamsGetPolyCurve> | undefined

  private identity2DNativeMatrix: NativeTransform3x3
  private identity3DNativeMatrix: NativeTransform4x4

  /**
   * Construct a geometry extraction from an IFC step model and conway model
   *
   * @param conwayModel
   * @param model
   */
  constructor(
    private readonly conwayModel: ConwayGeometry,
    public readonly model: IfcStepModel) {

    this.materials = model.materials
    this.scene = new IfcSceneBuilder(model, conwayModel, this.materials)

    this.voidMaterials = model.voidMaterials
    this.voidScene = new IfcSceneBuilder(model, conwayModel, this.voidMaterials)

    this.relVoidsMap = new Map<number, number>()
    this.productToVoidGeometryMap = new Map<number, number[]>()
    this.linearScalingFactor = 1
    this.wasmModule = conwayModel.wasmModule
    this.ifcProjectName = null
    this.identity2DNativeMatrix = this.wasmModule.getIdentity2DMatrix()
    this.identity3DNativeMatrix = this.wasmModule.getIdentity3DMatrix()
    this.initializeMemoryPools()
    this.curves = model.curves
    this.csgOperations = model.csgOperations
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
    return this.linearScalingFactor
  }

  /**
   *
   * @return {string | null} - Ifc Project Name or null
   */
  getIfcProjectName(): string | null {
    return this.ifcProjectName
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
   * @return {NativeVectorGeometry} - a native std::vector<GeometryObject> from the wasm module
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
   * @return {NativeVectorProfile} - a native std::vector<IfcProfile> from the wasm module
   */
  nativeVectorProfile(initialSize?: number): NativeVectorProfile {
    // eslint-disable-next-line new-cap
    const nativeVectorProfile_ = new (this.wasmModule.profileArray)() as NativeVectorProfile

    if (initialSize) {
      // resize has a required second parameter to set default values
      const defaultProfile = new (this.wasmModule.IfcProfile as any)
      nativeVectorProfile_.resize(initialSize, defaultProfile)
    }

    return nativeVectorProfile_
  }

  /**
   * Create a native version of a vector curve to parse across the boundary.
   *
   * @param initialSize number - initial size of the vector (optional)
   * @return {NativeVectorCurve} - a native std::vector<IfcCurve> from the wasm module
   */
  nativeVectorCurve(initialSize?: number): StdVector<CurveObject> {
    // eslint-disable-next-line new-cap
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

  /**
   *
   * @param entity - the IfcTriangulatedFaceSet from the data model
   * @param temporary - is this geometry temporary?
   * @param isRelVoid - is this geometry a relvoid?
   */
  private extractTriangulatedFaceSet(entity:IfcTriangulatedFaceSet,
      temporary:boolean = false,
      isRelVoid:boolean = false ) {
    // Flatten points / indices into a single array
    const points = new Float64Array(entity.Coordinates.CoordList.flat())
    const indices = new Uint32Array(entity.CoordIndex.flat())

    const pointsArrayPtr = this.arrayToWasmHeap(points)
    const indicesArrayPtr = this.arrayToWasmHeap(indices)

    const parameters = this.paramsGetTriangulatedFaceSetPool!.acquire()
    parameters.indices = indicesArrayPtr
    parameters.indicesArrayLength = indices.length
    parameters.points = pointsArrayPtr
    parameters.pointsArrayLength = points.length

    const geometry = this.conwayModel.getTriangulatedFaceSetGeometry(parameters)


    this.paramsGetTriangulatedFaceSetPool?.release(parameters)
    this.wasmModule._free(pointsArrayPtr)
    this.wasmModule._free(indicesArrayPtr)

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: entity.localID,
      model: this.model,
      temporary: temporary,
    }

    // add mesh to the list of mesh objects
    if (!isRelVoid) {
      this.model.geometry.add(canonicalMesh)
    } else {
      this.model.voidGeometry.add(canonicalMesh)
    }
  }

  /**
   * @return {ExtractResult}
   */
  private extractPolygonalFaceSet(entity: IfcPolygonalFaceSet,
      temporary: boolean = false,
      isRelVoid: boolean = false): ExtractResult {
    const result: ExtractResult = ExtractResult.COMPLETE

    // Flatten points into a single Float32Array
    const points = new Float64Array(entity.Coordinates.CoordList.flat())

    // Temporary storage for indices and start indices
    const allIndices: number[] = []
    const allStartIndices: number[] = []
    const polygonalFaceBufferOffsets:number[] = []
    const startIndicesBufferOffsets:number[] = []
    let indicesPerFace: number = -1

    // Prepare indices and start indices for all faces
    entity.Faces.forEach((polygonalFace) => {

      // set the offets for the memory buffers so we can rebuild the
      // indexed polygonal face vector later
      polygonalFaceBufferOffsets.push(allIndices.length)
      startIndicesBufferOffsets.push(allStartIndices.length)

      let coordIndex:number = 0

      if (polygonalFace instanceof IfcIndexedPolygonalFaceWithVoids) {
        indicesPerFace = polygonalFace.CoordIndex.length

        allStartIndices.push(0)
        coordIndex += indicesPerFace
        allIndices.push(...polygonalFace.CoordIndex)
        polygonalFace.InnerCoordIndices.forEach((innerIndices) => {
          allStartIndices.push(coordIndex)
          allIndices.push(...innerIndices)

          coordIndex += innerIndices.length
        })
      } else {
        indicesPerFace = polygonalFace.CoordIndex.length
        allStartIndices.push(0)
        allIndices.push(...polygonalFace.CoordIndex)
      }
    })

    // Add the final entry
    polygonalFaceBufferOffsets.push(allIndices.length)
    startIndicesBufferOffsets.push(allStartIndices.length)


    // Convert to typed arrays for transfer to WebAssembly
    const indicesArray = new Uint32Array(allIndices)
    const indicesArrayPtr = this.arrayToWasmHeap(indicesArray)
    const startIndicesArray = new Uint32Array(allStartIndices)
    const startIndicesArrayPtr = this.arrayToWasmHeap(startIndicesArray)
    const polygonalFaceBufferOffsetsArray = new Uint32Array(polygonalFaceBufferOffsets)
    const polygonalFaceBufferOffsetsArrayPtr = this.arrayToWasmHeap(polygonalFaceBufferOffsetsArray)
    const startIndicesBufferOffsetsArray = new Uint32Array(startIndicesBufferOffsets)
    const startIndicesBufferOffsetsArrayPtr = this.arrayToWasmHeap(startIndicesBufferOffsetsArray)

    const pointsArrayPtr = this.arrayToWasmHeap(points)

    const polygonalFaceVector = this.wasmModule.buildIndexedPolygonalFaceVector(
        indicesArrayPtr,
        indicesArray.length,
        startIndicesArrayPtr,
        polygonalFaceBufferOffsetsArrayPtr,
        polygonalFaceBufferOffsets.length,
        startIndicesBufferOffsetsArrayPtr,
        startIndicesBufferOffsets.length)

    const pointsArrayNative = this.wasmModule.createVertexVector(pointsArrayPtr, points.length)

    const parameters: ParamsPolygonalFaceSet = {
      indicesPerFace: indicesPerFace,
      points: pointsArrayNative,
      faces: polygonalFaceVector,
    }

    const geometry: GeometryObject = this.conwayModel.getPolygonalFaceSetGeometry(parameters)

    // free allocated wasm vectors
    pointsArrayNative.delete()

    this.wasmModule._free(indicesArrayPtr)
    this.wasmModule._free(startIndicesArrayPtr)
    this.wasmModule._free(polygonalFaceBufferOffsetsArrayPtr)
    this.wasmModule._free(startIndicesBufferOffsetsArrayPtr)
    this.wasmModule._free(pointsArrayPtr)

    polygonalFaceVector.delete()

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: entity.localID,
      model: this.model,
      temporary: temporary,
    }

    // add mesh to the list of mesh objects
    if (!isRelVoid) {
      this.model.geometry.add(canonicalMesh)
    } else {
      this.model.voidGeometry.add(canonicalMesh)
    }

    return result
  }

  /** @return {number} Pointer/memory address */
  arrayToWasmHeap(array:Float32Array | Float64Array | Uint32Array): any {
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
   *
   * @param entities - IfcPolygonalFaceSet array
   * @param modelId - the modelId
   * @return {ExtractResult} - Extraction status result
   */
  private extractPolygonalFaceSets(entities: IfcPolygonalFaceSet[]): ExtractResult {

    let result: ExtractResult = ExtractResult.COMPLETE
    let faceSetResult: ExtractResult = ExtractResult.INCOMPLETE

    for (const entity of entities) {
      faceSetResult = this.extractPolygonalFaceSet(entity)

      if (faceSetResult !== ExtractResult.COMPLETE) {
        Logger.warning(`Face set express ID: ${entity.expressID} extraction incomplete.`)
        result = ExtractResult.INCOMPLETE
      }
    }

    return result
  }

  /**
   * Extract a 3D direction vector from an IFC direction.
   *
   * @param from The IFC direction to extract the vector from.
   * @return {Vector3 | undefined} The vector, or undefined if it can't be extracted.
   */
  static extractDirection(from: IfcDirection | null): Vector3 | undefined {

    if (from === null) {
      return void 0
    }

    return {
      x: from.DirectionRatios[0],
      y: from.DirectionRatios[1],

      z: (from.DirectionRatios.length > 2) ? from.DirectionRatios[2] : 0,
    }
  }

  /**
   * Extract an IFC 3D cartesian transform operator as a transform matrix.
   *
   * @param from The IFC cartesian transform to extract from.
   * @return {any} The internal matrix type extract.
   */
  extractCartesianTransformOperator3D(from: IfcCartesianTransformationOperator3D) {

    const conwayModel = this.conwayModel

    const position: Vector3 = {
      x: from.LocalOrigin.Coordinates[0],
      y: from.LocalOrigin.Coordinates[1],
      z: from.LocalOrigin.Coordinates[2],
    }

    const axis1Ref: Vector3 =
      IfcGeometryExtraction.extractDirection(from.Axis1) ?? { x: 1, y: 0, z: 0 }
    const axis2Ref: Vector3 =
      IfcGeometryExtraction.extractDirection(from.Axis2) ?? { x: 0, y: 1, z: 0 }
    const axis3Ref: Vector3 =
      IfcGeometryExtraction.extractDirection(from.Axis3) ?? { x: 0, y: 0, z: 1 }

    const scale = from.Scl

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
      scale1_: scale,
      scale2_: scale,
      scale3_: scale,
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
   * Accepts IfcBooleanResult and IfcBooleanClippingResult
   *
   * @param from
   */
  extractBooleanResult(from: IfcBooleanResult | IfcBooleanClippingResult,
      isRelVoid: boolean = false) {

    this.csgOperations.add(
        from.localID,
        {
          type: CsgOperationType.DIFFERENCE,
          operand1ID: from.FirstOperand.localID,
          operand2ID: from.SecondOperand.localID,
        },
        true )

    if (from.FirstOperand instanceof IfcExtrudedAreaSolid ||
      from.FirstOperand instanceof IfcPolygonalFaceSet ||
      from.FirstOperand instanceof IfcBooleanClippingResult ||
      from.FirstOperand instanceof IfcBooleanResult ||
      from.FirstOperand instanceof IfcPolygonalBoundedHalfSpace ||
      from.FirstOperand instanceof IfcHalfSpaceSolid ||
      from.FirstOperand instanceof IfcFacetedBrep) {
      this.extractBooleanOperand(from.FirstOperand, isRelVoid, from)
    }

    if (from.SecondOperand instanceof IfcExtrudedAreaSolid ||
      from.SecondOperand instanceof IfcPolygonalFaceSet ||
      from.SecondOperand instanceof IfcBooleanClippingResult ||
      from.SecondOperand instanceof IfcBooleanResult ||
      from.SecondOperand instanceof IfcPolygonalBoundedHalfSpace ||
      from.SecondOperand instanceof IfcHalfSpaceSolid ||
      from.SecondOperand instanceof IfcFacetedBrep) {
      this.extractBooleanOperand(from.SecondOperand, isRelVoid)
    }

    // get geometry TODO(nickcastel50): eventually support flattening meshes
    let flatFirstMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
    let firstMesh: CanonicalMesh | undefined
    const flatFirstMeshVectorFromParts: boolean = false

    if (isRelVoid) {
      firstMesh = this.model.voidGeometry.getByLocalID(from.FirstOperand.localID)
    } else {
      firstMesh = this.model.geometry.getByLocalID(from.FirstOperand.localID)
    }

    if (firstMesh !== void 0 && firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

      /* const _testEntity = this.model.getElementByLocalID(firstMesh.localID)!
      const outputFilePath_ =
      `${_testEntity.expressID}_${EntityTypesIfc[_testEntity.type]}FIRST_MESH.obj`

      this.dumpGeometry(outputFilePath_, firstMesh.geometry) */

      // const geometryParts = firstMesh.geometry.getParts()

      // if (geometryParts.size() > 0) {
      //   /* for (let geometryPartIndex = 0;
      //     geometryPartIndex < geometryParts.size(); ++geometryPartIndex) {
      //     flatFirstMeshVector.push_back(geometryParts.get(geometryPartIndex))
      //   }*/
      //   flatFirstMeshVector = geometryParts
      //   flatFirstMeshVectorFromParts = true
      // } else {
      flatFirstMeshVector = this.nativeVectorGeometry()
      flatFirstMeshVector.push_back(firstMesh.geometry)
      // }
    } else {
      Logger.error(
          `Error extracting firstOperand geometry for expressID: 
        ${from.FirstOperand.expressID} - type: 
        ${EntityTypesIfc[from.FirstOperand.type]} - isRelVoid: ${isRelVoid ? 'True' : 'False'}`)
      return
    }

    let flatSecondMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
    const flatSecondMeshVectorFromParts: boolean = false
    let secondMesh: CanonicalMesh | undefined

    if (isRelVoid) {
      secondMesh = this.model.voidGeometry.getByLocalID(from.SecondOperand.localID)
    } else {
      secondMesh = this.model.geometry.getByLocalID(from.SecondOperand.localID)
    }
    if (secondMesh !== void 0 && secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
      /* const _testEntity2 = this.model.getElementByLocalID(secondMesh.localID)!
      const outputFilePath_ =
      `${_testEntity2.expressID}_${EntityTypesIfc[_testEntity2.type]}_SECOND_MESH.obj`
      this.dumpGeometry(outputFilePath_, secondMesh.geometry) */
      // const geometryParts = secondMesh.geometry.getParts()

      // if (false) {// geometryParts.size() > 0) {

      //   flatSecondMeshVector = geometryParts
      //   flatSecondMeshVectorFromParts = true

      // } else {

      flatSecondMeshVector = this.nativeVectorGeometry()
      flatSecondMeshVector.push_back(secondMesh.geometry)
      // }
    } else {
      Logger.error(
          `Error extracting secondOperand geometry for expressID: 
        ${from.SecondOperand.localID} - type:
         ${EntityTypesIfc[from.SecondOperand.type]} - isRelVoid: ${isRelVoid ? 'True' : 'False'}`)
      return
    }

    const parameters = this.paramsGetBooleanResultPool!.acquire()

    parameters.flatFirstMesh = flatFirstMeshVector
    parameters.flatSecondMesh = flatSecondMeshVector
    parameters.operatorType = from.Operator.valueOf()

    const booleanGeometryObject: GeometryObject = this.conwayModel.getBooleanResult(parameters)


    // const outputFilePath =
    // `${from.expressID}_${EntityTypesIfc[from.type]}_post_subtract_test.obj`

    // this.dumpGeometry(outputFilePath, booleanGeometryObject)

    if (firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY &&
        secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: booleanGeometryObject,
        localID: from.localID,
        model: this.model,
        temporary: false,
      }

      const styledItemLocalID_ = this.materials.styledItemMap.get(from.localID)
      if (styledItemLocalID_ !== undefined) {
        const styledItem_ = this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem
        this.extractStyledItem(styledItem_)
      } else {
        // get material from first operand
        const firstOperandStyledItemLocalID_ =
        this.materials.styledItemMap.get(from.FirstOperand.localID)
        if (firstOperandStyledItemLocalID_ !== undefined) {
          const firstOperandStyledItem =
          this.model.getElementByLocalID(firstOperandStyledItemLocalID_) as IfcStyledItem
          this.extractStyledItem(firstOperandStyledItem, from)
        }
      }

      // add mesh to the list of mesh objects
      if (!isRelVoid) {
        if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
          this.dropNonSceneGeometry(firstMesh.localID)
          this.dropNonSceneGeometry(secondMesh.localID)
        }

        this.model.geometry.add(canonicalMesh)
      } else {

        if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
          this.model.voidGeometry.delete(firstMesh.localID)
          this.model.voidGeometry.delete(secondMesh.localID)
        }

        this.model.voidGeometry.add(canonicalMesh)
      }
    }

    if (!flatFirstMeshVectorFromParts) {
      flatFirstMeshVector.delete()
    }

    if (!flatSecondMeshVectorFromParts) {
      flatSecondMeshVector.delete()
    }

    this.paramsGetBooleanResultPool!.release(parameters)
  }

  /* eslint-disable default-param-last */
  /**
   * Extract a boolean operand from a boolean result.
   *
   * @param from The operand to extract.
   * @return {void}
   */
  extractBooleanOperand(from: IfcExtrudedAreaSolid |
    IfcPolygonalFaceSet |
    IfcBooleanResult |
    IfcHalfSpaceSolid |
    IfcBooleanClippingResult |
    IfcFacetedBrep,
  isRelVoid: boolean = false,
  representationItem?:IfcRepresentationItem) {

    if (from instanceof IfcExtrudedAreaSolid) {
      // mark as temporary
      this.extractExtrudedAreaSolid(from, true, isRelVoid)
    } else if (from instanceof IfcPolygonalFaceSet) {
      // mark as temporary
      const faceSetResult: ExtractResult =
        this.extractPolygonalFaceSet(from, true, isRelVoid)

      if (faceSetResult !== ExtractResult.COMPLETE) {
        Logger.warning(`Warning, face set express ID: ${from.expressID} extraction incomplete.`)
      }

    } else if (from instanceof IfcPolygonalBoundedHalfSpace) {
      this.extractPolygonalBoundedHalfSpace(from, true, isRelVoid)
    } else if (from instanceof IfcHalfSpaceSolid) {
      this.extractHalfspaceSolid(from, true, isRelVoid)
    } else if (from instanceof IfcSweptDiskSolid) {
      this.extractSweptDiskSolid(from, true, isRelVoid)
    } else if (from instanceof IfcFacetedBrep) {
      this.extractIfcFacetedBrep(from, true, isRelVoid)
    } else if (from instanceof IfcBooleanResult) {

      if (from.FirstOperand instanceof IfcExtrudedAreaSolid ||
        from.FirstOperand instanceof IfcPolygonalFaceSet ||
        from.FirstOperand instanceof IfcBooleanClippingResult ||
        from.FirstOperand instanceof IfcBooleanResult ||
        from.FirstOperand instanceof IfcPolygonalBoundedHalfSpace ||
        from.FirstOperand instanceof IfcHalfSpaceSolid ||
        from.FirstOperand instanceof IfcFacetedBrep) {

        this.extractBooleanOperand(from.FirstOperand, isRelVoid, representationItem)


      }

      if (from.SecondOperand instanceof IfcExtrudedAreaSolid ||
        from.SecondOperand instanceof IfcPolygonalFaceSet ||
        from.SecondOperand instanceof IfcBooleanClippingResult ||
        from.SecondOperand instanceof IfcBooleanResult ||
        from.SecondOperand instanceof IfcPolygonalBoundedHalfSpace ||
        from.SecondOperand instanceof IfcHalfSpaceSolid ||
        from.SecondOperand instanceof IfcFacetedBrep) {
        this.extractBooleanOperand(from.SecondOperand, isRelVoid)
      }

      // get geometry TODO(nickcastel50): eventually support flattening meshes
      let flatFirstMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
      const flatFirstMeshVectorFromParts: boolean = false
      let firstMesh: CanonicalMesh | undefined

      if (isRelVoid) {
        firstMesh = this.model.voidGeometry.getByLocalID(from.FirstOperand.localID)
      } else {
        firstMesh = this.model.geometry.getByLocalID(from.FirstOperand.localID)
      }
      if (firstMesh !== void 0 && firstMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        /* const _testEntity = this.model.getElementByLocalID(firstMesh.localID)!
        const outputFilePath_ =
        `${_testEntity.expressID}_${EntityTypesIfc[_testEntity.type]}FIRST_MESH.obj`

        this.dumpGeometry(outputFilePath_, firstMesh.geometry) */

        // const geometryParts = firstMesh.geometry.getParts()

        // if (geometryParts.size() > 0) {
        //   /* for (let geometryPartIndex = 0;
        //     geometryPartIndex < geometryParts.size(); ++geometryPartIndex) {
        //     flatFirstMeshVector.push_back(geometryParts.get(geometryPartIndex))
        //   }*/
        //   flatFirstMeshVector = geometryParts
        // } else {
        flatFirstMeshVector = this.nativeVectorGeometry()
        flatFirstMeshVector.push_back(firstMesh.geometry)
        // }
      } else {
        Logger.error(
            `(Operand) Error extracting firstOperand geometry for expressID: 
          ${from.FirstOperand.expressID} - type: 
          ${EntityTypesIfc[from.FirstOperand.type]} - isRelVoid: ${isRelVoid ? 'True' : 'False'}`)
        return
      }

      let flatSecondMeshVector: StdVector<GeometryObject>// = this.nativeVectorGeometry()
      const flatSecondMeshVectorFromParts: boolean = false
      let secondMesh: CanonicalMesh | undefined

      if (isRelVoid) {
        secondMesh = this.model.voidGeometry.getByLocalID(from.SecondOperand.localID)
      } else {
        secondMesh = this.model.geometry.getByLocalID(from.SecondOperand.localID)
      }
      if (secondMesh !== void 0 && secondMesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        /* const _testEntity2 = this.model.getElementByLocalID(secondMesh.localID)!
        const outputFilePath_ =
        `${_testEntity2.expressID}_${EntityTypesIfc[_testEntity2.type]}_SECOND_MESH.obj`

        this.dumpGeometry(outputFilePath_, secondMesh.geometry) */

        // const geometryParts = secondMesh.geometry.getParts()

        // if (geometryParts.size() > 0) {
        //   /* for (let geometryPartIndex = 0;
        //     geometryPartIndex < geometryParts.size(); ++geometryPartIndex) {
        //     flatSecondMeshVector.push_back(geometryParts.get(geometryPartIndex))
        //   }*/
        //   flatSecondMeshVector = geometryParts
        // } else {
        flatSecondMeshVector = this.nativeVectorGeometry()
        flatSecondMeshVector.push_back(secondMesh.geometry)
        // }
      } else {
        Logger.error(
            `(Operand) Error extracting secondOperand geometry for expressID: 
          ${from.SecondOperand.expressID} - type:
           ${EntityTypesIfc[from.SecondOperand.type]} - isRelVoid: ${isRelVoid ? 'True' : 'False'}`)
        return
      }

      const parameters = this.paramsGetBooleanResultPool!.acquire()

      parameters.flatFirstMesh = flatFirstMeshVector
      parameters.flatSecondMesh = flatSecondMeshVector
      parameters.operatorType = from.Operator.valueOf()

      const booleanGeometryObject: GeometryObject = this.conwayModel.getBooleanResult(parameters)

      // const outputFilePath =
      // `${from.expressID}_${EntityTypesIfc[from.type]}_post_subtract_operand.obj`

      // this.dumpGeometry(outputFilePath, booleanGeometryObject)

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: booleanGeometryObject,
        localID: from.localID,
        model: this.model,
        temporary: true,
      }

      const styledItemLocalID_ = this.materials.styledItemMap.get(from.localID)
      if (styledItemLocalID_ !== undefined) {
        const styledItem_ = this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem
        this.extractStyledItem(styledItem_)
      } else {
        // get material from first operand
        const firstOperandStyledItemLocalID_ =
        this.materials.styledItemMap.get(from.FirstOperand.localID)
        if (firstOperandStyledItemLocalID_ !== undefined) {
          const firstOperandStyledItem =
          this.model.getElementByLocalID(firstOperandStyledItemLocalID_) as IfcStyledItem
          this.extractStyledItem(firstOperandStyledItem, representationItem)
        }
      }

      // add mesh to the list of mesh objects
      if (!isRelVoid) {

        if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
          this.dropNonSceneGeometry(firstMesh.localID)
          this.dropNonSceneGeometry(secondMesh.localID)
        }

        this.model.geometry.add(canonicalMesh)
      } else {

        if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
          this.model.voidGeometry.delete(firstMesh.localID)
          this.model.voidGeometry.delete(secondMesh.localID)
        }

        this.model.voidGeometry.add(canonicalMesh)
      }

      if (!flatFirstMeshVectorFromParts) {
        flatFirstMeshVector.delete()
      }

      if (!flatSecondMeshVectorFromParts) {
        flatSecondMeshVector.delete()
      }

      this.paramsGetBooleanResultPool!.release(parameters)
    }
  }
  /* eslint-enable default-param-last */

  /* eslint-disable no-magic-numbers */ // No magic numbers disabled
  // Cos we have *lots* of default material values.
  /**
   * Extract a canonical material from a surface style.
   *
   * @param from The surface style to extract a material from.
   */
  extractSurfaceStyle(from: IfcSurfaceStyle) {

    const materials = this.materials

    const material = materials.get(from.localID)

    if (material === void 0) {

      const readDoubleSided = from.Side === IfcSurfaceSide.BOTH ||
        from.Side === IfcSurfaceSide.POSITIVE

      const newMaterial: Mutable<CanonicalMaterial> = {
        name: `#${from.expressID}`,
        baseColor: [0.8, 0.8, 0.8, 1],
        legacyColor: [0.8, 0.8, 0.8, 1],
        doubleSided: readDoubleSided,
        blend: BlendMode.OPAQUE,
      }

      for (const style of from.Styles) {

        if (style instanceof IfcSurfaceStyleRefraction) {

          newMaterial.ior = style.RefractionIndex ?? newMaterial.ior

        } else if (style instanceof IfcSurfaceStyleRendering) {

          let transparency = 0

          // TODO(conor) - this will go away with more general schema skew handling
          try {
            transparency = style.Transparency ?? transparency
          } catch (e) {
            // TODO(conor) - This is hiding a version difference with IFC 2x3 (better skew
            // handling)
          }

          const surfaceColor = extractColorRGBPremultiplied(style.SurfaceColour, 1 - transparency)

          newMaterial.baseColor = style.DiffuseColour !== null ?
            extractColorOrFactorMultiply(style.DiffuseColour, surfaceColor) : surfaceColor

          newMaterial.legacyColor = surfaceColor
          newMaterial.roughness = extractSpecularHighlight(style.SpecularHighlight)
          newMaterial.specular = style.SpecularColour !== null ?
            extractColorOrFactorMultiply(style.SpecularColour, surfaceColor) : void 0

          let reflectanceMethod = IfcReflectanceMethodEnum.NOTDEFINED

          try {
            reflectanceMethod = style.ReflectanceMethod
          } catch (ex) {
            if (ex instanceof Error) {
              if (REFLECTANCE_METHOD_PERMISSIVE) {
                Logger.error(
                    `Found null for nonnullable field IfcReflectanceMethodEnum. expressID: ${
                      style.expressID}`,
                )
              } else {
                throw ex
              }
            }
          }

          switch (reflectanceMethod) {

            case IfcReflectanceMethodEnum.NOTDEFINED:
            case IfcReflectanceMethodEnum.PHONG:
            case IfcReflectanceMethodEnum.BLINN: {

              newMaterial.metalness = 0.0
              newMaterial.roughness ??= 1
              newMaterial.ior ??= 1.4
              break
            }

            case IfcReflectanceMethodEnum.FLAT: {

              newMaterial.metalness = 0.0
              newMaterial.roughness ??= 0.9
              newMaterial.ior ??= 1.5
              break

            }

            case IfcReflectanceMethodEnum.GLASS: {

              newMaterial.metalness = 0.0
              newMaterial.roughness ??= 0
              newMaterial.ior ??= 1.52
              break

            }

            case IfcReflectanceMethodEnum.MATT:

              newMaterial.metalness = 0
              newMaterial.roughness ??= 1
              break

            case IfcReflectanceMethodEnum.METAL:

              newMaterial.metalness = 1
              newMaterial.roughness ??= 0.2
              break

            case IfcReflectanceMethodEnum.MIRROR:

              newMaterial.metalness = 1
              newMaterial.roughness ??= 0
              newMaterial.ior ??= 1.52
              break

            case IfcReflectanceMethodEnum.PLASTIC:

              newMaterial.metalness = 0.0
              newMaterial.roughness ??= 0
              newMaterial.ior ??= 1.47
              break

            case IfcReflectanceMethodEnum.STRAUSS:

              newMaterial.metalness = 1.0
              newMaterial.roughness ??= 0.95
              newMaterial.ior ??= 1.47
              break

            default:

          }

        } else if (style instanceof IfcSurfaceStyleShading) {

          let transparency = 0

          // TODO(conor) - this will go away with more general schema skew handling
          try {
            transparency = style.Transparency ?? transparency
          } catch (e) {
            // TODO(conor) - This is hiding a version difference with IFC 2x3 (better skew
            // handling)
          }

          newMaterial.baseColor =
            extractColorRGBPremultiplied(style.SurfaceColour, 1 - transparency)

        }

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
  extractStyledItem(from: IfcStyledItem,
      representationItem?: IfcRepresentationItem,
      mappedItem?:IfcMappedItem): number | undefined {

    let surfaceStyleID: number | undefined = void 0

    for (const style of from.Styles) {

      if (style instanceof IfcPresentationStyleAssignment) {

        for (const innerStyle of style.Styles) {
          if (innerStyle instanceof IfcSurfaceStyle) {

            surfaceStyleID = innerStyle.localID
            this.extractSurfaceStyle(innerStyle)
            break
          }
        }

      } else if (style instanceof IfcSurfaceStyle) {

        surfaceStyleID = style.localID
        this.extractSurfaceStyle(style)
      }
    }

    if (surfaceStyleID === void 0) {
      return
    }

    if (representationItem !== undefined) {
      this.materials.addGeometryMapping(representationItem.localID, surfaceStyleID)
    } else if (from.Item !== null) {
      this.materials.addGeometryMapping(from.Item.localID, surfaceStyleID)

      if (mappedItem !== void 0) {
        this.materials.addGeometryMapping(mappedItem.localID, surfaceStyleID)
      }
    }

    return surfaceStyleID
  }

  /**
   *
   * @param from ifc type to extract
   * @param temporary is geometry temporary
   * @param isRelVoid  is it a relative void
   */
  extractSweptDiskSolid(
      from: IfcSweptDiskSolid,
      temporary: boolean = false,
      isRelVoid: boolean = false): void {
    const directrix = this.extractCurve(from.Directrix)
    if (!directrix) {
      Logger.error(`Directrix extraction failed for IFCSWEPTDISKSOLID, expressID: 
        ${from.expressID}`)
      return
    }

    const radius = from.Radius
    const innerRadius = from.InnerRadius || -1
    const startParam = from.StartParam || -1
    const endParam = from.EndParam || -1
    const closed = false

    const parameters: ParamsGetSweptDiskSolid = {
      directrix,
      radius,
      innerRadius,
      startParam,
      endParam,
      closed,
      circleSegments: this.circleSegments,
      scalingFactor: this.linearScalingFactor,
    }

    const geometry = this.conwayModel.getSweptDiskSolid(parameters)

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry,
      localID: from.localID,
      model: this.model,
      temporary,
    }

    // add mesh to the list of mesh objects
    if (!isRelVoid) {
      this.model.geometry.add(canonicalMesh)
    } else {
      this.model.voidGeometry.add(canonicalMesh)
    }
  }


  /**
   *
   * @param from
   * @param temporary
   */
  extractHalfspaceSolid(from: IfcHalfSpaceSolid,
      temporary: boolean = false,
      isRelVoid: boolean = false) {

    if (from.BaseSurface instanceof IfcPlane) {
      const paramsAxis2Placement3D: ParamsAxis2Placement3D =
        this.extractAxis2Placement3D(from.BaseSurface.Position, from.localID, true)
      const axis2PlacementTransform = this.conwayModel
          .getAxis2Placement3D(paramsAxis2Placement3D)

      // get geometry
      const parameters: ParamsGetHalfspaceSolid = {
        flipWinding: from.AgreementFlag,
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

      // add mesh to the list of mesh objects
      if (!isRelVoid) {
        this.model.geometry.add(canonicalMesh)
      } else {
        this.model.voidGeometry.add(canonicalMesh)
      }
    }
  }

  /**
   *
   * @param from
   * @param temporary
   */
  extractPolygonalBoundedHalfSpace(from: IfcPolygonalBoundedHalfSpace,
      temporary: boolean = false,
      isRelVoid: boolean = false) {
    // TODO(nickcastel50):unfinished - not needed at the moment -
    // also pass this.linearScalingFactor in parameters
    // extract position
    let axis2PlacementTransform: any | undefined = (void 0)
    const paramsAxis2Placement3D: ParamsAxis2Placement3D =
      this.extractAxis2Placement3D(from.Position, from.localID, true)
    axis2PlacementTransform = this.conwayModel
        .getAxis2Placement3D(paramsAxis2Placement3D)

    const surface = from.BaseSurface
    const curve = from.PolygonalBoundary
    const agreement = from.AgreementFlag

    // add face to geometry
    const nativeSurface = (new (this.wasmModule.IfcSurface)) as SurfaceObject

    const nativeCurve = this.extractCurve(curve)

    this.extractSurface(surface, nativeSurface)

    const parameters:ParamsGetPolygonalBoundedHalfspace = {
      scaleFactor: this.linearScalingFactor,
      agreement: agreement,
      curve: nativeCurve,
      surface: nativeSurface,
      position: axis2PlacementTransform,
    }

    const geometry = this.wasmModule.getPolygonalBoundedHalfspace(parameters)

    // apply transform
    if (axis2PlacementTransform !== void 0) {
      geometry.applyTransform(axis2PlacementTransform)
    }

    // const _outputFilePath = `${from.expressID}_${EntityTypesIfc[from.type]}.obj`
    // this.dumpGeometry(_outputFilePath, geometry)

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: from.localID,
      model: this.model,
      temporary: temporary,
    }

    // add mesh to the list of mesh objects
    if (!isRelVoid) {
      this.model.geometry.add(canonicalMesh)
    } else {
      this.model.voidGeometry.add(canonicalMesh)
    }
  }

  /**
   *
   * @param from
   * @param temporary
   */
  extractExtrudedAreaSolid(from: IfcExtrudedAreaSolid,
      temporary: boolean = false,
      isRelVoid: boolean = false) {

    let axis2PlacementTransform: any | undefined = (void 0)

    const position = from.Position

    if (position !== null) {
      const paramsAxis2Placement3D: ParamsAxis2Placement3D =
        this.extractAxis2Placement3D(position, position.localID, true)
      axis2PlacementTransform = this.conwayModel
          .getAxis2Placement3D(paramsAxis2Placement3D)
    }

    const profile: CanonicalProfile | undefined = this.extractProfile(from.SweptArea)

    if (profile !== void 0 && profile.nativeProfile !== void 0) {

      const dir = {
        x: from.ExtrudedDirection.DirectionRatios[0],
        y: from.ExtrudedDirection.DirectionRatios[1],
        z: from.ExtrudedDirection.DirectionRatios[2],
      }

      // get geometry
      const parameters: ParamsGetExtrudedAreaSolid = {
        depth: from.Depth,
        dir: dir,
        profile: profile.nativeProfile,
      }

      const geometry: GeometryObject = this.conwayModel.getExtrudedAreaSolid(parameters)

      // apply transform
      if (axis2PlacementTransform !== void 0) {

        geometry.applyTransform(axis2PlacementTransform)
      }

      // const _outputFilePath = `${from.expressID}_${EntityTypesIfc[from.type]}.obj`
      // this.dumpGeometry(_outputFilePath, geometry)

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: geometry,
        localID: from.localID,
        model: this.model,
        temporary: temporary,
      }

      // add mesh to the list of mesh objects
      if (!isRelVoid) {
        this.model.geometry.add(canonicalMesh)
      } else {
        this.model.voidGeometry.add(canonicalMesh)
      }

    } else {
      Logger.error(`Couldn't parse profile, 
      expressID: ${from.SweptArea.expressID} type: ${EntityTypesIfc[from.SweptArea.type]}`)
    }
  }

  /**
   * Extract a canonical profile from a profile definition.
   *
   * @param from The profile definition to extract from.
   * @return {CanonicalProfile | undefined} The extracted profile,
   * or undefined if one cannot be extracted.
   */
  extractProfile(from: IfcProfileDef): CanonicalProfile | undefined {

    const foundProfile = this.model.profiles.getByLocalID(from.localID)

    if (foundProfile !== void 0) {

      // we already have this profile, return it and exit
      return foundProfile
    }

    let profile: CanonicalProfile | undefined

    if (from instanceof IfcArbitraryProfileDefWithVoids) {
      const outerCurve = from.OuterCurve
      if (outerCurve instanceof IfcCompositeCurve) {
        const compositeCurve = this.extractCompositeCurve(outerCurve, undefined, true)
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()
        if (compositeCurve !== void 0) {
          for (let holeIndex = 0; holeIndex < from.InnerCurves.length; ++holeIndex) {
            const holeCurve = from.InnerCurves[holeIndex]

            if (holeCurve instanceof IfcCompositeCurve) {
              const compositeCurve_ = this.extractCompositeCurve(holeCurve, undefined, true)

              if (compositeCurve_ !== void 0) {
                holesArray.push_back(compositeCurve_)
              }
            } else {

              const curveObject = this.extractCurve(holeCurve)

              if (curveObject !== void 0) {
                holesArray.push_back(curveObject)
              }
            }
          }
          profile = {
            localID: from.localID,
            curve: compositeCurve,
            holes: holesArray,
            profiles: (void 0),
            nativeProfile: (void 0),
          }
        }
      } else {

        const curveObject = this.extractCurve(outerCurve)

        if (curveObject !== void 0) {
          const holesArray: NativeVectorCurve = this.nativeVectorCurve()
          for (let holeIndex = 0; holeIndex < from.InnerCurves.length; ++holeIndex) {
            const holeCurve = from.InnerCurves[holeIndex]

            if (holeCurve instanceof IfcCompositeCurve) {
              const compositeCurve = this.extractCompositeCurve(holeCurve, undefined, true )

              if (compositeCurve !== void 0) {
                holesArray.push_back(compositeCurve)
              }
            } else {

              const curveObject_ = this.extractCurve(holeCurve)
              if (curveObject_ !== void 0) {
                holesArray.push_back(curveObject_)
              }
            }
          }

          profile = {
            localID: from.localID,
            curve: curveObject,
            holes: holesArray,
            profiles: (void 0),
            nativeProfile: (void 0),
          }
        }
      }
    } else if (
      from instanceof IfcArbitraryClosedProfileDef ||
      from instanceof IfcArbitraryOpenProfileDef) {

      const profileCurve =
        from instanceof IfcArbitraryClosedProfileDef ? from.OuterCurve : from.Curve

      if (profileCurve instanceof IfcCompositeCurve) {
        const compositeCurve =
          this.extractCompositeCurve(
              profileCurve,
              void 0,
              from instanceof IfcArbitraryClosedProfileDef)
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        if (compositeCurve !== void 0) {
          profile = {
            localID: from.localID,
            curve: compositeCurve,
            holes: holesArray,
          }
        }
      } else {

        const curveObject = this.extractCurve(profileCurve)

        if (curveObject !== void 0) {
          const holesArray: NativeVectorCurve = this.nativeVectorCurve()
          profile = {
            localID: from.localID,
            curve: curveObject,
            holes: holesArray,
          }
        }
      }
    } else if (from instanceof IfcEllipseProfileDef) {
      const curveObject = this.extractEllipseProfileCurve(from)

      if (curveObject !== void 0) {
        if (!curveObject.isCCW()) {
          curveObject.invert()
        }
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()
        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }
    } else if (from instanceof IfcCircleProfileDef) {

      const curveObject = this.extractCircleCurve(from)

      if (curveObject !== void 0) {
        if (!curveObject.isCCW()) {
          curveObject.invert()
        }
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        if (from instanceof IfcCircleHollowProfileDef) {
          const holeCurve = this.extractCircleHollowHoleCurve(from)

          if (holeCurve !== void 0) {
            holesArray.push_back(holeCurve)
          }
        }
        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }
    } else if (from instanceof IfcCompositeProfileDef) {
      const holesArray: NativeVectorCurve = this.nativeVectorCurve()
      profile = {
        localID: from.localID,
        curve: (void 0),
        holes: holesArray,
      }

      const profiles: CanonicalProfile[] = []

      for (let profileIndex = 0; profileIndex < from.Profiles.length; ++profileIndex) {
        const profile_ = this.extractProfile(from.Profiles[profileIndex])

        if (profile_ !== void 0) {
          profiles.push(profile_)
        }
      }

      profile.profiles = profiles
    } else if (from instanceof IfcRectangleProfileDef) {
      const curveObject = this.extractRectangleCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        if (from instanceof IfcRectangleHollowProfileDef) {
          const holeCurve = this.extractRectangleHollowHoleCurve(from)

          if (holeCurve !== void 0) {
            holesArray.push_back(holeCurve)
          }
        }
        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcCShapeProfileDef) {
      const curveObject = this.extractCShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }
    } else if (from instanceof IfcIShapeProfileDef) {

      const curveObject = this.extractIShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcLShapeProfileDef) {
      const curveObject = this.extractLShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcTShapeProfileDef) {
      const curveObject = this.extractTShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcUShapeProfileDef) {
      const curveObject = this.extractUShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcZShapeProfileDef) {
      const curveObject = this.extractZShapeCurve(from)

      if (curveObject !== void 0) {
        const holesArray: NativeVectorCurve = this.nativeVectorCurve()

        profile = {
          localID: from.localID,
          curve: curveObject,
          holes: holesArray,
        }
      }

    } else if (from instanceof IfcDerivedProfileDef) {
      const canonicalProfileParent = this.extractProfile(from.ParentProfile)

      if (canonicalProfileParent?.nativeProfile !== void 0) {
        const transformation = this.extractCartesianTransformOperator2D(from.Operator) // glm::dmat3

        const paramsTransformProfile = this.paramsTransformProfilePool!.acquire()
        paramsTransformProfile.transformation = transformation
        paramsTransformProfile.profile = canonicalProfileParent.nativeProfile

        const newNativeProfile = this.conwayModel.transformProfile(paramsTransformProfile)

        profile = {
          localID: from.localID,
          curve: newNativeProfile.getCurve(),
          holes: newNativeProfile.getHoles(),
          nativeProfile: newNativeProfile,
          profiles: canonicalProfileParent.profiles,
        }

        // Check if profile is already in the model's profiles
        const existingProfile = this.model.profiles.getByLocalID(profile.localID)

        if (!existingProfile) {
          // If profile is not already in the model's profiles, add it
          this.model.profiles.add(profile)
        }

        this.paramsTransformProfilePool!.release(paramsTransformProfile)

        return profile

      } else {
        Logger.error(`IfcDerivedProfileDef not parsed properly, express ID: ${from.expressID}`)
      }

    } else {
      Logger.warning(`Unsupported Profile! Type: 
      ${EntityTypesIfc[from.type]} expressID: ${from.expressID}`)
    }

    // add profile to the list of profile objects
    let isComposite: boolean = false
    if (profile !== void 0) {

      if (profile.profiles !== void 0 && profile.profiles.length > 0) {
        isComposite = true

        const profilesArray: NativeVectorProfile = this.nativeVectorProfile(profile.profiles.length)

        if (!profile.curve) {
          // create a blank curve for a composite profile
          profile.curve = new (this.wasmModule.IfcCurve as any)
        }

        // we must create a native profile for each profile
        for (let profileIndex = 0; profileIndex < profile.profiles.length; ++profileIndex) {
          const profilesArrayCurrent: NativeVectorProfile = this.nativeVectorProfile()
          const parameters: ParamsCreateNativeIfcProfile = {
            curve: profile.profiles[profileIndex].curve!,
            // TODO(nickcastel50): support profiles with holes (out of scope at the moment)
            holes: profile.profiles[profileIndex].holes,
            isConvex: false,
            isComposite: false,
            profiles: profilesArrayCurrent,
          }

          profile.profiles[profileIndex].nativeProfile =
            this.conwayModel.createNativeIfcProfile(parameters)

          profilesArray.set(profileIndex, profile.profiles[profileIndex].nativeProfile)
        }


        // create native IfcProfile vector
        const parameters: ParamsCreateNativeIfcProfile = {
          curve: profile.curve!,
          // TODO(nickcastel50): support profiles with holes (out of scope at the moment)
          holes: profile.holes,
          isConvex: false,
          isComposite: isComposite,
          profiles: profilesArray,
        }

        profile.nativeProfile = this.conwayModel.createNativeIfcProfile(parameters)
      } else {

        const profilesArray: NativeVectorProfile = this.nativeVectorProfile()
        const parameters: ParamsCreateNativeIfcProfile = {
          curve: profile.curve!,
          // TODO(nickcastel50): support profiles with holes (out of scope at the moment)
          holes: profile.holes,
          isConvex: false,
          isComposite: isComposite,
          profiles: profilesArray,
        }

        profile.nativeProfile = this.conwayModel.createNativeIfcProfile(parameters)
      }

      // Check if profile is already in the model's profiles
      const existingProfile = this.model.profiles.getByLocalID(profile.localID)

      if (!existingProfile) {
        // If profile is not already in the model's profiles, add it
        this.model.profiles.add(profile)
      }
    }

    return profile
  }

  /**
   * Extracts a C-shape curve from an IFC C-shape profile definition.
   *
   * @param from The IFC C-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the C-shape curve,
   * or undefined if not extractable.
   */
  extractCShapeCurve(from: IfcCShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetCShapeCurve: ParamsGetCShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        hasFillet: false, // TODO(nickcastel50): Add fillet support to C curves
        // hasFillet: (from.InternalFilletRadius !== null),
        depth: from.Depth,
        width: from.Width,
        thickness: from.WallThickness,
        girth: from.Girth,
        filletRadius: (from.InternalFilletRadius !== null) ? from.InternalFilletRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCShapeCurve(paramsGetCShapeCurve)
      paramsGetCShapeCurve.placement.delete()
      return ifcCurve

    } else {
      const paramsGetCShapeCurve: ParamsGetCShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        hasFillet: false, // TODO(nickcastel50): Add fillet support to C curves
        // hasFillet: (from.InternalFilletRadius !== null),
        depth: from.Depth,
        width: from.Width,
        thickness: from.WallThickness,
        girth: from.Girth,
        filletRadius: (from.InternalFilletRadius !== null) ? from.InternalFilletRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCShapeCurve(paramsGetCShapeCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts an I-shape curve from an IFC I-shape profile definition.
   *
   * @param from The IFC I-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the I-shape curve,
   *  or undefined if not extractable.
   */
  extractIShapeCurve(from: IfcIShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetIShapeCurve: ParamsGetIShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        hasFillet: (from.FilletRadius !== null),
        width: from.OverallWidth,
        depth: from.OverallDepth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getIShapeCurve(paramsGetIShapeCurve)
      paramsGetIShapeCurve.placement.delete()
      return ifcCurve

    } else {
      const paramsGetIShapeCurve: ParamsGetIShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        hasFillet: (from.FilletRadius !== null),
        width: from.OverallWidth,
        depth: from.OverallDepth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getIShapeCurve(paramsGetIShapeCurve)
      return ifcCurve
    }
  }
  /**
   * Extracts an L-shape curve from an IFC L-shape profile definition.
   *
   * @param from The IFC L-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the L-shape curve,
   * or undefined if not extractable.
   */
  extractLShapeCurve(from: IfcLShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetLShapeCurve: ParamsGetLShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        hasFillet: (from.FilletRadius !== null),
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        depth: from.Depth,
        width: (from.Width !== null) ? from.Width : 0,
        thickness: from.Thickness,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
        legSlope: (from.LegSlope !== null) ? from.LegSlope : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getLShapeCurve(paramsGetLShapeCurve)
      paramsGetLShapeCurve.placement.delete()
      return ifcCurve

    } else {
      const paramsGetLShapeCurve: ParamsGetLShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        hasFillet: (from.FilletRadius !== null),
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        depth: from.Depth,
        width: (from.Width !== null) ? from.Width : 0,
        thickness: from.Thickness,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
        legSlope: (from.LegSlope !== null) ? from.LegSlope : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getLShapeCurve(paramsGetLShapeCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts a T-shape curve from an IFC T-shape profile definition.
   *
   * @param from The IFC T-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the T-shape curve,
   * or undefined if not extractable.
   */
  extractTShapeCurve(from: IfcTShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetTShapeCurve: ParamsGetTShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        hasFillet: (from.FilletRadius !== null),
        depth: from.Depth,
        width: from.FlangeWidth,
        webThickness: from.WebThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        flangeEdgeRadius: (from.FlangeEdgeRadius !== null) ? from.FlangeEdgeRadius : 0,
        flangeScope: (from.FlangeSlope !== null) ? from.FlangeSlope : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getTShapeCurve(paramsGetTShapeCurve)
      paramsGetTShapeCurve.placement.delete()
      return ifcCurve


    } else {
      const paramsGetTShapeCurve: ParamsGetTShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        hasFillet: (from.FilletRadius !== null),
        depth: from.Depth,
        width: from.FlangeWidth,
        webThickness: from.WebThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        flangeEdgeRadius: (from.FlangeEdgeRadius !== null) ? from.FlangeEdgeRadius : 0,
        flangeScope: (from.FlangeSlope !== null) ? from.FlangeSlope : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getTShapeCurve(paramsGetTShapeCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts a U-shape curve from an IFC U-shape profile definition.
   *
   * @param from The IFC U-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the U-shape curve,
   *  or undefined if not extractable.
   */
  extractUShapeCurve(from: IfcUShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetUShapeCurve: ParamsGetUShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        depth: from.Depth,
        flangeWidth: from.FlangeWidth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
        flangeScope: (from.FlangeSlope !== null) ? from.FlangeSlope : 0,
      }

      // TODO: Flesh out U Shape Curve, set to 0 for now
      paramsGetUShapeCurve.flangeScope = 0

      const ifcCurve: CurveObject = this.conwayModel.getUShapeCurve(paramsGetUShapeCurve)
      paramsGetUShapeCurve.placement.delete()
      return ifcCurve


    } else {
      const paramsGetUShapeCurve: ParamsGetUShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        depth: from.Depth,
        flangeWidth: from.FlangeWidth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
        flangeScope: (from.FlangeSlope !== null) ? from.FlangeSlope : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getUShapeCurve(paramsGetUShapeCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts a Z-shape curve from an IFC Z-shape profile definition.
   *
   * @param from The IFC Z-shape profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the Z-shape curve,
   *  or undefined if not extractable.
   */
  extractZShapeCurve(from: IfcZShapeProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetZShapeCurve: ParamsGetZShapeCurve = {
        hasPlacement: true,
        placement: placement2D,
        hasFillet: (from.FilletRadius !== null),
        depth: from.Depth,
        flangeWidth: from.FlangeWidth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getZShapeCurve(paramsGetZShapeCurve)
      paramsGetZShapeCurve.placement.delete()
      return ifcCurve


    } else {
      const paramsGetZShapeCurve: ParamsGetZShapeCurve = {
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        hasFillet: (from.FilletRadius !== null),
        depth: from.Depth,
        flangeWidth: from.FlangeWidth,
        webThickness: from.WebThickness,
        flangeThickness: from.FlangeThickness,
        filletRadius: (from.FilletRadius !== null) ? from.FilletRadius : 0,
        edgeRadius: (from.EdgeRadius !== null) ? from.EdgeRadius : 0,
      }

      const ifcCurve: CurveObject = this.conwayModel.getZShapeCurve(paramsGetZShapeCurve)
      return ifcCurve
    }
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractCompositeCurve(from: IfcCompositeCurve,
      parentSense:boolean = true,
      close:boolean = false,
  ): CurveObject | undefined {
    let compositeCurve: CurveObject | undefined
    for (let i = 0; i < from.Segments.length; i++) {
      const parentCurve = from.Segments[i].ParentCurve
      let currentCurveObject

      const sameSense = from.Segments[i].SameSense === parentSense

      if (parentCurve instanceof IfcCompositeCurve) {
        currentCurveObject = this.extractCompositeCurve(parentCurve, true)
      } else {
        currentCurveObject = this.extractCurve(from.Segments[i].ParentCurve, true)
      }

      if (currentCurveObject !== undefined) {

        if ( !sameSense ) {

          currentCurveObject = currentCurveObject.clone()
          currentCurveObject.invert()
        }

        if (i === 0) {
          compositeCurve = currentCurveObject
        } else if (from.Segments[i].Dim === this.TWO_DIMENSIONS) {
          for (let j = 0; j < currentCurveObject.getPointsSize(); ++j) {
            compositeCurve!.add2d(currentCurveObject.get2d(j))
          }
        } else if (from.Segments[i].Dim === this.THREE_DIMENSIONS) {
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
  extractCurve(from: IfcCurve,
      parentSense:boolean = true,
      isEdge:boolean = false,
      trimmingArguments: TrimmingArguments | undefined = void 0): CurveObject | undefined {

    let ifcCurve: CurveObject | undefined

    ifcCurve = this.curves.get( from.localID )

    if ( ifcCurve !== void 0 ) {
      return ifcCurve
    }

    if (from instanceof IfcBSplineCurve) {

      ifcCurve = this.extractBSplineCurve(from, parentSense, isEdge)

      if (trimmingArguments !== void 0) {
        // invert curve
        Logger.info('inverting curve')
        ifcCurve.invert()
      }

      // Logger.info(`Curve type: ${EntityTypesIfc[from.type]} - express ID: ${from.expressID}`)
      /* for (let i = 0; i < ifcCurve.getPointsSize(); ++i) {
        if (from.Degree === 2) {
          const pt_ = ifcCurve.get2d(i)
          Logger.info(`Point ${i}: x: ${pt_.x}, y: ${pt_.y}, z: ${pt_.z}`)
        }
      }*/
    } else if (from instanceof IfcTrimmedCurve) {

      ifcCurve = this.extractIfcTrimmedCurve(from, parentSense)

      if (ifcCurve !== void 0) {

        if (!ifcCurve.isCCW()) {
          ifcCurve.invert()
        }
      }

    } else if (from instanceof IfcPolyline) {

      ifcCurve = this.extractIfcPolyline(from, parentSense, isEdge)

      if (ifcCurve !== void 0) {

        if (trimmingArguments?.exist || !ifcCurve.isCCW() ) {
          ifcCurve.invert()
        }
      }

    } else if (from instanceof IfcIndexedPolyCurve) {
      ifcCurve = this.extractIndexedPolyCurve(from)

      if (ifcCurve !== void 0) {
        if (!ifcCurve.isCCW()) {
          ifcCurve.invert()
        }
      }
    } else if (from instanceof IfcCircle) {

      ifcCurve = this.extractIfcCircle(from, parentSense)

      if (ifcCurve !== void 0) {
        if (!ifcCurve.isCCW()) {
          ifcCurve.invert()
        }
      }
    } else if (from instanceof IfcCompositeCurve) {

      ifcCurve = this.extractCompositeCurve(from, parentSense)

      if (ifcCurve !== void 0) {
        if (!ifcCurve.isCCW()) {
          ifcCurve.invert()
        }
      }
    }

    if ( ifcCurve === void 0 ) {
      Logger.warning(`Unsupported Curve! Type: ${EntityTypesIfc[from.type]}`)
      return
    }

    this.curves.add( from.localID, ifcCurve )

    return ifcCurve
  }

  /**
   * Exctact a BSpline Curve
   *
   * @param from The bspline curve, potentially with knots/rational.
   * @return {CurveObject} The constructed curve object.
   */
  extractBSplineCurve(from: IfcBSplineCurve,
      parentSense:boolean = true,
      isEdge:boolean = false,
  ): CurveObject {

    // Logger.info(`express ID: ${from.expressID} degree === ${from.Degree}`)

    // degree is NOT dimensions (NC)
    let dimensions: number = 3
    if (from.ControlPointsList.length > 0) {
      dimensions = from.ControlPointsList[0].Dim
    }

    const params: ParamsGetBSplineCurve = {
      dimensions: dimensions,
      degree: from.Degree,
      points2: this.nativeVectorGlmdVec2(),
      points3: this.nativeVectorGlmdVec3(),
      knots: this.conwayModel.nativeVectorDouble(),
      weights: this.conwayModel.nativeVectorDouble(),
      senseAgreement: parentSense,
      isEdge: isEdge,
    }

    // eslint-disable-next-line no-magic-numbers
    if (dimensions === 2) {

      const outputPoints = params.points2

      for (const point of from.ControlPointsList) {

        const coords = point.Coordinates

        outputPoints.push_back({ x: coords[0], y: coords[1] })
      }

    } else {

      const outputPoints = params.points3
      // Logger.info(`express ID: ${from.expressID} controlPointsList: ${from.ControlPointsList}`)
      for (const point of from.ControlPointsList) {

        // eslint-disable-next-line no-magic-numbers
        if (point.Dim !== 3) {
          continue
        }

        const coords = point.Coordinates

        // Logger.info(`express ID: ${from.expressID} -  coords: ${coords}`)

        outputPoints.push_back({ x: coords[0], y: coords[1], z: coords[2] })
      }

    }

    if (from instanceof IfcBSplineCurveWithKnots) {
      const knots = params.knots

      for (let knotIndex = 0; knotIndex < from.Knots.length; ++knotIndex) {
        const knot = from.Knots[knotIndex]

        for (let knotMultiplicityIndex = 0;
          knotMultiplicityIndex < from.KnotMultiplicities[knotIndex]; ++knotMultiplicityIndex) {
          knots.push_back(knot)
        }
      }

      if (from instanceof IfcRationalBSplineCurveWithKnots) {

        const outputWeights = params.weights

        for (const weight of from.WeightsData) {

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
    } else {
      // This is just a IfcBsplineCurve, build default parameter lists
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

    const curveObject = this.conwayModel.getBSplineCurve(params)


    return curveObject
  }


  /* eslint-disable default-param-last */
  /**
   * Extract a IfcLine curve
   *
   * @param from - IfcLine
   * @param parentSense - sense agreement
   * @param isEdge - is curve an edge curve
   * @param parametersTrimmedCurve - trimmed curve parameters
   * @return {CurveObject} The constructed curve object.
   */
  extractIfcLine(from:IfcLine,
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

    const cartesianPointArray =  from.Pnt.Coordinates


    if (from.Dim === this.TWO_DIMENSIONS) {
      cartesianPoint2D = {
        x: cartesianPointArray[0],
        y: cartesianPointArray[1],
      }
    } else if (from.Dim === this.THREE_DIMENSIONS) {
      cartesianPoint3D = {
        x: cartesianPointArray[0],
        y: cartesianPointArray[1],
        z: cartesianPointArray[2],
      }
    }

    const vectorDirectionRatios = from.Dir.Orientation.DirectionRatios

    vectorOrientation = {
      x: vectorDirectionRatios[0],
      y: vectorDirectionRatios[1],
      z: vectorDirectionRatios[2],
    }

    const vectorMagnitude = from.Dir.Magnitude

    const parametersIfcCircle: ParamsGetIfcLine = {
      dimensions: from.Dim,
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

    const curve: CurveObject = this.conwayModel.getIfcLine(parametersIfcCircle)

    return curve
  }
  /* eslint-enable default-param-last */


  /* eslint-disable default-param-last */
  /**
   *
   * @param from
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined}
   */
  extractIfcCircle(from: IfcCircle,
      parentSense:boolean = true,
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

    let axis2Placement2D: any = void 0 // glmdmat3
    let axis2Placement3D: any = void 0 // glmdmat4
    if (from.Position instanceof IfcAxis2Placement2D) {
      axis2Placement2D = this.extractAxis2Placement2D(from.Position)
      axis2Placement3D = (new (this.wasmModule.Glmdmat4)) as any
    } else {
      axis2Placement3D = this.conwayModel.getAxis2Placement3D(
          this.extractAxis2Placement3D(from.Position, from.localID, true) )
      axis2Placement2D = (new (this.wasmModule.Glmdmat3)) as any
    }

    const radius = from.Radius
    const parametersIfcCircle: ParamsGetIfcCircle = {
      dimensions: from.Dim,
      axis2Placement2D: axis2Placement2D,
      axis2Placement3D: axis2Placement3D,
      radius: radius,
      radius2: radius,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
    }


    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    const curve: CurveObject = this.conwayModel.getIfcCircle(parametersIfcCircle)

    return curve
  }

  /* eslint-enable default-param-last */

  /* eslint-disable default-param-last */
  /**
   *
   * @param from
   * @param parametersTrimmedCurve
   * @return {CurveObject | undefined}
   */
  extractIfcEllipse(from: IfcEllipse,
      parentSense:boolean = true,
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

    let axis2Placement2D: any = void 0 // glmdmat3
    let axis2Placement3D: any = void 0 // glmdmat4
    if (from.Position instanceof IfcAxis2Placement2D) {
      axis2Placement2D = this.extractAxis2Placement2D(from.Position)
      axis2Placement3D = (new (this.wasmModule.Glmdmat4)) as any
    } else {
      axis2Placement3D = this.conwayModel.getAxis2Placement3D(
          this.extractAxis2Placement3D(from.Position, from.localID, true) )
      axis2Placement2D = (new (this.wasmModule.Glmdmat3)) as any
    }

    const parametersIfcCircle: ParamsGetIfcCircle = {
      dimensions: from.Dim,
      axis2Placement2D: axis2Placement2D,
      axis2Placement3D: axis2Placement3D,
      radius: from.SemiAxis1,
      radius2: from.SemiAxis2,
      paramsGetIfcTrimmedCurve: parametersTrimmedCurve,
    }


    parametersTrimmedCurve.trim1Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim1Cartesian3D ??= { x: 0, y: 0, z: 0 }
    parametersTrimmedCurve.trim2Cartesian2D ??= { x: 0, y: 0 }
    parametersTrimmedCurve.trim2Cartesian3D ??= { x: 0, y: 0, z: 0 }

    const curve: CurveObject = this.conwayModel.getIfcCircle(parametersIfcCircle)

    return curve
  }

  /* eslint-enable default-param-last */

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractIfcTrimmedCurve(from: IfcTrimmedCurve,
      parentSense:boolean = true,
      isEdge:boolean = false,
  ): CurveObject | undefined {

    let trim1Cartesian2D: Vector2 = { x: 0, y: 0 }
    let trim1Cartesian3D: Vector3 = { x: 0, y: 0, z: 0 }
    let trim1Double: number = 0
    let trim2Cartesian2D: Vector2 = { x: 0, y: 0 }
    let trim2Cartesian3D: Vector3 = { x: 0, y: 0, z: 0 }
    let trim2Double: number = 0

    // use Cartesian if unspecified
    if (from.MasterRepresentation === IfcTrimmingPreference.CARTESIAN ||
      from.MasterRepresentation === IfcTrimmingPreference.UNSPECIFIED) {
      for (let trimIndex = 0; trimIndex < from.Trim1.length; trimIndex++) {
        const trim1 = from.Trim1[trimIndex]
        if (trim1 instanceof IfcCartesianPoint) {

          if (from.Dim === this.TWO_DIMENSIONS) {
            trim1Cartesian2D = {
              x: trim1.Coordinates[0],
              y: trim1.Coordinates[1],
            }
          } else if (from.Dim === this.THREE_DIMENSIONS) {
            trim1Cartesian3D = {
              x: trim1.Coordinates[0],
              y: trim1.Coordinates[1],
              z: trim1.Coordinates[2],
            }
          }

          break
        }
      }

      for (let trimIndex = 0; trimIndex < from.Trim2.length; trimIndex++) {
        const trim2 = from.Trim2[trimIndex]
        if (trim2 instanceof IfcCartesianPoint) {

          if (from.Dim === this.TWO_DIMENSIONS) {
            trim2Cartesian2D = {
              x: trim2.Coordinates[0],
              y: trim2.Coordinates[1],
            }
          } else if (from.Dim === this.THREE_DIMENSIONS) {
            trim2Cartesian3D = {
              x: trim2.Coordinates[0],
              y: trim2.Coordinates[1],
              z: trim2.Coordinates[2],
            }
          }

          break
        }
      }
    } else {
      // use parameter value
      for (let trimIndex = 0; trimIndex < from.Trim1.length; trimIndex++) {
        const trim1 = from.Trim1[trimIndex]
        if (trim1 instanceof IfcParameterValue) {
          trim1Double = trim1.Value
          break
        }
      }

      for (let trimIndex = 0; trimIndex < from.Trim2.length; trimIndex++) {
        const trim2 = from.Trim2[trimIndex]
        if (trim2 instanceof IfcParameterValue) {
          trim2Double = trim2.Value
          break
        }
      }
    }


    const paramsGetIfcTrimmedCurve: ParamsGetIfcTrimmedCurve = {
      masterRepresentation: from.MasterRepresentation.valueOf(),
      dimensions: from.Dim,
      senseAgreement: from.SenseAgreement,
      trim1Cartesian2D: trim1Cartesian2D,
      trim1Cartesian3D: trim1Cartesian3D,
      trim1Double: trim1Double,
      trim2Cartesian2D: trim2Cartesian2D,
      trim2Cartesian3D: trim2Cartesian3D,
      trim2Double: trim2Double,
      trimExists: true,
    }

    const basisCurve = from.BasisCurve

    if (basisCurve instanceof IfcCircle) {
      const curveObject =
      this.extractIfcCircle(basisCurve, parentSense, paramsGetIfcTrimmedCurve)

      if (curveObject !== void 0) {
        return curveObject
      }
    } else if (basisCurve instanceof IfcLine) {
      const curveObject =
      this.extractIfcLine(basisCurve, parentSense, isEdge, paramsGetIfcTrimmedCurve)

      if (curveObject !== void 0) {
        return curveObject
      }
    } else if (basisCurve instanceof IfcEllipse) {
      const curveObject =
      this.extractIfcEllipse(basisCurve, parentSense, paramsGetIfcTrimmedCurve)

      if (curveObject !== void 0) {
        return curveObject
      }
    } else {
      Logger.warning(`Unsupported basis curve type: ${  EntityTypesIfc[basisCurve.type]}`)
    }

    return undefined
  }

  /**
   * Efficiently flatten the points into a Float32Array
   *
   * @param points - Array of IfcCartesianPoint
   * @param dimensions - dimensions of points
   * @return {Float32Array}
   */
  flattenPointsToFloat32Array(points: IfcCartesianPoint[], dimensions:number): Float32Array {
    const totalCoordinates = points.length * dimensions
    const flatCoordinates = new Float32Array(totalCoordinates)

    let offset = 0
    points.forEach((point) => {
      flatCoordinates.set(point.Coordinates, offset)
      offset += point.Coordinates.length // move the offset by the number of coordinates
    })

    return flatCoordinates
  }


  /**
   *
   * @param from
   * @return {CurveObject | undefined }
   */
  extractIfcPolyline(from: IfcPolyline,
      parentSense:boolean = true,
      isEdge:boolean = false,
  ): CurveObject | undefined {
    const points = from.Points
    const pointsLength = from.Points.length
    const dim = from.Dim

    if (pointsLength > 0) {
      const pointsFlattened = this.flattenPointsToFloat32Array(points, dim)

      const pointsPtr = this.arrayToWasmHeap(pointsFlattened)

      const parameters = this.paramsGetPolyCurvePool!.acquire()

      parameters.points = pointsPtr
      parameters.pointsLength = pointsLength
      parameters.dimensions = dim
      parameters.senseAgreement = parentSense
      parameters.isEdge = isEdge

      const curve = this.conwayModel.getPolyCurve(parameters)

      this.paramsGetPolyCurvePool!.release(parameters)

      this.wasmModule._free(pointsPtr)

      return curve
    }
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractRectangleCurve(from: IfcRectangleProfileDef |
    IfcRectangleHollowProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetCircleCurve: ParamsGetRectangleProfileCurve = {
        xDim: from.XDim,
        yDim: from.YDim,
        hasPlacement: true,
        matrix: placement2D,
        thickness: (from instanceof IfcRectangleHollowProfileDef) ? from.WallThickness : -1,
      }

      const ifcCurve: CurveObject = this.conwayModel.getRectangleProfileCurve(paramsGetCircleCurve)
      return ifcCurve

    } else {
      const paramsGetCircleCurve: ParamsGetRectangleProfileCurve = {
        xDim: from.XDim,
        yDim: from.YDim,
        hasPlacement: false,
        matrix: (new (this.wasmModule.Glmdmat3)),
        thickness: (from instanceof IfcRectangleHollowProfileDef) ? from.WallThickness : -1,
      }

      const ifcCurve: CurveObject = this.conwayModel.getRectangleProfileCurve(paramsGetCircleCurve)

      paramsGetCircleCurve.matrix.delete()
      return ifcCurve
    }
  }

  /**
   *
   * @param from
   * @return {CurveObject | undefined}
   */
  extractRectangleHollowHoleCurve(from: IfcRectangleHollowProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetCircleCurve: ParamsGetRectangleProfileCurve = {
        xDim: from.XDim,
        yDim: from.YDim,
        hasPlacement: true,
        matrix: placement2D,
        thickness: from.WallThickness,
      }

      const ifcCurve: CurveObject =
        this.conwayModel.getRectangleHollowProfileHole(paramsGetCircleCurve)
      return ifcCurve

    } else {
      const paramsGetCircleCurve: ParamsGetRectangleProfileCurve = {
        xDim: from.XDim,
        yDim: from.YDim,
        hasPlacement: false,
        matrix: (new (this.wasmModule.Glmdmat3)),
        thickness: from.WallThickness,
      }

      const ifcCurve: CurveObject =
        this.conwayModel.getRectangleHollowProfileHole(paramsGetCircleCurve)

      paramsGetCircleCurve.matrix.delete()
      return ifcCurve
    }
  }


  /**
   * Extract a curve object from a circle profile.
   *
   * @param from The circle definition to extract from.
   * @return {CurveObject | undefined} The extracted circle curve,
   * or undefined if one cannot be extracted.
   */
  extractCircleCurve(from: IfcCircleProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.Radius,
        hasPlacement: true,
        placement: placement2D,
        thickness: -1,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCircleCurve(paramsGetCircleCurve)
      return ifcCurve

    } else {
      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.Radius,
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        thickness: -1,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCircleCurve(paramsGetCircleCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts the curve for a circle with a hollow hole from an
   * IFC circle hollow profile definition.
   *
   * @param from The IFC circle hollow profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the hollow circle curve.
   */
  extractCircleHollowHoleCurve(from: IfcCircleHollowProfileDef) {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.Radius,
        hasPlacement: true,
        placement: placement2D,
        thickness: from.WallThickness,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCircleHoleCurve(paramsGetCircleCurve)
      return ifcCurve
    } else {
      const paramsGetCircleCurve: ParamsGetCircleCurve = {
        radius: from.Radius,
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        thickness: from.WallThickness,
      }

      const ifcCurve: CurveObject = this.conwayModel.getCircleHoleCurve(paramsGetCircleCurve)
      return ifcCurve
    }
  }

  /**
   * Extracts the curve for an ellipse from an IFC ellipse profile definition.
   *
   * @param from The IFC ellipse profile definition to extract the curve from.
   * @return {CurveObject} A CurveObject representing the ellipse curve,
   *  or undefined if not extractable.
   */
  extractEllipseProfileCurve(from: IfcEllipseProfileDef): CurveObject | undefined {
    if (from.Position !== null) {
      const placement2D = this.extractAxis2Placement2D(from.Position)

      const paramsGetEllipseCurve: ParamsGetEllipseCurve = {
        radiusX: from.SemiAxis1,
        radiusY: from.SemiAxis2,
        hasPlacement: true,
        placement: placement2D,
        circleSegments: this.circleSegments,
      }

      const ifcCurve: CurveObject = this.conwayModel.getEllipseCurve(paramsGetEllipseCurve)
      return ifcCurve
    } else {
      const paramsGetEllipseCurve: ParamsGetEllipseCurve = {
        radiusX: from.SemiAxis1,
        radiusY: from.SemiAxis2,
        hasPlacement: false,
        placement: this.identity2DNativeMatrix,
        circleSegments: this.circleSegments,
      }

      const ifcCurve: CurveObject = this.conwayModel.getEllipseCurve(paramsGetEllipseCurve)
      return ifcCurve
    }
  }

  /**
   * Extract an indexed poly curve and turn it into a curve object.
   *
   * @param from - IfcIndexedPolyCurve to process
   * @return {CurveObject | undefined} The extracted curve or undefined if it
   * can't be extracted.
   */
  extractIndexedPolyCurve(from: IfcIndexedPolyCurve): CurveObject | undefined {

    if (from.Points instanceof IfcCartesianPointList3D) {
      Logger.error('IfcCartesianPointList3D not supported in IfcIndexedPolycurve.')
      return
    }

    // initialize new segment vector
    const segmentVector = this.nativeSegmentVector()

    if (from.Segments !== null) {

      for (let i = 0; i < from.Segments.length; i++) {

        const indexArray = this.createAndPopulateNativeIndices(from.Segments[i].Value)

        const segment: Segment = {
          isArcType: (from.Segments[i].type === EntityTypesIfc.IFCARCINDEX),
          indices: indexArray,
        }

        segmentVector.push_back(segment)
      }
    }

    const fromPoints = from.Points

    if ( fromPoints === null ) {
      return
    }

    // initialize new native glm::vec3 array object (free memory with delete())
    const pointsArray = this.nativeVectorGlmVec2((fromPoints as any).CoordList.length)

    if ( fromPoints instanceof IfcCartesianPointList2D ||
       fromPoints instanceof IfcCartesianPointList3D ) {

      const coords = fromPoints.CoordList
      // populate points array
      for (let i = 0; i < coords.length; i++) {

        const coord = coords[ i ]

        pointsArray.set(i, { x: coord[ 0 ], y: coord[ 1 ] })
      }
    }

    const paramsGetIndexedPolyCurve: ParamsGetIfcIndexedPolyCurve = {
      dimensions: 2,
      segments: segmentVector,
      points: pointsArray,
    }

    const ifcCurve: CurveObject = this.conwayModel.getIndexedPolyCurve(paramsGetIndexedPolyCurve)

    segmentVector.delete()

    return ifcCurve

  }

  /**
   * Extract a mapped item to add its transform to instance an item.
   *
   * @param from The mapped item to extract.
   */
  extractMappedItem(
      from: IfcMappedItem,
      owningElement: IfcProduct,
      isRelVoid: boolean = false,
      isSpace: boolean = false,
      parents: IfcMappedItem[] | undefined = void 0 ) {

    const representationMap = from.MappingSource
    const mappingTarget = from.MappingTarget

    let popTransform = false

    if (mappingTarget instanceof IfcCartesianTransformationOperator3D) {

      const nativeCartesianTransform =
        this.extractCartesianTransformOperator3D(mappingTarget)

      this.scene.addTransform(
          from.localID,
          nativeCartesianTransform.getValues(),
          nativeCartesianTransform,
          true)

      popTransform = true
    }

    let relVoidsMeshVector: NativeVectorGeometry | undefined
    let relVoidLocalIDs: number[] | undefined

    if (isRelVoid) {

      const extractRelVoidsResult = this.extractRelVoids(owningElement)

      if (extractRelVoidsResult !== void 0) {

        [relVoidsMeshVector, relVoidLocalIDs] = extractRelVoidsResult
      }
    }

    for (const representationItem of representationMap.MappedRepresentation.Items) {

      if ( representationItem instanceof IfcMappedItem ) {

        this.extractMappedItem(
            representationItem,
            owningElement,
            isRelVoid,
            isSpace,
            parents !== void 0 ? [from, ...parents] : [from] )

      } else {

        this.extractRepresentationItem(representationItem,
            owningElement.localID,
            isRelVoid,
            isSpace,
            true)

        const styledItemLocalID =
          this.materials.styledItemMap.get(representationItem.localID) ??
          this.extractMaterialStyle(owningElement)

        let materialOverrideID: number | undefined = void 0

        if (styledItemLocalID !== undefined) {

          const styledItem = this.model.getElementByLocalID(styledItemLocalID) as IfcStyledItem

          this.extractStyledItem(styledItem)

        } else {
          // get material from parent
          let styledItemParentLocalID = this.materials.styledItemMap.get(from.localID)
          let styleParent = from

          if ( parents !== void 0 ) {
            for ( const parent of parents ) {
              if ( styledItemParentLocalID !== void 0 ) {
                break
              }

              styledItemParentLocalID = this.materials.styledItemMap.get(parent.localID)
              styleParent = parent
            }
          }

          if (styledItemParentLocalID !== void 0 ) {

            const styledItemParent =
              this.model.getElementByLocalID(styledItemParentLocalID) as IfcStyledItem

            this.extractStyledItem(styledItemParent, styleParent)

            materialOverrideID = styleParent.localID
          }
        }

        if ( isRelVoid ) {
          this.applyRelVoidToRepresentation(
              representationItem,
              relVoidsMeshVector!,
              owningElement.localID,
              relVoidLocalIDs!,
              materialOverrideID,
              isSpace)
        } else {
          this.scene.addGeometry(
              representationItem.localID,
              owningElement.localID,
              isSpace,
              materialOverrideID)
        }
      }
    }

    relVoidsMeshVector?.delete()

    if (popTransform) {

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
  extractRepresentationItem(from: IfcRepresentationItem,
      owningElementLocalID?: number,
      isRelVoid: boolean = false,
      isSpace: boolean = false,
      isMappedItem: boolean = false) {

    const addGeometry = !isRelVoid && !isMappedItem

    let foundGeometry

    if (!isRelVoid) {
      foundGeometry = this.model.geometry.getByLocalID(from.localID)
    } else {
      foundGeometry = this.model.voidGeometry.getByLocalID(from.localID)
    }

    if (foundGeometry !== void 0) {

      if (addGeometry) {
        this.scene.addGeometry(from.localID, owningElementLocalID, isSpace)
      }
      return
    }

    if (from instanceof IfcMappedItem) {

      // mapped items are handled separately.
      return
    } else if (from instanceof IfcPolygonalFaceSet) {

      const faceSetResult: ExtractResult =
        this.extractPolygonalFaceSet(from, false, isRelVoid)

      if (faceSetResult !== ExtractResult.COMPLETE) {
        Logger.warning(`Face set express ID: ${from.expressID} extraction incomplete.`)
      }

    } else if (from instanceof IfcTriangulatedFaceSet) {

      this.extractTriangulatedFaceSet(from, false, isRelVoid)

    } else if (from instanceof IfcBooleanResult) {

      // also handles IfcBooleanClippingResult
      this.extractBooleanResult(from, isRelVoid)

    } else if (from instanceof IfcExtrudedAreaSolid) {

      this.extractExtrudedAreaSolid(from, false, isRelVoid)

    } else if (from instanceof IfcPolygonalBoundedHalfSpace) {

      this.extractPolygonalBoundedHalfSpace(from, false, isRelVoid)

    } else if (from instanceof IfcHalfSpaceSolid) {

      this.extractHalfspaceSolid(from, false, isRelVoid)

    } else if (from instanceof IfcSweptDiskSolid) {
      this.extractSweptDiskSolid(from, false, isRelVoid)
    } else if (from instanceof IfcFacetedBrep) {

      this.extractIfcFacetedBrep(from, false, isRelVoid)

    } else if (from instanceof IfcShellBasedSurfaceModel) {

      this.extractIfcShellBasedSurfaceModel(from, owningElementLocalID, isRelVoid)

    } else if (from instanceof IfcBoundingBox || from instanceof IfcPolyline) {
      // These types aren't meshes.
      return
    } else if (from instanceof IfcFaceBasedSurfaceModel) {

      this.extractIfcFaceBasedSurfaceModel(from, isRelVoid)

    } else if (from instanceof IfcAdvancedBrep) {

      this.extractIfcAdvancedBrep(from, isRelVoid)

    } else {
      Logger.warning(`Unsupported type: ${EntityTypesIfc[from.type]} ` +
      `expressID: ${from.expressID}`)
    }

    if (addGeometry) {
      this.scene.addGeometry(from.localID, owningElementLocalID, isSpace)
    }
  }

  /**
   * Extract an advanced b-rep (NURBS)
   *
   * @param from The brep to extract
   * @param isRelVoid Is this b-rep a relative void?
   */
  public extractIfcAdvancedBrep(from: IfcAdvancedBrep, isRelVoid: boolean) {
    const faces = from.Outer.CfsFaces

    this.extractFaces(faces, from.localID, void 0, false, isRelVoid)
  }

  /**
   *
   * @param from array of IfcConnectedFaceSet
   * @param isRelVoid is from a relative void (default false)
   * @param parentLocalID parent element local ID
   */
  extractConnectedFaceSets(from: IfcConnectedFaceSet[],
      parentLocalID: number,
      isRelVoid: boolean = false) {

    let geometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

    for (let faceSetIndex = 0; faceSetIndex < from.length; ++faceSetIndex) {
      const faceSet: IfcConnectedFaceSet = from[faceSetIndex]

      geometry = this.extractFaces(faceSet.CfsFaces, faceSet.localID, geometry, isRelVoid)
    }

    const canonicalMesh: CanonicalMesh = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      geometry: geometry,
      localID: parentLocalID,
      model: this.model,
      temporary: false,
    }

    // add mesh to the list of mesh objects
    if (!isRelVoid) {
      this.model.geometry.add(canonicalMesh)
    } else {
      this.model.voidGeometry.add(canonicalMesh)
    }
  }


  /**
   *
   * @param from
   * @param isRelVoid
   */
  extractIfcFaceBasedSurfaceModel(from: IfcFaceBasedSurfaceModel, isRelVoid: boolean = false) {
    const fbsmFaces = from.FbsmFaces

    this.extractConnectedFaceSets(fbsmFaces, from.localID, isRelVoid)
  }

  /**
   *
   * @param from
   */
  extractIfcFacetedBrep(from: IfcFacetedBrep,
      temporary: boolean = false, isRelVoid: boolean = false) {
    const faces = from.Outer.CfsFaces

    this.extractFaces(faces, from.localID, void 0, temporary, isRelVoid)
  }


  /**
   *
   * @param from
   */
  extractIfcShellBasedSurfaceModel(
      from: IfcShellBasedSurfaceModel,
      owningElementLocalID?: number,
      isRelVoid: boolean = false,
      isSpace: boolean = false ) {
    const sbsmBoundary = from.SbsmBoundary

    for ( const currentBoundary of sbsmBoundary ) {
      const faces = currentBoundary.CfsFaces

      this.extractFaces(faces, currentBoundary.localID, undefined, false, isRelVoid)

      if (!isRelVoid) {
        this.scene.addGeometry(currentBoundary.localID, owningElementLocalID, isSpace, from.localID)
      }
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
  extractFaces(from: IfcFace[],
      parentLocalID: number,
      geometry_?: GeometryObject | undefined,
      temporary: boolean = false,
      isRelVoid: boolean = false): GeometryObject {

    let passedGeometry: boolean = true
    if (geometry_ === void 0) {
      passedGeometry = false
      geometry_ = (new (this.wasmModule.IfcGeometry)) as GeometryObject
    }

    for (const face of from) {

      if (face instanceof IfcAdvancedFace) {

        this.extractAdvancedFace(face, geometry_)

      } else {

        this.extractFace(face, geometry_)
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

      // add mesh to the list of mesh objects
      if (!isRelVoid) {
        this.model.geometry.add(canonicalMesh)
      } else {

        this.model.voidGeometry.add(canonicalMesh)
      }
    }

    return geometry_
  }

  /**
   * Extract an IFC plane.
   *
   * @param from The plane to extract from
   * @return {NativeTransform4x4} The transform matching the plane.
   */
  extractPlane(from: IfcPlane): NativeTransform4x4 {

    const location = from.Position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    return this.conwayModel.getAxis2Placement3D(transform)
  }

  /**
   * Extract a pointlist to a native vector.
   *
   * @param from
   * @return {StdVector< Vector3 >} The native vector of 3D vectors.
   */
  extractPointList3D(from: Array<IfcCartesianPoint>): StdVector<Vector3> {

    const result = this.nativeVectorGlmdVec3()

    for (const point of from) {

      const coords = point.Coordinates


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
      from: Array<Array<IfcCartesianPoint>>,
      to: StdVector<StdVector<Vector3>>): void {

    for (const list of from) {
      to.push_back(this.extractPointList3D(list))
    }
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface}
   */
  extractBSplineSurface(from: IfcBSplineSurface): BSplineSurface {

    const bsplineSurface: BSplineSurface = {
      active: true,
      uDegree: from.UDegree,
      vDegree: from.VDegree,
      closedU: from.UClosed ?? false,
      closedV: from.VClosed ?? false,
      controlPoints: this.nativeVectorVectorGlmdVec3(),
      uMultiplicity: this.conwayModel.nativeVectorDouble(),
      vMultiplicity: this.conwayModel.nativeVectorDouble(),
      uKnots: this.conwayModel.nativeVectorDouble(),
      vKnots: this.conwayModel.nativeVectorDouble(),
      weightPoints: this.conwayModel.nativeVectorVectorDouble(),
    }

    this.extractPointListList3D(from.ControlPointsList, bsplineSurface.controlPoints)

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

    to.resize(end - start, 0)

    for (let where = start; where < end; ++where) {
      to.set(where - start, from[where])
    }
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @param to The surface to extract to
   */
  extractToDoubleVectorVector(
      from: Array<Array<number>>,
      to: StdVector<StdVector<number>>): void {

    this.wasmModule.resizeVectorVectorDouble(to, from.length)

    // to.resize(from.length)

    for (let where = 0, end = from.length; where < end; ++where) {

      this.extractToDoubleVector(from[where], to.get(where))
    }
  }


  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface}
   */
  extractBSplineSurfaceWithKnots(from: IfcBSplineSurfaceWithKnots): BSplineSurface {

    const result = this.extractBSplineSurface(from)

    // Logger.info(`selfIntersect: ${from.SelfIntersect}` ? 'True' : 'False')
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


    this.extractToDoubleVector(from.UMultiplicities, result.uMultiplicity)
    this.extractToDoubleVector(from.VMultiplicities, result.vMultiplicity)
    this.extractToDoubleVector(from.UKnots, result.uKnots)
    this.extractToDoubleVector(from.VKnots, result.vKnots)

    return result
  }

  /**
   * Extract a bspline surface
   *
   * @param from The bspline surface to extract
   * @return {BSplineSurface} The extracted surface
   */
  extractRationalBSplineSurfaceWithKnots(
      from: IfcRationalBSplineSurfaceWithKnots): BSplineSurface {

    const result = this.extractBSplineSurfaceWithKnots(from)

    this.extractToDoubleVectorVector(from.WeightsData, result.weightPoints)

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
   */
  extractAdvancedFace(from: IfcAdvancedFace, geometry: GeometryObject) {

    if (from.Bounds.length > 0) {

      const bound3DVector = this.nativeBound3DVector()

      for (const bound of from.Bounds) {
        const vec3Array = this.nativeVectorGlmdVec3()

        const innerBound = bound.Bound
        const nativeEdgeCurves = this.nativeVectorCurve()

        if (innerBound instanceof IfcPolyLoop) {

          let prevLocalID: number = -1

          for ( const point of innerBound.Polygon ) {

            const coords = point.Coordinates
            const vec3 = {
              x: coords[0],
              y: coords[1],
              z: coords[2],
            }

            const currentLocalID: number = point.localID

            if ( currentLocalID !== prevLocalID ) {
              vec3Array.push_back(vec3)
              prevLocalID = currentLocalID
            }
          }
        } else if (innerBound instanceof IfcEdgeLoop) {
          // Logger.info("innerBound Ne: " + innerBound.Ne)
          for (const edge of innerBound.EdgeList) {
            // //  Logger.info("IfcOrientedEdge expressID: " + edge.expressID)
            if (edge.EdgeElement instanceof IfcEdgeCurve) {

              const edgeCurve = edge.EdgeElement.EdgeGeometry

              //  Logger.info("curve type: " +
              // EntityTypesIfc[edgeCurve.type] + " express ID: " + edgeCurve.expressID)

              const edgeStart = edge.EdgeElement.EdgeStart
              const edgeEnd = edge.EdgeElement.EdgeEnd

              let trimmingStart: TrimmingSelect | undefined
              let trimmingEnd: TrimmingSelect | undefined

              if (edgeStart instanceof IfcVertexPoint) {

                const startPoint = edgeStart.VertexGeometry

                // eslint-disable-next-line no-magic-numbers
                if (startPoint instanceof IfcCartesianPoint && startPoint.Dim === 3) {

                  const startCoords = startPoint.Coordinates

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

              if (edgeEnd instanceof IfcVertexPoint) {

                const endPoint = edgeEnd.VertexGeometry

                // eslint-disable-next-line no-magic-numbers
                if (endPoint instanceof IfcCartesianPoint && endPoint.Dim === 3) {

                  const endCoords = endPoint.Coordinates

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

              let curve = this.extractCurve(edgeCurve, true, true, trimmingArguments)

              if (curve !== void 0) {

                if (edge.Orientation) {
                  // reverse curve
                  // Logger.info("edge orientation == true, inverting curve")
                  curve = curve.clone()

                  curve.invert()
                }

                // Logger.info("curve points size: " + curve.getPointsSize())
                /* for (let i = 0; i < curve.getPointsSize(); ++i) {
                  if (edgeCurve.Dim === this.TWO_DIMENSIONS) {
                    const pt__ = curve.get2d(i)

                    //    Logger.info(`[${EntityTypesIfc[edge.type]}]:
                     Point ${i}: x: ${pt__.x}, y: ${pt__.y}`)
                  } else if (edgeCurve.Dim === this.TWO_DIMENSIONS) {
                    const pt__ = curve.get3d(i)

                    //    Logger.info(`[${EntityTypesIfc[edge.type]}]:
                     Point ${i}: x: ${pt__.x}, y: ${pt__.y}, z: ${pt__.z}`)
                  }
                }*/

                nativeEdgeCurves.push_back(curve)
                // Logger.info("nativeEdgeCurves size: " + nativeEdgeCurves.size())

                // Important not to repeat the last point otherwise triangulation fails
                // if the list has zero points this is initial, no repetition is possible,
                // otherwise we must check
                /* if (vec3Array.size() === 0) {
                   for (
                     let where = 0, pointCount = curve.getPointsSize();
                     where < pointCount;
                     ++where) {

                     vec3Array.push_back(curve.get3d(where))
                   }
                 } else {
                   for (
                     let where = 0, pointCount = curve.getPointsSize();
                     where < pointCount;
                     ++where) {

                     const pt3d = curve.get3d(where)
                     if (this.notPresent(pt3d, vec3Array)) {
                       vec3Array.push_back(pt3d)
                     }
                   }
                 }*/

              } else {
                Logger.error(`curve === undefined, type: ${EntityTypesIfc[edgeCurve.type]}`)
              }

            } else {

              //  Logger.info("curve === null")
              const start = edge.EdgeStart

              if (start instanceof IfcVertexPoint) {

                const startPoint = start.VertexGeometry

                // eslint-disable-next-line no-magic-numbers
                if (startPoint instanceof IfcCartesianPoint && startPoint.Dim === 3) {

                  const startCoords = startPoint.Coordinates

                  vec3Array.push_back({
                    x: startCoords[0],
                    y: startCoords[1],
                    z: startCoords[2],
                  })
                }
              }
            }
          }

        } else {
          Logger.warning(`Unsupported bound ${bound.Bound}`)
          return
        }

        // get curve
        const parameters: ParamsGetLoop = {
          points: vec3Array,
          edges: nativeEdgeCurves,
        }

        // Logger.info("isEdgeLoop: " + (isEdgeLoop) ? "TRUE" : "FALSE")
        const curve: CurveObject = this.conwayModel.getLoop(parameters)

        // create bound vector
        const parametersCreateBounds3D: ParamsCreateBound3D = {
          curve: curve,
          orientation: bound.Orientation,
          type: (bound.type === EntityTypesIfc.IFCFACEOUTERBOUND) ? 0 : 1,
        }

        const bound3D: Bound3DObject = this.conwayModel.createBound3D(parametersCreateBounds3D)

        bound3DVector.push_back(bound3D)
        vec3Array.delete()
        nativeEdgeCurves.delete()
      }

      const surface = from.FaceSurface

      // add face to geometry
      const nativeSurface = (new (this.wasmModule.IfcSurface)) as SurfaceObject

      this.extractSurface(surface, nativeSurface)


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
   * Extract a surface
   *
   * @param surface
   * @param nativeSurface
   */
  extractSurface(surface: IfcSurface, nativeSurface:SurfaceObject) {
    if (surface instanceof IfcPlane) {

      nativeSurface.transformation = this.extractPlane(surface)

    } else if (surface instanceof IfcRationalBSplineSurfaceWithKnots) {

      nativeSurface.bspline = this.extractRationalBSplineSurfaceWithKnots(surface)

      if (!nativeSurface.bspline.active) {
        Logger.warning('bspline surface not active, returning')
      }

    } else if (surface instanceof IfcBSplineSurfaceWithKnots) {

      nativeSurface.bspline = this.extractBSplineSurfaceWithKnots(surface)

      if (!nativeSurface.bspline.active) {
        Logger.warning('bspline surface with knots not active, returning')

      }

    } else if (surface instanceof IfcBSplineSurface) {

      nativeSurface.bspline = this.extractBSplineSurface(surface)

      if (!nativeSurface.bspline.active) {
        Logger.warning('bspline surface not active, returning')

      }

    } else if (surface instanceof IfcCylindricalSurface) {

      this.extractCylindricalSurface(surface, nativeSurface)

      if (!nativeSurface.cylinder.active) {
        Logger.warning('cylindrical surface not active, returning')

      }

    } else if (surface instanceof IfcSurfaceOfRevolution) {

      this.extractSurfaceOfRevolution(surface, nativeSurface)

      if (!nativeSurface.revolution.active) {
        Logger.warning('revolution surface not active, returning')

      }

    } else if (surface instanceof IfcSurfaceOfLinearExtrusion) {

      this.extractSurfaceOfLinearExtrusion(surface, nativeSurface)

      if (!nativeSurface.extrusion.active) {
        Logger.warning('linear extrusion surface not active, returning')

      }
    } else {
      Logger.warning(`Unknown surface type: ${surface}`)
    }
  }

  /**
   * Extract a linear extrusion/sweep surface
   *
   * @param from
   * @param nativeSurface
   */
  extractSurfaceOfLinearExtrusion(from: IfcSurfaceOfLinearExtrusion, nativeSurface: SurfaceObject) {

    const profile = this.extractProfile(from.SweptCurve)

    if (profile?.nativeProfile === void 0) {

      Logger.error('Could not get curve profile for linear extrusion surface')
      return
    }

    const directionCoords = from.ExtrudedDirection.DirectionRatios

    nativeSurface.extrusion = {
      active: true,
      length: from.Depth,
      direction: {
        x: directionCoords[0],
        y: directionCoords[1],
        z: directionCoords[2],
      },
      profile: profile?.nativeProfile!,
    }
  }

  /**
   * Extract a surface of revolution/rotational sweep surface
   *
   * @param from
   * @param nativeSurface
   */
  extractSurfaceOfRevolution(from: IfcSurfaceOfRevolution, nativeSurface: SurfaceObject) {

    const sweptCurve = from.SweptCurve

    if (!(sweptCurve instanceof IfcArbitraryOpenProfileDef)) {
      Logger.warning('Unexpected 3D profile type for surface of revolution')
      return
    }

    const profile = this.extractProfile(sweptCurve)

    if (profile === void 0 || profile.curve === void 0) {

      Logger.warning('Missing profile type for surface of revolution')
      return
    }

    const axisDirection = this.extractAxis1Placement3D(from.AxisPosition, from.localID, true)

    nativeSurface.revolution = {
      active: true,
      direction: this.conwayModel.getAxis1Placement3D(axisDirection),
      profile: profile.nativeProfile!,
    }
  }

  /**
   * Extract a cylindrical surface.
   *
   * @param from The IFC object to extract from.
   * @param nativeSurface The native surface representation.
   */
  extractCylindricalSurface(from: IfcCylindricalSurface, nativeSurface: SurfaceObject) {

    const location = from.Position

    const transform =
      this.extractAxis2Placement3D(location, from.localID, true)

    nativeSurface.transformation = this.conwayModel.getAxis2Placement3D(transform)
    nativeSurface.cylinder = { active: true, radius: from.Radius }
  }

  /**
   *
   * @param from
   * @param geometry
   */
  extractFace(from: IfcFace, geometry: GeometryObject) {
    if (from.Bounds.length > 0) {

      const bound3DVector = this.nativeBound3DVector()

      for (let boundIndex = 0; boundIndex < from.Bounds.length; ++boundIndex) {
        const vec3Array = this.nativeVectorGlmdVec3()
        const bound = from.Bounds[boundIndex]

        if (bound.Bound instanceof IfcPolyLoop) {

          let prevLocalID: number = -1

          for (let pointIndex = 0; pointIndex < bound.Bound.Polygon.length; ++pointIndex) {
            const vec3 = {
              x: bound.Bound.Polygon[pointIndex].Coordinates[0],
              y: bound.Bound.Polygon[pointIndex].Coordinates[1],
              z: bound.Bound.Polygon[pointIndex].Coordinates[2],
            }

            const currentLocalID: number = bound.Bound.Polygon[pointIndex].localID
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

        const curve: CurveObject = this.conwayModel.getLoop(parameters)

        // create bound vector
        const parametersCreateBounds3D: ParamsCreateBound3D = {
          curve: curve,
          orientation: bound.Orientation,
          type: (bound.type === EntityTypesIfc.IFCFACEOUTERBOUND) ? 0 : 1,
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
  extractAxis2Placement2D(from: IfcAxis2Placement2D): any {

    let normalizeX: boolean = false

    const refDirection = from.RefDirection

    if (refDirection !== null) {
      normalizeX = true
    }

    const position2D = {
      x: from.Location.Coordinates[0],
      y: from.Location.Coordinates[1],
    }

    const xAxisRef = refDirection !== null ? {
      x: refDirection.DirectionRatios[0],
      y: refDirection.DirectionRatios[1],
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
   * Extracts a 2D Cartesian transformation operator from an IFC Cartesian
   *  transformation operator definition. The transformation can be uniform or non-uniform.
   *
   * @param from The IFC Cartesian transformation operator definition,
   *  which can be either uniform or non-uniform.
   * @return {any} The resulting transformation operator parameters.
   */
  extractCartesianTransformOperator2D(from: IfcCartesianTransformationOperator2D
    | IfcCartesianTransformationOperator2DnonUniform): any {
    let is2DNonUniform: boolean = false
    let scale1: number = 1.0
    let scale2: number = 1.0

    if (from.Scale !== null) {
      scale1 = from.Scale
    }

    if (from instanceof IfcCartesianTransformationOperator2DnonUniform) {
      is2DNonUniform = true
      if (from.Scale2 !== null) {
        scale2 = from.Scale2
      }
    } else {
      scale2 = scale1
    }

    const position: Vector2 = {
      x: from.LocalOrigin.Coordinates[0],
      y: from.LocalOrigin.Coordinates[1],
    }

    const axis1Ref: Vector3 =
      IfcGeometryExtraction.extractDirection(from.Axis1) ?? { x: 1, y: 0, z: 0 }
    const axis2Ref: Vector3 =
      IfcGeometryExtraction.extractDirection(from.Axis2) ?? { x: 0, y: 1, z: 0 }

    const axis2Placement2DParameters: ParamsGetAxis2Placement2D = {
      isAxis2Placement2D: false,
      isCartesianTransformationOperator2D: !is2DNonUniform,
      isCartesianTransformationOperator2DNonUniform: is2DNonUniform,
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
  extractAxis1Placement3D(from: IfcAxis1Placement, parentLocalId: number): void
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
    from: IfcAxis1Placement,
    parentLocalId: number,
    extractOnly: true): ParamsAxis1Placement3D
  // eslint-disable-next-line no-dupe-class-members, require-jsdoc
  extractAxis1Placement3D(
      from: IfcAxis1Placement,
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

    if (from.Axis !== null) {
      normalizeZ = true
    }

    const position = {
      x: from.Location.Coordinates[0],
      y: from.Location.Coordinates[1],
      z: from.Location.Coordinates[2],
    }

    const zAxisRef = {
      x: from.Axis?.DirectionRatios[0] ?? 0,
      y: from.Axis?.DirectionRatios[1] ?? 0,
      z: from.Axis?.DirectionRatios[2] ?? 1,
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
  extractAxis2Placement3D(from: IfcAxis2Placement3D, parentLocalId: number): void
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
    from: IfcAxis2Placement3D,
    parentLocalId: number,
    extractOnly: true): ParamsAxis2Placement3D
  // eslint-disable-next-line no-dupe-class-members, require-jsdoc
  extractAxis2Placement3D(
      from: IfcAxis2Placement3D,
      parentLocalId: number,
      extractOnly: boolean = false): void | ParamsAxis2Placement3D {

    if (from === null) {
      return
    }

    if ( !extractOnly ) {
      const result = this.scene.getTransform(parentLocalId)

      if (result !== void 0) {

        this.scene.pushTransform(result)

        return
      }
    }

    let normalizeZ: boolean = false
    let normalizeX: boolean = false

    if (from.Axis !== null) {
      normalizeZ = true
    }

    if (from.RefDirection !== null) {
      normalizeX = true
    }

    const position = {
      x: from.Location.Coordinates[0],
      y: from.Location.Coordinates[1],
      z: from.Location.Coordinates[2],
    }

    const zAxisRef = {
      x: from.Axis?.DirectionRatios[0] ?? 0,
      y: from.Axis?.DirectionRatios[1] ?? 0,
      z: from.Axis?.DirectionRatios[2] ?? 1,
    }

    const xAxisRef = {
      x: from.RefDirection?.DirectionRatios[0] ?? 1,
      y: from.RefDirection?.DirectionRatios[1] ?? 0,
      z: from.RefDirection?.DirectionRatios[2] ?? 0,
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
   * Extract a placement, adding it to the scene.
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @return {void}
   */
  extractAxis2Placement3DRelVoid(from: IfcAxis2Placement3D, parentLocalId: number): void
  /**
   * Extract a placement (no memoization/scene creation)
   *
   * @param from The transform to extract.
   * @param parentLocalId The parent's local ID.
   * @param extractOnly {true} Only extract, don't memoize and add to the scene
   * @return {ParamsAxis2Placement3D} The extracted placement.
   */
  // eslint-disable-next-line no-dupe-class-members
  extractAxis2Placement3DRelVoid(
    from: IfcAxis2Placement3D,
    parentLocalId: number,
    extractOnly: true): ParamsAxis2Placement3D
  // eslint-disable-next-line no-dupe-class-members, require-jsdoc
  extractAxis2Placement3DRelVoid(
      from: IfcAxis2Placement3D,
      parentLocalId: number,
      extractOnly: boolean = false): void | ParamsAxis2Placement3D {

    if (from === null) {
      return
    }

    const result = this.voidScene.getTransform(parentLocalId)

    if (result !== void 0) {

      this.voidScene.pushTransform(result)

      return
    }

    let normalizeZ: boolean = false
    let normalizeX: boolean = false

    if (from.Axis !== null) {
      normalizeZ = true
    }

    if (from.RefDirection !== null) {
      normalizeX = true
    }

    const position = {
      x: from.Location.Coordinates[0],
      y: from.Location.Coordinates[1],
      z: from.Location.Coordinates[2],
    }

    const zAxisRef = {
      x: from.Axis?.DirectionRatios[0] ?? 0,
      y: from.Axis?.DirectionRatios[1] ?? 0,
      z: from.Axis?.DirectionRatios[2] ?? 1,
    }

    const xAxisRef = {
      x: from.RefDirection?.DirectionRatios[0] ?? 1,
      y: from.RefDirection?.DirectionRatios[1] ?? 0,
      z: from.RefDirection?.DirectionRatios[2] ?? 0,
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

    this.voidScene.addTransform(
        parentLocalId,
        axis2PlacementTransform.getValues(),
        axis2PlacementTransform)
  }

  /**
   *
   * @param from
   */
  extractPlacement(from: IfcObjectPlacement, isRelVoid: boolean = false) {

    let result: IfcSceneTransform | undefined
    if (!isRelVoid) {
      result = this.scene.getTransform(from.localID)
    } else {
      result = this.voidScene.getTransform(from.localID)
    }

    if (result !== void 0) {

      if (!isRelVoid) {
        this.scene.pushTransform(result)
      } else {
        this.voidScene.pushTransform(result)
      }

      return
    }

    if (from instanceof IfcLocalPlacement) {

      const relativeTo = from.PlacementRelTo

      if (relativeTo !== null) {

        this.extractPlacement(relativeTo, isRelVoid)
      }

      const relativePlacement = from.RelativePlacement

      if (relativePlacement instanceof IfcAxis2Placement3D) {

        if (!isRelVoid) {
          this.extractAxis2Placement3D(relativePlacement, from.localID)
        } else {
          this.extractAxis2Placement3DRelVoid(relativePlacement, from.localID)
        }
      }

    } else if (from instanceof IfcGridPlacement) {
      // TODO(nickcastel50) Implement IfcGridPlacement
      // Logger.warning('IfcGridPlacement: unimplemented.')
    }
  }

  /**
   *
   * @param from
   * @param relVoidMeshVector
   * @param flattenedGeometry
   * @param relVoidLocalID
   * @param geometryCount
   */
  applyRelVoidToRepresentation(
      from: IfcRepresentationItem,
      relVoidMeshVector: NativeVectorGeometry,
      owningElementLocalID: number,
      relVoidLocalIDs:number[],
      materialOverrideId?: number,
      isSpace: boolean = false ) {

    // get geometry from product and flatten it
    let flattenedGeometry: GeometryObject | undefined

    const mesh = this.model.voidGeometry.getByLocalID(from.localID)

    const itemTransform = this.scene.currentTransform?.absoluteNativeTransform

    if (mesh !== undefined && mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {

      flattenedGeometry = mesh.geometry.clone()

      if (itemTransform !== void 0) {
        flattenedGeometry.applyTransform(itemTransform)
      }

      if (relVoidMeshVector.size() === 0 ) {
        const canonicalMesh: CanonicalMesh = {
          type: CanonicalMeshType.BUFFER_GEOMETRY,
          geometry: mesh.geometry,
          localID: from.localID,
          model: this.model,
          temporary: false,
        }

        // add mesh to the list of mesh objects
        this.model.geometry.add(canonicalMesh)
        this.scene.addGeometry(from.localID, owningElementLocalID, isSpace, materialOverrideId)

        return
      }

      // flatten the relvoid mesh vector
      /* const relVoidFlattenedMesh = relVoidMeshVector.get(0)

      const _element = this.model.getElementByLocalID(relVoidLocalIDs[0])!
      const _outputFilePath = `${_element.expressID}_${EntityTypesIfc[_element.type]}.obj`
      this.dumpGeometry(_outputFilePath, relVoidFlattenedMesh)

      for (let vectorIndex = 1; vectorIndex < relVoidMeshVector.size(); ++vectorIndex) {
        const _geom = relVoidMeshVector.get(vectorIndex)
        const __element = this.model.getElementByLocalID(relVoidLocalIDs[vectorIndex])!
        const __outputFilePath = `${__element.expressID}_${EntityTypesIfc[__element.type]}.obj`
        this.dumpGeometry(__outputFilePath, _geom)
        relVoidFlattenedMesh.appendGeometry(relVoidMeshVector.get(vectorIndex))
      }


      // set mesh back to vector
      const relVoidMeshVector_ = this.nativeVectorGeometry()
      relVoidMeshVector_.push_back(relVoidFlattenedMesh)*/

      const relatedBuildingElementMeshVector = this.nativeVectorGeometry(1)

      relatedBuildingElementMeshVector.set(0, flattenedGeometry)

      // const element_ = this.model.getElementByLocalID(mesh.localID)!

      // let outputFilePath = `${from.expressID}_${EntityTypesIfc[from.type]}.obj`

      // this.dumpGeometry(outputFilePath, flattenedGeometry)

      // console.log(
      //  "from: ",
      // from.expressID,
      // "to: ",
      // relVoidLocalIDs.map( value => this.model.getElementByLocalID( value )!.expressID ) )

      const parameters: ParamsRelVoidSubtract = {
        flatFirstMesh: relatedBuildingElementMeshVector,
        flatSecondMesh: relVoidMeshVector,
        operatorType: 2,
        parentMatrix: itemTransform ?? this.identity3DNativeMatrix,
      }

      const booleanGeometryObject: GeometryObject = this.conwayModel.relVoidSubtract(parameters)

      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: booleanGeometryObject,
        localID: from.localID,
        model: this.model,
        temporary: false,
      }

      this.model.geometry.add(canonicalMesh)
      this.scene.addGeometry(from.localID, owningElementLocalID, isSpace, materialOverrideId)

      relatedBuildingElementMeshVector.delete()
      // relVoidMeshVector_.delete()
    }
  }
  /**
   *
   * @param from
   * @return {[NativeVectorGeometry, number[]] | undefined}
   */
  extractRelVoids(from: IfcProduct): [NativeVectorGeometry, number[]] | undefined {
    const relVoidLocalIDs: number[] = []
    if (this.productToVoidGeometryMap.has(from.localID)) {
      // product has voids
      const voidsLocalIDMap = this.productToVoidGeometryMap.get(from.localID)
      const relVoidMeshVector = this.nativeVectorGeometry()

      if (voidsLocalIDMap !== void 0) {

        for (const relVoidLocalID of voidsLocalIDMap) {

          this.voidScene.clearParentStack()

          const relVoid =
            this.model.getElementByLocalID(relVoidLocalID) as IfcFeatureElementSubtraction

          const relVoidObjectPlacement = relVoid.ObjectPlacement
          let relVoidPlacementTransform: IfcSceneTransform | undefined

          if (relVoidObjectPlacement !== null) {
            this.extractPlacement(relVoidObjectPlacement, true)
            relVoidPlacementTransform = this.voidScene.getTransform(relVoidObjectPlacement.localID)
          }

          if (relVoid.Representation !== null) {
            for (const representation of relVoid.Representation.Representations) {
              if (representation instanceof IfcShapeRepresentation) {

                // this check is essential -
                // if RepresentationIdentifier !== Body or Facetation we must skip it
                if (representation.RepresentationIdentifier !== 'Body' &&
                  representation.RepresentationIdentifier !== 'Facetation') {
                  continue
                }
              }

              for (const item of representation.Items) {
                // extract geometry here and flatten
                this.extractRepresentationItem(item, undefined, true)
                const mesh = this.model.voidGeometry.getByLocalID(item.localID)
                if (mesh !== undefined && mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
                  const localGeometry = mesh.geometry.clone()


                  if (relVoidPlacementTransform !== void 0) {
                    localGeometry.applyTransform(relVoidPlacementTransform.absoluteNativeTransform)
                  }

                  relVoidMeshVector.push_back(localGeometry)
                  relVoidLocalIDs.push(item.localID)

                }
              }
            }
          }
        }

        return [relVoidMeshVector, relVoidLocalIDs]
      }
    }
  }

  /**
   *
   * @param from
   * @return {number | undefined}
   */
  extractMaterial(
      from: IfcMaterial |
      IfcMaterialList |
      IfcMaterialProfile |
      IfcMaterialProfileSet |
      IfcMaterialConstituent |
      IfcMaterialLayerSetUsage |
      IfcMaterialLayerSet |
      IfcMaterialConstituentSet): number | undefined {
    if (from instanceof IfcMaterial) {
      return this.materials.materialDefinitionsMap.get(from.localID)
    } else if (from instanceof IfcMaterialLayerSetUsage) {
      for (const layer of from.ForLayerSet.MaterialLayers) {
        if (layer.Material) {
          const styledItemID = this.extractMaterial(layer.Material)
          if (styledItemID !== void 0 ) {
            return styledItemID
          }
        }
      }
    } else if (from instanceof IfcMaterialLayerSet) {
      for (const layer of from.MaterialLayers) {
        if (layer.Material) {
          const styledItemID = this.extractMaterial(layer.Material)
          if (styledItemID !== void 0 ) {
            return styledItemID
          }
        }
      }
    } else if (from instanceof IfcMaterialList) {
      for (const _material of from.Materials) {
        if (_material instanceof IfcMaterial) {
          const styledItemID = this.extractMaterial(_material)
          if (styledItemID !== void 0 ) {
            return styledItemID
          }
        }
      }
    } else if (from instanceof IfcMaterialProfile) {
      if (from.Material !== null) {
        const styledItemID = this.extractMaterial(from.Material)
        if (styledItemID !== void 0 ) {
          return styledItemID
        }
      } else {
        Logger.warning(`from.Material === null`)
      }
    } else if (from instanceof IfcMaterialProfileSet) {
      for (const material of from.MaterialProfiles) {
        const styledItemID = this.extractMaterial(material)

        if (styledItemID !== undefined) {
          return styledItemID
        }
      }
    } else if (from instanceof IfcMaterialConstituent) {
      const styledItemID = this.extractMaterial(from.Material)
      if (styledItemID !== undefined) {
        return styledItemID
      }
    } else if (from instanceof IfcMaterialConstituentSet) {
      if (from.MaterialConstituents !== null) {
        for (const materialConstituents of from.MaterialConstituents) {
          const styledItemID = this.extractMaterial(materialConstituents)
          if (styledItemID !== undefined) {
            return styledItemID
          }
        }
      }
    }
  }

  /**
   *
   * @param from
   * @return {number | undefined}
   */
  extractMaterialStyle(from: IfcProduct): number | undefined {
    let styledItemID: number | undefined
    const materialID = this.materials.relMaterialsMap.get(from.localID)
    if ( materialID !== void 0 ) {
      if (this.materials.materialDefinitionsMap.has(materialID)) {
        // found material for mesh
        styledItemID = this.materials.materialDefinitionsMap.get(materialID)
      } else {
        const material = this.model.getElementByLocalID(materialID)
        if (material) {
          if (material instanceof IfcMaterial) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialLayerSetUsage) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialLayerSet) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialList) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialProfile) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialProfileSet) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialConstituent) {
            styledItemID = this.extractMaterial(material)
          } else if (material instanceof IfcMaterialConstituentSet) {
            styledItemID = this.extractMaterial(material)
          } else {
            Logger.warning(`Material type not supported - type: ${EntityTypesIfc[material.type]}`)
          }
        }
      }
    }

    return styledItemID
  }

  /**
   *
   */
  populateStyledItemsMap() {
    const styledItems = this.model.types(IfcStyledItem)

    for (const styledItem of styledItems) {

      if (styledItem.Item !== null) {
        this.materials.styledItemMap.set(styledItem.Item.localID, styledItem.localID)
      }
    }
  }

  /**
   *
   */
  populateMaterialDefinitionsMap() {
    // populate MaterialDefinitionsMap
    const materialDefinitionRepresentations = this.model.types(IfcMaterialDefinitionRepresentation)

    for (const materialDefinitionRep of materialDefinitionRepresentations) {

      for (const representation of materialDefinitionRep.Representations) {
        for (let itemIndex = 0; itemIndex < representation.Items.length; ++itemIndex) {
          // save mapping of IfcMaterial --> IfcStyledItem
          this.materials.materialDefinitionsMap.set(
              materialDefinitionRep.RepresentedMaterial.localID,
              representation.Items[itemIndex].localID)
        }
      }
    }
  }

  /**
   *
   */
  populateRelVoidsMap() {
    // populate relvoids map
    const relVoids = this.model.types(IfcRelVoidsElement)
    for (const relVoid of relVoids) {
      // map product --> relvoids opening elements
      const geometryLocalIDArray =
        this.productToVoidGeometryMap.get(relVoid.RelatingBuildingElement.localID)

      if (geometryLocalIDArray === void 0) {
        const localIDArray: number[] = []
        localIDArray.push(relVoid.RelatedOpeningElement.localID)
        this.productToVoidGeometryMap.set(relVoid.RelatingBuildingElement.localID, localIDArray)
      } else {
        // append to it
        geometryLocalIDArray.push(relVoid.RelatedOpeningElement.localID)
        this.productToVoidGeometryMap.set(
            relVoid.RelatingBuildingElement.localID, geometryLocalIDArray)
      }
    }
  }

  /**
   * Extracts linear scaling factor
   */
  extractLinearScalingFactor() {
    const projects = this.model.types(IfcProject)

    const projectsArray = Array.from(projects)

    if (projectsArray.length <= 0) {
      Logger.error('No IfcProjects found?')
      return
    }

    const project = projectsArray[0]
    this.ifcProjectName = project.Name

    const unitsInContext = project.UnitsInContext

    if (unitsInContext === null) {
      Logger.warning('No units defined.')
      return
    }

    // Logger.info(`UnitsInContext expressID: ${unitsInContext.expressID}`)
    for (const unit of unitsInContext.Units) {
      // Logger.info(`Unit type: ${EntityTypesIfc[unit.type]}, expressID: ${unit.expressID}`)

      if (unit instanceof IfcSIUnit) {
        const unitType = unit.UnitType
        const unitName = unit.Name
        const unitPrefix = unit.Prefix

        if (unitPrefix === null) {
          continue
        }

        const unitPrefixVal = this.convertPrefix(unitPrefix)
        if (unitType === IfcUnitEnum.LENGTHUNIT &&
          unitName === IfcSIUnitName.METRE &&
          unitPrefixVal !== null) {
          this.linearScalingFactor *= unitPrefixVal
          continue
        } else {
          // Logger.info("linear scaling factor not set for IfcSIUnit")
        }
      } else if (unit instanceof IfcConversionBasedUnit) {
        // TODO: Linear scaling factor for IfcConversionBasedUnit
        /* const unitType = unit.UnitType
        unit.ConversionFactor.UnitComponent
        unit.Dimensions
        Logger.info("unit.Name: " + unit.Name)*/
      }
    }
  }

  /**
   *
   * @param prefix
   * @return {number | null}
   */
  convertPrefix(prefix: IfcSIPrefix): number | null {
    /* eslint-disable no-magic-numbers */
    switch (prefix) {
      case IfcSIPrefix.EXA:
        return 1e18
      case IfcSIPrefix.PETA:
        return 1e15
      case IfcSIPrefix.TERA:
        return 1e12
      case IfcSIPrefix.GIGA:
        return 1e9
      case IfcSIPrefix.MEGA:
        return 1e6
      case IfcSIPrefix.KILO:
        return 1e3
      case IfcSIPrefix.HECTO:
        return 1e2
      case IfcSIPrefix.DECA:
        return 1e1
      case IfcSIPrefix.DECI:
        return 1e-1
      case IfcSIPrefix.CENTI:
        return 1e-2
      case IfcSIPrefix.MILLI:
        return 1e-3
      case IfcSIPrefix.MICRO:
        return 1e-6
      case IfcSIPrefix.NANO:
        return 1e-9
      case IfcSIPrefix.PICO:
        return 1e-12
      case IfcSIPrefix.FEMTO:
        return 1e-15
      case IfcSIPrefix.ATTO:
        return 1e-18
      default:
        return null
    }
    /* eslint-enable no-case-declarations */
  }

  /**
   *
   * @param from
   * @param geometry
   */
  dumpGeometry(outputFilePath:string, geometry:GeometryObject) {
    // Construct the full OBJ content
    if (Environment.environmentType === EnvironmentType.NODE) {
      // const objContent = this.conwayModel.toObj(geometry)

      // Write to the output file
      // fs.writeFileSync(outputFilePath, objContent, 'utf8')
    }
  }

  /**
   * Extract the geometry data from the IFC
   *
   * @param model - Input IfcStepModel to extract geometry data from
   * @param logTime boolean - print execution time (default no)
   * @return {[ExtractResult, IfcSceneBuilder]} - Enum indicating extraction result
   * + Geometry array
   */
  extractIFCGeometryData():
    [ExtractResult, IfcSceneBuilder] {

    let result: ExtractResult = ExtractResult.INCOMPLETE

    this.extractLinearScalingFactor()
    const previousMemoizationState = this.model.elementMemoization

    // populate relMaterialsMap
    const relAssociatesMaterials = this.model.types(IfcRelAssociatesMaterial)

    try {

      // 256 meg limit for memoization - smaller models get a big
      // win from memoization, but much larger models it uses far too much heap.
      const MEMOIZATION_THRESHOLD = 256 * 1024 * 1024

      if ( this.model.bufferBytesize > MEMOIZATION_THRESHOLD ) {
        this.model.elementMemoization = false
      }

      for (const relAssociateMaterial of relAssociatesMaterials) {
        const relatingMaterial = relAssociateMaterial.RelatingMaterial
        try {
          const relatedObjects = relAssociateMaterial.RelatedObjects
          for (const relatedObject of relatedObjects) {
            const product = relatedObject

            if (product instanceof IfcProduct) {
              if (product instanceof IfcOpeningElement ||
                product instanceof IfcSpace ||
                product instanceof IfcOpeningStandardCase) {
                continue
              }

              // save mapping of IfcProduct --> IfcMaterial
              this.materials.relMaterialsMap.set(
                  product.localID,
                  relatingMaterial.localID)
            } else {
              //     Logger.warning(`type other than IfcProduct: ${EntityTypesIfc[product.type]}`)
            }
          }
        } catch (ex) {
          if (ex instanceof Error) {
            if (MATERIAL_RELATED_OBJECTS_PERMISSIVE) {
              Logger.error('Error processing relatingMaterial expressID: ' +
                `${relatingMaterial.expressID}, error: ${ex.message}`)
            } else {
              throw ex
            }
          } else {
            Logger.error('Unknown exception processing IfcRelAssociateMaterials.')
          }
        }
      }

      // populate MaterialDefinitionsMap
      this.populateMaterialDefinitionsMap()

      // populate relvoids map
      this.populateRelVoidsMap()

      // populate styled items map
      this.populateStyledItemsMap()

      const products = this.model.types(IfcProduct)

      for (const product of products) {

        this.scene.clearParentStack()

        const isSpace =
              product instanceof IfcOpeningElement ||
              product instanceof IfcSpace ||
              product instanceof IfcOpeningStandardCase

        const objectPlacement = product.ObjectPlacement

        if (objectPlacement !== null) {

          this.extractPlacement(objectPlacement)
        }

        const representations = product.Representation

        if (representations !== null) {

          // extract styledItem material
          const styledItemID: number | undefined =
            this.extractMaterialStyle(product)

          let hasRelVoid: boolean = false
          const extractRelVoidsResult = this.extractRelVoids(product)
          let relVoidsMeshVector: NativeVectorGeometry | undefined
          let relVoidLocalIDs: number[] | undefined

          if (extractRelVoidsResult !== void 0) {

            [relVoidsMeshVector, relVoidLocalIDs] = extractRelVoidsResult
          }

          if (relVoidsMeshVector !== void 0) {
            hasRelVoid = true
          }

          if (styledItemID !== void 0) {
            // optimization: extract the first representation item and cache
            // the styleID to apply to the rest of the product geometry
            const styledItem = this.model.getElementByLocalID(styledItemID)
            let reusableStyleID: number | undefined

            for (const representation of representations.Representations) {

              if (representation instanceof IfcShapeRepresentation) {

                // this check is essential -
                // if RepresentationIdentifier !== Body or Facetation we must skip it
                if (representation.RepresentationIdentifier !== 'Body' &&
                  representation.RepresentationIdentifier !== 'Facetation') {
                  continue
                }
              }

              for (const item of representation.Items) {

                if ( item instanceof IfcMappedItem ) {

                  this.extractMappedItem(item, product, hasRelVoid, isSpace)

                } else {

                  this.extractRepresentationItem(item, product.localID, hasRelVoid, isSpace)

                  if (hasRelVoid) {
                    this.applyRelVoidToRepresentation(
                        item,
                        relVoidsMeshVector!,
                        product.localID,
                        relVoidLocalIDs!,
                        void 0,
                        isSpace)
                  }
                }

                const styledItemLocalID_ = this.materials.styledItemMap.get(item.localID)

                if (styledItemLocalID_ !== undefined) {
                  const styledItem_ =
                    this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem
                  this.extractStyledItem(styledItem_)
                } else if (reusableStyleID !== void 0) {
                  this.materials.addGeometryMapping(item.localID, reusableStyleID)
                } else if (styledItem instanceof IfcStyledItem) {
                  // here we have the styled item, apply it to all geometry in this IfcProduct
                  reusableStyleID = this.extractStyledItem(styledItem, item)
                }
              }
            }

          } else {
            for (const representation of representations.Representations) {

              if (representation instanceof IfcShapeRepresentation) {

                // this check is essential -
                // if RepresentationIdentifier !== Body or Facetation we must skip it
                if (representation.RepresentationIdentifier !== 'Body' &&
                  representation.RepresentationIdentifier !== 'Facetation') {
                  continue
                }
              }

              for (const item of representation.Items) {

                if ( item instanceof IfcMappedItem ) {

                  this.extractMappedItem(item, product, hasRelVoid, isSpace)

                } else {

                  this.extractRepresentationItem(item, product.localID, hasRelVoid, isSpace)

                  if (hasRelVoid) {

                    this.applyRelVoidToRepresentation(
                        item,
                        relVoidsMeshVector!,
                        product.localID,
                        relVoidLocalIDs!,
                        void 0,
                        isSpace)
                  }

                  const styledItemLocalID_ = this.materials.styledItemMap.get(item.localID)
                  if (styledItemLocalID_ !== void 0) {
                    const styledItem_ =
                      this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem
                    this.extractStyledItem(styledItem_)
                  }
                }
              }
            }
          }

          relVoidsMeshVector?.delete()
        }
      }

      const relAggregates = this.model.types(IfcRelAggregates)

      for ( const relAggregate of relAggregates ) {

        try {

          // Note, this is required because the relating object
          // can be where the rel-void is applied, so we
          // used this as a top level over-ride for a rel-void.
          // for all objects in the aggregate - CS
          const relatingObject = relAggregate.RelatingObject
          const masterRelVoids =
            relatingObject instanceof IfcProduct ?
              this.extractRelVoids( relatingObject ) :
              void 0

          const relatedObjects = relAggregate.RelatedObjects

          for ( const productRepresentation of relatedObjects ) {

            if ( productRepresentation instanceof IfcProduct ) {

              const isSpace =
                productRepresentation instanceof IfcOpeningElement ||
                productRepresentation instanceof IfcSpace ||
                productRepresentation instanceof IfcOpeningStandardCase

              const product = productRepresentation

              this.scene.clearParentStack()

              const objectPlacement = product.ObjectPlacement

              if (objectPlacement !== null) {

                this.extractPlacement(objectPlacement)
              }

              const representations = product.Representation

              if ( representations !== null ) {

                // extract styledItem material
                const styledItemID: number | undefined =
                  this.extractMaterialStyle(product)

                const extractRelVoidsResult = masterRelVoids ?? this.extractRelVoids(product)

                let hasRelVoid: boolean = false

                let relVoidsMeshVector: NativeVectorGeometry | undefined
                let relVoidLocalIDs: number[] | undefined

                if (extractRelVoidsResult !== void 0) {

                  [relVoidsMeshVector, relVoidLocalIDs] = extractRelVoidsResult
                }

                if (relVoidsMeshVector !== void 0) {
                  hasRelVoid = true
                }

                if ( styledItemID !== void 0 ) {

                  // optimization: extract the first representation item and cache
                  // the styleID to apply to the rest of the product geometry
                  const styledItem = this.model.getElementByLocalID(styledItemID)

                  let reusableStyleID: number | undefined

                  for (const representation of representations.Representations) {

                    if (representation instanceof IfcShapeRepresentation) {

                      // this check is essential -
                      // if RepresentationIdentifier !== Body or Facetation we must skip it
                      if (representation.RepresentationIdentifier !== 'Body' &&
                        representation.RepresentationIdentifier !== 'Facetation') {
                        continue
                      }
                    }

                    for (const item of representation.Items) {

                      if ( item instanceof IfcMappedItem ) {

                        this.extractMappedItem(item, product, hasRelVoid, isSpace)

                      } else {

                        this.extractRepresentationItem(item, product.localID, hasRelVoid, isSpace)

                        if (hasRelVoid) {
                          this.applyRelVoidToRepresentation(
                              item,
                              relVoidsMeshVector!,
                              product.localID,
                              relVoidLocalIDs!,
                              void 0,
                              isSpace)
                        }
                      }

                      const styledItemLocalID_ = this.materials.styledItemMap.get(item.localID)

                      if (styledItemLocalID_ !== undefined) {

                        const styledItem_ =
                          this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem

                        this.extractStyledItem(styledItem_)

                      } else if (reusableStyleID !== void 0) {

                        this.materials.addGeometryMapping(item.localID, reusableStyleID)

                      } else if (styledItem instanceof IfcStyledItem) {

                        // here we have the styled item, apply it to all geometry in this IfcProduct
                        reusableStyleID = this.extractStyledItem(styledItem, item)
                      }
                    }
                  }
                } else {

                  for (const representation of representations.Representations) {

                    if (representation instanceof IfcShapeRepresentation) {

                      // this check is essential -
                      // if RepresentationIdentifier !== Body or Facetation we must skip it
                      if (representation.RepresentationIdentifier !== 'Body' &&
                        representation.RepresentationIdentifier !== 'Facetation') {
                        continue
                      }
                    }

                    for (const item of representation.Items) {

                      if ( item instanceof IfcMappedItem ) {

                        this.extractMappedItem(item, product, hasRelVoid, isSpace)

                      } else {

                        this.extractRepresentationItem(item, product.localID, hasRelVoid, isSpace)

                        if (hasRelVoid) {
                          this.applyRelVoidToRepresentation(
                              item,
                              relVoidsMeshVector!,
                              product.localID,
                              relVoidLocalIDs!,
                              void 0,
                              isSpace)
                        }

                        const styledItemLocalID_ = this.materials.styledItemMap.get(item.localID)

                        if (styledItemLocalID_ !== void 0) {
                          const styledItem_ =
                            this.model.getElementByLocalID(styledItemLocalID_) as IfcStyledItem
                          this.extractStyledItem(styledItem_)
                        }
                      }
                    }
                  }
                }

                if ( masterRelVoids === void 0 ) {
                  relVoidsMeshVector?.delete()
                }
              }
            }
          }

          if ( masterRelVoids !== void 0 ) {
            masterRelVoids[ 0 ].delete()
          }
        } catch (ex) {
          if (ex instanceof Error) {
            if (MATERIAL_RELATED_OBJECTS_PERMISSIVE) {
              Logger.error('Error processing relAggregate expressID: ' +
                `${relAggregate.expressID}, error: ${ex.message}`)
            } else {
              throw ex
            }
          } else {
            Logger.error('Unknown exception processing IfcRelAssociateMaterials.')
          }
        }
      }

      result = ExtractResult.COMPLETE

      return [result, this.scene]
    } finally {
      this.model.elementMemoization = previousMemoizationState
    }
  }
}
