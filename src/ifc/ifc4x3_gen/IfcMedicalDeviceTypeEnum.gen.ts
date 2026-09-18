/* This is generated code, don't alter */
enum IfcMedicalDeviceTypeEnum {
  AIRSTATION = 0,
  FEEDAIRUNIT = 1,
  OXYGENGENERATOR = 2,
  OXYGENPLANT = 3,
  VACUUMSTATION = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcMedicalDeviceTypeEnumCount = 7

export { IfcMedicalDeviceTypeEnum, IfcMedicalDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMedicalDeviceTypeEnum =
  new Int32Array( [292] )

let prefixSumAddressIfcMedicalDeviceTypeEnum =
  new Uint32Array( [0,13,25,42,54,67,80,95] )

let slotMapIfcMedicalDeviceTypeEnum =
  new Int32Array( [1,6,2,0,5,3,4] )

let encodedDataIfcMedicalDeviceTypeEnum =
  (new TextEncoder()).encode( ".FEEDAIRUNIT..NOTDEFINED..OXYGENGENERATOR..AIRSTATION..USERDEFINED..OXYGENPLANT..VACUUMSTATION." )

let IfcMedicalDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcMedicalDeviceTypeEnum >( gMapIfcMedicalDeviceTypeEnum, prefixSumAddressIfcMedicalDeviceTypeEnum, slotMapIfcMedicalDeviceTypeEnum, encodedDataIfcMedicalDeviceTypeEnum )

export { IfcMedicalDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMedicalDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMedicalDeviceTypeEnum | undefined {
  return parser.extract< IfcMedicalDeviceTypeEnum >( IfcMedicalDeviceTypeEnumSearch, input, cursor, endCursor )
}
