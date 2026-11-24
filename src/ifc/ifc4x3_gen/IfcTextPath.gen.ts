/* This is generated code, don't alter */
enum IfcTextPath {
  DOWN = 0,
  LEFT = 1,
  RIGHT = 2,
  UP = 3,
}

const IfcTextPathCount = 4

export { IfcTextPath, IfcTextPathCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTextPath =
  new Int32Array( [2] )

let prefixSumAddressIfcTextPath =
  new Uint32Array( [0,4,11,17,23] )

let slotMapIfcTextPath =
  new Int32Array( [3,2,0,1] )

let encodedDataIfcTextPath =
  (new TextEncoder()).encode( ".UP..RIGHT..DOWN..LEFT." )

let IfcTextPathSearch =
  new MinimalPerfectHash< IfcTextPath >( gMapIfcTextPath, prefixSumAddressIfcTextPath, slotMapIfcTextPath, encodedDataIfcTextPath )

export { IfcTextPathSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTextPathDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTextPath | undefined {
  return parser.extract< IfcTextPath >( IfcTextPathSearch, input, cursor, endCursor )
}
