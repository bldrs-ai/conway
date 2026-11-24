/* This is generated code, don't alter */
enum IfcActionRequestTypeEnum {
  EMAIL = 0,
  FAX = 1,
  PHONE = 2,
  POST = 3,
  VERBAL = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcActionRequestTypeEnumCount = 7

export { IfcActionRequestTypeEnum, IfcActionRequestTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcActionRequestTypeEnum =
  new Int32Array( [202] )

let prefixSumAddressIfcActionRequestTypeEnum =
  new Uint32Array( [0,13,19,24,36,44,51,58] )

let slotMapIfcActionRequestTypeEnum =
  new Int32Array( [5,3,1,6,4,2,0] )

let encodedDataIfcActionRequestTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..POST..FAX..NOTDEFINED..VERBAL..PHONE..EMAIL." )

let IfcActionRequestTypeEnumSearch =
  new MinimalPerfectHash< IfcActionRequestTypeEnum >( gMapIfcActionRequestTypeEnum, prefixSumAddressIfcActionRequestTypeEnum, slotMapIfcActionRequestTypeEnum, encodedDataIfcActionRequestTypeEnum )

export { IfcActionRequestTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcActionRequestTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcActionRequestTypeEnum | undefined {
  return parser.extract< IfcActionRequestTypeEnum >( IfcActionRequestTypeEnumSearch, input, cursor, endCursor )
}
