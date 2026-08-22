import fs from 'fs'
import path from 'path'
import { describe, expect, test } from '@jest/globals'


/**
 * One wasm engine per regression child, and it is the engine the extraction
 * runs against (conway#557).
 *
 * The IFC child used to initialise a `ConwayGeometry` in `main()` and then
 * construct a *second* one inside `geometryExtraction`. The extraction ran
 * against the second; `dumpAllocTelemetry` — and, later, `peakWasmHeapMb` —
 * reported on the first, which never did any work. Measured on MB-Khaya
 * before the fix: telemetry engine 16,777,216 bytes of untouched initial
 * arena, extraction engine 106,496,000 bytes, `sameObject=false`. The second
 * engine was also created after `settleAndSampleMemoryForPerf` took the
 * pre-load baseline, so its whole footprint landed inside the retention
 * window and put a ~55-60 MB constant into every IFC `retainedRssMb`.
 *
 * This is asserted against the SOURCE TEXT rather than by running the
 * children, because both are process entry points: they call `main()` at
 * module scope and drive `yargs` off `process.argv`, so importing either one
 * from a test starts a regression run. The property is structural — how many
 * engines the file builds and which one every consumer names — so the text is
 * where it can be checked at all. A runtime equivalent would need the child
 * to expose its engines, which is a larger change to production code than the
 * defect warrants.
 */
describe('regression children use a single wasm engine', () => {

  // Resolved from the repo root rather than relative to this file: the test
  // runs from compiled/src/ifc, and the TypeScript sources are not part of
  // the tsc output. Jest's rootDir is the repo root.
  const ifcSource =
    fs.readFileSync(
        path.resolve(process.cwd(), 'src/ifc/ifc_regression_main.ts'), 'utf8')
  const ap214Source =
    fs.readFileSync(
        path.resolve(
            process.cwd(),
            'src/AP214E3_2010/ap214_regression_main.ts'), 'utf8')

  /**
   * Count non-overlapping matches of a global pattern.
   *
   * @param source Text to search.
   * @param pattern Global regular expression to count matches of.
   * @return {number} Number of matches.
   */
  function countMatches(source: string, pattern: RegExp): number {
    return (source.match(pattern) ?? []).length
  }

  test('the IFC child constructs exactly one ConwayGeometry', () => {
    expect(countMatches(ifcSource, /new ConwayGeometry\(/g)).toBe(1)
  })

  test('the AP214 child constructs exactly one ConwayGeometry', () => {
    // The reference for what right looks like here; it has always had one.
    expect(countMatches(ap214Source, /new ConwayGeometry\(/g)).toBe(1)
  })

  test('the IFC extraction, telemetry and heap figure name one engine', () => {
    expect(ifcSource).toContain('new IfcGeometryExtraction(conwayGeom, model)')
    expect(ifcSource).toContain('conwayGeom.dumpAllocTelemetry(')
    expect(ifcSource).toContain('const wasmModule = conwayGeom.wasmModule')
  })

  test('the AP214 extraction, telemetry and heap figure name one engine', () => {
    expect(ap214Source)
        .toContain('new AP214GeometryExtraction(conwayGeom, model)')
    expect(ap214Source).toContain('conwayGeom.dumpAllocTelemetry(')
    expect(ap214Source).toContain('const wasmModule = conwayGeom.wasmModule')
  })
})
