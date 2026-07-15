import { ProgressEvent } from '../core/progress'
import { LoadLogAccumulator, ModelInfo } from '../core/progress_log'


const DEFAULT_NON_TTY_INTERVAL_MS = 2000

/**
 * Renders load progress on a terminal using the shared normalized load-log
 * format (core/progress_log.ts) — the same text rendition Share mirrors to
 * the browser console, so a pasted CLI run and a pasted browser log read
 * identically. Format spec: Share design/new/load-log-format.md.
 *
 * Writes to stderr so stdout stays clean for data output. On a TTY the
 * current stage's line repaints in place and freezes (newline) when the
 * stage completes; when redirected (CI logs) it prints the live line at
 * most once per nonTtyIntervalMs plus every frozen stage line.
 */
export class CliProgressRenderer {

  private readonly log = new LoadLogAccumulator()
  private lastLineLength = 0
  private lastPrintTime = 0

  /**
   * Construct this against an output stream.
   *
   * @param out The stream to render to (default stderr).
   * @param nonTtyIntervalMs Minimum ms between live lines when not a TTY.
   */
  public constructor(
    private readonly out: NodeJS.WriteStream = process.stderr,
    private readonly nonTtyIntervalMs: number = DEFAULT_NON_TTY_INTERVAL_MS ) {}

  /**
   * Print the early model line (from header info).
   *
   * @param info The model header info.
   */
  public onModelInfo( info: ModelInfo ): void {
    const line = this.log.setModelInfo( info )

    this.freezeLine( line )
  }

  /**
   * Progress callback — bound as an arrow so it can be handed directly to a
   * ProgressTracker / ModelLoadOptions.onProgress.
   *
   * @param event The progress event to render.
   */
  public readonly onProgress = ( event: ProgressEvent ): void => {

    const closedLine = this.log.onProgress( event )

    if ( closedLine !== void 0 ) {
      this.freezeLine( closedLine )
    }

    const currentLine = this.log.currentLine()

    if ( currentLine === void 0 ) {
      return
    }

    const now = Date.now()

    if ( !this.out.isTTY && now - this.lastPrintTime < this.nonTtyIntervalMs ) {
      return
    }

    this.lastPrintTime = now

    if ( this.out.isTTY ) {

      const padded = currentLine.padEnd( this.lastLineLength )

      this.lastLineLength = currentLine.length
      this.out.write( `\r${padded}` )
    } else {

      this.out.write( `${currentLine}\n` )
    }
  }

  /**
   * Finish rendering: freeze any running stage's line and print the
   * separate before/after Total line.
   *
   * @param atElapsedMs Optional load-end elapsed ms, so the final stage's
   * duration covers the time until the load finished (not just until its
   * last progress event).
   * @param atMemoryMb Optional load-end heap MB.
   */
  public done( atElapsedMs?: number, atMemoryMb?: number ): void {

    const closedLine = this.log.closeCurrentStage( atElapsedMs, atMemoryMb )

    if ( closedLine !== void 0 ) {
      this.freezeLine( closedLine )
    }

    this.freezeLine( this.log.totalLine() )
  }

  /**
   * Print a line permanently, replacing any animated line on a TTY.
   *
   * @param line The line to freeze.
   */
  private freezeLine( line: string ): void {

    if ( this.out.isTTY && this.lastLineLength > 0 ) {
      // Overwrite the animated line in place, then commit with a newline.
      this.out.write( `\r${line.padEnd( this.lastLineLength )}\n` )
    } else {
      this.out.write( `${line}\n` )
    }

    this.lastLineLength = 0
  }
}
