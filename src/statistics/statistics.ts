import { versionString } from '../version/version'
import { wasmType } from '../../dependencies/conway-geom'

// Decimal places for the retained memory deltas in the load-summary line.
// Three, matching the other MB fields on THIS line (Geometry Memory, WASM
// Heap High-Water, and Memory.checkMemoryUsage's RSS/heap/external) — not the
// two the regression children's perf CSVs use. That is deliberate, and the
// two numbers are not in conflict: scripts/benchmark.cjs scrapes this line to
// fill the loader-path CSV, so this constant is what sets that path's
// precision, exactly as the existing 3-decimal fields already do. Lowering it
// to 2 for "parity" would silently drop a digit from every loader-path row.
const RETAINED_MB_PRECISION = 3

/**
 * Render one retention delta for the load-summary line.
 *
 * Two constraints on the spelling, and both are load-bearing.
 *
 * (1) The scrape in scripts/benchmark.cjs matches each memory quantity
 * NON-globally, so the FIRST occurrence in the log wins. `Heap Used: `,
 * `External: ` and `RSS ` followed by a number are already claimed by
 * peak/instant columns, so a retained line spelled `Retained Heap Used:`
 * would silently overwrite `heapUsedMb` with a delta. `Heap-Used` and the
 * trailing ` Delta:` break every one of those bindings — see the header
 * comment on DETAIL_COLUMNS in that file.
 *
 * (2) An absent measurement prints `N/A`, not a number and not `0`. A
 * retention delta is only meaningful between two settled samples; where
 * `global.gc` was not exposed the settle never ran, and emitting a zero (or
 * an unsettled difference) would read as "nothing retained" rather than
 * "not measured". Same failure #548 fixed in the delta writer.
 *
 * @param value The delta in MB, or undefined where the settle could not run.
 * @return {string} `-1.234 MB`, or `N/A`.
 */
function formatRetained(value: number | undefined): string {
  return value !== void 0 ?
    `${value.toFixed(RETAINED_MB_PRECISION)} MB` : 'N/A'
}

/**
 * Class to compile a list of runtime statistics for models and memory
 */
export class Statistics {
  private loadStatus: string | undefined
  private writer: string | undefined
  private projectName: string | undefined
  private version: string | undefined
  private parseTime: number | undefined
  private geometryTime: number | undefined
  private totalTime: number | undefined
  private geometryMemory: number | undefined
  private wasmHeapPeak: number | undefined
  private retainedRss: number | undefined
  private retainedHeapUsed: number | undefined
  private retainedExternal: number | undefined
  private preprocessorVersion: string | undefined
  private originatingSystem: string | undefined
  private memoryStatistics: string | undefined
  private productCount: number | undefined
  private geometryTypeCounts: Map<string, number> | undefined

  /**
   * Deflection-floor coverage: faces tessellated, and how many of those had
   * no representation extent. Both undefined on a load that never measured
   * it (IFC, or a model with no b-rep faces), which is what keeps the zero
   * case legible — see formatRepresentationExtentCoverage.
   */
  private extentMeasuredFaceCount: number | undefined

  private extentMissingFaceCount: number | undefined

  private extentDegenerateFaceCount: number | undefined

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
   * Which pipeline measured this row (conway#555).
   *
   * The perf columns are not all comparable across pipelines: the IFC
   * regression child runs with `RegressionCaptureState.memoization = FULL`,
   * which keeps CSG temporaries in the map `calculateGeometrySize()` sums,
   * so its `Geometry Memory` reads ~30% above the CLI's for the same model
   * (MB-Khaya, 22.3 vs 16.8 MB). Retention has a matching caveat — the
   * loader brings up a `ConwayGeometry` per load and the regression children
   * do not. Naming the writer is what lets a reader, and
   * `scripts/gen_delta_csv.cjs`, tell those apart instead of differencing
   * across them.
   *
   * @return {string | undefined} - the writer label, or undefined
   */
  getWriter(): string | undefined {
    return this.writer
  }

  /**
   *
   * @param value - a stable pipeline identifier, e.g. `ifc-cli`
   */
  setWriter(value: string) {
    this.writer = value
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
   * Wasm linear-memory high-water mark in MB, from wasmHeapByteLength.
   *
   * @return {number | undefined} - wasm heap high-water, or undefined
   */
  getWasmHeapPeak(): number | undefined {
    return this.wasmHeapPeak
  }

  /**
   * The wasm heap only ever grows, so a single reading of it IS the peak —
   * no sampling loop and no forced GC. It is a different quantity from
   * geometryMemory, and by a wide margin: on MB-Khaya an 8 MB live geometry
   * payload sits under an 85 MB wasm heap, the gap being allocator overhead,
   * fragmentation and the intermediate buffers a boolean leaves behind (see
   * src/ifc/geometry_residency.ts). Neither substitutes for the other.
   *
   * @param value - wasm heap high-water in MB
   */
  setWasmHeapPeak(value: number) {
    this.wasmHeapPeak = value
  }

  /**
   * RSS still held after the model was torn down, over a settled pre-load
   * baseline (conway#554).
   *
   * @return {number | undefined} - retained RSS in MB, or undefined where the
   * settle could not run
   */
  getRetainedRss(): number | undefined {
    return this.retainedRss
  }

  /**
   * Both samples behind this figure are settled (`gc(); await setImmediate();
   * gc()`) and both sit outside the timed region, so recording it costs the
   * timing columns nothing. Leave it undefined rather than passing an
   * unsettled difference: that is GC-timing noise, and it would be read as a
   * leak signal.
   *
   * @param value - retained RSS in MB, signed
   */
  setRetainedRss(value: number) {
    this.retainedRss = value
  }

  /**
   * V8 live heap still held after teardown, over the settled pre-load
   * baseline (conway#554).
   *
   * @return {number | undefined} - retained heapUsed in MB, or undefined
   * where the settle could not run
   */
  getRetainedHeapUsed(): number | undefined {
    return this.retainedHeapUsed
  }

  /**
   *
   * @param value - retained heapUsed in MB, signed
   */
  setRetainedHeapUsed(value: number) {
    this.retainedHeapUsed = value
  }

  /**
   * Off-heap bytes still held after teardown, over the settled pre-load
   * baseline (conway#554). This is where a released source buffer or parse
   * structure that is still pinned shows up; heapUsed cannot see them.
   *
   * @return {number | undefined} - retained external in MB, or undefined
   * where the settle could not run
   */
  getRetainedExternal(): number | undefined {
    return this.retainedExternal
  }

  /**
   *
   * @param value - retained external in MB, signed
   */
  setRetainedExternal(value: number) {
    this.retainedExternal = value
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
   * Record deflection-floor coverage for this load (bldrs-ai/conway#564 §5).
   *
   * @param measured - advanced faces tessellated
   * @param missing - of those, how many the representation walk never
   * reached (a defect)
   * @param degenerate - of those, how many belong to a representation whose
   * topological vertices carry no extent (a whole sphere; not a defect)
   */
  setRepresentationExtentCoverage(
      measured: number, missing: number, degenerate: number) {
    this.extentMeasuredFaceCount = measured
    this.extentMissingFaceCount = missing
    this.extentDegenerateFaceCount = degenerate
  }

  /**
   * Format the deflection-floor coverage, e.g.
   * "31681 faces, 0 unreached, 0 degenerate".
   *
   * The denominator is the point, and it is why this is one field rather
   * than two. `missing = 0` on its own cannot be told apart from a counter
   * that was never wired up, and this release train has already been bitten
   * by exactly that shape: the benchmark's `peakWasmHeapMb` assertion passed
   * for weeks while asserting nothing (#552). Printing "N faces, 0 without"
   * says both that the floor covered everything AND that N faces were
   * actually looked at; a load that measured nothing prints no field at all
   * rather than a zero that reads as a clean bill of health.
   *
   * `unreached` and `degenerate` are separate because they mean opposite
   * things: the first is a table that disagrees with extraction and wants
   * fixing, the second is a body whose topology genuinely carries no extent
   * (a whole sphere) and wants nothing.
   *
   * @return {string | undefined} the formatted coverage, if anything was
   * measured
   */
  formatRepresentationExtentCoverage(): string | undefined {
    if (this.extentMeasuredFaceCount === void 0 ||
        this.extentMissingFaceCount === void 0 ||
        this.extentDegenerateFaceCount === void 0 ||
        this.extentMeasuredFaceCount === 0) {
      return void 0
    }

    return `${this.extentMeasuredFaceCount} faces, ` +
      `${this.extentMissingFaceCount} unreached, ` +
      `${this.extentDegenerateFaceCount} degenerate`
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
    // Stamped versions carry a `-g<shorthash>` semver prerelease suffix
    // (see src/version/version.ts); keep it, it identifies the exact commit.
    const versionMatch = versionString.match(/v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/)
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
    const retained =
      `Retained RSS Delta: ${formatRetained(this.retainedRss)}, ` +
      `Retained Heap-Used Delta: ${formatRetained(this.retainedHeapUsed)}, ` +
      `Retained External Delta: ${formatRetained(this.retainedExternal)}, `
    const breakdown = this.formatGeometryTypeCounts()
    const geometryTypes = breakdown !== void 0 ? `, Geometry Types: ${breakdown}` : ''
    const coverage = this.formatRepresentationExtentCoverage()
    const extentCoverage =
      coverage !== void 0 ? `, Representation Extent: ${coverage}` : ''

    return `[${dateString}]: Load Status: ${this.loadStatus}, ` +
            `Writer: ${this.writer ?? 'N/A'}, ` +
            `Project Name: ${this.projectName}, Version: ${versionStr}, ` +
            `Conway Version: ${conwayVersionNumber}-${wasmType}, ` +
            `Parse Time: ${this.parseTime} ms, Geometry Time: ${this.geometryTime} ms, ` +
            `Total Time: ${this.totalTime} ms, ` +
            `Geometry Memory: ${this.geometryMemory?.toFixed(3)} MB, ` +
            `WASM Heap High-Water: ${this.wasmHeapPeak?.toFixed(3)} MB, ` +
            retained +
            products +
            `Memory Statistics: ${this.memoryStatistics}, ` +
            `Preprocessor Version: ${this.preprocessorVersion}, ` +
            `Originating System: ${this.originatingSystem}` +
            geometryTypes +
            extentCoverage
  }
}
