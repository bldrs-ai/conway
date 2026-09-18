/* This is generated code, don't alter */
enum IfcCurtainWallTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcCurtainWallTypeEnumCount = 2

export { IfcCurtainWallTypeEnum, IfcCurtainWallTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCurtainWallTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcCurtainWallTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcCurtainWallTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcCurtainWallTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcCurtainWallTypeEnumSearch =
  new MinimalPerfectHash< IfcCurtainWallTypeEnum >( gMapIfcCurtainWallTypeEnum, prefixSumAddressIfcCurtainWallTypeEnum, slotMapIfcCurtainWallTypeEnum, encodedDataIfcCurtainWallTypeEnum )

export { IfcCurtainWallTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCurtainWallTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCurtainWallTypeEnum | undefined {
  return parser.extract< IfcCurtainWallTypeEnum >( IfcCurtainWallTypeEnumSearch, input, cursor, endCursor )
}
