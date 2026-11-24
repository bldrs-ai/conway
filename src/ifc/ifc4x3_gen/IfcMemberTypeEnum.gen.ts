/* This is generated code, don't alter */
enum IfcMemberTypeEnum {
  ARCH_SEGMENT = 0,
  BRACE = 1,
  CHORD = 2,
  COLLAR = 3,
  MEMBER = 4,
  MULLION = 5,
  PLATE = 6,
  POST = 7,
  PURLIN = 8,
  RAFTER = 9,
  STAY_CABLE = 10,
  STIFFENING_RIB = 11,
  STRINGER = 12,
  STRUCTURALCABLE = 13,
  STRUT = 14,
  STUD = 15,
  SUSPENDER = 16,
  SUSPENSION_CABLE = 17,
  TIEBAR = 18,
  USERDEFINED = 19,
  NOTDEFINED = 20,
}

const IfcMemberTypeEnumCount = 21

export { IfcMemberTypeEnum, IfcMemberTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMemberTypeEnum =
  new Int32Array( [148,-16,2,480,26] )

let prefixSumAddressIfcMemberTypeEnum =
  new Uint32Array( [0,16,22,34,42,48,66,74,86,99,106,115,132,140,147,154,168,175,186,194,202,212] )

let slotMapIfcMemberTypeEnum =
  new Int32Array( [11,7,10,18,15,17,4,20,19,1,5,13,3,14,2,0,6,16,9,8,12] )

let encodedDataIfcMemberTypeEnum =
  (new TextEncoder()).encode( ".STIFFENING_RIB..POST..STAY_CABLE..TIEBAR..STUD..SUSPENSION_CABLE..MEMBER..NOTDEFINED..USERDEFINED..BRACE..MULLION..STRUCTURALCABLE..COLLAR..STRUT..CHORD..ARCH_SEGMENT..PLATE..SUSPENDER..RAFTER..PURLIN..STRINGER." )

let IfcMemberTypeEnumSearch =
  new MinimalPerfectHash< IfcMemberTypeEnum >( gMapIfcMemberTypeEnum, prefixSumAddressIfcMemberTypeEnum, slotMapIfcMemberTypeEnum, encodedDataIfcMemberTypeEnum )

export { IfcMemberTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMemberTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMemberTypeEnum | undefined {
  return parser.extract< IfcMemberTypeEnum >( IfcMemberTypeEnumSearch, input, cursor, endCursor )
}
