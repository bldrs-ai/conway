import path from 'path'
import { describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * Benchmark-directory discovery and ordering (scripts/run_gen_deltas.cjs and
 * the scripts/version_order.cjs comparator it shares with
 * bless_perf_snapshot.cjs).
 *
 * This is the cross-version delta tool the bless analysis depends on, and both
 * of its failure modes are SILENT — a directory that does not match is skipped
 * with no warning, and a version that does not parse compares equal to
 * everything rather than throwing. conway#533 introduced a `-g<shorthash>`
 * prerelease suffix on every published version, and benchmark.cjs names the
 * output directory from the installed package version verbatim, so both modes
 * were live. These cases pin the shapes that must keep working: the historical
 * two- and three-component names already on disk, the blessed `-ci` snapshots,
 * and the current suffixed scheme.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { parseVersion, versionCompare } =
  require_(path.resolve(process.cwd(), 'scripts/run_gen_deltas.cjs')) as {
    parseVersion: (dirName: string) => string | null,
    versionCompare: (a: string, b: string) => number,
  }

describe('parseVersion', () => {

  test('reads the historical conway names already on disk', () => {
    expect(parseVersion('conway0.7.727_test-models')).toBe('0.7.727')
    expect(parseVersion('conway0.23.940_test-models')).toBe('0.23.940')
    expect(parseVersion('conway1.594.1554_test-models-private'))
        .toBe('1.594.1554')
  })

  test('reads the conway#533 scheme, suffix included', () => {
    expect(parseVersion('conway1.1556.546-g3eae7637_test-models'))
        .toBe('1.1556.546-g3eae7637')
  })

  test('reads the blessed rc snapshot names', () => {
    expect(parseVersion('conway1.543.1513-ci_test-models')).toBe('1.543.1513-ci')
  })

  test('reads the two-component web-ifc names', () => {
    expect(parseVersion('webifc1.4_test-models-private')).toBe('1.4')
    expect(parseVersion('webifc0.0.67_test-models')).toBe('0.0.67')
  })

  test('returns null for entries that are not engine directories', () => {
    expect(parseVersion('README.md')).toBeNull()
    expect(parseVersion('index.html')).toBeNull()
    expect(parseVersion('conway')).toBeNull()
  })
})

describe('versionCompare', () => {

  test('orders by numeric component, not string order', () => {
    expect(versionCompare('0.9.789', '0.23.940')).toBeLessThan(0)
    expect(versionCompare('1.543.1513', '1.451.1357')).toBeGreaterThan(0)
    expect(versionCompare('1.0.0', '1.0.0')).toBe(0)
  })

  test('a suffixed version orders by its numbers, not as NaN', () => {
    // The regression: split('.').map(Number) made the third component NaN, so
    // both `<` and `>` were false and this returned 0 — "equal to everything".
    expect(versionCompare('1.594.1554', '1.1556.546-g3eae7637')).toBeLessThan(0)
    expect(versionCompare('1.1556.546-g3eae7637', '1.594.1554'))
        .toBeGreaterThan(0)
    expect(versionCompare('1.1556.546-g3eae7637', '1.1557.610-g9f81cd0a'))
        .toBeLessThan(0)
  })

  test('a prerelease sorts below the release with the same numbers', () => {
    expect(versionCompare('1.0.0-ci', '1.0.0')).toBeLessThan(0)
    expect(versionCompare('1.0.0', '1.0.0-ci')).toBeGreaterThan(0)
  })

  test('orders the two-component web-ifc shape, which is not valid semver', () => {
    expect(versionCompare('1.4', '1.10')).toBeLessThan(0)
    expect(versionCompare('1.4', '1.4')).toBe(0)
  })

  test('sorts a mixed listing oldest-first', () => {
    const versions = [
      '1.1556.546-g3eae7637', '0.7.727', '1.543.1513-ci', '0.23.940',
    ]

    expect([...versions].sort(versionCompare)).toEqual([
      '0.7.727', '0.23.940', '1.543.1513-ci', '1.1556.546-g3eae7637',
    ])
  })
})
