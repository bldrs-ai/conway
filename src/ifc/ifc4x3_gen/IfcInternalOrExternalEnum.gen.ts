/* This is generated code, don't alter */
enum IfcInternalOrExternalEnum {
  EXTERNAL = 0,
  EXTERNAL_EARTH = 1,
  EXTERNAL_FIRE = 2,
  EXTERNAL_WATER = 3,
  INTERNAL = 4,
  NOTDEFINED = 5,
}

const IfcInternalOrExternalEnumCount = 6

export { IfcInternalOrExternalEnum, IfcInternalOrExternalEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcInternalOrExternalEnum =
  new Int32Array( [107] )

let prefixSumAddressIfcInternalOrExternalEnum =
  new Uint32Array( [0,16,28,38,54,64,79] )

let slotMapIfcInternalOrExternalEnum =
  new Int32Array( [3,5,0,1,4,2] )

let encodedDataIfcInternalOrExternalEnum =
  (new TextEncoder()).encode( ".EXTERNAL_WATER..NOTDEFINED..EXTERNAL..EXTERNAL_EARTH..INTERNAL..EXTERNAL_FIRE." )

let IfcInternalOrExternalEnumSearch =
  new MinimalPerfectHash< IfcInternalOrExternalEnum >( gMapIfcInternalOrExternalEnum, prefixSumAddressIfcInternalOrExternalEnum, slotMapIfcInternalOrExternalEnum, encodedDataIfcInternalOrExternalEnum )

export { IfcInternalOrExternalEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcInternalOrExternalEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcInternalOrExternalEnum | undefined {
  return parser.extract< IfcInternalOrExternalEnum >( IfcInternalOrExternalEnumSearch, input, cursor, endCursor )
}
