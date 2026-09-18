/* This is generated code, don't alter */
enum IfcAnnotationTypeEnum {
  CONTOURLINE = 0,
  DIMENSION = 1,
  ISOBAR = 2,
  ISOLUX = 3,
  ISOTHERM = 4,
  LEADER = 5,
  SURVEY = 6,
  SYMBOL = 7,
  TEXT = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcAnnotationTypeEnumCount = 11

export { IfcAnnotationTypeEnum, IfcAnnotationTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAnnotationTypeEnum =
  new Int32Array( [9,-1,145] )

let prefixSumAddressIfcAnnotationTypeEnum =
  new Uint32Array( [0,8,19,27,35,45,57,65,78,84,92,105] )

let slotMapIfcAnnotationTypeEnum =
  new Int32Array( [7,1,2,5,4,10,6,0,8,3,9] )

let encodedDataIfcAnnotationTypeEnum =
  (new TextEncoder()).encode( ".SYMBOL..DIMENSION..ISOBAR..LEADER..ISOTHERM..NOTDEFINED..SURVEY..CONTOURLINE..TEXT..ISOLUX..USERDEFINED." )

let IfcAnnotationTypeEnumSearch =
  new MinimalPerfectHash< IfcAnnotationTypeEnum >( gMapIfcAnnotationTypeEnum, prefixSumAddressIfcAnnotationTypeEnum, slotMapIfcAnnotationTypeEnum, encodedDataIfcAnnotationTypeEnum )

export { IfcAnnotationTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAnnotationTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAnnotationTypeEnum | undefined {
  return parser.extract< IfcAnnotationTypeEnum >( IfcAnnotationTypeEnumSearch, input, cursor, endCursor )
}
