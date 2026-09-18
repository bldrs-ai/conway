/* This is generated code, don't alter */
enum IfcRailTypeEnum {
  BLADE = 0,
  CHECKRAIL = 1,
  GUARDRAIL = 2,
  RACKRAIL = 3,
  RAIL = 4,
  STOCKRAIL = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcRailTypeEnumCount = 8

export { IfcRailTypeEnum, IfcRailTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRailTypeEnum =
  new Int32Array( [1,2,84] )

let prefixSumAddressIfcRailTypeEnum =
  new Uint32Array( [0,12,23,34,41,47,58,71,81] )

let slotMapIfcRailTypeEnum =
  new Int32Array( [7,2,5,0,4,1,6,3] )

let encodedDataIfcRailTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..GUARDRAIL..STOCKRAIL..BLADE..RAIL..CHECKRAIL..USERDEFINED..RACKRAIL." )

let IfcRailTypeEnumSearch =
  new MinimalPerfectHash< IfcRailTypeEnum >( gMapIfcRailTypeEnum, prefixSumAddressIfcRailTypeEnum, slotMapIfcRailTypeEnum, encodedDataIfcRailTypeEnum )

export { IfcRailTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRailTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRailTypeEnum | undefined {
  return parser.extract< IfcRailTypeEnum >( IfcRailTypeEnumSearch, input, cursor, endCursor )
}
