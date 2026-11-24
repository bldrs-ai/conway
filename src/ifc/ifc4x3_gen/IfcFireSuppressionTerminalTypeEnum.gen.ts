/* This is generated code, don't alter */
enum IfcFireSuppressionTerminalTypeEnum {
  BREECHINGINLET = 0,
  FIREHYDRANT = 1,
  FIREMONITOR = 2,
  HOSEREEL = 3,
  SPRINKLER = 4,
  SPRINKLERDEFLECTOR = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcFireSuppressionTerminalTypeEnumCount = 8

export { IfcFireSuppressionTerminalTypeEnum, IfcFireSuppressionTerminalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFireSuppressionTerminalTypeEnum =
  new Int32Array( [5,0,25] )

let prefixSumAddressIfcFireSuppressionTerminalTypeEnum =
  new Uint32Array( [0,16,27,40,50,70,82,95,108] )

let slotMapIfcFireSuppressionTerminalTypeEnum =
  new Int32Array( [0,4,1,3,5,7,2,6] )

let encodedDataIfcFireSuppressionTerminalTypeEnum =
  (new TextEncoder()).encode( ".BREECHINGINLET..SPRINKLER..FIREHYDRANT..HOSEREEL..SPRINKLERDEFLECTOR..NOTDEFINED..FIREMONITOR..USERDEFINED." )

let IfcFireSuppressionTerminalTypeEnumSearch =
  new MinimalPerfectHash< IfcFireSuppressionTerminalTypeEnum >( gMapIfcFireSuppressionTerminalTypeEnum, prefixSumAddressIfcFireSuppressionTerminalTypeEnum, slotMapIfcFireSuppressionTerminalTypeEnum, encodedDataIfcFireSuppressionTerminalTypeEnum )

export { IfcFireSuppressionTerminalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFireSuppressionTerminalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFireSuppressionTerminalTypeEnum | undefined {
  return parser.extract< IfcFireSuppressionTerminalTypeEnum >( IfcFireSuppressionTerminalTypeEnumSearch, input, cursor, endCursor )
}
