declare global {
     
    interface Performance {
        memory?: {
            jsHeapSizeLimit: number
            totalJSHeapSize: number
            usedJSHeapSize: number
        }
    }
}

import Environment, { EnvironmentType } from '../utilities/environment'
import Logger from '../logging/logger'

/**
 * Memory class handles retrieving memory statistics for various environments.
 */
export default class Memory {
  /**
   *
   * @return {string} - memory usage result
   */
  static checkMemoryUsage(): string {
    switch (Environment.environmentType) {
      case EnvironmentType.BROWSER:
        return this.checkBrowserMemory()
      case EnvironmentType.NODE:
        return this.checkNodeMemory()
      case EnvironmentType.BOTH_FEATURES:
        Logger.info('Checking memory usage for an environment with both Node.js and Web features.')
        // eslint-disable-next-line no-case-declarations
        const result = `${this.checkBrowserMemory()  } ${   this.checkNodeMemory()}`
        return result
      case EnvironmentType.UNKNOWN:
      default:
        return 'Unable to check memory usage: Unknown environment.'
    }
  }

  /**
   * Numeric used-heap sample for progress/telemetry events, unlike the
   * human-formatted strings above. Chrome-only in browsers
   * (performance.memory); undefined where the environment exposes nothing.
   *
   * @return {number | undefined} - used JS heap in MB, if available
   */
  static usedHeapMb(): number | undefined {
    /* eslint-disable no-magic-numbers */
    switch (Environment.environmentType) {
      case EnvironmentType.BROWSER:
        if (typeof window !== 'undefined' && window.performance?.memory) {
          return window.performance.memory.usedJSHeapSize / 1024 / 1024
        }
        return void 0
      case EnvironmentType.NODE:
      case EnvironmentType.BOTH_FEATURES:
        return process.memoryUsage().heapUsed / 1024 / 1024
      default:
        return void 0
    }
    /* eslint-enable no-magic-numbers */
  }

  /**
   *
   * @return {string} - memory usage result for browser systems
   */
  private static checkBrowserMemory(): string {
    if (window && window.performance && window.performance.memory) {
      const memoryUsage = window.performance.memory
      // eslint-disable-next-line no-magic-numbers
      const usedJSHeapSize = (memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(3)

      return `JS heap allocated ${usedJSHeapSize} MB`
    } else {
      return 'Browser memory usage information is not available.'
    }
  }

  /**
   *
   * @return {string} - memory usage result for node systems
   */
  private static checkNodeMemory(): string {
    const memoryUsage = process.memoryUsage()
    /* eslint-disable no-magic-numbers */
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(3)
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(3)
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(3)
    // Off-heap bytes V8 knows about, and the ArrayBuffer subset of them.
    // Neither is visible in heapUsed, and between them they hold the source
    // Buffer and the parse structures: on MB-Khaya (31 MB IFC) readFileSync
    // alone moves arrayBuffers 0.1 -> 31.5 MB while heapUsed does not budge,
    // and by the geometry stage it is 56 MB the other columns cannot see
    // (conway#552). They do NOT see the wasm heap — heapUsed + external
    // reads 284 MB against an RSS of 510 MB on that model — which is why
    // peakRss stays the headline rather than a JS-side total.
    const external = (memoryUsage.external / 1024 / 1024).toFixed(3)
    const arrayBuffers = (memoryUsage.arrayBuffers / 1024 / 1024).toFixed(3)
    // The kernel's high-water mark for this process, which the instants
    // above cannot show: a load that transiently hit 5 GB and settled to
    // 1 GB reports 1 GB in `RSS` and 5 GB here (conway#552).
    // maxRSS is in kilobytes, unlike memoryUsage() which is in bytes.
    const peakRss = (process.resourceUsage().maxRSS / 1024).toFixed(3)
    /* eslint-enable no-magic-numbers */

    // Every field scripts/benchmark.cjs scrapes out of this line is named
    // with a colon before its number, EXCEPT the historical `RSS <n> MB`.
    // That one is matched non-globally as `/RSS ([\d.]+) MB/`, so it takes
    // the first hit in the whole server log: any new field spelled without
    // the colon would bind there and overwrite the instant with a different
    // measurement.
    return `Node Memory Usage: RSS ${rss} MB, ` +
           `Heap Total: ${heapTotal} MB, ` +
           `Heap Used: ${heapUsed} MB, ` +
           `Peak RSS: ${peakRss} MB, ` +
           `External: ${external} MB, ` +
           `ArrayBuffers: ${arrayBuffers} MB`
  }
}
