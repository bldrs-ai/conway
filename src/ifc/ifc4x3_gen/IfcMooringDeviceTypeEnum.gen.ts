/* This is generated code, don't alter */
enum IfcMooringDeviceTypeEnum {
  BOLLARD = 0,
  LINETENSIONER = 1,
  MAGNETICDEVICE = 2,
  MOORINGHOOKS = 3,
  VACUUMDEVICE = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcMooringDeviceTypeEnumCount = 7

export { IfcMooringDeviceTypeEnum, IfcMooringDeviceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMooringDeviceTypeEnum =
  new Int32Array( [60] )

let prefixSumAddressIfcMooringDeviceTypeEnum =
  new Uint32Array( [0,12,26,40,55,64,80,93] )

let slotMapIfcMooringDeviceTypeEnum =
  new Int32Array( [6,4,3,1,0,2,5] )

let encodedDataIfcMooringDeviceTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..VACUUMDEVICE..MOORINGHOOKS..LINETENSIONER..BOLLARD..MAGNETICDEVICE..USERDEFINED." )

let IfcMooringDeviceTypeEnumSearch =
  new MinimalPerfectHash< IfcMooringDeviceTypeEnum >( gMapIfcMooringDeviceTypeEnum, prefixSumAddressIfcMooringDeviceTypeEnum, slotMapIfcMooringDeviceTypeEnum, encodedDataIfcMooringDeviceTypeEnum )

export { IfcMooringDeviceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMooringDeviceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMooringDeviceTypeEnum | undefined {
  return parser.extract< IfcMooringDeviceTypeEnum >( IfcMooringDeviceTypeEnumSearch, input, cursor, endCursor )
}
