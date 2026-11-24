/* This is generated code, don't alter */
enum IfcElectricFlowTreatmentDeviceTypeEnum {
  ELECTRONICFILTER = 0,
  USERDEFINED = 1,
  NOTDEFINED = 2,
}

const IfcElectricFlowTreatmentDeviceTypeEnumCount = 3

export { IfcElectricFlowTreatmentDeviceTypeEnum, IfcElectricFlowTreatmentDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricFlowTreatmentDeviceTypeEnum =
  new Int32Array( [8] )

let prefixSumAddressIfcElectricFlowTreatmentDeviceTypeEnum =
  new Uint32Array( [0,13,31,43] )

let slotMapIfcElectricFlowTreatmentDeviceTypeEnum =
  new Int32Array( [1,0,2] )

let encodedDataIfcElectricFlowTreatmentDeviceTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..ELECTRONICFILTER..NOTDEFINED." )

let IfcElectricFlowTreatmentDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricFlowTreatmentDeviceTypeEnum >( gMapIfcElectricFlowTreatmentDeviceTypeEnum, prefixSumAddressIfcElectricFlowTreatmentDeviceTypeEnum, slotMapIfcElectricFlowTreatmentDeviceTypeEnum, encodedDataIfcElectricFlowTreatmentDeviceTypeEnum )

export { IfcElectricFlowTreatmentDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricFlowTreatmentDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricFlowTreatmentDeviceTypeEnum | undefined {
  return parser.extract< IfcElectricFlowTreatmentDeviceTypeEnum >( IfcElectricFlowTreatmentDeviceTypeEnumSearch, input, cursor, endCursor )
}
