/* This is generated code, don't alter */
enum IfcProtectiveDeviceTrippingUnitTypeEnum {
  ELECTROMAGNETIC = 0,
  ELECTRONIC = 1,
  RESIDUALCURRENT = 2,
  THERMAL = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcProtectiveDeviceTrippingUnitTypeEnumCount = 6

export { IfcProtectiveDeviceTrippingUnitTypeEnum, IfcProtectiveDeviceTrippingUnitTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProtectiveDeviceTrippingUnitTypeEnum =
  new Int32Array( [44] )

let prefixSumAddressIfcProtectiveDeviceTrippingUnitTypeEnum =
  new Uint32Array( [0,17,30,42,51,68,80] )

let slotMapIfcProtectiveDeviceTrippingUnitTypeEnum =
  new Int32Array( [0,4,1,3,2,5] )

let encodedDataIfcProtectiveDeviceTrippingUnitTypeEnum =
  (new TextEncoder()).encode( ".ELECTROMAGNETIC..USERDEFINED..ELECTRONIC..THERMAL..RESIDUALCURRENT..NOTDEFINED." )

let IfcProtectiveDeviceTrippingUnitTypeEnumSearch =
  new MinimalPerfectHash< IfcProtectiveDeviceTrippingUnitTypeEnum >( gMapIfcProtectiveDeviceTrippingUnitTypeEnum, prefixSumAddressIfcProtectiveDeviceTrippingUnitTypeEnum, slotMapIfcProtectiveDeviceTrippingUnitTypeEnum, encodedDataIfcProtectiveDeviceTrippingUnitTypeEnum )

export { IfcProtectiveDeviceTrippingUnitTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProtectiveDeviceTrippingUnitTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProtectiveDeviceTrippingUnitTypeEnum | undefined {
  return parser.extract< IfcProtectiveDeviceTrippingUnitTypeEnum >( IfcProtectiveDeviceTrippingUnitTypeEnumSearch, input, cursor, endCursor )
}
