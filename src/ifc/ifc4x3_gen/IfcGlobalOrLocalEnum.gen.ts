/* This is generated code, don't alter */
enum IfcGlobalOrLocalEnum {
  GLOBAL_COORDS = 0,
  LOCAL_COORDS = 1,
}

const IfcGlobalOrLocalEnumCount = 2

export { IfcGlobalOrLocalEnum, IfcGlobalOrLocalEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcGlobalOrLocalEnum =
  new Int32Array( [2] )

let prefixSumAddressIfcGlobalOrLocalEnum =
  new Uint32Array( [0,14,29] )

let slotMapIfcGlobalOrLocalEnum =
  new Int32Array( [1,0] )

let encodedDataIfcGlobalOrLocalEnum =
  (new TextEncoder()).encode( ".LOCAL_COORDS..GLOBAL_COORDS." )

let IfcGlobalOrLocalEnumSearch =
  new MinimalPerfectHash< IfcGlobalOrLocalEnum >( gMapIfcGlobalOrLocalEnum, prefixSumAddressIfcGlobalOrLocalEnum, slotMapIfcGlobalOrLocalEnum, encodedDataIfcGlobalOrLocalEnum )

export { IfcGlobalOrLocalEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcGlobalOrLocalEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcGlobalOrLocalEnum | undefined {
  return parser.extract< IfcGlobalOrLocalEnum >( IfcGlobalOrLocalEnumSearch, input, cursor, endCursor )
}
