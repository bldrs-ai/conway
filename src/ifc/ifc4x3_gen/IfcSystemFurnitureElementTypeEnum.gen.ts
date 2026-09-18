/* This is generated code, don't alter */
enum IfcSystemFurnitureElementTypeEnum {
  PANEL = 0,
  SUBRACK = 1,
  WORKSURFACE = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcSystemFurnitureElementTypeEnumCount = 5

export { IfcSystemFurnitureElementTypeEnum, IfcSystemFurnitureElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSystemFurnitureElementTypeEnum =
  new Int32Array( [6] )

let prefixSumAddressIfcSystemFurnitureElementTypeEnum =
  new Uint32Array( [0,13,26,38,45,54] )

let slotMapIfcSystemFurnitureElementTypeEnum =
  new Int32Array( [3,2,4,0,1] )

let encodedDataIfcSystemFurnitureElementTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..WORKSURFACE..NOTDEFINED..PANEL..SUBRACK." )

let IfcSystemFurnitureElementTypeEnumSearch =
  new MinimalPerfectHash< IfcSystemFurnitureElementTypeEnum >( gMapIfcSystemFurnitureElementTypeEnum, prefixSumAddressIfcSystemFurnitureElementTypeEnum, slotMapIfcSystemFurnitureElementTypeEnum, encodedDataIfcSystemFurnitureElementTypeEnum )

export { IfcSystemFurnitureElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSystemFurnitureElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSystemFurnitureElementTypeEnum | undefined {
  return parser.extract< IfcSystemFurnitureElementTypeEnum >( IfcSystemFurnitureElementTypeEnumSearch, input, cursor, endCursor )
}
