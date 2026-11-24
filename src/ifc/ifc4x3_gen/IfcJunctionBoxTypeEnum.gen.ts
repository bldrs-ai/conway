/* This is generated code, don't alter */
enum IfcJunctionBoxTypeEnum {
  DATA = 0,
  POWER = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcJunctionBoxTypeEnumCount = 4

export { IfcJunctionBoxTypeEnum, IfcJunctionBoxTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcJunctionBoxTypeEnum =
  new Int32Array( [11] )

let prefixSumAddressIfcJunctionBoxTypeEnum =
  new Uint32Array( [0,6,19,26,38] )

let slotMapIfcJunctionBoxTypeEnum =
  new Int32Array( [0,2,1,3] )

let encodedDataIfcJunctionBoxTypeEnum =
  (new TextEncoder()).encode( ".DATA..USERDEFINED..POWER..NOTDEFINED." )

let IfcJunctionBoxTypeEnumSearch =
  new MinimalPerfectHash< IfcJunctionBoxTypeEnum >( gMapIfcJunctionBoxTypeEnum, prefixSumAddressIfcJunctionBoxTypeEnum, slotMapIfcJunctionBoxTypeEnum, encodedDataIfcJunctionBoxTypeEnum )

export { IfcJunctionBoxTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcJunctionBoxTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcJunctionBoxTypeEnum | undefined {
  return parser.extract< IfcJunctionBoxTypeEnum >( IfcJunctionBoxTypeEnumSearch, input, cursor, endCursor )
}
