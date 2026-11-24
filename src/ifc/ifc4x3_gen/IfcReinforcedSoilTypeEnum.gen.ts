/* This is generated code, don't alter */
enum IfcReinforcedSoilTypeEnum {
  DYNAMICALLYCOMPACTED = 0,
  GROUTED = 1,
  REPLACED = 2,
  ROLLERCOMPACTED = 3,
  SURCHARGEPRELOADED = 4,
  VERTICALLYDRAINED = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcReinforcedSoilTypeEnumCount = 8

export { IfcReinforcedSoilTypeEnum, IfcReinforcedSoilTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReinforcedSoilTypeEnum =
  new Int32Array( [1,1,30] )

let prefixSumAddressIfcReinforcedSoilTypeEnum =
  new Uint32Array( [0,9,21,31,53,70,90,103,122] )

let slotMapIfcReinforcedSoilTypeEnum =
  new Int32Array( [1,7,2,0,3,4,6,5] )

let encodedDataIfcReinforcedSoilTypeEnum =
  (new TextEncoder()).encode( ".GROUTED..NOTDEFINED..REPLACED..DYNAMICALLYCOMPACTED..ROLLERCOMPACTED..SURCHARGEPRELOADED..USERDEFINED..VERTICALLYDRAINED." )

let IfcReinforcedSoilTypeEnumSearch =
  new MinimalPerfectHash< IfcReinforcedSoilTypeEnum >( gMapIfcReinforcedSoilTypeEnum, prefixSumAddressIfcReinforcedSoilTypeEnum, slotMapIfcReinforcedSoilTypeEnum, encodedDataIfcReinforcedSoilTypeEnum )

export { IfcReinforcedSoilTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReinforcedSoilTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReinforcedSoilTypeEnum | undefined {
  return parser.extract< IfcReinforcedSoilTypeEnum >( IfcReinforcedSoilTypeEnumSearch, input, cursor, endCursor )
}
