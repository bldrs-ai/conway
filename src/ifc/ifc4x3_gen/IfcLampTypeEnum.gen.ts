/* This is generated code, don't alter */
enum IfcLampTypeEnum {
  COMPACTFLUORESCENT = 0,
  FLUORESCENT = 1,
  HALOGEN = 2,
  HIGHPRESSUREMERCURY = 3,
  HIGHPRESSURESODIUM = 4,
  LED = 5,
  METALHALIDE = 6,
  OLED = 7,
  TUNGSTENFILAMENT = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcLampTypeEnumCount = 11

export { IfcLampTypeEnum, IfcLampTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLampTypeEnum =
  new Int32Array( [-4,3,471] )

let prefixSumAddressIfcLampTypeEnum =
  new Uint32Array( [0,13,33,45,66,79,92,112,117,135,141,150] )

let slotMapIfcLampTypeEnum =
  new Int32Array( [6,0,10,3,9,1,4,5,8,7,2] )

let encodedDataIfcLampTypeEnum =
  (new TextEncoder()).encode( ".METALHALIDE..COMPACTFLUORESCENT..NOTDEFINED..HIGHPRESSUREMERCURY..USERDEFINED..FLUORESCENT..HIGHPRESSURESODIUM..LED..TUNGSTENFILAMENT..OLED..HALOGEN." )

let IfcLampTypeEnumSearch =
  new MinimalPerfectHash< IfcLampTypeEnum >( gMapIfcLampTypeEnum, prefixSumAddressIfcLampTypeEnum, slotMapIfcLampTypeEnum, encodedDataIfcLampTypeEnum )

export { IfcLampTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLampTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLampTypeEnum | undefined {
  return parser.extract< IfcLampTypeEnum >( IfcLampTypeEnumSearch, input, cursor, endCursor )
}
