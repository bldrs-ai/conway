"use strict";

/**
 * Ordering for the engine version strings that name benchmark directories.
 *
 * Shared by run_gen_deltas.cjs and bless_perf_snapshot.cjs so the two agree on
 * which snapshot is newer. Both previously hand-rolled
 * `split('.').map(Number)` and guarded each component with `|| 0`. Since
 * conway#533 every published version carries a `-g<shorthash>` prerelease, and
 * `Number('546-g3eae7637')` is NaN — which `|| 0` then coerced to 0, because
 * NaN is falsy. So the suffix did not make the comparison throw or return
 * "equal"; it made the LAST NUMERIC COMPONENT READ AS ZERO:
 *
 *   '1.1556.546-g3eae7637'  sorted as  1.1556.0
 *
 * which loses to any release with a higher patch. `1.1556.100` therefore
 * compared NEWER than `1.1556.546-g3eae7637`. A wrong ordering, silently, not
 * a degenerate one — every comparison still returned a definite -1/0/+1.
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
 * first, and on the shapes these tools produce they agree — but only on those
 * shapes, not in general. The fallback compares a prerelease as one opaque
 * string where semver compares it identifier by identifier, numerically where
 * an identifier is numeric, so the two disagree on e.g.
 * '1.0.0-a.9' vs '1.0.0-a.10' (semver -1, fallback +1). That is unreachable
 * here: a conway suffix is `g` + 8 hex digits, a single dot-free identifier,
 * and web-ifc versions carry no suffix at all. Widen the accepted shapes and
 * this stops being true.
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
