/* This is generated code, don't alter */
enum IfcTendonAnchorTypeEnum {
  COUPLER = 0,
  FIXED_END = 1,
  TENSIONING_END = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcTendonAnchorTypeEnumCount = 5

export { IfcTendonAnchorTypeEnum, IfcTendonAnchorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTendonAnchorTypeEnum =
  new Int32Array( [56] )

let prefixSumAddressIfcTendonAnchorTypeEnum =
  new Uint32Array( [0,13,29,40,52,61] )

let slotMapIfcTendonAnchorTypeEnum =
  new Int32Array( [3,2,1,4,0] )

let encodedDataIfcTendonAnchorTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..TENSIONING_END..FIXED_END..NOTDEFINED..COUPLER." )

let IfcTendonAnchorTypeEnumSearch =
  new MinimalPerfectHash< IfcTendonAnchorTypeEnum >( gMapIfcTendonAnchorTypeEnum, prefixSumAddressIfcTendonAnchorTypeEnum, slotMapIfcTendonAnchorTypeEnum, encodedDataIfcTendonAnchorTypeEnum )

export { IfcTendonAnchorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTendonAnchorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTendonAnchorTypeEnum | undefined {
  return parser.extract< IfcTendonAnchorTypeEnum >( IfcTendonAnchorTypeEnumSearch, input, cursor, endCursor )
}
