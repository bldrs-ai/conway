import { describe, expect, test, beforeAll } from '@jest/globals'
import Memory from './memory'
import Environment, { EnvironmentType } from '../utilities/environment'


/**
 * The node memory line `Memory.checkMemoryUsage()` returns is not just a log
 * string: scripts/benchmark.cjs regex-scrapes it into the `rssMb` /
 * `peakRssMb` / `heapUsedMb` / `heapTotalMb` / `externalMb` /
 * `arrayBuffersMb` columns of every `performance-detail.csv` snapshot
 * committed to the model repos. The format is therefore a contract with a
 * consumer in another repo's file, which is why it is pinned here rather than
 * left to the writer.
 *
 * The scrapes below are copied verbatim from scripts/benchmark.cjs.
 */
const INSTANT_RSS_SCRAPE = /RSS ([\d.]+) MB/
const PEAK_RSS_SCRAPE = /Peak RSS: ([\d.]+) MB/
const HEAP_USED_SCRAPE = /Heap Used: ([\d.]+) MB/
const EXTERNAL_SCRAPE = /External: ([\d.]+) MB/
const ARRAY_BUFFERS_SCRAPE = /ArrayBuffers: ([\d.]+) MB/

/* eslint-disable no-magic-numbers */
const BYTES_PER_MB = 1024 * 1024

/** Big enough to bypass Node's Buffer pool and get its own ArrayBuffer. */
const BIG_BUFFER_BYTES = 32 * BYTES_PER_MB

/**
 * Slack on the growth assertions. The allocation is held across both samples,
 * so arrayBuffers must show nearly all of it; heapUsed must show almost none,
 * and is bounded well below rather than at zero because the two samples are
 * separated by real work that allocates a little on the JS heap.
 */
const MOSTLY = 0.9
const BARELY = 0.5
/* eslint-enable no-magic-numbers */

let line: string

beforeAll(() => {
  Environment.checkEnvironment()
  line = Memory.checkMemoryUsage()
})

describe('Memory.checkMemoryUsage in node', () => {

  test('runs as a node environment under jest', () => {
    // The rest of this suite is about the node branch; if the detector puts us
    // somewhere else the assertions below would be vacuous.
    expect([EnvironmentType.NODE, EnvironmentType.BOTH_FEATURES])
        .toContain(Environment.environmentType)
  })

  test('reports the process peak alongside the instantaneous sample', () => {
    // conway#552: every memory number in every blessed snapshot was one
    // un-GC'd `process.memoryUsage()` sample, so the high-water mark — the
    // number that decides whether a tab or a runner survives a model — was
    // never recorded anywhere.
    const peak = PEAK_RSS_SCRAPE.exec(line)

    expect(peak).not.toBeNull()
    expect(Number(peak![1])).toBeGreaterThan(0)
  })

  test('the peak is at least the instant, since it is a high-water mark', () => {
    const instant = INSTANT_RSS_SCRAPE.exec(line)
    const peak = PEAK_RSS_SCRAPE.exec(line)

    expect(instant).not.toBeNull()
    expect(peak).not.toBeNull()
    // Not an equality: they coincide when the sample is taken at the peak, and
    // diverge by whatever the process has released since. maxRSS is in kB and
    // memoryUsage() in bytes, so a unit slip here shows up as a factor of
    // ~1000 rather than as a plausible-looking number.
    expect(Number(peak![1])).toBeGreaterThanOrEqual(Number(instant![1]))
  })

  test('reports external and its arrayBuffers subset', () => {
    // conway#552's amendment: both come free from the memoryUsage() call the
    // line already makes, and they are where a real part of the footprint
    // lives. Node documents arrayBuffers as included in external, so the
    // subset relation is a contract, not an observation — a writer that
    // swapped the two would still produce plausible-looking numbers.
    const external = EXTERNAL_SCRAPE.exec(line)
    const arrayBuffers = ARRAY_BUFFERS_SCRAPE.exec(line)

    expect(external).not.toBeNull()
    expect(arrayBuffers).not.toBeNull()
    expect(Number(arrayBuffers![1])).toBeLessThanOrEqual(Number(external![1]))
  })

  test('a large Buffer moves arrayBuffers, and not heapUsed', () => {
    // The reason these columns are worth a CSV column each. On MB-Khaya the
    // 31 MB readFileSync moves arrayBuffers 0.1 -> 31.5 MB while heapUsed
    // does not move at all, so a bench recording only heapUsed cannot see the
    // source buffer or the parse structures. Reproduced here in miniature.
    const before = Memory.checkMemoryUsage()
    const held = Buffer.allocUnsafeSlow(BIG_BUFFER_BYTES)
    const after = Memory.checkMemoryUsage()

    /**
     * Read one MB figure out of a memory line.
     *
     * @param scrape The field's regex.
     * @param from The line to read.
     * @return The value in MB.
     */
    const mb = (scrape: RegExp, from: string) => Number(scrape.exec(from)![1])

    const arrayBuffersGrowth =
      mb(ARRAY_BUFFERS_SCRAPE, after) - mb(ARRAY_BUFFERS_SCRAPE, before)
    const heapUsedGrowth =
      mb(HEAP_USED_SCRAPE, after) - mb(HEAP_USED_SCRAPE, before)
    const expectedMb = BIG_BUFFER_BYTES / BYTES_PER_MB

    // Held across both samples so the allocation cannot be collected between
    // them; the read also stops the buffer being optimised away.
    expect(held.length).toBe(BIG_BUFFER_BYTES)
    expect(arrayBuffersGrowth).toBeGreaterThan(expectedMb * MOSTLY)
    expect(heapUsedGrowth).toBeLessThan(expectedMb * BARELY)
  })

  test('the instant scrape does not bind to the peak instead', () => {
    // benchmark.cjs matches non-globally, so `/RSS ([\d.]+) MB/` takes the
    // FIRST occurrence in the whole server log. `Peak RSS:` keeps its colon
    // precisely so it cannot satisfy that pattern — otherwise adding the peak
    // would silently overwrite the historical `rssMb` column with a different
    // measurement, and every cross-version delta over it would compare two
    // different quantities.
    expect(INSTANT_RSS_SCRAPE.exec('Peak RSS: 4096.000 MB')).toBeNull()

    const instant = INSTANT_RSS_SCRAPE.exec(line)
    expect(instant).not.toBeNull()
    expect(line.indexOf(instant![0]))
        .toBeLessThan(line.indexOf('Peak RSS:'))
  })
})
