/* This is generated code, don't alter */
enum IfcCableFittingTypeEnum {
  CONNECTOR = 0,
  ENTRY = 1,
  EXIT = 2,
  FANOUT = 3,
  JUNCTION = 4,
  TRANSITION = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcCableFittingTypeEnumCount = 8

export { IfcCableFittingTypeEnum, IfcCableFittingTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCableFittingTypeEnum =
  new Int32Array( [1,15,0] )

let prefixSumAddressIfcCableFittingTypeEnum =
  new Uint32Array( [0,12,19,29,35,47,58,71,79] )

let slotMapIfcCableFittingTypeEnum =
  new Int32Array( [7,1,4,2,5,0,6,3] )

let encodedDataIfcCableFittingTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..ENTRY..JUNCTION..EXIT..TRANSITION..CONNECTOR..USERDEFINED..FANOUT." )

let IfcCableFittingTypeEnumSearch =
  new MinimalPerfectHash< IfcCableFittingTypeEnum >( gMapIfcCableFittingTypeEnum, prefixSumAddressIfcCableFittingTypeEnum, slotMapIfcCableFittingTypeEnum, encodedDataIfcCableFittingTypeEnum )

export { IfcCableFittingTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCableFittingTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCableFittingTypeEnum | undefined {
  return parser.extract< IfcCableFittingTypeEnum >( IfcCableFittingTypeEnumSearch, input, cursor, endCursor )
}
