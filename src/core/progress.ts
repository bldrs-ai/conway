import Memory from '../memory/memory'


/**
 * The sequential phases of a model load, matching the phase split already
 * measured by Statistics (parseTime / geometryTime) and the CI perf harness
 * (perf.csv) so a progress report, a CLI run and a CI perf row are directly
 * comparable. See conway issue #301.
 *
 * The heavy interiors of 'geometry' (per-face tessellation, CSG, weld) are
 * single opaque wasm calls with no interior progress — ticks happen at the
 * per-product TS loop, so a hang localizes to one product.
 */
export type ProgressPhase =
  'headerParse' | 'dataParse' | 'geometry' | 'sceneBuild' | 'serialize'

export type ProgressUnit = 'bytes' | 'elements' | 'products' | 'meshes' | 'chunks'

/**
 * A single progress report during a model load.
 *
 * When total is present the phase is determinate and a real progress bar can
 * be rendered; when absent only activity (a heartbeat) is being reported.
 */
export interface ProgressEvent {
  readonly phase: ProgressPhase
  /** Units completed so far in this phase (monotonic within the phase). */
  readonly completed: number
  /** Units total for this phase, when cheaply knowable up front. */
  readonly total?: number
  readonly unit: ProgressUnit
  /** Milliseconds since the tracker (i.e. the load) started. */
  readonly elapsedMs: number
  /** Coarse used-JS-heap sample in MB, when the environment exposes one. */
  readonly memoryMb?: number
}

export type ProgressCallback = ( event: ProgressEvent ) => void

/**
 * Primitive (completed, total) progress callback used by extraction loops,
 * keeping them decoupled from the ProgressEvent contract — a ProgressTracker
 * maps these into events at the loader layer.
 */
export type CountProgressCallback = ( completed: number, total: number ) => void

/** Default minimum milliseconds between emitted progress events. */
export const DEFAULT_PROGRESS_INTERVAL_MS = 100

/**
 * Resolves in a macrotask, letting the event loop breathe so browsers can
 * repaint progress UI and timers (e.g. stall watchdogs) can fire. Used by the
 * *Async load variants between progress ticks.
 *
 * Not timer-based where avoidable: background tabs clamp setTimeout to >=1s,
 * which would collapse a cooperative parse to a ~5% duty cycle the moment
 * the tab loses focus. scheduler.yield() (and the MessageChannel fallback)
 * post ordinary tasks, which are not clamped — loads keep their CPU in
 * backgrounded tabs. setTimeout remains as the last-resort fallback for
 * environments without either (where throttling doesn't apply anyway).
 *
 * @return {Promise<void>} A promise resolved on the next event-loop task.
 */
export function yieldToEventLoop(): Promise<void> {

  const scheduler =
    ( globalThis as { scheduler?: { yield?: () => Promise<void> } } ).scheduler

  if ( typeof scheduler?.yield === 'function' ) {
    return scheduler.yield()
  }

  if ( typeof MessageChannel === 'function' ) {
    return new Promise<void>( ( resolve ) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = () => {
        channel.port1.close()
        resolve()
      }
      channel.port2.postMessage( null )
    } )
  }

  return new Promise<void>( ( resolve ) => {
    setTimeout( resolve, 0 )
  } )
}

/**
 * Throttled fan-in point for progress ticks during a load.
 *
 * Hot loops call update() as often as they like (it is cheap); events are
 * only materialized and forwarded at most once per minIntervalMs, plus
 * unthrottled events at phase begin/end so consumers always see phase
 * boundaries. Memory is sampled only when an event is actually emitted.
 */
export class ProgressTracker {

  private readonly startTime: number = Date.now()
  private lastEmitTime: number = 0
  private phase_: ProgressPhase | undefined
  private unit_: ProgressUnit = 'elements'
  private total_: number | undefined

  /**
   * Construct this with the callback progress events are forwarded to.
   *
   * @param onProgress The consumer callback.
   * @param minIntervalMs Minimum milliseconds between throttled events.
   */
  public constructor(
    private readonly onProgress: ProgressCallback,
    private readonly minIntervalMs: number = DEFAULT_PROGRESS_INTERVAL_MS ) {}

  /**
   * The currently reporting phase, if any.
   *
   * @return {ProgressPhase | undefined} The current phase.
   */
  public get phase(): ProgressPhase | undefined {
    return this.phase_
  }

  /**
   * Begin a phase, emitting an unthrottled zero-progress event.
   *
   * @param phase The phase being entered.
   * @param unit The unit completed/total are measured in for this phase.
   * @param total The total units for this phase, when known up front.
   */
  public beginPhase( phase: ProgressPhase, unit: ProgressUnit, total?: number ): void {
    this.phase_ = phase
    this.unit_ = unit
    this.total_ = total

    this.emit( 0 )
  }

  /**
   * Set/replace the current phase's total once it becomes known
   * (e.g. product count discovered inside geometry extraction).
   *
   * @param total The total units for the current phase.
   */
  public setPhaseTotal( total: number ): void {
    this.total_ = total
  }

  /**
   * Report progress within the current phase; throttled.
   *
   * @param completed Units completed so far.
   */
  public update( completed: number ): void {
    const now = Date.now()

    if ( now - this.lastEmitTime < this.minIntervalMs ) {
      return
    }

    this.emit( completed, now )
  }

  /**
   * End the current phase, emitting an unthrottled final event with
   * completed === total when a total is known.
   *
   * @param completed Final completed units (defaults to the phase total).
   */
  public endPhase( completed?: number ): void {
    this.emit( completed ?? this.total_ ?? 0 )
    this.phase_ = void 0
  }

  /**
   * Materialize and forward an event now, bypassing the throttle.
   *
   * @param completed Units completed so far.
   * @param now Current time in ms (defaults to Date.now()).
   */
  private emit( completed: number, now: number = Date.now() ): void {
    if ( this.phase_ === void 0 ) {
      return
    }

    this.lastEmitTime = now

    const total = this.total_

    this.onProgress( {
      phase: this.phase_,
      completed: total !== void 0 ? Math.min( completed, total ) : completed,
      total: total,
      unit: this.unit_,
      elapsedMs: now - this.startTime,
      memoryMb: Memory.usedHeapMb(),
    } )
  }
}
