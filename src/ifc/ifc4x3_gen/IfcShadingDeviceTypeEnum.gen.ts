/* This is generated code, don't alter */
enum IfcShadingDeviceTypeEnum {
  AWNING = 0,
  JALOUSIE = 1,
  SHUTTER = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcShadingDeviceTypeEnumCount = 5

export { IfcShadingDeviceTypeEnum, IfcShadingDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcShadingDeviceTypeEnum =
  new Int32Array( [6] )

let prefixSumAddressIfcShadingDeviceTypeEnum =
  new Uint32Array( [0,13,22,34,44,52] )

let slotMapIfcShadingDeviceTypeEnum =
  new Int32Array( [3,2,4,1,0] )

let encodedDataIfcShadingDeviceTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..SHUTTER..NOTDEFINED..JALOUSIE..AWNING." )

let IfcShadingDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcShadingDeviceTypeEnum >( gMapIfcShadingDeviceTypeEnum, prefixSumAddressIfcShadingDeviceTypeEnum, slotMapIfcShadingDeviceTypeEnum, encodedDataIfcShadingDeviceTypeEnum )

export { IfcShadingDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcShadingDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcShadingDeviceTypeEnum | undefined {
  return parser.extract< IfcShadingDeviceTypeEnum >( IfcShadingDeviceTypeEnumSearch, input, cursor, endCursor )
}
