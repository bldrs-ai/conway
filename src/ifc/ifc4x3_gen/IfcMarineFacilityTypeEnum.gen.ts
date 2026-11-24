/* This is generated code, don't alter */
enum IfcMarineFacilityTypeEnum {
  BARRIERBEACH = 0,
  BREAKWATER = 1,
  CANAL = 2,
  DRYDOCK = 3,
  FLOATINGDOCK = 4,
  HYDROLIFT = 5,
  JETTY = 6,
  LAUNCHRECOVERY = 7,
  MARINEDEFENCE = 8,
  NAVIGATIONALCHANNEL = 9,
  PORT = 10,
  QUAY = 11,
  REVETMENT = 12,
  SHIPLIFT = 13,
  SHIPLOCK = 14,
  SHIPYARD = 15,
  SLIPWAY = 16,
  WATERWAY = 17,
  WATERWAYSHIPLIFT = 18,
  USERDEFINED = 19,
  NOTDEFINED = 20,
}

const IfcMarineFacilityTypeEnumCount = 21

export { IfcMarineFacilityTypeEnum, IfcMarineFacilityTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMarineFacilityTypeEnum =
  new Int32Array( [-13,628,79,2,13] )

let prefixSumAddressIfcMarineFacilityTypeEnum =
  new Uint32Array( [0,12,18,29,38,53,63,74,81,87,101,108,129,145,158,168,177,195,205,215,227,241] )

let slotMapIfcMarineFacilityTypeEnum =
  new Int32Array( [1,10,12,16,8,13,5,6,11,0,2,9,7,19,15,3,18,17,14,20,4] )

let encodedDataIfcMarineFacilityTypeEnum =
  (new TextEncoder()).encode( ".BREAKWATER..PORT..REVETMENT..SLIPWAY..MARINEDEFENCE..SHIPLIFT..HYDROLIFT..JETTY..QUAY..BARRIERBEACH..CANAL..NAVIGATIONALCHANNEL..LAUNCHRECOVERY..USERDEFINED..SHIPYARD..DRYDOCK..WATERWAYSHIPLIFT..WATERWAY..SHIPLOCK..NOTDEFINED..FLOATINGDOCK." )

let IfcMarineFacilityTypeEnumSearch =
  new MinimalPerfectHash< IfcMarineFacilityTypeEnum >( gMapIfcMarineFacilityTypeEnum, prefixSumAddressIfcMarineFacilityTypeEnum, slotMapIfcMarineFacilityTypeEnum, encodedDataIfcMarineFacilityTypeEnum )

export { IfcMarineFacilityTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMarineFacilityTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMarineFacilityTypeEnum | undefined {
  return parser.extract< IfcMarineFacilityTypeEnum >( IfcMarineFacilityTypeEnumSearch, input, cursor, endCursor )
}
