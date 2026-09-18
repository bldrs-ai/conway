/* This is generated code, don't alter */
enum IfcGeotechnicalStratumTypeEnum {
  SOLID = 0,
  VOID = 1,
  WATER = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcGeotechnicalStratumTypeEnumCount = 5

export { IfcGeotechnicalStratumTypeEnum, IfcGeotechnicalStratumTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcGeotechnicalStratumTypeEnum =
  new Int32Array( [45] )

let prefixSumAddressIfcGeotechnicalStratumTypeEnum =
  new Uint32Array( [0,12,19,25,38,45] )

let slotMapIfcGeotechnicalStratumTypeEnum =
  new Int32Array( [4,2,1,3,0] )

let encodedDataIfcGeotechnicalStratumTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..WATER..VOID..USERDEFINED..SOLID." )

let IfcGeotechnicalStratumTypeEnumSearch =
  new MinimalPerfectHash< IfcGeotechnicalStratumTypeEnum >( gMapIfcGeotechnicalStratumTypeEnum, prefixSumAddressIfcGeotechnicalStratumTypeEnum, slotMapIfcGeotechnicalStratumTypeEnum, encodedDataIfcGeotechnicalStratumTypeEnum )

export { IfcGeotechnicalStratumTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcGeotechnicalStratumTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcGeotechnicalStratumTypeEnum | undefined {
  return parser.extract< IfcGeotechnicalStratumTypeEnum >( IfcGeotechnicalStratumTypeEnumSearch, input, cursor, endCursor )
}
