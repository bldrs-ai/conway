/* This is generated code, don't alter */
enum IfcLiquidTerminalTypeEnum {
  HOSEREEL = 0,
  LOADINGARM = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcLiquidTerminalTypeEnumCount = 4

export { IfcLiquidTerminalTypeEnum, IfcLiquidTerminalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLiquidTerminalTypeEnum =
  new Int32Array( [9] )

let prefixSumAddressIfcLiquidTerminalTypeEnum =
  new Uint32Array( [0,13,23,35,47] )

let slotMapIfcLiquidTerminalTypeEnum =
  new Int32Array( [2,0,3,1] )

let encodedDataIfcLiquidTerminalTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..HOSEREEL..NOTDEFINED..LOADINGARM." )

let IfcLiquidTerminalTypeEnumSearch =
  new MinimalPerfectHash< IfcLiquidTerminalTypeEnum >( gMapIfcLiquidTerminalTypeEnum, prefixSumAddressIfcLiquidTerminalTypeEnum, slotMapIfcLiquidTerminalTypeEnum, encodedDataIfcLiquidTerminalTypeEnum )

export { IfcLiquidTerminalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLiquidTerminalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLiquidTerminalTypeEnum | undefined {
  return parser.extract< IfcLiquidTerminalTypeEnum >( IfcLiquidTerminalTypeEnumSearch, input, cursor, endCursor )
}
