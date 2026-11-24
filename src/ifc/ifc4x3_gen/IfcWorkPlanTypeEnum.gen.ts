/* This is generated code, don't alter */
enum IfcWorkPlanTypeEnum {
  ACTUAL = 0,
  BASELINE = 1,
  PLANNED = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcWorkPlanTypeEnumCount = 5

export { IfcWorkPlanTypeEnum, IfcWorkPlanTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWorkPlanTypeEnum =
  new Int32Array( [14] )

let prefixSumAddressIfcWorkPlanTypeEnum =
  new Uint32Array( [0,10,19,31,39,52] )

let slotMapIfcWorkPlanTypeEnum =
  new Int32Array( [1,2,4,0,3] )

let encodedDataIfcWorkPlanTypeEnum =
  (new TextEncoder()).encode( ".BASELINE..PLANNED..NOTDEFINED..ACTUAL..USERDEFINED." )

let IfcWorkPlanTypeEnumSearch =
  new MinimalPerfectHash< IfcWorkPlanTypeEnum >( gMapIfcWorkPlanTypeEnum, prefixSumAddressIfcWorkPlanTypeEnum, slotMapIfcWorkPlanTypeEnum, encodedDataIfcWorkPlanTypeEnum )

export { IfcWorkPlanTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWorkPlanTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWorkPlanTypeEnum | undefined {
  return parser.extract< IfcWorkPlanTypeEnum >( IfcWorkPlanTypeEnumSearch, input, cursor, endCursor )
}
