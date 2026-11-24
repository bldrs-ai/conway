/* This is generated code, don't alter */
enum IfcAlarmTypeEnum {
  BELL = 0,
  BREAKGLASSBUTTON = 1,
  LIGHT = 2,
  MANUALPULLBOX = 3,
  RAILWAYCROCODILE = 4,
  RAILWAYDETONATOR = 5,
  SIREN = 6,
  WHISTLE = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcAlarmTypeEnumCount = 10

export { IfcAlarmTypeEnum, IfcAlarmTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAlarmTypeEnum =
  new Int32Array( [2,56,22] )

let prefixSumAddressIfcAlarmTypeEnum =
  new Uint32Array( [0,18,36,43,55,73,82,97,103,110,123] )

let slotMapIfcAlarmTypeEnum =
  new Int32Array( [5,4,2,9,1,7,3,0,6,8] )

let encodedDataIfcAlarmTypeEnum =
  (new TextEncoder()).encode( ".RAILWAYDETONATOR..RAILWAYCROCODILE..LIGHT..NOTDEFINED..BREAKGLASSBUTTON..WHISTLE..MANUALPULLBOX..BELL..SIREN..USERDEFINED." )

let IfcAlarmTypeEnumSearch =
  new MinimalPerfectHash< IfcAlarmTypeEnum >( gMapIfcAlarmTypeEnum, prefixSumAddressIfcAlarmTypeEnum, slotMapIfcAlarmTypeEnum, encodedDataIfcAlarmTypeEnum )

export { IfcAlarmTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAlarmTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAlarmTypeEnum | undefined {
  return parser.extract< IfcAlarmTypeEnum >( IfcAlarmTypeEnumSearch, input, cursor, endCursor )
}
