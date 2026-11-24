/* This is generated code, don't alter */
enum IfcCostItemTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcCostItemTypeEnumCount = 2

export { IfcCostItemTypeEnum, IfcCostItemTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCostItemTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcCostItemTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcCostItemTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcCostItemTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcCostItemTypeEnumSearch =
  new MinimalPerfectHash< IfcCostItemTypeEnum >( gMapIfcCostItemTypeEnum, prefixSumAddressIfcCostItemTypeEnum, slotMapIfcCostItemTypeEnum, encodedDataIfcCostItemTypeEnum )

export { IfcCostItemTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCostItemTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCostItemTypeEnum | undefined {
  return parser.extract< IfcCostItemTypeEnum >( IfcCostItemTypeEnumSearch, input, cursor, endCursor )
}
