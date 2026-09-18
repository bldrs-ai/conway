/* This is generated code, don't alter */
enum IfcProjectionElementTypeEnum {
  BLISTER = 0,
  DEVIATOR = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcProjectionElementTypeEnumCount = 4

export { IfcProjectionElementTypeEnum, IfcProjectionElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProjectionElementTypeEnum =
  new Int32Array( [10] )

let prefixSumAddressIfcProjectionElementTypeEnum =
  new Uint32Array( [0,13,22,32,44] )

let slotMapIfcProjectionElementTypeEnum =
  new Int32Array( [2,0,1,3] )

let encodedDataIfcProjectionElementTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..BLISTER..DEVIATOR..NOTDEFINED." )

let IfcProjectionElementTypeEnumSearch =
  new MinimalPerfectHash< IfcProjectionElementTypeEnum >( gMapIfcProjectionElementTypeEnum, prefixSumAddressIfcProjectionElementTypeEnum, slotMapIfcProjectionElementTypeEnum, encodedDataIfcProjectionElementTypeEnum )

export { IfcProjectionElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProjectionElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProjectionElementTypeEnum | undefined {
  return parser.extract< IfcProjectionElementTypeEnum >( IfcProjectionElementTypeEnumSearch, input, cursor, endCursor )
}
