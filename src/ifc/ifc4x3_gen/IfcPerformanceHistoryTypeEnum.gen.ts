/* This is generated code, don't alter */
enum IfcPerformanceHistoryTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcPerformanceHistoryTypeEnumCount = 2

export { IfcPerformanceHistoryTypeEnum, IfcPerformanceHistoryTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPerformanceHistoryTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcPerformanceHistoryTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcPerformanceHistoryTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcPerformanceHistoryTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcPerformanceHistoryTypeEnumSearch =
  new MinimalPerfectHash< IfcPerformanceHistoryTypeEnum >( gMapIfcPerformanceHistoryTypeEnum, prefixSumAddressIfcPerformanceHistoryTypeEnum, slotMapIfcPerformanceHistoryTypeEnum, encodedDataIfcPerformanceHistoryTypeEnum )

export { IfcPerformanceHistoryTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPerformanceHistoryTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPerformanceHistoryTypeEnum | undefined {
  return parser.extract< IfcPerformanceHistoryTypeEnum >( IfcPerformanceHistoryTypeEnumSearch, input, cursor, endCursor )
}
