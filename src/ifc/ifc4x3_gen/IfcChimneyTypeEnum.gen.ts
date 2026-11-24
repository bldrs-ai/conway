/* This is generated code, don't alter */
enum IfcChimneyTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcChimneyTypeEnumCount = 2

export { IfcChimneyTypeEnum, IfcChimneyTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcChimneyTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcChimneyTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcChimneyTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcChimneyTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcChimneyTypeEnumSearch =
  new MinimalPerfectHash< IfcChimneyTypeEnum >( gMapIfcChimneyTypeEnum, prefixSumAddressIfcChimneyTypeEnum, slotMapIfcChimneyTypeEnum, encodedDataIfcChimneyTypeEnum )

export { IfcChimneyTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcChimneyTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcChimneyTypeEnum | undefined {
  return parser.extract< IfcChimneyTypeEnum >( IfcChimneyTypeEnumSearch, input, cursor, endCursor )
}
