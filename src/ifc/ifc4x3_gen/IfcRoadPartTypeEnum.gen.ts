/* This is generated code, don't alter */
enum IfcRoadPartTypeEnum {
  BICYCLECROSSING = 0,
  BUS_STOP = 1,
  CARRIAGEWAY = 2,
  CENTRALISLAND = 3,
  CENTRALRESERVE = 4,
  HARDSHOULDER = 5,
  INTERSECTION = 6,
  LAYBY = 7,
  PARKINGBAY = 8,
  PASSINGBAY = 9,
  PEDESTRIAN_CROSSING = 10,
  RAILWAYCROSSING = 11,
  REFUGEISLAND = 12,
  ROADSEGMENT = 13,
  ROADSIDE = 14,
  ROADSIDEPART = 15,
  ROADWAYPLATEAU = 16,
  ROUNDABOUT = 17,
  SHOULDER = 18,
  SIDEWALK = 19,
  SOFTSHOULDER = 20,
  TOLLPLAZA = 21,
  TRAFFICISLAND = 22,
  TRAFFICLANE = 23,
  USERDEFINED = 24,
  NOTDEFINED = 25,
}

const IfcRoadPartTypeEnumCount = 26

export { IfcRoadPartTypeEnum, IfcRoadPartTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRoadPartTypeEnum =
  new Int32Array( [2,151,14,51,249,232] )

let prefixSumAddressIfcRoadPartTypeEnum =
  new Uint32Array( [0,13,28,39,51,64,81,95,108,118,139,153,170,182,195,202,217,227,241,251,267,279,289,305,319,333,345] )

let slotMapIfcRoadPartTypeEnum =
  new Int32Array( [2,3,21,8,13,0,20,24,19,10,6,11,9,23,7,22,1,5,14,4,25,18,16,15,12,17] )

let encodedDataIfcRoadPartTypeEnum =
  (new TextEncoder()).encode( ".CARRIAGEWAY..CENTRALISLAND..TOLLPLAZA..PARKINGBAY..ROADSEGMENT..BICYCLECROSSING..SOFTSHOULDER..USERDEFINED..SIDEWALK..PEDESTRIAN_CROSSING..INTERSECTION..RAILWAYCROSSING..PASSINGBAY..TRAFFICLANE..LAYBY..TRAFFICISLAND..BUS_STOP..HARDSHOULDER..ROADSIDE..CENTRALRESERVE..NOTDEFINED..SHOULDER..ROADWAYPLATEAU..ROADSIDEPART..REFUGEISLAND..ROUNDABOUT." )

let IfcRoadPartTypeEnumSearch =
  new MinimalPerfectHash< IfcRoadPartTypeEnum >( gMapIfcRoadPartTypeEnum, prefixSumAddressIfcRoadPartTypeEnum, slotMapIfcRoadPartTypeEnum, encodedDataIfcRoadPartTypeEnum )

export { IfcRoadPartTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRoadPartTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRoadPartTypeEnum | undefined {
  return parser.extract< IfcRoadPartTypeEnum >( IfcRoadPartTypeEnumSearch, input, cursor, endCursor )
}
