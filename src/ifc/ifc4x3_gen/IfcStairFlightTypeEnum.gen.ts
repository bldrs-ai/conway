/* This is generated code, don't alter */
enum IfcStairFlightTypeEnum {
  CURVED = 0,
  FREEFORM = 1,
  SPIRAL = 2,
  STRAIGHT = 3,
  WINDER = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcStairFlightTypeEnumCount = 7

export { IfcStairFlightTypeEnum, IfcStairFlightTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcStairFlightTypeEnum =
  new Int32Array( [721] )

let prefixSumAddressIfcStairFlightTypeEnum =
  new Uint32Array( [0,13,21,29,39,47,59,69] )

let slotMapIfcStairFlightTypeEnum =
  new Int32Array( [5,2,4,1,0,6,3] )

let encodedDataIfcStairFlightTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..SPIRAL..WINDER..FREEFORM..CURVED..NOTDEFINED..STRAIGHT." )

let IfcStairFlightTypeEnumSearch =
  new MinimalPerfectHash< IfcStairFlightTypeEnum >( gMapIfcStairFlightTypeEnum, prefixSumAddressIfcStairFlightTypeEnum, slotMapIfcStairFlightTypeEnum, encodedDataIfcStairFlightTypeEnum )

export { IfcStairFlightTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcStairFlightTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcStairFlightTypeEnum | undefined {
  return parser.extract< IfcStairFlightTypeEnum >( IfcStairFlightTypeEnumSearch, input, cursor, endCursor )
}
