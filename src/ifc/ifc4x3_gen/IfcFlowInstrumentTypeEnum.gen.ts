/* This is generated code, don't alter */
enum IfcFlowInstrumentTypeEnum {
  AMMETER = 0,
  COMBINED = 1,
  FREQUENCYMETER = 2,
  PHASEANGLEMETER = 3,
  POWERFACTORMETER = 4,
  PRESSUREGAUGE = 5,
  THERMOMETER = 6,
  VOLTMETER = 7,
  VOLTMETER_PEAK = 8,
  VOLTMETER_RMS = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcFlowInstrumentTypeEnumCount = 12

export { IfcFlowInstrumentTypeEnum, IfcFlowInstrumentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFlowInstrumentTypeEnum =
  new Int32Array( [3,13,1788] )

let prefixSumAddressIfcFlowInstrumentTypeEnum =
  new Uint32Array( [0,13,22,33,46,56,73,91,107,119,135,150,165] )

let slotMapIfcFlowInstrumentTypeEnum =
  new Int32Array( [6,0,7,10,1,3,4,8,11,2,9,5] )

let encodedDataIfcFlowInstrumentTypeEnum =
  (new TextEncoder()).encode( ".THERMOMETER..AMMETER..VOLTMETER..USERDEFINED..COMBINED..PHASEANGLEMETER..POWERFACTORMETER..VOLTMETER_PEAK..NOTDEFINED..FREQUENCYMETER..VOLTMETER_RMS..PRESSUREGAUGE." )

let IfcFlowInstrumentTypeEnumSearch =
  new MinimalPerfectHash< IfcFlowInstrumentTypeEnum >( gMapIfcFlowInstrumentTypeEnum, prefixSumAddressIfcFlowInstrumentTypeEnum, slotMapIfcFlowInstrumentTypeEnum, encodedDataIfcFlowInstrumentTypeEnum )

export { IfcFlowInstrumentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFlowInstrumentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFlowInstrumentTypeEnum | undefined {
  return parser.extract< IfcFlowInstrumentTypeEnum >( IfcFlowInstrumentTypeEnumSearch, input, cursor, endCursor )
}
