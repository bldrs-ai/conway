/* This is generated code, don't alter */
enum IfcCoolingTowerTypeEnum {
  MECHANICALFORCEDDRAFT = 0,
  MECHANICALINDUCEDDRAFT = 1,
  NATURALDRAFT = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcCoolingTowerTypeEnumCount = 5

export { IfcCoolingTowerTypeEnum, IfcCoolingTowerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCoolingTowerTypeEnum =
  new Int32Array( [20] )

let prefixSumAddressIfcCoolingTowerTypeEnum =
  new Uint32Array( [0,24,47,59,72,86] )

let slotMapIfcCoolingTowerTypeEnum =
  new Int32Array( [1,0,4,3,2] )

let encodedDataIfcCoolingTowerTypeEnum =
  (new TextEncoder()).encode( ".MECHANICALINDUCEDDRAFT..MECHANICALFORCEDDRAFT..NOTDEFINED..USERDEFINED..NATURALDRAFT." )

let IfcCoolingTowerTypeEnumSearch =
  new MinimalPerfectHash< IfcCoolingTowerTypeEnum >( gMapIfcCoolingTowerTypeEnum, prefixSumAddressIfcCoolingTowerTypeEnum, slotMapIfcCoolingTowerTypeEnum, encodedDataIfcCoolingTowerTypeEnum )

export { IfcCoolingTowerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCoolingTowerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCoolingTowerTypeEnum | undefined {
  return parser.extract< IfcCoolingTowerTypeEnum >( IfcCoolingTowerTypeEnumSearch, input, cursor, endCursor )
}
