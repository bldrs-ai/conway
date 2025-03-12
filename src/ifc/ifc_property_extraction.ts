import {
  IfcComplexProperty,
  IfcProperty,
  IfcPropertyBoundedValue,
  IfcPropertyEnumeratedValue,
  IfcPropertyListValue,
  IfcPropertyReferenceValue,
  IfcPropertySet,
  IfcPropertySingleValue,
  IfcPropertyTableValue,
} from './ifc4_gen'
import IfcStepModel from './ifc_step_model'


/**
 *
 */
 
// -- eslint doesn't understand enums properly.
export enum PropertyExtractResult {

    COMPLETE = 0,
    INCOMPLETE = 1,
    SYNTAX_ERROR = 2,
    MISSING_TYPE = 3,
    INVALID_STEP = 4
}

/**
 * Handles IFC Property extraction from a populated IfcStepModel
 */
export class IfcPropertyExtraction {

  /**
   *
   * @param model - IfcStepModel to extract properties from
   * @param logTime - optional parameter to print execution time
   * @return {PropertyExtractResult} indicating the status of the parsing
   */
  static extractIFCProperties(model: IfcStepModel, logTime: boolean = false):
        PropertyExtractResult {
    let result: PropertyExtractResult = PropertyExtractResult.COMPLETE

    const startTime = Date.now()

    // extract all IfcPropertySets from the model
    const propertySets = model.types(IfcPropertySet)


    for (const propertySet of propertySets) {
      console.log('\n\nProperty Set: %s', propertySet.Name)

      // if PropertySet has properties, print them
      const tempResult = this.processIfcProperties(propertySet.HasProperties)

      if (result !== PropertyExtractResult.COMPLETE) {
        if (tempResult !== PropertyExtractResult.COMPLETE) {
          result = tempResult
        }
      } else {
        result = tempResult
      }
    }

    const endTime = Date.now()
    const executionTimeInMs = endTime - startTime

    if (logTime) {
      console.log(`Property Extraction took ${executionTimeInMs} milliseconds to execute.`)
    }

    return result
  }

  /**
   *
   * @param properties
   * @return {PropertyExtractResult}
   */
  static processIfcProperties(properties: IfcProperty[]): PropertyExtractResult {
    let result: PropertyExtractResult = PropertyExtractResult.COMPLETE
    for (const property of properties) {
      switch (property.constructor) {
        case IfcComplexProperty:
          this.processIfcComplexProperty(property as IfcComplexProperty)
          break
        case IfcPropertyBoundedValue:
          this.processIfcPropertyBoundedValue(property as IfcPropertyBoundedValue)
          break
        case IfcPropertyEnumeratedValue:
          this.processIfcPropertyEnumeratedValue(property as IfcPropertyEnumeratedValue)
          break
        case IfcPropertyListValue:
          this.processIfcPropertyListValue(property as IfcPropertyListValue)
          break
        case IfcPropertyReferenceValue:
          this.processIfcPropertyReferenceValue(property as IfcPropertyReferenceValue)
          break
        case IfcPropertySingleValue:
          this.processIfcPropertySingleValue(property as IfcPropertySingleValue)
          break
        case IfcPropertyTableValue:
          this.processIfcPropertyTableValue(property as IfcPropertyTableValue)
          break
        default:
          console.log('Invalid property type.')
          result = PropertyExtractResult.INCOMPLETE
          break
      }
    }

    return result
  }

  /**
   *
   * @param property
   */
  static processIfcComplexProperty(property: IfcComplexProperty) {
    console.log('Name: %s\nUsage Name: %s\nDescription: %s\nProperties Count: ',
        property.Name,
        property.UsageName,
        property.Description,
        property.HasProperties.length)

    this.processIfcProperties(property.HasProperties)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertyBoundedValue(property: IfcPropertyBoundedValue) {
    console.log('Name: %s\nDescription: %s\nUnit: %s\nLower Bound: %s, ' +
    'Upper Bound: %s, Set Point: %s',
    property.Name,
    property.Description,
    property.Unit,
    property.LowerBoundValue?.Value,
    property.UpperBoundValue?.Value,
    property.SetPointValue?.Value)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertyEnumeratedValue(property: IfcPropertyEnumeratedValue) {
    console.log('Name: %s\nDescription: %s\nEnumerationReference: %s\nEnumerationValues: %s',
        property.Name,
        property.Description,
        property.EnumerationReference,
        property.EnumerationValues)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertyListValue(property: IfcPropertyListValue) {
    console.log('Name: %s\nDescription: %s\nUnit: %s\nListValues: %s',
        property.Name, property.Description, property.Unit, property.ListValues)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertyReferenceValue(property: IfcPropertyReferenceValue) {
    console.log('Name: %s\nDescription: %s\nUsageName: %s\nPropertyReference: %s',
        property.Name,
        property.Description,
        property.UsageName,
        property.PropertyReference)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertySingleValue(property: IfcPropertySingleValue) {
    console.log('Name: %s\nDescription: %s\nUnit: %s\nNominalValue: %s',
        property.Name,
        property.Description,
        property.Unit,
        property.NominalValue?.Value)
  }

  /**
   *
   * @param property
   */
  static processIfcPropertyTableValue(property: IfcPropertyTableValue) {
    console.log('Name: %s\nDescription: %s\nDefinedUnit: %s\nCurveInterpolation: %s' +
        '\nDefinedValues: %s\nDefiningUnit: %s\nDefiningValues: %s\nExpression: %s',
    property.Name,
    property.Description,
    property.DefinedUnit,
    property.CurveInterpolation?.toString,
    property.DefinedValues,
    property.DefiningUnit,
    property.DefiningValues,
    property.Expression)
  }
}
