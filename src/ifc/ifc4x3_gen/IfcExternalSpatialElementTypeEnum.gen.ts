/* This is generated code, don't alter */
enum IfcExternalSpatialElementTypeEnum {
  EXTERNAL = 0,
  EXTERNAL_EARTH = 1,
  EXTERNAL_FIRE = 2,
  EXTERNAL_WATER = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcExternalSpatialElementTypeEnumCount = 6

export { IfcExternalSpatialElementTypeEnum, IfcExternalSpatialElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcExternalSpatialElementTypeEnum =
  new Int32Array( [14] )

let prefixSumAddressIfcExternalSpatialElementTypeEnum =
  new Uint32Array( [0,10,26,38,53,66,82] )

let slotMapIfcExternalSpatialElementTypeEnum =
  new Int32Array( [0,1,5,2,4,3] )

let encodedDataIfcExternalSpatialElementTypeEnum =
  (new TextEncoder()).encode( ".EXTERNAL..EXTERNAL_EARTH..NOTDEFINED..EXTERNAL_FIRE..USERDEFINED..EXTERNAL_WATER." )

let IfcExternalSpatialElementTypeEnumSearch =
  new MinimalPerfectHash< IfcExternalSpatialElementTypeEnum >( gMapIfcExternalSpatialElementTypeEnum, prefixSumAddressIfcExternalSpatialElementTypeEnum, slotMapIfcExternalSpatialElementTypeEnum, encodedDataIfcExternalSpatialElementTypeEnum )

export { IfcExternalSpatialElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcExternalSpatialElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcExternalSpatialElementTypeEnum | undefined {
  return parser.extract< IfcExternalSpatialElementTypeEnum >( IfcExternalSpatialElementTypeEnumSearch, input, cursor, endCursor )
}
