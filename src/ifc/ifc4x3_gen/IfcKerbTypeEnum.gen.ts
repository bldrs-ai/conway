/* This is generated code, don't alter */
enum IfcKerbTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcKerbTypeEnumCount = 2

export { IfcKerbTypeEnum, IfcKerbTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcKerbTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcKerbTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcKerbTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcKerbTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcKerbTypeEnumSearch =
  new MinimalPerfectHash< IfcKerbTypeEnum >( gMapIfcKerbTypeEnum, prefixSumAddressIfcKerbTypeEnum, slotMapIfcKerbTypeEnum, encodedDataIfcKerbTypeEnum )

export { IfcKerbTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcKerbTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcKerbTypeEnum | undefined {
  return parser.extract< IfcKerbTypeEnum >( IfcKerbTypeEnumSearch, input, cursor, endCursor )
}
