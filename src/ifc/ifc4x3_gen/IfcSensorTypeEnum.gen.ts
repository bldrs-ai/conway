/* This is generated code, don't alter */
enum IfcSensorTypeEnum {
  CO2SENSOR = 0,
  CONDUCTANCESENSOR = 1,
  CONTACTSENSOR = 2,
  COSENSOR = 3,
  EARTHQUAKESENSOR = 4,
  FIRESENSOR = 5,
  FLOWSENSOR = 6,
  FOREIGNOBJECTDETECTIONSENSOR = 7,
  FROSTSENSOR = 8,
  GASSENSOR = 9,
  HEATSENSOR = 10,
  HUMIDITYSENSOR = 11,
  IDENTIFIERSENSOR = 12,
  IONCONCENTRATIONSENSOR = 13,
  LEVELSENSOR = 14,
  LIGHTSENSOR = 15,
  MOISTURESENSOR = 16,
  MOVEMENTSENSOR = 17,
  OBSTACLESENSOR = 18,
  PHSENSOR = 19,
  PRESSURESENSOR = 20,
  RADIATIONSENSOR = 21,
  RADIOACTIVITYSENSOR = 22,
  RAINSENSOR = 23,
  SMOKESENSOR = 24,
  SNOWDEPTHSENSOR = 25,
  SOUNDSENSOR = 26,
  TEMPERATURESENSOR = 27,
  TRAINSENSOR = 28,
  TURNOUTCLOSURESENSOR = 29,
  WHEELSENSOR = 30,
  WINDSENSOR = 31,
  USERDEFINED = 32,
  NOTDEFINED = 33,
}

const IfcSensorTypeEnumCount = 34

export { IfcSensorTypeEnum, IfcSensorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSensorTypeEnum =
  new Int32Array( [3,1,96,2,11,5,13,179,114] )

let prefixSumAddressIfcSensorTypeEnum =
  new Uint32Array( [0,16,34,55,74,84,97,119,131,155,168,184,196,206,223,238,251,269,280,296,309,322,335,354,370,383,394,406,422,435,447,464,476,506,518] )

let slotMapIfcSensorTypeEnum =
  new Int32Array( [17,12,22,27,19,14,29,10,13,26,16,23,3,25,2,32,4,9,11,15,30,8,1,20,24,0,5,18,28,33,21,6,7,31] )

let encodedDataIfcSensorTypeEnum =
  (new TextEncoder()).encode( ".MOVEMENTSENSOR..IDENTIFIERSENSOR..RADIOACTIVITYSENSOR..TEMPERATURESENSOR..PHSENSOR..LEVELSENSOR..TURNOUTCLOSURESENSOR..HEATSENSOR..IONCONCENTRATIONSENSOR..SOUNDSENSOR..MOISTURESENSOR..RAINSENSOR..COSENSOR..SNOWDEPTHSENSOR..CONTACTSENSOR..USERDEFINED..EARTHQUAKESENSOR..GASSENSOR..HUMIDITYSENSOR..LIGHTSENSOR..WHEELSENSOR..FROSTSENSOR..CONDUCTANCESENSOR..PRESSURESENSOR..SMOKESENSOR..CO2SENSOR..FIRESENSOR..OBSTACLESENSOR..TRAINSENSOR..NOTDEFINED..RADIATIONSENSOR..FLOWSENSOR..FOREIGNOBJECTDETECTIONSENSOR..WINDSENSOR." )

let IfcSensorTypeEnumSearch =
  new MinimalPerfectHash< IfcSensorTypeEnum >( gMapIfcSensorTypeEnum, prefixSumAddressIfcSensorTypeEnum, slotMapIfcSensorTypeEnum, encodedDataIfcSensorTypeEnum )

export { IfcSensorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSensorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSensorTypeEnum | undefined {
  return parser.extract< IfcSensorTypeEnum >( IfcSensorTypeEnumSearch, input, cursor, endCursor )
}
