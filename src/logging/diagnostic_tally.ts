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
 *
 * The report key truncates a message to its first line's first
 * {@link KEY_MESSAGE_LENGTH} characters, so two DISTINCT full messages that
 * only differ after that point collide onto the same key — Logger itself
 * still tracks them as two separate entries (it dedups on the untruncated
 * message), each with its own independent running `count`. Recording only
 * the latest entry's `count` under the shared key would make the second
 * entry's callback silently overwrite the first's, losing its occurrences
 * rather than combining them (a 3-count and a 2-count colliding entry would
 * report 2, not 5) — so this tracks each entry's own last-seen count and
 * sums that entry's DELTA into the shared key on every call, rather than
 * overwriting the key with one entry's absolute count.
 *
 * The per-entry tracking key is the entry's own untruncated `level: message`
 * — NOT the `LogEntry` object's identity. `Logger.compressLogs()` (run by
 * `getErrors()` and `displayLogs(true)`) replaces every buffered entry with
 * a FRESH object that carries the same `count` forward (it merges by
 * `message`+`level`, same as `findLogIndex`, and rebuilds `Logger.logs` from
 * scratch); an identity-keyed tracker would miss that new object entirely on
 * its first post-compression repeat and treat the carried-over count as a
 * brand-new delta from zero — 1 warning, `getErrors()`, then the same
 * warning again would report 3, not 2. Keying on the same message+level
 * identity Logger itself uses for both dedup and compression survives that
 * object swap for free.
 */
export default class DiagnosticTally implements LoggingProxy {
  private counts = new Map<string, number>()
  private lastSeenCount = new Map<string, number>()

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

    // This entry's own increment since we last saw it — not its absolute
    // count, which a colliding sibling entry under the same truncated key
    // would otherwise clobber. Keyed on the untruncated message (see the
    // class doc) so a post-compressLogs() fresh LogEntry object for the
    // same message is still recognised as the same entry.
    const entryKey = `${entry.level}: ${entry.message}`
    const previousCount = this.lastSeenCount.get(entryKey) ?? 0
    const delta = entry.count - previousCount

    this.lastSeenCount.set(entryKey, entry.count)
    this.counts.set(key, (this.counts.get(key) ?? 0) + delta)
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
