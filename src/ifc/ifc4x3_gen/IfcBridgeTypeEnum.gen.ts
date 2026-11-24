/* This is generated code, don't alter */
enum IfcBridgeTypeEnum {
  ARCHED = 0,
  CABLE_STAYED = 1,
  CANTILEVER = 2,
  CULVERT = 3,
  FRAMEWORK = 4,
  GIRDER = 5,
  SUSPENSION = 6,
  TRUSS = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcBridgeTypeEnumCount = 10

export { IfcBridgeTypeEnum, IfcBridgeTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBridgeTypeEnum =
  new Int32Array( [2,70,39] )

let prefixSumAddressIfcBridgeTypeEnum =
  new Uint32Array( [0,8,20,28,37,49,60,72,86,93,106] )

let slotMapIfcBridgeTypeEnum =
  new Int32Array( [0,9,5,3,2,4,6,1,7,8] )

let encodedDataIfcBridgeTypeEnum =
  (new TextEncoder()).encode( ".ARCHED..NOTDEFINED..GIRDER..CULVERT..CANTILEVER..FRAMEWORK..SUSPENSION..CABLE_STAYED..TRUSS..USERDEFINED." )

let IfcBridgeTypeEnumSearch =
  new MinimalPerfectHash< IfcBridgeTypeEnum >( gMapIfcBridgeTypeEnum, prefixSumAddressIfcBridgeTypeEnum, slotMapIfcBridgeTypeEnum, encodedDataIfcBridgeTypeEnum )

export { IfcBridgeTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBridgeTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBridgeTypeEnum | undefined {
  return parser.extract< IfcBridgeTypeEnum >( IfcBridgeTypeEnumSearch, input, cursor, endCursor )
}
