/* This is generated code, don't alter */
enum IfcFlowDirectionEnum {
  SINK = 0,
  SOURCE = 1,
  SOURCEANDSINK = 2,
  NOTDEFINED = 3,
}

const IfcFlowDirectionEnumCount = 4

export { IfcFlowDirectionEnum, IfcFlowDirectionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFlowDirectionEnum =
  new Int32Array( [3] )

let prefixSumAddressIfcFlowDirectionEnum =
  new Uint32Array( [0,15,23,35,41] )

let slotMapIfcFlowDirectionEnum =
  new Int32Array( [2,1,3,0] )

let encodedDataIfcFlowDirectionEnum =
  (new TextEncoder()).encode( ".SOURCEANDSINK..SOURCE..NOTDEFINED..SINK." )

let IfcFlowDirectionEnumSearch =
  new MinimalPerfectHash< IfcFlowDirectionEnum >( gMapIfcFlowDirectionEnum, prefixSumAddressIfcFlowDirectionEnum, slotMapIfcFlowDirectionEnum, encodedDataIfcFlowDirectionEnum )

export { IfcFlowDirectionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFlowDirectionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFlowDirectionEnum | undefined {
  return parser.extract< IfcFlowDirectionEnum >( IfcFlowDirectionEnumSearch, input, cursor, endCursor )
}
