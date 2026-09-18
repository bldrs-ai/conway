/* This is generated code, don't alter */
enum IfcReinforcingMeshTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcReinforcingMeshTypeEnumCount = 2

export { IfcReinforcingMeshTypeEnum, IfcReinforcingMeshTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReinforcingMeshTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcReinforcingMeshTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcReinforcingMeshTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcReinforcingMeshTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcReinforcingMeshTypeEnumSearch =
  new MinimalPerfectHash< IfcReinforcingMeshTypeEnum >( gMapIfcReinforcingMeshTypeEnum, prefixSumAddressIfcReinforcingMeshTypeEnum, slotMapIfcReinforcingMeshTypeEnum, encodedDataIfcReinforcingMeshTypeEnum )

export { IfcReinforcingMeshTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReinforcingMeshTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReinforcingMeshTypeEnum | undefined {
  return parser.extract< IfcReinforcingMeshTypeEnum >( IfcReinforcingMeshTypeEnumSearch, input, cursor, endCursor )
}
