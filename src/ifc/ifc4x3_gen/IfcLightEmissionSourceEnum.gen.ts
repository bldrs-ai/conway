/* This is generated code, don't alter */
enum IfcLightEmissionSourceEnum {
  COMPACTFLUORESCENT = 0,
  FLUORESCENT = 1,
  HIGHPRESSUREMERCURY = 2,
  HIGHPRESSURESODIUM = 3,
  LIGHTEMITTINGDIODE = 4,
  LOWPRESSURESODIUM = 5,
  LOWVOLTAGEHALOGEN = 6,
  MAINVOLTAGEHALOGEN = 7,
  METALHALIDE = 8,
  TUNGSTENFILAMENT = 9,
  NOTDEFINED = 10,
}

const IfcLightEmissionSourceEnumCount = 11

export { IfcLightEmissionSourceEnum, IfcLightEmissionSourceEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLightEmissionSourceEnum =
  new Int32Array( [2,4,48] )

let prefixSumAddressIfcLightEmissionSourceEnum =
  new Uint32Array( [0,12,25,44,57,78,98,118,137,157,175,195] )

let slotMapIfcLightEmissionSourceEnum =
  new Int32Array( [10,8,5,1,2,3,4,6,0,9,7] )

let encodedDataIfcLightEmissionSourceEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..METALHALIDE..LOWPRESSURESODIUM..FLUORESCENT..HIGHPRESSUREMERCURY..HIGHPRESSURESODIUM..LIGHTEMITTINGDIODE..LOWVOLTAGEHALOGEN..COMPACTFLUORESCENT..TUNGSTENFILAMENT..MAINVOLTAGEHALOGEN." )

let IfcLightEmissionSourceEnumSearch =
  new MinimalPerfectHash< IfcLightEmissionSourceEnum >( gMapIfcLightEmissionSourceEnum, prefixSumAddressIfcLightEmissionSourceEnum, slotMapIfcLightEmissionSourceEnum, encodedDataIfcLightEmissionSourceEnum )

export { IfcLightEmissionSourceEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLightEmissionSourceEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLightEmissionSourceEnum | undefined {
  return parser.extract< IfcLightEmissionSourceEnum >( IfcLightEmissionSourceEnumSearch, input, cursor, endCursor )
}
