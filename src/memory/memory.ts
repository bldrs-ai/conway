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
   * @returns - memory usage result
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
   *
   * @returns - memory usage result for browser systems
   */
  private static checkBrowserMemory(): string {
    if (window && window.performance && window.performance.memory) {
      const memoryUsage = window.performance.memory
       
      const usedJSHeapSize = (memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(3)

      return `JS heap allocated ${usedJSHeapSize} MB`
    } else {
      return 'Browser memory usage information is not available.'
    }
  }

  /**
   *
   * @returns - memory usage result for node systems
   */
  private static checkNodeMemory(): string {
    const memoryUsage = process.memoryUsage()
     
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(3)
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(3)
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(3)
     

    return `Node Memory Usage: RSS ${rss} MB, ` +
           `Heap Total: ${heapTotal} MB, ` +
           `Heap Used: ${heapUsed} MB`
  }
}
