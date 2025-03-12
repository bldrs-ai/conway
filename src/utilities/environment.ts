import Logger from '../logging/logger'


/** Environment class detects the runtime environment */
export default class Environment {
  static environmentType:EnvironmentType = EnvironmentType.UNKNOWN

  /**
   * determines the runtime environment
   */
  static checkEnvironment(): void {
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


export enum EnvironmentType {
  BROWSER = 0,
  NODE = 1,
  BOTH_FEATURES = 2,
  UNKNOWN = 3,
}
