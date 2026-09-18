/* This is generated code, don't alter */
enum IfcCourseTypeEnum {
  ARMOUR = 0,
  BALLASTBED = 1,
  CORE = 2,
  FILTER = 3,
  PAVEMENT = 4,
  PROTECTION = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcCourseTypeEnumCount = 8

export { IfcCourseTypeEnum, IfcCourseTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCourseTypeEnum =
  new Int32Array( [40,15,5] )

let prefixSumAddressIfcCourseTypeEnum =
  new Uint32Array( [0,8,14,24,32,44,57,69,81] )

let slotMapIfcCourseTypeEnum =
  new Int32Array( [3,2,4,0,5,6,1,7] )

let encodedDataIfcCourseTypeEnum =
  (new TextEncoder()).encode( ".FILTER..CORE..PAVEMENT..ARMOUR..PROTECTION..USERDEFINED..BALLASTBED..NOTDEFINED." )

let IfcCourseTypeEnumSearch =
  new MinimalPerfectHash< IfcCourseTypeEnum >( gMapIfcCourseTypeEnum, prefixSumAddressIfcCourseTypeEnum, slotMapIfcCourseTypeEnum, encodedDataIfcCourseTypeEnum )

export { IfcCourseTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCourseTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCourseTypeEnum | undefined {
  return parser.extract< IfcCourseTypeEnum >( IfcCourseTypeEnumSearch, input, cursor, endCursor )
}
