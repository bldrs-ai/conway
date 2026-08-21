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
import {
  composeTransformF64,
  deriveCoordinationF64,
  NORMALIZE_MAT_F64,
} from './coordination_f64'
import { DanglingPlacementError } from '../../ifc/dangling_placement_error'
import { formatPreviewLine } from '../../core/progress_log'
import Logger from '../../logging/logger'

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

/**
 * Deferred units carried into the next generation for a second look.
 *
 * Twin of {@link StorePreviewChannel}'s queue, for the same defect: the
 * channel was strictly forward-only, so a unit whose placement chain lay
 * beyond the prefix was attempted once — at the earliest and therefore most
 * index-starved generation it appeared in — and never again, because
 * `unitOrdinal_` only ever advances and a rebuilt generation regenerates the
 * unit list in the same dense parse order. On a file whose placement chains
 * resolve late that throws nearly everything away: DOWA has 19,854 of its
 * 45,860 products emittable once 70% of the file is indexed, and the store
 * path emitted 1 before this queue existed (conway#542).
 *
 * A retry is affordable in a way a first attempt is not: a deferring attempt
 * fails on an index lookup before any geometry is paged (~0.17 ms measured
 * on the store path, against ~700 ms for a generation rebuild). The cap is
 * here so the queue cannot grow with the model — it only has to keep
 * DEFAULT_MAX_PREVIEW_UNITS worth of candidates in play.
 */
const RETRY_QUEUE_MAX = 4096

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
  /**
   * AABB imposter (no vertex payload; Share instances a unit cube).
   * Reported in RAW IFC source-unit space as a consumer reference — the
   * `flatTransformation` beside it is in the durable coordination frame
   * like every other payload's, so that is what places the cube.
   *
   * **Re-emission replaces, it does not add.** An `aabb` payload
   * carrying an `expressID` the consumer has already drawn a plate for
   * REPLACES that plate; consumers key imposters by expressID rather
   * than by arrival order. The store path emits each spatial node twice
   * by design (conway#518): once early, off a prefix generation that
   * holds the storeys but few of their contained products, and again
   * after the parse with the full sample set and the finally-latched
   * coordination frame. The early plate can be coarse — a Z band from
   * elevations with a degenerate XY footprint — and the second emission
   * is what corrects it. Vertex-carrying payloads are unaffected: those
   * are keyed by `geometryExpressID` and never re-sent.
   */
  aabb?: { min: [number, number, number], max: [number, number, number] }
  /**
   * Filled volume. Share's aabb path renders wireframe unless this is
   * set. Nothing sets it today — the spatial-structure plates that used
   * to are wireframe by request — but it stays part of the consumer
   * contract Share already implements.
   */
  solid?: boolean
}

/**
 * One unit a generation attempted and could not extract.
 *
 * `onPlacement` marks the subset waiting on a placement chain the prefix
 * does not hold yet — the only cause worth a retry, because for any other
 * cause a longer index does not change the answer.
 */
export interface PreviewDeferral {
  ordinal: number
  onPlacement: boolean
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
   * Drain the units {@link runUnits} has swallowed an exception for since
   * the last call — the channel's only view of them, because runUnits
   * reports a count and the causes stay inside the adapter.
   *
   * Cleared by the read, so a caller that drains per unit attributes each
   * deferral to the ordinal it just ran. Left unset by adapters that cannot
   * classify their failures; the channel then queues no retries for that
   * schema and behaves exactly as it did before conway#542.
   *
   * @return {PreviewDeferral[]} Deferrals since the last drain.
   */
  takeDeferrals?(): PreviewDeferral[]

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
   * Retry semantics for schemas whose unit list is FIXED up front while
   * the geometry those units reference arrives throughout the file
   * (AP214: the assembly tree sits at the head, solids follow). Without
   * this, the first generation "consumes" every unit against a prefix
   * that has no geometry yet and later, richer generations report no
   * new units — the channel then never emits anything. With it, the
   * channel re-runs units that emitted no instances against each new
   * generation, and marks a unit done only once it captures something.
   * Leave unset for schemas whose units keep appearing with the parse
   * (IFC products) — re-running those would be quadratic for no gain.
   */
  readonly retryEmptyUnits?: boolean

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

      // Prefix extractions hit representation items whose style/select
      // references aren't parsed yet — expected on a truncated tail;
      // don't flood the report (DOWA: 1164 styled-item errors).
      extraction.quietRecoverableLogging = true

      // A product whose placement records sit beyond this prefix must
      // defer, not extract unplaced: Revit writes placements near the
      // end of the file, so an early product can reference a placement
      // the index does not hold yet. Lenient reads null the dangling
      // reference and the product extracts at the origin — on a
      // georeferenced model the emitted payloads then sit a site-offset
      // away from the model (Share#1744: Snowdon's door #5014 put 88
      // payloads ~425km out, and the camera follow framed them). The
      // per-unit catch below already treats a throwing product as
      // not-yet-extractable; this makes a dangling placement throw like
      // any other unparsed forward reference. The classic-mode cursor
      // does not re-run passed units, so a deferred product sits out
      // the preview and the durable pump renders it — an empty slot,
      // never geometry at the wrong placement.
      extraction.deferDanglingPlacements = true

      // Preview-only preparation: skip the relationship sweeps whose
      // entity materialization dominates per-generation cost.
      extraction.prepareDemandExtraction( true )

      // Deferrals since the channel last drained them. Product ORDINALS,
      // not localIDs: the channel replays them against a later generation,
      // and `products` is enumerated off the type index in dense parse
      // order, which a longer prefix only extends (see
      // ColumnarIndexSink.snapshot) — so an ordinal means the same product
      // in every generation that holds it.
      let deferrals: PreviewDeferral[] = []

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
            } catch ( error ) {
              // Unparsed forward reference — the durable pump extracts
              // this product from the full model later. Recorded by cause:
              // a dangling placement is a product the index will be able
              // to place once it is longer, and is the one case worth
              // attempting again (conway#542).
              deferrals.push( {
                ordinal: where,
                onPlacement: error instanceof DanglingPlacementError,
              } )
            }
          }
          return executed
        },
        takeDeferrals: () => {
          const drained = deferrals

          deferrals = []

          return drained
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
export function releaseModelGeometry(
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
    retryEmptyUnits: true,
    buildGeneration( data, conwaywasm, columns ) {

      const model = new AP214StepModel(
          data, columns as ConstructorParameters<typeof AP214StepModel>[1] )

      const extraction = new AP214GeometryExtraction( conwaywasm, model )

      // Prefix extractions hit dangling records by construction —
      // don't let their expected per-record errors flood the report
      // (Arty: 5k+ styled-item warnings across generations).
      extraction.quietRecoverableLogging = true

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
  public coordinationMatrix?: number[]

  private stopped_ = false
  private timer_?: ReturnType<typeof setTimeout>

  private emittedUnits_ = 0
  private emittedBytes_ = 0

  /* Units a tick attempted and could not extract, and how many of those were
   * specifically waiting on a placement chain the prefix does not hold yet.
   * Reported on the way out so a blank first load is attributable rather
   * than merely observed (conway#542). */
  private deferredUnits_ = 0

  private deferredOnPlacement_ = 0

  /**
   * Ordinals that deferred on a placement under the CURRENT generation,
   * promoted to {@link retryQueue_} when the next one is built. Held
   * separately so a retry always runs against a longer index than the
   * attempt that failed — re-running one inside its own generation would
   * fail identically and spin.
   */
  private deferredForRetry_: number[] = []

  private retryQueue_: number[] = []

  private retryCursor_ = 0

  private retriedUnits_ = 0

  /**
   * Retry mode (adapter.retryEmptyUnits): units this generation ran that
   * captured nothing. That schema's adapters cannot classify a failure —
   * an assembly unit simply produces no instances until the solids it
   * references are indexed — so an empty unit is its evidence that a
   * longer index is the missing ingredient, standing in for
   * {@link deferredForRetry_} in the preemption gate.
   */
  private emptyUnitsThisGeneration_ = 0

  /** Ms from channel construction to the first payload handed to `onMesh`
   * — time-to-first-pixel, the number conway#542 exists to move. */
  private firstMeshMs_?: number

  private readonly startedMs_ = Date.now()

  /** Ordinal cursor into the unit list (see the adapter's stability
   * notes). */
  private unitOrdinal_ = 0

  /** Retry mode (adapter.retryEmptyUnits): ordinals that captured ≥ 1
   * instance — done for good, skipped on later generations. */
  private readonly completedUnits_ = new Set<number>()

  /** Retry mode: scan position within the CURRENT generation (resets to
   * 0 on every new generation so empty units get re-run). */
  private retryScan_ = 0

  /** Geometry expressIDs whose payload has been emitted (cross-generation
   * dedup for mapped/shared geometry). */
  private readonly emittedGeometry_ = new Set<number>()

  private generation_?: {
    generation: PreviewPrefixGeneration
    capturedCounts: Map<number, number>
  }

  private lastSnapshotRecords_ = 0

  /** Records at the last snapshot whose generation build THREW (a
   * structurally incomplete prefix) — gates retries to index growth so a
   * throwing prefix build can't hot-loop every tick. */
  private lastFailedSnapshotRecords_ = 0

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

  // A field rather than reading TICK_BUDGET_MS directly, so a test can lift
  // the wall-clock bound the way it already lifts tickIntervalMs_. Asserting
  // "this tick ran all N units" against a real 25ms budget is a coin flip on
  // a loaded runner: the retryEmptyUnits test expected [0,1,2] and got [0,1]
  // in CI while passing locally. Production behaviour is unchanged.
  private tickBudgetMs_ = TICK_BUDGET_MS

  // Companion seam to tickBudgetMs_, and unbounded in production: a resident
  // unit attempt pages nothing (the store channel's TICK_MAX_ATTEMPTS exists
  // because its attempts page source through a windowed provider), so the
  // wall clock is the only bound worth paying for here. A test pins it so
  // "this tick left units unattempted" — which is what separates a
  // preemptive rebuild from an exhaustion one — is a fact rather than a race
  // against the budget.
  private tickMaxAttempts_ = Number.MAX_SAFE_INTEGER

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

    // Say what the preview delivered on the way out. The channel is a local
    // of the open call — nothing outside holds it — so a counter not
    // reported here is a counter nobody can read. Same formatter as the
    // store path, and the same one Share renders (core/progress_log), so a
    // pasted browser log and a pasted CLI run read identically.
    //
    // Unconditional, not gated on emittedUnits_ or deferredUnits_ being
    // nonzero: a channel that never reached firstGenerationMinRecords, or
    // whose every generation build threw, is precisely the worst-case
    // blank-first-load this issue exists to make diagnosable, and
    // formatPreviewLine already renders that case as "no mesh, 0 emitted,
    // 0 deferred". Suppressing the line there made an enabled preview that
    // produced nothing indistinguishable from a preview that never ran
    // (codex round 1 on #543).
    Logger.info(formatPreviewLine(this.previewYield))
  }

  /** True when a cap was hit and the channel retired itself early. */
  public get capped(): boolean {
    return this.emittedUnits_ >= this.maxUnits ||
      this.emittedBytes_ >= this.maxBytes
  }

  /**
   * What the preview delivered, and how fast.
   *
   * `firstMeshMs` is time-to-first-pixel measured from channel construction
   * (immediately before the parse starts), undefined when nothing was ever
   * emitted. `deferred` counts units a tick attempted and could not
   * extract, `deferredOnPlacement` the subset waiting on a placement chain
   * the prefix does not hold, and `retried` the attempts that were second
   * looks at an earlier deferral — a retry path that has silently stopped
   * firing shows up here rather than merely as a slower load.
   *
   * The same shape as {@link StorePreviewChannel.previewYield}, so both
   * paths render through one formatter (core/progress_log).
   *
   * @return {object} `{firstMeshMs, emitted, deferred, deferredOnPlacement,
   * retried}`
   */
  public get previewYield(): {
    firstMeshMs?: number, emitted: number, deferred: number,
    deferredOnPlacement: number, retried: number } {

    return {
      firstMeshMs: this.firstMeshMs_,
      emitted: this.emittedUnits_,
      deferred: this.deferredUnits_,
      deferredOnPlacement: this.deferredOnPlacement_,
      retried: this.retriedUnits_,
    }
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

    const deadline = Date.now() + this.tickBudgetMs_

    if (!this.ensureGeneration_()) {
      return
    }

    const active = this.generation_!
    const { generation } = active

    let attempts = 0

    if (this.adapter.retryEmptyUnits === true) {

      // Retry mode: scan the fixed unit list, skipping units that
      // already captured instances on an earlier (or this) generation.
      // Capture runs per unit so completion can be attributed — unit
      // counts here are small by construction (assembly roots).
      while (this.retryScan_ < generation.unitCount &&
          this.emittedUnits_ < this.maxUnits &&
          attempts < this.tickMaxAttempts_ &&
          Date.now() < deadline) {

        const ordinal = this.retryScan_++

        if (this.completedUnits_.has(ordinal)) {
          continue
        }

        ++attempts

        const executed = generation.runUnits(ordinal, 1)

        if (executed > 0 && this.captureNewInstances_() > 0) {
          this.completedUnits_.add(ordinal)
          ++this.emittedUnits_
        } else {
          ++this.emptyUnitsThisGeneration_
        }
      }

      return
    }

    let extractedThisTick = 0

    while (this.hasPendingUnits_(generation) &&
        this.emittedUnits_ + extractedThisTick < this.maxUnits &&
        attempts < this.tickMaxAttempts_ &&
        Date.now() < deadline) {

      ++attempts

      // Retries first: they are the units the index has most recently
      // become able to place, and they are cheaper than a fresh attempt
      // whichever way they go.
      const isRetry = this.retryCursor_ < this.retryQueue_.length
      const ordinal = isRetry ?
        this.retryQueue_[this.retryCursor_++] : this.unitOrdinal_++

      if (isRetry) {
        ++this.retriedUnits_
      }

      extractedThisTick += generation.runUnits(ordinal, 1)
      this.drainDeferrals_(generation)
    }

    if (extractedThisTick > 0) {
      this.captureNewInstances_()
      this.emittedUnits_ += extractedThisTick
    }
  }

  /**
   * Take the deferrals the generation accumulated for the unit just run and
   * fold them into the counters, queueing the placement ones for a second
   * look at the next generation.
   *
   * @param generation The generation that ran the unit.
   */
  private drainDeferrals_(generation: PreviewPrefixGeneration): void {

    const deferrals = generation.takeDeferrals?.()

    if (deferrals === void 0) {
      return
    }

    for (const deferral of deferrals) {

      ++this.deferredUnits_

      if (!deferral.onPlacement) {
        continue
      }

      ++this.deferredOnPlacement_

      if (this.deferredForRetry_.length < RETRY_QUEUE_MAX) {
        this.deferredForRetry_.push(deferral.ordinal)
      }
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
    const records = this.sink.topLevelCount

    // Rebuild on INDEX GROWTH, not on running out of units. The order of
    // these two tests is the whole behaviour of the channel on a large file.
    //
    // It used to keep the current generation for as long as that generation
    // still had an unattempted unit, and only then consider rebuilding. A
    // generation snapshotted at FIRST_GENERATION_MIN_RECORDS already lists
    // thousands of products, and a tick attempts a handful of them per
    // cadence interval, so on anything large the list never emptied and the
    // rebuild never fired — the store path's twin of this gate left DOWA
    // extracting against a snapshot of its first 1024 records for all 9 s of
    // its parse, which is why 100% of its attempts deferred and its first
    // mesh landed at 98.3% of the file (conway#542).
    //
    // Preempting makes generations arrive on the index's schedule —
    // O(log records) of them, GENERATION_GROWTH_FACTOR apart — and the units
    // the old generation had not reached carry over untouched, because
    // `unitOrdinal_` indexes a dense parse-order list that a longer snapshot
    // only extends.

    // Eligibility to rebuild at all — the original growth gate, unchanged.
    const growthReady =
      records >= this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR &&
      records >= this.lastFailedSnapshotRecords_ * GENERATION_GROWTH_FACTOR

    // Whether to rebuild EARLY, without waiting for the current generation's
    // units to run out. Only worth it for a generation that is actually
    // deferring: a longer index cannot help one whose units extract fine,
    // and preempting anyway costs the case that already works best — on PSB,
    // which defers nothing, unconditional preemption pushed the store path's
    // first mesh from 269 ms out to 495 ms. Units waiting for a retry (or,
    // in retry mode, units that captured nothing) are precisely the evidence
    // that more index is the missing ingredient.
    const preempt = active !== void 0 && growthReady && this.hasDeferred_()

    if (!preempt && active !== void 0 &&
        this.hasPendingUnits_(active.generation)) {
      return true
    }

    if (records < this.firstGenerationMinRecords) {
      return false
    }

    if (active !== void 0 &&
        records < this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR) {
      return false
    }

    if (records < this.lastFailedSnapshotRecords_ * GENERATION_GROWTH_FACTOR) {
      return false
    }

    const columns = this.sink.snapshot()

    let generation: PreviewPrefixGeneration | undefined

    try {
      generation =
        this.adapter.buildGeneration(this.data, this.conwaywasm, columns)
    } catch {
      // A mid-parse prefix can be structurally incomplete — dangling
      // references throw schema-typed errors (AP214's assembly-tree
      // prep especially; a bad prefix killed the whole STEP preview
      // before this catch). That retires THIS attempt, not the
      // channel: the growth gate above retries once the index has
      // grown enough for a materially different prefix.
      this.lastFailedSnapshotRecords_ = records
      return false
    }

    this.lastFailedSnapshotRecords_ = 0
    this.lastSnapshotRecords_ = records

    if (generation === void 0) {
      // Prefix grew but cannot build yet — wait for more records.
      return false
    }

    // A generation that adds no new units is still worth building when
    // deferred ones are waiting: what changed is the INDEX behind them,
    // which is the only reason a retry could now succeed.
    const newGenerationPending = this.adapter.retryEmptyUnits === true ?
      generation.unitCount > 0 &&
        this.completedUnits_.size < generation.unitCount :
      generation.unitCount > this.unitOrdinal_ ||
        this.deferredForRetry_.length > 0

    if (!newGenerationPending) {
      // Nothing this prefix can add — free it and wait for more records.
      // (The active generation, if any, keeps its scan state untouched.)
      try {
        generation.dispose()
      } catch {
        // Never let a free break the open.
      }
      return false
    }

    // Retry mode: a fresh generation re-runs every not-yet-captured unit.
    this.retryScan_ = 0
    this.emptyUnitsThisGeneration_ = 0

    // Deferrals of the outgoing generation become this one's retry queue —
    // the whole point of building it early. Carry the OLD queue's
    // unconsumed suffix forward too, not just this generation's fresh
    // deferrals: preemption can fire mid-drain of retryQueue_ (a tick's
    // attempt budget against an index that grew enough to trigger a
    // rebuild before the queue emptied), and every un-popped entry is a
    // unit whose ordinal unitOrdinal_ has already passed — replacing the
    // queue outright, rather than concatenating, would strand them exactly
    // the way abandoned deferrals were stranded before this fix existed
    // (conway#542, codex round 1 on #543).
    this.retryQueue_ = [
      ...this.retryQueue_.slice(this.retryCursor_),
      ...this.deferredForRetry_,
    ].slice(0, RETRY_QUEUE_MAX)
    this.retryCursor_ = 0
    this.deferredForRetry_ = []

    // The outgoing generation's instances are all captured (capture runs
    // per tick, after the units it ran) — free its native scenes before
    // adopting the new one.
    try {
      active?.generation.dispose()
    } catch {
      // Never let a free break the open.
    }

    this.generation_ = {
      generation,
      capturedCounts: new Map<number, number>(),
    }

    return true
  }

  /**
   * Whether the current generation has produced evidence that a longer
   * index would help it — the preemption gate. Classic mode: units queued
   * for a retry. Retry mode: units that ran and captured nothing, since
   * that schema's adapter cannot classify a failure.
   *
   * @return {boolean} True when this generation is deferring.
   */
  private hasDeferred_(): boolean {

    if (this.adapter.retryEmptyUnits === true) {
      return this.emptyUnitsThisGeneration_ > 0
    }

    return this.deferredForRetry_.length > 0
  }

  /**
   * Does the given generation still have units this channel would run —
   * retry mode: not-yet-captured ordinals ahead of the scan; classic
   * mode: queued retries, or ordinals beyond the global forward-only
   * cursor.
   *
   * @param generation The generation to check.
   * @return {boolean} True when a tick can make progress on it.
   */
  private hasPendingUnits_(generation: PreviewPrefixGeneration): boolean {

    if (this.adapter.retryEmptyUnits === true) {
      return this.retryScan_ < generation.unitCount &&
        this.completedUnits_.size < generation.unitCount
    }

    return this.retryCursor_ < this.retryQueue_.length ||
      this.unitOrdinal_ < generation.unitCount
  }

  /**
   * Walk the current generation's scene and emit every not-yet-captured
   * placed instance as a payload — the preview twin of the durable delta
   * captures, with the same placed-geometry math per schema (recentering
   * for IFC, bare composition for AP214) so preview and durable
   * placements coincide, but copying geometry OUT of the wasm heap
   * instead of retaining native references.
   *
   * @return {number} Instances emitted by this pass (retry mode uses
   * this to attribute unit completion).
   */
  private captureNewInstances_(): number {

    const active = this.generation_!
    const { generation, capturedCounts } = active
    const { scene, recenter } = generation

    const linearScalingFactor = generation.linearScalingFactor
    const seenThisPass = new Map<number, number>()

    let emitted = 0

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

      // normalize() recenters the geometry buffer (side effect) and returns
      // the local centre; only the per-leaf recenter path (IFC) applies it —
      // AP214 shares one buffer and composes bare (issue #308).
      const center = recenter ? geometry.geometry.normalize() : undefined

      const geometryExpressID =
        generation.geometryExpressID(geometry.localID) as number

      // Full-precision float64 placement straight from the wasm boundary
      // (glm::dmat4) — never truncated through a gl-matrix Float32Array;
      // the recentre math runs in double precision (see coordination_f64).
      const geometryTransform = nativeTransform?.getValues()

      if (this.coordinationMatrix === void 0 && this.coordinateToOrigin) {
        this.coordinationMatrix = deriveCoordinationF64(
            geometryTransform, nativePt!, NORMALIZE_MAT_F64, linearScalingFactor)
      }

      const coordination = this.coordinationMatrix ?? glmatrix.mat4.create()

      const newTransform =
          composeTransformF64(coordination, geometryTransform, center)

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

      this.firstMeshMs_ ??= Date.now() - this.startedMs_

      this.onMesh(payload)
      ++emitted

      if (this.emittedBytes_ >= this.maxBytes) {
        return emitted
      }
    }

    return emitted
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

      // The classic-mode pending test, spelled out rather than shared with
      // hasPendingUnits_: this seam walks the unit list forward whatever
      // the adapter's retry semantics are (ap214_streamed_open.test.ts
      // drains a retryEmptyUnits adapter through it), and retry mode's
      // `retryScan_` is advanced by ticks only, so borrowing that test here
      // would never terminate.
      if (this.retryCursor_ >= this.retryQueue_.length &&
          this.unitOrdinal_ >= active.generation.unitCount) {
        return
      }

      const isRetry = this.retryCursor_ < this.retryQueue_.length
      const ordinal = isRetry ?
        this.retryQueue_[this.retryCursor_++] : this.unitOrdinal_++

      if (isRetry) {
        ++this.retriedUnits_
      }

      const executed = active.generation.runUnits(ordinal, 1)

      this.drainDeferrals_(active.generation)

      if (executed > 0) {
        this.captureNewInstances_()
        ++this.emittedUnits_
      }
    }
  }
}
