#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

//
// Helper: parse out the numeric version from "conway0.9.789_test-models"
// or "webifc1.4_test-models-private", returning "0.9.789" or "1.4".
// Returns null if no match.
//
function parseVersion(dirName) {
  // 1) Try conway
  let match = dirName.match(/^conway(\d+(?:\.\d+)*)(?:_test-models.*)?$/);
  if (match) return match[1];

  // 2) Try webifc
  match = dirName.match(/^webifc(\d+(?:\.\d+)*)(?:_test-models.*)?$/);
  if (match) return match[1];

  return null;
}

//
// Helper: compare two version strings "0.7.727" < "0.10.100" numerically.
//
function versionCompare(a, b) {
  // Split on '.' and compare numeric parts
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }

  return 0;
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

  // Separate Conway and WebIfc directories
  const conwayDirs = [];
  const webifcDirs = [];

  for (const entry of allEntries) {
    if (!entry.isDirectory()) continue;

    const name = entry.name;
    const version = parseVersion(name);
    if (!version) continue; // not a conway/webifc dir we recognize

    if (name.startsWith("conway")) {
      conwayDirs.push({ name, version });
    } else if (name.startsWith("webifc")) {
      webifcDirs.push({ name, version });
    }
  }

  // Sort by version ascending
  conwayDirs.sort((a, b) => versionCompare(a.version, b.version));
  webifcDirs.sort((a, b) => versionCompare(a.version, b.version));

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

main();
