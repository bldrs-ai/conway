/* This is generated code, don't alter */
enum IfcRailwayPartTypeEnum {
  ABOVETRACK = 0,
  DILATIONTRACK = 1,
  LINESIDE = 2,
  LINESIDEPART = 3,
  PLAINTRACK = 4,
  SUBSTRUCTURE = 5,
  TRACK = 6,
  TRACKPART = 7,
  TURNOUTTRACK = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcRailwayPartTypeEnumCount = 11

export { IfcRailwayPartTypeEnum, IfcRailwayPartTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRailwayPartTypeEnum =
  new Int32Array( [2,69,23] )

let prefixSumAddressIfcRailwayPartTypeEnum =
  new Uint32Array( [0,13,23,37,52,64,76,90,102,109,123,134] )

let slotMapIfcRailwayPartTypeEnum =
  new Int32Array( [9,2,5,1,4,10,3,0,6,8,7] )

let encodedDataIfcRailwayPartTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..LINESIDE..SUBSTRUCTURE..DILATIONTRACK..PLAINTRACK..NOTDEFINED..LINESIDEPART..ABOVETRACK..TRACK..TURNOUTTRACK..TRACKPART." )

let IfcRailwayPartTypeEnumSearch =
  new MinimalPerfectHash< IfcRailwayPartTypeEnum >( gMapIfcRailwayPartTypeEnum, prefixSumAddressIfcRailwayPartTypeEnum, slotMapIfcRailwayPartTypeEnum, encodedDataIfcRailwayPartTypeEnum )

export { IfcRailwayPartTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRailwayPartTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRailwayPartTypeEnum | undefined {
  return parser.extract< IfcRailwayPartTypeEnum >( IfcRailwayPartTypeEnumSearch, input, cursor, endCursor )
}
