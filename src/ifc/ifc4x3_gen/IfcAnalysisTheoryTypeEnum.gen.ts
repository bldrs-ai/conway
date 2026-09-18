/* This is generated code, don't alter */
enum IfcAnalysisTheoryTypeEnum {
  FIRST_ORDER_THEORY = 0,
  FULL_NONLINEAR_THEORY = 1,
  SECOND_ORDER_THEORY = 2,
  THIRD_ORDER_THEORY = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcAnalysisTheoryTypeEnumCount = 6

export { IfcAnalysisTheoryTypeEnum, IfcAnalysisTheoryTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAnalysisTheoryTypeEnum =
  new Int32Array( [230] )

let prefixSumAddressIfcAnalysisTheoryTypeEnum =
  new Uint32Array( [0,23,44,56,76,96,109] )

let slotMapIfcAnalysisTheoryTypeEnum =
  new Int32Array( [1,2,5,0,3,4] )

let encodedDataIfcAnalysisTheoryTypeEnum =
  (new TextEncoder()).encode( ".FULL_NONLINEAR_THEORY..SECOND_ORDER_THEORY..NOTDEFINED..FIRST_ORDER_THEORY..THIRD_ORDER_THEORY..USERDEFINED." )

let IfcAnalysisTheoryTypeEnumSearch =
  new MinimalPerfectHash< IfcAnalysisTheoryTypeEnum >( gMapIfcAnalysisTheoryTypeEnum, prefixSumAddressIfcAnalysisTheoryTypeEnum, slotMapIfcAnalysisTheoryTypeEnum, encodedDataIfcAnalysisTheoryTypeEnum )

export { IfcAnalysisTheoryTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAnalysisTheoryTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAnalysisTheoryTypeEnum | undefined {
  return parser.extract< IfcAnalysisTheoryTypeEnum >( IfcAnalysisTheoryTypeEnumSearch, input, cursor, endCursor )
}
