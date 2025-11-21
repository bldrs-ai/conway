#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ifcGenPath = path.resolve(__dirname, '../external/IFC-gen-internal');

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
