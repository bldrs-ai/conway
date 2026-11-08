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
import { WindowedStepBufferProvider } from '../../step/step_buffer_provider'
import type { StepExternalByteStore } from '../../step/step_buffer_provider'
import { cursorIterator } from '../../indexing/cursor_utilities'
import { Vector3 } from '../../../dependencies/conway-geom'
import * as glmatrix from 'gl-matrix'
import {
  composeTransformF64,
  deriveCoordinationF64,
  LARGE_COORDINATE_BUDGET_M,
  NORMALIZE_MAT_F64,
} from './coordination_f64'
import {
  exceedsLargeCoordinateBudget,
  normalizeWithCentreF64,
  placementMagnitudeM,
} from './geometry_recentre'
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

/**
 * Wall-clock budget for the one tick {@link StreamedPreviewChannel.finishParse}
 * runs over the complete index, on top of building that generation.
 *
 * The same order as FLUSH_BUDGET_MS, and for the same
 * reason: it sits between the parse and the caller's next step (here the
 * index the consumer is waiting for), so it is paid in full by every load
 * that reaches it. Arty_Z7 is the case it exists for: Alibre writes every
 * CARTESIAN_POINT and DIRECTION after record ~700k of 1.04M, so every unit
 * of every prefix generation fails on a dangling reference and the
 * parse-time ticks cannot emit anything however long they run. This tick,
 * over the whole index, is that file's only preview before the durable
 * pump (Share engine-worker.md §11, "STEP previews").
 */
const FINISH_BUDGET_MS = 100

/**
 * Wall-clock budget for {@link StreamedPreviewChannel.flushAsync}, the one
 * async tick after a completed parse on the generation in hand. The retired
 * StorePreviewChannel's flush, with the same value (conway#775).
 */
const FLUSH_BUDGET_MS = 100

/**
 * Whether {@link StreamedPreviewChannel.finishParse} runs at all. Off until
 * conway#773: the tick's first unit pays the throwaway generation's lazy
 * extraction prep (#751), which no estimate sees and no tick preempts, and
 * measured on the corpus that put +0.5 s on Arty_Z7's open (time to index)
 * and +0.3 s on DSA2's, for previews landing about when the old first
 * durable mesh did. Turn it on once #773 makes the prep cheap. A mutable
 * object rather than a const so tests can run the tick (they restore it).
 */
export const PREVIEW_FINISH_PARSE = { enabled: false }

/**
 * The share of the parse's wall clock the preview channel may spend, all of
 * its work counted: generation builds (snapshot, prefix model, plan,
 * residency), ticks, and the parse-end tick or flush (conway#775 stage 1).
 *
 * Before this, only a tick's own units were budgeted (TICK_BUDGET_MS per
 * cadence interval). A generation build could not be, and a STEP parse
 * rebuilds about ten times (GENERATION_GROWTH_FACTOR from
 * FIRST_GENERATION_MIN_RECORDS), each over the whole index so far, so the
 * builds were the bulk of the cost.
 *
 * The bound is enforced, not just measured:
 * - a build runs only when its predicted cost (the last build's ms per
 *   record, times the records now) fits what the share has left;
 * - a tick's budget is cut to what is left.
 * The worst overrun is one mispredicted build or one unit, neither of which
 * can be preempted.
 *
 * Mutable so a test or a measurement can lift it (`Infinity`), as with
 * PREVIEW_FINISH_PARSE.
 */
export const PREVIEW_PARSE_SHARE = { share: 0.2 }

/**
 * What the channel may always spend, whatever the share allows: so the first
 * generation and its first tick fit before the share has accrued anything
 * (at 0.2 the share covers 100 ms only after half a second of parse). This
 * is what keeps the first preview where it was. PSB's first preview mesh
 * lands about 0.2–0.4 s into its parse in Share's worker path.
 */
const PREVIEW_SHARE_FLOOR_MS = 100

/**
 * Starting milliseconds per estimated face, for a generation that offers
 * {@link PreviewPrefixGeneration.unitFaceEstimate}, until the channel has
 * timed a unit of its own. Measured in Node over the complete index of
 * the 14 MB pinball driver board: 0.15 / 0.23 / 0.38 ms per face at
 * p10 / p50 / p90 of its units, and 1.17 for its PCB (603 faces, 0.70 s).
 * The p90 is the start, because the two errors are not symmetric: an
 * overestimate passes over a unit the budget could have afforded (the
 * durable pump draws it a moment later), an underestimate stalls the parse
 * or the index for as long as the unit takes.
 */
const INITIAL_MS_PER_FACE = 0.4

/** Weight of the newest timed unit in the learned ms-per-face rate. */
const MS_PER_FACE_LEARNING_RATE = 0.3

/** Don't build the first generation before this many top-level records —
 * below it the prefix rarely contains a placeable product. */
const FIRST_GENERATION_MIN_RECORDS = 1024

/** A new generation only when the index grew this much past the previous
 * snapshot (bounds snapshot copies to O(GROWTH/(GROWTH-1)) of the file). */
const GENERATION_GROWTH_FACTOR = 2.0

/**
 * Deferred units carried into the next generation for a second look.
 *
 * Once a twin of the retired StorePreviewChannel's queue; one queue since
 * conway#775. The defect it fixes: the
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

/**
 * Cap on units the preview channel ever extracts, the same for every open:
 * IFC and STEP, buffered and windowed. Preview generations are throwaway
 * extractions whose native geometry is not reclaimed until page teardown
 * (the shim never frees classic scenes either — see closeModel), so the cap
 * bounds that one-time cost.
 *
 * It is a backstop, not the budget. What limits a preview in practice is the
 * share-of-parse bound (PREVIEW_PARSE_SHARE), which stops all channel work
 * at a fraction of the parse whatever the cap. The windowed IFC open used to
 * stop at 512 units (StorePreviewChannel's cap); on PSB that froze the
 * build-up at 484 meshes by 75% of the parse while the buffered open of the
 * same file kept going to ~2,180. One cap makes the two opens of a file
 * build up alike (conway#775).
 */
export const DEFAULT_MAX_PREVIEW_UNITS = 4096

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
   * The placement's occurrence path, root to leaf (NAUO express ids, then a
   * body's own id where the body is individually addressable) — exactly
   * what the durable PlacedGeometry for the same placement carries, so a
   * pick on a preview mesh resolves to the occurrence it draws rather than
   * to every reuse of its part. Present on every AP214 payload; `[]` is a
   * root-level placement, which is NOT the same as absent (Share#2067's
   * `pathPresent`). Absent for IFC, whose elements are not occurrences.
   */
  occurrencePath?: number[]
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
   * exact tuple shape is schema-specific; the capture narrows it). A
   * schema with occurrence identity yields the occurrence path as a 6th
   * tuple element (AP214SceneBuilder.walkWithOccurrence); the capture
   * copies it onto the payload when present. */
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
   * Estimated faces under one unit, read before the unit runs — the only
   * view the channel has of a unit's cost before it pays it, since a tick
   * cannot preempt a unit once started. A unit whose estimate (converted
   * by the channel's learned ms-per-face) exceeds what is left of the tick
   * budget is passed over, not run; the durable pump renders it. Left
   * unset by adapters whose units are cheap and even (IFC products), which
   * then run exactly as before.
   *
   * @param ordinal The unit's ordinal.
   * @return {number | undefined} The estimate, or undefined when unknown.
   */
  unitFaceEstimate?( ordinal: number ): number | undefined

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
   * Make one unit's records resident before {@link runUnits} runs it, for a
   * prefix model whose source can only be read asynchronously (a windowed
   * IFC open over a Blob store, conway#775). Resolves to a release, called
   * once the unit has run. A unit whose residency fails is the adapter's to
   * record (as a deferral) and to skip in runUnits; prepareUnit itself
   * never rejects.
   *
   * Only the channel's async tick ({@link StreamedPreviewChannel.maybeTickAsync})
   * calls it. A generation that offers it must be ticked that way.
   *
   * @param ordinal The unit about to run.
   * @return {Promise<function(): void>} Releases what the call pinned.
   */
  prepareUnit?( ordinal: number ): Promise< () => void >

  /**
   * Called once, after the channel adopts this generation and before its
   * first unit runs, from the async tick only. The windowed IFC adapter puts
   * the spatial plates up from here (conway#518).
   *
   * @param context What the channel knows at adoption.
   * @return {Promise<void>} Settles when the hook is done.
   */
  onAdopted?( context: PreviewAdoptionContext ): Promise< void >

  /**
   * Free the generation's native geometry (payloads are copies, so a
   * retired generation holds nothing anyone can reference). Called by
   * the channel when a generation is replaced and at stop().
   */
  dispose(): void
}

/** What {@link PreviewPrefixGeneration.onAdopted} is told. */
export interface PreviewAdoptionContext {

  /** The frame the channel has latched so far, if any. */
  coordinationMatrix?: number[]

  /** The open's COORDINATE_TO_ORIGIN setting. */
  coordinateToOrigin: boolean

  /** The channel's consumer, for payloads the hook emits itself. */
  onMesh( mesh: PreviewMeshPayload ): void
}

/**
 * Builds throwaway prefix generations for one schema — the only piece of
 * the preview channel that knows what a "model" or a "unit" is.
 */
export interface PreviewSchemaAdapter<TSource = Uint8Array> {

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
   * Units one tick may attempt, whatever the clock says; unbounded when
   * unset. A windowed adapter sets it because every attempt pages source,
   * including the ones that go on to defer (conway#542; the store channel's
   * TICK_MAX_ATTEMPTS, conway#518).
   */
  readonly maxAttemptsPerTick?: number

  /** Wall-clock budget per tick, when the adapter needs other than the
   * channel's TICK_BUDGET_MS. */
  readonly tickBudgetMs?: number

  /** Spatial plates the adapter emitted from its prefix generations
   * (windowed IFC, conway#518); undefined for adapters that emit none. */
  readonly earlyPlateCount?: number

  /**
   * Build a generation over the given prefix columns.
   *
   * @param source The prefix source the channel was constructed with —
   * opaque to the channel. Today every caller hands the resident buffer;
   * a windowed open hands whatever its schema's prefix model reads
   * through, so one channel serves both.
   * @param conwaywasm The shared geometry wasm wrapper.
   * @param columns A prefix snapshot of the columnar index.
   * @param wanted Whether a generation of this many units would give the
   * channel anything to run; an adapter can ask it before paying for a
   * generation's preparation, and return undefined on false (the store
   * channel's pre-prep check, conway#542). Optional on both sides.
   * @return {PreviewPrefixGeneration | undefined} The generation, or
   * undefined when the prefix cannot build one yet (throw is also
   * tolerated — the channel retries on a later, larger prefix). A promise
   * of either from an adapter whose prefix model reads its source
   * asynchronously; such an adapter is ticked with the channel's async
   * tick only.
   */
  buildGeneration(
    source: TSource,
    conwaywasm: ConwayGeometry,
    columns: unknown,
    wanted?: ( unitCount: number ) => boolean,
  ): PreviewPrefixGeneration | undefined |
    Promise< PreviewPrefixGeneration | undefined >
}

/**
 * An adapter whose generations are built synchronously: every one whose
 * prefix model reads a resident buffer, or a store it can fault in
 * synchronously (the windowed AP214 open). Ticked inline.
 */
export type SyncPreviewSchemaAdapter< TSource = Uint8Array > =
  Omit< PreviewSchemaAdapter< TSource >, 'buildGeneration' > & {
    buildGeneration(
      source: TSource,
      conwaywasm: ConwayGeometry,
      columns: unknown,
      wanted?: ( unitCount: number ) => boolean,
    ): PreviewPrefixGeneration | undefined
  }

/**
 * IFC adapter: units are IfcProducts in localID order (stable across
 * prefix growth), extracted through the per-product demand seam.
 *
 * @return {PreviewSchemaAdapter} The adapter.
 */
export function ifcPreviewAdapter(): SyncPreviewSchemaAdapter {
  return {
    buildGeneration( data, conwaywasm, columns, wanted ) {

      const model = new IfcStepModel(
          data, columns as ConstructorParameters<typeof IfcStepModel>[1] )

      const products = ifcPreviewProducts( model )

      if ( products.length === 0 || wanted?.( products.length ) === false ) {
        return void 0
      }

      const extraction = ifcPreviewExtraction( conwaywasm, model )

      // Preview-only preparation: skip the relationship sweeps whose
      // entity materialization dominates per-generation cost.
      extraction.prepareDemandExtraction( true )

      return ifcPreviewGeneration( model, extraction, products )
    },
  }
}

/**
 * A prefix model's products, in dense parse order.
 *
 * Enumerated straight off the type index, with NO entity materialization: a
 * per-generation sweep of 50k+ product entities was a dominant channel cost
 * on PSB-class models.
 *
 * @param model The prefix model.
 * @return {number[]} Product localIDs.
 */
export function ifcPreviewProducts( model: IfcStepModel ): number[] {

  const products: number[] = []

  for ( const localID of cursorIterator(
      model.typeIndex.cursor( ...IfcProduct.query ) ) ) {
    products.push( localID )
  }

  return products
}

/**
 * The throwaway extraction an IFC prefix generation runs, configured for a
 * truncated prefix. Not yet prepared: a resident model prepares it at once,
 * a windowed one pages the prep's closure in first.
 *
 * @param conwaywasm The shared geometry wasm wrapper.
 * @param model The prefix model.
 * @return {IfcGeometryExtraction} The extraction.
 */
export function ifcPreviewExtraction(
    conwaywasm: ConwayGeometry, model: IfcStepModel ): IfcGeometryExtraction {

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
  // per-unit catch in runUnits already treats a throwing product as
  // not-yet-extractable; this makes a dangling placement throw like
  // any other unparsed forward reference. The classic-mode cursor
  // does not re-run passed units, so a deferred product sits out
  // the preview and the durable pump renders it — an empty slot,
  // never geometry at the wrong placement.
  extraction.deferDanglingPlacements = true

  return extraction
}

/**
 * An IFC prefix generation over a prepared extraction: units are the
 * products, in the order {@link ifcPreviewProducts} lists them. Shared by the
 * resident adapter and the windowed one (ifc_windowed_preview_adapter.ts),
 * which adds residency per unit on top.
 *
 * @param model The prefix model.
 * @param extraction Its prepared extraction.
 * @param products The products, as {@link ifcPreviewProducts} lists them.
 * @param skipped Ordinals a caller has already given up on (the windowed
 * adapter's failed residency), which runUnits passes over unrun.
 * @return {PreviewPrefixGeneration} The generation.
 */
export function ifcPreviewGeneration(
    model: IfcStepModel,
    extraction: IfcGeometryExtraction,
    products: number[],
    skipped?: Set< number > ): PreviewPrefixGeneration & {
      recordDeferral( deferral: PreviewDeferral ): void } {

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
        if ( skipped?.has( where ) === true ) {
          continue
        }
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
    recordDeferral: ( deferral ) => {
      deferrals.push( deferral )
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
 * Builds an AP214 prefix model over the channel's source — the one part of
 * the AP214 adapter that depends on whether the open is resident or
 * windowed.
 */
export type AP214PrefixModelFactory<TSource> =
  ( source: TSource, columns: ConstructorParameters<typeof AP214StepModel>[1] ) =>
    AP214StepModel

/**
 * The resident open's prefix model: the source buffer itself.
 *
 * @param data The resident source.
 * @param columns The prefix columns.
 * @return {AP214StepModel} The prefix model.
 */
export function residentAP214PrefixModel(
    data: Uint8Array,
    columns: ConstructorParameters<typeof AP214StepModel>[1] ): AP214StepModel {

  return new AP214StepModel( data, columns )
}

/**
 * The windowed open's prefix model (conway#757's store-backed open): the
 * same store the durable model reads, through a provider of its own, so the
 * generation faults its windows in synchronously exactly as the durable
 * extraction does (`StepExternalByteStore.readSync`). View tracking is on so
 * the adapter can drop what a unit captured once it has run, which is what
 * keeps a generation's residency to the provider's LRU rather than every
 * window its units touched.
 *
 * @param store The store the open parses.
 * @param columns The prefix columns.
 * @return {AP214StepModel} The prefix model.
 */
export function windowedAP214PrefixModel(
    store: StepExternalByteStore,
    columns: ConstructorParameters<typeof AP214StepModel>[1] ): AP214StepModel {

  const model = new AP214StepModel( void 0, columns, new WindowedStepBufferProvider( store ) )

  model.trackCapturedSourceViews = true

  return model
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
 * One adapter for both opens: `makeModel` is the only difference between a
 * resident and a windowed source, and a windowed model's captured views are
 * released after every unit.
 *
 * @param makeModel Builds the prefix model over the channel's source.
 * @return {PreviewSchemaAdapter} The adapter.
 */
export function ap214PreviewAdapter<TSource = Uint8Array>(
    makeModel: AP214PrefixModelFactory<TSource> =
    residentAP214PrefixModel as unknown as AP214PrefixModelFactory<TSource> ):
    SyncPreviewSchemaAdapter<TSource> {
  return {
    retryEmptyUnits: true,
    buildGeneration( source, conwaywasm, columns ) {

      const model = makeModel(
          source, columns as ConstructorParameters<typeof AP214StepModel>[1] )

      const extraction = new AP214GeometryExtraction( conwaywasm, model )

      // Prefix extractions hit dangling records by construction —
      // don't let their expected per-record errors flood the report
      // (Arty: 5k+ styled-item warnings across generations).
      extraction.quietRecoverableLogging = true

      // The extent walk waits for the first face a unit tessellates, rather
      // than running in every prefix plan (AP214GeometryExtraction
      // .eagerExtentWalk): the cost gate passes over most of a generation's
      // units, and a parse builds about ten generations.
      extraction.eagerExtentWalk = false

      extraction.prepareDemandExtraction()

      // Planning reads records all over the model; on a windowed prefix model
      // each read keeps a view of its 4 MiB window. Drop them here, and after
      // every estimate and every unit below: a unit the cost gate passes over
      // never runs, so releasing only after runUnits left an over-budget
      // generation pinning windows across the file, past the provider's cap
      // (codex on #772). No-ops on a resident model, which tracks none.
      model.releaseCapturedSourceViews()

      if ( extraction.demandUnitCount === 0 ) {
        return void 0
      }

      const scene = extraction.scene

      return {
        // walkWithOccurrence, not walk: the same nodes in the same order,
        // plus each one's occurrence path, which the payload carries.
        scene: { walk: () => scene.walkWithOccurrence() },
        unitCount: extraction.demandUnitCount,
        get linearScalingFactor() {
          return extraction.getLinearScalingFactor()
        },
        runUnits: ( from, count ) => {
          if ( extraction.demandUnitCursor < from ) {
            extraction.skipDemandUnits( from - extraction.demandUnitCursor )
          }
          const executed = extraction.extractDemandUnitBatch( count )

          // A windowed prefix model: drop the window views the unit captured
          // (a no-op on a resident one, which tracks none).
          model.releaseCapturedSourceViews()

          return executed
        },
        unitFaceEstimate: ( ordinal ) => {
          const faces = extraction.demandUnitFaceEstimate( ordinal )

          model.releaseCapturedSourceViews()

          return faces
        },
        geometryExpressID: ( geometryLocalID ) =>
          model.getElementByLocalID( geometryLocalID )?.expressID,
        recenter: false,
        dispose: () => {
          model.releaseCapturedSourceViews()
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
export class StreamedPreviewChannel<TSource = Uint8Array> {

  /** Coordination matrix pinned from the first captured instance, exactly
   * the derivation the durable capture would perform — the proxy adopts it
   * so preview and durable placements share one frame. */
  public coordinationMatrix?: number[]

  private stopped_ = false
  private timer_?: ReturnType<typeof setTimeout>

  private emittedUnits_ = 0
  /**
   * Preview meshes handed to `onMesh`. Tracked apart from
   * {@link emittedUnits_} because the two genuinely diverge: a unit can
   * place several meshes, and a unit with no representation extracts
   * cleanly while placing none. Reporting only units let the load log say
   * "no mesh, 20 emitted" about one load (codex round 2 on #543).
   */
  private meshesEmitted_ = 0
  private emittedBytes_ = 0

  /** Latch for the "recentre did not recentre" report — see
   * {@link reportLargeCoordinate_}. */
  private largeCoordinateReported_ = false

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

  /** Units passed over because their estimated cost exceeded what was left
   * of the tick budget (see PreviewPrefixGeneration.unitFaceEstimate). */
  private skippedForCost_ = 0

  /** Learned ms per estimated face (see INITIAL_MS_PER_FACE). */
  private msPerFace_ = INITIAL_MS_PER_FACE

  /** Ms from channel construction to the first payload handed to `onMesh`
   * — time-to-first-pixel, the number conway#542 exists to move. */
  private firstMeshMs_?: number

  private readonly startedMs_ = Date.now()

  /** Wall clock the channel has spent so far: builds, ticks, the parse-end
   * tick or flush (see PREVIEW_PARSE_SHARE). */
  private spentMs_ = 0

  /** The last two generation builds, as [records, ms] — the predictor for
   * the next one (see predictBuildMs_); empty before the first build. */
  private readonly builds_: [number, number][] = []

  /** affordsBuild_'s one-shot probe, armed until used (see there). */
  private probeArmed_ = true

  /** What the fit predicted for the build affordsBuild_ last let through;
   * undefined when the probe, or no prediction, let it through. */
  private admittedPredictionMs_?: number

  /** PREVIEW_PARSE_SHARE at construction. A field so a test can lift it the
   * way it lifts tickBudgetMs_. */
  private parseShare_ = PREVIEW_PARSE_SHARE.share

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
   * @param data The prefix source the parse is indexing, handed to the
   * adapter unread (the resident buffer, for every caller today).
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
      private readonly data: TSource,
      private readonly conwaywasm: ConwayGeometry,
      private readonly sink: ColumnarIndexSink<number>,
      private readonly adapter: PreviewSchemaAdapter<TSource>,
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
  private tickBudgetMs_ = this.adapter.tickBudgetMs ?? TICK_BUDGET_MS

  // Companion seam to tickBudgetMs_. Unbounded for a resident adapter: a
  // resident unit attempt pages nothing, so the wall clock is the only bound
  // worth paying for. A windowed adapter sets one (maxAttemptsPerTick),
  // because its attempts page source even when they defer. A test pins it so
  // "this tick left units unattempted" — which is what separates a
  // preemptive rebuild from an exhaustion one — is a fact rather than a race
  // against the budget.
  private tickMaxAttempts_ = this.adapter.maxAttemptsPerTick ?? Number.MAX_SAFE_INTEGER

  /** Why the last generation build produced nothing, for tests and
   * diagnosis; undefined after a build that was adopted. */
  public lastFailReason?: string

  /** An async tick is in flight (maybeTickAsync / flushAsync): the parse's
   * progress callback can fire again while one awaits residency. */
  private asyncTickInFlight_ = false

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
   * The async twin of {@link maybeTickInline}, for an adapter whose
   * generations page their source asynchronously (`prepareUnit`, a promised
   * `buildGeneration`): the windowed IFC open, whose parse awaits its
   * progress callback (conway#775, from the retired StorePreviewChannel).
   *
   * Same cadence, with one difference carried over from the store channel:
   * the interval decays only after a tick that attempted a unit. A tick that
   * found no generation (every tick through the opening seconds of a big
   * parse, before the index reaches firstGenerationMinRecords) used to decay
   * it anyway, so by the time there was anything to extract the cadence had
   * already cooled toward TICK_INTERVAL_MAX_MS.
   *
   * @return {Promise<void>} Settles when this tick's units are captured.
   */
  public async maybeTickAsync(): Promise< void > {

    if (this.stopped_ || this.capped || this.asyncTickInFlight_) {
      return
    }

    const now = Date.now()

    if (now - this.lastInlineTick_ < this.tickIntervalMs_) {
      return
    }

    this.lastInlineTick_ = now

    try {
      if ((await this.tickAsync_(this.tickBudgetMs_)) > 0) {
        this.tickIntervalMs_ =
          Math.min(this.tickIntervalMs_ * TICK_INTERVAL_GROWTH, TICK_INTERVAL_MAX_MS)
      }
    } catch {
      // A preview failure must never break the open.
      this.stopped_ = true
    }
  }

  /**
   * After a completed parse: one last async tick of FLUSH_BUDGET_MS on the
   * generation in hand, so a small file (or a prefix that never crossed a
   * progress tick) still emits placed meshes before the open returns. The
   * store channel's flush (conway#775). A schema whose unit list is fixed
   * (`retryEmptyUnits`) takes {@link finishParse} instead.
   *
   * @return {Promise<void>} Settles when the flush ends.
   */
  public async flushAsync(): Promise< void > {

    if (this.stopped_ || this.capped || this.asyncTickInFlight_ ||
        this.adapter.retryEmptyUnits === true) {
      return
    }

    try {
      // The clock is the flush's only bound, as it was the store channel's:
      // the per-tick attempt cap paces ticks that share the thread with a
      // running parse, and this one runs after the parse.
      await this.tickAsync_(FLUSH_BUDGET_MS, Number.MAX_SAFE_INTEGER)
    } catch {
      this.stopped_ = true
    }
  }

  /**
   * Test seam: async ticks until the sink's current units are exhausted or
   * a cap is hit, without the cadence or the clock.
   *
   * @return {Promise<void>} Settles when idle.
   */
  public async drainForTestAsync(): Promise< void > {

    for (; ;) {
      if (this.capped ||
          (await this.tickAsync_(Number.MAX_SAFE_INTEGER, 1, false)) === 0) {
        return
      }
    }
  }

  /** Units the current generation lists (test seam; 0 without one). */
  public get productCount(): number {
    return this.generation_?.generation.unitCount ?? 0
  }

  /** Spatial plates the adapter emitted from prefix generations. */
  public get earlyPlateCount(): number {
    return this.adapter.earlyPlateCount ?? 0
  }

  /**
   * One async tick: ensure a generation, then attempt units until the budget
   * or the attempt cap runs out, making each unit resident first. Classic
   * mode only: the fixed-unit-list schema (AP214) reads its windowed source
   * synchronously and ticks inline.
   *
   * Each unit's instances are captured before its residency is released:
   * capture reads the entities it names, which a windowed source can only
   * serve while they are pinned.
   *
   * @param budgetMs Wall clock for this tick.
   * @param maxAttempts Attempts for this tick, at most.
   * @return {Promise<number>} Units attempted.
   */
  private async tickAsync_(
      budgetMs: number,
      maxAttempts: number = this.tickMaxAttempts_,
      bounded: boolean = true ): Promise< number > {

    this.asyncTickInFlight_ = true

    const startedMs = Date.now()

    try {
      const deadline = Date.now() +
        (bounded ? Math.min(budgetMs, this.shareLeftMs_()) : budgetMs)
      const before = this.generation_?.generation

      if (!(await this.ensureGenerationAsync_())) {
        return 0
      }

      const { generation } = this.generation_!

      // A generation built this tick runs at least one unit, even when the
      // build itself used up the deadline or the share: the build is already
      // paid for, and a windowed first build can cost more than the 100 ms
      // floor on its own (residency, prep), which would otherwise leave the
      // first preview to whenever the share recovers, on a short parse
      // never (codex on conway#777). One unit is the retired store
      // channel's guarantee, which attempted a product on every tick. The
      // unit's time is charged like any other, so later ticks wait for it.
      const builtNow = generation !== before

      let attempts = 0

      while (this.generation_?.generation === generation &&
          this.hasPendingUnits_(generation) &&
          this.emittedUnits_ < this.maxUnits &&
          !this.capped &&
          attempts < maxAttempts &&
          (Date.now() < deadline || (builtNow && attempts === 0))) {

        ++attempts

        const ordinal = this.nextClassicOrdinal_()
        const release = await generation.prepareUnit?.(ordinal)

        try {
          const executed = generation.runUnits(ordinal, 1)

          this.drainDeferrals_(generation)

          if (executed > 0) {
            this.captureNewInstances_()
            this.emittedUnits_ += executed
          }
        } finally {
          release?.()
        }
      }

      return attempts
    } finally {
      this.spentMs_ += Date.now() - startedMs
      this.asyncTickInFlight_ = false
    }
  }

  /**
   * The next classic-mode ordinal: a queued retry first (they are the units
   * the index has most recently become able to place, and cheaper than a
   * fresh attempt whichever way they go), else the forward cursor.
   *
   * @return {number} The ordinal to attempt.
   */
  private nextClassicOrdinal_(): number {

    const isRetry = this.retryCursor_ < this.retryQueue_.length

    if (isRetry) {
      ++this.retriedUnits_
      return this.retryQueue_[this.retryCursor_++]
    }

    return this.unitOrdinal_++
  }

  /**
   * The parse has COMPLETED: give a fixed-unit-list schema (the adapter's
   * `retryEmptyUnits`, i.e. AP214) one last generation over the whole index
   * and one tick of {@link FINISH_BUDGET_MS} on it, before {@link stop}.
   *
   * It is the last retry those semantics already promise — "re-run units
   * that captured nothing against each richer generation" — taken at the
   * one generation the growth gate would otherwise never build, the
   * complete one. A STEP parse is short (0.4–2 s against 2–31 s of
   * geometry on the corpus), so the parse-time ticks are few, and a file
   * written leaf-at-tail (Arty_Z7) cannot place anything from any prefix;
   * without this tick neither puts a preview on screen before the durable
   * pump.
   *
   * Off by default ({@link PREVIEW_FINISH_PARSE}, conway#773), and skipped
   * when the parse-time ticks already put a mesh on screen (see the guard
   * below for what the tick costs). A no-op for other adapters: an
   * IFC product list grows with the parse,
   * and rebuilding PSB-class indexes costs ~700 ms a generation — the
   * store path's own end-of-parse pass is its spatial plates, not this.
   * Call only on a parse that completed; on a failed one call stop() only.
   */
  public finishParse(): void {

    // Only for a parse that put nothing on screen. The tick's first unit pays
    // the throwaway generation's lazy extraction prep (#751), which a
    // per-face estimate cannot see and a tick cannot preempt: 0.2–0.5 s on
    // the 58 and 111 MB corpus models, before the index. Where the parse's
    // own ticks already delivered (DSA2, the pinball board) that buys a few
    // more meshes twice over; where they delivered nothing (Arty_Z7's
    // tail-written points) it is the only preview the load gets.
    if (!PREVIEW_FINISH_PARSE.enabled ||
        this.stopped_ || this.capped || this.adapter.retryEmptyUnits !== true ||
        this.meshesEmitted_ > 0) {
      return
    }

    try {
      const startedMs = Date.now()
      let ready: boolean

      try {
        ready = this.ensureGeneration_(true)
      } finally {
        this.spentMs_ += Date.now() - startedMs
      }

      if (ready) {
        this.tick_(FINISH_BUDGET_MS)
      }
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
   * emitted. `meshes` counts what actually reached the consumer, `emitted`
   * counts the units extraction accepted — a unit can place several meshes
   * and a unit with no representation places none, so the line reports
   * both. `deferred` counts units a tick attempted and could not
   * extract, `deferredOnPlacement` the subset waiting on a placement chain
   * the prefix does not hold, and `retried` the attempts that were second
   * looks at an earlier deferral — a retry path that has silently stopped
   * firing shows up here rather than merely as a slower load. `overBudget`
   * counts units passed over unrun because their estimated cost exceeded
   * the tick's remaining budget.
   *
   * One shape for every open, resident or windowed, so all
   * paths render through one formatter (core/progress_log).
   *
   * @return {object} `{firstMeshMs, meshes, emitted, deferred,
   * deferredOnPlacement, retried}`
   */
  public get previewYield(): {
    firstMeshMs?: number, meshes: number, emitted: number, deferred: number,
    deferredOnPlacement: number, retried: number, overBudget: number,
    channelMs: number } {

    return {
      firstMeshMs: this.firstMeshMs_,
      meshes: this.meshesEmitted_,
      emitted: this.emittedUnits_,
      deferred: this.deferredUnits_,
      deferredOnPlacement: this.deferredOnPlacement_,
      retried: this.retriedUnits_,
      overBudget: this.skippedForCost_,
      channelMs: this.spentMs_,
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
  private tick_(budgetMs: number = this.tickBudgetMs_): void {

    const startedMs = Date.now()

    try {
      this.tickBody_(Math.min(budgetMs, this.shareLeftMs_()))
    } finally {
      this.spentMs_ += Date.now() - startedMs
    }
  }

  /**
   * What the share (PREVIEW_PARSE_SHARE) still allows the channel to spend:
   * the larger of the floor and the share of the wall clock since the parse
   * started, less what it has spent.
   *
   * @return {number} Milliseconds, possibly negative.
   */
  private shareLeftMs_(): number {

    // A lifted share is unbounded at every instant, including the first
    // millisecond, where Infinity * 0 would be NaN and refuse everything.
    if (this.parseShare_ === Infinity) {
      return Infinity
    }

    const allowed = Math.max(
        PREVIEW_SHARE_FLOOR_MS, this.parseShare_ * (Date.now() - this.startedMs_))

    return allowed - this.spentMs_
  }

  /**
   * Whether a generation build over `records` records is predicted to fit
   * what the share has left. The first build is always allowed: there is
   * nothing to predict from, and it is the cheapest one
   * (FIRST_GENERATION_MIN_RECORDS).
   *
   * Every caller asks only when the build is needed: there is no active
   * generation, or it is exhausted, or its deferrals want a longer index.
   *
   * The fit (predictBuildMs_) decides. When it refuses, one probe may still
   * let a build through, priced at the cheapest rate an actual build has run
   * at. That is for a fit spoiled by one transiently slow build: fitted
   * through two samples, 10 ms at 1k records then 1,000 ms at 2k prices 4k
   * at 2,980 ms, and only a build replaces a sample, so without the probe
   * the channel would never build again and its retry queue would be
   * stranded (codex on conway#777, round 1). Clamping the slope would not
   * recover it: the outlier is also the fit's intercept.
   *
   * The probe is one-shot. It re-arms only when a build the FIT let through
   * comes in at or under its prediction, i.e. once the fit is trustworthy
   * again, which it is after an isolated outlier. It does not re-arm while
   * costs grow faster than the fit expects (k·r² builds, codex round 2),
   * where a standing cheap-rate minimum would underprice every build by 4×
   * at each doubling. So the probe adds at most one underpriced build per
   * stretch of mispredicting fit, and on growing costs one over the whole
   * parse. Its time is charged like any build's, so later builds wait for
   * the share to cover it.
   *
   * @param records The records the build would snapshot.
   * @return {boolean} True to build.
   */
  private affordsBuild_(records: number): boolean {

    if (this.builds_.length === 0) {
      this.admittedPredictionMs_ = void 0
      return true
    }

    const leftMs = this.shareLeftMs_()
    const predictedMs = this.predictBuildMs_(records)

    if (predictedMs <= leftMs) {
      this.admittedPredictionMs_ = predictedMs
      return true
    }

    if (this.probeArmed_ && this.cheapestBuildRateMs_() * records <= leftMs) {
      this.probeArmed_ = false
      this.admittedPredictionMs_ = void 0
      return true
    }

    return false
  }

  /**
   * The cheapest cost per record any kept build ran at; Infinity with none
   * that had records.
   *
   * @return {number} Milliseconds per record.
   */
  private cheapestBuildRateMs_(): number {

    let rate = Infinity

    for (const [ count, ms ] of this.builds_) {
      if (count > 0) {
        rate = Math.min(rate, ms / count)
      }
    }

    return rate
  }

  /**
   * Predicted cost of a generation build over `records` records: a fixed
   * part plus a part per record, fitted through the last two builds.
   *
   * Not the last build's cost per record. A build's cost is mostly fixed
   * while the prefix is small (a prefix model, an extraction, a plan, the
   * windowed prep's residency), so a per-record rate taken off the first
   * build at FIRST_GENERATION_MIN_RECORDS extrapolates absurdly: measured
   * on PSB in Share's worker path, a first build of ~1k records priced the
   * next one, over the index the parse had reached by then, at more than
   * the whole parse, and the channel never built again (137 meshes, where
   * the unbounded channel made 484).
   *
   * With one build there is nothing to fit: the next is predicted to cost
   * the same, and if it does not, the misprediction is one build, which the
   * share's doc already allows for. The per-record part is never taken as
   * negative (a second build cheaper than the first is noise, not a
   * discount).
   *
   * An outlier build can spoil the fit; affordsBuild_'s probe is how it
   * recovers.
   *
   * @param records The records the build would snapshot.
   * @return {number} Milliseconds.
   */
  private predictBuildMs_(records: number): number {

    const [ first, last ] = this.builds_.length === 1 ?
      [ this.builds_[0], this.builds_[0] ] : this.builds_

    const [ lastRecords, lastMs ] = last
    const perRecord = last[0] > first[0] ?
      Math.max(0, (last[1] - first[1]) / (last[0] - first[0])) : 0
    return lastMs + perRecord * Math.max(0, records - lastRecords)
  }

  /**
   * Fold one generation build's cost into the predictor.
   *
   * @param records The records it snapshotted.
   * @param startedMs When it started (Date.now()).
   */
  private timeBuild_(records: number, startedMs: number): void {

    const ms = Date.now() - startedMs

    // The fit was right about a build it let through: re-arm the probe
    // (see affordsBuild_).
    if (this.admittedPredictionMs_ !== void 0 && ms <= this.admittedPredictionMs_) {
      this.probeArmed_ = true
    }

    this.admittedPredictionMs_ = void 0
    this.builds_.push([ records, ms ])

    if (this.builds_.length > 2) {
      this.builds_.shift()
    }
  }

  // eslint-disable-next-line require-jsdoc
  private tickBody_(budgetMs: number): void {

    const deadline = Date.now() + budgetMs
    const before = this.generation_?.generation

    if (!this.ensureGeneration_()) {
      return
    }

    const active = this.generation_!
    const { generation } = active
    // See tickAsync_: a generation built this tick runs one unit, whatever
    // the build left of the deadline.
    const builtNow = generation !== before

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

        if (this.overBudget_(generation, ordinal, deadline)) {
          ++this.skippedForCost_
          continue
        }

        ++attempts

        const startedMs = Date.now()
        const executed = generation.runUnits(ordinal, 1)
        const elapsedMs = Date.now() - startedMs

        if (executed > 0 && this.captureNewInstances_() > 0) {
          this.learnUnitCost_(generation, ordinal, elapsedMs)
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
        (Date.now() < deadline || (builtNow && attempts === 0))) {

      ++attempts

      extractedThisTick += generation.runUnits(this.nextClassicOrdinal_(), 1)
      this.drainDeferrals_(generation)
    }

    if (extractedThisTick > 0) {
      this.captureNewInstances_()
      this.emittedUnits_ += extractedThisTick
    }
  }

  /**
   * Whether a unit's estimated cost is more than the tick has left — the
   * pass-over test for generations that can estimate (AP214). False for a
   * generation without {@link PreviewPrefixGeneration.unitFaceEstimate},
   * and for a unit it cannot estimate, which keeps every other schema on
   * the old run-it-and-see behaviour.
   *
   * @param generation The active generation.
   * @param ordinal The unit about to run.
   * @param deadline The tick's wall-clock deadline (Date.now() ms).
   * @return {boolean} True to pass the unit over.
   */
  private overBudget_(
      generation: PreviewPrefixGeneration,
      ordinal: number,
      deadline: number): boolean {

    const faces = generation.unitFaceEstimate?.(ordinal)

    if (faces === void 0) {
      return false
    }

    return faces * this.msPerFace_ > deadline - Date.now()
  }

  /**
   * Fold one timed unit into the ms-per-face rate. Only units that place
   * geometry teach it: a unit that failed on a dangling reference (every
   * unit of a tail-written prefix) costs nothing per face, and learning
   * from it would talk the channel into running the expensive ones.
   *
   * @param generation The generation that ran it.
   * @param ordinal The unit.
   * @param elapsedMs How long runUnits took.
   */
  private learnUnitCost_(
      generation: PreviewPrefixGeneration,
      ordinal: number,
      elapsedMs: number): void {

    const faces = generation.unitFaceEstimate?.(ordinal)

    if (faces === void 0 || faces === 0 || elapsedMs <= 0) {
      return
    }

    this.msPerFace_ +=
      MS_PER_FACE_LEARNING_RATE * (elapsedMs / faces - this.msPerFace_)
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
   * @param complete The parse has completed ({@link finishParse}): build
   * over the whole index unless the active generation already is one,
   * bypassing the growth gates, which exist to pace rebuilds DURING a
   * parse.
   * @return {boolean} True when a generation with pending units exists.
   */
  private ensureGeneration_(complete: boolean = false): boolean {

    const decision = this.generationDecision_(complete)

    return decision === 'build' ?
      this.adoptGeneration_(this.sink.topLevelCount) : decision
  }

  /**
   * {@link ensureGeneration_} for the async tick: the same decision, with a
   * build that may be promised, and the adoption hook run before the first
   * unit.
   *
   * @return {Promise<boolean>} True when a generation with pending units
   * exists.
   */
  private async ensureGenerationAsync_(): Promise< boolean > {

    const decision = this.generationDecision_(false)

    if (decision !== 'build') {
      return decision
    }

    const records = this.sink.topLevelCount
    const active = this.generation_
    const buildStartedMs = Date.now()
    let generation: PreviewPrefixGeneration | undefined

    try {
      generation = await this.adapter.buildGeneration(
          this.data, this.conwaywasm, this.sink.snapshot(),
          ( unitCount ) => this.wantsGeneration_(unitCount))
    } catch (error) {
      this.timeBuild_(records, buildStartedMs)
      return this.buildFailed_(records, error)
    }

    this.timeBuild_(records, buildStartedMs)

    if (!this.adoptBuilt_(records, active, generation)) {
      return false
    }

    try {
      await generation!.onAdopted?.({
        coordinationMatrix: this.coordinationMatrix,
        coordinateToOrigin: this.coordinateToOrigin,
        onMesh: this.onMesh,
      })
    } catch {
      // A hook is decoration; the generation's units still run.
    }

    return true
  }

  /**
   * The decision behind {@link ensureGeneration_} and its async twin: keep
   * the active generation (true), have none to run (false), or build one.
   *
   * @param complete See {@link ensureGeneration_}.
   * @return {boolean | 'build'} The decision.
   */
  private generationDecision_(complete: boolean): boolean | 'build' {

    const active = this.generation_
    const records = this.sink.topLevelCount

    if (complete) {

      if (active !== void 0 && this.lastSnapshotRecords_ === records) {
        return this.hasPendingUnits_(active.generation)
      }

      return records > 0 && this.affordsBuild_(records) ? 'build' : false
    }

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

    // Past every gate but the share (PREVIEW_PARSE_SHARE): a build the share
    // cannot afford waits, and the active generation, if any, carries on.
    if (!this.affordsBuild_(records)) {
      return active !== void 0 && this.hasPendingUnits_(active.generation)
    }

    return 'build'
  }

  /**
   * Snapshot the sink, build a generation over it, and make it the active
   * one if it has anything to run — the rebuild half of
   * {@link ensureGeneration_}, whichever gate decided to rebuild.
   *
   * @param records The sink's top-level count at the decision.
   * @return {boolean} True when the new generation was adopted.
   */
  private adoptGeneration_(records: number): boolean {

    const active = this.generation_
    const buildStartedMs = Date.now()
    const columns = this.sink.snapshot()

    let built: ReturnType< PreviewSchemaAdapter<TSource>[ 'buildGeneration' ] >

    try {
      built = this.adapter.buildGeneration(
          this.data, this.conwaywasm, columns,
          ( unitCount ) => this.wantsGeneration_(unitCount))
    } catch (error) {
      this.timeBuild_(records, buildStartedMs)
      return this.buildFailed_(records, error)
    }

    this.timeBuild_(records, buildStartedMs)

    if (built instanceof Promise) {
      // An async adapter ticked synchronously: a wiring error, not a prefix
      // problem. Free whatever it builds, and count it as a failed build so
      // the growth gate paces the retries.
      built.then((late) => late?.dispose(), () => void 0)
      return this.buildFailed_(records, new Error('async adapter on a sync tick'))
    }

    return this.adoptBuilt_(records, active, built)
  }

  /**
   * Record a generation build that threw. A mid-parse prefix can be
   * structurally incomplete — dangling references throw schema-typed errors
   * (AP214's assembly-tree prep especially; a bad prefix killed the whole
   * STEP preview before the catch that calls this). That retires THIS
   * attempt, not the channel: the growth gate retries once the index has
   * grown enough for a materially different prefix.
   *
   * @param records The sink's top-level count at the decision.
   * @param error What the build threw.
   * @return {boolean} Always false: no generation was adopted.
   */
  private buildFailed_(records: number, error: unknown): false {

    this.lastFailedSnapshotRecords_ = records
    this.lastFailReason = error instanceof Error ? error.message : String(error)

    return false
  }

  /**
   * Whether a generation of `unitCount` units would give this channel
   * anything to run. What {@link adoptBuilt_} checks after a build, offered
   * to the adapter beforehand so it can skip the preparation of one that
   * would be disposed unread.
   *
   * A generation that adds no new units is still worth building when
   * deferred ones are waiting: what changed is the INDEX behind them,
   * which is the only reason a retry could now succeed.
   *
   * @param unitCount The prospective generation's units.
   * @return {boolean} True when it is worth building.
   */
  private wantsGeneration_(unitCount: number): boolean {

    return this.adapter.retryEmptyUnits === true ?
      unitCount > 0 && this.completedUnits_.size < unitCount :
      unitCount > this.unitOrdinal_ || this.deferredForRetry_.length > 0
  }

  /**
   * Make a built generation the active one if it has anything to run —
   * the bookkeeping half of a rebuild, shared by the sync and async ticks.
   *
   * @param records The sink's top-level count at the decision.
   * @param active The generation active when the build started.
   * @param generation What the adapter built.
   * @return {boolean} True when it was adopted.
   */
  private adoptBuilt_(
      records: number,
      active: { generation: PreviewPrefixGeneration } | undefined,
      generation: PreviewPrefixGeneration | undefined): boolean {

    this.lastFailedSnapshotRecords_ = 0
    this.lastSnapshotRecords_ = records

    if (generation === void 0) {
      // Prefix grew but cannot build yet — wait for more records.
      this.lastFailReason = `no generation in ${records} records`
      return false
    }

    // See wantsGeneration_ for when a generation is worth keeping.
    if (!this.wantsGeneration_(generation.unitCount)) {
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
    this.lastFailReason = void 0

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
      // Present only from a scene that walks with occurrence identity
      // (AP214's walkWithOccurrence); IFC's 5-tuple leaves it undefined.
      ( readonly number[] | undefined )?,
    ]

    for (const walked of scene.walk()) {

      const [, nativeTransform, geometry, material, entity, occurrencePath] =
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

      // Recenters the geometry buffer (side effect) and MEASURES the local
      // centre; only the per-leaf recenter path (IFC) applies it — AP214
      // shares one buffer and composes bare (issue #308). normalize()'s own
      // return value is (0,0,0) on the pinned wasm and its float32
      // reification goes stale across the shift, which is why this goes
      // through geometry_recentre rather than calling it directly: the
      // vertexData copied out below is that reification.
      const center =
        recenter ? normalizeWithCentreF64(geometry.geometry) : undefined

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

      this.reportLargeCoordinate_(newTransform, geometry.geometry)

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

      // A copy: the scene node's array belongs to the throwaway generation,
      // and a consumer across a worker boundary clones it anyway. Kept even
      // when empty — a root-level placement's `[]` is information.
      if (occurrencePath !== void 0) {
        payload.occurrencePath = Array.from(occurrencePath)
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
      ++this.meshesEmitted_
      ++emitted

      if (this.emittedBytes_ >= this.maxBytes) {
        return emitted
      }
    }

    return emitted
  }

  /**
   * Report — once for the whole channel — that a preview placement escaped
   * LARGE_COORDINATE_BUDGET_M while COORDINATE_TO_ORIGIN was on.
   *
   * The preview is the first thing a user sees, so a frame that failed to
   * recentre shows up here before the durable walk gets anywhere near it.
   * Latched because every payload on such a model is over budget.
   *
   * @param transform The composed placement about to be emitted.
   * @param geometry The geometry it draws — empty geometry is exempt (see
   * exceedsLargeCoordinateBudget).
   */
  private reportLargeCoordinate_(
      transform: ArrayLike<number>,
      geometry: { getVertexCount(): number }): void {

    if (this.largeCoordinateReported_ || !this.coordinateToOrigin ||
        !exceedsLargeCoordinateBudget(transform, geometry)) {
      return
    }

    this.largeCoordinateReported_ = true

    Logger.warning(
        `[preview] COORDINATE_TO_ORIGIN did not recentre this model: a ` +
        `placement is ${Math.round(placementMagnitudeM(transform))}m from ` +
        `the origin, past the ${LARGE_COORDINATE_BUDGET_M}m float32 budget. ` +
        `Expect visible jitter.`)
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
