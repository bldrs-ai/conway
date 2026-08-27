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
import { arrayToWasmHeap, wasmHeapView } from '../core/wasm_heap'
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
  brep_with_voids,
  cartesian_point,
  cartesian_transformation_operator_2d,
  cartesian_transformation_operator_3d,
  circle,
  colour,
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
  next_assembly_usage_occurrence,
  over_riding_styled_item,
  parameter_value,
  pcurve,
  placement, plane,
  poly_loop,
  polyline,
  pre_defined_colour,
  presentation_layer_assignment,
  product,
  product_definition,
  product_definition_shape,
  property_definition,
  ratio_measure,
  rational_b_spline_curve,
  rational_b_spline_surface,
  representation,
  representation_item,
  representation_map,
  representation_relationship_with_transformation,
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
  vertex,
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

// Fewest points a bound can have and still span a plane, which is what
// GetBasisFromCoplanarPoints needs downstream.
const MINIMUM_BOUND_POINTS = 3

// Ceiling on how finely one span of a pcurve's parameter curve is sampled
// when it is pushed through an angular surface parameterization. Nothing in
// STEP bounds how far a parameter curve may run in u or v - a helix wound a
// thousand times is a legal (if unusual) parameter-space line - and without a
// cap the sample count is a function of file content rather than of the
// extractor. At circleSegments density this is over twenty full turns of a
// single span - well past the point where the polyline is the limiting
// factor on any face it bounds.
const MAXIMUM_PCURVE_SPAN_SAMPLES = 256

// How many of a representation's items one demand unit carries
// (conway#579). A unit used to be a whole product, so `Arty_Z7_Top_Silk`
// - 654 MANIFOLD_SOLID_BREPs, one extruded solid per silkscreen glyph,
// in a single ADVANCED_BREP_SHAPE_REPRESENTATION - executed as one
// 22.5 s uninterruptible task in the browser. Those glyphs cost ~32 ms
// apiece, so four of them is ~130 ms of work, inside the ~200 ms a
// responsive main thread allows. Finer settings were measured and are
// not worth their unit count: on Arty, 4 / 2 / 1 items per unit put
// 27 / 22 / 22 of ~300 pump calls over 200 ms, because what is left over
// 200 ms is single solids whose own tessellation costs that much - a
// geometry cost (conway#564), not a granularity one. See
// prepareDemandExtraction / itemUnitRanges for which cuts are legal, and
// AP214_UNITS_PER_PRODUCT_BATCH in compat/web-ifc/ifc_api_proxy_ap214.ts
// for how many units a pump call takes.
const AP214_ITEMS_PER_DEMAND_UNIT = 4

// Ceiling on how many units one representation's items are cut into.
// Splitting is not free — each unit re-enters through its ancestors,
// pushing (and allocating) a scene transform per level plus one per
// replayed placement — so a representation with tens of thousands of
// items needs a coarser cut than the nominal one. Measured on DSA2.step,
// whose single root holds 28,675 shell_based_surface_models: four items
// per unit is 7,169 units, and interleaved runs put whole-model geometry
// at 8.6/9.7/9.4 s uncapped against 9.3/8.1/7.8 s capped here (~7-9%,
// the same direction every round on a runner too contended to call it
// closer than that). Capped, DSA2 cuts into 254 units of 113 items,
// ~32 ms of work apiece — the 10-50 ms per-unit band this is aiming
// for — and lands inside the noise band of the unsliced baseline.
const AP214_MAX_ITEM_UNITS_PER_REPRESENTATION = 256

// Ceiling on how many `placement` items a sliced item range will replay
// to rebuild the transform state its first item inherits (see
// itemUnitRanges). A placement places every item after it in the array,
// so a range that starts past one has to re-extract it; that costs a
// transform push per placement per range, which is only worth paying
// while the count stays small. Past this many placements the rest of the
// representation runs as one range instead — cutting is an optimization,
// and the whole-walk behaviour is always the safe fallback.
const AP214_MAX_REPLAYED_PLACEMENTS = 8

/**
 * How many of a representation's faces the extent walk descends into, at
 * most. See AP214GeometryExtraction.extentSample for the measurement behind
 * the number: at 1,024 the worst extent across the local corpus is 0.9996 of
 * the full-descent value, and the walk stops being a multi-hundred-
 * millisecond block in every preview generation.
 */
const EXTENT_SAMPLE_FACES = 1024


/**
 * Append one shell's faces to the list being built, one at a time.
 *
 * Iteratively, NOT `target.push( ...source )`. A spread passes every element
 * as a separate argument, and a `connected_face_set` large enough to exceed
 * the engine's argument limit throws `RangeError: Maximum call stack size
 * exceeded` — measured at 125,000 elements on the Node runtime this was
 * reviewed against.
 *
 * The failure would have been silent and precisely inverted. `collectItemFaces`
 * swallows exceptions so that one bad reference cannot lose the whole table,
 * so the throw would have left every face of that BREP unattributed and the
 * deflection floor disabled — on the biggest models in the corpus, which are
 * the ones this whole change exists for. Normal extraction is unaffected:
 * `extractManifoldSolidBrep` hands `cfs_faces` to `extractFaces`, which
 * iterates.
 *
 * @param target The list being built.
 * @param source One shell's faces.
 */
function appendFaces( target: face[], source: face[] ): void {

  for ( const face_ of source ) {
    target.push( face_ )
  }
}

/**
 * How a basis surface turns a point in its own parameter space into a point
 * in its placement's local frame, plus which of (u, v) are angles - the
 * latter is what decides how finely a mapped span has to be sampled, since a
 * straight run in an angular parameter is an arc in space.
 */
interface SurfaceParameterization {
  position: axis2_placement_3d
  evaluate: ( u: number, v: number ) => Vector3
  angularU: boolean
  angularV: boolean
}

/**
 * Whether an edge's vertices are the basis curve's own endpoints, making its
 * trim a no-op that spans the whole curve.
 *
 * Only B-splines are considered. A LINE or CIRCLE has no endpoint entities to
 * compare against — a circle is unbounded parametrically, and a line's trim is
 * what gives it extent at all — so "whole curve" does not apply to them and
 * their trims must be resolved.
 *
 * Compared by entity localID, not by coordinates: the file references the
 * same CARTESIAN_POINT from both the control point list and the VERTEX_POINT,
 * so this is exact and needs no tolerance.
 *
 * localID rather than object identity, deliberately. `===` looks equivalent
 * and is not: getTypedElementByLocalID caches instances only while
 * model.elementMemoization holds, and extraction turns it off for
 * lowMemoryMode or a buffer over MEMOIZATION_THRESHOLD. StepModelBase says so
 * outright — "it's not guaranteed element objects returned from this have
 * referential equality even if they have ID equality". With `===` this guard
 * would quietly stop firing on exactly the large models where a dropped face
 * costs most.
 *
 * @param basisCurve The edge's underlying geometry.
 * @param edgeStart The edge's start vertex.
 * @param edgeEnd The edge's end vertex.
 * @return {boolean} True when the edge covers the entire basis curve.
 */
function isWholeCurveEdge(
    basisCurve: curve,
    edgeStart: unknown,
    edgeEnd: unknown ): boolean {

  if ( !( edgeStart instanceof vertex_point ) ||
       !( edgeEnd instanceof vertex_point ) ) {

    return false
  }

  // An edge from a vertex back to ITSELF spans the whole of its basis curve:
  // that is how STEP writes a closed edge, and trimming a circle by one point
  // taken twice is how a torus's equator circles were resolving to a single
  // point - which starved the revolution face of every angular sample it had
  // and collapsed the swept surface flat (conway#461). The caller's gates make
  // this safe for an open basis curve too: recovery only replaces the trimmed
  // result when it was already degenerate AND the untrimmed extraction yields
  // more points, and an identical-vertex edge over an open curve is degenerate
  // whichever way it is read.
  if ( edgeStart.vertex_geometry.localID === edgeEnd.vertex_geometry.localID ) {
    return true
  }

  if ( !( basisCurve instanceof b_spline_curve ) ) {
    return false
  }

  const controlPoints = basisCurve.control_points_list

  if ( controlPoints.length < 2 ) {
    return false
  }

  const first = controlPoints[ 0 ].localID
  const last = controlPoints[ controlPoints.length - 1 ].localID
  const from = edgeStart.vertex_geometry.localID
  const to = edgeEnd.vertex_geometry.localID

  // Either orientation: same_sense is normalised separately, and an edge
  // running end -> start still spans the whole curve. A closed curve whose
  // first and last control points coincide also lands here, which is correct
  // — that edge is the whole curve too.
  return ( from === first && to === last ) || ( from === last && to === first )
}

/**
 * Render something thrown that is not an Error, for a log message.
 *
 * Interpolating a thrown value straight into a template string is how the
 * public baseline ended up with 8 rows reading `[object Object]` — a message
 * that names the face type and then says nothing about the failure. JSON
 * first so a plain thrown object shows its fields; String() as the fallback
 * for what JSON cannot take (cycles, BigInt, symbols).
 *
 * @param thrown The caught value, known not to be an Error.
 * @return {string} A description with at least as much information as String().
 */
function describeThrown( thrown: unknown ): string {

  try {

    const asJson = JSON.stringify( thrown )

    // undefined for a symbol or a bare undefined; "{}" for an object whose
    // own properties are all non-enumerable, which is no better than String().
    if ( asJson !== void 0 && asJson !== '{}' ) {
      return asJson
    }

  } catch {
    // Cyclic, BigInt, or a throwing toJSON - fall through.
  }

  return String( thrown )
}


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

// RGB values for the ISO 10303-46 pre-defined draughting colour names
// (draughting_pre_defined_colour / pre_defined_colour), which carry a name
// instead of components.
const PRE_DEFINED_COLOUR_RGB: Record<string, [number, number, number]> = {
  'red': [1, 0, 0],
  'green': [0, 1, 0],
  'blue': [0, 0, 1],
  'yellow': [1, 1, 0],
  'magenta': [1, 0, 1],
  'cyan': [0, 1, 1],
  'black': [0, 0, 0],
  'white': [1, 1, 1],
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
/**
 * Does this EDGE_LOOP retrace itself - every edge traversed exactly twice,
 * once in each direction?
 *
 * Such a loop encloses no area and cannot trim anything. ISO 10303-42 gives
 * it the same meaning as a VERTEX_LOOP: the face covers the WHOLE surface.
 * `#50626` on `Orbiter_v1.1_Gear_7.5.step` is the case that surfaced it - a
 * sphere written as one great circle walked forward and back, which reached
 * the triangulator as 47 ordinary boundary points and was tessellated to
 * nothing (bldrs-ai/conway#595).
 *
 * Decided HERE, on the ORIENTED_EDGEs, rather than downstream from the point
 * list, because that makes it a topological fact rather than a measurement.
 * The first version of the fix tested the loop's enclosed area, and a thin
 * spherical lune's enclosed area tends to zero continuously as its angular
 * width shrinks - so a narrow but GENUINE trim would eventually have been
 * replaced by the whole sphere, silently (codex, bldrs-ai/conway-geom#187).
 * A lune is bounded by two DIFFERENT edge curves, so no width makes it
 * retrace, and this test cannot be fooled by one at any width.
 *
 * Pairs are matched on the underlying edge element's localID, so the general
 * multi-edge seam (out along A then B, back along B then A) is covered, not
 * just the two-edge spelling this model uses.
 *
 * @param edgeList The loop's oriented edges, in order.
 * @return {boolean} True when every edge appears exactly twice with opposite
 *   orientations, and the loop is non-empty.
 */
export function isRetracingSeamLoop(
    edgeList: readonly {orientation: boolean, edge_element: {localID: number}}[],
): boolean {

  // An odd count cannot pair up, and an empty loop is not a seam.
  if (edgeList.length === 0 || (edgeList.length % 2) !== 0) {
    return false
  }

  // localID -> count of forward traversals minus reverse traversals, and the
  // total appearances. A retrace needs each edge to appear exactly twice with
  // the two orientations cancelling.
  const balance = new Map<number, {net: number, total: number}>()

  for (const edge of edgeList) {

    const key = edge.edge_element?.localID

    if (key === void 0) {
      return false
    }

    const entry = balance.get(key) ?? {net: 0, total: 0}

    entry.net += edge.orientation ? 1 : -1
    entry.total += 1

    balance.set(key, entry)
  }

  for (const entry of balance.values()) {

    if (entry.total !== 2 || entry.net !== 0) {
      return false
    }
  }

  return true
}


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

  /**
   * When the wasm module supports it, face tessellation is staged and then
   * finalized in parallel on the native thread pool instead of being run
   * synchronously per face. See finalizeStagedFaces.
   */
  private readonly useStagedFaces: boolean

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
  /** When true, per-record recoverable errors (dangling styled items,
   * child-representation failures, stack mismatches) are not logged.
   * Set by the parse-time preview channel's throwaway PREFIX
   * extractions, where truncated-tail records make those errors
   * expected by construction — several generations over a large STEP
   * file otherwise flood the load report with thousands of warnings
   * (Arty: 5k+). Durable extractions keep full logging. */
  public quietRecoverableLogging: boolean

  constructor(
    private readonly conwayModel: ConwayGeometry,
    public readonly model: AP214StepModel,
    private readonly limitCSGDepth: boolean = true,
    private readonly csgDepthLimit: number = 20,
    private readonly lowMemoryMode: boolean = false ) {

    this.csgMemoization = !this.lowMemoryMode
    this.quietRecoverableLogging = false

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

    // Deferred (parallel) face tessellation produces byte-identical output,
    // but only pays off when the wasm module's allocator scales across
    // threads (with the default dlmalloc, one global malloc lock makes the
    // parallel path SLOWER than serial). It is therefore enabled by default
    // only when the module reports a scalable allocator.
    //
    // Overrides: CONWAY_FORCE_STAGED_FACES=1 enables it regardless (for
    // benchmarking), CONWAY_DISABLE_STAGED_FACES=1 disables it regardless.
    const env = ( typeof process !== 'undefined' ) ? process.env : void 0
    const stagedFacesDisabled = env?.CONWAY_DISABLE_STAGED_FACES === '1'
    const stagedFacesForced   = env?.CONWAY_FORCE_STAGED_FACES === '1'

    this.useStagedFaces =
      !stagedFacesDisabled &&
      ( conwayModel.supportsStagedFaces?.() ?? false ) &&
      ( stagedFacesForced || ( conwayModel.hasScalableAllocator?.() ?? false ) )
  }

  /**
   * Flush any staged (deferred) face tessellation jobs, tessellating them in
   * parallel on the native thread pool and appending the results to their
   * target geometry objects in staging order.
   *
   * This must be called before triangle data is read from (or native memory
   * freed for) any geometry that faces have been staged into — i.e. before
   * CSG evaluation and before extraction returns.
   */
  finalizeStagedFaces(): void {

    if ( this.useStagedFaces ) {
      this.conwayModel.finalizeStagedFaces()
    }
  }

  /**
   * Add a face to a geometry, deferring (staging) the tessellation for the
   * parallel path when enabled. Keeping the staged/immediate policy in one
   * place ensures every face takes the same path, preserving triangle
   * ordering (and therefore byte-identical output) between modes.
   *
   * @param parameters The face parameters.
   * @param geometry The geometry the face's triangles will be appended to.
   */
  private addOrStageFace(
      parameters: ParamsAddFaceToGeometry,
      geometry: GeometryObject ): void {

    if ( this.useStagedFaces ) {
      this.conwayModel.stageFaceToGeometry( parameters, geometry )
    } else {
      this.conwayModel.addFaceToGeometry( parameters, geometry )
    }
  }

  /**
   * Simple-face variant of addOrStageFace, see above.
   *
   * @param parameters The face parameters.
   * @param geometry The geometry the face's triangles will be appended to.
   */
  private addOrStageFaceSimple(
      parameters: ParamsAddFaceToGeometrySimple,
      geometry: GeometryObject ): void {

    if ( this.useStagedFaces ) {
      this.conwayModel.stageFaceToGeometrySimple( parameters, geometry )
    } else {
      this.conwayModel.addFaceToGeometrySimple( parameters, geometry )
    }
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
   * Face localID to the extent of the representation that DEFINES it, in
   * that representation's own raw file coordinates. `undefined` until
   * `resolveRepresentationExtents` has run.
   */
  private faceExtent_: Map< number, number > | undefined = undefined

  /**
   * How many advanced faces this extraction tessellated, and how many of
   * those the representation walk did not reach — i.e. how many silently ran
   * with no deflection floor.
   *
   * These exist because the table is a MIRROR of extraction's own
   * reachability, and a mirror can only be kept honest by checking that the
   * two agree. Three review findings on conway#564 were the same defect in
   * different arms — `face_based_surface_model` missing from the item
   * dispatch, `types()` not matching `shape_representation` subtypes, a
   * `styled_item` wrapping a BREP — and every one of them showed up here as
   * a face that extraction tessellated and the table had no extent for. None
   * of them raised an error, and two of the three bit no corpus model at all.
   * A counter turns that class of silence into a number.
   *
   * Read them TOGETHER. `extentMissingFaceCount` alone cannot distinguish
   * "every face got a floor" from "nothing was measured", which is exactly
   * how a vacuous assertion passes; `extentMeasuredFaceCount` is the
   * denominator that makes the zero mean something.
   *
   * `extentDegenerateFaceCount` is deliberately NOT folded into
   * `extentMissingFaceCount`, because the two mean opposite things about
   * this code. Missing is a mirror bug: the walk never reached the face's
   * representation, and someone has to fix an arm. Degenerate is not a bug
   * at all: the walk reached the representation and its topological vertices
   * genuinely carry no extent. `data/sphere-vertex-loop.step` is the case —
   * a whole sphere is ONE advanced face whose only bound is a `vertex_loop`
   * at the pole, so the body's entire vertex set is a single point and its
   * box has zero diagonal even though the sphere is 15 units across. Such a
   * face gets no floor, which is the pre-#564 target and therefore safe, but
   * counting it as missing would make the mirror-agreement invariant
   * permanently false and the number useless.
   */
  public extentMeasuredFaceCount   = 0
  public extentMissingFaceCount    = 0
  public extentDegenerateFaceCount = 0

  /**
   * The scale a face's deflection target may not be refined below: the
   * extent of the representation that defines it (conway#564 §5).
   *
   * ## Why the DEFINING REPRESENTATION is the right scope
   *
   * The relative-to-its-own-extent deflection target is right for a part and
   * wrong for a mosaic. `Arty_Z7.stp`'s silkscreen is 10,224 b-spline faces
   * with a median diagonal of 0.126mm; 0.1% of such a face is 0.126um, about
   * a thousandth of a pixel at any zoom a user reaches, and refining toward
   * it costs 96% of that model's geometry payload. Those ten thousand tiles
   * are one visual object — the printed legend — and the object, not the
   * tile, is what sets how finely it is worth resolving.
   *
   * The object is the representation. `Arty_Z7_Top_Silk` is ONE
   * `advanced_brep_shape_representation` holding all 654 glyph solids, and
   * its extent is 139.03mm against a 1.20mm median glyph — the mosaic,
   * measured.
   *
   * Scoping it to the representation rather than to the whole model is not a
   * convenience, it is what makes the quantity well defined at all.
   * Tessellation is memoized per representation ITEM, so one tessellation
   * serves every reference to it; anything that tessellation depends on must
   * therefore be a function of the representation too. A model-wide extent
   * is a function of the whole FILE, and the moment one memoized
   * tessellation is reached from two references it has no single correct
   * value — most sharply when those references sit in different unit
   * contexts, which AP214 permits per `shape_representation` and `Arty_Z7`
   * itself does (centimetre board and connectors, millimetre silkscreen).
   * Reference-independence is exactly what the memoization requires, and the
   * defining representation has it by construction.
   *
   * Two consequences worth keeping:
   *
   * - **No unit conversion appears anywhere in this file's tessellation
   *   path.** A representation has exactly one
   *   `global_unit_assigned_context`, so this extent and the face bounding
   *   box the native side compares it against are raw numbers from the same
   *   representation. Nothing is combined across units, so nothing can be
   *   combined wrongly.
   * - **The floor is never coarser than a model-wide one would have been.**
   *   A representation's box is over a SUBSET of the same coordinates, so its
   *   extent is always <= the model's extent expressed in that
   *   representation's unit.
   *
   * ## Why the topological vertices
   *
   * Walking down from the representation reaches exactly the points that are
   * ON the solid — every `vertex_point` of every face it defines. That is
   * the model, and it is what makes the number trustworthy: the file's full
   * `cartesian_point` population also carries b-spline control points,
   * unbounded-surface support points and parameter-space points, any of which
   * can sit far outside the part. Measured on the local corpus the
   * difference is not marginal — `Right_Hand.step` is a 0.233m hand whose
   * cartesian-point box spans 1134m (control points at +/-500), and
   * `Arty_Z7.stp` is a 0.419m board whose cartesian-point box spans 375km.
   * A box over those would floor the target three to six decades too coarse,
   * i.e. facet the model. The topological walk cannot reach them.
   *
   * ## Why this cannot make geometry depend on pump scheduling
   *
   * Everything here is a property of the PARSED INDEX, never of the geometry
   * built so far, and the table is computed once and memoized. Two
   * consequences, both needed for deterministic digests under the AP214
   * demand pump and the streamed preview channel's snapshots:
   *
   * - nothing can grow as more geometry is extracted, so two faces
   *   tessellated at different points in the same load see the same floor;
   * - each extent is a min/max reduction over a set, which is order-invariant
   *   in IEEE arithmetic (unlike a sum), so it does not depend on the order
   *   `types()` yields representations or faces in either. Only membership
   *   matters, and membership is the whole index.
   *
   * A PREFIX parse (the preview channel's throwaway generations) indexes less
   * of the file and so can pin a smaller extent — deliberately: a smaller
   * extent is a finer floor, i.e. strictly closer to the unfloored behaviour,
   * and that geometry is discarded when the durable load lands. The durable
   * load's values are a pure function of the file.
   *
   * @param faceLocalID The localID of the face about to be tessellated.
   * @return {number} The defining representation's extent diagonal in raw
   * file coordinates, or 0 for a face no representation walk reaches, which
   * the native side reads as "no floor" — i.e. today's behaviour.
   */
  public representationExtentForFace( faceLocalID: number ): number {

    return this.representationExtentEntry( faceLocalID ) ?? 0
  }

  /**
   * The table entry for a face, distinguishing the two ways a face ends up
   * with no floor.
   *
   * `undefined` means the representation walk never reached this face — a
   * disagreement between this table and extraction's own reachability, i.e.
   * a defect. `0` means it was reached and its representation's topological
   * vertices carry no extent, which is a real shape (a whole sphere is one
   * face bounded by a single `vertex_loop`) and not a defect. Only the
   * counters care about the difference; every caller that just wants a floor
   * uses `representationExtentForFace`, where both read as "no floor".
   *
   * @param faceLocalID The localID of the face.
   * @return {number | undefined} The extent, or undefined if unreached.
   */
  private representationExtentEntry( faceLocalID: number ): number | undefined {

    this.faceExtent_ ??= this.resolveRepresentationExtents()

    return this.faceExtent_.get( faceLocalID )
  }

  /**
   * Every representation whose items geometry extraction can reach.
   *
   * `types()` matches EXACT entity types — `shape_representation.query` is
   * the single `SHAPE_REPRESENTATION` id — so scanning it alone silently
   * misses the twenty-odd subtypes AP214 defines
   * (`manifold_surface_shape_representation`,
   * `faceted_brep_shape_representation`, `csg_shape_representation`, …).
   * Extraction itself reaches those through `instanceof` checks on
   * `shape_definition_representation.used_representation` and on the
   * relationship endpoints, so a `types()`-only scan here would hand every
   * face in such a representation an extent of zero — no floor, silently,
   * with no error and with the corpus coverage numbers still reading 100%
   * because the local corpus happens to be plain `SHAPE_REPRESENTATION`
   * throughout.
   *
   * So the set is gathered from the entry points extraction uses rather
   * than from a hand-maintained subtype list, which would rot the next time
   * the schema gains one. `representation` rather than
   * `shape_representation` is the filter because a `representation_map` may
   * point at a base `representation` that still carries items with faces;
   * all this walk needs from it is `.items`.
   *
   * @return {Iterable<representation>} Distinct representations, in
   * localID order — though nothing downstream depends on the order, since
   * each extent is a min/max reduction.
   */
  private geometryRepresentations(): Iterable< representation > {

    const found = new Map< number, representation >()

    /**
     * @param candidate A possible representation reference.
     */
    const add = ( candidate: unknown ): void => {

      if ( candidate instanceof representation ) {
        found.set( candidate.localID, candidate )
      }
    }

    for ( const definition of this.model.types( shape_definition_representation ) ) {
      try {
        add( definition.used_representation )
      } catch {
        // Malformed SDR (prefix truncation) — skip it, as extraction does.
      }
    }

    for ( const relationship of this.model.types( shape_representation_relationship ) ) {
      try {
        add( relationship.rep_1 )
        add( relationship.rep_2 )
      } catch {
        // Malformed relationship — skip it.
      }
    }

    for ( const map of this.model.types( representation_map ) ) {
      try {
        add( map.mapped_representation )
      } catch {
        // Malformed representation_map — skip it.
      }
    }

    // Free-floating representations, which no relationship or definition
    // names. These are the concrete kinds extraction's own root scan uses.
    for ( const free of this.model.types(
        shape_representation,
        advanced_brep_shape_representation,
        geometrically_bounded_wireframe_shape_representation ) ) {

      add( free )
    }

    return found.values()
  }

  /**
   * At most `EXTENT_SAMPLE_FACES` of a representation's faces, spread evenly
   * across the list.
   *
   * The extent walk is the one real cost in this design, and it is paid
   * again for every throwaway generation the parse-time preview channel
   * builds — each of which constructs its own `AP214GeometryExtraction` over
   * a longer prefix — where it cannot be preempted by the tick budget.
   * Measured full-descent worst-case single representation: 416 ms
   * (`Arty_Z7_Top_Silk`, 14,376 faces) and 1,091 ms (DSA2's single
   * representation, 28,674 faces).
   *
   * A bounding box converges long before the last face, so the sample is
   * not an approximation in any way that matters, and it is measured rather
   * than asserted. At 1,024 faces the worst extent across the local corpus
   * is **0.9996** of the full-descent value (`Arty_Z7_Bottom_Silk`;
   * `Arty_Z7_Top_Silk` 1.0000, DSA2 1.0000, `driver board` 1.0000,
   * `Right_Hand` 1.0000), while the worst per-representation descent falls
   * to 5-12 ms. Whole-table build: 875 ms -> ~80 ms on Arty_Z7, 1,443 ms ->
   * ~245 ms on DSA2 (the remainder there is collecting 28,674 faces, which
   * the localID table needs regardless).
   *
   * The error can only ever be an UNDER-estimate — a subset's bounding box
   * is contained in the full one — and a smaller extent is a finer floor,
   * i.e. less of the saving and never a fidelity loss. That is the same
   * direction as every other bound here.
   *
   * A stride rather than a prefix: the first 1,024 faces of a mosaic are its
   * first few dozen glyphs, which span a corner of the board rather than the
   * board. `Math.ceil` keeps the stride at least 1.
   *
   * @param faces The representation's faces, in walk order.
   * @return {face[]} The faces to descend.
   */
  private extentSample( faces: face[] ): face[] {

    if ( faces.length <= EXTENT_SAMPLE_FACES ) {
      return faces
    }

    const stride = Math.ceil( faces.length / EXTENT_SAMPLE_FACES )
    const sampled: face[] = []

    for ( let where = 0; where < faces.length; where += stride ) {
      sampled.push( faces[ where ] )
    }

    return sampled
  }

  /**
   * Build the face localID to defining-representation-extent table.
   *
   * `mapped_item` is deliberately NOT followed. A mapped representation is
   * visited in its own right by the loop below, and following it from here
   * would attribute a definition's faces to a CONSUMER of that definition —
   * which is precisely the reference-dependence that scoping to the
   * definition exists to remove.
   *
   * @return {Map<number, number>} Extent diagonal keyed by face localID.
   * Faces no representation reaches are absent.
   */
  private resolveRepresentationExtents(): Map< number, number > {

    const faceExtent = new Map< number, number >()

    for ( const representation_ of this.geometryRepresentations() ) {

      const faces: face[] = []

      try {
        for ( const item of representation_.items ) {
          this.collectItemFaces( item, faces )
        }
      } catch {
        // Malformed or truncated item list (prefix parse) — the faces it
        // would have contributed stay absent, which reads as "no floor".
        continue
      }

      if ( faces.length === 0 ) {
        continue
      }

      const box = {
        minX: Infinity, minY: Infinity, minZ: Infinity,
        maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity,
      }

      for ( const face_ of this.extentSample( faces ) ) {
        this.growBoxByFace( face_, box )
      }

      if ( !Number.isFinite( box.minX ) ) {
        continue
      }

      const extent =
        Math.hypot( box.maxX - box.minX, box.maxY - box.minY, box.maxZ - box.minZ )

      for ( const face_ of faces ) {

        const existing = faceExtent.get( face_.localID )

        // A face reached from two representations is malformed — the same
        // solid listed twice — and there is then no single right answer.
        // Take the SMALLER extent, matching every other bound in this
        // design: it errs toward a finer floor, i.e. less of the saving and
        // never a fidelity loss. (The larger one is arguable too, on the
        // grounds that the bigger representation is the visual object; it is
        // rejected only because it errs the other way.)
        faceExtent.set(
            face_.localID,
            existing === undefined ? extent : Math.min( existing, extent ) )
      }
    }

    return faceExtent
  }

  /**
   * Append every face one representation item defines.
   *
   * ## Why `styled_item` is deliberately NOT followed
   *
   * A styled_item listed among a representation's items carries geometry on
   * `.item`, and extraction does tessellate that target
   * (extractStyledItemWithProcessing -> extractRepresentationItem). Mirroring
   * that here was tried and then removed on purpose, so it is not
   * reintroduced as an obvious omission.
   *
   * Following it is the only place in this collector where the error
   * direction is UNSAFE. Everywhere else a miss means a face gets no floor —
   * pre-#564 behaviour, finer, a lost saving. Here, following a target
   * extraction will not tessellate folds its vertices into the
   * representation's extent and makes the floor COARSER for every face that
   * does tessellate, which is a fidelity loss. And extraction's decision is
   * not a simple reachability question that a mirror can answer once: it
   * turns on the styled item carrying a `surface_style_usage`, on that usage
   * being well formed enough for `extractSurfaceStyle` not to throw, and on
   * `extractRepresentationItem` having no `styled_item` arm of its own so a
   * nested styled item stops as unsupported. Three review rounds produced
   * three separate findings on those three conditions.
   *
   * Not following it inverts the whole class: such a face is simply never
   * attributed, so it gets no floor — the safe direction — and it lands in
   * `extentMissingFaceCount`, which the load report prints and
   * ap214_extent_coverage.test.ts asserts on. That trades a capability no
   * corpus model exercises (no model in the public corpus or in data/ lists
   * a styled_item among a representation's items at all; Arty_Z7's 3,919
   * styled items attach per face through styledItemMap) for the removal of
   * an entire error direction.
   *
   * What it costs is narrower than "styled geometry loses its floor":
   *
   * - per-face styling is untouched, because those faces are reached through
   *   their own solid, which this walk handles normally;
   * - a target that is ALSO listed directly in `representation.items` keeps
   *   its floor from the direct listing;
   * - a mixed representation takes its extent from the directly-listed items
   *   and applies it only to faces from those items, so the extent stays a
   *   subset of the representation's own coordinates and no new unsafe case
   *   appears.
   *
   * ## Why this is not shared with extraction's own dispatch
   *
   * The obvious tidy-up — one `facesOfItem` consumed by both this and
   * `extractRepresentationItem` — was considered and rejected, so that it is
   * not re-attempted. Extraction's per-kind functions do not merely list
   * faces, they decide which geometry object the faces land in:
   * `extractAP214ShellBasedSurfaceModel` accumulates ONE geometry across
   * shells and `extractConnectedFaceSets` does the same per face set, so
   * neither can consume a flat list without changing that grouping. And
   * extraction walks only `manifold_solid_brep.outer`, never
   * `brep_with_voids.voids`, which this must — so a shared helper would
   * change what extraction extracts. Sharing only the two arms that do line
   * up would be worse than not sharing: it would look shared while the arms
   * that actually diverge stayed duplicated.
   *
   * What keeps this in sync is `ap214_extent_coverage.test.ts`, which
   * asserts the two traversals AGREE rather than that they share code —
   * see `extentMissingFaceCount`.
   *
   * @param item The representation item to walk.
   * @param faces The list being built.
   */
  private collectItemFaces( item: representation_item, faces: face[] ): void {

    try {

      if ( item instanceof manifold_solid_brep ) {

        appendFaces( faces, item.outer.cfs_faces )

        // faceted_brep and brep_with_voids are both manifold_solid_brep
        // subtypes; only the latter carries anything beyond `outer`.
        if ( item instanceof brep_with_voids ) {

          for ( const void_ of item.voids ) {
            appendFaces( faces, void_.cfs_faces )
          }
        }

        return
      }

      if ( item instanceof shell_based_surface_model ) {

        for ( const shell of item.sbsm_boundary ) {
          appendFaces( faces, shell.cfs_faces )
        }

        return
      }

      if ( item instanceof face_based_surface_model ) {

        for ( const faceSet of item.fbsm_faces ) {
          appendFaces( faces, faceSet.cfs_faces )
        }
      }

    } catch {
      // Dangling or mistyped reference — the faces below it stay absent,
      // which reads as "no floor", rather than losing the whole table.
    }
  }

  /**
   * Grow a bounding box by every topological vertex one face carries.
   *
   * @param face_ The face to walk.
   * @param box The box to grow, mutated in place.
   */
  private growBoxByFace(
      face_: face,
      box: { minX: number, minY: number, minZ: number,
             maxX: number, maxY: number, maxZ: number } ): void {

    try {

      for ( const bound of face_.bounds ) {

        const loop = bound.bound

        if ( loop instanceof edge_loop ) {

          for ( const orientedEdge of loop.edge_list ) {

            // The underlying edge, not the oriented wrapper: `edge_element`
            // is the edge_curve whose endpoints are the vertex records, and
            // it is the same field extractAdvancedFace's loop walk reads.
            // Each edge_curve is shared by the two faces meeting along it,
            // so every vertex is read twice. Deduping by edge localID was
            // measured and does not pay: the cost is the traversal itself
            // (bounds, edge_list, edge_element), not the two coordinate
            // reads, and a Set of ~150k entries cancels the saving on
            // Arty_Z7 (882ms naive, 875ms deduped). Left simple.
            const edgeElement = orientedEdge.edge_element

            this.growBoxByVertex( edgeElement.edge_start, box )
            this.growBoxByVertex( edgeElement.edge_end, box )
          }

        } else if ( loop instanceof vertex_loop ) {

          this.growBoxByVertex( loop.loop_vertex, box )

        } else if ( loop instanceof poly_loop ) {

          for ( const point of loop.polygon ) {
            this.growBoxByPoint( point, box )
          }
        }
      }

    } catch {
      // A malformed bound leaves this face out of the box rather than
      // discarding the representation's extent entirely. Under-counting is
      // the safe direction: it can only make the floor finer.
    }
  }

  /**
   * Grow a bounding box by one topological vertex.
   *
   * @param vertex The vertex to read.
   * @param box The box to grow, mutated in place.
   */
  private growBoxByVertex(
      vertex: vertex,
      box: { minX: number, minY: number, minZ: number,
             maxX: number, maxY: number, maxZ: number } ): void {

    if ( !( vertex instanceof vertex_point ) ) {
      return
    }

    const geometry = vertex.vertex_geometry

    // vertex_geometry is a `point`, of which cartesian_point is one subtype —
    // point_on_curve/point_on_surface/degenerate_pcurve carry no coordinates
    // of their own and are skipped rather than resolved, since resolving them
    // would mean evaluating their basis geometry.
    if ( geometry instanceof cartesian_point ) {
      this.growBoxByPoint( geometry, box )
    }
  }

  /**
   * Grow a bounding box by one cartesian point.
   *
   * @param point The point to read.
   * @param box The box to grow, mutated in place.
   */
  private growBoxByPoint(
      point: cartesian_point,
      box: { minX: number, minY: number, minZ: number,
             maxX: number, maxY: number, maxZ: number } ): void {

    const coordinates = point.coordinates

    if ( coordinates === null || coordinates.length < 3 ) {
      return
    }

    const x = coordinates[ 0 ]
    const y = coordinates[ 1 ]
    const z = coordinates[ 2 ]

    if ( !Number.isFinite( x ) || !Number.isFinite( y ) || !Number.isFinite( z ) ) {
      return
    }

    if ( x < box.minX ) {
      box.minX = x
    }
    if ( y < box.minY ) {
      box.minY = y
    }
    if ( z < box.minZ ) {
      box.minZ = z
    }
    if ( x > box.maxX ) {
      box.maxX = x
    }
    if ( y > box.maxY ) {
      box.maxY = y
    }
    if ( z > box.maxZ ) {
      box.maxZ = z
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
  arrayToWasmHeap(array:Float32Array | Float64Array | Uint32Array): any {
    return arrayToWasmHeap(this.wasmModule, array)
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

    // CSG reads operand triangle data (and dropNonSceneGeometry below frees
    // operand geometry), so faces staged for deferred (parallel)
    // tessellation must be finalized AFTER operand extraction - which
    // stages faces itself (e.g. faceted_brep) - and before any read/free.
    this.finalizeStagedFaces()

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
      flatFirstMeshVector.delete()
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

    // The vectors only hold copies of the operand meshes (push_back copies),
    // so free them here like extractBooleanOperand's inline path does.
    flatFirstMeshVector.delete()
    flatSecondMeshVector.delete()

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

      // Nested CSG reads operand triangle data (and dropNonSceneGeometry
      // below frees operand geometry), so any faces the operand extraction
      // above staged for deferred tessellation must be finalized first.
      this.finalizeStagedFaces()

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
                // `fill_colour` is the schema's colour select, but AP214
                // gives pre_defined_colour TWO supertypes (colour AND
                // pre_defined_item) and the single-inheritance generator
                // kept only pre_defined_item — so the typed getter throws
                // "incorrectly typed" for e.g.
                // DRAUGHTING_PRE_DEFINED_COLOUR('white') (Onshape exports).
                // Re-extract the same field (offset 1) under the type the
                // generator did keep, and map the name to RGB.
                let surfaceColor: ColorRGBA | undefined

                let fillColor: colour | undefined

                try {
                  fillColor = fillAreaColor.fill_colour
                } catch {
                  const preDefined = fillAreaColor.extractElement(
                      1, 0, 0, true, pre_defined_colour )
                  const rgb =
                    PRE_DEFINED_COLOUR_RGB[ preDefined?.name?.toLowerCase() ?? '' ]

                  if ( rgb !== void 0 ) {
                    surfaceColor = [rgb[ 0 ], rgb[ 1 ], rgb[ 2 ], 1]
                  }
                }

                if ( fillColor instanceof colour_rgb ) {
                  surfaceColor = extractColorRGBPremultiplied(fillColor, 1)
                }

                if ( surfaceColor === void 0 ) {

                  continue
                }

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

    // Edge-supplied trims are specific to one EDGE_CURVE, but `from` is the
    // shared basis curve — memoising a trimmed extraction under the basis
    // curve's localID would hand the first edge's arc to every other edge
    // sharing that curve. Trimmed extractions are memoised by the caller
    // under the EDGE_CURVE's localID instead (see extractAdvancedFace);
    // untrimmed extractions stay memoised here.
    const hasEdgeTrims = trimmingArguments?.exist === true

    if ( !hasEdgeTrims ) {

      stepCurve = this.curves.get( from.localID )

      if ( stepCurve !== void 0 ) {

        return stepCurve
      }
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

      // An explicit 3D representation beats the parameter-space mapping where
      // one is carried, as it already does for surface_curve and seam_curve
      // reached in their own right. surface_curve rather than seam_curve:
      // seam_curve and intersection_curve are both its subtypes and all three
      // carry curve_3d, so this is the same preference over the whole family
      // (bldrs-ai/conway#505).
      const surfaceCurve = from.findVariant( surface_curve )

      if ( surfaceCurve !== void 0 ) {

        stepCurve =
          this.extractCurve( surfaceCurve.curve_3d, parentSense, isEdge, trimmingArguments )

      } else {

        stepCurve = this.extractPScurve1( from )
      }

    } 
    
    if ( stepCurve === void 0 ) {

      Logger.warning(`Unsupported Curve! Type: ${EntityTypesAP214[from.type]}`)
      return
    }

    if ( !hasEdgeTrims ) {

      this.curves.add( from.localID, stepCurve )
    }

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
   * The ISO 10303-42 parameterization of an elementary basis surface,
   * expressed in that surface's placement-local frame. Writing C for the
   * placement's origin, x/y/z for its axes, R (and r) for the radii and a for
   * conical_surface.semi_angle, the standard's forms are
   *
   *   plane        s(u,v) = C + u x + v y
   *   cylindrical  s(u,v) = C + R((cos u) x + (sin u) y) + v z
   *   conical      s(u,v) = C + (R + v tan a)((cos u) x + (sin u) y) + v z
   *   spherical    s(u,v) = C + R cos v ((cos u) x + (sin u) y) + R sin v z
   *   toroidal     s(u,v) = C + (R + r cos v)((cos u) x + (sin u) y)
   *                           + r sin v z
   *
   * Note v on a sphere is a LATITUDE in [-90, 90] degrees, not a polar angle,
   * and v on a torus runs around the tube. Those four are quoted here from the
   * entities IFC adopted verbatim from this part - IfcPlane,
   * IfcCylindricalSurface, IfcSphericalSurface and IfcToroidalSurface, each
   * carrying its equation under "Definition according to ISO/CD 10303-42" plus
   * "Entity adapted from <name> defined in ISO 10303-42".
   *
   * The cone is the one worth stating explicitly, because it is the arm a
   * review of this code read the other way (bldrs-ai/conway#520): its v is
   * distance along the AXIS, so the radius grows by tan a per unit v - not
   * distance along the generator, which would grow it by sin a. Two STEP readers
   * settle it the same way. Open CASCADE parameterizes its own
   * Geom_ConicalSurface along the generator, P(u,v) = O + (R + v sin a)(...)
   * + v cos a z, and therefore rescales v by 1/cos(a) coming in from STEP and
   * by cos(a) going back out - GeomConvert_Units::DegreeToRadian and
   * ::RadianToDegree, which is exactly the path its STEP reader pushes pcurves
   * through (StepToTopoDS_TranslateEdge::MakePCurve). truck's STEP reader
   * builds the cone by revolving the line (R,0,0) + t (tan a, 0, 1), which is
   * the form above with t = v.
   *
   * conway-geom tessellates the same surfaces by inverting these formulae:
   * TriangulateCylindricalSurface, TriangulateSphericalSurface,
   * TriangulateConicalSurface and TriangulateToroidalSurface (conway-geom
   * `conway_geometry/operations/mesh_utils.h`) recover (theta, height) or
   * (theta, latitude) from world points, so a pcurve mapped here lands on the
   * same surface the face it bounds is triangulated on. It differs in one
   * deliberate way, on the cone's sign - see that arm.
   *
   * Angular parameters are radians taken straight from the file. Conway
   * applies no plane-angle unit conversion anywhere on the STEP path -
   * conical_surface.semi_angle reaches conway-geom raw in
   * extractConicalSurface - so a degree-unit export is wrong here in exactly
   * the same way, and consistently so.
   *
   * @param from The basis surface.
   * @return {SurfaceParameterization | undefined} The parameterization, or
   * undefined for a surface that has none here (b-spline and swept surfaces).
   */
  private surfaceParameterization(
      from: surface ): SurfaceParameterization | undefined {

    if ( from instanceof plane ) {

      // The one non-angular case: (u, v) are distances along the placement's
      // x and y axes.
      return {
        position: from.position,
        evaluate: ( u: number, v: number ) => ( { x: u, y: v, z: 0 } ),
        angularU: false,
        angularV: false,
      }
    }

    if ( from instanceof cylindrical_surface ) {

      const radius = from.radius

      return {
        position: from.position,
        evaluate: ( u: number, v: number ) =>
          ( { x: radius * Math.cos( u ), y: radius * Math.sin( u ), z: v } ),
        angularU: true,
        angularV: false,
      }
    }

    if ( from instanceof conical_surface ) {

      const radius = from.radius

      // tan, not sin, because v is axial distance rather than distance along
      // the generator - see the equations in this method's doc comment.
      //
      // Signed, unlike the native tesselator's tan(fabs(semi_angle)): that
      // one fits its generator line from boundary samples and only needs the
      // taper's magnitude, whereas the 2D curve here was authored against the
      // spec's parameterization, where the radius grows with v by the SIGNED
      // taper and a narrowing cone runs the other way.
      const taper = Math.tan( from.semi_angle )

      return {
        position: from.position,
        evaluate: ( u: number, v: number ) => {

          const ring = radius + ( v * taper )

          return { x: ring * Math.cos( u ), y: ring * Math.sin( u ), z: v }
        },
        angularU: true,
        angularV: false,
      }
    }

    if ( from instanceof spherical_surface ) {

      const radius = from.radius

      return {
        position: from.position,
        evaluate: ( u: number, v: number ) => {

          const ring = radius * Math.cos( v )

          return {
            x: ring * Math.cos( u ),
            y: ring * Math.sin( u ),
            z: radius * Math.sin( v ),
          }
        },
        angularU: true,
        angularV: true,
      }
    }

    // Covers degenerate_toroidal_surface, which is a subtype and shares the
    // parameterization (it only restricts the range v is meaningful over).
    if ( from instanceof toroidal_surface ) {

      const majorRadius = from.major_radius
      const minorRadius = from.minor_radius

      return {
        position: from.position,
        evaluate: ( u: number, v: number ) => {

          const ring = majorRadius + ( minorRadius * Math.cos( v ) )

          return {
            x: ring * Math.cos( u ),
            y: ring * Math.sin( u ),
            z: minorRadius * Math.sin( v ),
          }
        },
        angularU: true,
        angularV: true,
      }
    }

    return void 0
  }

  /**
   * Extract a pcurve: a curve given in the parameter space of a basis surface
   * (ISO 10303-42). The parameter curve is extracted through the ordinary
   * curve path and its (u, v) samples are pushed through the basis surface's
   * parameterization, giving the 3D polyline every other arm of extractCurve
   * hands back.
   *
   * Extent comes from the parameter curve itself: a bounded one (polyline,
   * b-spline, trimmed or composite curve) carries its own, and an unbounded
   * 2D LINE or CIRCLE gets whatever the ordinary line/circle extraction gives
   * it. An EDGE_CURVE's vertex trims are 3D and are deliberately NOT inverted
   * back into parameter space here, so an edge whose parameter curve is an
   * unbounded LINE comes out at that line's own extent rather than the edge's
   * - see https://github.com/bldrs-ai/conway/issues/505.
   *
   * @param from The pcurve to extract.
   * @return {CurveObject | undefined} The mapped 3D curve, or undefined where
   * the basis surface has no parameterization here or the parameter curve
   * yields no points. Both are warned about naming the type responsible, so
   * the residue is measurable per surface family rather than as one row.
   */
  extractPScurve1( from: pcurve ): CurveObject | undefined {

    const basisSurface = from.basis_surface

    const parameterization = this.surfaceParameterization( basisSurface )

    if ( parameterization === void 0 ) {

      Logger.warning(
          'Unsupported PCURVE basis surface, type: ' +
          `${EntityTypesAP214[ basisSurface.type ]}`,
          from.expressID )
      return
    }

    // ISO 10303-42 constrains reference_to_curve to a single curve item in a
    // 2D parametric context, but the field is a general representation, so
    // the curve is searched for rather than indexed blindly.
    const parameterCurveItem =
      from.reference_to_curve.items.find(
          ( item ): item is curve => item instanceof curve )

    if ( parameterCurveItem === void 0 ) {

      Logger.warning(
          'PCURVE reference_to_curve carries no curve item', from.expressID )
      return
    }

    const parameterCurve = this.extractCurve( parameterCurveItem )
    const parameterCount = parameterCurve?.getPointsSize() ?? 0

    if ( parameterCurve === void 0 || parameterCount === 0 ) {

      // extractCurve has already warned under the parameter curve's own type.
      return
    }

    // The frame is built by the same native call the surface side uses
    // (extractCylindricalSurface and friends), so the pcurve is orthonormalised
    // identically to the surface it lies on rather than by a second, subtly
    // different implementation here.
    const placement = this.conwayModel.getAxis2Placement3D(
        this.extractAxis2Placement3D(
            parameterization.position, basisSurface.localID, true ) )

    const transform = placement.getValues()

    // Sample density for angular parameters: the same knob the ellipse path
    // uses, so a mapped arc is tessellated like every other arc conway emits.
    const angularStep = ( 2 * Math.PI ) / this.circleSegments

    const localPoints: Vector3[] = []

    let previous = parameterCurve.get2d( 0 )

    localPoints.push( parameterization.evaluate( previous.x, previous.y ) )

    for ( let index = 1; index < parameterCount; ++index ) {

      const current = parameterCurve.get2d( index )

      const deltaU = current.x - previous.x
      const deltaV = current.y - previous.y

      // A straight run in an angular parameter is an arc in space, so a span
      // that covers real angle is subdivided rather than chorded across.
      let samples = 1

      if ( parameterization.angularU ) {

        samples = Math.max( samples, Math.ceil( Math.abs( deltaU ) / angularStep ) )
      }

      if ( parameterization.angularV ) {

        samples = Math.max( samples, Math.ceil( Math.abs( deltaV ) / angularStep ) )
      }

      samples = Math.min( samples, MAXIMUM_PCURVE_SPAN_SAMPLES )

      for ( let sample = 1; sample <= samples; ++sample ) {

        const ratio = sample / samples

        localPoints.push( parameterization.evaluate(
            previous.x + ( deltaU * ratio ),
            previous.y + ( deltaV * ratio ) ) )
      }

      previous = current
    }

    // Column-major Glmdmat4: basis columns at 0, 4, 8, translation at 12.
    const pointsFlattened =
      new Float64Array( localPoints.length * this.THREE_DIMENSIONS )

    let offset = 0

    for ( const localPoint of localPoints ) {

      pointsFlattened[ offset ] =
        ( transform[ 0 ] * localPoint.x ) + ( transform[ 4 ] * localPoint.y ) +
        ( transform[ 8 ] * localPoint.z ) + transform[ 12 ]
      pointsFlattened[ offset + 1 ] =
        ( transform[ 1 ] * localPoint.x ) + ( transform[ 5 ] * localPoint.y ) +
        ( transform[ 9 ] * localPoint.z ) + transform[ 13 ]
      pointsFlattened[ offset + 2 ] =
        ( transform[ 2 ] * localPoint.x ) + ( transform[ 6 ] * localPoint.y ) +
        ( transform[ 10 ] * localPoint.z ) + transform[ 14 ]

      offset += this.THREE_DIMENSIONS
    }

    placement.delete()

    const pointsPtr = this.arrayToWasmHeap( pointsFlattened )

    const parameters = this.paramsGetPolyCurvePool!.acquire()

    parameters.points = pointsPtr
    parameters.pointsLength = localPoints.length
    parameters.dimensions = this.THREE_DIMENSIONS
    parameters.senseAgreement = true
    parameters.isEdge = false

    const curve_ = this.conwayModel.getPolyCurve( parameters )

    this.paramsGetPolyCurvePool!.release( parameters )

    this.wasmModule._free( pointsPtr )

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

    // UNSPECIFIED reads BOTH representations — see the matching comment in
    // src/ifc/ifc_geometry_extraction.ts's extractIfcTrimmedCurve, which this
    // block mirrors line for line. In short: UNSPECIFIED means "either
    // representation may be used", the choice is made downstream in
    // conway-geom's getIfcLine (Cartesian pair when its endpoints are
    // distinct, parameters otherwise), and leaving the parameters at zero here
    // collapsed a parameter-only UNSPECIFIED trim to a single point
    // (conway#578). The two scans are independent, not exclusive.
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
    }

    if (
      from.master_representation === trimming_preference.PARAMETER ||
      from.master_representation === trimming_preference.UNSPECIFIED) {
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
   * Efficiently flatten the points into a Float64Array.
   *
   * Float64 because getPolyCurve, the only consumer, reinterprets the buffer
   * as `const double *`: Float32 elements decode there as unrelated numbers
   * (and read twice as many bytes as were written). Matches the IFC side's
   * helper of the same name.
   *
   * @param points - Array of AP214CartesianPoint
   * @param dimensions - dimensions of points
   * @return {Float64Array}
   */
  flattenPointsToFloat64Array( points: cartesian_point[], dimensions:number ): Float64Array {

    const totalCoordinates = points.length * dimensions
    const flatCoordinates = new Float64Array(totalCoordinates)

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

      const pointsFlattened = this.flattenPointsToFloat64Array(points, dim)

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

    // The pushes below have to be undone even when the walk between them
    // throws — `mapped_representation` and every item under it dereference
    // lazily, so a malformed mapping fails AFTER the transform is on the
    // stack. Leaving it there used to mean the rest of the enclosing
    // representation's items were placed by a transform that belongs to a
    // failed mapped item, and — since conway#579 cut that item loop into
    // units — how far the leak reached depended on where the cut fell.
    // Popping in a finally is what makes this function stack-neutral
    // unconditionally, which is the invariant the slicing rests on.
    try {
      if ( mappingTarget instanceof cartesian_transformation_operator_3d ) {

        const nativeCartesianTransform =
          this.extractCartesianTransformOperator3D(mappingTarget)
        const originTransform =
          mappingOrigin instanceof placement ?
            this.extractRawPlacement( mappingOrigin ) : void 0

            let combinedTransform: NativeTransform4x4

        if (originTransform !== void 0) {
          // Use the same semantics as doTransforms: from = origin^-1, to = target
          const from = originTransform.invert()
          const to   = nativeCartesianTransform

          const params: ParamsLocalPlacement = {
            useRelPlacement: true,
            axis2Placement: from,
            relPlacement: to,
          }
          combinedTransform = this.conwayModel.getLocalPlacement(params)
        } else {
          combinedTransform = nativeCartesianTransform
        }

        pushTransform(combinedTransform)

      } else if ( mappingTarget instanceof placement ) {

        const targetTransform = this.extractRawPlacement( mappingTarget )
        const originTransform =
          mappingOrigin instanceof placement ?
            this.extractRawPlacement( mappingOrigin ) : void 0

        if ( targetTransform !== void 0 ) {
          let combinedTransform: NativeTransform4x4
          if (originTransform !== void 0) {
            // Again, same semantics as doTransforms
            const from = originTransform.invert()
            const to   = targetTransform
    
            const params: ParamsLocalPlacement = {
              useRelPlacement: true,
              axis2Placement: from,
              relPlacement: to,
            }
            combinedTransform = this.conwayModel.getLocalPlacement(params)
          } else {
            combinedTransform = targetTransform
          }
    
          pushTransform(combinedTransform)
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

    } finally {

      for ( ; pushedTransforms > 0; --pushedTransforms ) {

        this.scene.popTransform()
      }
    }
  }

  /**
   * Count of representation items by AP214 entity type name — the geometry
   * breakdown for the load report (issue #301 follow-up). Copied into
   * Statistics by the loader/proxies after extraction.
   */
  public readonly geometryTypeCounts = new Map<string, number>()

  /**
   * Increment the geometry-type breakdown counter for a type name.
   *
   * @param name The entity type name.
   */
  private countGeometryType(name: string): void {
    this.geometryTypeCounts.set(name, (this.geometryTypeCounts.get(name) ?? 0) + 1)
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
    }

    // Geometry-type breakdown for the load report (issue #301 follow-up):
    // after the memoization early-return, so each unique geometry
    // definition counts once regardless of occurrence instancing.
    this.countGeometryType(EntityTypesAP214[from.type])

    if ( from instanceof boolean_result ) {

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
          // A non-Error throw interpolates as "[object Object]" in a template
          // string, which is what 8 occurrences in the public baseline
          // actually say - the message names the face type and nothing else.
          // JSON first so a plain thrown object shows its fields; String() as
          // the fallback for what JSON cannot take (cycles, BigInt, symbols).
          Logger.error(
            `Error extracting face ${EntityTypesAP214[face_.type]} - ${
              describeThrown( error )} - expressID: #${face_.expressID}`)
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

    // Build each row and push_back (which copies) — embind's vector get()
    // returns a COPY of the inner vector, so the previous resize + write
    // into get(where) mutated temporaries and left the outer vector's rows
    // empty. That silently dropped NURBS weights, so rational surfaces
    // (STEP cylinders written as weighted Bezier patches) tessellated as
    // plain polynomials and bulged — part of conway#350.
    for ( const row of from ) {

      const nativeRow = this.conwayModel.nativeVectorDouble()

      this.extractToDoubleVector( row, nativeRow )

      to.push_back( nativeRow )
      nativeRow.delete()
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

   // Loop curves are collected before bound creation so the outer-bound
   // heuristic below can compare their extents across the whole face.
   const loopCurves: CurveObject[] = []
   const loopIsOuter: boolean[] = []
   const loopOrientations: boolean[] = []

   // Parallel to loopCurves: is this loop a retracing seam? See
   // isRetracingSeamLoop - a topological fact about the ORIENTED_EDGEs,
   // which are visible here and not downstream.
   const loopSeams: boolean[] = []

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

            // EDGE_CURVE.same_sense: does the edge's start→end direction agree
            // with the basis curve's parametrisation? For same_sense=false the
            // edge sweeps from edge_start to edge_end AGAINST the curve
            // parameter. The native circle/ellipse trim (getAP214Circle) always
            // sweeps the positive parametric arc from trim1 to trim2 (its
            // senseAgreement=false path mis-negates the sweep), so ignoring
            // same_sense selects the COMPLEMENT arc — e.g. Onshape AP242
            // exports write near-straight edges as shallow arcs of large
            // circles, and the complement is a ~340° loop that explodes the
            // face boundary (Right_Hand.step spikes; the CDT "Intersecting
            // constraint edges" cascade). Normalise instead of forwarding the
            // flag: swap the trim ends so the positive sweep is the correct
            // arc, leaving the extracted (memoised) curve running edge_end →
            // edge_start; the orientation check below compensates.
            const sameSense = edgeElement.same_sense

            const trimmingArguments: TrimmingArguments = {
              exist: !!((trimmingStart !== void 0 && trimmingEnd !== void 0)),
              start: sameSense ? trimmingStart : trimmingEnd,
              end: sameSense ? trimmingEnd : trimmingStart,
            }

            // Trimmed extractions are memoised under THIS edge's localID —
            // not the basis curve's — so edges sharing one basis curve with
            // different trims each get their own arc, while the second
            // ORIENTED_EDGE user of this edge (the adjacent face) still
            // reuses the extraction. extractCurve skips its basis-curve
            // memo whenever edge trims exist (see hasEdgeTrims there); the
            // shared this.curves container keeps ownership either way.
            let curve = this.curves.get( edgeElement.localID )

            if ( curve === void 0 ) {

              curve = this.extractCurve( edgeCurve, true, true, trimmingArguments )

              // An edge whose vertices ARE the basis curve's own endpoints
              // spans the whole curve, so its trim carries no information —
              // and on some B-splines resolving it anyway comes back as just
              // the two endpoints. When such edges form a face's outer loop
              // the loop is collinear by construction, GetBasisFromCoplanarPoints
              // finds no basis, and TriangulateBounds discards the ENTIRE face,
              // eleven good 47-point inner bounds along with it (two edges on
              // nist_ctc_02_asme1_rc.stp, bldrs-ai/conway#492).
              //
              // Deliberately gated on the result being degenerate rather than
              // on the trim being a no-op. Most whole-curve trims resolve
              // correctly — 33 of 35 on that model — and bypassing those too
              // would re-route working edges onto a different extraction and
              // memoisation path for no reason, which is churn masquerading as
              // a fix. This only fires where the current path has already
              // failed, so an edge that works keeps its exact output.
              if ( curve !== void 0 &&
                   curve.getPointsSize() < MINIMUM_BOUND_POINTS &&
                   isWholeCurveEdge( edgeCurve, edgeStart, edgeEnd ) ) {

                // extractCurve memoises an untrimmed extraction under the
                // BASIS curve's localID and owns it there.
                const untrimmed = this.extractCurve(
                    edgeCurve, true, true,
                    { exist: false, start: void 0, end: void 0 } )

                const recovered =
                  untrimmed !== void 0 &&
                  untrimmed.getPointsSize() > curve.getPointsSize()

                if ( recovered ) {

                  // Only now is the trimmed result known to be a defect rather
                  // than the curve's honest shape - a degree-1 B-spline over
                  // two control points really is two points, trimmed or not,
                  // and warning about those would be the false-row noise the
                  // comment further down argues against.
                  Logger.warning(
                      `Whole-curve trim on edge #${edgeElement.expressID} ` +
                      `(${EntityTypesAP214[edgeCurve.type]}) resolved to ` +
                      `${curve.getPointsSize()} point(s); recovered ` +
                      `${untrimmed!.getPointsSize()} untrimmed.` )

                  // The trimmed CurveObject is being dropped, and nothing else
                  // holds it: it was never added to this.curves, so without
                  // this its native allocation is unreachable.
                  curve.delete()
                  curve = untrimmed
                }

                // Memoise under the edge either way. The adjacent face's
                // ORIENTED_EDGE shares this edge, and without the entry it
                // re-runs the whole native trim extraction, re-warns, and
                // leaks a second trimmed curve.
                if ( curve !== void 0 && trimmingArguments.exist ) {

                  this.curves.add( edgeElement.localID, curve )
                }

              } else if ( curve !== void 0 && trimmingArguments.exist ) {

                this.curves.add( edgeElement.localID, curve )
              }
            }

            if (curve !== void 0) {

              // The memoised curve runs edge_start→edge_end when same_sense
              // held, edge_end→edge_start when the trims were swapped above
              // (and, for untrimmed basis curves like full B-splines, native
              // point order is parametric order — reversed relative to the
              // edge exactly when same_sense is false). Traversal for this
              // ORIENTED_EDGE must run with `orientation`, so invert on the
              // XOR of the two flags rather than orientation alone.
              if ( edge.orientation !== sameSense ) {
                // reverse curve
                // Logger.info("edge orientation == true, inverting curve")
                const invertedCurve = curve.clone()

                invertedCurve.invert()

                // push_back copies into the native vector, so the clone must
                // be freed here or its native memory leaks (the memoized
                // original in this.curves must NOT be freed).
                nativeEdgeCurves.push_back(invertedCurve)
                invertedCurve.delete()

              } else {

                nativeEdgeCurves.push_back(curve)
              }

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

            // push_back copies, so free the temporary point-pair curve.
            nativeEdgeCurves.push_back(curve)
            curve.delete()
          }
        }
      } else {
          Logger.warning(`Unsupported bound ${bound.bound}`)
          // Free this iteration's edge-curve vector, previously collected
          // loop curves and the face's partial bound vector before bailing
          // out, or they leak per bad face.
          nativeEdgeCurves.delete()
          for ( const loopCurve of loopCurves ) {
            loopCurve.delete()
          }
          bound3DVector.delete()
          return
      }

      const parameters: ParamsGetLoop = {
        points: vec3Array,
        edges: nativeEdgeCurves,
      }

      // Logger.info("isEdgeLoop: " + (isEdgeLoop) ? "TRUE" : "FALSE")
      const curve: CurveObject = this.conwayModel.getLoop(parameters)

      // No general "bound has fewer than 3 points" check here, deliberately.
      // It looks like the obvious backstop for the #479 family and it is not:
      // a VERTEX_LOOP is one point and zero edges BY DESIGN - the degenerate
      // loop at a sphere pole or cone apex - and it is legitimate input that
      // conway is expected to handle (bldrs-ai/conway#461). Measured on the
      // smoke subset, such a check fires 50 times across Right_Hand.step and
      // nist_ctc_01_asme1_rd.stp, and every one of those is a valid
      // VERTEX_LOOP or single-edge closed loop. Reporting them would put 50
      // false "the face will be dropped" rows into the blessed baseline, which
      // is the noise problem in #478 rather than a fix for it.
      //
      // The known real cause is handled above, where it IS distinguishable
      // from legitimate input.
      loopCurves.push( curve )
      loopIsOuter.push( bound.type === EntityTypesAP214.FACE_OUTER_BOUND )
      loopOrientations.push( bound.orientation )
      loopSeams.push(
        innerBound instanceof edge_loop ?
          isRetracingSeamLoop( innerBound.edge_list ) :
          false )

      vec3Array.delete()
      nativeEdgeCurves.delete()
    }

    // STEP allows a face's loops to all be plain FACE_BOUNDs; without a
    // FACE_OUTER_BOUND the native triangulators would warn ("Expected outer
    // bound, using fallback tesselation") and treat loops[0] as outer, which
    // is only right by luck (Onshape AP242 exports order hole loops first on
    // some faces). A face's outer loop strictly contains its holes, so tag
    // the loop with the largest bounding-box diagonal as the outer one.
    if ( loopCurves.length > 1 && !loopIsOuter.includes( true ) ) {

      let largestIndex = 0
      let largestDiagonal2 = -1

      for ( let loopIndex = 0; loopIndex < loopCurves.length; ++loopIndex ) {

        const loopCurve = loopCurves[ loopIndex ]
        const pointCount = loopCurve.getPointsSize()

        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let maxZ = -Infinity

        for ( let where = 0; where < pointCount; ++where ) {

          const point = loopCurve.get3d( where )

          minX = Math.min( minX, point.x )
          minY = Math.min( minY, point.y )
          minZ = Math.min( minZ, point.z )
          maxX = Math.max( maxX, point.x )
          maxY = Math.max( maxY, point.y )
          maxZ = Math.max( maxZ, point.z )
        }

        const diagonal2 =
          ( ( maxX - minX ) * ( maxX - minX ) ) +
          ( ( maxY - minY ) * ( maxY - minY ) ) +
          ( ( maxZ - minZ ) * ( maxZ - minZ ) )

        if ( pointCount > 0 && diagonal2 > largestDiagonal2 ) {
          largestDiagonal2 = diagonal2
          largestIndex = loopIndex
        }
      }

      loopIsOuter[ largestIndex ] = true
    }

    for ( let loopIndex = 0; loopIndex < loopCurves.length; ++loopIndex ) {

      const parametersCreateBounds3D: ParamsCreateBound3D = {
        curve: loopCurves[ loopIndex ],
        orientation: loopOrientations[ loopIndex ],
        type: loopIsOuter[ loopIndex ] ? 0 : 1,
        seam: loopSeams[ loopIndex ],
      }

      const bound3D: Bound3DObject = this.conwayModel.createBound3D(parametersCreateBounds3D)

      bound3DVector.push_back(bound3D)

      // createBound3D and push_back both copy, so the loop curve and the
      // bound wrapper are temporaries that must be freed to avoid leaking
      // native memory on every face bound.
      bound3D.delete()
      loopCurves[ loopIndex ].delete()
    }

    const surface = from.face_geometry

    // add face to geometry
    const nativeSurface = (new (this.wasmModule.IfcSurface)) as SurfaceObject
    
    this.extractSurface(surface, nativeSurface)

    nativeSurface.sameSense = from.same_sense

    // Declares the flag above as real, so the tessellator may orient the
    // face against the surface normal. Extractors that leave this false
    // (the IFC path today) keep the older projection-based orientation
    // rather than having a default-constructed sense read as an answer.
    // See https://github.com/bldrs-ai/conway/issues/459.
    nativeSurface.sameSenseKnown = true

    // Counted here rather than in a pass of its own: the lookup happens
    // anyway to build the parameters, so the coverage figure is one
    // comparison per face.
    const representationExtent = this.representationExtentForFace( from.localID )

    ++this.extentMeasuredFaceCount

    // Only a face that got NO floor needs classifying, and only then is the
    // second lookup paid. Going through the public method for the value
    // keeps one seam for "the floor for this face" — the extent's own tests
    // stub that method, and a counter that read the table directly would
    // quietly stop agreeing with what was actually passed to the native
    // side.
    if ( !( representationExtent > 0 ) ) {

      if ( this.representationExtentEntry( from.localID ) === void 0 ) {
        ++this.extentMissingFaceCount
      } else {
        ++this.extentDegenerateFaceCount
      }
    }

    const parameters: ParamsAddFaceToGeometry = {
      boundsArray: bound3DVector,
      advancedBrep: true,
      surface: nativeSurface,
      scaling: this.getLinearScalingFactor(),
      representationExtent,
    }

    const styledItemLocalID = this.materials.styledItemMap.get(from.localID)

    if ( styledItemLocalID !== void 0 ) {

      const styledItem =
        this.model.getElementByLocalID( styledItemLocalID ) as styled_item

      this.extractStyledItem( styledItem, from )

      const faceGeometry = (new (this.wasmModule.IfcGeometry)) as GeometryObject

      this.addOrStageFace(parameters, faceGeometry)
 
      const canonicalMesh: CanonicalMesh = {
        type: CanonicalMeshType.BUFFER_GEOMETRY,
        geometry: faceGeometry,
        localID: from.localID,
        model: this.model
      }

      this.model.geometry.add( canonicalMesh, parentLocalID )

    } else {

      this.addOrStageFace(parameters, geometry)
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

    // AP214's swept_curve is a bare curve, not a profile_def, so it goes
    // through extractCurve + createNativeIfcProfile like the revolution
    // path does. extractProfile() never fills nativeProfile for bare
    // curves, which silently dropped every linear-extrusion face (1,370
    // faces on the Jetenginestep compressor shaft alone).
    const nativeCurve = this.extractCurve( from.swept_curve )

    if ( nativeCurve === void 0 ) {

      Logger.warning('Couldn\'t get curve profile for linear extrusion surface')
      return
    }

    const parameters: ParamsCreateNativeIfcProfile = {
      curve: nativeCurve,
      holes: this.nativeVectorCurve(),
      isConvex: false,
      isComposite: false,
      profiles: this.nativeVectorProfile(),
    }

    const nativeProfile = this.conwayModel.createNativeIfcProfile(parameters)

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
      profile: nativeProfile,
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

    // 2) Create a Float64Array view into WASM memory, over the heap as it is
    // after the _malloc above rather than over whatever view the module had
    // cached before it - see wasm_heap.ts for why those can differ. Built
    // rather than subarray'd off HEAPF64 for the same reason: subarray clamps
    // an out-of-range window into a short one, and the set() loop below would
    // then quietly write somewhere other than the allocation (#485).
    const wasmFloat64View =
      wasmHeapView(this.wasmModule, Float64Array, pointer, capacity)

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

          // Push your result somewhere (push_back copies, so free the
          // temporary bound wrapper to avoid leaking native memory).
          bound3DVector.push_back(bound3D)
          bound3D.delete()

          // Save the buffer for reuse in the next iteration
          this.pointBuffer = result
        }
      }

      // add face to geometry
      const parameters: ParamsAddFaceToGeometrySimple = {
        boundsArray: bound3DVector,
        scaling: this.getLinearScalingFactor(),
        representationExtent: this.representationExtentForFace( from.localID ),
      }

      this.addOrStageFaceSimple(parameters, geometry)

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
   * Extract a placement, adding it to the scene.
   *
   * @param from The placement to extract.
   * @param mappedItem Whether the placement is a mapped item.
   * @return The extracted placement or undefined if the placement is not a axis2_placement_3d.
   */
  extractPlacement(from: placement, mappedItem: boolean = false ): AP214SceneTransform | undefined {
    if (from instanceof axis2_placement_3d) {
      const placementTransform = this.extractRawPlacement(from)
      if (placementTransform) {
        this.scene.addTransform(
          from.localID,
          placementTransform.getValues(),
          placementTransform,
          true
        )
      }
    }
    if (from instanceof axis2_placement_3d) {
      return this.extractAxis2Placement3D(from, from.localID, false, true)
    }
  }


  extractRawPlacement(from: placement ): NativeTransform4x4 | undefined {
    if (from instanceof axis2_placement_3d) {
      const parameters = this.extractAxis2Placement3D(from, from.localID, true )
      return this.conwayModel.getAxis2Placement3D(parameters)
    }
    return
  }

  /**
   * Multiply a native 4x4 transform by a uniform scale factor in affine
   * semantics: scale both the 3x3 basis and the translation column,
   * leaving the bottom row at [0,0,0,1]. Equivalent to `factor * mat`
   * for any affine input.
   *
   * Used in preference to the native `uniformScale` binding for unit
   * conversion, where the placement's translation also needs to be
   * scaled. See https://github.com/bldrs-ai/conway/issues/308.
   *
   * @param mat Source column-major Glmdmat4 transform; not mutated.
   * @param factor Scalar applied to every affine entry.
   * @return A freshly allocated 4x4 with the scale applied.
   */
  private uniformScaleAffine( mat: NativeTransform4x4, factor: number ): NativeTransform4x4 {
    const v = mat.getValues().slice()
    // Column-major Glmdmat4 layout:
    //   basis at 0,1,2 / 4,5,6 / 8,9,10
    //   translation at 12,13,14
    //   bottom row at 3,7,11,15 (untouched: [0,0,0,1])
    v[0]  *= factor; v[1]  *= factor; v[2]  *= factor
    v[4]  *= factor; v[5]  *= factor; v[6]  *= factor
    v[8]  *= factor; v[9]  *= factor; v[10] *= factor
    v[12] *= factor; v[13] *= factor; v[14] *= factor
    const result = ( new ( this.wasmModule.Glmdmat4 ) ) as NativeTransform4x4
    result.setValues( v )
    return result
  }

  /**
   * Multiply only the 3x3 basis of a native 4x4 transform by a uniform
   * scale factor, leaving the translation column (and bottom row)
   * untouched. This is the RIGID-transform unit-conversion semantics:
   * a relationship/assembly placement's offset is a physical position
   * that has already been reconciled into the target unit elsewhere, so
   * rescaling it here would collapse mixed-unit sub-components toward the
   * origin (the issue #308 "port cluster"). Contrast `uniformScaleAffine`,
   * which also scales translation and is correct only for identity-input
   * geometry-frame conversions where the translation is zero.
   *
   * See https://github.com/bldrs-ai/conway/issues/308 and PR #309.
   *
   * @param mat Source column-major Glmdmat4 transform; not mutated.
   * @param factor Scalar applied to the 3x3 basis entries only.
   * @return A freshly allocated 4x4 with the basis scaled.
   */
  private uniformScaleBasis( mat: NativeTransform4x4, factor: number ): NativeTransform4x4 {
    const v = mat.getValues().slice()
    // Column-major Glmdmat4 layout: basis at 0,1,2 / 4,5,6 / 8,9,10.
    // Translation (12,13,14) and bottom row (3,7,11,15) left as-is.
    v[0] *= factor; v[1] *= factor; v[2]  *= factor
    v[4] *= factor; v[5] *= factor; v[6]  *= factor
    v[8] *= factor; v[9] *= factor; v[10] *= factor
    const result = ( new ( this.wasmModule.Glmdmat4 ) ) as NativeTransform4x4
    result.setValues( v )
    return result
  }

  /**
   * The root transform taking a shape representation's own length unit
   * into conway's world space.
   *
   * World space is METRES. That convention is set by the IFC path, which
   * folds `linearScalingFactor` — metres per file unit — into its
   * coordination matrix (`compat/web-ifc/coordination_f64.ts`). STEP
   * geometry is emitted in raw file coordinates instead, so the
   * whole-model unit conversion has to ride on this root transform.
   *
   * The factor is therefore metres-per-file-unit itself: a millimetre
   * file scales by 1e-3. It is NOT the reciprocal — using `1 / unitInM`
   * put every millimetre STEP model into world space 1e6x too large,
   * and 1e6x out of step with any IFC model federated beside it. That
   * went unseen because Share frames the camera from the model's own
   * bounds, which absorbs a uniform scale error, and because the
   * regression digests hash geometry in file coordinates, which this
   * transform never touches.
   * See https://github.com/bldrs-ai/conway/issues/458.
   *
   * @param shapeRepresentation The representation whose unit context to read.
   * @return The scale transform, or undefined if no length unit is declared.
   */
  private rootUnitScaleTransform(
      shapeRepresentation: shape_representation ): NativeTransform4x4 | undefined {

    const sourceShapeContext =
      shapeRepresentation.context_of_items.findVariant( global_unit_assigned_context )?.units?.
        find( ( unit ) => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as
          length_unit | undefined

    if ( sourceShapeContext === void 0 ) {

      return void 0
    }

    const sourceUnitInM = this.convertToMetres( sourceShapeContext ) ?? 1.0

    return this.uniformScaleAffine( this.identity3DNativeMatrix, sourceUnitInM )
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
        if ( !this.quietRecoverableLogging ) {
          // toString(), not localID: localID is the dense internal index and
          // means nothing against the source file, and these land in the
          // regression run's `expressids` column where the whole point is to
          // be able to go look at the record. It also spells the inline case
          // honestly rather than passing off an index as a reference.
          Logger.error(
            `Error populating styled item map: ${error}`, styledItem.toString() )
        }
      }
    }
    
    for ( const overridingStyledItem of overridingStyledItems ) {

      try {
        if ( overridingStyledItem.item !== null ) {
          styledItemMap.set( overridingStyledItem.item.localID, overridingStyledItem.localID )
        }
      } catch (error) {
        if ( !this.quietRecoverableLogging ) {
          Logger.error(
            `Error populating overriding styled item map: ${error}`,
            overridingStyledItem.toString() )
        }
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
  /**
   * Prepare per-unit demand extraction (STEP demand parity phase 2)
   * without executing any geometry work: builds the assembly tree and
   * thunks exactly like the whole-model walk, but the root executions
   * are captured as an ordered list of UNITS. The tree is flattened
   * DEPTH FIRST — one unit per child (descending into any child whose
   * subtree carries more than {@link AP214_ITEMS_PER_DEMAND_UNIT}
   * items), then one unit per range of a node's own representation
   * items — so a single-root assembly pumps progressively all the way
   * down to individual solids rather than per top-level part
   * (conway#579: Arty's silkscreen is 654 solids sitting two levels
   * under the only root, which used to make it one 22 s task).
   * Executing every unit in order then calling
   * {@link finishDemandExtraction} reproduces the whole-model walk
   * exactly — the classic {@link extractAP214GeometryData} runs through
   * this same path. Idempotent.
   */
  // eslint-disable-next-line max-lines-per-function
  public prepareDemandExtraction(): void {

    if ( this.demandUnits_ !== void 0 ) {
      return
    }

    const model = this.model

    type MappedSceneNode = {
      children?: [number, number, NativeTransform4x4?][];
      parents?: number;
      thunk?: ( owningLocalID?: number, transform?: NativeTransform4x4 ) => void;
      node?: AP214SceneTransform;
      processed?: boolean;
      rep?: shape_representation;
      owningLocalID?: number;
    }

    type ThunkSlice = {
      childStart: number;
      childEnd: number;
      includeItems: boolean;
      /**
       * Half-open range into `representation.items`; whole array when
       * absent. Only meaningful with `includeItems`.
       */
      itemStart?: number;
      itemEnd?: number;
      /**
       * Indices of the `placement` items before `itemStart` that this
       * range re-extracts first, rebuilding the transform state the
       * unsliced walk had reached by then.
       */
      replayPlacements?: readonly number[];
      /**
       * Runs in place of the selected child's own thunk, so a unit can
       * address a slice of a node DEEPER than one level down. Built by
       * expandUnits from the child's own rep/owningLocalID, which is
       * what makes it a drop-in for `mappedChild.thunk`.
       */
      childThunk?: ( owningLocalID?: number, transform?: NativeTransform4x4 ) => void;
    }

    const treeMap = new Map<number, MappedSceneNode>()

    const makeThunk = (
        representation: shape_representation,
        owningElementLocalID?: number,
        mappedTreeNode?: MappedSceneNode,
        slice?: ThunkSlice ) => {

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
            true,
          )
        }

        if ( mappedTreeNode?.children !== void 0 &&
            ( slice === void 0 || slice.childStart !== slice.childEnd ) ) {
          const sliceChildren = slice !== void 0 ?
            mappedTreeNode.children.slice( slice.childStart, slice.childEnd ) :
            mappedTreeNode.children

          for ( const [childLocalID, childOwningLocalID, childTransform] of sliceChildren ) {
            const mappedChild = treeMap.get( childLocalID )!
            const enterChildStackDepth = this.scene.stackLength
            const enterChildParent = this.scene.currentParent

            // A context_dependent_shape_representation places a part via a
            // product_definition_shape whose `definition` is the NAUO the
            // product-structure tree keys occurrences on
            // (represented_product_relation -> PDS -> NAUO). Record that NAUO's
            // express id so geometry added under this child carries the same
            // root->leaf occurrence path the tree node does; other placement
            // kinds fall back to the owning element's own id.
            const owningElement = this.model.getElementByLocalID( childOwningLocalID )
            // `.definition` is a getter that THROWS on a malformed/mistyped
            // reference, and this runs outside the per-child try/catch below —
            // at the top level it would escape extraction entirely. Before
            // occurrence stamping a bad placement merely produced no geometry,
            // so guard it and degrade to the owning element's own express id
            // rather than failing the whole model load.
            let occurrenceExpressID: number | undefined
            try {
              occurrenceExpressID =
                owningElement instanceof property_definition ?
                  owningElement.definition?.expressID : void 0
            } catch {
              // Malformed PDS.definition — fall through to the express-id fallback.
              occurrenceExpressID = void 0
            }
            occurrenceExpressID ??= this.model.getExpressIDByLocalID( childOwningLocalID )
            this.scene.pushOccurrence( occurrenceExpressID ?? childOwningLocalID )

            try {
              // A sliced unit that reaches deeper than this level supplies
              // the child's thunk itself (carrying the sub-slice); every
              // other unit runs the child's own whole-subtree thunk.
              const runChild = slice?.childThunk ?? mappedChild.thunk!

              runChild( childOwningLocalID, childTransform )
            } catch ( ex ) {
              if ( this.quietRecoverableLogging ) {
                // Preview prefix: dangling children are expected — skip quietly.
              } else if ( ex instanceof Error ) {
                Logger.error( `Error processing child shape_representation: \n\t${ex.name}\n\t${ex.message}\n\texpressID: #${this.model.getExpressIDByLocalID( childLocalID )}` )
              } else {
                Logger.error( `Unknown exception processing child shape_representation (${ex}) expressID: #${this.model.getExpressIDByLocalID( childLocalID )}` )
              }
            }

            this.scene.popOccurrence()

            while ( this.scene.stackLength > enterChildStackDepth ) {
              this.scene.popTransform()
            }

            if( ( this.scene.stackLength !== enterChildStackDepth ||
                this.scene.currentParent !== enterChildParent ) && !this.quietRecoverableLogging ) {
              Logger.error( `Stack length mismatch after processing child shape_representation ${this.scene.currentParent} ${enterChildParent} expressID: #${representation.expressID}` )
            }
          }
        }
                
        const includeItems = slice?.includeItems ?? true

        // `representation.items` is a dereferencing getter, so keep it
        // untouched when this slice carries no items at all — the
        // pre-slicing code never read it in that case either.
        const items = includeItems ? representation.items : []
        const itemStart = slice?.itemStart ?? 0
        const itemEnd = Math.min( slice?.itemEnd ?? items.length, items.length )

        // Rebuild the transform state the unsliced walk had reached by
        // `itemStart`: a `placement` item pushes onto the scene stack and
        // nothing pops it before the end of the loop, so every placement
        // ahead of this range places the items in it. Re-extracting them
        // is exactly the work the whole walk did, in the same order.
        // Failures stay silent here — every placement also falls inside
        // the one range that owns it, which reports it there rather than
        // once per range that replays it.
        for ( const replayIndex of slice?.replayPlacements ?? [] ) {

          const replayItem = items[ replayIndex ]

          if ( replayItem instanceof placement ) {
            try {
              this.extractPlacement( replayItem, mappedItem )
            } catch {
              // Reported by the range that extracts this placement itself.
            }
          }
        }

        // Slicing this loop into units rests on exactly one invariant:
        // only a `placement` leaves transform state behind for the items
        // after it. Check it per item on sliced units, so an item kind
        // that ever starts pushing without popping surfaces as an error
        // instead of as silently misplaced geometry two ranges later.
        const verifySliceNeutrality = slice?.itemStart !== void 0

        for ( let itemIndex = itemStart; itemIndex < itemEnd; ++itemIndex ) {

          const item = items[ itemIndex ]
          const depthBeforeItem = verifySliceNeutrality ? this.scene.stackLength : 0

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
            // Recoverable: the item is skipped and the walk continues, so this
            // is quiet for the same reason the stack-mismatch guard below is.
            // A prefix extraction (parse-time preview channel) hits dangling
            // records BY CONSTRUCTION, and an ungated stack per item turned an
            // otherwise-healthy Arty load into four red console errors
            // (conway#580).
            if ( !this.quietRecoverableLogging ) {
              if (ex instanceof Error) {
                // Stack included for the same reason extractFaces includes it:
                // this family's message is the same string for every occurrence
                // ("Value in select must be populated" accounts for all 274 in
                // the NIST AP242 set), so without a stack there is nothing to
                // tell one occurrence from another or say WHICH select failed.
                Logger.error( `Error processing representation item: \n\t${ex.name}\n\t${ex.message}\n\t${ex.stack}\n\texpressID: #${item.expressID}` )
              } else {
                Logger.error(`Unknown exception processing representation item (${ex}) expressID: #${item.expressID}`)
              }
            }
          } finally {

            if ( verifySliceNeutrality && !( item instanceof placement ) &&
                this.scene.stackLength !== depthBeforeItem &&
                !this.quietRecoverableLogging ) {
              Logger.error( `Representation item left transform state inside a sliced range expressID: #${item.expressID}` )
            }
          }
        }

        while ( this.scene.stackLength > entryTransformDepth ) {
          this.scene.popTransform()
        }

        if( ( this.scene.stackLength !== entryTransformDepth ||
            this.scene.currentParent !== currentParent ) && !this.quietRecoverableLogging ) {
          Logger.error( `Stack length mismatch after processing shape_representation  ${this.scene.currentParent} ${currentParent} expressID: #${representation.expressID}` )
        }
      }
    }

    /** One demand unit's worth of a representation's items. */
    type ItemUnitRange = {
      itemStart: number;
      itemEnd: number;
      replayPlacements?: readonly number[];
    }

    /**
     * Split a node's `representation.items` into the contiguous ranges
     * that become one demand unit each — or undefined to keep the single
     * whole-items unit (conway#579).
     *
     * Slicing an ordered `for` loop into contiguous index ranges visits
     * the same items in the same order, so the geometry is unchanged
     * PROVIDED the state the loop carries is reproduced at each cut.
     * Exactly one item kind carries state: a `placement` runs
     * extractPlacement, which pushes onto the scene transform stack, and
     * nothing pops it before the loop ends — so it places every item
     * after it in the array. Each range therefore replays the placements
     * that precede it (`replayPlacements`), and cutting stops once that
     * replay list would exceed {@link AP214_MAX_REPLAYED_PLACEMENTS}.
     * Every other item kind is stack-neutral: extractMappedItem pops
     * exactly what it pushed, and extractStyledItemWithProcessing and
     * extractRepresentationItem never touch the stack (both discard
     * placements) — an invariant the thunk re-checks per item on every
     * sliced unit.
     *
     * @param representation The node's representation.
     * @return {ItemUnitRange[] | undefined} Two or more ranges, or
     * undefined for a single unsliced items unit.
     */
    const itemUnitRanges = ( representation: shape_representation ):
        ItemUnitRange[] | undefined => {

      let items: readonly representation_item[]

      try {
        items = representation.items
      } catch {
        // Malformed items reference — leave it to the thunk, which
        // already reports the throw the way the unsliced walk did.
        return void 0
      }

      const itemCount = items.length

      if ( itemCount <= this.demandItemsPerUnit ) {
        return void 0
      }

      // Grow the range past the nominal size on very long item lists, so
      // the unit count stays bounded per representation.
      const itemsPerUnit = Math.max(
          this.demandItemsPerUnit,
          Math.ceil( itemCount / AP214_MAX_ITEM_UNITS_PER_REPRESENTATION ) )

      const ranges: ItemUnitRange[] = []

      // Placements before `start` (replayed by every later range) and
      // those found in the range being built (replayed by the ranges
      // after it).
      const replayed: number[] = []
      const pending: number[] = []

      let start = 0

      for ( let cursor = 0; cursor < itemCount; ++cursor ) {

        if ( items[ cursor ] instanceof placement ) {
          pending.push( cursor )
        }

        // Cut only on a full range, and never on the last item — the
        // remainder is pushed as the tail range below.
        if ( cursor + 1 - start < itemsPerUnit ||
            cursor + 1 >= itemCount ) {
          continue
        }

        // Past the replay ceiling, stop cutting: the tail runs whole,
        // exactly as the unsliced walk would have run all of it.
        if ( replayed.length + pending.length > AP214_MAX_REPLAYED_PLACEMENTS ) {
          break
        }

        ranges.push( {
          itemStart: start,
          itemEnd: cursor + 1,
          replayPlacements: replayed.length > 0 ? replayed.slice() : void 0,
        } )

        replayed.push( ...pending )
        pending.length = 0
        start = cursor + 1
      }

      if ( ranges.length === 0 ) {
        return void 0
      }

      ranges.push( {
        itemStart: start,
        itemEnd: itemCount,
        replayPlacements: replayed.length > 0 ? replayed.slice() : void 0,
      } )

      return ranges
    }

    // Roots the whole-model walk would execute, in execution order —
    // expanded into units at the end of preparation (children arrays
    // are final only once every edge loop has run).
    const pendingRoots: {
      node: MappedSceneNode,
      scaleTransform?: NativeTransform4x4,
    }[] = []

    {
      this.scene.clearParentStack()

      // 256 meg limit for memoization - smaller models get a big
      // win from memoization, but much larger models it uses far too much heap.

      const MEMOIZATION_THRESHOLD = 256 * 1024 * 1024

      // Remembered for finishDemandExtraction / the classic wrapper's
      // finally — the pump spans many calls, so restoration cannot live
      // in a single method's finally anymore.
      this.demandMemoizationRestore_ = this.model.elementMemoization

      if ( this.lowMemoryMode || model.bufferBytesize > MEMOIZATION_THRESHOLD ) {
        this.model.elementMemoization = false
      }

      this.populateStyledItemsMap()

      const contextDependentShapeRepresentations = model.types(context_dependent_shape_representation)

      const shapeRepresentationRelationshipsSeen = new Set<number>()

      // Representation → product_definition (via each SDR's PDS), used to
      // orient CDSR assembly edges semantically below.
      const productDefLocalIDByRep = new Map<number, number>()

      for ( const sdr of model.types( shape_definition_representation ) ) {
        try {
          const usedRepresentation = sdr.used_representation
          const definition = sdr.definition
          const productDef =
            definition instanceof product_definition_shape ? definition.definition : void 0

          if ( usedRepresentation?.localID !== void 0 &&
              productDef instanceof product_definition ) {
            productDefLocalIDByRep.set( usedRepresentation.localID, productDef.localID )
          }
        } catch {
          // Malformed SDR reference — the rep just stays un-mapped and the
          // orientation check below keeps the legacy reading for it.
        }
      }

      for ( const contextDependentShapeRepresentation of
        contextDependentShapeRepresentations ) {

        // Per-record containment: reference getters throw on
        // malformed/dangling records (a mid-parse PREFIX model — the
        // preview channel's snapshots — always has a truncated tail).
        // One bad edge record skips, it must not abort the whole
        // preparation.
        let assembly
        let shapeRelationship

        try {
          assembly = contextDependentShapeRepresentation.represented_product_relation
          shapeRelationship = contextDependentShapeRepresentation.representation_relation
        } catch {
          continue
        }

        const owningLocalID = assembly.localID
        shapeRepresentationRelationshipsSeen.add( shapeRelationship.localID )

        /* Exporters disagree on the rep_1/rep_2 order of an assembly
         * placement relationship: as1-style files write (child, parent),
         * SolidWorks writes (parent, child). Reading it wrong inverts the
         * whole walk — the part representation becomes a walk root, its
         * geometry loses the NAUO occurrence segment (breaking NavTree↔scene
         * selection downstream), and a part reused across several NAUOs
         * collapses to a single placement (the NEMA 23 screws). The CDSR's
         * own NAUO is the authority: `relating` is the parent product,
         * `related` the child — orient the edge by matching each rep's
         * SDR-bound product definition against them, and keep the legacy
         * (child, parent) reading when the match is ambiguous/unresolvable.
         */
        let sourceShape
        let targetShape

        try {
          sourceShape = shapeRelationship.rep_1
          targetShape = shapeRelationship.rep_2
        } catch {
          continue
        }

        let orientationFlipped = false

        try {
          const nauo = assembly.definition

          if ( nauo instanceof next_assembly_usage_occurrence ) {

            const relatingLocalID = nauo.relating_product_definition?.localID
            const relatedLocalID = nauo.related_product_definition?.localID
            const rep1ProductDef = productDefLocalIDByRep.get( sourceShape.localID )
            const rep2ProductDef = productDefLocalIDByRep.get( targetShape.localID )

            if ( relatingLocalID !== void 0 && relatedLocalID !== void 0 &&
                relatingLocalID !== relatedLocalID &&
                rep1ProductDef === relatingLocalID && rep2ProductDef === relatedLocalID ) {
              sourceShape = shapeRelationship.rep_2
              targetShape = shapeRelationship.rep_1
              orientationFlipped = true
            }
          }
        } catch {
          // Malformed NAUO/PDS reference — keep the legacy orientation.
        }

        let transform
        let isContinue

        try {
          [transform, isContinue] = this.doTransforms(
              shapeRelationship, sourceShape, targetShape, owningLocalID, orientationFlipped)
        } catch {
          // Malformed transform record (prefix truncation) — skip the edge.
          continue
        }

        if (isContinue) {
          continue
        }

        const sourceID = sourceShape.localID
        const targetID = targetShape.localID
        let sourceNode = treeMap.get( sourceID )

        if ( sourceNode === void 0 ) {
          sourceNode = { parents: 1 }
          treeMap.set( sourceID, sourceNode )
          sourceNode.thunk = makeThunk( sourceShape, owningLocalID, sourceNode )
          sourceNode.rep = sourceShape
          sourceNode.owningLocalID = owningLocalID
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
        let sourceShape
        let targetShape
        let transform
        let isContinue

        try {
          sourceShape = shapeRelationship.rep_2
          targetShape = shapeRelationship.rep_1;

          [transform, isContinue] =
            this.doTransforms(shapeRelationship, sourceShape, targetShape, owningLocalID)
        } catch {
          // Malformed relationship/transform record (prefix truncation)
          // — skip the edge.
          continue
        }

        if (isContinue) {
          continue
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
        sourceNode.rep = sourceShape
        sourceNode.owningLocalID = owningLocalID

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

        let shapeRepresentation
        let definition

        try {
          shapeRepresentation = shapeDefinitionRepresentation.used_representation

          if ( !( shapeRepresentation instanceof shape_representation ) ) {
            continue
          }

          definition = shapeDefinitionRepresentation.definition
        } catch {
          // Malformed SDR record (prefix truncation) — skip it.
          continue
        }

        //this.scene.clearParentStack()

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
        mappedTreeNode.rep = shapeRepresentation
        mappedTreeNode.owningLocalID = owningElementLocalID

        if ( !hasMappedNode ) {
          mappedTreeNode.processed = true

          let scaleTransform : NativeTransform4x4 | undefined = void 0

          try {
            scaleTransform = this.rootUnitScaleTransform( shapeRepresentation )
          } catch {
            // Malformed unit context (prefix truncation) — no unit scale.
            scaleTransform = void 0
          }

          // not an assembly mapped item — capture as a pending root
          // instead of executing inline (these nodes are childless by
          // construction: they were absent from the tree before this
          // loop, and all edges were added by the earlier loops).
          pendingRoots.push( {
            node: mappedTreeNode,
            scaleTransform,
          } )
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
        mappedTreeNode.rep = shapeRepresentation
        mappedTreeNode.owningLocalID = owningElementLocalID
      }

      // All thunks are set — capture remaining assembly-tree roots as
      // pending roots in the exact order the whole-model walk executed
      // them.
      for ( const [sourceID, mappedNode] of treeMap.entries() ) {
        if ( ( mappedNode.parents ?? 0 ) === 0 && mappedNode.thunk !== void 0 && mappedNode.processed !== true ) {

          let scaleTransform : NativeTransform4x4 | undefined = void 0

          try {
            const shapeRepresentation = this.model.getTypedElementByLocalID( sourceID, shape_representation )! as shape_representation
            scaleTransform = this.rootUnitScaleTransform( shapeRepresentation )
          } catch {
            // Malformed unit context (prefix truncation) — no unit scale.
            scaleTransform = void 0
          }

          pendingRoots.push( { node: mappedNode, scaleTransform } )
        }
      }

      // Expand pending roots into ordered execution units, depth first:
      // each node contributes one unit per child (recursing into a child
      // whose subtree is big enough to be worth splitting) and then one
      // unit per range of its own representation items — the same
      // children-then-items order the thunk body itself walks, so the
      // concatenated units reproduce the whole-model walk exactly.
      const units: ( () => void )[] = []

      // Recursive item count per tree node — the cost proxy that decides
      // whether descending into a child buys any granularity at all.
      // Cheap: `.items` is one dereference per representation, and each
      // node is counted once.
      const subtreeItemCounts = new Map<MappedSceneNode, number>()

      const ownItemCount = ( node: MappedSceneNode ): number => {

        if ( node.rep === void 0 ) {
          return 0
        }

        try {
          return node.rep.items.length
        } catch {
          // Malformed items reference — the thunk reports it at run time.
          return 0
        }
      }

      const subtreeItemCount = (
          node: MappedSceneNode,
          path: Set<MappedSceneNode> ): number => {

        const memoized = subtreeItemCounts.get( node )

        if ( memoized !== void 0 ) {
          return memoized
        }

        // A malformed assembly can close a cycle; count it as spent
        // rather than recursing forever, and do not memoize a count
        // that a truncation made wrong for other paths.
        if ( path.has( node ) ) {
          return 0
        }

        path.add( node )

        let count = ownItemCount( node )

        for ( const [ childLocalID ] of node.children ?? [] ) {

          const child = treeMap.get( childLocalID )

          if ( child !== void 0 ) {
            count += subtreeItemCount( child, path )
          }
        }

        path.delete( node )
        subtreeItemCounts.set( node, count )

        return count
      }

      /**
       * Emit the units for one tree node, in the exact order the node's
       * own thunk would have executed: each child in turn, then the
       * node's own items.
       *
       * `wrap` turns a slice OF THIS NODE into a queued unit — for a
       * root that is "run this slice under the root scale transform",
       * and for a descendant it is the parent's own wrap closed over a
       * `childThunk` carrying this node's slice. That composition is
       * what lets a unit address a node arbitrarily deep in the
       * assembly while still entering through the root, which is what
       * keeps the transform and occurrence context identical to the
       * unsliced walk.
       *
       * @param node The tree node to emit units for.
       * @param path Nodes already on this descent, so a malformed
       * assembly that closes a cycle stops rather than recursing.
       * @param wrap Queues one unit for a slice of `node`.
       */
      const expandUnits = (
          node: MappedSceneNode,
          path: Set<MappedSceneNode>,
          wrap: ( slice: ThunkSlice ) => void ): void => {

        const childCount = node.children?.length ?? 0

        for ( let child = 0; child < childCount; ++child ) {

          const childNode = treeMap.get( node.children![ child ][ 0 ] )

          // Descend only into children that are (a) well-formed enough
          // to slice, (b) not already on this path (a malformed assembly
          // can close a cycle), and (c) big enough that splitting them
          // buys anything. Everything else runs whole, as one unit
          // covering its entire subtree.
          const descend =
            childNode !== void 0 &&
            childNode.rep !== void 0 &&
            childNode.thunk !== void 0 &&
            !path.has( childNode ) &&
            subtreeItemCount( childNode, new Set<MappedSceneNode>() ) >
              this.demandItemsPerUnit

          if ( !descend ) {
            wrap( { childStart: child, childEnd: child + 1, includeItems: false } )
            continue
          }

          const descendant = childNode!

          path.add( descendant )

          expandUnits( descendant, path, ( childSlice ) => {

            const childThunk = makeThunk(
                descendant.rep!, descendant.owningLocalID, descendant, childSlice )

            wrap( {
              childStart: child,
              childEnd: child + 1,
              includeItems: false,
              childThunk,
            } )
          } )

          path.delete( descendant )
        }

        const itemRanges = node.rep !== void 0 ? itemUnitRanges( node.rep ) : void 0

        if ( itemRanges === void 0 ) {
          wrap( { childStart: 0, childEnd: 0, includeItems: true } )
          return
        }

        for ( const range of itemRanges ) {
          wrap( { childStart: 0, childEnd: 0, includeItems: true, ...range } )
        }
      }

      for ( const root of pendingRoots ) {

        const node = root.node
        const scaleTransform = root.scaleTransform
        const rep = node.rep

        if ( rep === void 0 ) {
          units.push( () => node.thunk!( void 0, scaleTransform ) )
          continue
        }

        expandUnits( node, new Set<MappedSceneNode>( [ node ] ), ( slice ) => {

          const sliced = makeThunk( rep, node.owningLocalID, node, slice )

          units.push( () => sliced( void 0, scaleTransform ) )
        } )
      }

      this.demandUnits_ = units
    }
  }

  /**
   * Items one demand unit carries, and equivalently the subtree size a
   * child has to exceed before {@link prepareDemandExtraction} descends
   * into it — {@link AP214_ITEMS_PER_DEMAND_UNIT} by default.
   *
   * Set before preparation. `Infinity` collapses the flattening back to
   * one unit per immediate child of a root plus one for the root's own
   * items, which is what makes "same model, two granularities, identical
   * geometry" a testable claim (conway#579) rather than an argument.
   */
  public demandItemsPerUnit: number = AP214_ITEMS_PER_DEMAND_UNIT

  // Ordered pending execution units built by prepareDemandExtraction;
  // demandCursor_ tracks how many have run (the pump's progress).
  private demandUnits_?: ( () => void )[]
  private demandCursor_ = 0
  private demandMemoizationRestore_?: boolean

  /**
   * Total demand units (see prepareDemandExtraction).
   *
   * @return {number} The unit count (0 before preparation).
   */
  public get demandUnitCount(): number {
    return this.demandUnits_?.length ?? 0
  }

  /**
   * Units already executed by extractDemandUnitBatch.
   *
   * @return {number} The cursor.
   */
  public get demandUnitCursor(): number {
    return this.demandCursor_
  }

  /**
   * Advance the unit cursor WITHOUT executing (parse-time preview
   * generations resume a global ordinal on a fresh prefix extraction —
   * earlier units were already emitted from earlier generations).
   *
   * @param count Units to skip.
   */
  public skipDemandUnits( count: number ): void {

    const units = this.demandUnits_

    if ( units === void 0 ) {
      return
    }

    this.demandCursor_ = Math.min( this.demandCursor_ + Math.max( count, 0 ), units.length )
  }

  /**
   * Execute the next `count` demand units (STEP demand parity phase 2)
   * — the per-unit pump behind the shim's ExtractGeometryBatch for
   * AP214 models. Staged face tessellation is finalized after every
   * batch so captured geometry is complete and readable.
   *
   * `budgetMs` is what keeps an interactive caller's thread responsive
   * now that a unit is a slice rather than a product. Unit cost is wildly
   * uneven both across models and inside one: Arty_Z7's 603 units average
   * 58 ms but run from under a millisecond to 600 ms (a single silkscreen
   * solid), while DSA2's average 32 ms. No fixed unit-count-per-call
   * serves that — it either overshoots the frame budget on the expensive
   * units or burns hundreds of calls on the cheap ones — so a caller with
   * a frame to hit passes a wall-clock budget and gets as many units as
   * fit. One unit always runs: a single unit that overruns the budget is
   * the floor this layer can offer, and shrinking it further is geometry
   * cost, not granularity (conway#564). Callers that want completion
   * rather than responsiveness (the whole-model walk, the deferred drain)
   * pass no budget and keep the pre-conway#579 behaviour exactly.
   *
   * @param count Max units to execute this call (min 1).
   * @param budgetMs Wall-clock this call may spend before returning
   * early; unbounded when absent.
   * @return {number} Units actually executed.
   */
  public extractDemandUnitBatch( count: number, budgetMs?: number ): number {

    const units = this.demandUnits_

    if ( units === void 0 ) {
      return 0
    }

    const end = Math.min( this.demandCursor_ + Math.max( count, 1 ), units.length )
    const deadline = budgetMs !== void 0 ? Date.now() + budgetMs : void 0
    let executed = 0

    for ( ; this.demandCursor_ < end; ++this.demandCursor_ ) {
      try {
        units[ this.demandCursor_ ]()
        ++executed
      } catch ( ex ) {
        if ( this.quietRecoverableLogging ) {
          // Preview prefix: failing units are expected — retried on a
          // richer generation, and the durable extraction re-runs all.
        } else if ( ex instanceof Error ) {
          Logger.error( `Error processing demand unit: \n\t${ex.name}\n\t${ex.message}` )
        } else {
          Logger.error( `Unknown exception processing demand unit (${ex})` )
        }
      }

      if ( deadline !== void 0 ) {

        // Under staged tessellation a unit mostly ENQUEUES face jobs, so
        // the loop's own elapsed time under-reports what the call has
        // committed to — the flush after the loop would then run all of
        // it outside the deadline, and a nominal 50 ms batch measured
        // 996 ms on Arty. Flush per unit so the budget bounds the
        // tessellation and not just the enqueueing. Unbudgeted callers
        // (the whole-model walk, the deferred drain) skip this and keep
        // one big staged batch, which is where staging's throughput
        // actually matters.
        if ( this.useStagedFaces ) {
          this.finalizeStagedFaces()
        }

        if ( Date.now() >= deadline ) {
          ++this.demandCursor_
          break
        }
      }
    }

    // Deferred face tessellation must land before geometry is read.
    this.finalizeStagedFaces()

    return executed
  }

  /**
   * Complete a demand extraction after every unit has run: final staged
   * tessellation, temporaries cleanup, point-buffer release and
   * memoization restore — the tail the whole-model walk runs.
   *
   * @return {[ExtractResult, AP214SceneBuilder, AP214ProductShapeMap]}
   * The completed extraction result.
   */
  public finishDemandExtraction():
    [ExtractResult, AP214SceneBuilder, AP214ProductShapeMap] {

    this.finalizeStagedFaces()

    if ( RegressionCaptureState.memoization !== MemoizationCapture.FULL ) {
      this.model.geometry.deleteTemporaries()
    }

    if (this.pointBuffer?.pointer) {
      this.wasmModule._free(this.pointBuffer.pointer)
      this.pointBuffer = null
    }

    if ( this.demandMemoizationRestore_ !== void 0 ) {
      this.model.elementMemoization = this.demandMemoizationRestore_
      this.demandMemoizationRestore_ = void 0
    }

    return [ExtractResult.COMPLETE, this.scene, this.productShapeMap]
  }

  /**
   * Whole-model extraction: prepare + run every demand unit + finish —
   * a single code path with the per-unit pump, so pumped and classic
   * extractions are identical by construction.
   *
   * @param logTime Unused (kept for call compatibility).
   * @return {[ExtractResult, AP214SceneBuilder, AP214ProductShapeMap]}
   * The completed extraction result.
   */
  // eslint-disable-next-line no-unused-vars
  extractAP214GeometryData(logTime: boolean = false):
    [ExtractResult, AP214SceneBuilder, AP214ProductShapeMap] {

    try {

      this.prepareDemandExtraction()

      while ( this.demandCursor_ < this.demandUnitCount ) {
        this.extractDemandUnitBatch( this.demandUnitCount )
      }

      return this.finishDemandExtraction()

    } finally {
      // Ensure no staged face jobs outlive extraction (their target
      // geometry may be freed once the model is invalidated), even if
      // extraction exits through an exception.
      this.finalizeStagedFaces()

      if ( this.demandMemoizationRestore_ !== void 0 ) {
        this.model.elementMemoization = this.demandMemoizationRestore_
        this.demandMemoizationRestore_ = void 0
      }
    }
  }


  /**
   * Process the transforms for a shape relationship.
   *
   * @param shapeRelationship The shape relationship to process.
   * @param sourceShape The source shape.
   * @param targetShape The target shape.
   * @param owningLocalID The owning local ID.
   * @param flipTransformItems When the caller swapped the relationship's
   * rep_1/rep_2 reading (a parent-first assembly placement — see the CDSR
   * orientation check), the item_defined_transformation's placement pair must
   * swap with it: transform_item_1 lives in rep_1's context and
   * transform_item_2 in rep_2's, and the composed transform must always map
   * the child (source) frame into the parent (target) frame.
   * @return The transform and a boolean indicating if the processing should continue inside the loop.
   */
  doTransforms(shapeRelationship: shape_representation_relationship, sourceShape: shape_representation, targetShape: shape_representation, owningLocalID: number, flipTransformItems: boolean = false): [NativeTransform4x4 | undefined, boolean] {
    const transformInstance = shapeRelationship.findVariant( representation_relationship_with_transformation )
    let transform: NativeTransform4x4 | undefined = void 0
    if ( transformInstance !== void 0 ) {
      const transformOperator = transformInstance.transformation_operator
      if ( transformOperator instanceof item_defined_transformation ) {
        const placement1 = flipTransformItems ?
          transformOperator.transform_item_2 : transformOperator.transform_item_1
        const placement2 = flipTransformItems ?
          transformOperator.transform_item_1 : transformOperator.transform_item_2
        if( !(placement1 instanceof placement) || !(placement2 instanceof placement) ) {
          return [void 0, true]
        }
        const from = this.extractRawPlacement( placement1 )?.invert() ?? this.identity3DNativeMatrix
        const to = this.extractRawPlacement( placement2 ) ?? this.identity3DNativeMatrix
        const localPlacementParameters: ParamsLocalPlacement = {
          useRelPlacement: true,
          axis2Placement: from,
          relPlacement: to,
        }
        transform = this.conwayModel.getLocalPlacement(localPlacementParameters)
      } else if ( transformOperator instanceof cartesian_transformation_operator_3d ) {
        transform = this.extractCartesianTransformOperator3D( transformOperator )
      }
    }

    const sourceShapeContext = 
      sourceShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
      find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined
      
    const targetShapeContext =
      targetShape.context_of_items.findVariant( global_unit_assigned_context )?.units?.
        find( unit => unit.findVariant( length_unit ) )?.findVariant( length_unit ) as length_unit | undefined

    let scaleRatio: number = 1.0
    let needsScale = false
    if ( sourceShapeContext !== void 0 && targetShapeContext !== void 0 ) {
      const sr = this.lengthUnitConversionRatio( sourceShapeContext, targetShapeContext )
      if ( sr !== void 0 && sr !== 1.0 ) {
        scaleRatio = sr
        needsScale = true
      }
    }

    if ( needsScale ) {
      // Issue #308: an assembly relationship placement is a RIGID transform.
      // Reconciling mismatched units between the two shapes rescales only the
      // 3x3 basis — NEVER the translation column. Scaling the translation
      // collapses mixed-unit sub-component offsets toward the origin (the
      // "port cluster"). uniformScaleAffine (which also scales translation) is
      // for identity-input geometry-frame conversions, not relationship
      // transforms; applying it here re-broke #308 on mixed-unit assemblies.
      // (On an identity input the two coincide, since its translation is 0.)
      transform =
        this.uniformScaleBasis( transform ?? this.identity3DNativeMatrix, scaleRatio )
    }

    return [transform, false]
  }
}
