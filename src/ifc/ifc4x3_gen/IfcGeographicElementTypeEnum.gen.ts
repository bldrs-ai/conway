/* This is generated code, don't alter */
enum IfcGeographicElementTypeEnum {
  SOIL_BORING_POINT = 0,
  TERRAIN = 1,
  VEGETATION = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcGeographicElementTypeEnumCount = 5

export { IfcGeographicElementTypeEnum, IfcGeographicElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcGeographicElementTypeEnum =
  new Int32Array( [30] )

let prefixSumAddressIfcGeographicElementTypeEnum =
  new Uint32Array( [0,12,31,43,52,65] )

let slotMapIfcGeographicElementTypeEnum =
  new Int32Array( [2,0,4,1,3] )

let encodedDataIfcGeographicElementTypeEnum =
  (new TextEncoder()).encode( ".VEGETATION..SOIL_BORING_POINT..NOTDEFINED..TERRAIN..USERDEFINED." )

let IfcGeographicElementTypeEnumSearch =
  new MinimalPerfectHash< IfcGeographicElementTypeEnum >( gMapIfcGeographicElementTypeEnum, prefixSumAddressIfcGeographicElementTypeEnum, slotMapIfcGeographicElementTypeEnum, encodedDataIfcGeographicElementTypeEnum )

export { IfcGeographicElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcGeographicElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcGeographicElementTypeEnum | undefined {
  return parser.extract< IfcGeographicElementTypeEnum >( IfcGeographicElementTypeEnumSearch, input, cursor, endCursor )
}
