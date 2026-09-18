/* This is generated code, don't alter */
enum IfcSpatialZoneTypeEnum {
  CONSTRUCTION = 0,
  FIRESAFETY = 1,
  INTERFERENCE = 2,
  LIGHTING = 3,
  OCCUPANCY = 4,
  RESERVATION = 5,
  SECURITY = 6,
  THERMAL = 7,
  TRANSPORT = 8,
  VENTILATION = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcSpatialZoneTypeEnumCount = 12

export { IfcSpatialZoneTypeEnum, IfcSpatialZoneTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSpatialZoneTypeEnum =
  new Int32Array( [300,20,3] )

let prefixSumAddressIfcSpatialZoneTypeEnum =
  new Uint32Array( [0,14,26,38,51,64,75,88,97,111,121,132,142] )

let slotMapIfcSpatialZoneTypeEnum =
  new Int32Array( [2,1,11,9,5,4,10,7,0,6,8,3] )

let encodedDataIfcSpatialZoneTypeEnum =
  (new TextEncoder()).encode( ".INTERFERENCE..FIRESAFETY..NOTDEFINED..VENTILATION..RESERVATION..OCCUPANCY..USERDEFINED..THERMAL..CONSTRUCTION..SECURITY..TRANSPORT..LIGHTING." )

let IfcSpatialZoneTypeEnumSearch =
  new MinimalPerfectHash< IfcSpatialZoneTypeEnum >( gMapIfcSpatialZoneTypeEnum, prefixSumAddressIfcSpatialZoneTypeEnum, slotMapIfcSpatialZoneTypeEnum, encodedDataIfcSpatialZoneTypeEnum )

export { IfcSpatialZoneTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSpatialZoneTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSpatialZoneTypeEnum | undefined {
  return parser.extract< IfcSpatialZoneTypeEnum >( IfcSpatialZoneTypeEnumSearch, input, cursor, endCursor )
}
