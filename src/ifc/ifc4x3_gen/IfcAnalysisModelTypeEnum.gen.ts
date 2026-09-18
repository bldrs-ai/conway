/* This is generated code, don't alter */
enum IfcAnalysisModelTypeEnum {
  IN_PLANE_LOADING_2D = 0,
  LOADING_3D = 1,
  OUT_PLANE_LOADING_2D = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcAnalysisModelTypeEnumCount = 5

export { IfcAnalysisModelTypeEnum, IfcAnalysisModelTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAnalysisModelTypeEnum =
  new Int32Array( [40] )

let prefixSumAddressIfcAnalysisModelTypeEnum =
  new Uint32Array( [0,22,43,55,68,80] )

let slotMapIfcAnalysisModelTypeEnum =
  new Int32Array( [2,0,1,3,4] )

let encodedDataIfcAnalysisModelTypeEnum =
  (new TextEncoder()).encode( ".OUT_PLANE_LOADING_2D..IN_PLANE_LOADING_2D..LOADING_3D..USERDEFINED..NOTDEFINED." )

let IfcAnalysisModelTypeEnumSearch =
  new MinimalPerfectHash< IfcAnalysisModelTypeEnum >( gMapIfcAnalysisModelTypeEnum, prefixSumAddressIfcAnalysisModelTypeEnum, slotMapIfcAnalysisModelTypeEnum, encodedDataIfcAnalysisModelTypeEnum )

export { IfcAnalysisModelTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAnalysisModelTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAnalysisModelTypeEnum | undefined {
  return parser.extract< IfcAnalysisModelTypeEnum >( IfcAnalysisModelTypeEnumSearch, input, cursor, endCursor )
}
