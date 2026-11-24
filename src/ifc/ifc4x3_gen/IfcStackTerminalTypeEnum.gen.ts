/* This is generated code, don't alter */
enum IfcStackTerminalTypeEnum {
  BIRDCAGE = 0,
  COWL = 1,
  RAINWATERHOPPER = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcStackTerminalTypeEnumCount = 5

export { IfcStackTerminalTypeEnum, IfcStackTerminalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStackTerminalTypeEnum =
  new Int32Array( [7] )

let prefixSumAddressIfcStackTerminalTypeEnum =
  new Uint32Array( [0,12,25,35,41,58] )

let slotMapIfcStackTerminalTypeEnum =
  new Int32Array( [4,3,0,1,2] )

let encodedDataIfcStackTerminalTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..USERDEFINED..BIRDCAGE..COWL..RAINWATERHOPPER." )

let IfcStackTerminalTypeEnumSearch =
  new MinimalPerfectHash< IfcStackTerminalTypeEnum >( gMapIfcStackTerminalTypeEnum, prefixSumAddressIfcStackTerminalTypeEnum, slotMapIfcStackTerminalTypeEnum, encodedDataIfcStackTerminalTypeEnum )

export { IfcStackTerminalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStackTerminalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStackTerminalTypeEnum | undefined {
  return parser.extract< IfcStackTerminalTypeEnum >( IfcStackTerminalTypeEnumSearch, input, cursor, endCursor )
}
