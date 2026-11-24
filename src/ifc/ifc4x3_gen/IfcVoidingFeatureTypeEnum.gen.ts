/* This is generated code, don't alter */
enum IfcVoidingFeatureTypeEnum {
  CHAMFER = 0,
  CUTOUT = 1,
  EDGE = 2,
  HOLE = 3,
  MITER = 4,
  NOTCH = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcVoidingFeatureTypeEnumCount = 8

export { IfcVoidingFeatureTypeEnum, IfcVoidingFeatureTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcVoidingFeatureTypeEnum =
  new Int32Array( [1,-1,4] )

let prefixSumAddressIfcVoidingFeatureTypeEnum =
  new Uint32Array( [0,6,15,27,34,42,48,61,68] )

let slotMapIfcVoidingFeatureTypeEnum =
  new Int32Array( [3,0,7,5,1,2,6,4] )

let encodedDataIfcVoidingFeatureTypeEnum =
  (new TextEncoder()).encode( ".HOLE..CHAMFER..NOTDEFINED..NOTCH..CUTOUT..EDGE..USERDEFINED..MITER." )

let IfcVoidingFeatureTypeEnumSearch =
  new MinimalPerfectHash< IfcVoidingFeatureTypeEnum >( gMapIfcVoidingFeatureTypeEnum, prefixSumAddressIfcVoidingFeatureTypeEnum, slotMapIfcVoidingFeatureTypeEnum, encodedDataIfcVoidingFeatureTypeEnum )

export { IfcVoidingFeatureTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcVoidingFeatureTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcVoidingFeatureTypeEnum | undefined {
  return parser.extract< IfcVoidingFeatureTypeEnum >( IfcVoidingFeatureTypeEnumSearch, input, cursor, endCursor )
}
