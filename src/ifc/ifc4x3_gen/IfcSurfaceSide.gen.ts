/* This is generated code, don't alter */
enum IfcSurfaceSide {
  BOTH = 0,
  NEGATIVE = 1,
  POSITIVE = 2,
}

const IfcSurfaceSideCount = 3

export { IfcSurfaceSide, IfcSurfaceSideCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSurfaceSide =
  new Int32Array( [11] )

let prefixSumAddressIfcSurfaceSide =
  new Uint32Array( [0,6,16,26] )

let slotMapIfcSurfaceSide =
  new Int32Array( [0,1,2] )

let encodedDataIfcSurfaceSide =
  (new TextEncoder()).encode( ".BOTH..NEGATIVE..POSITIVE." )

let IfcSurfaceSideSearch =
  new MinimalPerfectHash< IfcSurfaceSide >( gMapIfcSurfaceSide, prefixSumAddressIfcSurfaceSide, slotMapIfcSurfaceSide, encodedDataIfcSurfaceSide )

export { IfcSurfaceSideSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSurfaceSideDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSurfaceSide | undefined {
  return parser.extract< IfcSurfaceSide >( IfcSurfaceSideSearch, input, cursor, endCursor )
}
