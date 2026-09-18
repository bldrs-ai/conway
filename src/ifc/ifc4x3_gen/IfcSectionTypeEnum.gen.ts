/* This is generated code, don't alter */
enum IfcSectionTypeEnum {
  TAPERED = 0,
  UNIFORM = 1,
}

const IfcSectionTypeEnumCount = 2

export { IfcSectionTypeEnum, IfcSectionTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSectionTypeEnum =
  new Int32Array( [3] )

let prefixSumAddressIfcSectionTypeEnum =
  new Uint32Array( [0,9,18] )

let slotMapIfcSectionTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcSectionTypeEnum =
  (new TextEncoder()).encode( ".TAPERED..UNIFORM." )

let IfcSectionTypeEnumSearch =
  new MinimalPerfectHash< IfcSectionTypeEnum >( gMapIfcSectionTypeEnum, prefixSumAddressIfcSectionTypeEnum, slotMapIfcSectionTypeEnum, encodedDataIfcSectionTypeEnum )

export { IfcSectionTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSectionTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSectionTypeEnum | undefined {
  return parser.extract< IfcSectionTypeEnum >( IfcSectionTypeEnumSearch, input, cursor, endCursor )
}
