import Logger from '../logging/logger'


export enum EnvironmentType {
  BROWSER = 0,
  NODE = 1,
  BOTH_FEATURES = 2,
  UNKNOWN = 3,
  // A Web Worker (dedicated, shared or service): web, but no `window`.
  // Appended rather than inserted so the existing numeric values hold.
  WORKER = 4,
}


/** Environment class detects the runtime environment */
export default class Environment {
  static environmentType:EnvironmentType = EnvironmentType.UNKNOWN

  /**
   * determines the runtime environment
   */
  static checkEnvironment(): void {
    // A worker has neither `window` nor Node's `global`, so before conway#540
    // it fell through to UNKNOWN, and Logger.initializeWasmCallbacks then
    // bound no logInfo/logWarning/logError for the wasm to call: every
    // native diagnostic was dropped (the glue checks `typeof ... ===
    // 'function'` before calling). Same WorkerGlobalScope test as
    // conway-geom's isWebPlatform (conway-geom#217). Checked first: Node has
    // no WorkerGlobalScope, so this never claims a Node process.
    const workerScope = ( globalThis as { WorkerGlobalScope?: unknown } ).WorkerGlobalScope
    if ( typeof workerScope === 'function' &&
        globalThis instanceof ( workerScope as new () => unknown ) ) {
      this.environmentType = EnvironmentType.WORKER
      return
    }

    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'
    const isNode = typeof global !== 'undefined' &&
    typeof global.process !== 'undefined' &&
    global.process.versions &&
    global.process.versions.node

    if (isBrowser && isNode) {
      // Environment might be something like Electron
      Logger.info('This environment has features of both Node.js and a web browser.')
      this.environmentType = EnvironmentType.BOTH_FEATURES
    } else if (isNode) {
      this.environmentType = EnvironmentType.NODE
    } else if (isBrowser) {
      this.environmentType = EnvironmentType.BROWSER
    } else {
      Logger.info('ENVIRONMENT === unknown')
      this.environmentType = EnvironmentType.UNKNOWN
    }
  }
}
