/* This is generated code, don't alter */
enum IfcSignTypeEnum {
  MARKER = 0,
  MIRROR = 1,
  PICTORAL = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcSignTypeEnumCount = 5

export { IfcSignTypeEnum, IfcSignTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSignTypeEnum =
  new Int32Array( [17] )

let prefixSumAddressIfcSignTypeEnum =
  new Uint32Array( [0,13,21,29,39,51] )

let slotMapIfcSignTypeEnum =
  new Int32Array( [3,0,1,2,4] )

let encodedDataIfcSignTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..MARKER..MIRROR..PICTORAL..NOTDEFINED." )

let IfcSignTypeEnumSearch =
  new MinimalPerfectHash< IfcSignTypeEnum >( gMapIfcSignTypeEnum, prefixSumAddressIfcSignTypeEnum, slotMapIfcSignTypeEnum, encodedDataIfcSignTypeEnum )

export { IfcSignTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSignTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSignTypeEnum | undefined {
  return parser.extract< IfcSignTypeEnum >( IfcSignTypeEnumSearch, input, cursor, endCursor )
}
