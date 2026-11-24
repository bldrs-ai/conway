/* This is generated code, don't alter */
enum IfcCoveringTypeEnum {
  CEILING = 0,
  CLADDING = 1,
  COPING = 2,
  FLOORING = 3,
  INSULATION = 4,
  MEMBRANE = 5,
  MOLDING = 6,
  ROOFING = 7,
  SKIRTINGBOARD = 8,
  SLEEVING = 9,
  TOPPING = 10,
  WRAPPING = 11,
  USERDEFINED = 12,
  NOTDEFINED = 13,
}

const IfcCoveringTypeEnumCount = 14

export { IfcCoveringTypeEnum, IfcCoveringTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCoveringTypeEnum =
  new Int32Array( [-4,59,72,8] )

let prefixSumAddressIfcCoveringTypeEnum =
  new Uint32Array( [0,10,18,28,38,48,57,72,85,94,106,115,125,137,146] )

let slotMapIfcCoveringTypeEnum =
  new Int32Array( [11,2,3,5,9,0,8,12,7,13,10,1,4,6] )

let encodedDataIfcCoveringTypeEnum =
  (new TextEncoder()).encode( ".WRAPPING..COPING..FLOORING..MEMBRANE..SLEEVING..CEILING..SKIRTINGBOARD..USERDEFINED..ROOFING..NOTDEFINED..TOPPING..CLADDING..INSULATION..MOLDING." )

let IfcCoveringTypeEnumSearch =
  new MinimalPerfectHash< IfcCoveringTypeEnum >( gMapIfcCoveringTypeEnum, prefixSumAddressIfcCoveringTypeEnum, slotMapIfcCoveringTypeEnum, encodedDataIfcCoveringTypeEnum )

export { IfcCoveringTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCoveringTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCoveringTypeEnum | undefined {
  return parser.extract< IfcCoveringTypeEnum >( IfcCoveringTypeEnumSearch, input, cursor, endCursor )
}
