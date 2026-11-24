/* This is generated code, don't alter */
enum IfcDuctSilencerTypeEnum {
  FLATOVAL = 0,
  RECTANGULAR = 1,
  ROUND = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcDuctSilencerTypeEnumCount = 5

export { IfcDuctSilencerTypeEnum, IfcDuctSilencerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDuctSilencerTypeEnum =
  new Int32Array( [21] )

let prefixSumAddressIfcDuctSilencerTypeEnum =
  new Uint32Array( [0,13,25,38,48,55] )

let slotMapIfcDuctSilencerTypeEnum =
  new Int32Array( [1,4,3,0,2] )

let encodedDataIfcDuctSilencerTypeEnum =
  (new TextEncoder()).encode( ".RECTANGULAR..NOTDEFINED..USERDEFINED..FLATOVAL..ROUND." )

let IfcDuctSilencerTypeEnumSearch =
  new MinimalPerfectHash< IfcDuctSilencerTypeEnum >( gMapIfcDuctSilencerTypeEnum, prefixSumAddressIfcDuctSilencerTypeEnum, slotMapIfcDuctSilencerTypeEnum, encodedDataIfcDuctSilencerTypeEnum )

export { IfcDuctSilencerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDuctSilencerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDuctSilencerTypeEnum | undefined {
  return parser.extract< IfcDuctSilencerTypeEnum >( IfcDuctSilencerTypeEnumSearch, input, cursor, endCursor )
}
