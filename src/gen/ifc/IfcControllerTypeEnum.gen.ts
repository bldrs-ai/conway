/* This is generated code, don't alter */
enum IfcControllerTypeEnum {
  FLOATING = 0,
  PROGRAMMABLE = 1,
  PROPORTIONAL = 2,
  MULTIPOSITION = 3,
  TWOPOSITION = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcControllerTypeEnumCount = 7

export { IfcControllerTypeEnum, IfcControllerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash'

let gMapIfcControllerTypeEnum =
  new Int32Array( [63] )

let prefixSumAddressIfcControllerTypeEnum =
  new Uint32Array( [0,13,27,39,54,67,81,91] )

let slotMapIfcControllerTypeEnum =
  new Int32Array( [4,1,6,3,5,2,0] )

let encodedDataIfcControllerTypeEnum =
  (new TextEncoder()).encode( ".TWOPOSITION..PROGRAMMABLE..NOTDEFINED..MULTIPOSITION..USERDEFINED..PROPORTIONAL..FLOATING." )

let IfcControllerTypeEnumSearch =
  new MinimalPerfectHash< IfcControllerTypeEnum >( gMapIfcControllerTypeEnum, prefixSumAddressIfcControllerTypeEnum, slotMapIfcControllerTypeEnum, encodedDataIfcControllerTypeEnum )

export { IfcControllerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcControllerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcControllerTypeEnum | undefined {
  return parser.extract< IfcControllerTypeEnum >( IfcControllerTypeEnumSearch, input, cursor, endCursor )
}
