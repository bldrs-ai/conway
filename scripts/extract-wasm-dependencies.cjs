#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

// Define the target directory relative to the current working directory
const targetDir = path.join(process.cwd(), 'dependencies', 'conway-geom', 'dependencies', 'wasm');

try {
  // Change the working directory to the target directory
  console.log("Extracting dependencies...");
  process.chdir(targetDir);
  console.log(`Changed directory to ${process.cwd()}`);
} catch (err) {
  console.error(`Failed to change directory: ${err}`);
  process.exit(1);
}

// Path to the zip file (assumed to be in the target directory)
const zipFile = path.join(targetDir, 'dependencies.zip');

// Check if the zip file exists
if (!fs.existsSync(zipFile)) {
  console.error(`Zip file not found: ${zipFile}`);
  process.exit(1);
}

try {
  // Create an instance of AdmZip and extract all contents
  const zip = new AdmZip(zipFile);
  // The second parameter 'true' forces overwrite of existing files.
  zip.extractAllTo(targetDir, true);
  console.log('Extraction complete.');
} catch (err) {
  console.error(`Error during extraction: ${err}`);
  process.exit(1);
}
