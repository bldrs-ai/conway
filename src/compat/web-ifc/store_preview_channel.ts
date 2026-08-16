import { ConwayGeometry } from '../../index'
import { CanonicalMaterial } from '../../index'
import { CanonicalMeshType } from '../../index'
import IfcStepModel from '../../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { IfcProduct } from '../../ifc/ifc4_gen'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { cursorIterator } from '../../indexing/cursor_utilities'
import { WindowedStepBufferProvider } from '../../step/step_buffer_provider'
import type { StepExternalByteStore } from '../../step/step_buffer_provider'
import { Vector3 } from '../../../dependencies/conway-geom'
import * as glmatrix from 'gl-matrix'
import { composeTransformF64, deriveCoordinationF64 } from './coordination_f64'
import {
  PreviewMeshPayload,
  releaseModelGeometry,
} from './streamed_preview_channel'


/* eslint-disable no-magic-numbers */

const TICK_INTERVAL_MS = 150
const TICK_INTERVAL_MAX_MS = 600
const TICK_INTERVAL_GROWTH = 1.1
const FIRST_GENERATION_MIN_RECORDS = 1024
const GENERATION_GROWTH_FACTOR = 2.0
const DEFAULT_MAX_PREVIEW_UNITS = 512
const DEFAULT_MAX_PREVIEW_BYTES = 48 * 1024 * 1024
const FLOATS_PER_VERTEX = 6
const BYTES_PER_FLOAT = 4
const DEFAULT_COLOR: [number, number, number, number] = [0.8, 0.8, 0.8, 1]
const NORMALIZE_MAT: glmatrix.mat4 = glmatrix.mat4.fromValues(
    1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1,
)
const FLUSH_BUDGET_MS = 100

/**
 * Parse-time placed-mesh preview for a windowed (store-backed) open.
 *
 * Twin of {@link StreamedPreviewChannel}: same capture math and
 * COORDINATE_TO_ORIGIN frame, but the prefix model pages product
 * closures from `store` instead of a resident buffer. After each
 * product the pins drop, so peak source residency stays the windowed
 * LRU — not the file.
 */
export class StorePreviewChannel {

  public coordinationMatrix?: number[]

  private stopped_ = false
  private emittedUnits_ = 0
  private emittedBytes_ = 0
  private unitOrdinal_ = 0
  private lastInlineTick_ = 0
  private tickIntervalMs_ = TICK_INTERVAL_MS
  private lastSnapshotRecords_ = 0
  private lastFailedSnapshotRecords_ = 0
  lastFailReason?: string

  private readonly emittedGeometry_ = new Set< number >()

  private generation_?: {
    model: IfcStepModel
    extraction: IfcGeometryExtraction
    products: number[]
    capturedCounts: Map< number, number >
  }

  /**
   * @param store_ External source (OPFS / file).
   * @param sink_ Live columnar sink the parse is filling.
   * @param conwaywasm_ Shared wasm wrapper.
   * @param coordinateToOrigin_ Open COORDINATE_TO_ORIGIN.
   * @param onMesh_ Preview consumer.
   * @param maxUnits Cap on products preview-extracted.
   * @param maxBytes Cap on copied payload bytes.
   * @param firstGenerationMinRecords Records before the first snapshot.
   */
  constructor(
      private readonly store_: StepExternalByteStore,
      private readonly sink_: ColumnarIndexSink< number >,
      private readonly conwaywasm_: ConwayGeometry,
      private readonly coordinateToOrigin_: boolean,
      private readonly onMesh_: ( mesh: PreviewMeshPayload ) => void,
      private readonly maxUnits: number = DEFAULT_MAX_PREVIEW_UNITS,
      private readonly maxBytes: number = DEFAULT_MAX_PREVIEW_BYTES,
      private readonly firstGenerationMinRecords: number =
      FIRST_GENERATION_MIN_RECORDS ) {
  }

  public get capped(): boolean {
    return this.emittedUnits_ >= this.maxUnits ||
      this.emittedBytes_ >= this.maxBytes
  }

  public get emittedUnits(): number {
    return this.emittedUnits_
  }

  /** Products the current generation would run (test seam). */
  public get productCount(): number {
    return this.generation_?.products.length ?? 0
  }

  /**
   * One cadence-gated tick. No-op until the interval elapses or the
   * index can support a generation. Safe to call from parse progress.
   *
   * @return {Promise<void>} Settles when this tick's product (if any)
   * is captured.
   */
  public async maybeTickAsync(): Promise< void > {

    if ( this.stopped_ || this.capped ) {
      return
    }

    const now = Date.now()

    if ( now - this.lastInlineTick_ < this.tickIntervalMs_ ) {
      return
    }

    this.lastInlineTick_ = now
    this.tickIntervalMs_ =
      Math.min( this.tickIntervalMs_ * TICK_INTERVAL_GROWTH, TICK_INTERVAL_MAX_MS )

    try {
      await this.tickOnce_()
    } catch {
      this.stopped_ = true
    }
  }

  /**
   * After parse: extract a short burst so small files (and prefixes
   * that never crossed a progress tick) still emit placed meshes
   * before open returns.
   *
   * @return {Promise<void>} Settles when the burst ends.
   */
  public async flushAsync(): Promise< void > {

    if ( this.stopped_ || this.capped ) {
      return
    }

    const deadline = Date.now() + FLUSH_BUDGET_MS

    try {

      while ( !this.capped && Date.now() < deadline ) {

        const did = await this.tickOnce_()

        if ( !did ) {
          break
        }
      }
    } catch {
      this.stopped_ = true
    }
  }

  /** Drop the throwaway prefix generation. Idempotent. */
  public stop(): void {

    this.stopped_ = true
    this.disposeGeneration_()
  }

  /**
   * Test seam: drain until the current sink is exhausted or a cap hits.
   *
   * @return {Promise<void>} Settles when idle.
   */
  public async drainForTest(): Promise< void > {

    this.lastInlineTick_ = 0
    this.tickIntervalMs_ = 0

    for ( ; ; ) {

      if ( this.capped ) {
        return
      }

      const did = await this.tickOnce_()

      if ( !did ) {
        return
      }
    }
  }

  /**
   * @return {Promise<boolean>} True when a product was attempted.
   */
  private async tickOnce_(): Promise< boolean > {

    if ( !( await this.ensureGeneration_() ) ) {
      return false
    }

    const active = this.generation_!

    if ( this.unitOrdinal_ >= active.products.length ) {
      return false
    }

    const localID = active.products[ this.unitOrdinal_++ ]
    const model = active.model
    const pins = new Set< number >()
    const leafSpans: { address: number, length: number }[] = []

    try {

      await active.extraction.ensureResidentForProductExtract(
          localID, pins, leafSpans )

      if ( active.extraction.extractProductGeometryByLocalID( localID ) ) {
        this.captureNewInstances_()
        ++this.emittedUnits_
      }
    } catch {
      // Forward-ref / unplaced — durable pump extracts later.
    } finally {

      model.releaseSourceViews( pins )
      model.unpinLocalIDs( pins )

      for ( const span of leafSpans ) {
        model.unpinAddressRange( span.address, span.length )
      }
    }

    return true
  }

  /**
   * @return {Promise<boolean>} True when a generation with pending units exists.
   */
  private async ensureGeneration_(): Promise< boolean > {

    const active = this.generation_

    if ( active !== void 0 && this.unitOrdinal_ < active.products.length ) {
      return true
    }

    const records = this.sink_.topLevelCount

    if ( records < this.firstGenerationMinRecords ) {
      return false
    }

    if ( active !== void 0 &&
        records < this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR ) {
      return false
    }

    if ( records < this.lastFailedSnapshotRecords_ * GENERATION_GROWTH_FACTOR ) {
      return false
    }

    try {

      const columns = this.sink_.snapshot()
      const provider = new WindowedStepBufferProvider( this.store_ )
      const model = new IfcStepModel( void 0, columns, provider )
      const products: number[] = []

      for ( const localID of cursorIterator(
          model.typeIndex.cursor( ...IfcProduct.query ) ) ) {
        products.push( localID )
      }

      if ( products.length === 0 ) {
        this.lastFailReason = `no products in ${records} records`
        return false
      }

      if ( products.length <= this.unitOrdinal_ ) {
        this.lastFailReason = `ordinal ${this.unitOrdinal_} >= ${products.length}`
        return false
      }

      const extraction = new IfcGeometryExtraction( this.conwaywasm_, model )

      extraction.quietRecoverableLogging = true
      extraction.deferDanglingPlacements = true

      const prepPins = await extraction.ensureResidentForDemandPrep()

      try {
        extraction.prepareDemandExtraction( true )
      } finally {
        model.releaseSourceViews( prepPins )
        model.unpinLocalIDs( prepPins )
      }

      this.disposeGeneration_()
      this.generation_ = {
        model,
        extraction,
        products,
        capturedCounts: new Map< number, number >(),
      }
      this.lastSnapshotRecords_ = records
      this.lastFailedSnapshotRecords_ = 0
      this.lastFailReason = void 0
      return true
    } catch ( error ) {
      this.lastFailedSnapshotRecords_ = records
      this.lastFailReason = error instanceof Error ? error.message : String( error )
      return false
    }
  }

  private disposeGeneration_(): void {

    const active = this.generation_

    if ( active === void 0 ) {
      return
    }

    try {
      releaseModelGeometry( active.model.geometry )
    } catch {
      // Never let a free break the open.
    }

    this.generation_ = void 0
  }

  /**
   * Copy newly extracted instances out of wasm — same placement math
   * as {@link StreamedPreviewChannel}.
   */
  private captureNewInstances_(): void {

    const active = this.generation_!

    if ( active === void 0 ) {
      return
    }

    const { extraction, capturedCounts } = active
    const scene = extraction.scene
    const seenThisPass = new Map< number, number >()

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

    for ( const walked of scene.walk() ) {

      const [ , nativeTransform, geometry, material, entity ] =
        walked as WalkTuple

      if ( entity?.localID === void 0 || entity.expressID === void 0 ) {
        continue
      }

      const walkIndex = seenThisPass.get( entity.localID ) ?? 0
      seenThisPass.set( entity.localID, walkIndex + 1 )

      if ( walkIndex < ( capturedCounts.get( entity.localID ) ?? 0 ) ) {
        continue
      }

      capturedCounts.set( entity.localID, walkIndex + 1 )

      if ( geometry.type !== CanonicalMeshType.BUFFER_GEOMETRY ||
          geometry.temporary ) {
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

      if ( this.coordinationMatrix === void 0 && this.coordinateToOrigin_ ) {
        nativePt = geometry.geometry.getPoint( 0 )
      }

      const center = geometry.geometry.normalize()
      const geometryExpressID =
        active.model.getElementByLocalID( geometry.localID )?.expressID ??
        geometry.localID
      const geometryTransform = nativeTransform?.getValues()

      if ( this.coordinationMatrix === void 0 && this.coordinateToOrigin_ ) {
        this.coordinationMatrix = deriveCoordinationF64(
            geometryTransform,
            nativePt!,
            NORMALIZE_MAT,
            extraction.getLinearScalingFactor() )
      }

      const coordination = this.coordinationMatrix ?? glmatrix.mat4.create()
      const newTransform =
        composeTransformF64( coordination, geometryTransform, center )

      const payload: PreviewMeshPayload = {
        expressID: entity.expressID,
        geometryExpressID,
        color: {
          x: material_.legacyColor[ 0 ],
          y: material_.legacyColor[ 1 ],
          z: material_.legacyColor[ 2 ],
          w: material_.legacyColor[ 3 ],
        },
        flatTransformation: Array.from( newTransform ),
      }

      if ( !this.emittedGeometry_.has( geometryExpressID ) ) {

        const nativeGeometry = geometry.geometry
        const vertexData = this.conwaywasm_.floatHeapSlice(
            nativeGeometry.GetVertexData(),
            nativeGeometry.GetVertexDataSize() ).slice()
        const indexData = this.conwaywasm_.uint32HeapSlice(
            nativeGeometry.GetIndexData(),
            nativeGeometry.GetIndexDataSize() ).slice()

        if ( vertexData.length < FLOATS_PER_VERTEX || indexData.length === 0 ) {
          continue
        }

        payload.vertexData = vertexData
        payload.indexData = indexData
        this.emittedGeometry_.add( geometryExpressID )
        this.emittedBytes_ +=
          ( vertexData.length + indexData.length ) * BYTES_PER_FLOAT
      }

      this.onMesh_( payload )

      if ( this.emittedBytes_ >= this.maxBytes ) {
        return
      }
    }
  }
}
