/* This is generated code, don't alter */
enum IfcLogicalOperatorEnum {
  LOGICALAND = 0,
  LOGICALNOTAND = 1,
  LOGICALNOTOR = 2,
  LOGICALOR = 3,
  LOGICALXOR = 4,
}

const IfcLogicalOperatorEnumCount = 5

export { IfcLogicalOperatorEnum, IfcLogicalOperatorEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLogicalOperatorEnum =
  new Int32Array( [3] )

let prefixSumAddressIfcLogicalOperatorEnum =
  new Uint32Array( [0,15,27,38,50,64] )

let slotMapIfcLogicalOperatorEnum =
  new Int32Array( [1,0,3,4,2] )

let encodedDataIfcLogicalOperatorEnum =
  (new TextEncoder()).encode( ".LOGICALNOTAND..LOGICALAND..LOGICALOR..LOGICALXOR..LOGICALNOTOR." )

let IfcLogicalOperatorEnumSearch =
  new MinimalPerfectHash< IfcLogicalOperatorEnum >( gMapIfcLogicalOperatorEnum, prefixSumAddressIfcLogicalOperatorEnum, slotMapIfcLogicalOperatorEnum, encodedDataIfcLogicalOperatorEnum )

export { IfcLogicalOperatorEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLogicalOperatorEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLogicalOperatorEnum | undefined {
  return parser.extract< IfcLogicalOperatorEnum >( IfcLogicalOperatorEnumSearch, input, cursor, endCursor )
}
