/* This is generated code, don't alter */
enum IfcStructuralCurveMemberTypeEnum {
  CABLE = 0,
  COMPRESSION_MEMBER = 1,
  PIN_JOINED_MEMBER = 2,
  RIGID_JOINED_MEMBER = 3,
  TENSION_MEMBER = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcStructuralCurveMemberTypeEnumCount = 7

export { IfcStructuralCurveMemberTypeEnum, IfcStructuralCurveMemberTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStructuralCurveMemberTypeEnum =
  new Int32Array( [486] )

let prefixSumAddressIfcStructuralCurveMemberTypeEnum =
  new Uint32Array( [0,13,25,32,53,73,92,108] )

let slotMapIfcStructuralCurveMemberTypeEnum =
  new Int32Array( [5,6,0,3,1,2,4] )

let encodedDataIfcStructuralCurveMemberTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED..CABLE..RIGID_JOINED_MEMBER..COMPRESSION_MEMBER..PIN_JOINED_MEMBER..TENSION_MEMBER." )

let IfcStructuralCurveMemberTypeEnumSearch =
  new MinimalPerfectHash< IfcStructuralCurveMemberTypeEnum >( gMapIfcStructuralCurveMemberTypeEnum, prefixSumAddressIfcStructuralCurveMemberTypeEnum, slotMapIfcStructuralCurveMemberTypeEnum, encodedDataIfcStructuralCurveMemberTypeEnum )

export { IfcStructuralCurveMemberTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStructuralCurveMemberTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStructuralCurveMemberTypeEnum | undefined {
  return parser.extract< IfcStructuralCurveMemberTypeEnum >( IfcStructuralCurveMemberTypeEnumSearch, input, cursor, endCursor )
}
