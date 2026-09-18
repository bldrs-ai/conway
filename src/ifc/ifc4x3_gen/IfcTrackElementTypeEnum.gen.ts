/* This is generated code, don't alter */
enum IfcTrackElementTypeEnum {
  BLOCKINGDEVICE = 0,
  DERAILER = 1,
  FROG = 2,
  HALF_SET_OF_BLADES = 3,
  SLEEPER = 4,
  SPEEDREGULATOR = 5,
  TRACKENDOFALIGNMENT = 6,
  VEHICLESTOP = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcTrackElementTypeEnumCount = 10

export { IfcTrackElementTypeEnum, IfcTrackElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTrackElementTypeEnum =
  new Int32Array( [10,23,27] )

let prefixSumAddressIfcTrackElementTypeEnum =
  new Uint32Array( [0,13,29,35,44,65,77,93,113,126,136] )

let slotMapIfcTrackElementTypeEnum =
  new Int32Array( [8,5,2,4,6,9,0,3,7,1] )

let encodedDataIfcTrackElementTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..SPEEDREGULATOR..FROG..SLEEPER..TRACKENDOFALIGNMENT..NOTDEFINED..BLOCKINGDEVICE..HALF_SET_OF_BLADES..VEHICLESTOP..DERAILER." )

let IfcTrackElementTypeEnumSearch =
  new MinimalPerfectHash< IfcTrackElementTypeEnum >( gMapIfcTrackElementTypeEnum, prefixSumAddressIfcTrackElementTypeEnum, slotMapIfcTrackElementTypeEnum, encodedDataIfcTrackElementTypeEnum )

export { IfcTrackElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTrackElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTrackElementTypeEnum | undefined {
  return parser.extract< IfcTrackElementTypeEnum >( IfcTrackElementTypeEnumSearch, input, cursor, endCursor )
}
