import { describe, expect, test } from '@jest/globals'
import { Statistics } from './statistics'


/**
 * The load-summary line's three retention fields (conway#554).
 *
 * Like the wasm high-water field beside them (statistics_wasm_heap.test.ts),
 * these strings are a contract rather than decoration: scripts/benchmark.cjs
 * scrapes them out of the render server's log into the `retainedRssMb`,
 * `retainedHeapUsedMb` and `retainedExternalMb` columns of every
 * `performance-detail.csv` it writes.
 *
 * Two properties are pinned here that a plainer spelling would break.
 *
 * (1) NO CROSS-BINDING. Every scrape in benchmark.cjs matches non-globally,
 * so the first hit in the log wins. A field spelled `Retained Heap Used:`
 * matches the `/Heap Used: .../` pattern that fills `heapUsedMb`, and would
 * silently replace an end-of-load instant with a cycle delta. #552 hit the
 * same hazard with `Peak RSS:` against `RSS `.
 *
 * (2) SIGNED, AND N/A WHEN UNMEASURED. Retention is a difference and can be
 * negative. And where `--expose-gc` was absent the settle never ran, so there
 * is no measurement — the field must then produce no number at all, leaving
 * the column N/A rather than reporting a load that retains nothing.
 *
 * Every regex below is copied verbatim from scripts/benchmark.cjs.
 */
const RETAINED_RSS_SCRAPE = /Retained RSS Delta: (-?[\d.]+) MB/
const RETAINED_HEAP_USED_SCRAPE = /Retained Heap-Used Delta: (-?[\d.]+) MB/
const RETAINED_EXTERNAL_SCRAPE = /Retained External Delta: (-?[\d.]+) MB/

/** The instant/peak scrapes the retention fields must not collide with. */
const RSS_SCRAPE = /RSS ([\d.]+) MB/
const HEAP_USED_SCRAPE = /Heap Used: ([\d.]+) MB/
const HEAP_TOTAL_SCRAPE = /Heap Total: ([\d.]+) MB/
const EXTERNAL_SCRAPE = /External: ([\d.]+) MB/
const ARRAY_BUFFERS_SCRAPE = /ArrayBuffers: ([\d.]+) MB/

const RETAINED_RSS_MB = 94.68
const RETAINED_HEAP_USED_MB = 2.81
const RETAINED_EXTERNAL_MB = -0.75

/**
 * A statistics object with all three retention figures set.
 *
 * @return {string} The formatted load-summary line.
 */
function lineWithRetention(): string {
  const statistics = new Statistics()

  statistics.setLoadStatus('OK')
  statistics.setRetainedRss(RETAINED_RSS_MB)
  statistics.setRetainedHeapUsed(RETAINED_HEAP_USED_MB)
  statistics.setRetainedExternal(RETAINED_EXTERNAL_MB)

  return statistics.format()
}

describe('the load-summary line\'s retention fields', () => {

  test('carries each retention delta as its own field', () => {
    const line = lineWithRetention()

    expect(Number(RETAINED_RSS_SCRAPE.exec(line)![1]))
        .toBeCloseTo(RETAINED_RSS_MB, 2)
    expect(Number(RETAINED_HEAP_USED_SCRAPE.exec(line)![1]))
        .toBeCloseTo(RETAINED_HEAP_USED_MB, 2)
    expect(Number(RETAINED_EXTERNAL_SCRAPE.exec(line)![1]))
        .toBeCloseTo(RETAINED_EXTERNAL_MB, 2)
  })

  test('keeps a negative retention negative', () => {
    // A cycle can end below its baseline. Dropping the sign turns a 0.75 MB
    // give-back into a 0.75 MB leak — the delta of that column would then
    // report a fix as a regression.
    expect(Number(RETAINED_EXTERNAL_SCRAPE.exec(lineWithRetention())![1]))
        .toBeLessThan(0)
  })

  test('does not bind to the peak and instant scrapes beside it', () => {
    // The retention fields on their own: no Memory Statistics line, no peak.
    // If any of these patterns matches, then in a real log — where the
    // retention fields are emitted BEFORE the memory line — the first-match
    // rule would hand a cycle delta to a column that means an end-of-load
    // instant.
    const line = lineWithRetention()

    expect(RSS_SCRAPE.exec(line)).toBeNull()
    expect(HEAP_USED_SCRAPE.exec(line)).toBeNull()
    expect(HEAP_TOTAL_SCRAPE.exec(line)).toBeNull()
    expect(EXTERNAL_SCRAPE.exec(line)).toBeNull()
    expect(ARRAY_BUFFERS_SCRAPE.exec(line)).toBeNull()
  })

  test('reports no number at all when the settle could not run', () => {
    // No `--expose-gc`, so no settled samples and no retention to report.
    // The scrapes must find nothing — benchmark.cjs then leaves the columns
    // N/A, which the delta propagates rather than differencing against zero
    // (#548). A `0.000 MB` here would read as "this load retains nothing",
    // which is the most reassuring possible way to be wrong.
    const statistics = new Statistics()

    statistics.setLoadStatus('OK')

    const line = statistics.format()

    expect(RETAINED_RSS_SCRAPE.exec(line)).toBeNull()
    expect(RETAINED_HEAP_USED_SCRAPE.exec(line)).toBeNull()
    expect(RETAINED_EXTERNAL_SCRAPE.exec(line)).toBeNull()
    expect(line).toContain('Retained RSS Delta: N/A')
  })
})
