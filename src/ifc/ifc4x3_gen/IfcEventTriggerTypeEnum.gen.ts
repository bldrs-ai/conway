/* This is generated code, don't alter */
enum IfcEventTriggerTypeEnum {
  EVENTCOMPLEX = 0,
  EVENTMESSAGE = 1,
  EVENTRULE = 2,
  EVENTTIME = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcEventTriggerTypeEnumCount = 6

export { IfcEventTriggerTypeEnum, IfcEventTriggerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEventTriggerTypeEnum =
  new Int32Array( [33] )

let prefixSumAddressIfcEventTriggerTypeEnum =
  new Uint32Array( [0,11,22,35,49,61,75] )

let slotMapIfcEventTriggerTypeEnum =
  new Int32Array( [3,2,4,1,5,0] )

let encodedDataIfcEventTriggerTypeEnum =
  (new TextEncoder()).encode( ".EVENTTIME..EVENTRULE..USERDEFINED..EVENTMESSAGE..NOTDEFINED..EVENTCOMPLEX." )

let IfcEventTriggerTypeEnumSearch =
  new MinimalPerfectHash< IfcEventTriggerTypeEnum >( gMapIfcEventTriggerTypeEnum, prefixSumAddressIfcEventTriggerTypeEnum, slotMapIfcEventTriggerTypeEnum, encodedDataIfcEventTriggerTypeEnum )

export { IfcEventTriggerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEventTriggerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEventTriggerTypeEnum | undefined {
  return parser.extract< IfcEventTriggerTypeEnum >( IfcEventTriggerTypeEnumSearch, input, cursor, endCursor )
}
