#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { versionCompare } = require("./version_order.cjs");

//
// Helper: parse out the version from "conway0.9.789_test-models",
// "conway1.1556.546-g3eae7637_test-models" or "webifc1.4_test-models-private",
// returning "0.9.789", "1.1556.546-g3eae7637" or "1.4".
// Returns null if no match.
//
// The optional `-<suffix>` group is load-bearing, not defensive. Since
// conway#533 every published version carries a `-g<shorthash>` prerelease, and
// benchmark.cjs names the output directory from the installed package version
// VERBATIM. Without the group, `conway1.1556.546-g3eae7637_test-models` failed
// to match and the directory was dropped from discovery entirely -- silently,
// leaving this tool to compare two stale pre-change directories or to bail
// with "Need at least two". Blessed rc snapshots (`conway<version>-ci_<repo>`,
// written by bless_perf_snapshot.cjs) carry a suffix too. They are now
// RECOGNISED here rather than mis-parsed, but discoverEngineDirs() below still
// excludes them from selection -- see the comment there.
//
// The FULL version including the suffix is returned, because it names the
// delta CSVs written below and those must match the directory they describe.
// Ordering is versionCompare's problem, not this function's.
//
function parseVersion(dirName) {
  const version = /(\d+(?:\.\d+)*(?:-[0-9A-Za-z.-]+)?)(?:_test-models.*)?$/;

  // 1) Try conway
  let match = dirName.match(new RegExp(`^conway${version.source}`));
  if (match) return match[1];

  // 2) Try webifc
  match = dirName.match(new RegExp(`^webifc${version.source}`));
  if (match) return match[1];

  return null;
}

//
// Is `version` a blessed rc snapshot, i.e. one written by
// bless_perf_snapshot.cjs as `conway<version>-ci_<repo>`?
//
// The suffix may be the whole prerelease (`1.543.1513-ci`) or the tail of it,
// since a version that already carries `-g<shorthash>` gains `-ci` after it
// (`1.1556.546-g3eae7637-ci`).
//
function isBlessedSnapshot(version) {
  return version === "ci" || version.endsWith("-ci");
}

//
// Group benchmark directory names into sorted conway and webifc lists,
// oldest first.
//
// Blessed rc snapshots are excluded from the conway list deliberately and
// provisionally, preserving the pre-conway#533 behaviour while the question of
// whether they should participate is settled: https://github.com/bldrs-ai/conway/issues/614
// (remove this filter to change it, not the regex, which is already correct).
//
function discoverEngineDirs(names) {
  const conwayDirs = [];
  const webifcDirs = [];

  for (const name of names) {
    const version = parseVersion(name);
    if (!version) continue; // not a conway/webifc dir we recognize

    if (name.startsWith("conway")) {
      if (isBlessedSnapshot(version)) continue;
      conwayDirs.push({ name, version });
    } else if (name.startsWith("webifc")) {
      webifcDirs.push({ name, version });
    }
  }

  // Sort by version ascending
  conwayDirs.sort((a, b) => versionCompare(a.version, b.version));
  webifcDirs.sort((a, b) => versionCompare(a.version, b.version));

  return { conwayDirs, webifcDirs };
}

//
// Main logic
//
function main() {
  // Require a single argument: the parent folder root (e.g. test-models or test-models-private).
  if (process.argv.length < 3) {
    console.error(`Usage: node ${path.basename(process.argv[1])} /path/to/test-models(or test-models-private)`);
    process.exit(1);
  }

  // Append /benchmarks to the baseDir we were given
  const baseRoot = path.resolve(process.argv[2]);
  const baseDir = path.join(baseRoot, "benchmarks");

  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
    console.error(`Error: '${baseDir}' is not a valid directory (no "benchmarks" subfolder?)`);
    process.exit(1);
  }

  // Read all entries in the /benchmarks directory
  const allEntries = fs.readdirSync(baseDir, { withFileTypes: true });

  const { conwayDirs, webifcDirs } = discoverEngineDirs(
    allEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  );

  // Check we have at least two conway directories
  if (conwayDirs.length < 2) {
    console.error("Error: Need at least two 'conway' directories for the delta comparison.");
    process.exit(1);
  }

  const secondNewestConway = conwayDirs[conwayDirs.length - 2];
  const newestConway = conwayDirs[conwayDirs.length - 1];

  console.log("Second newest conway:", secondNewestConway.name, "(version:", secondNewestConway.version + ")");
  console.log("Newest conway:", newestConway.name, "(version:", newestConway.version + ")");

  // Paths to performance-detail.csv in each conway folder
  const secondNewestPerf = path.join(baseDir, secondNewestConway.name, "performance-detail.csv");
  const newestPerf = path.join(baseDir, newestConway.name, "performance-detail.csv");

  // Validate presence of the CSVs
  if (!fs.existsSync(secondNewestPerf)) {
    console.error("Error: Missing performance-detail.csv in", secondNewestConway.name);
    process.exit(1);
  }
  if (!fs.existsSync(newestPerf)) {
    console.error("Error: Missing performance-detail.csv in", newestConway.name);
    process.exit(1);
  }

  //
  // Run gen_delta_csv.cjs for the two newest conway versions
  //
  const conwayDeltaName = `conway${secondNewestConway.version}_${newestConway.version}_delta.csv`;
  const conwayDeltaOut = path.join(baseDir, newestConway.name, conwayDeltaName);

  console.log("\n>> Generating conway delta:", conwayDeltaName);
  try {
    execSync(
      `node gen_delta_csv.cjs "${secondNewestPerf}" "${newestPerf}" "${conwayDeltaOut}"`,
      { stdio: "inherit" }
    );
  } catch (err) {
    console.error("Failed to run gen_delta_csv.cjs for conway versions:\n", err);
    process.exit(1);
  }

  console.log("Conway delta CSV stored in:", conwayDeltaOut);

  //
  // For each webifc directory, run gen_delta_csv.cjs <webifcVersion> <conwayNewVersion> output.csv isWebIfc
  //
  if (webifcDirs.length === 0) {
    console.log("\nNo webifc directories found; skipping webifc comparison.");
    return;
  }

  console.log("\n>> Generating webifc -> conway deltas...");
  for (const wdir of webifcDirs) {
    const wver = wdir.version;
    const outName = `webifc${wver}_conway${newestConway.version}_delta.csv`;
    const outPath = path.join(baseDir, newestConway.name, outName);
    const webifcPerfPath = path.join(baseDir, wdir.name, "performance-detail.csv");
    const conwayPerfPath = path.join(baseDir, newestConway.name, "performance-detail.csv");


    console.log(`\nComparing webifc${wver} vs conway${newestConway.version}:`, outName);
    try {
      execSync(
        `node gen_delta_csv.cjs "${webifcPerfPath}" "${conwayPerfPath}" "${outPath}" isWebIfc`,
        { stdio: "inherit" }
      );
      console.log("   Stored:", outPath);
    } catch (err) {
      console.error(`Failed to run gen_delta_csv.cjs for webifc${wver}:\n`, err);
      process.exit(1);
    }
  }

  console.log("\nAll delta CSVs generated in:", path.join(baseDir, newestConway.name));
}

// Guarded so the unit test can require this module for parseVersion /
// versionCompare without the CLI running against process.argv.
if (require.main === module) {
  main();
}

module.exports = {
  parseVersion, versionCompare, isBlessedSnapshot, discoverEngineDirs,
};
