import { Statistics } from '../statistics/statistics'
import Environment, { EnvironmentType } from '../utilities/environment'


export type LogLevelName = 'debug' | 'info' | 'warning' | 'error'

/**
 * Numeric log threshold, ordered so that a message is emitted to the console
 * sink when its level is >= the current threshold. OFF silences everything.
 * Buffered entries (for displayLogs/proxies) are collected regardless of the
 * threshold — the threshold only controls what echoes to the console as it
 * happens.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  OFF = 4,
}

const LOG_LEVEL_BY_NAME: Record<LogLevelName, LogLevel> = {
  'debug': LogLevel.DEBUG,
  'info': LogLevel.INFO,
  'warning': LogLevel.WARNING,
  'error': LogLevel.ERROR,
}

export interface LogEntry {
    level: LogLevelName
    message: string
    count: number
    expressIDs:Set<string>
}


export interface LoggingProxy {
    log(entry: LogEntry): void
}

/**
 * Where echoed log lines go. The default writes through the matching console
 * method; the CLI swaps in a sink that writes everything to stderr so stdout
 * stays clean for data output.
 */
export type LogSink = ( level: LogLevelName, message: string ) => void

const defaultSink: LogSink = ( level, message ) => {
  switch ( level ) {
    case 'error':
      console.error( message )
      break
    case 'warning':
      console.warn( message )
      break
    default:
      console.log( message )
  }
}

/**
 * Logger class which supports logging statistics, as well as proxy logging interfaces
 * for extended logging.
 *
 * Entries are deduplicated (repeat messages increment a count and accumulate
 * express IDs) and buffered for displayLogs()/proxies. Additionally, the
 * first occurrence of each distinct entry at or above the current threshold
 * is echoed to the console sink immediately, so warnings/errors are visible
 * live without waiting for a displayLogs() dump.
 */
export default class Logger {
  private static logs: LogEntry[] = []
  private static proxies: LoggingProxy[] = []
  private static statistics: Map<number, Statistics> = new Map<number, Statistics>()
  private static threshold: LogLevel = LogLevel.INFO
  private static sink: LogSink = defaultSink


  /**
   * Detects environment and initializes wasm callbacks
   */
  public static initializeWasmCallbacks() {
    const environment = Environment.environmentType

    if (environment === EnvironmentType.BROWSER) {
      const globalScope = window;
      (globalScope as any).logInfo = Logger.info;
      (globalScope as any).logWarning = Logger.warning;
      (globalScope as any).logError = Logger.error
    } else if (environment === EnvironmentType.NODE ||
        environment === EnvironmentType.BOTH_FEATURES) {
      const globalScope = global;
      (globalScope as any).logInfo = Logger.info;
      (globalScope as any).logWarning = Logger.warning;
      (globalScope as any).logError = Logger.error
    }
  }

  /**
   * Set the console-echo threshold. Embedders (e.g. Share) call this to
   * quiet or expand conway's console output; the CLI maps -q/-v/-vv here.
   *
   * @param level - new threshold
   */
  public static setLogLevel(level: LogLevel): void {
    Logger.threshold = level
  }

  /**
   *
   * @return {LogLevel} the current console-echo threshold
   */
  public static getLogLevel(): LogLevel {
    return Logger.threshold
  }

  /**
   * Is a given level at or above the current threshold?
   *
   * @param level - level to test
   * @return {boolean} true when messages at this level echo to the console
   */
  public static isLevelEnabled(level: LogLevel): boolean {
    return level >= Logger.threshold && Logger.threshold !== LogLevel.OFF
  }

  /**
   * Replace the console sink (e.g. the CLI routes all echoes to stderr so
   * stdout stays parseable). Pass undefined to restore the default.
   *
   * @param sink - replacement sink or undefined
   */
  public static setSink(sink?: LogSink): void {
    Logger.sink = sink ?? defaultSink
  }

  /**
   *
   * @param message - log message
   * @param level - log level
   * @return {number} log index
   */
  private static findLogIndex(message: string, level: LogLevelName): number {
    return Logger.logs.findIndex((log) => log.message === message && log.level === level)
  }

  /**
   *
   * @param level - log level
   * @param message - log message
   */
  private static log(level: LogLevelName, message: string): void {
    const baseMessage = message.split(' expressID: ')[0] // Extract the base message
    const data = message.split(' expressID: ')[1] // Extract the expressID

    const index = Logger.findLogIndex(baseMessage, level)
    let logEntry: LogEntry
    let firstOccurrence = false

    if (index >= 0) {
      Logger.logs[index].count += 1
      if (data !== void 0) {
        Logger.logs[index].expressIDs = Logger.logs[index].expressIDs || new Set<string>()
        Logger.logs[index].expressIDs.add(data)
      }
      logEntry = Logger.logs[index]
    } else {
      firstOccurrence = true
      logEntry = {
        level,
        message: baseMessage,
        count: 1,
        expressIDs: data ? new Set([data]) : new Set(),
      }
      Logger.logs.push(logEntry)
    }

    // Echo only the first occurrence of each distinct entry — repeats keep
    // deduplicating silently into the buffer (visible via displayLogs()).
    if (firstOccurrence && Logger.isLevelEnabled(LOG_LEVEL_BY_NAME[level])) {
      Logger.sink(level, baseMessage)
    }

    Logger.proxies.forEach((proxy) => proxy.log(logEntry))
  }


  /**
   * Compresses similar logs to a single line
   */
  public static compressLogs(): void {
    const compressedLogs: LogEntry[] = []

    Logger.logs.forEach((log) => {
      const existingLog = compressedLogs.find((l) =>
        l.message === log.message && l.level === log.level)
      if (existingLog !== void 0) {
        existingLog.count += log.count
        if (log.expressIDs !== void 0) {
          log.expressIDs.forEach((d) => existingLog.expressIDs?.add(d))
        }
      } else {
        compressedLogs.push({
          ...log,
          expressIDs: log.expressIDs ? new Set(log.expressIDs) : new Set(),
        })
      }
    })

    Logger.logs = compressedLogs // Replace the original logs with compressed logs
  }


  /**
   *
   * @param proxy - a log proxy
   */
  public static addProxy(proxy: LoggingProxy): void {
    Logger.proxies.push(proxy)
  }

  /**
   * Remove a previously added proxy (no-op if absent).
   *
   * @param proxy - the proxy to remove
   */
  public static removeProxy(proxy: LoggingProxy): void {
    const index = Logger.proxies.indexOf(proxy)

    if (index >= 0) {
      Logger.proxies.splice(index, 1)
    }
  }

  /**
   *
   * @param message - log message
   */
  public static debug(message: string): void {
    Logger.log('debug', message)
  }

  /**
   *
   * @param message - log message
   */
  public static info(message: string): void {
    Logger.log('info', message)
  }

  /**
   *
   * @param modelID
   * @return {Statistics | undefined}
   */
  public static getStatistics(modelID: number): Statistics | undefined {
    return this.statistics.get(modelID)
  }

  /**
   * Create the statistics for a model ID.
   *
   * @param modelID The model ID to create statistics for
   *
   * @return {Statistics} The created statistics object.
   */
  public static createStatistics(modelID: number): Statistics {
    const statistics: Statistics = new Statistics()

    this.statistics.set(modelID, statistics)

    return statistics
  }

  /**
   *
   * @param modelID
   */
  public static printStatistics(modelID: number) {
    if (!Logger.isLevelEnabled(LogLevel.INFO)) {
      return
    }

    const statistics_ = this.statistics.get(modelID)

    if (statistics_ !== void 0) {
      // Through the sink (not printStatistics' console.log) so the CLI's
      // stderr sink keeps stdout clean for data output.
      Logger.sink('info', statistics_.format())
    } else {
      Logger.error(`No statistics for modelID: ${modelID}`)
    }
  }

  /**
   * Compresses the logs if they haven't been compressed,
   * then returns a list of just the errors.
   *
   * @return {LogEntry[]} The errors.
   */
  public static getErrors(): LogEntry[] {

    Logger.compressLogs()

    return this.logs.filter( ( where ) => where.level === 'error' )
  }

  /**
   *
   * @param message - log message
   */
  public static warning(message: string): void {
    Logger.log('warning', message)
  }

  /**
   *
   * @param message - log message
   */
  public static error(message: string): void {
    Logger.log('error', message)
  }

  /**
   *
   * @return {LogEntry[]} - list of logs
   */
  public static getLogs(): LogEntry[] {
    return Logger.logs
  }

  /**
   * Display the deduplicated log buffer in a table.
   *
   * Gated behind the DEBUG threshold by default — a clean load should leave
   * a quiet console (issue #301); pass force for explicit dumps (CLI -v).
   *
   * @param force - dump regardless of the current threshold
   */
  public static displayLogs(force: boolean = false): void {
    if (!force && !Logger.isLevelEnabled(LogLevel.DEBUG)) {
      return
    }

    Logger.compressLogs()
    console.table(Logger.logs)
  }

  /**
   * clear logs
   */
  public static clearLogs(): void {
    Logger.logs = []
  }
}
