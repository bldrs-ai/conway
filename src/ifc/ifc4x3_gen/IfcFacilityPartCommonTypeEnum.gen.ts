/* This is generated code, don't alter */
enum IfcFacilityPartCommonTypeEnum {
  ABOVEGROUND = 0,
  BELOWGROUND = 1,
  JUNCTION = 2,
  LEVELCROSSING = 3,
  SEGMENT = 4,
  SUBSTRUCTURE = 5,
  SUPERSTRUCTURE = 6,
  TERMINAL = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcFacilityPartCommonTypeEnumCount = 10

export { IfcFacilityPartCommonTypeEnum, IfcFacilityPartCommonTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFacilityPartCommonTypeEnum =
  new Int32Array( [3,-1,101] )

let prefixSumAddressIfcFacilityPartCommonTypeEnum =
  new Uint32Array( [0,14,30,42,52,65,78,91,100,115,125] )

let slotMapIfcFacilityPartCommonTypeEnum =
  new Int32Array( [5,6,9,2,1,8,0,4,3,7] )

let encodedDataIfcFacilityPartCommonTypeEnum =
  (new TextEncoder()).encode( ".SUBSTRUCTURE..SUPERSTRUCTURE..NOTDEFINED..JUNCTION..BELOWGROUND..USERDEFINED..ABOVEGROUND..SEGMENT..LEVELCROSSING..TERMINAL." )

let IfcFacilityPartCommonTypeEnumSearch =
  new MinimalPerfectHash< IfcFacilityPartCommonTypeEnum >( gMapIfcFacilityPartCommonTypeEnum, prefixSumAddressIfcFacilityPartCommonTypeEnum, slotMapIfcFacilityPartCommonTypeEnum, encodedDataIfcFacilityPartCommonTypeEnum )

export { IfcFacilityPartCommonTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFacilityPartCommonTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFacilityPartCommonTypeEnum | undefined {
  return parser.extract< IfcFacilityPartCommonTypeEnum >( IfcFacilityPartCommonTypeEnumSearch, input, cursor, endCursor )
}
