/* This is generated code, don't alter */
enum IfcEventTypeEnum {
  ENDEVENT = 0,
  INTERMEDIATEEVENT = 1,
  STARTEVENT = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcEventTypeEnumCount = 5

export { IfcEventTypeEnum, IfcEventTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEventTypeEnum =
  new Int32Array( [21] )

let prefixSumAddressIfcEventTypeEnum =
  new Uint32Array( [0,19,31,44,56,66] )

let slotMapIfcEventTypeEnum =
  new Int32Array( [1,4,3,2,0] )

let encodedDataIfcEventTypeEnum =
  (new TextEncoder()).encode( ".INTERMEDIATEEVENT..NOTDEFINED..USERDEFINED..STARTEVENT..ENDEVENT." )

let IfcEventTypeEnumSearch =
  new MinimalPerfectHash< IfcEventTypeEnum >( gMapIfcEventTypeEnum, prefixSumAddressIfcEventTypeEnum, slotMapIfcEventTypeEnum, encodedDataIfcEventTypeEnum )

export { IfcEventTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEventTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEventTypeEnum | undefined {
  return parser.extract< IfcEventTypeEnum >( IfcEventTypeEnumSearch, input, cursor, endCursor )
}
