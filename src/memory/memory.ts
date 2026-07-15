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
    /* eslint-enable no-magic-numbers */

    return `Node Memory Usage: RSS ${rss} MB, ` +
           `Heap Total: ${heapTotal} MB, ` +
           `Heap Used: ${heapUsed} MB`
  }
}
