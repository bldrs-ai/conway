/* This is generated code, don't alter */
enum IfcProjectOrderTypeEnum {
  CHANGEORDER = 0,
  MAINTENANCEWORKORDER = 1,
  MOVEORDER = 2,
  PURCHASEORDER = 3,
  WORKORDER = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcProjectOrderTypeEnumCount = 7

export { IfcProjectOrderTypeEnum, IfcProjectOrderTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProjectOrderTypeEnum =
  new Int32Array( [86] )

let prefixSumAddressIfcProjectOrderTypeEnum =
  new Uint32Array( [0,22,33,46,58,73,86,97] )

let slotMapIfcProjectOrderTypeEnum =
  new Int32Array( [1,4,0,6,3,5,2] )

let encodedDataIfcProjectOrderTypeEnum =
  (new TextEncoder()).encode( ".MAINTENANCEWORKORDER..WORKORDER..CHANGEORDER..NOTDEFINED..PURCHASEORDER..USERDEFINED..MOVEORDER." )

let IfcProjectOrderTypeEnumSearch =
  new MinimalPerfectHash< IfcProjectOrderTypeEnum >( gMapIfcProjectOrderTypeEnum, prefixSumAddressIfcProjectOrderTypeEnum, slotMapIfcProjectOrderTypeEnum, encodedDataIfcProjectOrderTypeEnum )

export { IfcProjectOrderTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProjectOrderTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProjectOrderTypeEnum | undefined {
  return parser.extract< IfcProjectOrderTypeEnum >( IfcProjectOrderTypeEnumSearch, input, cursor, endCursor )
}
