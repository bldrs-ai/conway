/* This is generated code, don't alter */
enum IfcUnitaryEquipmentTypeEnum {
  AIRHANDLER = 0,
  AIRCONDITIONINGUNIT = 1,
  DEHUMIDIFIER = 2,
  SPLITSYSTEM = 3,
  ROOFTOPUNIT = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcUnitaryEquipmentTypeEnumCount = 7

export { IfcUnitaryEquipmentTypeEnum, IfcUnitaryEquipmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcUnitaryEquipmentTypeEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcUnitaryEquipmentTypeEnum =
  new Uint32Array( [0,12,33,47,60,73,86,98] )

let slotMapIfcUnitaryEquipmentTypeEnum =
  new Int32Array( [6,1,2,4,3,5,0] )

let encodedDataIfcUnitaryEquipmentTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..AIRCONDITIONINGUNIT..DEHUMIDIFIER..ROOFTOPUNIT..SPLITSYSTEM..USERDEFINED..AIRHANDLER." )

let IfcUnitaryEquipmentTypeEnumSearch =
  new MinimalPerfectHash< IfcUnitaryEquipmentTypeEnum >( gMapIfcUnitaryEquipmentTypeEnum, prefixSumAddressIfcUnitaryEquipmentTypeEnum, slotMapIfcUnitaryEquipmentTypeEnum, encodedDataIfcUnitaryEquipmentTypeEnum )

export { IfcUnitaryEquipmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcUnitaryEquipmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcUnitaryEquipmentTypeEnum | undefined {
  return parser.extract< IfcUnitaryEquipmentTypeEnum >( IfcUnitaryEquipmentTypeEnumSearch, input, cursor, endCursor )
}
