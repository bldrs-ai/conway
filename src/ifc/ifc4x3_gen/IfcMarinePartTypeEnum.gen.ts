/* This is generated code, don't alter */
enum IfcMarinePartTypeEnum {
  ABOVEWATERLINE = 0,
  ANCHORAGE = 1,
  APPROACHCHANNEL = 2,
  BELOWWATERLINE = 3,
  BERTHINGSTRUCTURE = 4,
  CHAMBER = 5,
  CILL_LEVEL = 6,
  COPELEVEL = 7,
  CORE = 8,
  CREST = 9,
  GATEHEAD = 10,
  GUDINGSTRUCTURE = 11,
  HIGHWATERLINE = 12,
  LANDFIELD = 13,
  LEEWARDSIDE = 14,
  LOWWATERLINE = 15,
  MANUFACTURING = 16,
  NAVIGATIONALAREA = 17,
  PROTECTION = 18,
  SHIPTRANSFER = 19,
  STORAGEAREA = 20,
  VEHICLESERVICING = 21,
  WATERFIELD = 22,
  WEATHERSIDE = 23,
  USERDEFINED = 24,
  NOTDEFINED = 25,
}

const IfcMarinePartTypeEnumCount = 26

export { IfcMarinePartTypeEnum, IfcMarinePartTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMarinePartTypeEnum =
  new Int32Array( [4,20,111,214,37,22] )

let prefixSumAddressIfcMarinePartTypeEnum =
  new Uint32Array( [0,15,21,38,49,68,81,93,102,120,131,146,158,165,181,193,207,225,237,250,263,279,292,309,319,333,344] )

let slotMapIfcMarinePartTypeEnum =
  new Int32Array( [12,8,11,13,4,14,6,5,17,7,16,25,9,0,18,15,21,22,20,24,3,23,2,10,19,1] )

let encodedDataIfcMarinePartTypeEnum =
  (new TextEncoder()).encode( ".HIGHWATERLINE..CORE..GUDINGSTRUCTURE..LANDFIELD..BERTHINGSTRUCTURE..LEEWARDSIDE..CILL_LEVEL..CHAMBER..NAVIGATIONALAREA..COPELEVEL..MANUFACTURING..NOTDEFINED..CREST..ABOVEWATERLINE..PROTECTION..LOWWATERLINE..VEHICLESERVICING..WATERFIELD..STORAGEAREA..USERDEFINED..BELOWWATERLINE..WEATHERSIDE..APPROACHCHANNEL..GATEHEAD..SHIPTRANSFER..ANCHORAGE." )

let IfcMarinePartTypeEnumSearch =
  new MinimalPerfectHash< IfcMarinePartTypeEnum >( gMapIfcMarinePartTypeEnum, prefixSumAddressIfcMarinePartTypeEnum, slotMapIfcMarinePartTypeEnum, encodedDataIfcMarinePartTypeEnum )

export { IfcMarinePartTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMarinePartTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMarinePartTypeEnum | undefined {
  return parser.extract< IfcMarinePartTypeEnum >( IfcMarinePartTypeEnumSearch, input, cursor, endCursor )
}
