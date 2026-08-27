"use strict";

/**
 * Ordering for the engine version strings that name benchmark directories.
 *
 * Shared by run_gen_deltas.cjs and bless_perf_snapshot.cjs so the two agree on
 * which snapshot is newer. They diverged before conway#533: both hand-rolled
 * `split('.').map(Number)`, which yields NaN on any version carrying a
 * prerelease suffix, and NaN makes every `<` and `>` false — so a mis-parsed
 * version compared EQUAL to everything and sorted arbitrarily, silently.
 *
 * Two version shapes reach this module, and only one of them is semver:
 *
 *   1.1556.546-g3eae7637   conway, current scheme (a semver prerelease)
 *   1.543.1513-ci          conway, blessed rc snapshot (bless_perf_snapshot)
 *   0.7.727                conway, historical - benchmark dirs go back this far
 *   1.4                    web-ifc, two components, NOT valid semver
 *
 * So semver.compare is used where it applies and a numeric-component compare
 * backs it up where it does not. Both paths order by the numeric components
 * first, so the two never disagree about which release is newer.
 */

const semver = require('semver');

/**
 * Split a version into its numeric components and its prerelease suffix.
 *
 * @param {string} version e.g. '1.1556.546-g3eae7637', '1.4', '0.7.727'.
 * @return {{numbers: number[], suffix: string}} Numeric components in order,
 *   and the suffix WITHOUT its leading '-' ('' when there is none).
 */
function splitVersion(version) {
  const dash = version.indexOf('-');
  const numeric = dash === -1 ? version : version.slice(0, dash);
  const suffix = dash === -1 ? '' : version.slice(dash + 1);

  return {
    numbers: numeric.split('.').map((part) => {
      const value = Number(part);
      // A non-numeric component would reintroduce the NaN bug this module
      // exists to kill. Treat it as 0 rather than poisoning the comparison.
      return Number.isFinite(value) ? value : 0;
    }),
    suffix,
  };
}

/**
 * Compare two engine version strings, oldest first.
 *
 * Ordering is by numeric component ('0.9.789' < '0.23.940', not string order),
 * then by semver's prerelease rule: a version WITH a suffix sorts below the
 * same numbers without one ('1.0.0-ci' < '1.0.0').
 *
 * @param {string} a Left version.
 * @param {string} b Right version.
 * @return {number} Negative if a < b, positive if a > b, 0 if equal.
 */
function versionCompare(a, b) {
  // Fast path: both are full semver, so let semver own the whole ordering
  // including prerelease precedence. Two-component web-ifc versions ('1.4')
  // are not valid semver and fall through.
  if (semver.valid(a) && semver.valid(b)) {
    return semver.compare(a, b);
  }

  const left = splitVersion(a);
  const right = splitVersion(b);
  const len = Math.max(left.numbers.length, right.numbers.length);

  for (let i = 0; i < len; i++) {
    const diff = (left.numbers[i] || 0) - (right.numbers[i] || 0);
    if (diff !== 0) {
      return diff < 0 ? -1 : 1;
    }
  }

  if (left.suffix === right.suffix) {
    return 0;
  }
  // semver's rule: a prerelease sorts below the release with the same numbers.
  if (left.suffix === '') {
    return 1;
  }
  if (right.suffix === '') {
    return -1;
  }

  return left.suffix < right.suffix ? -1 : 1;
}

module.exports = { splitVersion, versionCompare };
