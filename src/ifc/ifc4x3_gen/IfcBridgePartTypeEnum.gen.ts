/* This is generated code, don't alter */
enum IfcBridgePartTypeEnum {
  ABUTMENT = 0,
  DECK = 1,
  DECK_SEGMENT = 2,
  FOUNDATION = 3,
  PIER = 4,
  PIER_SEGMENT = 5,
  PYLON = 6,
  SUBSTRUCTURE = 7,
  SUPERSTRUCTURE = 8,
  SURFACESTRUCTURE = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcBridgePartTypeEnumCount = 12

export { IfcBridgePartTypeEnum, IfcBridgePartTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBridgePartTypeEnum =
  new Int32Array( [5,289,2] )

let prefixSumAddressIfcBridgePartTypeEnum =
  new Uint32Array( [0,14,30,44,62,74,80,87,100,114,120,130,142] )

let slotMapIfcBridgePartTypeEnum =
  new Int32Array( [7,8,2,9,11,4,6,10,5,1,0,3] )

let encodedDataIfcBridgePartTypeEnum =
  (new TextEncoder()).encode( ".SUBSTRUCTURE..SUPERSTRUCTURE..DECK_SEGMENT..SURFACESTRUCTURE..NOTDEFINED..PIER..PYLON..USERDEFINED..PIER_SEGMENT..DECK..ABUTMENT..FOUNDATION." )

let IfcBridgePartTypeEnumSearch =
  new MinimalPerfectHash< IfcBridgePartTypeEnum >( gMapIfcBridgePartTypeEnum, prefixSumAddressIfcBridgePartTypeEnum, slotMapIfcBridgePartTypeEnum, encodedDataIfcBridgePartTypeEnum )

export { IfcBridgePartTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBridgePartTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBridgePartTypeEnum | undefined {
  return parser.extract< IfcBridgePartTypeEnum >( IfcBridgePartTypeEnumSearch, input, cursor, endCursor )
}
