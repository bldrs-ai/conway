/* This is generated code, don't alter */
enum IfcCondenserTypeEnum {
  AIRCOOLED = 0,
  EVAPORATIVECOOLED = 1,
  WATERCOOLED = 2,
  WATERCOOLEDBRAZEDPLATE = 3,
  WATERCOOLEDSHELLCOIL = 4,
  WATERCOOLEDSHELLTUBE = 5,
  WATERCOOLEDTUBEINTUBE = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcCondenserTypeEnumCount = 9

export { IfcCondenserTypeEnum, IfcCondenserTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCondenserTypeEnum =
  new Int32Array( [4,-3,16] )

let prefixSumAddressIfcCondenserTypeEnum =
  new Uint32Array( [0,12,25,44,55,77,100,124,146,159] )

let slotMapIfcCondenserTypeEnum =
  new Int32Array( [8,2,1,0,4,6,3,5,7] )

let encodedDataIfcCondenserTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..WATERCOOLED..EVAPORATIVECOOLED..AIRCOOLED..WATERCOOLEDSHELLCOIL..WATERCOOLEDTUBEINTUBE..WATERCOOLEDBRAZEDPLATE..WATERCOOLEDSHELLTUBE..USERDEFINED." )

let IfcCondenserTypeEnumSearch =
  new MinimalPerfectHash< IfcCondenserTypeEnum >( gMapIfcCondenserTypeEnum, prefixSumAddressIfcCondenserTypeEnum, slotMapIfcCondenserTypeEnum, encodedDataIfcCondenserTypeEnum )

export { IfcCondenserTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCondenserTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCondenserTypeEnum | undefined {
  return parser.extract< IfcCondenserTypeEnum >( IfcCondenserTypeEnumSearch, input, cursor, endCursor )
}
