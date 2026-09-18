/* This is generated code, don't alter */
enum IfcActionSourceTypeEnum {
  BRAKES = 0,
  BUOYANCY = 1,
  COMPLETION_G1 = 2,
  CREEP = 3,
  CURRENT = 4,
  DEAD_LOAD_G = 5,
  EARTHQUAKE_E = 6,
  ERECTION = 7,
  FIRE = 8,
  ICE = 9,
  IMPACT = 10,
  IMPULSE = 11,
  LACK_OF_FIT = 12,
  LIVE_LOAD_Q = 13,
  PRESTRESSING_P = 14,
  PROPPING = 15,
  RAIN = 16,
  SETTLEMENT_U = 17,
  SHRINKAGE = 18,
  SNOW_S = 19,
  SYSTEM_IMPERFECTION = 20,
  TEMPERATURE_T = 21,
  TRANSPORT = 22,
  WAVE = 23,
  WIND_W = 24,
  USERDEFINED = 25,
  NOTDEFINED = 26,
}

const IfcActionSourceTypeEnumCount = 27

export { IfcActionSourceTypeEnum, IfcActionSourceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcActionSourceTypeEnum =
  new Int32Array( [15,-6,3,100,201,42] )

let prefixSumAddressIfcActionSourceTypeEnum =
  new Uint32Array( [0,21,29,41,54,62,77,85,99,105,111,127,141,151,162,168,177,187,196,204,215,220,230,243,256,263,276,291] )

let slotMapIfcActionSourceTypeEnum =
  new Int32Array( [20,0,26,5,19,21,10,17,8,16,14,6,1,18,23,4,7,11,24,22,9,15,12,13,3,25,2] )

let encodedDataIfcActionSourceTypeEnum =
  (new TextEncoder()).encode( ".SYSTEM_IMPERFECTION..BRAKES..NOTDEFINED..DEAD_LOAD_G..SNOW_S..TEMPERATURE_T..IMPACT..SETTLEMENT_U..FIRE..RAIN..PRESTRESSING_P..EARTHQUAKE_E..BUOYANCY..SHRINKAGE..WAVE..CURRENT..ERECTION..IMPULSE..WIND_W..TRANSPORT..ICE..PROPPING..LACK_OF_FIT..LIVE_LOAD_Q..CREEP..USERDEFINED..COMPLETION_G1." )

let IfcActionSourceTypeEnumSearch =
  new MinimalPerfectHash< IfcActionSourceTypeEnum >( gMapIfcActionSourceTypeEnum, prefixSumAddressIfcActionSourceTypeEnum, slotMapIfcActionSourceTypeEnum, encodedDataIfcActionSourceTypeEnum )

export { IfcActionSourceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcActionSourceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcActionSourceTypeEnum | undefined {
  return parser.extract< IfcActionSourceTypeEnum >( IfcActionSourceTypeEnumSearch, input, cursor, endCursor )
}
