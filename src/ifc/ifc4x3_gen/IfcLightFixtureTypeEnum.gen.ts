/* This is generated code, don't alter */
enum IfcLightFixtureTypeEnum {
  DIRECTIONSOURCE = 0,
  POINTSOURCE = 1,
  SECURITYLIGHTING = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcLightFixtureTypeEnumCount = 5

export { IfcLightFixtureTypeEnum, IfcLightFixtureTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLightFixtureTypeEnum =
  new Int32Array( [30] )

let prefixSumAddressIfcLightFixtureTypeEnum =
  new Uint32Array( [0,18,35,47,60,73] )

let slotMapIfcLightFixtureTypeEnum =
  new Int32Array( [2,0,4,1,3] )

let encodedDataIfcLightFixtureTypeEnum =
  (new TextEncoder()).encode( ".SECURITYLIGHTING..DIRECTIONSOURCE..NOTDEFINED..POINTSOURCE..USERDEFINED." )

let IfcLightFixtureTypeEnumSearch =
  new MinimalPerfectHash< IfcLightFixtureTypeEnum >( gMapIfcLightFixtureTypeEnum, prefixSumAddressIfcLightFixtureTypeEnum, slotMapIfcLightFixtureTypeEnum, encodedDataIfcLightFixtureTypeEnum )

export { IfcLightFixtureTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLightFixtureTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLightFixtureTypeEnum | undefined {
  return parser.extract< IfcLightFixtureTypeEnum >( IfcLightFixtureTypeEnumSearch, input, cursor, endCursor )
}
