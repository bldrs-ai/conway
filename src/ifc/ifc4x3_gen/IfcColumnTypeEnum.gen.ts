/* This is generated code, don't alter */
enum IfcColumnTypeEnum {
  COLUMN = 0,
  PIERSTEM = 1,
  PIERSTEM_SEGMENT = 2,
  PILASTER = 3,
  STANDCOLUMN = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcColumnTypeEnumCount = 7

export { IfcColumnTypeEnum, IfcColumnTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcColumnTypeEnum =
  new Int32Array( [133] )

let prefixSumAddressIfcColumnTypeEnum =
  new Uint32Array( [0,12,22,40,53,63,76,84] )

let slotMapIfcColumnTypeEnum =
  new Int32Array( [6,1,2,5,3,4,0] )

let encodedDataIfcColumnTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..PIERSTEM..PIERSTEM_SEGMENT..USERDEFINED..PILASTER..STANDCOLUMN..COLUMN." )

let IfcColumnTypeEnumSearch =
  new MinimalPerfectHash< IfcColumnTypeEnum >( gMapIfcColumnTypeEnum, prefixSumAddressIfcColumnTypeEnum, slotMapIfcColumnTypeEnum, encodedDataIfcColumnTypeEnum )

export { IfcColumnTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcColumnTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcColumnTypeEnum | undefined {
  return parser.extract< IfcColumnTypeEnum >( IfcColumnTypeEnumSearch, input, cursor, endCursor )
}
