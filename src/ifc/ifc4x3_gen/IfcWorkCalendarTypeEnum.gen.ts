/* This is generated code, don't alter */
enum IfcWorkCalendarTypeEnum {
  FIRSTSHIFT = 0,
  SECONDSHIFT = 1,
  THIRDSHIFT = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcWorkCalendarTypeEnumCount = 5

export { IfcWorkCalendarTypeEnum, IfcWorkCalendarTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWorkCalendarTypeEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcWorkCalendarTypeEnum =
  new Uint32Array( [0,13,25,37,50,62] )

let slotMapIfcWorkCalendarTypeEnum =
  new Int32Array( [3,4,0,1,2] )

let encodedDataIfcWorkCalendarTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED..FIRSTSHIFT..SECONDSHIFT..THIRDSHIFT." )

let IfcWorkCalendarTypeEnumSearch =
  new MinimalPerfectHash< IfcWorkCalendarTypeEnum >( gMapIfcWorkCalendarTypeEnum, prefixSumAddressIfcWorkCalendarTypeEnum, slotMapIfcWorkCalendarTypeEnum, encodedDataIfcWorkCalendarTypeEnum )

export { IfcWorkCalendarTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWorkCalendarTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWorkCalendarTypeEnum | undefined {
  return parser.extract< IfcWorkCalendarTypeEnum >( IfcWorkCalendarTypeEnumSearch, input, cursor, endCursor )
}
