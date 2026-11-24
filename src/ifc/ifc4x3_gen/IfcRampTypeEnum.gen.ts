/* This is generated code, don't alter */
enum IfcRampTypeEnum {
  HALF_TURN_RAMP = 0,
  QUARTER_TURN_RAMP = 1,
  SPIRAL_RAMP = 2,
  STRAIGHT_RUN_RAMP = 3,
  TWO_QUARTER_TURN_RAMP = 4,
  TWO_STRAIGHT_RUN_RAMP = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcRampTypeEnumCount = 8

export { IfcRampTypeEnum, IfcRampTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRampTypeEnum =
  new Int32Array( [-2,0,7] )

let prefixSumAddressIfcRampTypeEnum =
  new Uint32Array( [0,13,29,42,61,73,92,115,138] )

let slotMapIfcRampTypeEnum =
  new Int32Array( [2,0,6,3,7,1,5,4] )

let encodedDataIfcRampTypeEnum =
  (new TextEncoder()).encode( ".SPIRAL_RAMP..HALF_TURN_RAMP..USERDEFINED..STRAIGHT_RUN_RAMP..NOTDEFINED..QUARTER_TURN_RAMP..TWO_STRAIGHT_RUN_RAMP..TWO_QUARTER_TURN_RAMP." )

let IfcRampTypeEnumSearch =
  new MinimalPerfectHash< IfcRampTypeEnum >( gMapIfcRampTypeEnum, prefixSumAddressIfcRampTypeEnum, slotMapIfcRampTypeEnum, encodedDataIfcRampTypeEnum )

export { IfcRampTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRampTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRampTypeEnum | undefined {
  return parser.extract< IfcRampTypeEnum >( IfcRampTypeEnumSearch, input, cursor, endCursor )
}
