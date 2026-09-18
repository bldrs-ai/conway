/* This is generated code, don't alter */
enum IfcTaskDurationEnum {
  ELAPSEDTIME = 0,
  WORKTIME = 1,
  NOTDEFINED = 2,
}

const IfcTaskDurationEnumCount = 3

export { IfcTaskDurationEnum, IfcTaskDurationEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTaskDurationEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcTaskDurationEnum =
  new Uint32Array( [0,13,23,35] )

let slotMapIfcTaskDurationEnum =
  new Int32Array( [0,1,2] )

let encodedDataIfcTaskDurationEnum =
  (new TextEncoder()).encode( ".ELAPSEDTIME..WORKTIME..NOTDEFINED." )

let IfcTaskDurationEnumSearch =
  new MinimalPerfectHash< IfcTaskDurationEnum >( gMapIfcTaskDurationEnum, prefixSumAddressIfcTaskDurationEnum, slotMapIfcTaskDurationEnum, encodedDataIfcTaskDurationEnum )

export { IfcTaskDurationEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTaskDurationEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTaskDurationEnum | undefined {
  return parser.extract< IfcTaskDurationEnum >( IfcTaskDurationEnumSearch, input, cursor, endCursor )
}
