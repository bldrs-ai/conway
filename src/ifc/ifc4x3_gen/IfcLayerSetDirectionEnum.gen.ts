/* This is generated code, don't alter */
enum IfcLayerSetDirectionEnum {
  AXIS1 = 0,
  AXIS2 = 1,
  AXIS3 = 2,
}

const IfcLayerSetDirectionEnumCount = 3

export { IfcLayerSetDirectionEnum, IfcLayerSetDirectionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLayerSetDirectionEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcLayerSetDirectionEnum =
  new Uint32Array( [0,7,14,21] )

let slotMapIfcLayerSetDirectionEnum =
  new Int32Array( [2,1,0] )

let encodedDataIfcLayerSetDirectionEnum =
  (new TextEncoder()).encode( ".AXIS3..AXIS2..AXIS1." )

let IfcLayerSetDirectionEnumSearch =
  new MinimalPerfectHash< IfcLayerSetDirectionEnum >( gMapIfcLayerSetDirectionEnum, prefixSumAddressIfcLayerSetDirectionEnum, slotMapIfcLayerSetDirectionEnum, encodedDataIfcLayerSetDirectionEnum )

export { IfcLayerSetDirectionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLayerSetDirectionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLayerSetDirectionEnum | undefined {
  return parser.extract< IfcLayerSetDirectionEnum >( IfcLayerSetDirectionEnumSearch, input, cursor, endCursor )
}
