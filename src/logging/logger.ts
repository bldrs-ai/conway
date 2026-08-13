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
 *
 * Deduplication keys on the exact message string, so anything interpolated
 * into the message splits one problem into N entries with count 1 each and
 * `count` stops meaning "how big is this". That is not hypothetical: one
 * record ID in a message turned a single AP242 failure into 272 rows of the
 * regression run's errors.csv, and normalising the whole public corpus that
 * way takes it from 325 rows to 22. Pass the record as the `expressID`
 * argument instead of writing it into the message - it lands in `expressIDs`,
 * which is unioned across repeats, and the family stays one row that `count`
 * can size.
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
   * @param expressID - record this entry is about, kept out of the message
   *   text so repeats dedupe into one entry (see the class doc)
   */
  private static log(
      level: LogLevelName, message: string, expressID?: number | string ): void {

    // Two ways to attach a record to an entry. The parameter is the one to
    // use; the ' expressID: ' suffix is the older in-message form, kept
    // because TS call sites still use it. Nothing on the wasm side does - the
    // C++ logger spells its own IDs differently and never matches this split -
    // so the suffix has no external dependency and can go once the remaining
    // call sites are converted.
    const baseMessage = message.split(' expressID: ')[0] // Extract the base message
    const data = expressID !== void 0 ?
      String( expressID ) :
      message.split(' expressID: ')[1] // Extract the expressID

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
    //
    // The record goes back on for the echo. Only the BUFFER needs the ID out
    // of the message, so that repeats collapse to one entry; a console line is
    // read once by a person, and dropping the ID there would trade a one-off
    // browser error's only pointer to the offending record for nothing.
    if (firstOccurrence && Logger.isLevelEnabled(LOG_LEVEL_BY_NAME[level])) {
      Logger.sink(
        level, data !== void 0 ? `${baseMessage} expressID: ${data}` : baseMessage)
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
   * @param expressID - record this entry is about
   */
  public static warning(message: string, expressID?: number | string): void {
    Logger.log('warning', message, expressID)
  }

  /**
   *
   * @param message - log message
   * @param expressID - record this entry is about
   */
  public static error(message: string, expressID?: number | string): void {
    Logger.log('error', message, expressID)
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
