#!/usr/bin/env node
import fs from 'fs'
import { exit } from 'process'
import { EntityFieldDescription } from '../src/core/entity_field_description'
import EntityTypesIfc from '../src/ifc/ifc4_gen/entity_types_ifc.gen'
import IfcStepModel from '../src/ifc/ifc_step_model'
import IfcStepParser from '../src/ifc/ifc_step_parser'
import Logger from '../src/logging/logger'
import ParsingBuffer from '../src/parsing/parsing_buffer'
import { ParseResult } from '../src/step/parsing/step_parser'
import StepEntityBase from '../src/step/step_entity_base'
import Environment from '../src/utilities/environment'


/**
 * IFC Model Validator
 *
 * @see Validtor.md
 */
// ---------------------------------------------------------------------
// 1. Parse Command-Line Args
// ---------------------------------------------------------------------
Environment.checkEnvironment()
Logger.initializeWasmCallbacks()
const maxCommandArgs = 4
if (process.argv.length < maxCommandArgs) {
  // eslint-disable-next-line max-len
  console.error(`Usage: validator <path_to_model>.ifc "IFCCLASS[#OptionalID].property <operator> value"`)
  exit(1)
}

const modelPath = process.argv[2]
const query = process.argv[3]

// ---------------------------------------------------------------------
// 2. Load & Parse the IFC
// ---------------------------------------------------------------------
let ifcBuffer: Buffer
try {
  ifcBuffer = fs.readFileSync(modelPath)
} catch (err) {
  Logger.error(`Error reading "${modelPath}": ${err}`)
  exit(1)
}

Logger.createStatistics(0)
const parser = IfcStepParser.Instance
const bufferInput = new ParsingBuffer(ifcBuffer)

// eslint-disable-next-line no-unused-vars
const [stepHeader, resultHeader] = parser.parseHeader(bufferInput)
const [parseResult, model] = parser.parseDataToModel(bufferInput)

switch (parseResult) {
  case ParseResult.COMPLETE:
    break
  case ParseResult.INCOMPLETE:
    Logger.warning('Parse incomplete but no errors reported.')
    break
  case ParseResult.INVALID_STEP:
    Logger.error('Invalid STEP detected.')
    exit(1)
    break
  case ParseResult.MISSING_TYPE:
    Logger.error('Missing STEP type.')
    exit(1)
    break
  case ParseResult.SYNTAX_ERROR:
    Logger.error(`Syntax error at line ${bufferInput.lineCount}.`)
    exit(1)
    break
  default:
}

if (!model) {
  Logger.error('Failed to load model.')
  exit(1)
}

// ---------------------------------------------------------------------
// 3. Build arrays for IFC classes & entity types
// ---------------------------------------------------------------------
const nonEmptyTypeIDNoSubtypes = model.nonEmptyTypeIDs()
const ifcClasses: string[] = Array.from(nonEmptyTypeIDNoSubtypes || []).map(
    (item) => String(EntityTypesIfc[item]), // e.g. "IFCBUILDING", "IFCWINDOW"
)
const entityTypes: EntityTypesIfc[] = Array.from(nonEmptyTypeIDNoSubtypes || [])

// ---------------------------------------------------------------------
// 4. Parse the User's Query
//
// Examples of valid queries:
//   "IFCWINDOW.Height <= 5"
//   "IFCWINDOW[#15].Height == 3.2"
//   "IFCSITE" (just checks if it exists)
//   "IFCWINDOW[#15]" (checks if that instance exists)
// We’ll parse them to something like:
//   {
//     className: "IFCWINDOW",
//     expressID?: number,
//     property?: "Height",
//     operator?: "<=",
//     value?: "5"
//   }
// ---------------------------------------------------------------------
interface ParsedQuery {
  className: string;
  expressID?: number;
  property?: string;
  operator?: string;
  value?: string;
}

/**
 * Parses a query string used for querying IFC classes, properties, and values.
 *
 * @param {string} query_ - The query string to be parsed.
 * @return {ParsedQuery} An object containing:
 * @throws {Error} If the query string contains multiple operators or has an invalid format.
 */
function parseQueryString(query_: string): ParsedQuery {
  // This pattern finds any of these operators: <= >= < > == != === !==
  const operatorPatternGlobal = /(<=|>=|<|>|==|!=|===|!==)/g
  const matches = [...query_.matchAll(operatorPatternGlobal)]

  if (matches.length > 1) {
    // If we detect more than 1 operator, we stop and notify the user
    const found = matches.map((m) => m[0]).join(' ')
    throw new Error(`Multiple operators found in query: ${found}`)
  }

  // Now handle the single operator (or none) with your existing logic
  if (matches.length === 1) {
    // e.g. "IFCWINDOW.OverallHeight <= 5"
    // operator = "<="
    // we can split around that operator or do a single match pattern
    const operatorPattern = /\s(<=|>=|<|>|==|!=|===|!==)\s/
    const opMatch = query_.match(operatorPattern)

    if (!opMatch) {
      throw new Error(`Could not split query around operator.`)
    }
    const operator = opMatch[1]
    // Split out the left and right sides
    const parts = query_.split(operatorPattern).map((s) => s.trim()).filter(Boolean)
    // e.g. ["IFCWINDOW.OverallHeight", "<=", "5"]

    // eslint-disable-next-line no-magic-numbers
    if (parts.length < 3) {
      throw new Error(`Invalid query format around operator "${operator}"`)
    }

    const classAndPropPart = parts[0]
    // eslint-disable-next-line no-magic-numbers
    const valueStr = parts.slice(2).join(' ') // e.g. "5" (or "myStringValue")

    // parse left side => "IFCWINDOW.OverallHeight"
    const match = classAndPropPart.match(/^([A-Za-z0-9_]+)(\[#(\d+)\])?(?:\.(.+))?$/)
    if (!match) {
      throw new Error(`Invalid left side: "${classAndPropPart}"`)
    }

    const classNameRaw = match[1].toUpperCase()
    const expressIDStr = match[3]
    const propertyName = match[4]
    let expressID: number | undefined
    if (expressIDStr !== undefined) {
      expressID = parseInt(expressIDStr, 10)
    }

    return {
      className: classNameRaw,
      expressID,
      property: propertyName,
      operator,
      value: valueStr,
    }
  } else {
    // No operator => user might just be checking for "IFCWINDOW" or "IFCWINDOW[#15].Height"
    // We'll parse that similarly:
    const match = query_.match(/^([A-Za-z0-9_]+)(\[#(\d+)\])?(?:\.(.+))?$/)
    if (!match) {
      throw new Error(`Invalid query format (no operator, unable to parse): "${query_}"`)
    }
    const classNameRaw = match[1].toUpperCase()
    const expressIDStr = match[3]
    const propertyName = match[4]
    let expressID: number | undefined
    if (expressIDStr !== undefined) {
      expressID = parseInt(expressIDStr, 10)
    }

    // Return with no operator or value
    return {
      className: classNameRaw,
      expressID,
      property: propertyName,
      operator: undefined,
      value: undefined,
    }
  }
}


// ---------------------------------------------------------------------
// 5. Utility to read a property from an IFC entity
//    We want "entity[propertyName]" or entity.orderedFields, but ignoring case
// ---------------------------------------------------------------------
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
  return entity.orderedFields.reduce(
      (
          acc: [string, EntityFieldDescription<EntityTypesIfc>, unknown][],
          [fieldName, fieldDesc],
      ) => {
        try {
        // Attempt to access the field
          const data = (entity as any)[fieldName]
          acc.push([fieldName, fieldDesc, data])
        } catch (err) {
        // If an error occurs while accessing the field, skip it
        // Optionally, log or handle the error:
          // console.warn(`Skipping field ${fieldName}: ${err}`);
        }
        return acc
      },
      [],
  )
}


/**
 * Retrieves the value of a specified property from the given IFC entity.
 *
 * @param {StepEntityBase<EntityTypesIfc>} entity - The IFC entity containing the property.
 * @param {string} propertyName - The name of the property to retrieve
 * @return {any} The value of the specified property, or `undefined`
 * if the property is not found.
 */
function getPropertyValue(
    entity: StepEntityBase<EntityTypesIfc>,
    propertyName: string,
): any {
  // We do a case-insensitive match on the name
  const fields = getLocalFieldsWithData(entity)
  const found = fields.find(([fName]) => fName.toLowerCase() === propertyName.toLowerCase())
  if (!found) {
    return undefined
  }

  // eslint-disable-next-line no-unused-vars
  const [_, _desc, data] = found
  // If it's an array, you might want to handle it specifically.
  // For example, returning the first element or the entire array.
  // For now, let's just return the raw data.
  return data
}

// ---------------------------------------------------------------------
// 6. Perform Validation
// ---------------------------------------------------------------------
/**
 * Validates an IFC model against a parsed query to check class existence,
 * property values, or specific conditions.
 *
 * @param {IfcStepModel} model_ - The IFC model to validate.
 * @param {ParsedQuery} query_ - The parsed query containing class, property,
 * and condition details.
 * @return {void} Outputs validation results directly to the console.
 *
 * - Checks if the specified class and instance(s) exist in the model.
 * - Validates property existence or evaluates conditions using operators and values.
 * - Provides a summary of passing and failing entities.
 */
function validateModel(model_: IfcStepModel, query_: ParsedQuery) {
  const { className, expressID, property, operator, value } = query_

  // 1) Check if the class exists in the model
  const clsIndex = ifcClasses.indexOf(className)
  if (clsIndex < 0) {
    console.error(`❌ IFC class "${className}" does not exist in this model.`)
    return
  }

  // Get the type + constructor
  const elementTypeID = entityTypes[clsIndex]
  const ctor = model_.schema.constructors[elementTypeID]
  if (!ctor) {
    console.error(`❌ IFC class "${className}" not recognized in schema (missing constructor).`)
    return
  }

  // 2) Gather relevant entities
  let entities: StepEntityBase<EntityTypesIfc>[] = []
  if (expressID !== undefined) {
    // Single entity check
    const all = Array.from(model_.types(ctor))
    const found = all.find((e) => (e as any).expressID === expressID)
    if (!found) {
      console.error(`❌ No instance with Express ID #${expressID} found for class ${className}`)
      return
    }
    entities.push(found)
  } else {
    // Convert the iterator to an array explicitly
    const allEntities = Array.from(model_.types(ctor)) as StepEntityBase<EntityTypesIfc>[]
    if (!allEntities.length) {
      console.error(`❌ No instances of class "${className}" found in model.`)
      return
    }
    entities = allEntities
  }

  // If user only specified className (and possibly ID), with no property or operator =>
  // That might mean "check existence" or do nothing but list them.
  if (!property && !operator && !value) {
    console.log(`✅ Found ${entities.length} instance(s) of ${className}:`)
    for (const e of entities) {
      const id = (e as any).expressID
      console.log(`   - ${className}[#${id}]`)
    }
    return
  }

  if (property && !operator) {
    console.log(`Checking if property "${property}" exists on ${className}`)
    let passCount = 0
    for (const e of entities) {
      const id = (e as any).expressID
      const val = getPropertyValue(e, property)
      if (val !== undefined) {
        passCount++
        console.log(`   ✔️ ${className}[#${id}] has .${property} = ${JSON.stringify(val)}`)
      } else {
        console.log(`   ❌ ${className}[#${id}] has no .${property}`)
      }
    }
    console.log(
        `\nProperty existence check: ${passCount} / ${entities.length} have property "${property}"`)
    return
  }

  // Otherwise, user specified property + operator + value => do a pass/fail
  if (!property || !operator || value === undefined) {
    console.error(`❌ Invalid query format. Please provide "Class.Property <operator> <value>"`)
    return
  }

  const numericValue = tryParseNumber(value)
  // eslint-disable-next-line no-unused-vars
  const isNumeric = numericValue !== null
  let passCount = 0
  let failCount = 0

  const passes: { id: number; propVal: any }[] = []
  const fails: { id: number; propVal: any; reason: string }[] = []

  console.log(`\nValidation Report for Query: ${className}${expressID !==
    undefined ? `[#${  expressID  }]` : ''}.${property} ${operator} ${value}`)

  for (const e of entities) {
    const id = (e as any).expressID
    const propVal = getPropertyValue(e, property)

    // If property is undefined => automatically fail
    if (propVal === undefined || propVal === null) {
      fails.push({ id, propVal, reason: `no "${property}" property` })
      failCount++
      continue
    }

    const leftSide = JSON.stringify(propVal)
    const rightSide = value

    let pass: boolean
    try {
      const expression = `${leftSide} ${operator} ${rightSide}`
      // eslint-disable-next-line no-eval
      pass = eval(expression)
    } catch (err) {
      fails.push({ id, propVal, reason: `eval error: ${err}` })
      failCount++
      continue
    }

    if (pass) {
      passes.push({ id, propVal })
      passCount++
    } else {
      fails.push({ id, propVal,
        reason: `failed comparison (${property}: ${JSON.stringify(propVal)})` })
      failCount++
    }
  }

  // Sort by expressID
  passes.sort((a, b) => a.id - b.id)
  fails.sort((a, b) => a.id - b.id)

  // Print passes
  console.log(`\n✔️ Passing Entries:`)
  for (const { id, propVal } of passes) {
    console.log(`✔️ ${className}[#${id}] => PASSED (${property}: ${JSON.stringify(propVal)})`)
  }

  // Print fails
  console.log(`\n❌ Failing Entries:`)
  // eslint-disable-next-line no-unused-vars
  for (const { id, propVal, reason } of fails) {
    console.log(`❌ ${className}[#${id}] => FAILED (${reason})`)
  }

  // Summary
  console.log(`\n✅ Total Passing: ${passCount}`)
  console.log(`❌ Total Failing: ${failCount}`)

}

/**
 * Attempts to parse a given string as a number, returning `null` if the parsing fails.
 *
 * @param {string} text - The input string to be parsed.
 * @return {number | null} The parsed number, or `null` if the input is not a valid number.
 */
function tryParseNumber(text: string): number | null {
  // e.g. "3.14" => 3.14
  // e.g. "5" => 5
  // e.g. "abc" => null
  // We also want to ignore quotes like "3.14" => might become NaN if we don't strip them
  const cleaned = text.trim().replace(/^['"]+|['"]+$/g, '') // remove surrounding quotes
  const val = parseFloat(cleaned)
  return Number.isNaN(val) ? null : val
}

// ---------------------------------------------------------------------
// 7. Run the validator
// ---------------------------------------------------------------------
let parsedQuery: ParsedQuery
try {
  parsedQuery = parseQueryString(query)
} catch (err) {
  console.error(`❌ Error parsing query: ${(err as Error).message}`)
  exit(1)
}

validateModel(model, parsedQuery)
