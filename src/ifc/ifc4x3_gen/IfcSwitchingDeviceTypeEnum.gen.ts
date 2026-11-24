/* This is generated code, don't alter */
enum IfcSwitchingDeviceTypeEnum {
  CONTACTOR = 0,
  DIMMERSWITCH = 1,
  EMERGENCYSTOP = 2,
  KEYPAD = 3,
  MOMENTARYSWITCH = 4,
  RELAY = 5,
  SELECTORSWITCH = 6,
  STARTER = 7,
  START_AND_STOP_EQUIPMENT = 8,
  SWITCHDISCONNECTOR = 9,
  TOGGLESWITCH = 10,
  USERDEFINED = 11,
  NOTDEFINED = 12,
}

const IfcSwitchingDeviceTypeEnumCount = 13

export { IfcSwitchingDeviceTypeEnum, IfcSwitchingDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSwitchingDeviceTypeEnum =
  new Int32Array( [2,8,19,13] )

let prefixSumAddressIfcSwitchingDeviceTypeEnum =
  new Uint32Array( [0,7,23,40,66,77,90,110,125,137,146,160,174,182] )

let slotMapIfcSwitchingDeviceTypeEnum =
  new Int32Array( [5,6,4,8,0,11,9,2,12,7,10,1,3] )

let encodedDataIfcSwitchingDeviceTypeEnum =
  (new TextEncoder()).encode( ".RELAY..SELECTORSWITCH..MOMENTARYSWITCH..START_AND_STOP_EQUIPMENT..CONTACTOR..USERDEFINED..SWITCHDISCONNECTOR..EMERGENCYSTOP..NOTDEFINED..STARTER..TOGGLESWITCH..DIMMERSWITCH..KEYPAD." )

let IfcSwitchingDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcSwitchingDeviceTypeEnum >( gMapIfcSwitchingDeviceTypeEnum, prefixSumAddressIfcSwitchingDeviceTypeEnum, slotMapIfcSwitchingDeviceTypeEnum, encodedDataIfcSwitchingDeviceTypeEnum )

export { IfcSwitchingDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSwitchingDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSwitchingDeviceTypeEnum | undefined {
  return parser.extract< IfcSwitchingDeviceTypeEnum >( IfcSwitchingDeviceTypeEnumSearch, input, cursor, endCursor )
}
