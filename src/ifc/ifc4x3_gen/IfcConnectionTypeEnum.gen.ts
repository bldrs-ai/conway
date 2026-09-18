/* This is generated code, don't alter */
enum IfcConnectionTypeEnum {
  ATEND = 0,
  ATPATH = 1,
  ATSTART = 2,
  NOTDEFINED = 3,
}

const IfcConnectionTypeEnumCount = 4

export { IfcConnectionTypeEnum, IfcConnectionTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcConnectionTypeEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcConnectionTypeEnum =
  new Uint32Array( [0,9,16,28,36] )

let slotMapIfcConnectionTypeEnum =
  new Int32Array( [2,0,3,1] )

let encodedDataIfcConnectionTypeEnum =
  (new TextEncoder()).encode( ".ATSTART..ATEND..NOTDEFINED..ATPATH." )

let IfcConnectionTypeEnumSearch =
  new MinimalPerfectHash< IfcConnectionTypeEnum >( gMapIfcConnectionTypeEnum, prefixSumAddressIfcConnectionTypeEnum, slotMapIfcConnectionTypeEnum, encodedDataIfcConnectionTypeEnum )

export { IfcConnectionTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcConnectionTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcConnectionTypeEnum | undefined {
  return parser.extract< IfcConnectionTypeEnum >( IfcConnectionTypeEnumSearch, input, cursor, endCursor )
}
