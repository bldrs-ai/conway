/* This is generated code, don't alter */
enum IfcGeometricProjectionEnum {
  ELEVATION_VIEW = 0,
  GRAPH_VIEW = 1,
  MODEL_VIEW = 2,
  PLAN_VIEW = 3,
  REFLECTED_PLAN_VIEW = 4,
  SECTION_VIEW = 5,
  SKETCH_VIEW = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcGeometricProjectionEnumCount = 9

export { IfcGeometricProjectionEnum, IfcGeometricProjectionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcGeometricProjectionEnum =
  new Int32Array( [20,9,2] )

let prefixSumAddressIfcGeometricProjectionEnum =
  new Uint32Array( [0,13,25,46,60,72,85,96,112,124] )

let slotMapIfcGeometricProjectionEnum =
  new Int32Array( [7,8,4,5,2,6,3,0,1] )

let encodedDataIfcGeometricProjectionEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED..REFLECTED_PLAN_VIEW..SECTION_VIEW..MODEL_VIEW..SKETCH_VIEW..PLAN_VIEW..ELEVATION_VIEW..GRAPH_VIEW." )

let IfcGeometricProjectionEnumSearch =
  new MinimalPerfectHash< IfcGeometricProjectionEnum >( gMapIfcGeometricProjectionEnum, prefixSumAddressIfcGeometricProjectionEnum, slotMapIfcGeometricProjectionEnum, encodedDataIfcGeometricProjectionEnum )

export { IfcGeometricProjectionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcGeometricProjectionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcGeometricProjectionEnum | undefined {
  return parser.extract< IfcGeometricProjectionEnum >( IfcGeometricProjectionEnumSearch, input, cursor, endCursor )
}
