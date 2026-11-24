/* This is generated code, don't alter */
enum IfcObjectiveEnum {
  CODECOMPLIANCE = 0,
  CODEWAIVER = 1,
  DESIGNINTENT = 2,
  EXTERNAL = 3,
  HEALTHANDSAFETY = 4,
  MERGECONFLICT = 5,
  MODELVIEW = 6,
  PARAMETER = 7,
  REQUIREMENT = 8,
  SPECIFICATION = 9,
  TRIGGERCONDITION = 10,
  USERDEFINED = 11,
  NOTDEFINED = 12,
}

const IfcObjectiveEnumCount = 13

export { IfcObjectiveEnum, IfcObjectiveEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcObjectiveEnum =
  new Int32Array( [6,31,4,3] )

let prefixSumAddressIfcObjectiveEnum =
  new Uint32Array( [0,16,30,43,61,72,87,104,115,125,137,149,162,177] )

let slotMapIfcObjectiveEnum =
  new Int32Array( [0,2,11,10,6,9,4,7,3,1,12,8,5] )

let encodedDataIfcObjectiveEnum =
  (new TextEncoder()).encode( ".CODECOMPLIANCE..DESIGNINTENT..USERDEFINED..TRIGGERCONDITION..MODELVIEW..SPECIFICATION..HEALTHANDSAFETY..PARAMETER..EXTERNAL..CODEWAIVER..NOTDEFINED..REQUIREMENT..MERGECONFLICT." )

let IfcObjectiveEnumSearch =
  new MinimalPerfectHash< IfcObjectiveEnum >( gMapIfcObjectiveEnum, prefixSumAddressIfcObjectiveEnum, slotMapIfcObjectiveEnum, encodedDataIfcObjectiveEnum )

export { IfcObjectiveEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcObjectiveEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcObjectiveEnum | undefined {
  return parser.extract< IfcObjectiveEnum >( IfcObjectiveEnumSearch, input, cursor, endCursor )
}
