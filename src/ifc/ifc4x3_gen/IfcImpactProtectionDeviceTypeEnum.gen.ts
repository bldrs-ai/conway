/* This is generated code, don't alter */
enum IfcImpactProtectionDeviceTypeEnum {
  BUMPER = 0,
  CRASHCUSHION = 1,
  DAMPINGSYSTEM = 2,
  FENDER = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcImpactProtectionDeviceTypeEnumCount = 6

export { IfcImpactProtectionDeviceTypeEnum, IfcImpactProtectionDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcImpactProtectionDeviceTypeEnum =
  new Int32Array( [82] )

let prefixSumAddressIfcImpactProtectionDeviceTypeEnum =
  new Uint32Array( [0,15,29,37,45,58,70] )

let slotMapIfcImpactProtectionDeviceTypeEnum =
  new Int32Array( [2,1,0,3,4,5] )

let encodedDataIfcImpactProtectionDeviceTypeEnum =
  (new TextEncoder()).encode( ".DAMPINGSYSTEM..CRASHCUSHION..BUMPER..FENDER..USERDEFINED..NOTDEFINED." )

let IfcImpactProtectionDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcImpactProtectionDeviceTypeEnum >( gMapIfcImpactProtectionDeviceTypeEnum, prefixSumAddressIfcImpactProtectionDeviceTypeEnum, slotMapIfcImpactProtectionDeviceTypeEnum, encodedDataIfcImpactProtectionDeviceTypeEnum )

export { IfcImpactProtectionDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcImpactProtectionDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcImpactProtectionDeviceTypeEnum | undefined {
  return parser.extract< IfcImpactProtectionDeviceTypeEnum >( IfcImpactProtectionDeviceTypeEnumSearch, input, cursor, endCursor )
}
