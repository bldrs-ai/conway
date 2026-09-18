/* This is generated code, don't alter */
enum IfcEarthworksCutTypeEnum {
  BASE_EXCAVATION = 0,
  CUT = 1,
  DREDGING = 2,
  EXCAVATION = 3,
  OVEREXCAVATION = 4,
  PAVEMENTMILLING = 5,
  STEPEXCAVATION = 6,
  TOPSOILREMOVAL = 7,
  TRENCH = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcEarthworksCutTypeEnumCount = 11

export { IfcEarthworksCutTypeEnum, IfcEarthworksCutTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEarthworksCutTypeEnum =
  new Int32Array( [3,271,9] )

let prefixSumAddressIfcEarthworksCutTypeEnum =
  new Uint32Array( [0,16,29,34,50,58,74,91,101,113,130,142] )

let slotMapIfcEarthworksCutTypeEnum =
  new Int32Array( [4,9,1,6,8,7,5,2,3,0,10] )

let encodedDataIfcEarthworksCutTypeEnum =
  (new TextEncoder()).encode( ".OVEREXCAVATION..USERDEFINED..CUT..STEPEXCAVATION..TRENCH..TOPSOILREMOVAL..PAVEMENTMILLING..DREDGING..EXCAVATION..BASE_EXCAVATION..NOTDEFINED." )

let IfcEarthworksCutTypeEnumSearch =
  new MinimalPerfectHash< IfcEarthworksCutTypeEnum >( gMapIfcEarthworksCutTypeEnum, prefixSumAddressIfcEarthworksCutTypeEnum, slotMapIfcEarthworksCutTypeEnum, encodedDataIfcEarthworksCutTypeEnum )

export { IfcEarthworksCutTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEarthworksCutTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEarthworksCutTypeEnum | undefined {
  return parser.extract< IfcEarthworksCutTypeEnum >( IfcEarthworksCutTypeEnumSearch, input, cursor, endCursor )
}
