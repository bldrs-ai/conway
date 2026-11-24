/* This is generated code, don't alter */
enum IfcRecurrenceTypeEnum {
  BY_DAY_COUNT = 0,
  BY_WEEKDAY_COUNT = 1,
  DAILY = 2,
  MONTHLY_BY_DAY_OF_MONTH = 3,
  MONTHLY_BY_POSITION = 4,
  WEEKLY = 5,
  YEARLY_BY_DAY_OF_MONTH = 6,
  YEARLY_BY_POSITION = 7,
}

const IfcRecurrenceTypeEnumCount = 8

export { IfcRecurrenceTypeEnum, IfcRecurrenceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRecurrenceTypeEnum =
  new Int32Array( [4,1,15] )

let prefixSumAddressIfcRecurrenceTypeEnum =
  new Uint32Array( [0,24,49,57,75,96,116,123,137] )

let slotMapIfcRecurrenceTypeEnum =
  new Int32Array( [6,3,5,1,4,7,2,0] )

let encodedDataIfcRecurrenceTypeEnum =
  (new TextEncoder()).encode( ".YEARLY_BY_DAY_OF_MONTH..MONTHLY_BY_DAY_OF_MONTH..WEEKLY..BY_WEEKDAY_COUNT..MONTHLY_BY_POSITION..YEARLY_BY_POSITION..DAILY..BY_DAY_COUNT." )

let IfcRecurrenceTypeEnumSearch =
  new MinimalPerfectHash< IfcRecurrenceTypeEnum >( gMapIfcRecurrenceTypeEnum, prefixSumAddressIfcRecurrenceTypeEnum, slotMapIfcRecurrenceTypeEnum, encodedDataIfcRecurrenceTypeEnum )

export { IfcRecurrenceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRecurrenceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRecurrenceTypeEnum | undefined {
  return parser.extract< IfcRecurrenceTypeEnum >( IfcRecurrenceTypeEnumSearch, input, cursor, endCursor )
}
