/* This is generated code, don't alter */
enum IfcEvaporatorTypeEnum {
  DIRECTEXPANSION = 0,
  DIRECTEXPANSIONBRAZEDPLATE = 1,
  DIRECTEXPANSIONSHELLANDTUBE = 2,
  DIRECTEXPANSIONTUBEINTUBE = 3,
  FLOODEDSHELLANDTUBE = 4,
  SHELLANDCOIL = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcEvaporatorTypeEnumCount = 8

export { IfcEvaporatorTypeEnum, IfcEvaporatorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEvaporatorTypeEnum =
  new Int32Array( [7,0,84] )

let prefixSumAddressIfcEvaporatorTypeEnum =
  new Uint32Array( [0,12,41,62,89,106,120,148,161] )

let slotMapIfcEvaporatorTypeEnum =
  new Int32Array( [7,2,4,3,0,5,1,6] )

let encodedDataIfcEvaporatorTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..DIRECTEXPANSIONSHELLANDTUBE..FLOODEDSHELLANDTUBE..DIRECTEXPANSIONTUBEINTUBE..DIRECTEXPANSION..SHELLANDCOIL..DIRECTEXPANSIONBRAZEDPLATE..USERDEFINED." )

let IfcEvaporatorTypeEnumSearch =
  new MinimalPerfectHash< IfcEvaporatorTypeEnum >( gMapIfcEvaporatorTypeEnum, prefixSumAddressIfcEvaporatorTypeEnum, slotMapIfcEvaporatorTypeEnum, encodedDataIfcEvaporatorTypeEnum )

export { IfcEvaporatorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEvaporatorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEvaporatorTypeEnum | undefined {
  return parser.extract< IfcEvaporatorTypeEnum >( IfcEvaporatorTypeEnumSearch, input, cursor, endCursor )
}
