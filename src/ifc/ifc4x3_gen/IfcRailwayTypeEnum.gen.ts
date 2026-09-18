/* This is generated code, don't alter */
enum IfcRailwayTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcRailwayTypeEnumCount = 2

export { IfcRailwayTypeEnum, IfcRailwayTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRailwayTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcRailwayTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcRailwayTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcRailwayTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcRailwayTypeEnumSearch =
  new MinimalPerfectHash< IfcRailwayTypeEnum >( gMapIfcRailwayTypeEnum, prefixSumAddressIfcRailwayTypeEnum, slotMapIfcRailwayTypeEnum, encodedDataIfcRailwayTypeEnum )

export { IfcRailwayTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRailwayTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRailwayTypeEnum | undefined {
  return parser.extract< IfcRailwayTypeEnum >( IfcRailwayTypeEnumSearch, input, cursor, endCursor )
}
