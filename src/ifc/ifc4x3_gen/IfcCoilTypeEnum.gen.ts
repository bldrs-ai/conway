/* This is generated code, don't alter */
enum IfcCoilTypeEnum {
  DXCOOLINGCOIL = 0,
  ELECTRICHEATINGCOIL = 1,
  GASHEATINGCOIL = 2,
  HYDRONICCOIL = 3,
  STEAMHEATINGCOIL = 4,
  WATERCOOLINGCOIL = 5,
  WATERHEATINGCOIL = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcCoilTypeEnumCount = 9

export { IfcCoilTypeEnum, IfcCoilTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCoilTypeEnum =
  new Int32Array( [2,-6,21] )

let prefixSumAddressIfcCoilTypeEnum =
  new Uint32Array( [0,18,36,52,66,87,99,114,132,145] )

let slotMapIfcCoilTypeEnum =
  new Int32Array( [5,4,2,3,1,8,0,6,7] )

let encodedDataIfcCoilTypeEnum =
  (new TextEncoder()).encode( ".WATERCOOLINGCOIL..STEAMHEATINGCOIL..GASHEATINGCOIL..HYDRONICCOIL..ELECTRICHEATINGCOIL..NOTDEFINED..DXCOOLINGCOIL..WATERHEATINGCOIL..USERDEFINED." )

let IfcCoilTypeEnumSearch =
  new MinimalPerfectHash< IfcCoilTypeEnum >( gMapIfcCoilTypeEnum, prefixSumAddressIfcCoilTypeEnum, slotMapIfcCoilTypeEnum, encodedDataIfcCoilTypeEnum )

export { IfcCoilTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCoilTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCoilTypeEnum | undefined {
  return parser.extract< IfcCoilTypeEnum >( IfcCoilTypeEnumSearch, input, cursor, endCursor )
}
