/* This is generated code, don't alter */
enum IfcSolarDeviceTypeEnum {
  SOLARCOLLECTOR = 0,
  SOLARPANEL = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcSolarDeviceTypeEnumCount = 4

export { IfcSolarDeviceTypeEnum, IfcSolarDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSolarDeviceTypeEnum =
  new Int32Array( [28] )

let prefixSumAddressIfcSolarDeviceTypeEnum =
  new Uint32Array( [0,13,25,37,53] )

let slotMapIfcSolarDeviceTypeEnum =
  new Int32Array( [2,1,3,0] )

let encodedDataIfcSolarDeviceTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..SOLARPANEL..NOTDEFINED..SOLARCOLLECTOR." )

let IfcSolarDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcSolarDeviceTypeEnum >( gMapIfcSolarDeviceTypeEnum, prefixSumAddressIfcSolarDeviceTypeEnum, slotMapIfcSolarDeviceTypeEnum, encodedDataIfcSolarDeviceTypeEnum )

export { IfcSolarDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSolarDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSolarDeviceTypeEnum | undefined {
  return parser.extract< IfcSolarDeviceTypeEnum >( IfcSolarDeviceTypeEnumSearch, input, cursor, endCursor )
}
