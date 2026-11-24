/* This is generated code, don't alter */
enum IfcNavigationElementTypeEnum {
  BEACON = 0,
  BUOY = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcNavigationElementTypeEnumCount = 4

export { IfcNavigationElementTypeEnum, IfcNavigationElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcNavigationElementTypeEnum =
  new Int32Array( [13] )

let prefixSumAddressIfcNavigationElementTypeEnum =
  new Uint32Array( [0,8,14,26,39] )

let slotMapIfcNavigationElementTypeEnum =
  new Int32Array( [0,1,3,2] )

let encodedDataIfcNavigationElementTypeEnum =
  (new TextEncoder()).encode( ".BEACON..BUOY..NOTDEFINED..USERDEFINED." )

let IfcNavigationElementTypeEnumSearch =
  new MinimalPerfectHash< IfcNavigationElementTypeEnum >( gMapIfcNavigationElementTypeEnum, prefixSumAddressIfcNavigationElementTypeEnum, slotMapIfcNavigationElementTypeEnum, encodedDataIfcNavigationElementTypeEnum )

export { IfcNavigationElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcNavigationElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcNavigationElementTypeEnum | undefined {
  return parser.extract< IfcNavigationElementTypeEnum >( IfcNavigationElementTypeEnumSearch, input, cursor, endCursor )
}
