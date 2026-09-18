/* This is generated code, don't alter */
enum IfcConstructionMaterialResourceTypeEnum {
  AGGREGATES = 0,
  CONCRETE = 1,
  DRYWALL = 2,
  FUEL = 3,
  GYPSUM = 4,
  MASONRY = 5,
  METAL = 6,
  PLASTIC = 7,
  WOOD = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcConstructionMaterialResourceTypeEnumCount = 11

export { IfcConstructionMaterialResourceTypeEnum, IfcConstructionMaterialResourceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcConstructionMaterialResourceTypeEnum =
  new Int32Array( [203,10,5] )

let prefixSumAddressIfcConstructionMaterialResourceTypeEnum =
  new Uint32Array( [0,6,16,29,37,46,55,67,76,82,89,101] )

let slotMapIfcConstructionMaterialResourceTypeEnum =
  new Int32Array( [8,1,9,4,5,7,0,2,3,6,10] )

let encodedDataIfcConstructionMaterialResourceTypeEnum =
  (new TextEncoder()).encode( ".WOOD..CONCRETE..USERDEFINED..GYPSUM..MASONRY..PLASTIC..AGGREGATES..DRYWALL..FUEL..METAL..NOTDEFINED." )

let IfcConstructionMaterialResourceTypeEnumSearch =
  new MinimalPerfectHash< IfcConstructionMaterialResourceTypeEnum >( gMapIfcConstructionMaterialResourceTypeEnum, prefixSumAddressIfcConstructionMaterialResourceTypeEnum, slotMapIfcConstructionMaterialResourceTypeEnum, encodedDataIfcConstructionMaterialResourceTypeEnum )

export { IfcConstructionMaterialResourceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcConstructionMaterialResourceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcConstructionMaterialResourceTypeEnum | undefined {
  return parser.extract< IfcConstructionMaterialResourceTypeEnum >( IfcConstructionMaterialResourceTypeEnumSearch, input, cursor, endCursor )
}
