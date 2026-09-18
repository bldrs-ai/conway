/* This is generated code, don't alter */
enum IfcElementCompositionEnum {
  COMPLEX = 0,
  ELEMENT = 1,
  PARTIAL = 2,
}

const IfcElementCompositionEnumCount = 3

export { IfcElementCompositionEnum, IfcElementCompositionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElementCompositionEnum =
  new Int32Array( [7] )

let prefixSumAddressIfcElementCompositionEnum =
  new Uint32Array( [0,9,18,27] )

let slotMapIfcElementCompositionEnum =
  new Int32Array( [0,1,2] )

let encodedDataIfcElementCompositionEnum =
  (new TextEncoder()).encode( ".COMPLEX..ELEMENT..PARTIAL." )

let IfcElementCompositionEnumSearch =
  new MinimalPerfectHash< IfcElementCompositionEnum >( gMapIfcElementCompositionEnum, prefixSumAddressIfcElementCompositionEnum, slotMapIfcElementCompositionEnum, encodedDataIfcElementCompositionEnum )

export { IfcElementCompositionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElementCompositionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElementCompositionEnum | undefined {
  return parser.extract< IfcElementCompositionEnum >( IfcElementCompositionEnumSearch, input, cursor, endCursor )
}
