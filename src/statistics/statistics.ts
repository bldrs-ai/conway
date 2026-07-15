import { versionString } from '../version/version'
import { wasmType } from '../../dependencies/conway-geom'

/**
 * Class to compile a list of runtime statistics for models and memory
 */
export class Statistics {
  private loadStatus: string | undefined
  private projectName: string | undefined
  private version: string | undefined
  private parseTime: number | undefined
  private geometryTime: number | undefined
  private totalTime: number | undefined
  private geometryMemory: number | undefined
  private preprocessorVersion: string | undefined
  private originatingSystem: string | undefined
  private memoryStatistics: string | undefined
  private productCount: number | undefined
  private geometryTypeCounts: Map<string, number> | undefined

  // Getters and setters

  /**
   *
   * @return {string | undefined} - load status or undefined
   */
  getLoadStatus(): string | undefined {
    return this.loadStatus
  }

  /**
   *
   * @param value - load status
   */
  setLoadStatus(value: string) {
    this.loadStatus = value
  }

  /**
   *
   * @return {string | undefined} - project name or undefined
   */
  getProjectName(): string | undefined {
    return this.projectName
  }

  /**
   *
   * @param value - project name
   */
  setProjectName(value: string) {
    this.projectName = value
  }

  /**
   *
   * @return {string | undefined} - version or undefined
   */
  getVersion(): string | undefined {
    return this.version
  }

  /**
   *
   * @param value - version
   */
  setVersion(value: string) {
    this.version = value
  }

  /**
   *
   * @return {number | undefined} - parse time or undefined
   */
  getParseTime(): number | undefined {
    return this.parseTime
  }

  /**
   *
   * @param value - parse time
   */
  setParseTime(value: number) {
    this.parseTime = value
  }

  /**
   *
   * @return {number | undefined} - geometry parse time or undefined
   */
  getGeometryTime(): number | undefined {
    return this.geometryTime
  }

  /**
   *
   * @param value - geometry parse time
   */
  setGeometryTime(value: number) {
    this.geometryTime = value
  }

  /**
   *
   * @return {number | undefined} - total execution time or undefined
   */
  getTotalTime(): number | undefined {
    return this.totalTime
  }

  /**
   *
   * @param value - total execution time
   */
  setTotalTime(value: number) {
    this.totalTime = value
  }

  /**
   *
   * @return {number | undefined} - geometry memory or undefined
   */
  getGeometryMemory(): number | undefined {
    return this.geometryMemory
  }

  /**
   *
   * @param value - geometry memory
   */
  setGeometryMemory(value: number) {
    this.geometryMemory = value
  }

  /**
   *
   * @return {string | undefined} - preprocessor version or undefined
   */
  getPreprocessorVersion(): string | undefined {
    return this.preprocessorVersion
  }

  /**
   *
   * @param value - preprocessor version
   */
  setPreprocessorVersion(value: string) {
    this.preprocessorVersion = value
  }

  /**
   *
   * @return {string | undefined} - originating system or undefined
   */
  getOriginatingSystem(): string | undefined {
    return this.originatingSystem
  }

  /**
   *
   * @param value - originating system
   */
  setOriginatingSystem(value: string) {
    this.originatingSystem = value
  }

  /**
   *
   * @return {string | undefined} - memory statistics or undefined
   */
  getMemoryStatistics(): string | undefined {
    return this.memoryStatistics
  }

  /**
   *
   * @param value - memory statistics
   */
  setMemoryStatistics(value: string) {
    this.memoryStatistics = value
  }

  /**
   *
   * @return {number | undefined} - number of products extracted
   */
  getProductCount(): number | undefined {
    return this.productCount
  }

  /**
   *
   * @param value - number of products extracted
   */
  setProductCount(value: number) {
    this.productCount = value
  }

  /**
   *
   * @return {Map<string, number> | undefined} - geometry type breakdown
   * (entity type name -> count of unique geometry definitions extracted)
   */
  getGeometryTypeCounts(): Map<string, number> | undefined {
    return this.geometryTypeCounts
  }

  /**
   *
   * @param value - geometry type breakdown map
   */
  setGeometryTypeCounts(value: Map<string, number>) {
    this.geometryTypeCounts = value
  }

  /**
   * Format the geometry-type breakdown as a compact sorted list, e.g.
   * "IFCEXTRUDEDAREASOLID×3421 IFCFACETEDBREP×212 (+3 more)".
   *
   * @param maxEntries - cap on listed types (rest summarized)
   * @return {string | undefined} the formatted breakdown, if any
   */
  // eslint-disable-next-line no-magic-numbers
  formatGeometryTypeCounts(maxEntries: number = 12): string | undefined {
    if (this.geometryTypeCounts === void 0 || this.geometryTypeCounts.size === 0) {
      return void 0
    }

    const sorted = Array.from(this.geometryTypeCounts.entries())
        .sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1])

    const shown = sorted.slice(0, maxEntries)
        .map(([name, count]) => `${name}×${count}`)
        .join(' ')

    const remainder = sorted.length - maxEntries

    return remainder > 0 ? `${shown} (+${remainder} more)` : shown
  }

  /**
   * prints statistics
   */
  printStatistics(): void {
    console.log(this.format())
  }

  /**
   * Format the load-summary line (Logger routes this through its sink so
   * the CLI can keep stdout clean — issue #301).
   *
   * @return {string} the single-line load summary
   */
  format(): string {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    }

    const dateString = date.toLocaleDateString('en-US', options).replace(/,/g, '')
    const versionMatch = versionString.match(/v(\d+\.\d+\.\d+)/)
    let conwayVersionNumber: string

    if (versionMatch !== null) {
      conwayVersionNumber = versionMatch[1]
    } else {
      conwayVersionNumber = 'Version Not Found'
    }

    let versionStr:string
    if (this.version !== void 0) {
      const match = this.version.match(/'([^']+)'/)
      if (match) {
        versionStr = match[1]
      } else {
        versionStr = 'No match found'
      }
    } else {
      versionStr = 'Version not defined'
    }

    const products = this.productCount !== void 0 ?
      `Products: ${this.productCount}, ` : ''
    const breakdown = this.formatGeometryTypeCounts()
    const geometryTypes = breakdown !== void 0 ? `, Geometry Types: ${breakdown}` : ''

    return `[${dateString}]: Load Status: ${this.loadStatus}, ` +
            `Project Name: ${this.projectName}, Version: ${versionStr}, ` +
            `Conway Version: ${conwayVersionNumber}-${wasmType}, ` +
            `Parse Time: ${this.parseTime} ms, Geometry Time: ${this.geometryTime} ms, ` +
            `Total Time: ${this.totalTime} ms, ` +
            `Geometry Memory: ${this.geometryMemory?.toFixed(3)} MB, ` +
            products +
            `Memory Statistics: ${this.memoryStatistics}, ` +
            `Preprocessor Version: ${this.preprocessorVersion}, ` +
            `Originating System: ${this.originatingSystem}` +
            geometryTypes
  }
}
