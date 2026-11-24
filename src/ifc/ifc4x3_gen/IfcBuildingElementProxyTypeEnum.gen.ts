/* This is generated code, don't alter */
enum IfcBuildingElementProxyTypeEnum {
  COMPLEX = 0,
  ELEMENT = 1,
  PARTIAL = 2,
  PROVISIONFORSPACE = 3,
  PROVISIONFORVOID = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcBuildingElementProxyTypeEnumCount = 7

export { IfcBuildingElementProxyTypeEnum, IfcBuildingElementProxyTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBuildingElementProxyTypeEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcBuildingElementProxyTypeEnum =
  new Uint32Array( [0,12,30,39,48,67,80,89] )

let slotMapIfcBuildingElementProxyTypeEnum =
  new Int32Array( [6,4,2,0,3,5,1] )

let encodedDataIfcBuildingElementProxyTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..PROVISIONFORVOID..PARTIAL..COMPLEX..PROVISIONFORSPACE..USERDEFINED..ELEMENT." )

let IfcBuildingElementProxyTypeEnumSearch =
  new MinimalPerfectHash< IfcBuildingElementProxyTypeEnum >( gMapIfcBuildingElementProxyTypeEnum, prefixSumAddressIfcBuildingElementProxyTypeEnum, slotMapIfcBuildingElementProxyTypeEnum, encodedDataIfcBuildingElementProxyTypeEnum )

export { IfcBuildingElementProxyTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBuildingElementProxyTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBuildingElementProxyTypeEnum | undefined {
  return parser.extract< IfcBuildingElementProxyTypeEnum >( IfcBuildingElementProxyTypeEnumSearch, input, cursor, endCursor )
}
