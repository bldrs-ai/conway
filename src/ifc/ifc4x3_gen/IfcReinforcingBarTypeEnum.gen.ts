/* This is generated code, don't alter */
enum IfcReinforcingBarTypeEnum {
  ANCHORING = 0,
  EDGE = 1,
  LIGATURE = 2,
  MAIN = 3,
  PUNCHING = 4,
  RING = 5,
  SHEAR = 6,
  SPACEBAR = 7,
  STUD = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcReinforcingBarTypeEnumCount = 11

export { IfcReinforcingBarTypeEnum, IfcReinforcingBarTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReinforcingBarTypeEnum =
  new Int32Array( [2,46,14] )

let prefixSumAddressIfcReinforcingBarTypeEnum =
  new Uint32Array( [0,13,24,30,36,48,58,65,71,81,87,97] )

let slotMapIfcReinforcingBarTypeEnum =
  new Int32Array( [9,0,3,5,10,2,6,8,4,1,7] )

let encodedDataIfcReinforcingBarTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..ANCHORING..MAIN..RING..NOTDEFINED..LIGATURE..SHEAR..STUD..PUNCHING..EDGE..SPACEBAR." )

let IfcReinforcingBarTypeEnumSearch =
  new MinimalPerfectHash< IfcReinforcingBarTypeEnum >( gMapIfcReinforcingBarTypeEnum, prefixSumAddressIfcReinforcingBarTypeEnum, slotMapIfcReinforcingBarTypeEnum, encodedDataIfcReinforcingBarTypeEnum )

export { IfcReinforcingBarTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReinforcingBarTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReinforcingBarTypeEnum | undefined {
  return parser.extract< IfcReinforcingBarTypeEnum >( IfcReinforcingBarTypeEnumSearch, input, cursor, endCursor )
}
