/* This is generated code, don't alter */
enum IfcVehicleTypeEnum {
  CARGO = 0,
  ROLLINGSTOCK = 1,
  VEHICLE = 2,
  VEHICLEAIR = 3,
  VEHICLEMARINE = 4,
  VEHICLETRACKED = 5,
  VEHICLEWHEELED = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcVehicleTypeEnumCount = 9

export { IfcVehicleTypeEnum, IfcVehicleTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcVehicleTypeEnum =
  new Int32Array( [-8,-2,43] )

let prefixSumAddressIfcVehicleTypeEnum =
  new Uint32Array( [0,9,16,32,47,59,71,87,101,114] )

let slotMapIfcVehicleTypeEnum =
  new Int32Array( [2,0,5,4,3,8,6,1,7] )

let encodedDataIfcVehicleTypeEnum =
  (new TextEncoder()).encode( ".VEHICLE..CARGO..VEHICLETRACKED..VEHICLEMARINE..VEHICLEAIR..NOTDEFINED..VEHICLEWHEELED..ROLLINGSTOCK..USERDEFINED." )

let IfcVehicleTypeEnumSearch =
  new MinimalPerfectHash< IfcVehicleTypeEnum >( gMapIfcVehicleTypeEnum, prefixSumAddressIfcVehicleTypeEnum, slotMapIfcVehicleTypeEnum, encodedDataIfcVehicleTypeEnum )

export { IfcVehicleTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcVehicleTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcVehicleTypeEnum | undefined {
  return parser.extract< IfcVehicleTypeEnum >( IfcVehicleTypeEnumSearch, input, cursor, endCursor )
}
