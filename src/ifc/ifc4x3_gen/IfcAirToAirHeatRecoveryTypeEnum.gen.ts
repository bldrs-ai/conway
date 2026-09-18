/* This is generated code, don't alter */
enum IfcAirToAirHeatRecoveryTypeEnum {
  FIXEDPLATECOUNTERFLOWEXCHANGER = 0,
  FIXEDPLATECROSSFLOWEXCHANGER = 1,
  FIXEDPLATEPARALLELFLOWEXCHANGER = 2,
  HEATPIPE = 3,
  ROTARYWHEEL = 4,
  RUNAROUNDCOILLOOP = 5,
  THERMOSIPHONCOILTYPEHEATEXCHANGERS = 6,
  THERMOSIPHONSEALEDTUBEHEATEXCHANGERS = 7,
  TWINTOWERENTHALPYRECOVERYLOOPS = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcAirToAirHeatRecoveryTypeEnumCount = 11

export { IfcAirToAirHeatRecoveryTypeEnum, IfcAirToAirHeatRecoveryTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAirToAirHeatRecoveryTypeEnum =
  new Int32Array( [36,-5,5] )

let prefixSumAddressIfcAirToAirHeatRecoveryTypeEnum =
  new Uint32Array( [0,32,45,77,110,120,150,186,199,218,256,268] )

let slotMapIfcAirToAirHeatRecoveryTypeEnum =
  new Int32Array( [0,9,8,2,3,1,6,4,5,7,10] )

let encodedDataIfcAirToAirHeatRecoveryTypeEnum =
  (new TextEncoder()).encode( ".FIXEDPLATECOUNTERFLOWEXCHANGER..USERDEFINED..TWINTOWERENTHALPYRECOVERYLOOPS..FIXEDPLATEPARALLELFLOWEXCHANGER..HEATPIPE..FIXEDPLATECROSSFLOWEXCHANGER..THERMOSIPHONCOILTYPEHEATEXCHANGERS..ROTARYWHEEL..RUNAROUNDCOILLOOP..THERMOSIPHONSEALEDTUBEHEATEXCHANGERS..NOTDEFINED." )

let IfcAirToAirHeatRecoveryTypeEnumSearch =
  new MinimalPerfectHash< IfcAirToAirHeatRecoveryTypeEnum >( gMapIfcAirToAirHeatRecoveryTypeEnum, prefixSumAddressIfcAirToAirHeatRecoveryTypeEnum, slotMapIfcAirToAirHeatRecoveryTypeEnum, encodedDataIfcAirToAirHeatRecoveryTypeEnum )

export { IfcAirToAirHeatRecoveryTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAirToAirHeatRecoveryTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAirToAirHeatRecoveryTypeEnum | undefined {
  return parser.extract< IfcAirToAirHeatRecoveryTypeEnum >( IfcAirToAirHeatRecoveryTypeEnumSearch, input, cursor, endCursor )
}
