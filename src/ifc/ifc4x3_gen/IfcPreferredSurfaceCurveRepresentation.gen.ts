/* This is generated code, don't alter */
enum IfcPreferredSurfaceCurveRepresentation {
  CURVE3D = 0,
  PCURVE_S1 = 1,
  PCURVE_S2 = 2,
}

const IfcPreferredSurfaceCurveRepresentationCount = 3

export { IfcPreferredSurfaceCurveRepresentation, IfcPreferredSurfaceCurveRepresentationCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPreferredSurfaceCurveRepresentation =
  new Int32Array( [3] )

let prefixSumAddressIfcPreferredSurfaceCurveRepresentation =
  new Uint32Array( [0,11,22,31] )

let slotMapIfcPreferredSurfaceCurveRepresentation =
  new Int32Array( [1,2,0] )

let encodedDataIfcPreferredSurfaceCurveRepresentation =
  (new TextEncoder()).encode( ".PCURVE_S1..PCURVE_S2..CURVE3D." )

let IfcPreferredSurfaceCurveRepresentationSearch =
  new MinimalPerfectHash< IfcPreferredSurfaceCurveRepresentation >( gMapIfcPreferredSurfaceCurveRepresentation, prefixSumAddressIfcPreferredSurfaceCurveRepresentation, slotMapIfcPreferredSurfaceCurveRepresentation, encodedDataIfcPreferredSurfaceCurveRepresentation )

export { IfcPreferredSurfaceCurveRepresentationSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPreferredSurfaceCurveRepresentationDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPreferredSurfaceCurveRepresentation | undefined {
  return parser.extract< IfcPreferredSurfaceCurveRepresentation >( IfcPreferredSurfaceCurveRepresentationSearch, input, cursor, endCursor )
}
