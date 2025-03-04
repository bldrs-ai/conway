/* This is generated code, don't alter */
enum IfcDoorTypeEnum {
  DOOR = 0,
  GATE = 1,
  TRAPDOOR = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcDoorTypeEnumCount = 5

export { IfcDoorTypeEnum, IfcDoorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDoorTypeEnum =
  new Int32Array( [83] )

let prefixSumAddressIfcDoorTypeEnum =
  new Uint32Array( [0,6,19,29,35,47] )

let slotMapIfcDoorTypeEnum =
  new Int32Array( [1,3,2,0,4] )

let encodedDataIfcDoorTypeEnum =
  (new TextEncoder()).encode( ".GATE..USERDEFINED..TRAPDOOR..DOOR..NOTDEFINED." )

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
