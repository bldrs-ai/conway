#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ifcGenPath = path.resolve(__dirname, '../external/IFC-gen-internal');

// The generator revision this repo's checked-in *.gen.ts were produced by.
// Step it forward deliberately, in a PR that also carries the regenerated
// output, so the two never disagree.
//
// This used to follow whatever the default branch happened to be, and that
// silently rotted: main sat 14 months behind the branch that actually
// generated our code (no multiReference support), so running `yarn code-gen`
// would have rewritten ~966 files and DELETED that support, with nothing to
// warn you. Verified at this SHA: regenerating both schemas reproduces the
// checked-in output byte for byte, 1111 AP214 files and 1180 IFC4 files, zero
// differences.
const IFC_GEN_REVISION = 'c001505abd849e8be826ce61b0f7db0e6b6d82f4';

function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  // Get the makeCommand argument from the command line
  let [,, makeCommand] = process.argv;

  if (!makeCommand) {
    console.error('Please provide a make command as an argument.');
    process.exit(1);
  }

  // Check if IFC-gen-internal directory exists
  if (!fs.existsSync(ifcGenPath)) {
    console.log('IFC-gen-internal not found. Attempting to clone...');
    const cloneCommand = `git clone https://github.com/bldrs-ai/IFC-gen-internal.git ${ifcGenPath}`;
    if (!runCommand(cloneCommand)) {
      console.log('Could not clone IFC-gen-internal. Please ensure you have access rights.');
      process.exit(0); // Exit gracefully
    }
  }

  // Pin every run, not just a fresh clone: an existing checkout is whatever
  // the last person left it at, and generating from that is how the output
  // drifts from what the pin claims produced it.
  console.log(`Checking out IFC-gen-internal at ${IFC_GEN_REVISION}...`);

  if (!runCommand(`git fetch --depth 1 origin ${IFC_GEN_REVISION}`, { cwd: ifcGenPath }) ||
      !runCommand(`git checkout --detach ${IFC_GEN_REVISION}`, { cwd: ifcGenPath })) {
    console.error(
      `Could not check out IFC-gen-internal at ${IFC_GEN_REVISION}. ` +
      'Refusing to generate from an unknown revision.');
    process.exit(1);
  }

  // Run the code generation
  console.log('Running code generation...');
  const options = { cwd: ifcGenPath };

  if ( process.platform === 'win32' ) {
    // For Windows, we need to use cmd.exe to run the batch file
    makeCommand = makeCommand.replace(/'/g, '"') // Replace single quotes with double quotes for Windows compatibility
  }

  if (!runCommand(makeCommand, options)) {
    console.error('Code generation failed.');
    process.exit(1); // Exit with error code
  } else {
    console.log('Code generation completed successfully.');
  }
}

main();
