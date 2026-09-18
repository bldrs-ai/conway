/* This is generated code, don't alter */
enum IfcTimeSeriesDataTypeEnum {
  CONTINUOUS = 0,
  DISCRETE = 1,
  DISCRETEBINARY = 2,
  PIECEWISEBINARY = 3,
  PIECEWISECONSTANT = 4,
  PIECEWISECONTINUOUS = 5,
  NOTDEFINED = 6,
}

const IfcTimeSeriesDataTypeEnumCount = 7

export { IfcTimeSeriesDataTypeEnum, IfcTimeSeriesDataTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTimeSeriesDataTypeEnum =
  new Int32Array( [160] )

let prefixSumAddressIfcTimeSeriesDataTypeEnum =
  new Uint32Array( [0,19,29,41,58,70,86,107] )

let slotMapIfcTimeSeriesDataTypeEnum =
  new Int32Array( [4,1,6,3,0,2,5] )

let encodedDataIfcTimeSeriesDataTypeEnum =
  (new TextEncoder()).encode( ".PIECEWISECONSTANT..DISCRETE..NOTDEFINED..PIECEWISEBINARY..CONTINUOUS..DISCRETEBINARY..PIECEWISECONTINUOUS." )

let IfcTimeSeriesDataTypeEnumSearch =
  new MinimalPerfectHash< IfcTimeSeriesDataTypeEnum >( gMapIfcTimeSeriesDataTypeEnum, prefixSumAddressIfcTimeSeriesDataTypeEnum, slotMapIfcTimeSeriesDataTypeEnum, encodedDataIfcTimeSeriesDataTypeEnum )

export { IfcTimeSeriesDataTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTimeSeriesDataTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTimeSeriesDataTypeEnum | undefined {
  return parser.extract< IfcTimeSeriesDataTypeEnum >( IfcTimeSeriesDataTypeEnumSearch, input, cursor, endCursor )
}
