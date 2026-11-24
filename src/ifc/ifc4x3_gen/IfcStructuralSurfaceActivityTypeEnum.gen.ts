/* This is generated code, don't alter */
enum IfcStructuralSurfaceActivityTypeEnum {
  BILINEAR = 0,
  CONST = 1,
  DISCRETE = 2,
  ISOCONTOUR = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcStructuralSurfaceActivityTypeEnumCount = 6

export { IfcStructuralSurfaceActivityTypeEnum, IfcStructuralSurfaceActivityTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStructuralSurfaceActivityTypeEnum =
  new Int32Array( [42] )

let prefixSumAddressIfcStructuralSurfaceActivityTypeEnum =
  new Uint32Array( [0,13,23,35,42,52,64] )

let slotMapIfcStructuralSurfaceActivityTypeEnum =
  new Int32Array( [4,2,5,1,0,3] )

let encodedDataIfcStructuralSurfaceActivityTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..DISCRETE..NOTDEFINED..CONST..BILINEAR..ISOCONTOUR." )

let IfcStructuralSurfaceActivityTypeEnumSearch =
  new MinimalPerfectHash< IfcStructuralSurfaceActivityTypeEnum >( gMapIfcStructuralSurfaceActivityTypeEnum, prefixSumAddressIfcStructuralSurfaceActivityTypeEnum, slotMapIfcStructuralSurfaceActivityTypeEnum, encodedDataIfcStructuralSurfaceActivityTypeEnum )

export { IfcStructuralSurfaceActivityTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStructuralSurfaceActivityTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStructuralSurfaceActivityTypeEnum | undefined {
  return parser.extract< IfcStructuralSurfaceActivityTypeEnum >( IfcStructuralSurfaceActivityTypeEnumSearch, input, cursor, endCursor )
}
