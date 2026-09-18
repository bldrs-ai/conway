/* This is generated code, don't alter */
enum IfcLaborResourceTypeEnum {
  ADMINISTRATION = 0,
  CARPENTRY = 1,
  CLEANING = 2,
  CONCRETE = 3,
  DRYWALL = 4,
  ELECTRIC = 5,
  FINISHING = 6,
  FLOORING = 7,
  GENERAL = 8,
  HVAC = 9,
  LANDSCAPING = 10,
  MASONRY = 11,
  PAINTING = 12,
  PAVING = 13,
  PLUMBING = 14,
  ROOFING = 15,
  SITEGRADING = 16,
  STEELWORK = 17,
  SURVEYING = 18,
  USERDEFINED = 19,
  NOTDEFINED = 20,
}

const IfcLaborResourceTypeEnumCount = 21

export { IfcLaborResourceTypeEnum, IfcLaborResourceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLaborResourceTypeEnum =
  new Int32Array( [10,7,4,27,40] )

let prefixSumAddressIfcLaborResourceTypeEnum =
  new Uint32Array( [0,6,18,28,38,46,57,66,79,89,98,108,118,127,138,151,160,171,184,195,205,221] )

let slotMapIfcLaborResourceTypeEnum =
  new Int32Array( [9,20,2,7,13,17,11,19,5,15,14,12,8,6,16,4,1,10,18,3,0] )

let encodedDataIfcLaborResourceTypeEnum =
  (new TextEncoder()).encode( ".HVAC..NOTDEFINED..CLEANING..FLOORING..PAVING..STEELWORK..MASONRY..USERDEFINED..ELECTRIC..ROOFING..PLUMBING..PAINTING..GENERAL..FINISHING..SITEGRADING..DRYWALL..CARPENTRY..LANDSCAPING..SURVEYING..CONCRETE..ADMINISTRATION." )

let IfcLaborResourceTypeEnumSearch =
  new MinimalPerfectHash< IfcLaborResourceTypeEnum >( gMapIfcLaborResourceTypeEnum, prefixSumAddressIfcLaborResourceTypeEnum, slotMapIfcLaborResourceTypeEnum, encodedDataIfcLaborResourceTypeEnum )

export { IfcLaborResourceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLaborResourceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLaborResourceTypeEnum | undefined {
  return parser.extract< IfcLaborResourceTypeEnum >( IfcLaborResourceTypeEnumSearch, input, cursor, endCursor )
}
