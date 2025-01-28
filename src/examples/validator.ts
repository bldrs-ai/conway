import { exit } from 'process'
import IfcStepParser from '../ifc/ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import EntityTypesIfc from '../ifc/ifc4_gen/entity_types_ifc.gen'
import yargs from 'yargs/yargs'
import fs from 'fs'
import StepEntityBase from '../step/step_entity_base'
import IfcStepModel from '../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../ifc/ifc_geometry_extraction'
import { IfcPropertyExtraction } from '../ifc/ifc_property_extraction'
import { ConwayGeometry }
  from '../../dependencies/conway-geom'
import { IfcSceneBuilder } from '../ifc/ifc_scene_builder'
import GeometryConvertor from '../core/geometry_convertor'
import GeometryAggregator from '../core/geometry_aggregator'
import Logger from '../logging/logger'
import Environment from '../utilities/environment'
import Memory from '../memory/memory'
import { ExtractResult } from '../core/shared_constants'
import path from 'path'
import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

// 1. Grab the path to the model from the command line arguments
//    e.g., user ran: node validator.js /path/to/model.ifc
// create a model ID
const modelID: number = 0

Environment.checkEnvironment()
Logger.initializeWasmCallbacks()
const modelPath = process.argv[2];
if (!modelPath) {
  console.error('Usage: validator <path_to_model>.ifc');
  process.exit(1);
}

// 3. Define the completer function signature for TypeScript:
//    The function should return a tuple: [string[], string].
function completer(line: string): [string[], string] {
  // The user's entire typed line could be something like "IfcW < 5"
  // We'll focus on completing only the first token:
  const tokens = line.trim().split(/\s+/);
  const firstToken = tokens[0] || '';

  // Filter which classes start with the currently typed first token (case-insensitive)
  const hits = ifcClasses.filter(cls =>
    cls.toLowerCase().startsWith(firstToken.toLowerCase())
  );

  // If we found hits, return them; otherwise return the whole list as a fallback
  // The second element of the tuple is the text to replace
  return [hits.length ? hits : ifcClasses, firstToken];
}

// 4. Create the readline interface with the custom completer
//    Note: Must set terminal: true to see the prompt properly, or rely on default
const rl = readline.createInterface({
  input,
  output,
  prompt: '> ',
  completer,
});


let indexIfcBuffer: Buffer | undefined
try {
  indexIfcBuffer = fs.readFileSync(modelPath)
} catch (ex) {
  Logger.error(
      'Couldn\'t read file, check that it is accessible at the specified path.')
  exit()
}

if (indexIfcBuffer === void 0) {
  Logger.error(
      'Couldn\'t read file, check that it is accessible at the specified path.')
  exit()
}

// create a statistics object
Logger.createStatistics(modelID)

const parser = IfcStepParser.Instance
const bufferInput = new ParsingBuffer(indexIfcBuffer)

const headerDataTimeStart = Date.now()

const [stepHeader, result0] = parser.parseHeader(bufferInput)

const headerDataTimeEnd = Date.now()

switch (result0) {
  case ParseResult.COMPLETE:

    break

  case ParseResult.INCOMPLETE:

    Logger.warning('Parse incomplete but no errors')
    break

  case ParseResult.INVALID_STEP:

    Logger.error('Invalid STEP detected in parse, but no syntax error detected')
    break

  case ParseResult.MISSING_TYPE:

    Logger.error('Missing STEP type, but no syntax error detected')
    break

  case ParseResult.SYNTAX_ERROR:

    Logger.error(`Syntax error detected on line ${bufferInput.lineCount}`)
    break

  default:
}

const [result1, model] = parser.parseDataToModel(bufferInput)

switch (result1) {
  case ParseResult.COMPLETE:

    break

  case ParseResult.INCOMPLETE:

    Logger.warning('Parse incomplete but no errors')
    break

  case ParseResult.INVALID_STEP:

    Logger.error('Invalid STEP detected in parse, but no syntax error detected')
    break

  case ParseResult.MISSING_TYPE:

    Logger.error('Missing STEP type, but no syntax error detected')
    break

  case ParseResult.SYNTAX_ERROR:

    Logger.error(`Syntax error detected on line ${bufferInput.lineCount}`)
    break

  default:
}

if (model === void 0) {
  Logger.error(`Model not loaded.`)
}

// Assuming `model?.types()` returns an IterableIterator of instances
const typeInstances = model?.types?.() || [];

model.

// Extracting the type names into a string array
const typeNames: string[] = Array.from(typeInstances).map((instance) => instance.constructor.name);

// 5. Print some info and start prompting
console.log(`Loaded model: ${modelPath}`);
console.log('Type an IFC class name (partial) and press Tab for completion.');
console.log('Example: "IfcW" <Tab>\n');

rl.prompt();

// 6. Listen for user input lines
rl.on('line', (inputLine: string) => {
  const command = inputLine.trim();

  // Parse the command. For instance, "IfcWindow < 5"
  const tokens = command.split(/\s+/);
  const ifcClass = tokens[0];
  const operator = tokens[1]; // e.g. '<', '>'
  const value = tokens[2];    // e.g. '5'

  // Check if first token matches one of our known IFC classes
  if (ifcClasses.includes(ifcClass)) {
    // If there's an operator and a value, interpret
    if (operator && value) {
      console.log(
        `You want to filter all ${ifcClass} where property is ${operator} ${value}`
      );
      // ... Insert your real validation logic here ...
    } else {
      console.log(`You typed an IFC class: ${ifcClass}, but no operator/value.`);
    }
  } else if (command === 'exit') {
    console.log('Goodbye!');
    process.exit(0);
  } else {
    console.log(`Unknown input: "${command}"`);
  }

  rl.prompt();
});

// 7. Handle Ctrl+C (SIGINT) gracefully
rl.on('SIGINT', () => {
  console.log('\nCaught interrupt signal. Exiting.');
  process.exit(0);
});


