import path from 'path'
import { describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * Ordering for engine version strings (scripts/version_order.cjs).
 *
 * The bug this module replaced was NOT a NaN blowup. Both former comparators
 * guarded each component with `|| 0`, and NaN is falsy, so a suffixed
 * version's unparseable last component was coerced to 0 and every comparison
 * still returned a definite -1/0/+1 — `1.1556.546-g3eae7637` simply sorted as
 * `1.1556.0` and lost to any higher patch. These cases are chosen to
 * DISCRIMINATE against that behaviour rather than merely to pass: several of
 * them return the opposite sign under the old comparator, and others force the
 * numeric fallback that the conway shapes would otherwise never reach.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { versionCompare } =
  require_(path.resolve(process.cwd(), 'scripts/version_order.cjs')) as {
    versionCompare: (a: string, b: string) => number,
  }

/**
 * The pre-conway#533 comparator, kept verbatim as the mutation baseline.
 *
 * @param a Left version.
 * @param b Right version.
 * @return Negative if a < b, positive if a > b, 0 if equal — as the old code
 *   computed it, `|| 0` coercion and all.
 */
function legacyCompare(a: string, b: string): number {
  const aParts = a.split('.').map(Number)
  const bParts = b.split('.').map(Number)
  const len = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}

describe('versionCompare, against the bug it replaced', () => {

  test('orders a pair that differs ONLY in the suffixed component', () => {
    // The discriminating case. Under the old comparator the suffixed side read
    // as 1.1556.0, so 1.1556.100 won; the sign is inverted, not degenerate.
    expect(versionCompare('1.1556.100', '1.1556.546-g3eae7637')).toBeLessThan(0)
    expect(versionCompare('1.1556.546-g3eae7637', '1.1556.100'))
        .toBeGreaterThan(0)

    // Pin the old behaviour too, so this test documents what changed and
    // fails loudly if someone reintroduces it.
    expect(legacyCompare('1.1556.100', '1.1556.546-g3eae7637'))
        .toBeGreaterThan(0)
  })

  test('a suffixed version is not read as .0', () => {
    // 1.1556.546-g... vs 1.1556.1: old code made this a loss (0 < 1).
    expect(versionCompare('1.1556.546-g3eae7637', '1.1556.1')).toBeGreaterThan(0)
    expect(legacyCompare('1.1556.546-g3eae7637', '1.1556.1')).toBeLessThan(0)
  })

  test('the suffix does not make a version compare equal to its own numbers',
      () => {
        // The prerelease rule: same numbers, suffixed side is LOWER.
        expect(versionCompare('1.1556.546-g3eae7637', '1.1556.546'))
            .toBeLessThan(0)
      })
})

describe('versionCompare, semver path', () => {

  test('uses semver precedence where the fallback would disagree', () => {
    // semver compares prerelease identifier by identifier, numerically when an
    // identifier is numeric: a.9 < a.10. A single-string compare says the
    // opposite ('a.9' > 'a.10' lexically). Both inputs are valid semver, so
    // the fast path must win. Deleting it flips this.
    expect(versionCompare('1.0.0-a.9', '1.0.0-a.10')).toBeLessThan(0)
    expect(versionCompare('1.0.0-a.10', '1.0.0-a.9')).toBeGreaterThan(0)
  })

  test('orders the conway scheme across releases', () => {
    expect(versionCompare('1.594.1554', '1.1556.546-g3eae7637')).toBeLessThan(0)
    expect(versionCompare('1.1556.546-g3eae7637', '1.1557.610-g9f81cd0a'))
        .toBeLessThan(0)
    expect(versionCompare('0.7.727', '1.1556.546-g3eae7637')).toBeLessThan(0)
  })
})

describe('versionCompare, numeric fallback', () => {

  // Two-component web-ifc versions are not valid semver, so every case here
  // takes the fallback. Without them the fallback's prerelease branches are
  // never executed by any test.

  test('orders two-component versions numerically, not lexically', () => {
    expect(versionCompare('1.4', '1.10')).toBeLessThan(0)
    expect(versionCompare('1.10', '1.4')).toBeGreaterThan(0)
    expect(versionCompare('1.4', '1.4')).toBe(0)
  })

  test('a suffixed two-component version sorts below the bare one', () => {
    // Forces the `left.suffix === ''` / `right.suffix === ''` branches.
    expect(versionCompare('1.4-ci', '1.4')).toBeLessThan(0)
    expect(versionCompare('1.4', '1.4-ci')).toBeGreaterThan(0)
  })

  test('orders two suffixes against each other', () => {
    // Forces the final suffix-vs-suffix branch.
    expect(versionCompare('1.4-a', '1.4-b')).toBeLessThan(0)
    expect(versionCompare('1.4-b', '1.4-a')).toBeGreaterThan(0)
    expect(versionCompare('1.4-ci', '1.4-ci')).toBe(0)
  })

  test('numbers still decide before suffixes do', () => {
    // A lower number with the "higher" suffix must still lose.
    expect(versionCompare('1.4-z', '1.10-a')).toBeLessThan(0)
  })

  test('mixes a semver version with a non-semver one', () => {
    expect(versionCompare('1.4', '1.1556.546-g3eae7637')).toBeLessThan(0)
    expect(versionCompare('1.1556.546-g3eae7637', '1.4')).toBeGreaterThan(0)
  })

  test('a non-numeric component reads as zero rather than poisoning the sort',
      () => {
        // Exercises the Number.isFinite guard. Reading as 0 is a deliberate
        // floor, not a claim that the input is meaningful — see conway#615.
        expect(versionCompare('1.x.3', '1.5.3')).toBeLessThan(0)
        expect(versionCompare('1.5.3', '1.x.3')).toBeGreaterThan(0)
      })
})
