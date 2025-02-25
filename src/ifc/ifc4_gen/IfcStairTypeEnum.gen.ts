/* This is generated code, don't alter */
enum IfcStairTypeEnum {
  STRAIGHT_RUN_STAIR = 0,
  TWO_STRAIGHT_RUN_STAIR = 1,
  QUARTER_WINDING_STAIR = 2,
  QUARTER_TURN_STAIR = 3,
  HALF_WINDING_STAIR = 4,
  HALF_TURN_STAIR = 5,
  TWO_QUARTER_WINDING_STAIR = 6,
  TWO_QUARTER_TURN_STAIR = 7,
  THREE_QUARTER_WINDING_STAIR = 8,
  THREE_QUARTER_TURN_STAIR = 9,
  SPIRAL_STAIR = 10,
  DOUBLE_RETURN_STAIR = 11,
  CURVED_RUN_STAIR = 12,
  TWO_CURVED_RUN_STAIR = 13,
  USERDEFINED = 14,
  NOTDEFINED = 15,
}

const IfcStairTypeEnumCount = 16

export { IfcStairTypeEnum, IfcStairTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStairTypeEnum =
  new Int32Array( [41,57,6,2] )

let prefixSumAddressIfcStairTypeEnum =
  new Uint32Array( [0,12,30,51,73,93,113,136,160,174,201,218,238,262,291,317,330] )

let slotMapIfcStairTypeEnum =
  new Int32Array( [15,12,11,13,3,4,2,7,10,6,5,0,1,8,9,14] )

let encodedDataIfcStairTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..CURVED_RUN_STAIR..DOUBLE_RETURN_STAIR..TWO_CURVED_RUN_STAIR..QUARTER_TURN_STAIR..HALF_WINDING_STAIR..QUARTER_WINDING_STAIR..TWO_QUARTER_TURN_STAIR..SPIRAL_STAIR..TWO_QUARTER_WINDING_STAIR..HALF_TURN_STAIR..STRAIGHT_RUN_STAIR..TWO_STRAIGHT_RUN_STAIR..THREE_QUARTER_WINDING_STAIR..THREE_QUARTER_TURN_STAIR..USERDEFINED." )

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
