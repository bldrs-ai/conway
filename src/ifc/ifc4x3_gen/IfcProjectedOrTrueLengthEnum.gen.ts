/* This is generated code, don't alter */
enum IfcProjectedOrTrueLengthEnum {
  PROJECTED_LENGTH = 0,
  TRUE_LENGTH = 1,
}

const IfcProjectedOrTrueLengthEnumCount = 2

export { IfcProjectedOrTrueLengthEnum, IfcProjectedOrTrueLengthEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProjectedOrTrueLengthEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcProjectedOrTrueLengthEnum =
  new Uint32Array( [0,18,31] )

let slotMapIfcProjectedOrTrueLengthEnum =
  new Int32Array( [0,1] )

let encodedDataIfcProjectedOrTrueLengthEnum =
  (new TextEncoder()).encode( ".PROJECTED_LENGTH..TRUE_LENGTH." )

let IfcProjectedOrTrueLengthEnumSearch =
  new MinimalPerfectHash< IfcProjectedOrTrueLengthEnum >( gMapIfcProjectedOrTrueLengthEnum, prefixSumAddressIfcProjectedOrTrueLengthEnum, slotMapIfcProjectedOrTrueLengthEnum, encodedDataIfcProjectedOrTrueLengthEnum )

export { IfcProjectedOrTrueLengthEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProjectedOrTrueLengthEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProjectedOrTrueLengthEnum | undefined {
  return parser.extract< IfcProjectedOrTrueLengthEnum >( IfcProjectedOrTrueLengthEnumSearch, input, cursor, endCursor )
}
