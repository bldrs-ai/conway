/* This is generated code, don't alter */
enum IfcLoadGroupTypeEnum {
  LOAD_CASE = 0,
  LOAD_COMBINATION = 1,
  LOAD_GROUP = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcLoadGroupTypeEnumCount = 5

export { IfcLoadGroupTypeEnum, IfcLoadGroupTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLoadGroupTypeEnum =
  new Int32Array( [18] )

let prefixSumAddressIfcLoadGroupTypeEnum =
  new Uint32Array( [0,18,30,42,55,66] )

let slotMapIfcLoadGroupTypeEnum =
  new Int32Array( [1,4,2,3,0] )

let encodedDataIfcLoadGroupTypeEnum =
  (new TextEncoder()).encode( ".LOAD_COMBINATION..NOTDEFINED..LOAD_GROUP..USERDEFINED..LOAD_CASE." )

let IfcLoadGroupTypeEnumSearch =
  new MinimalPerfectHash< IfcLoadGroupTypeEnum >( gMapIfcLoadGroupTypeEnum, prefixSumAddressIfcLoadGroupTypeEnum, slotMapIfcLoadGroupTypeEnum, encodedDataIfcLoadGroupTypeEnum )

export { IfcLoadGroupTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLoadGroupTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLoadGroupTypeEnum | undefined {
  return parser.extract< IfcLoadGroupTypeEnum >( IfcLoadGroupTypeEnumSearch, input, cursor, endCursor )
}
