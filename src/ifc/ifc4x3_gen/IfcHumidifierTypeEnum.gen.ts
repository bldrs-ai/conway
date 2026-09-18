/* This is generated code, don't alter */
enum IfcHumidifierTypeEnum {
  ADIABATICAIRWASHER = 0,
  ADIABATICATOMIZING = 1,
  ADIABATICCOMPRESSEDAIRNOZZLE = 2,
  ADIABATICPAN = 3,
  ADIABATICRIGIDMEDIA = 4,
  ADIABATICULTRASONIC = 5,
  ADIABATICWETTEDELEMENT = 6,
  ASSISTEDBUTANE = 7,
  ASSISTEDELECTRIC = 8,
  ASSISTEDNATURALGAS = 9,
  ASSISTEDPROPANE = 10,
  ASSISTEDSTEAM = 11,
  STEAMINJECTION = 12,
  USERDEFINED = 13,
  NOTDEFINED = 14,
}

const IfcHumidifierTypeEnumCount = 15

export { IfcHumidifierTypeEnum, IfcHumidifierTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcHumidifierTypeEnum =
  new Int32Array( [0,216,4,44] )

let prefixSumAddressIfcHumidifierTypeEnum =
  new Uint32Array( [0,18,31,47,62,82,99,119,140,152,168,182,203,233,257,277] )

let slotMapIfcHumidifierTypeEnum =
  new Int32Array( [8,13,12,11,1,10,9,4,14,7,3,5,2,6,0] )

let encodedDataIfcHumidifierTypeEnum =
  (new TextEncoder()).encode( ".ASSISTEDELECTRIC..USERDEFINED..STEAMINJECTION..ASSISTEDSTEAM..ADIABATICATOMIZING..ASSISTEDPROPANE..ASSISTEDNATURALGAS..ADIABATICRIGIDMEDIA..NOTDEFINED..ASSISTEDBUTANE..ADIABATICPAN..ADIABATICULTRASONIC..ADIABATICCOMPRESSEDAIRNOZZLE..ADIABATICWETTEDELEMENT..ADIABATICAIRWASHER." )

let IfcHumidifierTypeEnumSearch =
  new MinimalPerfectHash< IfcHumidifierTypeEnum >( gMapIfcHumidifierTypeEnum, prefixSumAddressIfcHumidifierTypeEnum, slotMapIfcHumidifierTypeEnum, encodedDataIfcHumidifierTypeEnum )

export { IfcHumidifierTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcHumidifierTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcHumidifierTypeEnum | undefined {
  return parser.extract< IfcHumidifierTypeEnum >( IfcHumidifierTypeEnumSearch, input, cursor, endCursor )
}
