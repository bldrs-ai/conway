/* This is generated code, don't alter */
enum IfcSequenceEnum {
  FINISH_FINISH = 0,
  FINISH_START = 1,
  START_FINISH = 2,
  START_START = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcSequenceEnumCount = 6

export { IfcSequenceEnum, IfcSequenceEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSequenceEnum =
  new Int32Array( [86] )

let prefixSumAddressIfcSequenceEnum =
  new Uint32Array( [0,13,28,42,54,67,81] )

let slotMapIfcSequenceEnum =
  new Int32Array( [3,0,2,5,4,1] )

let encodedDataIfcSequenceEnum =
  (new TextEncoder()).encode( ".START_START..FINISH_FINISH..START_FINISH..NOTDEFINED..USERDEFINED..FINISH_START." )

let IfcSequenceEnumSearch =
  new MinimalPerfectHash< IfcSequenceEnum >( gMapIfcSequenceEnum, prefixSumAddressIfcSequenceEnum, slotMapIfcSequenceEnum, encodedDataIfcSequenceEnum )

export { IfcSequenceEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSequenceEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSequenceEnum | undefined {
  return parser.extract< IfcSequenceEnum >( IfcSequenceEnumSearch, input, cursor, endCursor )
}
