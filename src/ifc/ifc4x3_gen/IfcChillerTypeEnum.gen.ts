/* This is generated code, don't alter */
enum IfcChillerTypeEnum {
  AIRCOOLED = 0,
  HEATRECOVERY = 1,
  WATERCOOLED = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcChillerTypeEnumCount = 5

export { IfcChillerTypeEnum, IfcChillerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcChillerTypeEnum =
  new Int32Array( [4] )

let prefixSumAddressIfcChillerTypeEnum =
  new Uint32Array( [0,13,25,36,49,63] )

let slotMapIfcChillerTypeEnum =
  new Int32Array( [3,4,0,2,1] )

let encodedDataIfcChillerTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED..AIRCOOLED..WATERCOOLED..HEATRECOVERY." )

let IfcChillerTypeEnumSearch =
  new MinimalPerfectHash< IfcChillerTypeEnum >( gMapIfcChillerTypeEnum, prefixSumAddressIfcChillerTypeEnum, slotMapIfcChillerTypeEnum, encodedDataIfcChillerTypeEnum )

export { IfcChillerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcChillerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcChillerTypeEnum | undefined {
  return parser.extract< IfcChillerTypeEnum >( IfcChillerTypeEnumSearch, input, cursor, endCursor )
}
