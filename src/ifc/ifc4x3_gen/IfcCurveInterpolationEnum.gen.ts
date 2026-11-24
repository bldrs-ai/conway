/* This is generated code, don't alter */
enum IfcCurveInterpolationEnum {
  LINEAR = 0,
  LOG_LINEAR = 1,
  LOG_LOG = 2,
  NOTDEFINED = 3,
}

const IfcCurveInterpolationEnumCount = 4

export { IfcCurveInterpolationEnum, IfcCurveInterpolationEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCurveInterpolationEnum =
  new Int32Array( [19] )

let prefixSumAddressIfcCurveInterpolationEnum =
  new Uint32Array( [0,9,21,29,41] )

let slotMapIfcCurveInterpolationEnum =
  new Int32Array( [2,3,0,1] )

let encodedDataIfcCurveInterpolationEnum =
  (new TextEncoder()).encode( ".LOG_LOG..NOTDEFINED..LINEAR..LOG_LINEAR." )

let IfcCurveInterpolationEnumSearch =
  new MinimalPerfectHash< IfcCurveInterpolationEnum >( gMapIfcCurveInterpolationEnum, prefixSumAddressIfcCurveInterpolationEnum, slotMapIfcCurveInterpolationEnum, encodedDataIfcCurveInterpolationEnum )

export { IfcCurveInterpolationEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCurveInterpolationEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCurveInterpolationEnum | undefined {
  return parser.extract< IfcCurveInterpolationEnum >( IfcCurveInterpolationEnumSearch, input, cursor, endCursor )
}
