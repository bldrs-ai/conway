/* This is generated code, don't alter */
enum IfcSpaceTypeEnum {
  BERTH = 0,
  EXTERNAL = 1,
  GFA = 2,
  INTERNAL = 3,
  PARKING = 4,
  SPACE = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcSpaceTypeEnumCount = 8

export { IfcSpaceTypeEnum, IfcSpaceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSpaceTypeEnum =
  new Int32Array( [-1,3,2] )

let prefixSumAddressIfcSpaceTypeEnum =
  new Uint32Array( [0,12,25,35,44,54,59,66,73] )

let slotMapIfcSpaceTypeEnum =
  new Int32Array( [7,6,1,4,3,2,5,0] )

let encodedDataIfcSpaceTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..USERDEFINED..EXTERNAL..PARKING..INTERNAL..GFA..SPACE..BERTH." )

let IfcSpaceTypeEnumSearch =
  new MinimalPerfectHash< IfcSpaceTypeEnum >( gMapIfcSpaceTypeEnum, prefixSumAddressIfcSpaceTypeEnum, slotMapIfcSpaceTypeEnum, encodedDataIfcSpaceTypeEnum )

export { IfcSpaceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSpaceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSpaceTypeEnum | undefined {
  return parser.extract< IfcSpaceTypeEnum >( IfcSpaceTypeEnumSearch, input, cursor, endCursor )
}
