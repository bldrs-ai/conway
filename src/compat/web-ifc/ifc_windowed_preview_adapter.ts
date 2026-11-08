import IfcStepModel from '../../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import {
  IfcBuildingStorey,
  IfcProject,
  IfcRelAggregates,
  IfcUnitAssignment,
} from '../../ifc/ifc4_gen'
import { DanglingPlacementError } from '../../ifc/dangling_placement_error'
import { WindowedStepBufferProvider } from '../../step/step_buffer_provider'
import type { StepExternalByteStore } from '../../step/step_buffer_provider'
import { IDENTITY_MAT4 } from './coordination_f64'
import { emitSpatialStructureImposters } from './spatial_imposter'
import type { ConwayGeometry } from '../../index'
import type { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import {
  ifcPreviewExtraction,
  ifcPreviewGeneration,
  ifcPreviewProducts,
  PreviewAdoptionContext,
  PreviewMeshPayload,
  PreviewSchemaAdapter,
  StreamedPreviewChannel,
} from './streamed_preview_channel'


/* eslint-disable no-magic-numbers */

/**
 * Wall-clock budget per tick for the windowed IFC open: the retired
 * StorePreviewChannel's TICK_BUDGET_MS. That channel used to extract exactly
 * ONE product per tick, i.e. 2–7 products a second, which is why PSB's
 * preview arrived girder by girder where the resident path delivered
 * batches (conway#518).
 */
const WINDOWED_IFC_TICK_BUDGET_MS = 20

/**
 * Products one tick may attempt, whatever the clock says (the store
 * channel's TICK_MAX_ATTEMPTS).
 *
 * `deferDanglingPlacements` (Share#1744) defers any product whose placement
 * records the prefix does not hold yet, and some writers put the tail of a
 * placement chain toward the tail of the file — so early ticks meet long
 * runs of products that cannot extract. Each such attempt still pages
 * source through the windowed provider, so a run of them is not free; this
 * caps the run rather than letting the deadline be the only bound.
 *
 * Measured across the corpus in conway#542, it is the WRITER that decides
 * record order, not the authoring tool: files written by the ODA IFC SDK and
 * Tekla's exporter are strictly backward-referencing and never hit this
 * path, while DDS_IFC (Archicad's IFC add-on) and ST-DEVELOPER defer 100% of
 * products. On the Archicad files the last record in a chain to arrive is
 * always a LEAF — IfcDirection or IfcCartesianPoint — which is why a
 * head-only prefix cannot fix it however far it grows. The 398 MB Archicad
 * file is the worst: 531 of 532 attempts deferred, first mesh at 98.3% of
 * the file.
 */
const WINDOWED_IFC_MAX_ATTEMPTS_PER_TICK = 32

/**
 * The preview channel a windowed IFC open runs: the shared channel with the
 * windowed adapter, at the channel's own unit and byte caps. No cap of its
 * own: the windowed open used to stop at 512 units while every other open
 * ran to DEFAULT_MAX_PREVIEW_UNITS (conway#775), and the share-of-parse
 * bound is what limits the channel now. The open builds its channel here so
 * that one cap is what a test can pin.
 *
 * @param store The store the parse reads.
 * @param conwaywasm The geometry wasm wrapper.
 * @param sink The parse's live sink.
 * @param coordinateToOrigin COORDINATE_TO_ORIGIN.
 * @param onMesh The consumer.
 * @return {StreamedPreviewChannel} The channel.
 */
export function windowedIfcPreviewChannel(
    store: StepExternalByteStore,
    conwaywasm: ConwayGeometry,
    sink: ColumnarIndexSink< number >,
    coordinateToOrigin: boolean,
    onMesh: ( mesh: PreviewMeshPayload ) => void ):
    StreamedPreviewChannel< StepExternalByteStore > {

  return new StreamedPreviewChannel< StepExternalByteStore >(
      store, conwaywasm, sink, windowedIfcPreviewAdapter(), coordinateToOrigin, onMesh )
}

/**
 * IFC adapter for the windowed (store-backed) open: the resident adapter's
 * generation (ifcPreviewGeneration), over a prefix model that pages its
 * source from `store` through a provider of its own, plus the two things a
 * windowed source needs that a resident one does not.
 *
 * - **Residency per unit.** Before each product runs, its closure is paged
 *   in and pinned (`ensureResidentForProductExtract`); the pins drop once
 *   the product's instances are captured, so peak source residency stays
 *   the provider's LRU, not the file. A product whose residency fails is
 *   a deferral, classified exactly as a product that throws as it runs.
 * - **Spatial plates from a prefix generation** (conway#518), see
 *   {@link EarlySpatialPlates}.
 *
 * This replaces StorePreviewChannel, a separate 1,017-line channel that
 * duplicated the resident one's scheduling, retries and capture (conway#775).
 * What it carried over as behaviour is adapter data here: the tick budget,
 * the attempt cap and the unit cap.
 *
 * Ticked with StreamedPreviewChannel.maybeTickAsync and flushed with
 * flushAsync: its builds and units await the store.
 *
 * @return {PreviewSchemaAdapter} The adapter.
 */
export function windowedIfcPreviewAdapter():
    PreviewSchemaAdapter< StepExternalByteStore > & { readonly plates: EarlySpatialPlates } {

  const plates = new EarlySpatialPlates()

  return {
    tickBudgetMs: WINDOWED_IFC_TICK_BUDGET_MS,
    maxAttemptsPerTick: WINDOWED_IFC_MAX_ATTEMPTS_PER_TICK,
    plates,
    get earlyPlateCount() {
      return plates.emitted
    },
    async buildGeneration( store, conwaywasm, columns, wanted ) {

      const model = new IfcStepModel(
          void 0,
          columns as ConstructorParameters< typeof IfcStepModel >[ 1 ],
          new WindowedStepBufferProvider( store ) )

      const products = ifcPreviewProducts( model )

      // Asked before the prep is paged in, not after: on a windowed source
      // the prep's residency is the expensive part of a build.
      if ( products.length === 0 || wanted?.( products.length ) === false ) {
        return void 0
      }

      const extraction = ifcPreviewExtraction( conwaywasm, model )
      const prepPins = await extraction.ensureResidentForDemandPrep()

      try {
        extraction.prepareDemandExtraction( true )
      } finally {
        model.releaseSourceViews( prepPins )
        model.unpinLocalIDs( prepPins )
      }

      const unresident = new Set< number >()
      const generation = ifcPreviewGeneration( model, extraction, products, unresident )

      return {
        ...generation,
        // A spread copies the getter's value, not the getter: the factor
        // is read off the extraction each time, as the resident one is.
        get linearScalingFactor() {
          return extraction.getLinearScalingFactor()
        },
        prepareUnit: async ( ordinal ) => {

          const pins = new Set< number >()
          const leafSpans: { address: number, length: number }[] = []

          unresident.delete( ordinal )

          try {
            await extraction.ensureResidentForProductExtract(
                products[ ordinal ], pins, leafSpans )
          } catch ( error ) {
            // The same classification a throwing run gets: a product whose
            // closure reaches past the prefix is the one case worth a retry.
            unresident.add( ordinal )
            generation.recordDeferral( {
              ordinal,
              onPlacement: error instanceof DanglingPlacementError,
            } )
          }

          return () => {
            model.releaseSourceViews( pins )
            model.unpinLocalIDs( pins )

            for ( const span of leafSpans ) {
              model.unpinAddressRange( span.address, span.length )
            }
          }
        },
        onAdopted: ( context ) => plates.maybeEmit( model, extraction, context ),
      }
    },
  }
}

/**
 * Put the spatial skeleton up from a PREFIX generation, seconds into the
 * parse instead of after it (conway#518). Moved unchanged from the retired
 * StorePreviewChannel; its state lives here because it spans generations.
 *
 * The spatial records sit at the file head on Revit exports — on PSB
 * `IFCSITE` is record #211 — and a prefix generation is already everything
 * the walk needs: a columns snapshot over a windowed provider, with
 * `prepareDemandExtraction(true)` done, which is what makes
 * `getLinearScalingFactor()` report real units rather than 1. So the plates
 * can lead the first extracted product rather than trailing the whole parse.
 *
 * **Runs at most once successfully**, plus one re-emission once a real frame
 * exists (below). Retries are bounded without a counter: generations only
 * rebuild on an index doubling, so there are O(log records) of them.
 *
 * **The end-of-parse walk in the proxy is the refresh, not a duplicate.** It
 * re-emits the same expressIDs with contained-product samples the prefix did
 * not hold and under the frame the channel latched, and the consumer contract
 * is that an `aabb` payload REPLACES the prior plate for its expressID.
 *
 * **Known gap in that contract.** Replacement only reaches nodes the final
 * walk still emits, and `aabbMostlyEqual` can collapse a single-child wrapper
 * there that a prefix generation's degenerate boxes did not. Such a wrapper's
 * early plate lingers until Share tears the preview scenery down at load end.
 * Bounded (the wrapper chain is a handful of nodes), but real; closing it
 * needs a delete in the payload contract or an emit set the two walks agree
 * on.
 */
export class EarlySpatialPlates {

  /** Plates the last successful walk emitted; 0 until one succeeds. */
  public emitted = 0

  /**
   * Whether those plates were composed under the walk's own fallback frame
   * because no preview instance had latched one yet; they get one
   * re-emission once a real frame exists.
   */
  public usedFallbackFrame = false

  /**
   * Walk the prefix's spatial structure and emit its plates, if it is time.
   *
   * @param model The prefix model.
   * @param extraction Its prepared extraction.
   * @param context The channel's frame and consumer.
   * @return {Promise<void>} Settles when the walk has run or been skipped.
   */
  public async maybeEmit(
      model: IfcStepModel,
      extraction: IfcGeometryExtraction,
      context: PreviewAdoptionContext ): Promise< void > {

    // Same choice the proxy's imposterCoordination() makes: the latched
    // preview frame when the open asked to coordinate, else identity.
    const coordination = context.coordinateToOrigin ?
      context.coordinationMatrix : IDENTITY_MAT4

    // This runs as a generation is adopted, before its first product is
    // captured — and capture is the only thing that latches a frame. So the
    // first walk on a coordinating open always finds `undefined` here and
    // takes the walk's fallback derivation, which can be a full site-offset
    // out on a file that bakes absolute coordinates into vertices behind
    // identity placements. Waiting for a latched frame instead would put the
    // skeleton back behind the deferred-placement gate, so: emit now, and
    // re-emit ONCE on a later generation as soon as a real frame exists.
    const usingFallbackFrame = coordination === void 0
    const canImproveFrame = this.usedFallbackFrame && !usingFallbackFrame

    if ( this.emitted > 0 && !canImproveFrame ) {
      return
    }

    try {

      // Cheap prefix-sum reads. No storeys or no aggregate chain means the
      // walk would emit nothing but still pay for the type scans. IfcProject
      // and IfcUnitAssignment are here for a different reason:
      // `extractLinearScalingFactor` leaves the factor at 1 when it cannot
      // resolve the project's units, and a silent 1 on a millimetre model
      // scales the whole skeleton 1000x (conway#515). A valid file may
      // forward-reference its IfcUnitAssignment, so the plates wait until
      // the units record is indexed (codex on #519); a file with no unit
      // assignment at all gets its plates from the end-of-parse walk.
      if ( model.typeCount( IfcProject ) < 1 ||
          model.typeCount( IfcUnitAssignment ) < 1 ||
          model.typeCount( IfcBuildingStorey ) < 1 ||
          model.typeCount( IfcRelAggregates ) < 1 ) {
        return
      }

      const emitted = await emitSpatialStructureImposters(
          model,
          context.onMesh,
          coordination,
          extraction.getLinearScalingFactor() )

      if ( emitted > 0 ) {
        this.emitted = emitted
        this.usedFallbackFrame = usingFallbackFrame
      }
    } catch {
      // A failed early walk retries on the next generation; the end-of-parse
      // walk covers it regardless.
    }
  }
}
