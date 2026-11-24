/* This is generated code, don't alter */
enum IfcBSplineCurveForm {
  CIRCULAR_ARC = 0,
  ELLIPTIC_ARC = 1,
  HYPERBOLIC_ARC = 2,
  PARABOLIC_ARC = 3,
  POLYLINE_FORM = 4,
  UNSPECIFIED = 5,
}

const IfcBSplineCurveFormCount = 6

export { IfcBSplineCurveForm, IfcBSplineCurveFormCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBSplineCurveForm =
  new Int32Array( [4] )

let prefixSumAddressIfcBSplineCurveForm =
  new Uint32Array( [0,16,31,44,59,73,87] )

let slotMapIfcBSplineCurveForm =
  new Int32Array( [2,3,5,4,0,1] )

let encodedDataIfcBSplineCurveForm =
  (new TextEncoder()).encode( ".HYPERBOLIC_ARC..PARABOLIC_ARC..UNSPECIFIED..POLYLINE_FORM..CIRCULAR_ARC..ELLIPTIC_ARC." )

let IfcBSplineCurveFormSearch =
  new MinimalPerfectHash< IfcBSplineCurveForm >( gMapIfcBSplineCurveForm, prefixSumAddressIfcBSplineCurveForm, slotMapIfcBSplineCurveForm, encodedDataIfcBSplineCurveForm )

export { IfcBSplineCurveFormSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBSplineCurveFormDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBSplineCurveForm | undefined {
  return parser.extract< IfcBSplineCurveForm >( IfcBSplineCurveFormSearch, input, cursor, endCursor )
}
