/* This is generated code, don't alter */
enum IfcDoorTypeOperationEnum {
  DOUBLE_DOOR_DOUBLE_SWING = 0,
  DOUBLE_DOOR_FOLDING = 1,
  DOUBLE_DOOR_LIFTING_VERTICAL = 2,
  DOUBLE_DOOR_SINGLE_SWING = 3,
  DOUBLE_DOOR_SINGLE_SWING_OPPOSITE_LEFT = 4,
  DOUBLE_DOOR_SINGLE_SWING_OPPOSITE_RIGHT = 5,
  DOUBLE_DOOR_SLIDING = 6,
  DOUBLE_SWING_LEFT = 7,
  DOUBLE_SWING_RIGHT = 8,
  FOLDING_TO_LEFT = 9,
  FOLDING_TO_RIGHT = 10,
  LIFTING_HORIZONTAL = 11,
  LIFTING_VERTICAL_LEFT = 12,
  LIFTING_VERTICAL_RIGHT = 13,
  REVOLVING = 14,
  REVOLVING_VERTICAL = 15,
  ROLLINGUP = 16,
  SINGLE_SWING_LEFT = 17,
  SINGLE_SWING_RIGHT = 18,
  SLIDING_TO_LEFT = 19,
  SLIDING_TO_RIGHT = 20,
  SWING_FIXED_LEFT = 21,
  SWING_FIXED_RIGHT = 22,
  USERDEFINED = 23,
  NOTDEFINED = 24,
}

const IfcDoorTypeOperationEnumCount = 25

export { IfcDoorTypeOperationEnum, IfcDoorTypeOperationEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDoorTypeOperationEnum =
  new Int32Array( [1,10,161,104,165,156] )

let prefixSumAddressIfcDoorTypeOperationEnum =
  new Uint32Array( [0,20,41,52,63,89,129,170,189,209,229,242,265,284,301,319,338,358,379,396,420,450,476,494,512,524] )

let slotMapIfcDoorTypeOperationEnum =
  new Int32Array( [15,6,14,16,0,4,5,7,8,18,23,12,22,19,10,17,11,1,9,13,2,3,21,20,24] )

let encodedDataIfcDoorTypeOperationEnum =
  (new TextEncoder()).encode( ".REVOLVING_VERTICAL..DOUBLE_DOOR_SLIDING..REVOLVING..ROLLINGUP..DOUBLE_DOOR_DOUBLE_SWING..DOUBLE_DOOR_SINGLE_SWING_OPPOSITE_LEFT..DOUBLE_DOOR_SINGLE_SWING_OPPOSITE_RIGHT..DOUBLE_SWING_LEFT..DOUBLE_SWING_RIGHT..SINGLE_SWING_RIGHT..USERDEFINED..LIFTING_VERTICAL_LEFT..SWING_FIXED_RIGHT..SLIDING_TO_LEFT..FOLDING_TO_RIGHT..SINGLE_SWING_LEFT..LIFTING_HORIZONTAL..DOUBLE_DOOR_FOLDING..FOLDING_TO_LEFT..LIFTING_VERTICAL_RIGHT..DOUBLE_DOOR_LIFTING_VERTICAL..DOUBLE_DOOR_SINGLE_SWING..SWING_FIXED_LEFT..SLIDING_TO_RIGHT..NOTDEFINED." )

let IfcDoorTypeOperationEnumSearch =
  new MinimalPerfectHash< IfcDoorTypeOperationEnum >( gMapIfcDoorTypeOperationEnum, prefixSumAddressIfcDoorTypeOperationEnum, slotMapIfcDoorTypeOperationEnum, encodedDataIfcDoorTypeOperationEnum )

export { IfcDoorTypeOperationEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDoorTypeOperationEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDoorTypeOperationEnum | undefined {
  return parser.extract< IfcDoorTypeOperationEnum >( IfcDoorTypeOperationEnumSearch, input, cursor, endCursor )
}
