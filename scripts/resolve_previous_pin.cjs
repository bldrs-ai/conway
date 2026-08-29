#!/usr/bin/env node

'use strict';

/**
 * Name the engine the rc job should PAIR AGAINST, and where to get it.
 *
 * The `rebless` job now times two engines in one job — this release's build
 * and the previous release's — because a delta against a baseline frozen in a
 * previous run has a 13.66% median noise floor against a 9.40% median
 * reported regression (design/new/perf-run-comparability.md). Both halves
 * measured on one machine cancels that exactly.
 *
 * THE PREVIOUS PIN IS NOT A NEW CONCEPT, and that is the point of this file
 * existing at all rather than the workflow grepping the directory listing
 * itself. `bless_perf_snapshot.cjs` already picks a predecessor to write the
 * cross-run delta against — `findPreviousSnapshot()`, "the newest committed
 * `conway<version>-ci_<repo>` sorting strictly below the version being
 * blessed", ordered by `version_order.cjs`. If the paired pass picked its
 * engine by any other rule, the two deltas in one directory would silently
 * describe different comparisons while sharing a column layout. So this
 * DELEGATES to that same function; it does not reimplement the selection.
 *
 * WHAT IT ADDS is the translation from a blessed-snapshot name to an
 * installable npm version:
 *
 *   benchmarks/conway1.543.1513-ci_test-models   (directory, committed)
 *     -> engine   conway1.543.1513-ci            (what the delta calls it)
 *     -> npm      @bldrs-ai/conway@1.543.1513    (what the paired pass runs)
 *
 * The `-ci` suffix is bless_perf_snapshot's own marker for "measured by the
 * rc job", not part of any published version, so it is stripped. A version
 * that already carries a `-g<shorthash>` prerelease (conway#533) keeps it —
 * that IS published, and `1.1556.546-g3eae7637-ci` must resolve to
 * `1.1556.546-g3eae7637`, not to `1.1556.546`. Stripping only a trailing
 * `-ci` gets both cases right; parsing the version and re-rendering it would
 * not.
 *
 * Output is `key=value` lines for `>> "$GITHUB_OUTPUT"`, plus a human line on
 * stderr. When there is no predecessor — the first blessed release in a repo
 * — it prints `found=false` and exits 0. That is a real state, not an error:
 * the workflow skips the paired pass and blesses the snapshot as before.
 *
 * Usage:
 *   node scripts/resolve_previous_pin.cjs <models-checkout-root> <version> <repo-name>
 */

const fs = require('fs');
const path = require('path');

const { findPreviousSnapshot } = require('./bless_perf_snapshot.cjs');

/** Suffix bless_perf_snapshot.cjs appends to mark an rc-measured snapshot. */
const CI_SUFFIX = '-ci';

/**
 * The published npm version corresponding to a blessed snapshot's version.
 *
 * @param {string} version Version as parsed out of the directory name, e.g.
 *   '1.543.1513' or '1.1556.546-g3eae7637'.
 * @param {string} engine Full engine label, e.g. 'conway1.543.1513-ci'.
 * @return {string} The version to `npm install @bldrs-ai/conway@<this>`.
 */
function publishedVersion(version, engine) {
  // findPreviousSnapshot splits the name into a numeric `version` and drops
  // the suffix, so rebuild from the engine label instead: that is the only
  // place a `-g<shorthash>` prerelease survives, and it has to.
  const withoutPrefix = engine.replace(/^conway/, '');

  const stripped = withoutPrefix.endsWith(CI_SUFFIX) ?
    withoutPrefix.slice(0, -CI_SUFFIX.length) :
    withoutPrefix;

  // A directory with no version left after stripping means the name was not
  // what it looked like; fall back to the numeric part rather than emitting
  // an empty install target.
  return stripped === '' ? version : stripped;
}

/** Entry point. */
function main() {
  const [, , modelsRoot, version, repoName] = process.argv;

  if (!modelsRoot || !version || !repoName) {
    console.error(
      `Usage: node ${path.basename(process.argv[1])} ` +
      '<models-checkout-root> <conway-version> <repo-name>');
    process.exit(1);
  }

  const benchmarksDir = path.join(modelsRoot, 'benchmarks');
  // Spelled exactly as bless_perf_snapshot.cjs will spell it minutes later, so
  // the two agree on which directory is "self" and cannot pick different
  // predecessors for the paired pass and the cross-run delta.
  const selfDirName = `conway${version}${CI_SUFFIX}_${repoName}`;

  const previous = fs.existsSync(benchmarksDir) ?
    findPreviousSnapshot(benchmarksDir, selfDirName, version) :
    null;

  const lines = [];

  if (previous === null) {
    console.error(
      `No blessed snapshot below ${version} in ${benchmarksDir}; ` +
      'nothing to pair against.');
    lines.push('found=false');
  } else {
    const npmVersion = publishedVersion(previous.version, previous.engine);
    console.error(
      `Pairing against ${previous.engine} (dir ${previous.name}, ` +
      `npm @bldrs-ai/conway@${npmVersion}).`);
    lines.push('found=true');
    lines.push(`engine=${previous.engine}`);
    lines.push(`dir=${previous.name}`);
    lines.push(`version=${previous.version}`);
    lines.push(`npm_version=${npmVersion}`);
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { publishedVersion, CI_SUFFIX };
