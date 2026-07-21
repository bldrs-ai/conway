import { ConwayGeometry } from '../../index'
import { CanonicalMaterial } from '../../index'
import { CanonicalMeshType } from '../../index'
import IfcStepModel from '../../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { IfcProduct } from '../../ifc/ifc4_gen'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { Vector3 } from '../../../dependencies/conway-geom'
import * as glmatrix from 'gl-matrix'

/* eslint-disable no-magic-numbers */

/** Ms between preview pump ticks (interleaves with the parse's yields). */
const TICK_INTERVAL_MS = 150

/** Extraction + capture time budget per tick, so the parse keeps most of
 * the main thread (~25/150 ≈ 17% worst-case preview share). */
const TICK_BUDGET_MS = 25

/** Don't build the first generation before this many top-level records —
 * below it the prefix rarely contains a placeable product. */
const FIRST_GENERATION_MIN_RECORDS = 1024

/** A new generation only when the index grew this much past the previous
 * snapshot (bounds snapshot copies to O(GROWTH/(GROWTH-1)) of the file). */
const GENERATION_GROWTH_FACTOR = 1.5

/** Default cap on products the preview channel ever extracts. Preview
 * generations are throwaway extractions whose native geometry is not
 * reclaimed until page teardown (the shim never frees classic scenes
 * either — see closeModel), so the cap bounds that one-time cost. */
const DEFAULT_MAX_PREVIEW_PRODUCTS = 4096

/** Default cap on total payload bytes copied out to the consumer. */
const DEFAULT_MAX_PREVIEW_BYTES = 48 * 1024 * 1024

const FLOATS_PER_VERTEX = 6
const BYTES_PER_FLOAT = 4
const DEFAULT_COLOR: [number, number, number, number] = [0.8, 0.8, 0.8, 1]

// Matches the shim proxy's NormalizeMat (Z-up -> Y-up).
const NORMALIZE_MAT: glmatrix.mat4 = glmatrix.mat4.fromValues(
    1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1,
)

/**
 * One preview mesh instance, self-contained: geometry payload is COPIED out
 * of the wasm heap at emission, so consumers can upload it directly and
 * never touch the (still-loading) model. `vertexData` is interleaved
 * position+normal, 6 floats per vertex, exactly the GetGeometry layout the
 * classic FlatMesh path reads. For instances sharing geometry with an
 * earlier emission (mapped items), `vertexData`/`indexData` are omitted and
 * `geometryExpressID` identifies the earlier payload to reuse.
 */
export interface PreviewMeshPayload {
  expressID: number
  geometryExpressID: number
  color: { x: number, y: number, z: number, w: number }
  flatTransformation: number[]
  vertexData?: Float32Array
  indexData?: Uint32Array
}

/**
 * Parse-time preview channel (demand/tiled rendering slice A2): while the
 * deferred streamed open is still parsing, periodically snapshot the growing
 * columnar index into a PREFIX model, extract a bounded number of products
 * through a throwaway extraction, and emit self-contained mesh payloads —
 * first pixels within the first seconds of a large parse instead of after
 * it.
 *
 * Preview quality, by construction: IFC relationship records
 * (IfcRelVoidsElement, IfcRelAssociatesMaterial, styled items) spread to the
 * very end of real files (measured ~92–97% depth), so a prefix extraction
 * can miss openings and materials. That is why these extractions are
 * throwaway: the durable batch pump after the parse re-extracts every
 * product with the full model and REPLACES the preview — final geometry
 * parity is untouched by this channel.
 *
 * Scheduling: the cooperative parse yields to the event loop via macrotasks
 * every ~50ms; each pump tick runs in one of those gaps under a hard time
 * budget, so the parse keeps the bulk of the main thread.
 *
 * Product cursor: top-level localIDs are stable across snapshots (dense
 * parse order) and `types(IfcProduct)` iterates in localID order, so a
 * single ordinal cursor advances across generations without re-extracting.
 * Products whose extraction throws mid-parse (unparsed forward references)
 * are skipped — the durable pump extracts them correctly later.
 */
export class StreamedPreviewChannel {

  /** Coordination matrix pinned from the first captured instance, exactly
   * the derivation the durable capture would perform — the proxy adopts it
   * so preview and durable placements share one frame. */
  public coordinationMatrix?: glmatrix.mat4

  private stopped_ = false
  private timer_?: ReturnType<typeof setTimeout>

  private emittedProducts_ = 0
  private emittedBytes_ = 0

  /** Ordinal cursor into the (append-stable) product list. */
  private productOrdinal_ = 0

  /** Geometry expressIDs whose payload has been emitted (cross-generation
   * dedup for mapped/shared geometry). */
  private readonly emittedGeometry_ = new Set<number>()

  private generation_?: {
    model: IfcStepModel
    extraction: IfcGeometryExtraction
    products: number[]
    nextIndex: number
    capturedCounts: Map<number, number>
    snapshotRecords: number
  }

  private lastSnapshotRecords_ = 0

  /**
   * @param data The (fully resident) source buffer the parse is indexing.
   * @param conwaywasm The shared geometry wasm wrapper (sequential use only
   * — ticks run between parse yields, never concurrently with the durable
   * extraction, which is created after the parse completes).
   * @param sink The live columnar sink the streamed parse is filling.
   * @param coordinateToOrigin The open's COORDINATE_TO_ORIGIN setting.
   * @param onMesh Consumer callback for each preview payload.
   * @param maxProducts Cap on products ever preview-extracted.
   * @param maxBytes Cap on total payload bytes copied out.
   * @param firstGenerationMinRecords Records required before the first
   * snapshot (tests lower it for tiny fixtures).
   */
  constructor(
      private readonly data: Uint8Array,
      private readonly conwaywasm: ConwayGeometry,
      private readonly sink: ColumnarIndexSink<EntityTypesIfc>,
      private readonly coordinateToOrigin: boolean,
      private readonly onMesh: (mesh: PreviewMeshPayload) => void,
      private readonly maxProducts: number = DEFAULT_MAX_PREVIEW_PRODUCTS,
      private readonly maxBytes: number = DEFAULT_MAX_PREVIEW_BYTES,
      private readonly firstGenerationMinRecords: number =
      FIRST_GENERATION_MIN_RECORDS ) {
  }

  /** Begin ticking (call just before awaiting the parse). */
  public start(): void {
    this.schedule_()
  }

  /**
   * Stop ticking (call once the parse settles, before finalize/fallback).
   * Idempotent; no tick runs after this returns (ticks are synchronous and
   * scheduled on the same event loop).
   */
  public stop(): void {
    this.stopped_ = true

    if (this.timer_ !== void 0) {
      clearTimeout(this.timer_)
      this.timer_ = void 0
    }
  }

  /** True when a cap was hit and the channel retired itself early. */
  public get capped(): boolean {
    return this.emittedProducts_ >= this.maxProducts ||
      this.emittedBytes_ >= this.maxBytes
  }

  // eslint-disable-next-line require-jsdoc
  private schedule_(): void {

    if (this.stopped_ || this.capped) {
      return
    }

    this.timer_ = setTimeout(() => {
      this.timer_ = void 0

      try {
        this.tick_()
      } catch {
        // A preview failure must never break the open — retire quietly;
        // the durable pump renders everything after the parse.
        this.stopped_ = true
      }

      this.schedule_()
    }, TICK_INTERVAL_MS)
  }

  /**
   * One pump tick: ensure a generation with pending products exists, then
   * extract + capture under the time budget.
   */
  private tick_(): void {

    const deadline = Date.now() + TICK_BUDGET_MS

    if (!this.ensureGeneration_()) {
      return
    }

    const generation = this.generation_!
    const { extraction, products } = generation

    let extractedThisTick = 0

    while (generation.nextIndex < products.length &&
        this.emittedProducts_ + extractedThisTick < this.maxProducts &&
        Date.now() < deadline) {

      const localID = products[generation.nextIndex++]
      ++this.productOrdinal_

      try {
        if (extraction.extractProductGeometryByLocalID(localID)) {
          ++extractedThisTick
        }
      } catch {
        // Unparsed forward reference (or any other mid-parse gap): skip.
        // The durable pump extracts this product from the full model.
      }
    }

    if (extractedThisTick > 0) {
      this.captureNewInstances_()
      this.emittedProducts_ += extractedThisTick
    }
  }

  /**
   * Ensure a generation with pending products: keep the current one while
   * it has work; otherwise snapshot a fresh prefix model once the index has
   * grown enough to be worth the copy.
   *
   * @return {boolean} True when a generation with pending products exists.
   */
  private ensureGeneration_(): boolean {

    const generation = this.generation_

    if (generation !== void 0 && generation.nextIndex < generation.products.length) {
      return true
    }

    const records = this.sink.topLevelCount

    if (records < this.firstGenerationMinRecords) {
      return false
    }

    if (generation !== void 0 &&
        records < this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR) {
      return false
    }

    const columns = this.sink.snapshot()
    const model = new IfcStepModel(this.data, columns)

    const products: number[] = []

    for (const product of model.types(IfcProduct)) {
      products.push(product.localID)
    }

    if (products.length <= this.productOrdinal_) {
      // Prefix grew but produced no new products — wait for more records.
      this.lastSnapshotRecords_ = records
      return false
    }

    const extraction = new IfcGeometryExtraction(this.conwaywasm, model)

    this.generation_ = {
      model,
      extraction,
      products,
      nextIndex: this.productOrdinal_,
      capturedCounts: new Map<number, number>(),
      snapshotRecords: records,
    }
    this.lastSnapshotRecords_ = records

    return true
  }

  /**
   * Walk the current generation's scene and emit every not-yet-captured
   * placed instance as a payload — the preview twin of the shim's durable
   * delta capture, with the same placed-geometry math (normalize, scaling,
   * coordination) so preview and durable placements coincide, but copying
   * geometry OUT of the wasm heap instead of retaining native references.
   */
  private captureNewInstances_(): void {

    const generation = this.generation_!
    const { model, extraction, capturedCounts } = generation
    const scene = extraction.scene

    const linearScalingFactor = extraction.getLinearScalingFactor()
    const seenThisPass = new Map<number, number>()

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (entity?.localID === void 0 || entity.expressID === void 0) {
        continue
      }

      const walkIndex = seenThisPass.get(entity.localID) ?? 0
      seenThisPass.set(entity.localID, walkIndex + 1)

      if (walkIndex < (capturedCounts.get(entity.localID) ?? 0)) {
        continue
      }

      capturedCounts.set(entity.localID, walkIndex + 1)

      if (geometry.type !== CanonicalMeshType.BUFFER_GEOMETRY || geometry.temporary) {
        continue
      }

      const material_: CanonicalMaterial = material ?? {
        name: '',
        baseColor: DEFAULT_COLOR,
        legacyColor: DEFAULT_COLOR,
        doubleSided: true,
        blend: 0,
      }

      let nativePt: Vector3 | undefined

      if (this.coordinationMatrix === void 0 && this.coordinateToOrigin) {
        nativePt = geometry.geometry.getPoint(0)
      }

      const geomCenter: glmatrix.vec3 = glmatrix.vec3.create()
      const center = geometry.geometry.normalize()

      geomCenter[0] = center.x
      geomCenter[1] = center.y
      geomCenter[2] = center.z

      const translationMatrixGeomMin: glmatrix.mat4 = glmatrix.mat4.create()
      glmatrix.mat4.fromTranslation(translationMatrixGeomMin, geomCenter)

      const geometryExpressID =
        model.getElementByLocalID(geometry.localID)?.expressID as number

      const geometryTransform = nativeTransform?.getValues()
      let newMatrix: glmatrix.mat4

      if (geometryTransform !== void 0) {
        newMatrix = glmatrix.mat4.fromValues(
            ...(geometryTransform as unknown as
              Parameters<typeof glmatrix.mat4.fromValues>))
      } else {
        newMatrix = glmatrix.mat4.create()
      }

      if (this.coordinationMatrix === void 0 && this.coordinateToOrigin) {

        const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
        glmatrix.vec4.transformMat4(
            transformedPt,
            [nativePt!.x, nativePt!.y, nativePt!.z, 1],
            newMatrix)

        const coordinationMatrix = glmatrix.mat4.create()
        glmatrix.mat4.fromTranslation(coordinationMatrix,
            [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

        const scaleMatrix = glmatrix.mat4.create()
        const scaleVec = glmatrix.vec3.fromValues(
            linearScalingFactor, linearScalingFactor, linearScalingFactor)

        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)
        glmatrix.mat4.multiply(coordinationMatrix, NORMALIZE_MAT, coordinationMatrix)
        glmatrix.mat4.multiply(coordinationMatrix, scaleMatrix, coordinationMatrix)

        this.coordinationMatrix = coordinationMatrix
      }

      const coordination = this.coordinationMatrix ?? glmatrix.mat4.create()

      const newTransform = glmatrix.mat4.create()
      const scaleMatrix = glmatrix.mat4.create()
      const scaleVec = glmatrix.vec3.fromValues(
          linearScalingFactor, linearScalingFactor, linearScalingFactor)

      glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)
      glmatrix.mat4.multiply(newTransform, coordination, newMatrix)
      glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)

      const payload: PreviewMeshPayload = {
        expressID: entity.expressID,
        geometryExpressID,
        color: {
          x: material_.legacyColor[0],
          y: material_.legacyColor[1],
          z: material_.legacyColor[2],
          w: material_.legacyColor[3],
        },
        flatTransformation: Array.from(newTransform),
      }

      if (!this.emittedGeometry_.has(geometryExpressID)) {

        const nativeGeometry = geometry.geometry

        const vertexData = this.conwaywasm.floatHeapSlice(
            nativeGeometry.GetVertexData(),
            nativeGeometry.GetVertexDataSize()).slice()
        const indexData = this.conwaywasm.uint32HeapSlice(
            nativeGeometry.GetIndexData(),
            nativeGeometry.GetIndexDataSize()).slice()

        if (vertexData.length < FLOATS_PER_VERTEX || indexData.length === 0) {
          continue
        }

        payload.vertexData = vertexData
        payload.indexData = indexData

        this.emittedGeometry_.add(geometryExpressID)
        this.emittedBytes_ +=
          (vertexData.length + indexData.length) * BYTES_PER_FLOAT
      }

      this.onMesh(payload)

      if (this.emittedBytes_ >= this.maxBytes) {
        return
      }
    }
  }

  /**
   * Test seam: run generation building + extraction + capture synchronously
   * until either every product currently in the sink is attempted or a cap
   * is hit — what the timer-driven ticks do, without the timers.
   */
  public drainForTest(): void {

    for (; ;) {

      if (this.capped || !this.ensureGeneration_()) {
        return
      }

      const generation = this.generation_!

      if (generation.nextIndex >= generation.products.length) {
        return
      }

      const localID = generation.products[generation.nextIndex++]
      ++this.productOrdinal_

      let extracted = false

      try {
        extracted = generation.extraction.extractProductGeometryByLocalID(localID)
      } catch {
        // Skip — mirrors tick_.
      }

      if (extracted) {
        this.captureNewInstances_()
        ++this.emittedProducts_
      }
    }
  }
}
