/* This is generated code, don't alter */
enum IfcTendonTypeEnum {
  BAR = 0,
  COATED = 1,
  STRAND = 2,
  WIRE = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcTendonTypeEnumCount = 6

export { IfcTendonTypeEnum, IfcTendonTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTendonTypeEnum =
  new Int32Array( [57] )

let prefixSumAddressIfcTendonTypeEnum =
  new Uint32Array( [0,13,19,27,32,40,52] )

let slotMapIfcTendonTypeEnum =
  new Int32Array( [4,3,2,0,1,5] )

let encodedDataIfcTendonTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..WIRE..STRAND..BAR..COATED..NOTDEFINED." )

let IfcTendonTypeEnumSearch =
  new MinimalPerfectHash< IfcTendonTypeEnum >( gMapIfcTendonTypeEnum, prefixSumAddressIfcTendonTypeEnum, slotMapIfcTendonTypeEnum, encodedDataIfcTendonTypeEnum )

export { IfcTendonTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTendonTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTendonTypeEnum | undefined {
  return parser.extract< IfcTendonTypeEnum >( IfcTendonTypeEnumSearch, input, cursor, endCursor )
}
