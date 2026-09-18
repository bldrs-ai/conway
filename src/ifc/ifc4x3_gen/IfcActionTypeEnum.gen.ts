/* This is generated code, don't alter */
enum IfcActionTypeEnum {
  EXTRAORDINARY_A = 0,
  PERMANENT_G = 1,
  VARIABLE_Q = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcActionTypeEnumCount = 5

export { IfcActionTypeEnum, IfcActionTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcActionTypeEnum =
  new Int32Array( [23] )

let prefixSumAddressIfcActionTypeEnum =
  new Uint32Array( [0,13,25,37,50,67] )

let slotMapIfcActionTypeEnum =
  new Int32Array( [1,2,4,3,0] )

let encodedDataIfcActionTypeEnum =
  (new TextEncoder()).encode( ".PERMANENT_G..VARIABLE_Q..NOTDEFINED..USERDEFINED..EXTRAORDINARY_A." )

let IfcActionTypeEnumSearch =
  new MinimalPerfectHash< IfcActionTypeEnum >( gMapIfcActionTypeEnum, prefixSumAddressIfcActionTypeEnum, slotMapIfcActionTypeEnum, encodedDataIfcActionTypeEnum )

export { IfcActionTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcActionTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcActionTypeEnum | undefined {
  return parser.extract< IfcActionTypeEnum >( IfcActionTypeEnumSearch, input, cursor, endCursor )
}
