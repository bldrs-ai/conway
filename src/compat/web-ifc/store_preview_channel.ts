import { ConwayGeometry } from '../../index'
import { CanonicalMaterial } from '../../index'
import { CanonicalMeshType } from '../../index'
import IfcStepModel from '../../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import {
  IfcBuildingStorey,
  IfcProduct,
  IfcProject,
  IfcRelAggregates,
  IfcUnitAssignment,
} from '../../ifc/ifc4_gen'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { cursorIterator } from '../../indexing/cursor_utilities'
import { WindowedStepBufferProvider } from '../../step/step_buffer_provider'
import type { StepExternalByteStore } from '../../step/step_buffer_provider'
import { Vector3 } from '../../../dependencies/conway-geom'
import * as glmatrix from 'gl-matrix'
import {
  composeTransformF64,
  deriveCoordinationF64,
  IDENTITY_MAT4,
  LARGE_COORDINATE_BUDGET_M,
  NORMALIZE_MAT_F64,
} from './coordination_f64'
import {
  exceedsLargeCoordinateBudget,
  normalizeWithCentreF64,
  placementMagnitudeM,
} from './geometry_recentre'
import { emitSpatialStructureImposters } from './spatial_imposter'
import { DanglingPlacementError } from '../../ifc/dangling_placement_error'
import { formatPreviewLine } from '../../core/progress_log'
import Logger from '../../logging/logger'
import {
  PreviewMeshPayload,
  releaseModelGeometry,
} from './streamed_preview_channel'


/* eslint-disable no-magic-numbers */

const TICK_INTERVAL_MS = 150
const TICK_INTERVAL_MAX_MS = 600
const TICK_INTERVAL_GROWTH = 1.1

/**
 * Extraction + capture budget per tick, mirroring
 * {@link StreamedPreviewChannel}'s. The store path used to extract
 * exactly ONE product per tick on the interval below, i.e. 2-7
 * products/second — which is why PSB's preview arrived girder by girder
 * where the resident path delivered batches (conway#518).
 */
const TICK_BUDGET_MS = 20

/**
 * Products a single tick may attempt, whatever the clock says.
 *
 * `deferDanglingPlacements` (Share#1744) defers any product whose
 * placement records the prefix does not hold yet, and some exporters
 * write the tail of a placement chain toward the tail of the file — so
 * early ticks meet long runs of products that cannot extract. Each such
 * attempt still pages source through the windowed provider, so a run of
 * them is not free; this caps the run rather than letting the deadline
 * be the only bound.
 *
 * Measured across the corpus in conway#542, and note it is the WRITER
 * that decides record order, not the authoring tool: files written by
 * the ODA IFC SDK and Tekla's exporter are strictly backward-
 * referencing and never hit this path, while DDS_IFC (Archicad's IFC
 * add-on) and ST-DEVELOPER defer 100% of products. On the Archicad
 * files the last record in a chain to arrive is always a LEAF —
 * IfcDirection or IfcCartesianPoint, not the placement and not the
 * geometry — which is why a head-only prefix cannot fix it however far
 * it grows.
 *
 * An earlier version of this comment blamed Revit. The one
 * Revit-authored file in that corpus is the BEST case measured (first
 * preview mesh at 269 ms, zero deferrals) — though it was written out
 * through the ODA SDK, so it says nothing about Revit's own exporter
 * either way. The 398 MB Archicad file is the worst: 531 of 532
 * attempts deferred, first mesh at 98.3% of the file, 8.9 s of blank
 * screen.
 */
const TICK_MAX_ATTEMPTS = 32

/**
 * Deferred products carried into the next generation for a second look.
 *
 * The channel used to be strictly forward-only: a product that deferred was
 * attempted once, at the earliest — and therefore most index-starved —
 * generation it appeared in, and never again, because `unitOrdinal_` only
 * ever advances and a rebuilt generation regenerates `products` in the same
 * dense parse order. On a file whose placement chains resolve late that
 * throws away nearly everything: DOWA has 19,854 of its 45,860 products
 * emittable once 70% of the file is indexed, and emitted 1, because all of
 * them had been attempted and discarded before the index reached their
 * leaves (conway#542).
 *
 * A retry is affordable in a way a first attempt is not: a deferring
 * attempt costs ~0.17 ms — the whole 532-attempt run on DOWA is 93 ms,
 * against 2.1 s for that load's three generation rebuilds — because it
 * fails on an index lookup before any geometry is paged. The cap is here
 * because the queue must not grow with the model; it only has to keep
 * DEFAULT_MAX_PREVIEW_UNITS worth of candidates in play.
 */
const RETRY_QUEUE_MAX = 4096

const FIRST_GENERATION_MIN_RECORDS = 1024
const GENERATION_GROWTH_FACTOR = 2.0
const DEFAULT_MAX_PREVIEW_UNITS = 512
const DEFAULT_MAX_PREVIEW_BYTES = 48 * 1024 * 1024
const FLOATS_PER_VERTEX = 6
const BYTES_PER_FLOAT = 4
const DEFAULT_COLOR: [number, number, number, number] = [0.8, 0.8, 0.8, 1]
const FLUSH_BUDGET_MS = 100

/**
 * Parse-time placed-mesh preview for a windowed (store-backed) open.
 *
 * Twin of {@link StreamedPreviewChannel}: same capture math and
 * COORDINATE_TO_ORIGIN frame, same time-budgeted tick, but the prefix
 * model pages product closures from `store` instead of a resident
 * buffer. After each product the pins drop, so peak source residency
 * stays the windowed LRU — not the file.
 *
 * It also runs the spatial-structure walk off its own prefix
 * generations, so the building's skeleton goes up in the first seconds
 * of a long parse rather than after it — see
 * {@link maybeEmitEarlySpatialPlates_}.
 */
export class StorePreviewChannel {

  public coordinationMatrix?: number[]

  private stopped_ = false
  private emittedUnits_ = 0
  /**
   * Preview meshes handed to `onMesh_`. Tracked apart from
   * {@link emittedUnits_} because the two genuinely diverge: a product can
   * place several meshes, and a product with no Representation extracts
   * cleanly while placing none — `extractProductGeometry` returns early on
   * a null Representation and `extractProductGeometryByLocalID` still
   * answers true. Reporting only units let the load log say "no mesh, 20
   * emitted" about one load (codex round 2 on #543).
   */
  private meshesEmitted_ = 0

  /* Products a tick attempted but could not extract, and how many of those
   * were specifically waiting on a placement chain the prefix does not hold
   * yet. Reported at the end of the preview so a blank first load is
   * attributable: "9 812 of 9 840 attempts deferred, 9 810 on placements" is
   * a file-layout problem that a sharded parse addresses, and anything else
   * is not (conway#542). */
  private deferredUnits_ = 0

  private deferredOnPlacement_ = 0

  /**
   * Products that deferred under the CURRENT generation, promoted to
   * {@link retryQueue_} when the next one is built. Held separately so a
   * retry always runs against a longer index than the attempt that failed —
   * re-running one inside its own generation would fail identically and
   * spin.
   */
  private deferredForRetry_: number[] = []

  private retryQueue_: number[] = []

  private retryCursor_ = 0

  private retriedUnits_ = 0

  /**
   * Ms from channel construction to the first PLACED PRODUCT payload —
   * time-to-first-pixel, the number conway#542 exists to move. The spatial
   * plates are deliberately not counted: they are the building's wireframe
   * skeleton, they go out on a different schedule (see
   * {@link maybeEmitEarlySpatialPlates_}), and counting them would report
   * first pixels for a load whose products are all still deferring.
   * {@link earlyPlateCount} is where those are visible.
   */
  private firstMeshMs_?: number

  private readonly startedMs_ = Date.now()
  private emittedBytes_ = 0

  /** Latch for the "recentre did not recentre" report — see
   * {@link reportLargeCoordinate_}. */
  private largeCoordinateReported_ = false

  private unitOrdinal_ = 0
  private lastInlineTick_ = 0
  private tickIntervalMs_ = TICK_INTERVAL_MS
  private lastSnapshotRecords_ = 0
  private lastFailedSnapshotRecords_ = 0
  lastFailReason?: string

  // Fields rather than the constants directly, so a test can lift the
  // wall-clock bounds the way ifc_api_preview_channel.test.ts already
  // lifts the streamed channel's: asserting "this tick ran N products"
  // against a real 20ms budget is a coin flip on a loaded runner.
  private tickBudgetMs_ = TICK_BUDGET_MS
  private tickMaxAttempts_ = TICK_MAX_ATTEMPTS

  /** Set once a prefix-generation spatial walk has emitted a plate. */
  private earlyPlatesEmitted_ = 0

  /**
   * Whether those plates were composed under the walk's own fallback
   * frame because no preview instance had latched one yet. They get one
   * re-emission on a later generation once a real frame exists — see
   * {@link maybeEmitEarlySpatialPlates_}.
   */
  private earlyPlatesUsedFallbackFrame_ = false

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

  /**
   * What the preview delivered, and how fast.
   *
   * `firstMeshMs` is time-to-first-pixel measured from channel
   * construction, undefined when no placed product was ever emitted.
   * `meshes` counts what actually reached the consumer, `emitted` counts
   * the products extraction accepted — they are not the same number in
   * either direction, so the line reports both.
   * `deferred` counts products a tick attempted and could not extract;
   * `deferredOnPlacement` is the subset still waiting on a placement chain
   * the prefix does not hold; `retried` counts attempts that were second
   * looks at an earlier deferral rather than first attempts, so a channel
   * whose retry path has silently stopped firing is visible rather than
   * merely slower. A first load that shows nothing is a very
   * different problem depending on that ratio — near 1.0 is the file-layout
   * case a sharded parse attacks, anything else is not — and inferring it
   * from a code comment is what conway#542 exists to stop.
   *
   * @return {object} `{firstMeshMs, meshes, emitted, deferred,
   * deferredOnPlacement, retried}`
   */
  public get previewYield(): {
    firstMeshMs?: number, meshes: number, emitted: number, deferred: number,
    deferredOnPlacement: number, retried: number } {

    return {
      firstMeshMs: this.firstMeshMs_,
      meshes: this.meshesEmitted_,
      emitted: this.emittedUnits_,
      deferred: this.deferredUnits_,
      deferredOnPlacement: this.deferredOnPlacement_,
      retried: this.retriedUnits_,
    }
  }

  /** Products the current generation would run (test seam). */
  public get productCount(): number {
    return this.generation_?.products.length ?? 0
  }

  /**
   * Plates the prefix-generation spatial walk emitted, 0 while it has
   * not succeeded (see {@link maybeEmitEarlySpatialPlates_}).
   */
  public get earlyPlateCount(): number {
    return this.earlyPlatesEmitted_
  }

  /**
   * One cadence-gated, time-budgeted tick. No-op until the interval
   * elapses or the index can support a generation. Safe to call from
   * parse progress.
   *
   * **Cadence and budget interact once, not twice.** The interval is
   * measured tick-start to tick-start (`lastInlineTick_` is stamped
   * before the work, as on the streamed channel), so a tick that spends
   * its whole budget shortens the gap to the next one by that budget
   * rather than adding to it. And the decay is charged only to ticks
   * that actually attempted a product: a tick that found no generation —
   * which is every tick through the opening seconds of a big parse, when
   * the index has not yet reached FIRST_GENERATION_MIN_RECORDS — used to
   * decay the interval anyway, so by the time there was anything to
   * extract the cadence had already cooled toward
   * TICK_INTERVAL_MAX_MS. Deliberately divergent from
   * {@link StreamedPreviewChannel}, which decays unconditionally; the
   * cost is that a channel which never finds a generation keeps probing
   * at TICK_INTERVAL_MS, and a probe that finds nothing is a record
   * count compared against two thresholds.
   *
   * @return {Promise<void>} Settles when this tick's products (if any)
   * are captured.
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

    try {

      if ( ( await this.tickBudgeted_() ) > 0 ) {
        this.tickIntervalMs_ = Math.min(
            this.tickIntervalMs_ * TICK_INTERVAL_GROWTH, TICK_INTERVAL_MAX_MS )
      }
    } catch {
      this.stopped_ = true
    }
  }

  /**
   * Attempt products until the time budget or the attempt cap runs out,
   * whichever comes first.
   *
   * @return {Promise<number>} Products attempted this tick.
   */
  private async tickBudgeted_(): Promise< number > {

    const deadline = Date.now() + this.tickBudgetMs_
    let attempts = 0

    while ( !this.capped &&
        attempts < this.tickMaxAttempts_ &&
        Date.now() < deadline ) {

      if ( !( await this.tickOnce_() ) ) {
        break
      }

      ++attempts
    }

    return attempts
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

    // Say what the preview delivered, and how fast, on the way out. The
    // channel is a local of the open call — nothing outside holds it — so a
    // counter that is not reported here is a counter nobody can read. And a
    // first load that showed the user nothing is exactly the case where this
    // line is the whole diagnosis: a deferral ratio near 1.0 ON PLACEMENTS
    // is the file-layout problem, and anything else is a different problem
    // wearing the same blank screen (conway#542). Rendered by the shared
    // load-log formatter, so the resident path's line and this one are the
    // same line.
    //
    // Unconditional, not gated on emittedUnits_ or deferredUnits_ being
    // nonzero: a channel that never reached firstGenerationMinRecords, or
    // whose every generation build threw, is precisely the worst-case
    // blank-first-load this issue exists to make diagnosable — and
    // formatPreviewLine already renders that as "no mesh, 0 emitted, 0
    // deferred". Suppressing the line there made an enabled preview that
    // produced nothing indistinguishable from a preview that never ran
    // (codex round 1 on #543).
    Logger.info( formatPreviewLine( this.previewYield ) )
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

    if ( !StorePreviewChannel.hasPending_(
        this.retryCursor_, this.retryQueue_.length,
        this.unitOrdinal_, active.products.length ) ) {
      return false
    }

    // Retries first: they are the products the index has most recently
    // become able to place, and they are cheaper than a fresh attempt
    // whichever way they go.
    const isRetry = this.retryCursor_ < this.retryQueue_.length
    const localID = isRetry ?
      this.retryQueue_[ this.retryCursor_++ ] :
      active.products[ this.unitOrdinal_++ ]

    if ( isRetry ) {
      ++this.retriedUnits_
    }
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
    } catch ( error ) {
      // Forward-ref / unplaced — durable pump extracts later. Counted by
      // cause: a preview that stays blank because every product's placement
      // is still ahead of the prefix wants a different fix from one blank
      // for any other reason, and only this split can tell them apart
      // (conway#542).
      ++this.deferredUnits_

      if ( error instanceof DanglingPlacementError ) {
        ++this.deferredOnPlacement_

        // Only placement deferrals are worth another look. Any other throw
        // is a property of the product rather than of how much index exists,
        // so a longer prefix does not change the answer.
        if ( this.deferredForRetry_.length < RETRY_QUEUE_MAX ) {
          this.deferredForRetry_.push( localID )
        }
      }
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
   * Whether either queue still has a product to attempt.
   *
   * Static and fully parameterised so the two callers — the tick and the
   * generation gate — cannot drift apart on what "pending" means, which is
   * the bug that would silently strand the retry queue.
   *
   * @param retryCursor How far into the retry queue this generation is.
   * @param retryLength The retry queue's length.
   * @param ordinal The forward cursor into the generation's products.
   * @param productCount That generation's product count.
   * @return {boolean} True when something is left to attempt.
   */
  private static hasPending_(
      retryCursor: number,
      retryLength: number,
      ordinal: number,
      productCount: number ): boolean {

    return retryCursor < retryLength || ordinal < productCount
  }

  /**
   * @return {Promise<boolean>} True when a generation with pending units exists.
   */
  private async ensureGeneration_(): Promise< boolean > {

    const active = this.generation_
    const records = this.sink_.topLevelCount

    // Rebuild on INDEX GROWTH, not on running out of products. The order of
    // these two tests is the whole behaviour of the channel on a large file.
    //
    // It used to keep the current generation for as long as that generation
    // still had an unattempted product, and only then consider rebuilding.
    // A generation snapshotted at FIRST_GENERATION_MIN_RECORDS already lists
    // thousands of products, and the tick attempts at most
    // TICK_MAX_ATTEMPTS of them per cadence interval, so on anything large
    // the list never emptied and the rebuild never fired: DOWA spent all 9 s
    // of its parse extracting against a snapshot of its first 1024 records,
    // which is why 100% of its attempts deferred and its first mesh landed
    // at 99.2% of the file (conway#542). The growth gate below was written
    // to bound rebuild cost and instead became unreachable.
    //
    // Preempting makes generations arrive on the index's schedule —
    // O(log records) of them, GENERATION_GROWTH_FACTOR apart — and the
    // products the old generation had not reached carry over untouched,
    // because `unitOrdinal_` indexes a dense parse-order list that a longer
    // snapshot only extends (see ColumnarIndexSink.snapshot).

    // Eligibility to rebuild at all — the original growth gate, unchanged.
    const growthReady =
      records >= this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR &&
      records >= this.lastFailedSnapshotRecords_ * GENERATION_GROWTH_FACTOR

    // Whether to rebuild EARLY, without waiting for the current generation's
    // products to run out. Only worth it for a generation that is actually
    // deferring: a longer index cannot help one whose products extract fine,
    // and preempting anyway costs the case that already works best — on PSB,
    // which defers nothing, unconditional preemption pushed the first mesh
    // from 269 ms out to 495 ms. Deferrals waiting for retry are precisely
    // the evidence that more index is the missing ingredient.
    const preempt = active !== void 0 && growthReady &&
      this.deferredForRetry_.length > 0

    if ( !preempt && active !== void 0 && StorePreviewChannel.hasPending_(
        this.retryCursor_, this.retryQueue_.length,
        this.unitOrdinal_, active.products.length ) ) {
      return true
    }

    if ( records < this.firstGenerationMinRecords ) {
      return false
    }

    if ( active !== void 0 &&
        records < this.lastSnapshotRecords_ * GENERATION_GROWTH_FACTOR ) {
      return false
    }

    // Unconditional, unlike the snapshot gate above: a prefix whose build
    // THREW leaves no active generation, so folding this into `growthReady`
    // and testing it only when one exists would let a structurally
    // incomplete prefix re-snapshot and re-throw on every tick.
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

      // A generation that adds no new products is still worth building when
      // deferred ones are waiting: what changed is the INDEX behind them,
      // which is the only reason a retry could now succeed.
      if ( products.length <= this.unitOrdinal_ &&
        this.deferredForRetry_.length === 0 ) {
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

      // Carry the OLD queue's unconsumed suffix forward, not just this
      // generation's fresh deferrals. Preemption can fire mid-drain of
      // retryQueue_ — bounded per-tick attempts (TICK_MAX_ATTEMPTS) against
      // an index that grew enough to trigger a rebuild before the queue
      // emptied — and every one of those un-popped entries is a product
      // whose ordinal unitOrdinal_ has already passed, so replacing the
      // queue outright (rather than concatenating) would strand them
      // exactly the way abandoned deferrals were stranded before this fix
      // existed (conway#542, codex round 1 on #543).
      this.retryQueue_ = [
        ...this.retryQueue_.slice( this.retryCursor_ ),
        ...this.deferredForRetry_,
      ].slice( 0, RETRY_QUEUE_MAX )
      this.retryCursor_ = 0
      this.deferredForRetry_ = []
      this.generation_ = {
        model,
        extraction,
        products,
        capturedCounts: new Map< number, number >(),
      }
      this.lastSnapshotRecords_ = records
      this.lastFailedSnapshotRecords_ = 0
      this.lastFailReason = void 0

      await this.maybeEmitEarlySpatialPlates_( model, extraction )

      return true
    } catch ( error ) {
      this.lastFailedSnapshotRecords_ = records
      this.lastFailReason = error instanceof Error ? error.message : String( error )
      return false
    }
  }

  /**
   * Put the spatial skeleton up from a PREFIX generation, seconds into
   * the parse instead of after it (conway#518).
   *
   * The spatial records sit at the file head on Revit exports — on PSB
   * `IFCSITE` is record #211 — and a prefix generation is already
   * everything the walk needs: a columns snapshot over a windowed
   * provider, with `prepareDemandExtraction(true)` done, which is what
   * makes `getLinearScalingFactor()` report real units rather than 1.
   * So the plates can lead the first extracted product rather than
   * trailing the whole parse, which is what the store path's three
   * stacked latency gates (one product per tick, early products
   * deferring on late placements, the walk waiting for the full index)
   * added up to: a blank screen through the first ~60% of a 16.7 s
   * parse.
   *
   * **Runs at most once successfully, on the parse's cooperative path.**
   * The walk is reused as-is, with no internal budget: it awaits a
   * residency ensure per spatial node and per sampled product placement
   * (PRODUCT_SAMPLE per node), so its cost tracks the prefix's spatial
   * tree, not the file. On the first qualifying generation that tree is
   * small by construction — the storeys exist but few
   * `IfcRelContainedInSpatialStructure` do — which is the same property
   * that makes these early plates coarse. Retries are bounded without a
   * counter: generations only rebuild on a GENERATION_GROWTH_FACTOR
   * doubling of the index, so there are O(log records) of them.
   *
   * **The end-of-parse walk in the proxy is the refresh, not a
   * duplicate.** It re-emits the same expressIDs with contained-product
   * samples the prefix did not hold and under the frame the channel
   * latched, and the consumer contract is that an `aabb` payload
   * REPLACES the prior plate for its expressID. Double emission is the
   * design; see PreviewMeshPayload.
   *
   * **Known gap in that contract, and it is a gap, not a subtlety.**
   * Replacement only reaches nodes the final walk still emits, and the
   * emit set is not stable between the two: `aabbMostlyEqual` collapses
   * a single-child wrapper (Project over Site over Building) once its
   * box matches its child's, which a prefix generation's degenerate
   * boxes may not yet do. A wrapper emitted here and collapsed there is
   * never replaced and never removed — the payload contract has no
   * delete — so its early box lingers as one small plate until Share
   * tears the preview scenery down at load end. Bounded (the wrapper
   * chain is a handful of nodes, and the collapse needs exactly one
   * child), but real. Closing it properly needs either a delete/
   * generation channel in the payload contract or an emit set the two
   * walks agree on, and both are consumer-side changes.
   *
   * @param model The prefix model.
   * @param extraction Its prepared extraction.
   * @return {Promise<void>} Settles when the walk has run or been skipped.
   */
  private async maybeEmitEarlySpatialPlates_(
      model: IfcStepModel,
      extraction: IfcGeometryExtraction ): Promise< void > {

    // Same choice the proxy's imposterCoordination() makes: the latched
    // preview frame when the open asked to coordinate, else identity.
    const coordination = this.coordinateToOrigin_ ?
      this.coordinationMatrix : IDENTITY_MAT4

    // This runs as a generation is BUILT, before that tick captures its
    // first product — and capture is the only thing that latches a
    // frame. So the first walk on a coordinating open always finds
    // `undefined` here and takes the walk's fallback derivation, which
    // its own docs describe as capable of a full site-offset on a file
    // that bakes absolute coordinates into vertices behind identity
    // placements. Waiting for a latched frame instead would put the
    // skeleton back behind the deferred-placement gate this whole change
    // exists to get in front of, so: emit now, and re-emit ONCE on a
    // later generation as soon as a real frame exists. That second
    // emission is exactly what the replace-by-expressID contract is for.
    const usingFallbackFrame = coordination === void 0
    const canImproveFrame =
      this.earlyPlatesUsedFallbackFrame_ && !usingFallbackFrame

    if ( this.earlyPlatesEmitted_ > 0 && !canImproveFrame ) {
      return
    }

    try {

      // Cheap prefix-sum reads, so this is affordable per generation.
      // No storeys or no aggregate chain means the walk would emit
      // nothing but still pay for the type scans. IfcProject and
      // IfcUnitAssignment are in the guard for a different reason:
      // `extractLinearScalingFactor` returns with the factor still at 1
      // when it cannot resolve the project's UnitsInContext (it only
      // logs), and a silent 1 on a millimetre model scales the whole
      // skeleton 1000x — the conway#515 symptom. The project alone is
      // not enough: a valid file may forward-reference its
      // IfcUnitAssignment, so a prefix can hold the project while the
      // units record is still ahead of the parse cursor, and because a
      // successful walk latches `earlyPlatesEmitted_`, mis-scaled early
      // plates would stand until the frame-improvement re-emit or the
      // post-parse refresh (Codex review on #519). The guard therefore
      // defers plates until the units record is indexed; a file with
      // genuinely no unit assignment never emits EARLY plates and is
      // covered by the end-of-parse walk instead.
      if ( model.typeCount( IfcProject ) < 1 ||
          model.typeCount( IfcUnitAssignment ) < 1 ||
          model.typeCount( IfcBuildingStorey ) < 1 ||
          model.typeCount( IfcRelAggregates ) < 1 ) {
        return
      }

      const emitted = await emitSpatialStructureImposters(
          model,
          this.onMesh_,
          coordination,
          extraction.getLinearScalingFactor() )

      if ( emitted > 0 ) {
        this.earlyPlatesEmitted_ = emitted
        this.earlyPlatesUsedFallbackFrame_ = usingFallbackFrame
      }
    } catch {
      // A failed early walk retries on the next generation; the
      // end-of-parse walk covers it regardless.
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
   *
   * @return {number} Meshes emitted by this pass.
   */
  private captureNewInstances_(): number {

    const active = this.generation_!

    if ( active === void 0 ) {
      return 0
    }

    const { extraction, capturedCounts } = active
    const scene = extraction.scene
    const seenThisPass = new Map< number, number >()

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
          getVertexCount(): number,
          normalize(): Vector3,
          clearReification?(): void,
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

      // Recenters the geometry buffer (side effect) and MEASURES the local
      // centre: normalize()'s own return value is (0,0,0) on the pinned
      // wasm, and its float32 reification goes stale across the shift —
      // which matters doubly here, since the vertexData copied out below
      // IS that reification (see geometry_recentre).
      const center = normalizeWithCentreF64( geometry.geometry )
      const geometryExpressID =
        active.model.getElementByLocalID( geometry.localID )?.expressID ??
        geometry.localID
      const geometryTransform = nativeTransform?.getValues()

      if ( this.coordinationMatrix === void 0 && this.coordinateToOrigin_ ) {
        this.coordinationMatrix = deriveCoordinationF64(
            geometryTransform,
            nativePt!,
            NORMALIZE_MAT_F64,
            extraction.getLinearScalingFactor() )
      }

      const coordination = this.coordinationMatrix ?? glmatrix.mat4.create()
      const newTransform =
        composeTransformF64( coordination, geometryTransform, center )

      this.reportLargeCoordinate_( newTransform, geometry.geometry )

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

      this.firstMeshMs_ ??= Date.now() - this.startedMs_

      this.onMesh_( payload )
      ++this.meshesEmitted_
      ++emitted

      if ( this.emittedBytes_ >= this.maxBytes ) {
        return emitted
      }
    }

    return emitted
  }


  /**
   * Report — once for the whole channel — that a preview placement escaped
   * LARGE_COORDINATE_BUDGET_M while COORDINATE_TO_ORIGIN was on.
   *
   * Latched because every payload on such a model is over budget; one line
   * is what makes a failed recentre visible in a load report instead of
   * only in the render.
   *
   * @param transform The composed placement about to be emitted.
   * @param geometry The geometry it draws — empty geometry is exempt (see
   * exceedsLargeCoordinateBudget).
   */
  private reportLargeCoordinate_(
      transform: ArrayLike< number >,
      geometry: { getVertexCount(): number } ): void {

    if ( this.largeCoordinateReported_ || !this.coordinateToOrigin_ ||
        !exceedsLargeCoordinateBudget( transform, geometry ) ) {
      return
    }

    this.largeCoordinateReported_ = true

    Logger.warning(
        `[preview] COORDINATE_TO_ORIGIN did not recentre this model: a ` +
        `placement is ${Math.round( placementMagnitudeM( transform ) )}m from ` +
        `the origin, past the ${LARGE_COORDINATE_BUDGET_M}m float32 budget. ` +
        `Expect visible jitter.` )
  }
}
