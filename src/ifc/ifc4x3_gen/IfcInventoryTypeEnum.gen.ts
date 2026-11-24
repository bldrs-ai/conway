/* This is generated code, don't alter */
enum IfcInventoryTypeEnum {
  ASSETINVENTORY = 0,
  FURNITUREINVENTORY = 1,
  SPACEINVENTORY = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcInventoryTypeEnumCount = 5

export { IfcInventoryTypeEnum, IfcInventoryTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcInventoryTypeEnum =
  new Int32Array( [35] )

let prefixSumAddressIfcInventoryTypeEnum =
  new Uint32Array( [0,16,36,49,61,77] )

let slotMapIfcInventoryTypeEnum =
  new Int32Array( [2,1,3,4,0] )

let encodedDataIfcInventoryTypeEnum =
  (new TextEncoder()).encode( ".SPACEINVENTORY..FURNITUREINVENTORY..USERDEFINED..NOTDEFINED..ASSETINVENTORY." )

let IfcInventoryTypeEnumSearch =
  new MinimalPerfectHash< IfcInventoryTypeEnum >( gMapIfcInventoryTypeEnum, prefixSumAddressIfcInventoryTypeEnum, slotMapIfcInventoryTypeEnum, encodedDataIfcInventoryTypeEnum )

export { IfcInventoryTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcInventoryTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcInventoryTypeEnum | undefined {
  return parser.extract< IfcInventoryTypeEnum >( IfcInventoryTypeEnumSearch, input, cursor, endCursor )
}
