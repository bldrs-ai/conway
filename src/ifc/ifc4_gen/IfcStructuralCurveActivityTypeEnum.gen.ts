/* This is generated code, don't alter */
enum IfcStructuralCurveActivityTypeEnum {
  CONST = 0,
  LINEAR = 1,
  POLYGONAL = 2,
  EQUIDISTANT = 3,
  SINUS = 4,
  PARABOLA = 5,
  DISCRETE = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcStructuralCurveActivityTypeEnumCount = 9

export { IfcStructuralCurveActivityTypeEnum, IfcStructuralCurveActivityTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStructuralCurveActivityTypeEnum =
  new Int32Array( [29,2,26] )

let prefixSumAddressIfcStructuralCurveActivityTypeEnum =
  new Uint32Array( [0,10,20,28,39,46,59,66,78,91] )

let slotMapIfcStructuralCurveActivityTypeEnum =
  new Int32Array( [5,6,1,2,0,3,4,8,7] )

let encodedDataIfcStructuralCurveActivityTypeEnum =
  (new TextEncoder()).encode( ".PARABOLA..DISCRETE..LINEAR..POLYGONAL..CONST..EQUIDISTANT..SINUS..NOTDEFINED..USERDEFINED." )

let IfcStructuralCurveActivityTypeEnumSearch =
  new MinimalPerfectHash< IfcStructuralCurveActivityTypeEnum >( gMapIfcStructuralCurveActivityTypeEnum, prefixSumAddressIfcStructuralCurveActivityTypeEnum, slotMapIfcStructuralCurveActivityTypeEnum, encodedDataIfcStructuralCurveActivityTypeEnum )

export { IfcStructuralCurveActivityTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStructuralCurveActivityTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStructuralCurveActivityTypeEnum | undefined {
  return parser.extract< IfcStructuralCurveActivityTypeEnum >( IfcStructuralCurveActivityTypeEnumSearch, input, cursor, endCursor )
}
