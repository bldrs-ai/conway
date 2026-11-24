#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ifcGenPath = path.resolve(__dirname, '../external/IFC-gen-internal');

// Schemas conway vendors itself rather than relying on IFC-gen-internal to
// ship them (phase 1 of #280 deliberately left the generator schema-name
// agnostic without adding one there — the generator repo takes a path, not
// an opinion on where schemas live). IFC4X3_ADD2.exp is a ~400 KB EXPRESS
// file, and fetching it live at codegen time would make a build depend on
// standards.buildingsmart.org being reachable; vendoring it here keeps
// codegen reproducible offline, in keeping with the revision pin above.
// Copied into the checkout's schemas/ dir below because that's where the
// Makefile's `SCHEMA=$(CURR_DIR)/schemas/$(SCHEMA_INPUT).exp` looks for it.
const vendoredSchemasPath = path.resolve(__dirname, 'schemas');

// The generator revision this repo's checked-in *.gen.ts were produced by.
// Step it forward deliberately, in a PR that also carries the regenerated
// output, so the two never disagree.
//
// This used to follow whatever the default branch happened to be, and that
// silently rotted: main sat 14 months behind the branch that actually
// generated our code (no multiReference support), so running `yarn code-gen`
// would have rewritten ~966 files and DELETED that support, with nothing to
// warn you. Verified at c001505 (the previous pin): regenerating both
// schemas reproduces the checked-in output byte for byte, 1111 AP214 files
// and 1180 IFC4 files, zero differences.
//
// Bumped to 7120675 for bldrs-ai/conway#280 phase 2a (IFC4X3 support):
// bldrs-ai/IFC-gen-internal#3 makes the generator accept any EXPRESS schema
// name (previously hardcoded to IFC/AP214E3_2010) and stops the lexer
// swallowing a unary minus in an EXPRESS default-value expression — needed
// for IFC4X3_ADD2.exp, which the older generator could not read at all.
// Re-verified at this SHA: regenerating IFC4 and AP214 at the new revision
// reproduces the checked-in output byte for byte, zero differences — the
// bump is inert for the schemas it doesn't touch. It also newly generates
// src/ifc/ifc4x3_gen/ (see code-gen-ifc4x3 below), which c001505 could not
// produce.
//
// Bumped to 9b439d4 for #280 phase 2a: fixes the two generator bugs that
// 7120675's ifc4x3_gen/ output needed by-hand patches to work around
// (IfcPoint/IfcSIUnit/IfcSegment and the schema_ifc4x3 descriptions typing),
// plus two review hardenings from that fix's review round. Regenerating
// IFC4X3 at this revision reproduces the previously hand-patched output
// with no hand patches needed; IFC4 and AP214 stay byte-for-byte reproduced
// except for a 10-file AP214 import-name reordering (see the AP214
// re-bless commit).
const IFC_GEN_REVISION = '9b439d49c4980fb4f4a702c71e838d46126c3c34';

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

  // Copy conway's vendored schemas into the freshly-checked-out clone every
  // run — the checkout above can land on a commit that never shipped a
  // given schema (IFC4X3_ADD2.exp is not in IFC-gen-internal at all), and a
  // stale copy left over from a previous run would silently generate from
  // the wrong bytes.
  const genSchemasDir = path.join(ifcGenPath, 'schemas');

  for (const fileName of fs.readdirSync(vendoredSchemasPath)) {
    fs.copyFileSync(
      path.join(vendoredSchemasPath, fileName),
      path.join(genSchemasDir, fileName));
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
