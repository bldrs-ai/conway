/* This is generated code, don't alter */
enum IfcKnotType {
  PIECEWISE_BEZIER_KNOTS = 0,
  QUASI_UNIFORM_KNOTS = 1,
  UNIFORM_KNOTS = 2,
  UNSPECIFIED = 3,
}

const IfcKnotTypeCount = 4

export { IfcKnotType, IfcKnotTypeCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcKnotType =
  new Int32Array( [3] )

let prefixSumAddressIfcKnotType =
  new Uint32Array( [0,21,36,60,73] )

let slotMapIfcKnotType =
  new Int32Array( [1,2,0,3] )

let encodedDataIfcKnotType =
  (new TextEncoder()).encode( ".QUASI_UNIFORM_KNOTS..UNIFORM_KNOTS..PIECEWISE_BEZIER_KNOTS..UNSPECIFIED." )

let IfcKnotTypeSearch =
  new MinimalPerfectHash< IfcKnotType >( gMapIfcKnotType, prefixSumAddressIfcKnotType, slotMapIfcKnotType, encodedDataIfcKnotType )

export { IfcKnotTypeSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcKnotTypeDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcKnotType | undefined {
  return parser.extract< IfcKnotType >( IfcKnotTypeSearch, input, cursor, endCursor )
}
