/* This is generated code, don't alter */
enum IfcSlabTypeEnum {
  APPROACH_SLAB = 0,
  BASESLAB = 1,
  FLOOR = 2,
  LANDING = 3,
  PAVING = 4,
  ROOF = 5,
  SIDEWALK = 6,
  TRACKSLAB = 7,
  WEARING = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcSlabTypeEnumCount = 11

export { IfcSlabTypeEnum, IfcSlabTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSlabTypeEnum =
  new Int32Array( [92,13,2] )

let prefixSumAddressIfcSlabTypeEnum =
  new Uint32Array( [0,13,25,34,42,52,62,71,82,88,95,110] )

let slotMapIfcSlabTypeEnum =
  new Int32Array( [9,10,8,4,1,6,3,7,5,2,0] )

let encodedDataIfcSlabTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED..WEARING..PAVING..BASESLAB..SIDEWALK..LANDING..TRACKSLAB..ROOF..FLOOR..APPROACH_SLAB." )

let IfcSlabTypeEnumSearch =
  new MinimalPerfectHash< IfcSlabTypeEnum >( gMapIfcSlabTypeEnum, prefixSumAddressIfcSlabTypeEnum, slotMapIfcSlabTypeEnum, encodedDataIfcSlabTypeEnum )

export { IfcSlabTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSlabTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSlabTypeEnum | undefined {
  return parser.extract< IfcSlabTypeEnum >( IfcSlabTypeEnumSearch, input, cursor, endCursor )
}
