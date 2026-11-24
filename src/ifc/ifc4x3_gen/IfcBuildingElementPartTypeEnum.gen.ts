/* This is generated code, don't alter */
enum IfcBuildingElementPartTypeEnum {
  APRON = 0,
  ARMOURUNIT = 1,
  INSULATION = 2,
  PRECASTPANEL = 3,
  SAFETYCAGE = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcBuildingElementPartTypeEnumCount = 7

export { IfcBuildingElementPartTypeEnum, IfcBuildingElementPartTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBuildingElementPartTypeEnum =
  new Int32Array( [137] )

let prefixSumAddressIfcBuildingElementPartTypeEnum =
  new Uint32Array( [0,12,19,31,45,57,69,82] )

let slotMapIfcBuildingElementPartTypeEnum =
  new Int32Array( [1,0,2,3,6,4,5] )

let encodedDataIfcBuildingElementPartTypeEnum =
  (new TextEncoder()).encode( ".ARMOURUNIT..APRON..INSULATION..PRECASTPANEL..NOTDEFINED..SAFETYCAGE..USERDEFINED." )

let IfcBuildingElementPartTypeEnumSearch =
  new MinimalPerfectHash< IfcBuildingElementPartTypeEnum >( gMapIfcBuildingElementPartTypeEnum, prefixSumAddressIfcBuildingElementPartTypeEnum, slotMapIfcBuildingElementPartTypeEnum, encodedDataIfcBuildingElementPartTypeEnum )

export { IfcBuildingElementPartTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBuildingElementPartTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBuildingElementPartTypeEnum | undefined {
  return parser.extract< IfcBuildingElementPartTypeEnum >( IfcBuildingElementPartTypeEnumSearch, input, cursor, endCursor )
}
