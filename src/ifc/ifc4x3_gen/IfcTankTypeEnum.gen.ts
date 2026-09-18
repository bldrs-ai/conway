/* This is generated code, don't alter */
enum IfcTankTypeEnum {
  BASIN = 0,
  BREAKPRESSURE = 1,
  EXPANSION = 2,
  FEEDANDEXPANSION = 3,
  OILRETENTIONTRAY = 4,
  PRESSUREVESSEL = 5,
  STORAGE = 6,
  VESSEL = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcTankTypeEnumCount = 10

export { IfcTankTypeEnum, IfcTankTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTankTypeEnum =
  new Int32Array( [1,-7,42] )

let prefixSumAddressIfcTankTypeEnum =
  new Uint32Array( [0,7,16,32,47,65,76,89,97,109,127] )

let slotMapIfcTankTypeEnum =
  new Int32Array( [0,6,5,1,3,2,8,7,9,4] )

let encodedDataIfcTankTypeEnum =
  (new TextEncoder()).encode( ".BASIN..STORAGE..PRESSUREVESSEL..BREAKPRESSURE..FEEDANDEXPANSION..EXPANSION..USERDEFINED..VESSEL..NOTDEFINED..OILRETENTIONTRAY." )

let IfcTankTypeEnumSearch =
  new MinimalPerfectHash< IfcTankTypeEnum >( gMapIfcTankTypeEnum, prefixSumAddressIfcTankTypeEnum, slotMapIfcTankTypeEnum, encodedDataIfcTankTypeEnum )

export { IfcTankTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTankTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTankTypeEnum | undefined {
  return parser.extract< IfcTankTypeEnum >( IfcTankTypeEnumSearch, input, cursor, endCursor )
}
