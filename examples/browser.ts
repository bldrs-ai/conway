import fs from 'fs'
import { exit } from 'process'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline'
import { EntityFieldDescription } from '../src/core/entity_field_description'
import IfcStepModel from '../src/ifc/ifc_step_model'
import IfcStepParser from '../src/ifc/ifc_step_parser'
import EntityTypesIfc from '../src/ifc/ifc4_gen/entity_types_ifc.gen'
import Logger from '../src/logging/logger'
import ParsingBuffer from '../src/parsing/parsing_buffer'
import { ParseResult } from '../src/step/parsing/step_parser'
import StepEntityBase from '../src/step/step_entity_base'
import Environment from '../src/utilities/environment'


/**
 * IFC Model Browser
 *
 * @see Browser.md
 */
// ---------------------------------------------------------------------
// 1. Grab the path to the model from command line arguments
// ---------------------------------------------------------------------
Environment.checkEnvironment()
Logger.initializeWasmCallbacks()
const modelPath = process.argv[2]
if (!modelPath) {
  console.error('Usage: browser <path_to_model>.ifc')
  process.exit(1)
}

// ---------------------------------------------------------------------
// 2. Load & Parse the IFC
// ---------------------------------------------------------------------
let indexIfcBuffer: Buffer | undefined
try {
  indexIfcBuffer = fs.readFileSync(modelPath)
} catch (ex) {
  Logger.error('Couldn\'t read file, check that it is accessible at the specified path.')
  exit()
}

if (indexIfcBuffer === void 0) {
  Logger.error('Couldn\'t read file, check that it is accessible at the specified path.')
  exit()
}

Logger.createStatistics(0)
const parser = IfcStepParser.Instance
const bufferInput = new ParsingBuffer(indexIfcBuffer)

// Parse header
// eslint-disable-next-line no-unused-vars
const [stepHeader, resultHeader] = parser.parseHeader(bufferInput)

// Parse main data
const [parseResult, model] = parser.parseDataToModel(bufferInput)

// Check parse result
switch (parseResult) {
  case ParseResult.COMPLETE:
    break
  case ParseResult.INCOMPLETE:
    Logger.warning('Parse incomplete but no errors')
    break
  case ParseResult.INVALID_STEP:
    Logger.error('Invalid STEP detected')
    break
  case ParseResult.MISSING_TYPE:
    Logger.error('Missing STEP type')
    break
  case ParseResult.SYNTAX_ERROR:
    Logger.error(`Syntax error at line ${bufferInput.lineCount}`)
    break
  default:
}

if (!model) {
  Logger.error('Model not loaded.')
  process.exit(1)
}

// ---------------------------------------------------------------------
// 3. Build arrays for IFC classes & entity types
// ---------------------------------------------------------------------
const nonEmptyTypeIDNoSubtypes = model.nonEmptyTypeIDs()
const ifcClasses: string[] = Array.from(nonEmptyTypeIDNoSubtypes || []).map(
    (item) => String(EntityTypesIfc[item]), // e.g. "IFCBUILDING", "IFCWINDOW"
)
const entityTypes: EntityTypesIfc[] = Array.from(nonEmptyTypeIDNoSubtypes || [])

// A helper to parse something like
// "IFCBUILDINGELEMENTPROXY[#30]" => { className: "IFCBUILDINGELEMENTPROXY", expressID: 30 }
/**
 * Parses a token containing a class name and an optional express ID.
 *
 * @param {string} token - The token to be parsed. Expected format: "CLASSNAME[#ID]".
 * @return {{ className: string, expressID?: number }}
 */
function parseClassAndOptionalID(token: string):
{ className: string; expressID?: number } {
  // e.g. IFCBUILDINGELEMENTPROXY[#30]
  const match = token.match(/^(.+)\[#(\d+)\]$/)
  if (match) {
    const className = match[1].toUpperCase()
    const expressID = parseInt(match[2], 10)
    return { className, expressID }
  }
  return { className: token.toUpperCase() }
}

// Gather suggestions like "IFCBUILDINGELEMENTPROXY[#30]" for each instance of a class
/**
 * Retrieves instance suggestions based on the specified class name within an IFC model.
 *
 * @param {string} clsName - The name of the class for which to retrieve suggestions.
 * @param {IfcStepModel} theModel - The IFC model containing class and entity information.
 * @return {string[]} An array of instance suggestions in the format "ClassName[#ID]".
 */
function getInstanceSuggestions(clsName: string, theModel: IfcStepModel): string[] {
  const idx = ifcClasses.indexOf(clsName)
  if (idx < 0) {
    return []
  }
  const elementTypeID = entityTypes[idx]
  const ctor = theModel.schema.constructors[elementTypeID]
  if (!ctor) {
    return []
  }

  const results: string[] = []
  for (const ent of theModel.types(ctor)) {
    // We'll assume ent.expressID is the numeric ID
    const stepId = (ent as any).expressID
    if (typeof stepId === 'number') {
      results.push(`${clsName}[#${stepId}]`)
    }
  }
  return results
}

// We build a 3-tuple for each field => [fieldName, fieldDescription, fieldData]
/**
 * Retrieves an array of local fields from the given IFC entity along with
 * their descriptions and associated data.
 *
 * @param {StepEntityBase<EntityTypesIfc>} entity - The IFC entity from which
 * to extract fields and their data.
 * @return {[string, EntityFieldDescription<EntityTypesIfc>, unknown][]}
 * An array of tuples, where each tuple contains:
 * - The field name as a string.
 * - The field description object.
 * - The associated data for the field.
 */
function getLocalFieldsWithData(
    entity: StepEntityBase<EntityTypesIfc>,
): [string, EntityFieldDescription<EntityTypesIfc>, unknown][] {
  return entity.orderedFields.map(([fieldName, fieldDesc]) => {
    // For this example, we assume dynamic property references the actual data
    const data = (entity as any)[fieldName]
    return [fieldName, fieldDesc, data]
  })
}

// The main recursive function that navigates dotted paths, now also supporting "Class[#ID]"
/**
 * Retrieves the value of a field or subfields from an IFC model by traversing a dotted path.
 *
 * @param {string} dottedPath - The path to the desired field,
 * with tokens separated by dots (e.g., "ClassName[#ID].fieldName").
 * @param {IfcStepModel} theModel - The IFC model containing class and entity information.
 * @return {{
 *   isEntity: boolean;
 *   subfieldNames: string[];
 *   value: any;
 * }} An object containing:
 * - `isEntity`: A boolean indicating whether the final value is an entity with subfields.
 * - `subfieldNames`: An array of subfield names if the final value is an entity,
 * otherwise an empty array.
 * - `value`: The value of the field if it is a primitive type, otherwise `null`.
 */
function getFieldValueOrSubfields(
    dottedPath: string,
    theModel: IfcStepModel,
): {
  isEntity: boolean;
  subfieldNames: string[];
  value: any;
} {
  const tokens = dottedPath.split('.')
  if (!tokens.length) {
    return { isEntity: false, subfieldNames: [], value: null }
  }

  // parse first token => e.g. "IFCBUILDINGELEMENTPROXY[#30]"
  const { className, expressID } = parseClassAndOptionalID(tokens[0])

  // find the class in ifcClasses
  const idx = ifcClasses.indexOf(className)
  if (idx < 0) {
    return { isEntity: false, subfieldNames: [], value: null }
  }
  const elementTypeID = entityTypes[idx]
  const ctor = theModel.schema.constructors[elementTypeID]
  if (!ctor) {
    return { isEntity: false, subfieldNames: [], value: null }
  }

  // If an ID is specified, find that particular entity; otherwise take the first instance
  let currentEntity: StepEntityBase<EntityTypesIfc> | null = null
  if (expressID !== undefined) {
    for (const e of theModel.types(ctor)) {
      if ((e as any).expressID === expressID) {
        currentEntity = e
        break
      }
    }
    if (!currentEntity) {
      // user specified e.g. "IFCBUILDINGELEMENTPROXY[#999]" but no such entity
      return { isEntity: false, subfieldNames: [], value: null }
    }
  } else {
    // no ID => pick first
    for (const e of theModel.types(ctor)) {
      currentEntity = e
      break
    }
    if (!currentEntity) {
      return { isEntity: false, subfieldNames: [], value: null }
    }
  }

  let currentValue: unknown = currentEntity

  // Navigate subfields for subsequent tokens
  for (let i = 1; i < tokens.length; i++) {
    const fieldName = tokens[i].toLowerCase()

    if (!currentValue || typeof currentValue !== 'object') {
      return { isEntity: false, subfieldNames: [], value: currentValue }
    }
    if (!('orderedFields' in currentValue)) {
      return { isEntity: false, subfieldNames: [], value: currentValue }
    }

    const entity = currentValue as StepEntityBase<EntityTypesIfc>
    const localFields = getLocalFieldsWithData(entity)

    const tuple = localFields.find(([fName]) => fName.toLowerCase() === fieldName)
    if (!tuple) {
      return { isEntity: false, subfieldNames: [], value: null }
    }

    // eslint-disable-next-line no-unused-vars
    const [foundName, foundDesc, foundData] = tuple
    if (foundData === null) {
      return { isEntity: false, subfieldNames: [], value: null }
    }

    // If it's an array, pick first item
    if (Array.isArray(foundData)) {
      currentValue = foundData.length ? foundData[0] : []
    } else {
      currentValue = foundData
    }
  }

  // If final value is an entity => gather subfields
  if (
    currentValue &&
    typeof currentValue === 'object' &&
    'orderedFields' in currentValue
  ) {
    const subEntity = currentValue as StepEntityBase<EntityTypesIfc>
    const subLocal = getLocalFieldsWithData(subEntity)
    const subfieldNames = subLocal.map(([fn]) => fn)
    return { isEntity: true, subfieldNames, value: null }
  }

  // Otherwise it's a primitive
  return { isEntity: false, subfieldNames: [], value: currentValue }
}

// ---------------------------------------------------------------------
// 4. The completer function
//    - No dot => also show instance suggestions like IFCBUILDINGELEMENTPROXY[#30]
//    - With dot => partial subfields
// ---------------------------------------------------------------------
/**
 * Provides autocomplete suggestions based on the user's input, which can include class names,
 * instance IDs, or subfields within IFC entities.
 *
 * @param {string} line - The current line of input entered by the user.
 * @return {[string[], string]} A tuple containing:
 * - An array of suggestions matching the user's input.
 * - The current token being matched, which can be a class name, partial ID, or subfield.
 */
function completer(line: string): [string[], string] {
  const trimmed = line.trim()

  // If there's whitespace, skip advanced completions
  if (trimmed.includes(' ')) {
    return [[], trimmed]
  }

  const tokens = trimmed.split('.')
  if (tokens.length === 1) {
    // ========== CASE A: top-level (no dot) ==========

    const partial = tokens[0].toLowerCase()

    // 1) Detect if user typed something like Class[# or Class[#3
    //    Example: "IFCPROPERTYSINGLEVALUE[#3"
    // eslint-disable-next-line no-useless-escape
    const bracketMatch = partial.match(/^([^\[]+)\[#(\d*)$/)
    if (bracketMatch) {
      // bracketMatch[1] => the class name (lowercased)
      // bracketMatch[2] => the partial ID number as a string (possibly empty)
      const partialClass = bracketMatch[1].trim() // e.g. "ifcpropertysinglevalue"
      // eslint-disable-next-line no-unused-vars
      const partialId = bracketMatch[2].trim()    // e.g. "3" (may be empty "" if user typed "[#")

      // Filter IFC classes by partialClass
      const classMatches = ifcClasses.filter((cls) =>
        cls.toLowerCase().startsWith(partialClass),
      )

      // For each matched class, gather instance suggestions, then filter out
      // only those that still match the entire typed string so far (including the bracket).
      let instanceMatches: string[] = []
      for (const cls of classMatches) {
        const allInstances = getInstanceSuggestions(cls, model!)
        // the user typed something like "ifcpropertysinglevalue[#3"
        // so we want to see which of our suggestions (e.g. "IFCPROPERTYSINGLEVALUE[#37]")
        // starts with exactly what the user typed
        instanceMatches = instanceMatches.concat(
            allInstances.filter((s) => s.toLowerCase().startsWith(partial)),
        )
      }

      // If no classes match, or if no instance suggestions match, you could choose to:
      //   1) fallback to all classes, or
      //   2) show nothing
      // For simplicity, let's show the instanceMatches if available; if none found,
      // fallback to the original classMatches.
      if (instanceMatches.length > 0) {
        return [instanceMatches, tokens[0]]
      } else {
        // We might also allow the user to see class names again in case they typed
        // "IFCPROPERTYSINGLEVALUE[#" but there's no partial ID to match yet.
        return [classMatches, tokens[0]]
      }

    } else {
      // ========== No bracket => fallback to your original approach ==========

      // Filter IFC classes by partial
      const classMatches = ifcClasses.filter((cls) =>
        cls.toLowerCase().startsWith(partial),
      )

      // Also gather instance suggestions for each matched class
      let instanceMatches: string[] = []
      for (const cls of classMatches) {
        const allInstances = getInstanceSuggestions(cls, model!)
        instanceMatches = instanceMatches.concat(
            allInstances.filter((s) => s.toLowerCase().startsWith(partial)),
        )
      }

      // Combine
      const suggestions = [...classMatches, ...instanceMatches]

      // If no suggestions found, fallback to all classes:
      if (!suggestions.length) {
        return [ifcClasses, tokens[0]]
      } else {
        return [suggestions, tokens[0]]
      }
    }

  } else {
    // ========== CASE B: There's at least one dot ==========

    const lastToken = tokens[tokens.length - 1]
    // The path up to (but not including) the final token
    const pathTokens = tokens.slice(0, -1)
    const pathForNavigation = pathTokens.join('.')

    const { isEntity, subfieldNames } = getFieldValueOrSubfields(pathForNavigation, model!)

    if (!isEntity) {
      return [[], trimmed]
    }

    // If lastToken is empty => user typed a trailing dot => show all subfields
    if (!lastToken) {
      return [subfieldNames, lastToken]
    } else {
      // partial text => filter subfields
      const lower = lastToken.toLowerCase()
      const matches = subfieldNames.filter((name) =>
        name.toLowerCase().startsWith(lower),
      )
      const suggestions = matches.length ? matches : subfieldNames
      return [suggestions, lastToken]
    }
  }
}

// ---------------------------------------------------------------------
// 5. Create Readline with the custom completer
// ---------------------------------------------------------------------
const rl = readline.createInterface({
  input,
  output,
  prompt: '> ',
  completer,
  terminal: true, // ensure readline sees TAB in many terminals
})

// ---------------------------------------------------------------------
// 6. Prompt user
// ---------------------------------------------------------------------
console.log(`Loaded model: ${modelPath}`)

console.log('Type an IFC class name (partial) and press Tab (e.g. IfcB -> IFCBUILDING).')
console.log('Also try "IFCBUILDINGELEMENTPROXY[#" to see instance completions.')

console.log(
    'Use a dot for subfields (e.g. IFCBUILDINGELEMENTPROXY[#30].Name). ' +
  'Press Enter to see final value.\n',
)

rl.prompt()

// ---------------------------------------------------------------------
// 7. On Enter: parse entire dotted path again to see if it's a primitive
// ---------------------------------------------------------------------
rl.on('line', (inputLine: string) => {
  const command = inputLine.trim()

  if (command.toLowerCase() === 'exit') {
    console.log('Goodbye!')
    process.exit(0)
  }

  const { isEntity, subfieldNames, value } = getFieldValueOrSubfields(command, model!)

  if (isEntity) {
    console.log(`This is still an entity. Possible subfields:\n  ${subfieldNames.join(', ')}`)
  } else if (value !== null && value !== undefined) {
    console.log(`${JSON.stringify(value)}`)
  } else {
    console.log(`No or invalid value for "${command}".`)
  }

  rl.prompt()
})

// ---------------------------------------------------------------------
// 8. Handle Ctrl+C
// ---------------------------------------------------------------------
rl.on('SIGINT', () => {
  console.log('\nCaught interrupt signal. Exiting.')
  process.exit(0)
})
