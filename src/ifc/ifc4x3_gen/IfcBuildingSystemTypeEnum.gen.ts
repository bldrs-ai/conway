/* This is generated code, don't alter */
enum IfcBuildingSystemTypeEnum {
  FENESTRATION = 0,
  FOUNDATION = 1,
  LOADBEARING = 2,
  OUTERSHELL = 3,
  SHADING = 4,
  TRANSPORT = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcBuildingSystemTypeEnumCount = 8

export { IfcBuildingSystemTypeEnum, IfcBuildingSystemTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBuildingSystemTypeEnum =
  new Int32Array( [1,24,-4] )

let prefixSumAddressIfcBuildingSystemTypeEnum =
  new Uint32Array( [0,9,21,33,47,59,70,83,96] )

let slotMapIfcBuildingSystemTypeEnum =
  new Int32Array( [4,1,3,0,7,5,6,2] )

let encodedDataIfcBuildingSystemTypeEnum =
  (new TextEncoder()).encode( ".SHADING..FOUNDATION..OUTERSHELL..FENESTRATION..NOTDEFINED..TRANSPORT..USERDEFINED..LOADBEARING." )

let IfcBuildingSystemTypeEnumSearch =
  new MinimalPerfectHash< IfcBuildingSystemTypeEnum >( gMapIfcBuildingSystemTypeEnum, prefixSumAddressIfcBuildingSystemTypeEnum, slotMapIfcBuildingSystemTypeEnum, encodedDataIfcBuildingSystemTypeEnum )

export { IfcBuildingSystemTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBuildingSystemTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBuildingSystemTypeEnum | undefined {
  return parser.extract< IfcBuildingSystemTypeEnum >( IfcBuildingSystemTypeEnumSearch, input, cursor, endCursor )
}
