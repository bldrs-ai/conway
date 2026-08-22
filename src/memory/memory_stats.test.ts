import { describe, expect, test, beforeAll } from '@jest/globals'
import Memory from './memory'
import Environment, { EnvironmentType } from '../utilities/environment'


/**
 * The node memory line `Memory.checkMemoryUsage()` returns is not just a log
 * string: scripts/benchmark.cjs regex-scrapes it into the `rssMb` /
 * `peakRssMb` / `heapUsedMb` / `heapTotalMb` columns of every
 * `performance-detail.csv` snapshot committed to the model repos. The format
 * is therefore a contract with a consumer in another repo's file, which is why
 * it is pinned here rather than left to the writer.
 *
 * The scrapes below are copied verbatim from scripts/benchmark.cjs.
 */
const INSTANT_RSS_SCRAPE = /RSS ([\d.]+) MB/
const PEAK_RSS_SCRAPE = /Peak RSS: ([\d.]+) MB/

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
