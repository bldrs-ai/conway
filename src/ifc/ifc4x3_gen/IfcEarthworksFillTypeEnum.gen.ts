/* This is generated code, don't alter */
enum IfcEarthworksFillTypeEnum {
  BACKFILL = 0,
  COUNTERWEIGHT = 1,
  EMBANKMENT = 2,
  SLOPEFILL = 3,
  SUBGRADE = 4,
  SUBGRADEBED = 5,
  TRANSITIONSECTION = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcEarthworksFillTypeEnumCount = 9

export { IfcEarthworksFillTypeEnum, IfcEarthworksFillTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEarthworksFillTypeEnum =
  new Int32Array( [1,54,0] )

let prefixSumAddressIfcEarthworksFillTypeEnum =
  new Uint32Array( [0,12,31,41,56,69,79,92,104,115] )

let slotMapIfcEarthworksFillTypeEnum =
  new Int32Array( [8,6,0,1,5,4,7,2,3] )

let encodedDataIfcEarthworksFillTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..TRANSITIONSECTION..BACKFILL..COUNTERWEIGHT..SUBGRADEBED..SUBGRADE..USERDEFINED..EMBANKMENT..SLOPEFILL." )

let IfcEarthworksFillTypeEnumSearch =
  new MinimalPerfectHash< IfcEarthworksFillTypeEnum >( gMapIfcEarthworksFillTypeEnum, prefixSumAddressIfcEarthworksFillTypeEnum, slotMapIfcEarthworksFillTypeEnum, encodedDataIfcEarthworksFillTypeEnum )

export { IfcEarthworksFillTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEarthworksFillTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEarthworksFillTypeEnum | undefined {
  return parser.extract< IfcEarthworksFillTypeEnum >( IfcEarthworksFillTypeEnumSearch, input, cursor, endCursor )
}
