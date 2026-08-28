import type { LogEntry, LoggingProxy } from './logger'


// How much of a message's first line keys the tally — matches the key shape
// model_report.mjs's `## conway diagnostics` section used before conway#590.
const KEY_MESSAGE_LENGTH = 120

/**
 * Honest per-message occurrence counts for warnings/errors, for tools that
 * want "how many times did this actually happen" rather than "did this
 * happen at all".
 *
 * `Logger`'s console sink (`Logger.setSink`) fires only on a message's
 * first occurrence — that is intentional, so an interactive console isn't
 * spammed by a repeated warning (see logger.ts's class doc). A counter
 * built by incrementing on every `sink` call therefore always reads 1,
 * no matter how many times the message actually recurred (conway#590).
 *
 * A `LoggingProxy`, by contrast, is invoked on *every* occurrence with the
 * same mutated `LogEntry`, whose `count` field is already Logger's running
 * total for that message — so recording `entry.count` on each call (rather
 * than incrementing a private counter) keeps this tally correct even if an
 * entry's repeats are not contiguous.
 */
export default class DiagnosticTally implements LoggingProxy {
  private counts = new Map<string, number>()

  /**
   * LoggingProxy callback — Logger invokes this on every occurrence of
   * every entry, regardless of the console-echo threshold.
   *
   * @param entry - the log entry, with its running repeat count
   */
  public log(entry: LogEntry): void {
    if (entry.level !== 'warning' && entry.level !== 'error') {
      return
    }

    const key = `${entry.level}: ${entry.message.split('\n')[0].slice(0, KEY_MESSAGE_LENGTH)}`

    this.counts.set(key, entry.count)
  }

  /**
   * Snapshot the tally as [key, count] pairs, most callers' preferred shape
   * for building a ranked report.
   *
   * @return {[string, number][]} the tallied entries
   */
  public entries(): [string, number][] {
    return [...this.counts.entries()]
  }
}
