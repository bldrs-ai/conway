/* This is generated code, don't alter */
enum IfcWorkScheduleTypeEnum {
  ACTUAL = 0,
  BASELINE = 1,
  PLANNED = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcWorkScheduleTypeEnumCount = 5

export { IfcWorkScheduleTypeEnum, IfcWorkScheduleTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWorkScheduleTypeEnum =
  new Int32Array( [14] )

let prefixSumAddressIfcWorkScheduleTypeEnum =
  new Uint32Array( [0,10,19,31,39,52] )

let slotMapIfcWorkScheduleTypeEnum =
  new Int32Array( [1,2,4,0,3] )

let encodedDataIfcWorkScheduleTypeEnum =
  (new TextEncoder()).encode( ".BASELINE..PLANNED..NOTDEFINED..ACTUAL..USERDEFINED." )

let IfcWorkScheduleTypeEnumSearch =
  new MinimalPerfectHash< IfcWorkScheduleTypeEnum >( gMapIfcWorkScheduleTypeEnum, prefixSumAddressIfcWorkScheduleTypeEnum, slotMapIfcWorkScheduleTypeEnum, encodedDataIfcWorkScheduleTypeEnum )

export { IfcWorkScheduleTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWorkScheduleTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWorkScheduleTypeEnum | undefined {
  return parser.extract< IfcWorkScheduleTypeEnum >( IfcWorkScheduleTypeEnumSearch, input, cursor, endCursor )
}
