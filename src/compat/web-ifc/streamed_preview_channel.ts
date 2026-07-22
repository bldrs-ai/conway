import { ConwayGeometry } from '../../index'
import { CanonicalMaterial } from '../../index'
import { CanonicalMeshType } from '../../index'
import IfcStepModel from '../../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { IfcProduct } from '../../ifc/ifc4_gen'
import AP214StepModel from '../../AP214E3_2010/ap214_step_model'
import {
  AP214GeometryExtraction,
} from '../../AP214E3_2010/ap214_geometry_extraction'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { cursorIterator } from '../../indexing/cursor_utilities'
import { Vector3 } from '../../../dependencies/conway-geom'
import * as glmatrix from 'gl-matrix'

/* eslint-disable no-magic-numbers */

/** Initial ms between preview pump ticks (interleaves with the parse's
 * yields). The interval decays (TICK_INTERVAL_GROWTH per tick, capped at
 * TICK_INTERVAL_MAX_MS): dense ticking in the first seconds delivers the
 * immediate-feedback wow, then the channel backs off so a long parse
 * isn't taxed all the way through. */
const TICK_INTERVAL_MS = 150
const TICK_INTERVAL_MAX_MS = 600
const TICK_INTERVAL_GROWTH = 1.1

/** Extraction + capture time budget per tick, so the parse keeps most of
 * the main thread (~25/150 ≈ 17% worst-case preview share). */
const TICK_BUDGET_MS = 25

/** Don't build the first generation before this many top-level records —
 * below it the prefix rarely contains a placeable product. */
const FIRST_GENERATION_MIN_RECORDS = 1024

/** A new generation only when the index grew this much past the previous
 * snapshot (bounds snapshot copies to O(GROWTH/(GROWTH-1)) of the file). */
const GENERATION_GROWTH_FACTOR = 2.0

/** Default cap on units the preview channel ever extracts. Preview
 * generations are throwaway extractions whose native geometry is not
 * reclaimed until page teardown (the shim never frees classic scenes
 * either — see closeModel), so the cap bounds that one-time cost. */
const DEFAULT_MAX_PREVIEW_UNITS = 4096

/** Default cap on total payload bytes copied out to the consumer. */
const DEFAULT_MAX_PREVIEW_BYTES = 48 * 1024 * 1024

const FLOATS_PER_VERTEX = 6
const BYTES_PER_FLOAT = 4
const DEFAULT_COLOR: [number, number, number, number] = [0.8, 0.8, 0.8, 1]

// Matches the shim proxies' NormalizeMat (Z-up -> Y-up).
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
 * A throwaway prefix extraction built by a {@link PreviewSchemaAdapter} —
 * one preview "generation" over a snapshot of the growing columnar index.
 */
export interface PreviewPrefixGeneration {

  /** Scene the capture walks (canonical placed-instance tuples — the
   * exact tuple shape is schema-specific; the capture narrows it). */
  scene: { walk(): IterableIterator<unknown> }

  /** Total pumpable units in this prefix. */
  unitCount: number

  /** Scaling factor for the capture math. */
  linearScalingFactor: number

  /**
   * Execute units [from, from+count) — cheap per unit, exceptions per
   * unit swallowed by the adapter (mid-parse forward references).
   *
   * @param from First unit ordinal to execute.
   * @param count Max units.
   * @return {number} Units actually executed.
   */
  runUnits( from: number, count: number ): number

  /**
   * ExpressID identifying a walked geometry (payload identity / dedup).
   *
   * @param geometryLocalID The canonical mesh's localID.
   * @return {number | undefined} The geometry's expressID.
   */
  geometryExpressID( geometryLocalID: number ): number | undefined

  /**
   * Whether the capture math recenters geometry (IFC's classic
   * normalize + center re-add) or uses bare coordination x placement
   * composition (AP214 — instances share one geometry buffer, issue
   * #308).
   */
  recenter: boolean

  /**
   * Free the generation's native geometry (payloads are copies, so a
   * retired generation holds nothing anyone can reference). Called by
   * the channel when a generation is replaced and at stop().
   */
  dispose(): void
}

/**
 * Builds throwaway prefix generations for one schema — the only piece of
 * the preview channel that knows what a "model" or a "unit" is.
 */
export interface PreviewSchemaAdapter {

  /**
   * Build a generation over the given prefix columns.
   *
   * @param data The (fully resident) source buffer.
   * @param conwaywasm The shared geometry wasm wrapper.
   * @param columns A prefix snapshot of the columnar index.
   * @return {PreviewPrefixGeneration | undefined} The generation, or
   * undefined when the prefix cannot build one yet (throw is also
   * tolerated — the channel retries on a later, larger prefix).
   */
  buildGeneration(
    data: Uint8Array,
    conwaywasm: ConwayGeometry,
    columns: unknown,
  ): PreviewPrefixGeneration | undefined
}

/**
 * IFC adapter: units are IfcProducts in localID order (stable across
 * prefix growth), extracted through the per-product demand seam.
 *
 * @return {PreviewSchemaAdapter} The adapter.
 */
export function ifcPreviewAdapter(): PreviewSchemaAdapter {
  return {
    buildGeneration( data, conwaywasm, columns ) {

      const model = new IfcStepModel(
          data, columns as ConstructorParameters<typeof IfcStepModel>[1] )

      // Enumerate product localIDs straight off the type index — NO
      // entity materialization (a per-generation sweep of 50k+ product
      // entities was a dominant channel cost on PSB-class models).
      const products: number[] = []

      for ( const localID of cursorIterator(
          model.typeIndex.cursor( ...IfcProduct.query ) ) ) {
        products.push( localID )
      }

      if ( products.length === 0 ) {
        return void 0
      }

      const extraction = new IfcGeometryExtraction( conwaywasm, model )

      // Preview-only preparation: skip the relationship sweeps whose
      // entity materialization dominates per-generation cost.
      extraction.prepareDemandExtraction( true )

      return {
        scene: extraction.scene,
        unitCount: products.length,
        get linearScalingFactor() {
          return extraction.getLinearScalingFactor()
        },
        runUnits: ( from, count ) => {
          const end = Math.min( from + count, products.length )
          let executed = 0
          for ( let where = from; where < end; ++where ) {
            try {
              if ( extraction.extractProductGeometryByLocalID( products[ where ] ) ) {
                ++executed
              }
            } catch {
              // Unparsed forward reference — the durable pump extracts
              // this product from the full model later.
            }
          }
          return executed
        },
        geometryExpressID: ( geometryLocalID ) =>
          model.getElementByLocalID( geometryLocalID )?.expressID,
        recenter: true,
        dispose: () => {
          releaseModelGeometry( model.geometry )
        },
      }
    },
  }
}

/**
 * Free every buffer-geometry canonical mesh a model geometry cache
 * holds (native embind objects), leaving the cache empty. Safe on an
 * already-released cache.
 *
 * @param geometry The model geometry cache (iterable of canonical
 * meshes with a delete(localID)).
 */
function releaseModelGeometry(
    geometry: Iterable<{ localID: number }> & { delete( localID: number ): void } ): void {

  const localIDs: number[] = []

  for ( const mesh of geometry ) {
    localIDs.push( mesh.localID )
  }

  for ( const localID of localIDs ) {
    try {
      geometry.delete( localID )
    } catch {
      // Never let a free break a load — leaked is better than crashed.
    }
  }
}

/**
 * AP214 adapter: units are assembly-tree units (see
 * AP214GeometryExtraction.prepareDemandExtraction). Unit ordinals are
 * only approximately stable across prefix growth (a root's child list
 * can grow, shifting later ordinals) — for a preview that is
 * acceptable: a shifted ordinal re-emits an instance at an identical
 * placement (invisible overlap) or skips one (the durable pump renders
 * it later).
 *
 * @return {PreviewSchemaAdapter} The adapter.
 */
export function ap214PreviewAdapter(): PreviewSchemaAdapter {
  return {
    buildGeneration( data, conwaywasm, columns ) {

      const model = new AP214StepModel(
          data, columns as ConstructorParameters<typeof AP214StepModel>[1] )

      const extraction = new AP214GeometryExtraction( conwaywasm, model )

      extraction.prepareDemandExtraction()

      if ( extraction.demandUnitCount === 0 ) {
        return void 0
      }

      return {
        scene: extraction.scene,
        unitCount: extraction.demandUnitCount,
        get linearScalingFactor() {
          return extraction.getLinearScalingFactor()
        },
        runUnits: ( from, count ) => {
          if ( extraction.demandUnitCursor < from ) {
            extraction.skipDemandUnits( from - extraction.demandUnitCursor )
          }
          return extraction.extractDemandUnitBatch( count )
        },
        geometryExpressID: ( geometryLocalID ) =>
          model.getElementByLocalID( geometryLocalID )?.expressID,
        recenter: false,
        dispose: () => {
          releaseModelGeometry( model.geometry )
        },
      }
    },
  }
}

/**
 * Parse-time preview channel (demand/tiled rendering slice A2): while a
 * deferred streamed open is still parsing, periodically snapshot the
 * growing columnar index into a PREFIX model, extract a bounded number of
 * units through a throwaway extraction, and emit self-contained mesh
 * payloads — first pixels within the first seconds of a large parse
 * instead of after it. Schema knowledge lives in the
 * {@link PreviewSchemaAdapter}; the channel owns scheduling, generations,
 * watermarks, payload copies, caps and the coordination pin.
 *
 * Preview quality, by construction: relationship records (IFC voids,
 * materials, styled items) spread to the very end of real files
 * (measured ~92–97% depth), so a prefix extraction can miss
 * openings and materials. That is why these extractions are throwaway:
 * the durable batch pump after the parse re-extracts every unit with the
 * full model and REPLACES the preview — final geometry parity is
 * untouched by this channel.
 *
 * Scheduling: the cooperative parse yields to the event loop via
 * macrotasks every ~50ms; each pump tick runs in one of those gaps under
 * a hard time budget, so the parse keeps the bulk of the main thread.
 */
export class StreamedPreviewChannel {

  /** Coordination matrix pinned from the first captured instance, exactly
   * the derivation the durable capture would perform — the proxy adopts it
   * so preview and durable placements share one frame. */
  public coordinationMatrix?: glmatrix.mat4

  private stopped_ = false
  private timer_?: ReturnType<typeof setTimeout>

  private emittedUnits_ = 0
  private emittedBytes_ = 0

  /** Ordinal cursor into the unit list (see the adapter's stability
   * notes). */
  private unitOrdinal_ = 0

  /** Geometry expressIDs whose payload has been emitted (cross-generation
   * dedup for mapped/shared geometry). */
  private readonly emittedGeometry_ = new Set<number>()

  private generation_?: {
    generation: PreviewPrefixGeneration
    capturedCounts: Map<number, number>
  }

  private lastSnapshotRecords_ = 0

  /**
   * @param data The (fully resident) source buffer the parse is indexing.
   * @param conwaywasm The shared geometry wasm wrapper (sequential use only
   * — ticks run between parse yields, never concurrently with the durable
   * extraction, which is created after the parse completes).
   * @param sink The live columnar sink the streamed parse is filling.
   * @param adapter The schema adapter building prefix generations.
   * @param coordinateToOrigin The open's COORDINATE_TO_ORIGIN setting.
   * @param onMesh Consumer callback for each preview payload.
   * @param maxUnits Cap on units ever preview-extracted.
   * @param maxBytes Cap on total payload bytes copied out.
   * @param firstGenerationMinRecords Records required before the first
   * snapshot (tests lower it for tiny fixtures).
   */
  constructor(
      private readonly data: Uint8Array,
      private readonly conwaywasm: ConwayGeometry,
      private readonly sink: ColumnarIndexSink<number>,
      private readonly adapter: PreviewSchemaAdapter,
      private readonly coordinateToOrigin: boolean,
      private readonly onMesh: (mesh: PreviewMeshPayload) => void,
      private readonly maxUnits: number = DEFAULT_MAX_PREVIEW_UNITS,
      private readonly maxBytes: number = DEFAULT_MAX_PREVIEW_BYTES,
      private readonly firstGenerationMinRecords: number =
      FIRST_GENERATION_MIN_RECORDS ) {
  }

  private lastInlineTick_ = 0
  private tickIntervalMs_ = TICK_INTERVAL_MS

  /** Begin ticking (call just before awaiting the parse). */
  public start(): void {
    this.schedule_()
  }

  /**
   * Tick inline if one is due — called from the parse's own progress
   * callback, so the channel keeps its cadence even when the event
   * loop's timer queue is starved (browser: the cooperative parse
   * yields via scheduler.yield / MessageChannel, whose continuations
   * outrank setTimeout; the 150ms timer ticks barely ran on PSB-class
   * parses, starving the preview until parse end). The timer remains
   * as a fallback for gaps between progress calls.
   */
  public maybeTickInline(): void {

    if (this.stopped_ || this.capped) {
      return
    }

    const now = Date.now()

    if (now - this.lastInlineTick_ < this.tickIntervalMs_) {
      return
    }

    this.lastInlineTick_ = now
    this.tickIntervalMs_ =
      Math.min(this.tickIntervalMs_ * TICK_INTERVAL_GROWTH, TICK_INTERVAL_MAX_MS)

    try {
      this.tick_()
    } catch {
      // A preview failure must never break the open.
      this.stopped_ = true
    }
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

    // Payloads are copies — a stopped channel's throwaway scenes hold
    // nothing anyone can reference. Free them so repeated loads in one
    // tab reuse the wasm pages instead of stacking preview scenes.
    try {
      this.generation_?.generation.dispose()
    } catch {
      // Never let a free break the open.
    }
    this.generation_ = void 0
  }

  /** True when a cap was hit and the channel retired itself early. */
  public get capped(): boolean {
    return this.emittedUnits_ >= this.maxUnits ||
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
    }, this.tickIntervalMs_)
  }

  /**
   * One pump tick: ensure a generation with pending units exists, then
   * extract + capture under the time budget.
   */
  private tick_(): void {

    const deadline = Date.now() + TICK_BUDGET_MS

    if (!this.ensureGeneration_()) {
      return
    }

    const active = this.generation_!
    const { generation } = active

    let extractedThisTick = 0

    while (this.unitOrdinal_ < generation.unitCount &&
        this.emittedUnits_ + extractedThisTick < this.maxUnits &&
        Date.now() < deadline) {

      const executed = generation.runUnits(this.unitOrdinal_, 1)
      ++this.unitOrdinal_
      extractedThisTick += executed
    }

    if (extractedThisTick > 0) {
      this.captureNewInstances_()
      this.emittedUnits_ += extractedThisTick
    }
  }

  /**
   * Ensure a generation with pending units: keep the current one while
   * it has work; otherwise snapshot a fresh prefix model once the index
   * has grown enough to be worth the copy.
   *
   * @return {boolean} True when a generation with pending units exists.
   */
  private ensureGeneration_(): boolean {

    const active = this.generation_

    if (active !== void 0 && this.unitOrdinal_ < active.generation.unitCount) {
      return true
    }

    const records = this.sink.topLevelCount

    if (records < this.firstGenerationMinRecords) {
      return false
    }

    if (active !== void 0 &&
        records < this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR) {
      return false
    }

    const columns = this.sink.snapshot()
    const generation =
      this.adapter.buildGeneration(this.data, this.conwaywasm, columns)

    this.lastSnapshotRecords_ = records

    // The outgoing generation's instances are all captured (a
    // generation is only replaced once exhausted + captured) — free its
    // native scenes before adopting the new one.
    if (generation !== void 0 && generation.unitCount > this.unitOrdinal_) {
      try {
        active?.generation.dispose()
      } catch {
        // Never let a free break the open.
      }
    }

    if (generation === void 0 || generation.unitCount <= this.unitOrdinal_) {
      // Prefix grew but produced no new units — wait for more records.
      return false
    }

    this.generation_ = {
      generation,
      capturedCounts: new Map<number, number>(),
    }

    return true
  }

  /**
   * Walk the current generation's scene and emit every not-yet-captured
   * placed instance as a payload — the preview twin of the durable delta
   * captures, with the same placed-geometry math per schema (recentering
   * for IFC, bare composition for AP214) so preview and durable
   * placements coincide, but copying geometry OUT of the wasm heap
   * instead of retaining native references.
   */
  private captureNewInstances_(): void {

    const active = this.generation_!
    const { generation, capturedCounts } = active
    const { scene, recenter } = generation

    const linearScalingFactor = generation.linearScalingFactor
    const seenThisPass = new Map<number, number>()

    type WalkTuple = [
      unknown,
      { getValues(): number[] | Float32Array | Float64Array } | undefined,
      {
        type: number,
        temporary?: boolean,
        localID: number,
        geometry: {
          getPoint( index: number ): Vector3,
          normalize(): Vector3,
          GetVertexData(): number,
          GetVertexDataSize(): number,
          GetIndexData(): number,
          GetIndexDataSize(): number,
        },
      },
      CanonicalMaterial | undefined,
      { localID?: number, expressID?: number } | undefined,
    ]

    for (const walked of scene.walk()) {

      const [, nativeTransform, geometry, material, entity] =
        walked as WalkTuple

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

      const translationMatrixGeomMin: glmatrix.mat4 = glmatrix.mat4.create()

      if (recenter) {
        const geomCenter: glmatrix.vec3 = glmatrix.vec3.create()
        const center = geometry.geometry.normalize()

        geomCenter[0] = center.x
        geomCenter[1] = center.y
        geomCenter[2] = center.z

        glmatrix.mat4.fromTranslation(translationMatrixGeomMin, geomCenter)
      }

      const geometryExpressID =
        generation.geometryExpressID(geometry.localID) as number

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

      if (recenter) {
        const scaleMatrix = glmatrix.mat4.create()
        const scaleVec = glmatrix.vec3.fromValues(
            linearScalingFactor, linearScalingFactor, linearScalingFactor)

        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)
        glmatrix.mat4.multiply(newTransform, coordination, newMatrix)
        glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
      } else {
        // Bare composition — no per-leaf recenter (AP214 instances share
        // one geometry buffer, issue #308), matching its durable capture.
        glmatrix.mat4.multiply(newTransform, coordination, newMatrix)
      }

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
   * until either every unit currently in the sink is attempted or a cap
   * is hit — what the timer-driven ticks do, without the timers.
   */
  public drainForTest(): void {

    for (; ;) {

      if (this.capped || !this.ensureGeneration_()) {
        return
      }

      const active = this.generation_!

      if (this.unitOrdinal_ >= active.generation.unitCount) {
        return
      }

      const executed = active.generation.runUnits(this.unitOrdinal_, 1)
      ++this.unitOrdinal_

      if (executed > 0) {
        this.captureNewInstances_()
        ++this.emittedUnits_
      }
    }
  }
}
