// runProfile.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure an argument is provided
if (process.argv.length < 3) {
  console.error('Usage: node runProfile.js <your-argument>');
  process.exit(1);
}

const additionalArg = process.argv[2];
const filename = path.parse(additionalArg).name;
const logFilename = `${filename}.log`;

// Build the main Node command arguments
// Define environment variables (cross-platform friendly)
const env = { ...process.env, FORCE_SINGLE_THREAD: 'true' };

// Build the main Node command arguments
const mainArgs = [
  '--prof',
  `--logfile=${logFilename}`,  // Dynamically set log filename
  '--no-logfile-per-isolate',
  '--experimental-specifier-resolution=node',
  './compiled/src/ifc/ifc_command_line_main.js',
  additionalArg, // Append the argument here
  '-g',
  '-n',
];

console.log('Executing main Node CLI command with profiling...');
const mainProcess = spawn('node', mainArgs, { stdio: 'inherit', env });

mainProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Main command exited with code ${code}`);
    process.exit(code);
  }
  console.log('\nMain command completed. Processing profile log...\n');

  const logFile = `./${logFilename}`;

  const processArgs = ['--prof-process', '--preprocess', '-j', logFile];

  const profProcess = spawn('node', processArgs, { stdio: ['ignore', 'pipe', 'inherit'] });
  
  let jsonOutput = '';
  profProcess.stdout.on('data', (data) => {
    jsonOutput += data.toString();
  });
  
  profProcess.on('exit', (code2) => {
    if (code2 !== 0) {
      console.error(`prof-process command exited with code ${code2}`);
      process.exit(code2);
    }

    const outputFilename = `${filename}-flamegraph.json`;
    
    // Save the JSON output manually
    fs.writeFileSync(outputFilename, jsonOutput);
    console.log(`\nProfile processed and output saved to ./${outputFilename}`);
  });
});
