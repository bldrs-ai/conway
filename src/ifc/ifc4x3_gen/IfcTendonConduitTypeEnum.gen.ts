/* This is generated code, don't alter */
enum IfcTendonConduitTypeEnum {
  COUPLER = 0,
  DIABOLO = 1,
  DUCT = 2,
  GROUTING_DUCT = 3,
  TRUMPET = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcTendonConduitTypeEnumCount = 7

export { IfcTendonConduitTypeEnum, IfcTendonConduitTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTendonConduitTypeEnum =
  new Int32Array( [88] )

let prefixSumAddressIfcTendonConduitTypeEnum =
  new Uint32Array( [0,6,15,30,39,48,61,73] )

let slotMapIfcTendonConduitTypeEnum =
  new Int32Array( [2,0,3,4,1,5,6] )

let encodedDataIfcTendonConduitTypeEnum =
  (new TextEncoder()).encode( ".DUCT..COUPLER..GROUTING_DUCT..TRUMPET..DIABOLO..USERDEFINED..NOTDEFINED." )

let IfcTendonConduitTypeEnumSearch =
  new MinimalPerfectHash< IfcTendonConduitTypeEnum >( gMapIfcTendonConduitTypeEnum, prefixSumAddressIfcTendonConduitTypeEnum, slotMapIfcTendonConduitTypeEnum, encodedDataIfcTendonConduitTypeEnum )

export { IfcTendonConduitTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTendonConduitTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTendonConduitTypeEnum | undefined {
  return parser.extract< IfcTendonConduitTypeEnum >( IfcTendonConduitTypeEnumSearch, input, cursor, endCursor )
}
