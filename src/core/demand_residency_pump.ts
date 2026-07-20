import { DemandGeometryQueue } from './demand_geometry_queue'


/**
 * The async half of demand-driven geometry (Phase B): source-byte residency.
 *
 * Extraction is synchronous by design (the wasm extract reads source bytes
 * through `StepBufferProvider.acquire`), but a windowed/streamed source pages
 * bytes in asynchronously (`ensureResident`). This pump owns that seam: it
 * admits demand, prefetches the source ranges for the most-wanted products,
 * and only then forwards them to the synchronous {@link DemandGeometryQueue}
 * — so a `pump()` never hits a non-resident range mid-extract.
 */
export interface ResidencyPrefetcher {

  /**
   * Page in the source byte ranges a product's extraction will read.
   * `StepModelBase.ensureResidentByLocalID` satisfies this shape.
   *
   * @param localID The product's local ID.
   * @return {Promise<void>} Resolves when resident.
   */
  ensureResidentByLocalID( localID: number ): Promise<void>
}


/** Outcome of one pump cycle, for telemetry and tests. */
export interface PumpResult {

  /** Tiles extracted this cycle (from the queue's pump). */
  extracted: number

  /** Products whose prefetch failed this cycle (re-queued for retry). */
  prefetchFailures: number
}


// Defaults chosen for frame-cooperative pumping: enough per cycle to fill
// quickly, small enough that a cycle stays well under a frame budget once
// extraction costs are real. Both are tunable per call site.
const DEFAULT_BATCH = 32


/**
 * Admission + prefetch orchestration in front of a {@link DemandGeometryQueue}.
 *
 * Consumers `request()` products as demand changes (the pump owns admission —
 * don't request on the queue directly); each async `pump()` cycle:
 *
 *  1. selects the top-priority pending batch,
 *  2. awaits source residency for the batch (failures re-queue for retry
 *     and are reported, never thrown — one bad range must not stall the
 *     viewport),
 *  3. forwards the resident products to the queue and runs its synchronous
 *     pump under the same batch cap.
 *
 * Re-entrant calls coalesce: a `pump()` while one is in flight returns the
 * in-flight cycle's promise rather than interleaving prefetch batches.
 * Products already resident in the queue skip prefetch entirely (their
 * ranking refresh is forwarded immediately).
 */
export class DemandResidencyPump {

  /** Pending admission: product localID → highest requested priority. */
  private readonly pending_ = new Map<number, number>()

  private inFlight_: Promise<PumpResult> | undefined

  /**
   * @param queue_ The synchronous demand queue (extraction + budget).
   * @param prefetcher_ Source-byte residency (the model / buffer provider).
   * @param batch_ Max products prefetched + extracted per pump cycle.
   */
  constructor(
    private readonly queue_: DemandGeometryQueue,
    private readonly prefetcher_: ResidencyPrefetcher,
    private readonly batch_: number = DEFAULT_BATCH ) {

    if ( batch_ < 1 ) {
      throw new Error( `Invalid batch ${batch_}` )
    }
  }

  /**
   * Request a product at a demand priority. Resident products forward
   * immediately (ranking refresh); others queue for the next pump cycle at
   * the highest priority requested so far.
   *
   * @param productLocalID The product to materialise.
   * @param priority The demand priority (higher = more wanted).
   */
  public request( productLocalID: number, priority: number ): void {

    if ( this.queue_.isResident( productLocalID ) ) {
      this.queue_.request( productLocalID, priority )
      return
    }

    const existing = this.pending_.get( productLocalID )

    this.pending_.set(
        productLocalID,
        existing === void 0 ? priority : Math.max( existing, priority ) )
  }

  /**
   * @return {number} Products awaiting admission (not yet prefetched).
   */
  public get pendingCount(): number {
    return this.pending_.size
  }

  /**
   * Run one admission cycle (see class docs). Coalesces with an in-flight
   * cycle.
   *
   * @return {Promise<PumpResult>} The cycle's outcome.
   */
  public pump(): Promise<PumpResult> {

    if ( this.inFlight_ !== void 0 ) {
      return this.inFlight_
    }

    this.inFlight_ = this.pumpCycle_().finally( () => {
      this.inFlight_ = void 0
    } )

    return this.inFlight_
  }

  /**
   * One cycle: select top batch → prefetch → forward + queue pump.
   *
   * @return {Promise<PumpResult>} The cycle's outcome.
   */
  private async pumpCycle_(): Promise<PumpResult> {

    const batch = this.takeTopPending_()

    if ( batch.length === 0 ) {
      // Nothing to admit; still give the queue a chance to fill from its own
      // pending set (e.g. entries deferred by an earlier budget refusal).
      return { extracted: this.queue_.pump( this.batch_ ), prefetchFailures: 0 }
    }

    const outcomes = await Promise.allSettled( batch.map(
        ( [ productLocalID ] ) =>
          this.prefetcher_.ensureResidentByLocalID( productLocalID ) ) )

    let prefetchFailures = 0

    for ( let where = 0; where < batch.length; ++where ) {

      const [ productLocalID, priority ] = batch[ where ]

      if ( outcomes[ where ].status === 'fulfilled' ) {
        this.queue_.request( productLocalID, priority )
        continue
      }

      // Failed prefetch: re-queue for a later cycle (transient store errors
      // retry; persistent ones keep surfacing in the failure count).
      ++prefetchFailures
      this.request( productLocalID, priority )
    }

    return { extracted: this.queue_.pump( this.batch_ ), prefetchFailures }
  }

  /**
   * Remove and return the top-priority pending entries, up to the batch cap.
   *
   * @return {[number, number][]} `[productLocalID, priority]` pairs.
   */
  private takeTopPending_(): [number, number][] {

    if ( this.pending_.size === 0 ) {
      return []
    }

    const entries = [ ...this.pending_.entries() ]

    entries.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )

    const batch = entries.slice( 0, this.batch_ )

    for ( const [ productLocalID ] of batch ) {
      this.pending_.delete( productLocalID )
    }

    return batch
  }
}
