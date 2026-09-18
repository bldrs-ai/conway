/* This is generated code, don't alter */
enum IfcFlowMeterTypeEnum {
  ENERGYMETER = 0,
  GASMETER = 1,
  OILMETER = 2,
  WATERMETER = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcFlowMeterTypeEnumCount = 6

export { IfcFlowMeterTypeEnum, IfcFlowMeterTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFlowMeterTypeEnum =
  new Int32Array( [133] )

let prefixSumAddressIfcFlowMeterTypeEnum =
  new Uint32Array( [0,13,23,35,48,58,70] )

let slotMapIfcFlowMeterTypeEnum =
  new Int32Array( [4,2,5,0,1,3] )

let encodedDataIfcFlowMeterTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..OILMETER..NOTDEFINED..ENERGYMETER..GASMETER..WATERMETER." )

let IfcFlowMeterTypeEnumSearch =
  new MinimalPerfectHash< IfcFlowMeterTypeEnum >( gMapIfcFlowMeterTypeEnum, prefixSumAddressIfcFlowMeterTypeEnum, slotMapIfcFlowMeterTypeEnum, encodedDataIfcFlowMeterTypeEnum )

export { IfcFlowMeterTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFlowMeterTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFlowMeterTypeEnum | undefined {
  return parser.extract< IfcFlowMeterTypeEnum >( IfcFlowMeterTypeEnumSearch, input, cursor, endCursor )
}
