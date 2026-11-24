/* This is generated code, don't alter */
enum IfcElectricFlowStorageDeviceTypeEnum {
  BATTERY = 0,
  CAPACITOR = 1,
  CAPACITORBANK = 2,
  COMPENSATOR = 3,
  HARMONICFILTER = 4,
  INDUCTOR = 5,
  INDUCTORBANK = 6,
  RECHARGER = 7,
  UPS = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcElectricFlowStorageDeviceTypeEnumCount = 11

export { IfcElectricFlowStorageDeviceTypeEnum, IfcElectricFlowStorageDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricFlowStorageDeviceTypeEnum =
  new Int32Array( [1,74,6] )

let prefixSumAddressIfcElectricFlowStorageDeviceTypeEnum =
  new Uint32Array( [0,13,24,33,44,57,69,74,88,104,119,129] )

let slotMapIfcElectricFlowStorageDeviceTypeEnum =
  new Int32Array( [3,7,0,1,9,10,8,6,4,2,5] )

let encodedDataIfcElectricFlowStorageDeviceTypeEnum =
  (new TextEncoder()).encode( ".COMPENSATOR..RECHARGER..BATTERY..CAPACITOR..USERDEFINED..NOTDEFINED..UPS..INDUCTORBANK..HARMONICFILTER..CAPACITORBANK..INDUCTOR." )

let IfcElectricFlowStorageDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricFlowStorageDeviceTypeEnum >( gMapIfcElectricFlowStorageDeviceTypeEnum, prefixSumAddressIfcElectricFlowStorageDeviceTypeEnum, slotMapIfcElectricFlowStorageDeviceTypeEnum, encodedDataIfcElectricFlowStorageDeviceTypeEnum )

export { IfcElectricFlowStorageDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricFlowStorageDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricFlowStorageDeviceTypeEnum | undefined {
  return parser.extract< IfcElectricFlowStorageDeviceTypeEnum >( IfcElectricFlowStorageDeviceTypeEnumSearch, input, cursor, endCursor )
}
