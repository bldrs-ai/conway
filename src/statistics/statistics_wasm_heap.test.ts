import { describe, expect, test } from '@jest/globals'
import { Statistics } from './statistics'


/**
 * The load-summary line's wasm high-water field.
 *
 * Like the memory line (see src/memory/memory_stats.test.ts), this string is
 * a contract rather than decoration: scripts/benchmark.cjs scrapes
 * `WASM Heap High-Water:` out of the render server's log into the
 * `peakWasmHeapMb` column of every `performance-detail.csv` it writes. It is
 * also the ONLY column in that file that sees conway's native memory —
 * heapUsed/external do not include emscripten's linear memory, and
 * `Geometry Memory` beside it is the vertex+index payload only (conway#552).
 *
 * The scrapes are copied verbatim from scripts/benchmark.cjs.
 */
const WASM_HEAP_SCRAPE = /WASM Heap High-Water: ([\d.]+) MB/
const GEOMETRY_MEMORY_SCRAPE = /Geometry Memory: ([\d.]+) MB/

/** An 85 MB wasm heap over an 8 MB payload, as measured on MB-Khaya. */
const WASM_HEAP_MB = 85.25
const GEOMETRY_PAYLOAD_MB = 8.5

describe('the load-summary line', () => {

  /**
   * A statistics object with both native figures set.
   *
   * @return The formatted load-summary line.
   */
  function lineWithBothNativeFigures(): string {
    const statistics = new Statistics()

    statistics.setLoadStatus('OK')
    statistics.setGeometryMemory(GEOMETRY_PAYLOAD_MB)
    statistics.setWasmHeapPeak(WASM_HEAP_MB)

    return statistics.format()
  }

  test('carries the wasm high-water as its own field', () => {
    const scraped = WASM_HEAP_SCRAPE.exec(lineWithBothNativeFigures())

    expect(scraped).not.toBeNull()
    expect(Number(scraped![1])).toBeCloseTo(WASM_HEAP_MB, 2)
  })

  test('keeps the wasm heap and the geometry payload distinct', () => {
    // The failure this pins is conflation, not absence: the two differ by an
    // order of magnitude — the heap also holds allocator overhead,
    // fragmentation and the intermediate buffers a boolean leaves behind — so
    // a writer that reported one under the other's name would still emit a
    // plausible-looking number into a released benchmark.
    const line = lineWithBothNativeFigures()

    const wasmHeap = Number(WASM_HEAP_SCRAPE.exec(line)![1])
    const payload = Number(GEOMETRY_MEMORY_SCRAPE.exec(line)![1])

    expect(payload).toBeCloseTo(GEOMETRY_PAYLOAD_MB, 2)
    expect(wasmHeap).not.toBeCloseTo(payload, 2)
  })

  test('reports no number at all when the heap was never measured', () => {
    // A load that failed before the module came up has no high-water to
    // report. The scrape must find nothing — benchmark.cjs then leaves the
    // column N/A, which the delta propagates rather than differencing
    // against zero (#548).
    const statistics = new Statistics()

    statistics.setLoadStatus('FAIL')

    expect(WASM_HEAP_SCRAPE.exec(statistics.format())).toBeNull()
  })
})
