/* This is generated code, don't alter */
enum IfcBSplineSurfaceForm {
  CONICAL_SURF = 0,
  CYLINDRICAL_SURF = 1,
  GENERALISED_CONE = 2,
  PLANE_SURF = 3,
  QUADRIC_SURF = 4,
  RULED_SURF = 5,
  SPHERICAL_SURF = 6,
  SURF_OF_LINEAR_EXTRUSION = 7,
  SURF_OF_REVOLUTION = 8,
  TOROIDAL_SURF = 9,
  UNSPECIFIED = 10,
}

const IfcBSplineSurfaceFormCount = 11

export { IfcBSplineSurfaceForm, IfcBSplineSurfaceFormCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBSplineSurfaceForm =
  new Int32Array( [7,120,17] )

let prefixSumAddressIfcBSplineSurfaceForm =
  new Uint32Array( [0,18,34,48,60,86,106,120,132,150,165,178] )

let slotMapIfcBSplineSurfaceForm =
  new Int32Array( [2,6,0,3,7,8,4,5,1,9,10] )

let encodedDataIfcBSplineSurfaceForm =
  (new TextEncoder()).encode( ".GENERALISED_CONE..SPHERICAL_SURF..CONICAL_SURF..PLANE_SURF..SURF_OF_LINEAR_EXTRUSION..SURF_OF_REVOLUTION..QUADRIC_SURF..RULED_SURF..CYLINDRICAL_SURF..TOROIDAL_SURF..UNSPECIFIED." )

let IfcBSplineSurfaceFormSearch =
  new MinimalPerfectHash< IfcBSplineSurfaceForm >( gMapIfcBSplineSurfaceForm, prefixSumAddressIfcBSplineSurfaceForm, slotMapIfcBSplineSurfaceForm, encodedDataIfcBSplineSurfaceForm )

export { IfcBSplineSurfaceFormSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBSplineSurfaceFormDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBSplineSurfaceForm | undefined {
  return parser.extract< IfcBSplineSurfaceForm >( IfcBSplineSurfaceFormSearch, input, cursor, endCursor )
}
