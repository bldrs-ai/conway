/* This is generated code, don't alter */
enum IfcFurnitureTypeEnum {
  BED = 0,
  CHAIR = 1,
  DESK = 2,
  FILECABINET = 3,
  SHELF = 4,
  SOFA = 5,
  TABLE = 6,
  TECHNICALCABINET = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcFurnitureTypeEnumCount = 10

export { IfcFurnitureTypeEnum, IfcFurnitureTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFurnitureTypeEnum =
  new Int32Array( [7,1,26] )

let prefixSumAddressIfcFurnitureTypeEnum =
  new Uint32Array( [0,5,18,24,30,37,49,62,69,76,94] )

let slotMapIfcFurnitureTypeEnum =
  new Int32Array( [0,8,5,2,1,9,3,4,6,7] )

let encodedDataIfcFurnitureTypeEnum =
  (new TextEncoder()).encode( ".BED..USERDEFINED..SOFA..DESK..CHAIR..NOTDEFINED..FILECABINET..SHELF..TABLE..TECHNICALCABINET." )

let IfcFurnitureTypeEnumSearch =
  new MinimalPerfectHash< IfcFurnitureTypeEnum >( gMapIfcFurnitureTypeEnum, prefixSumAddressIfcFurnitureTypeEnum, slotMapIfcFurnitureTypeEnum, encodedDataIfcFurnitureTypeEnum )

export { IfcFurnitureTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFurnitureTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFurnitureTypeEnum | undefined {
  return parser.extract< IfcFurnitureTypeEnum >( IfcFurnitureTypeEnumSearch, input, cursor, endCursor )
}
