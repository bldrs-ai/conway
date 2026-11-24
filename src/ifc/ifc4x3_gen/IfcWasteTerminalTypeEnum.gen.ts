/* This is generated code, don't alter */
enum IfcWasteTerminalTypeEnum {
  FLOORTRAP = 0,
  FLOORWASTE = 1,
  GULLYSUMP = 2,
  GULLYTRAP = 3,
  ROOFDRAIN = 4,
  WASTEDISPOSALUNIT = 5,
  WASTETRAP = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcWasteTerminalTypeEnumCount = 9

export { IfcWasteTerminalTypeEnum, IfcWasteTerminalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWasteTerminalTypeEnum =
  new Int32Array( [-7,1,117] )

let prefixSumAddressIfcWasteTerminalTypeEnum =
  new Uint32Array( [0,12,23,42,53,64,75,86,99,111] )

let slotMapIfcWasteTerminalTypeEnum =
  new Int32Array( [8,0,5,6,3,4,2,7,1] )

let encodedDataIfcWasteTerminalTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..FLOORTRAP..WASTEDISPOSALUNIT..WASTETRAP..GULLYTRAP..ROOFDRAIN..GULLYSUMP..USERDEFINED..FLOORWASTE." )

let IfcWasteTerminalTypeEnumSearch =
  new MinimalPerfectHash< IfcWasteTerminalTypeEnum >( gMapIfcWasteTerminalTypeEnum, prefixSumAddressIfcWasteTerminalTypeEnum, slotMapIfcWasteTerminalTypeEnum, encodedDataIfcWasteTerminalTypeEnum )

export { IfcWasteTerminalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWasteTerminalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWasteTerminalTypeEnum | undefined {
  return parser.extract< IfcWasteTerminalTypeEnum >( IfcWasteTerminalTypeEnumSearch, input, cursor, endCursor )
}
