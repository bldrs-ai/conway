/* This is generated code, don't alter */
enum IfcStairTypeEnum {
  CURVED_RUN_STAIR = 0,
  DOUBLE_RETURN_STAIR = 1,
  HALF_TURN_STAIR = 2,
  HALF_WINDING_STAIR = 3,
  LADDER = 4,
  QUARTER_TURN_STAIR = 5,
  QUARTER_WINDING_STAIR = 6,
  SPIRAL_STAIR = 7,
  STRAIGHT_RUN_STAIR = 8,
  THREE_QUARTER_TURN_STAIR = 9,
  THREE_QUARTER_WINDING_STAIR = 10,
  TWO_CURVED_RUN_STAIR = 11,
  TWO_QUARTER_TURN_STAIR = 12,
  TWO_QUARTER_WINDING_STAIR = 13,
  TWO_STRAIGHT_RUN_STAIR = 14,
  USERDEFINED = 15,
  NOTDEFINED = 16,
}

const IfcStairTypeEnumCount = 17

export { IfcStairTypeEnum, IfcStairTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStairTypeEnum =
  new Int32Array( [149,4,5,2] )

let prefixSumAddressIfcStairTypeEnum =
  new Uint32Array( [0,29,53,79,100,117,140,154,174,192,212,236,258,278,290,317,330,338] )

let slotMapIfcStairTypeEnum =
  new Int32Array( [10,12,9,1,2,6,7,3,0,5,14,11,8,16,13,15,4] )

let encodedDataIfcStairTypeEnum =
  (new TextEncoder()).encode( ".THREE_QUARTER_WINDING_STAIR..TWO_QUARTER_TURN_STAIR..THREE_QUARTER_TURN_STAIR..DOUBLE_RETURN_STAIR..HALF_TURN_STAIR..QUARTER_WINDING_STAIR..SPIRAL_STAIR..HALF_WINDING_STAIR..CURVED_RUN_STAIR..QUARTER_TURN_STAIR..TWO_STRAIGHT_RUN_STAIR..TWO_CURVED_RUN_STAIR..STRAIGHT_RUN_STAIR..NOTDEFINED..TWO_QUARTER_WINDING_STAIR..USERDEFINED..LADDER." )

let IfcStairTypeEnumSearch =
  new MinimalPerfectHash< IfcStairTypeEnum >( gMapIfcStairTypeEnum, prefixSumAddressIfcStairTypeEnum, slotMapIfcStairTypeEnum, encodedDataIfcStairTypeEnum )

export { IfcStairTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStairTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStairTypeEnum | undefined {
  return parser.extract< IfcStairTypeEnum >( IfcStairTypeEnumSearch, input, cursor, endCursor )
}
