/* This is generated code, don't alter */
enum IfcDoorTypeEnum {
  BOOM_BARRIER = 0,
  DOOR = 1,
  GATE = 2,
  TRAPDOOR = 3,
  TURNSTILE = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcDoorTypeEnumCount = 7

export { IfcDoorTypeEnum, IfcDoorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDoorTypeEnum =
  new Int32Array( [40] )

let prefixSumAddressIfcDoorTypeEnum =
  new Uint32Array( [0,12,18,29,39,45,58,72] )

let slotMapIfcDoorTypeEnum =
  new Int32Array( [6,2,4,3,1,5,0] )

let encodedDataIfcDoorTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..GATE..TURNSTILE..TRAPDOOR..DOOR..USERDEFINED..BOOM_BARRIER." )

let IfcDoorTypeEnumSearch =
  new MinimalPerfectHash< IfcDoorTypeEnum >( gMapIfcDoorTypeEnum, prefixSumAddressIfcDoorTypeEnum, slotMapIfcDoorTypeEnum, encodedDataIfcDoorTypeEnum )

export { IfcDoorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDoorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDoorTypeEnum | undefined {
  return parser.extract< IfcDoorTypeEnum >( IfcDoorTypeEnumSearch, input, cursor, endCursor )
}
