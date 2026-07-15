import { ProgressEvent, ProgressPhase } from '../core/progress'


const PHASE_LABELS: Record<ProgressPhase, string> = {
  headerParse: 'Parsing header',
  dataParse: 'Parsing model data',
  geometry: 'Extracting geometry',
  sceneBuild: 'Building scene',
  serialize: 'Writing output',
}

const PERCENT = 100
const DEFAULT_NON_TTY_INTERVAL_MS = 2000
const MS_PER_SECOND = 1000

/**
 * Renders load progress events on a terminal.
 *
 * Writes to stderr so stdout stays clean for data output (query tables,
 * piped GLB paths — issue #301). On a TTY it repaints a single status line
 * with carriage returns; when redirected (CI logs) it prints a plain line on
 * phase changes and at most once per nonTtyIntervalMs so logs stay readable.
 */
export class CliProgressRenderer {

  private lastLineLength = 0
  private lastPrintTime = 0
  private lastPhase: ProgressPhase | undefined

  /**
   * Construct this against an output stream.
   *
   * @param out The stream to render to (default stderr).
   * @param nonTtyIntervalMs Minimum ms between lines when not a TTY.
   */
  public constructor(
    private readonly out: NodeJS.WriteStream = process.stderr,
    private readonly nonTtyIntervalMs: number = DEFAULT_NON_TTY_INTERVAL_MS ) {}

  /**
   * Progress callback — bound as an arrow so it can be handed directly to a
   * ProgressTracker / ModelLoadOptions.onProgress.
   *
   * @param event The progress event to render.
   */
  public readonly onProgress = ( event: ProgressEvent ): void => {

    const now = Date.now()
    const phaseChanged = event.phase !== this.lastPhase

    if ( !this.out.isTTY &&
      !phaseChanged &&
      now - this.lastPrintTime < this.nonTtyIntervalMs ) {
      return
    }

    this.lastPhase = event.phase
    this.lastPrintTime = now

    const line = this.format( event )

    if ( this.out.isTTY ) {

      const padded = line.padEnd( this.lastLineLength )

      this.lastLineLength = line.length
      this.out.write( `\r${padded}` )
    } else {

      this.out.write( `${line}\n` )
    }
  }

  /**
   * Finish rendering — terminates the TTY status line so subsequent output
   * (log table, statistics) starts on a fresh line.
   */
  public done(): void {

    if ( this.out.isTTY && this.lastLineLength > 0 ) {
      this.out.write( '\n' )
    }

    this.lastLineLength = 0
    this.lastPhase = void 0
  }

  /**
   * Format one event as a status line.
   *
   * @param event The progress event.
   * @return {string} e.g. "Extracting geometry 42% (3800/9000 products) 12.4s 512MB"
   */
  private format( event: ProgressEvent ): string {

    const label = PHASE_LABELS[ event.phase ] ?? event.phase
    const elapsedSeconds = ( event.elapsedMs / MS_PER_SECOND ).toFixed( 1 )

    let counts: string

    if ( event.total !== void 0 && event.total > 0 ) {

      const percent = Math.floor( ( event.completed / event.total ) * PERCENT )

      counts = `${percent}% (${event.completed}/${event.total} ${event.unit})`
    } else {

      counts = `${event.completed} ${event.unit}`
    }

    const memory = event.memoryMb !== void 0 ?
      ` ${Math.round( event.memoryMb )}MB` : ''

    return `${label} ${counts} ${elapsedSeconds}s${memory}`
  }
}
