/**
 * The shared, normalized text rendition of load progress — one format for
 * the conway CLI, the browser console, and Share's status-bar expando, so a
 * user pasting either surface produces the same report. Canonical format
 * spec: Share design/new/load-log-format.md (conway issue #301).
 *
 * Deliberately dependency-free (no Logger/Memory/statistics imports):
 * Share deep-imports this module via the package's `./src/*` export map and
 * must not drag the engine graph in with it. Inputs are structurally typed
 * against core/progress.ts's ProgressEvent shape.
 *
 * Example output:
 *
 *   Model: Arty_Z7.stp — AP214, 38.1 MB, SolidWorks 2021 (SwSTEP 2.0)
 *   Parsing [0%................100%] 3.2s, +210 MB heap
 *   Geometry [0%........56%] 41.0s, +388 MB heap
 *   Total: 44.7s, 512 → 1110 MB heap
 *
 * Stage lines own only their deltas (duration, heap growth); Total is not
 * additive — it is a separate before/after wall-clock + heap observation.
 */

/** What a header parse can tell us before the full file parse (issue #301). */
export interface ModelInfo {
  fileName?: string
  /** e.g. 'IFC4', 'AP214', or a non-STEP format tag like 'GLB' / 'FBX'. */
  schema?: string
  preprocessorVersion?: string
  originatingSystem?: string
  byteLength?: number
}

/**
 * Structural subset of core/progress.ts's ProgressEvent that the
 * accumulator consumes — kept local so this module stays import-free.
 */
export interface ProgressEventLike {
  phase: string
  completed: number
  total?: number
  elapsedMs: number
  memoryMb?: number
}

/** Display labels for the phase taxonomy; unknown phases title-case as-is. */
const STAGE_LABELS: Record<string, string> = {
  download: 'Download',
  headerParse: 'Parsing',
  dataParse: 'Parsing',
  geometry: 'Geometry',
  sceneBuild: 'Scene',
  serialize: 'Writing',
  convert: 'Convert',
}

const BAR_FULL_DOTS = 16
const PERCENT = 100
const MS_PER_SECOND = 1000
// Seconds to millisecond precision, memory to byte precision (6 decimals of
// MB ≡ bytes) — issue #301 preview feedback.
const SECONDS_DECIMALS = 3
const MB_DECIMALS = 6

/**
 * Display label for a phase, merging headerParse+dataParse into 'Parsing'.
 *
 * @param phase The phase identifier.
 * @return {string} The stage label.
 */
export function stageLabel( phase: string ): string {
  const known = STAGE_LABELS[ phase ]

  if ( known !== void 0 ) {
    return known
  }

  return phase.charAt( 0 ).toUpperCase() + phase.slice( 1 )
}

/**
 * Render the ASCII progress bar: dots grow with percent, e.g.
 * "[0%........56%]", completing as "[0%................100%]".
 * Indeterminate (no percent) renders "[...]".
 *
 * @param percent Percent complete 0-100, or undefined when indeterminate.
 * @return {string} The rendered bar.
 */
export function formatBar( percent?: number ): string {
  if ( percent === void 0 || !isFinite( percent ) ) {
    return '[...]'
  }

  const clamped = Math.max( 0, Math.min( PERCENT, percent ) )
  const dotCount = Math.round( ( clamped / PERCENT ) * BAR_FULL_DOTS )

  return `[0%${'.'.repeat( dotCount )}${Math.floor( clamped )}%]`
}

/**
 * One decimal place of seconds, e.g. "3.2s".
 *
 * @param milliseconds Elapsed milliseconds.
 * @return {string} The formatted duration.
 */
export function formatSeconds( milliseconds: number ): string {
  return `${( milliseconds / MS_PER_SECOND ).toFixed( SECONDS_DECIMALS )}s`
}

/**
 * Format a memory value in MB to byte precision (6 decimals).
 *
 * @param megabytes The value in MB.
 * @return {string} e.g. "720.000000"
 */
export function formatMb( megabytes: number ): string {
  return megabytes.toFixed( MB_DECIMALS )
}

/**
 * The early model line from header-parse info — printable before the full
 * file parse (issue #301 follow-up, log line 3).
 *
 * @param info The model header info.
 * @return {string} e.g. "Model: Arty_Z7.stp — AP214, 38.1 MB,
 * SolidWorks 2021 (SwSTEP 2.0)"
 */
export function formatModelLine( info: ModelInfo ): string {
  const parts: string[] = []

  if ( info.schema !== void 0 && info.schema !== '' ) {
    parts.push( info.schema )
  }

  if ( info.byteLength !== void 0 ) {
    // eslint-disable-next-line no-magic-numbers
    parts.push( `${( info.byteLength / ( 1024 * 1024 ) ).toFixed( 1 )} MB` )
  }

  if ( info.originatingSystem !== void 0 && info.originatingSystem !== '' ) {
    const preprocessor =
      info.preprocessorVersion !== void 0 && info.preprocessorVersion !== '' ?
        ` (${info.preprocessorVersion})` : ''

    parts.push( `${info.originatingSystem}${preprocessor}` )
  } else if ( info.preprocessorVersion !== void 0 && info.preprocessorVersion !== '' ) {
    parts.push( info.preprocessorVersion )
  }

  const name = info.fileName !== void 0 && info.fileName !== '' ? info.fileName : '(unnamed)'
  const detail = parts.length > 0 ? ` — ${parts.join( ', ' )}` : ''

  return `Model: ${name}${detail}`
}

interface StageState {
  label: string
  startElapsedMs: number
  lastElapsedMs: number
  startHeapMb?: number
  lastHeapMb?: number
  percent?: number
}

/**
 * The signed heap-delta suffix for a stage, byte precision, e.g.
 * ", +663.000000 MB heap" — empty when memory wasn't sampled.
 *
 * @param state The stage state.
 * @return {string} The heap suffix (may be empty).
 */
function heapDeltaSuffix( state: StageState ): string {
  if ( state.startHeapMb === void 0 || state.lastHeapMb === void 0 ) {
    return ''
  }

  const delta = state.lastHeapMb - state.startHeapMb
  const sign = delta >= 0 ? '+' : '-'

  return `, ${sign}${formatMb( Math.abs( delta ) )} MB heap`
}

/**
 * Format one stage's line from its state (issue #301 preview feedback):
 *
 * - a live stage shows its bar (determinate `[0%..56%]`, indeterminate
 *   `[...]`) — it's still running;
 * - a completed stage drops the bar entirely: `Label: 1.234s, +N MB heap`;
 * - a stage frozen *before* reaching 100% (a failed/aborted determinate
 *   stage) keeps its bar to show how far it got: `Label [0%..57%] …`.
 *
 * @param state The stage state.
 * @param final Whether the stage is finished (frozen).
 * @return {string} The stage line.
 */
function formatStageLine( state: StageState, final: boolean ): string {
  const duration = state.lastElapsedMs - state.startElapsedMs
  const heap = heapDeltaSuffix( state )
  const determinate = state.percent !== void 0

  // Completed: no bar, colon-separated. A determinate stage that stopped
  // short of 100% is a failure — keep its bar to show the reach.
  if ( final && !( determinate && ( state.percent as number ) < PERCENT ) ) {
    return `${state.label}: ${formatSeconds( duration )}${heap}`
  }

  const bar = formatBar( determinate ? state.percent : void 0 )

  return `${state.label} ${bar} ${formatSeconds( duration )}${heap}`
}

/**
 * Accumulates progress events into the normalized text report: a live
 * current-stage line while a stage runs, a frozen line per finished stage,
 * and a separate before/after Total line.
 *
 * Stage transitions are inferred from the event stream (a new label closes
 * the previous stage), so the same accumulator works for conway's phases
 * and Share's format-agnostic stages (download/parse/convert/...).
 */
export class LoadLogAccumulator {

  private readonly finished_: string[] = []
  private current_: StageState | undefined
  private firstElapsedMs_: number | undefined
  private lastElapsedMs_: number = 0
  private firstHeapMb_: number | undefined
  private lastHeapMb_: number | undefined
  private modelLine_: string | undefined

  /**
   * Record the model line (from header info) — kept with the report.
   *
   * @param info The model header info.
   * @return {string} The formatted model line.
   */
  public setModelInfo( info: ModelInfo ): string {
    this.modelLine_ = formatModelLine( info )

    return this.modelLine_
  }

  /**
   * Feed one progress event; returns the finished stage's line when this
   * event closed a stage (so callers can mirror it to a console/log once).
   *
   * @param event The progress event.
   * @return {string | undefined} The line for a just-finished stage, if any.
   */
  public onProgress( event: ProgressEventLike ): string | undefined {
    const label = stageLabel( event.phase )

    this.firstElapsedMs_ ??= event.elapsedMs
    this.lastElapsedMs_ = event.elapsedMs

    if ( event.memoryMb !== void 0 ) {
      this.firstHeapMb_ ??= event.memoryMb
      this.lastHeapMb_ = event.memoryMb
    }

    let closedLine: string | undefined

    if ( this.current_ === void 0 || this.current_.label !== label ) {

      // A stage ends when the next begins — extend the outgoing stage to
      // this transition point so its duration/heap cover the real elapsed
      // gap (a stage that got only its opening event would otherwise read 0).
      closedLine = this.closeCurrentStage( event.elapsedMs, event.memoryMb )

      this.current_ = {
        label,
        startElapsedMs: event.elapsedMs,
        lastElapsedMs: event.elapsedMs,
        startHeapMb: event.memoryMb,
        lastHeapMb: event.memoryMb,
      }
    }

    const current = this.current_

    current.lastElapsedMs = event.elapsedMs

    if ( event.memoryMb !== void 0 ) {
      current.startHeapMb ??= event.memoryMb
      current.lastHeapMb = event.memoryMb
    }

    if ( event.total !== void 0 && event.total > 0 ) {
      current.percent = ( event.completed / event.total ) * PERCENT
    }

    return closedLine
  }

  /**
   * Close any open stage (e.g. at load end) and freeze its line. When an
   * end point is given, the stage is extended to it first (a stage ends
   * when the next begins, or when the load finishes).
   *
   * @param atElapsedMs Elapsed ms to extend the stage to before freezing.
   * @param atMemoryMb Heap MB to extend the stage to before freezing.
   * @return {string | undefined} The closed stage's line, if one was open.
   */
  public closeCurrentStage( atElapsedMs?: number, atMemoryMb?: number ): string | undefined {
    if ( this.current_ === void 0 ) {
      return void 0
    }

    if ( atElapsedMs !== void 0 ) {
      this.current_.lastElapsedMs = atElapsedMs
      this.lastElapsedMs_ = atElapsedMs
    }

    if ( atMemoryMb !== void 0 ) {
      this.current_.lastHeapMb = atMemoryMb
      this.lastHeapMb_ = atMemoryMb
    }

    const line = formatStageLine( this.current_, true )

    this.finished_.push( line )
    this.current_ = void 0

    return line
  }

  /**
   * The live line for the running stage, if any.
   *
   * @return {string | undefined} The current stage's animated line.
   */
  public currentLine(): string | undefined {
    if ( this.current_ === void 0 ) {
      return void 0
    }

    return formatStageLine( this.current_, false )
  }

  /**
   * Lines for finished stages, in completion order.
   *
   * @return {string[]} The frozen stage lines.
   */
  public finishedLines(): string[] {
    return this.finished_.slice()
  }

  /**
   * The separate before/after Total line: overall wall clock and heap
   * observation, not a sum of stages.
   *
   * @return {string} e.g. "Total: 44.7s, 512 → 1110 MB heap"
   */
  public totalLine(): string {
    const duration = this.lastElapsedMs_ - ( this.firstElapsedMs_ ?? 0 )

    let heap = ''

    if ( this.firstHeapMb_ !== void 0 && this.lastHeapMb_ !== void 0 ) {
      heap = `, ${formatMb( this.firstHeapMb_ )} → ${formatMb( this.lastHeapMb_ )} MB heap`
    }

    return `Total: ${formatSeconds( duration )}${heap}`
  }

  /**
   * The full report: model line (if known), finished stage lines, then the
   * Total line. Call closeCurrentStage() first at load end.
   *
   * @return {string[]} All report lines.
   */
  public allLines(): string[] {
    const lines: string[] = []

    if ( this.modelLine_ !== void 0 ) {
      lines.push( this.modelLine_ )
    }

    lines.push( ...this.finished_ )
    lines.push( this.totalLine() )

    return lines
  }
}
