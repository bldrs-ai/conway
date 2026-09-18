/* This is generated code, don't alter */
enum IfcCompressorTypeEnum {
  BOOSTER = 0,
  DYNAMIC = 1,
  HERMETIC = 2,
  OPENTYPE = 3,
  RECIPROCATING = 4,
  ROLLINGPISTON = 5,
  ROTARY = 6,
  ROTARYVANE = 7,
  SCROLL = 8,
  SEMIHERMETIC = 9,
  SINGLESCREW = 10,
  SINGLESTAGE = 11,
  TROCHOIDAL = 12,
  TWINSCREW = 13,
  WELDEDSHELLHERMETIC = 14,
  USERDEFINED = 15,
  NOTDEFINED = 16,
}

const IfcCompressorTypeEnumCount = 17

export { IfcCompressorTypeEnum, IfcCompressorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCompressorTypeEnum =
  new Int32Array( [270,597,74,8] )

let prefixSumAddressIfcCompressorTypeEnum =
  new Uint32Array( [0,12,33,48,56,69,82,90,100,111,123,138,147,157,170,184,196,205] )

let slotMapIfcCompressorTypeEnum =
  new Int32Array( [7,14,4,6,11,15,8,2,13,12,5,0,3,10,9,16,1] )

let encodedDataIfcCompressorTypeEnum =
  (new TextEncoder()).encode( ".ROTARYVANE..WELDEDSHELLHERMETIC..RECIPROCATING..ROTARY..SINGLESTAGE..USERDEFINED..SCROLL..HERMETIC..TWINSCREW..TROCHOIDAL..ROLLINGPISTON..BOOSTER..OPENTYPE..SINGLESCREW..SEMIHERMETIC..NOTDEFINED..DYNAMIC." )

let IfcCompressorTypeEnumSearch =
  new MinimalPerfectHash< IfcCompressorTypeEnum >( gMapIfcCompressorTypeEnum, prefixSumAddressIfcCompressorTypeEnum, slotMapIfcCompressorTypeEnum, encodedDataIfcCompressorTypeEnum )

export { IfcCompressorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCompressorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCompressorTypeEnum | undefined {
  return parser.extract< IfcCompressorTypeEnum >( IfcCompressorTypeEnumSearch, input, cursor, endCursor )
}
