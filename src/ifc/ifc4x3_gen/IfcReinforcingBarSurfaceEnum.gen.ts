/* This is generated code, don't alter */
enum IfcReinforcingBarSurfaceEnum {
  PLAIN = 0,
  TEXTURED = 1,
}

const IfcReinforcingBarSurfaceEnumCount = 2

export { IfcReinforcingBarSurfaceEnum, IfcReinforcingBarSurfaceEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReinforcingBarSurfaceEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcReinforcingBarSurfaceEnum =
  new Uint32Array( [0,10,17] )

let slotMapIfcReinforcingBarSurfaceEnum =
  new Int32Array( [1,0] )

let encodedDataIfcReinforcingBarSurfaceEnum =
  (new TextEncoder()).encode( ".TEXTURED..PLAIN." )

let IfcReinforcingBarSurfaceEnumSearch =
  new MinimalPerfectHash< IfcReinforcingBarSurfaceEnum >( gMapIfcReinforcingBarSurfaceEnum, prefixSumAddressIfcReinforcingBarSurfaceEnum, slotMapIfcReinforcingBarSurfaceEnum, encodedDataIfcReinforcingBarSurfaceEnum )

export { IfcReinforcingBarSurfaceEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReinforcingBarSurfaceEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReinforcingBarSurfaceEnum | undefined {
  return parser.extract< IfcReinforcingBarSurfaceEnum >( IfcReinforcingBarSurfaceEnumSearch, input, cursor, endCursor )
}
