/* This is generated code, don't alter */
enum IfcProtectiveDeviceTypeEnum {
  ANTI_ARCING_DEVICE = 0,
  CIRCUITBREAKER = 1,
  EARTHINGSWITCH = 2,
  EARTHLEAKAGECIRCUITBREAKER = 3,
  FUSEDISCONNECTOR = 4,
  RESIDUALCURRENTCIRCUITBREAKER = 5,
  RESIDUALCURRENTSWITCH = 6,
  SPARKGAP = 7,
  VARISTOR = 8,
  VOLTAGELIMITER = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcProtectiveDeviceTypeEnumCount = 12

export { IfcProtectiveDeviceTypeEnum, IfcProtectiveDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProtectiveDeviceTypeEnum =
  new Int32Array( [2,282,-6] )

let prefixSumAddressIfcProtectiveDeviceTypeEnum =
  new Uint32Array( [0,10,26,42,73,96,112,124,144,172,190,200,213] )

let slotMapIfcProtectiveDeviceTypeEnum =
  new Int32Array( [7,9,1,5,6,2,11,0,3,4,8,10] )

let encodedDataIfcProtectiveDeviceTypeEnum =
  (new TextEncoder()).encode( ".SPARKGAP..VOLTAGELIMITER..CIRCUITBREAKER..RESIDUALCURRENTCIRCUITBREAKER..RESIDUALCURRENTSWITCH..EARTHINGSWITCH..NOTDEFINED..ANTI_ARCING_DEVICE..EARTHLEAKAGECIRCUITBREAKER..FUSEDISCONNECTOR..VARISTOR..USERDEFINED." )

let IfcProtectiveDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcProtectiveDeviceTypeEnum >( gMapIfcProtectiveDeviceTypeEnum, prefixSumAddressIfcProtectiveDeviceTypeEnum, slotMapIfcProtectiveDeviceTypeEnum, encodedDataIfcProtectiveDeviceTypeEnum )

export { IfcProtectiveDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProtectiveDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProtectiveDeviceTypeEnum | undefined {
  return parser.extract< IfcProtectiveDeviceTypeEnum >( IfcProtectiveDeviceTypeEnumSearch, input, cursor, endCursor )
}
