/* This is generated code, don't alter */
enum IfcDamperTypeEnum {
  BACKDRAFTDAMPER = 0,
  BALANCINGDAMPER = 1,
  BLASTDAMPER = 2,
  CONTROLDAMPER = 3,
  FIREDAMPER = 4,
  FIRESMOKEDAMPER = 5,
  FUMEHOODEXHAUST = 6,
  GRAVITYDAMPER = 7,
  GRAVITYRELIEFDAMPER = 8,
  RELIEFDAMPER = 9,
  SMOKEDAMPER = 10,
  USERDEFINED = 11,
  NOTDEFINED = 12,
}

const IfcDamperTypeEnumCount = 13

export { IfcDamperTypeEnum, IfcDamperTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDamperTypeEnum =
  new Int32Array( [-2,23,37,7] )

let prefixSumAddressIfcDamperTypeEnum =
  new Uint32Array( [0,15,32,49,62,74,88,105,120,133,146,158,175,196] )

let slotMapIfcDamperTypeEnum =
  new Int32Array( [7,1,6,10,4,9,0,3,11,2,12,5,8] )

let encodedDataIfcDamperTypeEnum =
  (new TextEncoder()).encode( ".GRAVITYDAMPER..BALANCINGDAMPER..FUMEHOODEXHAUST..SMOKEDAMPER..FIREDAMPER..RELIEFDAMPER..BACKDRAFTDAMPER..CONTROLDAMPER..USERDEFINED..BLASTDAMPER..NOTDEFINED..FIRESMOKEDAMPER..GRAVITYRELIEFDAMPER." )

let IfcDamperTypeEnumSearch =
  new MinimalPerfectHash< IfcDamperTypeEnum >( gMapIfcDamperTypeEnum, prefixSumAddressIfcDamperTypeEnum, slotMapIfcDamperTypeEnum, encodedDataIfcDamperTypeEnum )

export { IfcDamperTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDamperTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDamperTypeEnum | undefined {
  return parser.extract< IfcDamperTypeEnum >( IfcDamperTypeEnumSearch, input, cursor, endCursor )
}
