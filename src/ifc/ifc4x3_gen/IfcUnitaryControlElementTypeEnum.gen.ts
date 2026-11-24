/* This is generated code, don't alter */
enum IfcUnitaryControlElementTypeEnum {
  ALARMPANEL = 0,
  BASESTATIONCONTROLLER = 1,
  COMBINED = 2,
  CONTROLPANEL = 3,
  GASDETECTIONPANEL = 4,
  HUMIDISTAT = 5,
  INDICATORPANEL = 6,
  MIMICPANEL = 7,
  THERMOSTAT = 8,
  WEATHERSTATION = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcUnitaryControlElementTypeEnumCount = 12

export { IfcUnitaryControlElementTypeEnum, IfcUnitaryControlElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcUnitaryControlElementTypeEnum =
  new Int32Array( [-5,33,2] )

let prefixSumAddressIfcUnitaryControlElementTypeEnum =
  new Uint32Array( [0,16,28,40,56,68,81,93,107,130,149,159,171] )

let slotMapIfcUnitaryControlElementTypeEnum =
  new Int32Array( [9,5,8,6,11,10,7,3,1,4,2,0] )

let encodedDataIfcUnitaryControlElementTypeEnum =
  (new TextEncoder()).encode( ".WEATHERSTATION..HUMIDISTAT..THERMOSTAT..INDICATORPANEL..NOTDEFINED..USERDEFINED..MIMICPANEL..CONTROLPANEL..BASESTATIONCONTROLLER..GASDETECTIONPANEL..COMBINED..ALARMPANEL." )

let IfcUnitaryControlElementTypeEnumSearch =
  new MinimalPerfectHash< IfcUnitaryControlElementTypeEnum >( gMapIfcUnitaryControlElementTypeEnum, prefixSumAddressIfcUnitaryControlElementTypeEnum, slotMapIfcUnitaryControlElementTypeEnum, encodedDataIfcUnitaryControlElementTypeEnum )

export { IfcUnitaryControlElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcUnitaryControlElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcUnitaryControlElementTypeEnum | undefined {
  return parser.extract< IfcUnitaryControlElementTypeEnum >( IfcUnitaryControlElementTypeEnumSearch, input, cursor, endCursor )
}
