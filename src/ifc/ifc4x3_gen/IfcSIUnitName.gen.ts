/* This is generated code, don't alter */
enum IfcSIUnitName {
  AMPERE = 0,
  BECQUEREL = 1,
  CANDELA = 2,
  COULOMB = 3,
  CUBIC_METRE = 4,
  DEGREE_CELSIUS = 5,
  FARAD = 6,
  GRAM = 7,
  GRAY = 8,
  HENRY = 9,
  HERTZ = 10,
  JOULE = 11,
  KELVIN = 12,
  LUMEN = 13,
  LUX = 14,
  METRE = 15,
  MOLE = 16,
  NEWTON = 17,
  OHM = 18,
  PASCAL = 19,
  RADIAN = 20,
  SECOND = 21,
  SIEMENS = 22,
  SIEVERT = 23,
  SQUARE_METRE = 24,
  STERADIAN = 25,
  TESLA = 26,
  VOLT = 27,
  WATT = 28,
  WEBER = 29,
}

const IfcSIUnitNameCount = 30

export { IfcSIUnitName, IfcSIUnitNameCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSIUnitName =
  new Int32Array( [1,1442,40,7,9,258,799] )

let prefixSumAddressIfcSIUnitName =
  new Uint32Array( [0,9,16,27,34,42,51,59,66,72,80,85,94,100,111,119,126,131,144,158,164,171,177,184,193,200,207,215,231,239,245] )

let slotMapIfcSIUnitName =
  new Int32Array( [22,10,1,6,21,23,17,11,16,19,14,3,8,25,12,13,18,4,24,28,26,27,9,2,15,29,20,5,0,7] )

let encodedDataIfcSIUnitName =
  (new TextEncoder()).encode( ".SIEMENS..HERTZ..BECQUEREL..FARAD..SECOND..SIEVERT..NEWTON..JOULE..MOLE..PASCAL..LUX..COULOMB..GRAY..STERADIAN..KELVIN..LUMEN..OHM..CUBIC_METRE..SQUARE_METRE..WATT..TESLA..VOLT..HENRY..CANDELA..METRE..WEBER..RADIAN..DEGREE_CELSIUS..AMPERE..GRAM." )

let IfcSIUnitNameSearch =
  new MinimalPerfectHash< IfcSIUnitName >( gMapIfcSIUnitName, prefixSumAddressIfcSIUnitName, slotMapIfcSIUnitName, encodedDataIfcSIUnitName )

export { IfcSIUnitNameSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSIUnitNameDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSIUnitName | undefined {
  return parser.extract< IfcSIUnitName >( IfcSIUnitNameSearch, input, cursor, endCursor )
}
