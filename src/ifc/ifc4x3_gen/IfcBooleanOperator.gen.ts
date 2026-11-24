/* This is generated code, don't alter */
enum IfcBooleanOperator {
  DIFFERENCE = 0,
  INTERSECTION = 1,
  UNION = 2,
}

const IfcBooleanOperatorCount = 3

export { IfcBooleanOperator, IfcBooleanOperatorCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBooleanOperator =
  new Int32Array( [3] )

let prefixSumAddressIfcBooleanOperator =
  new Uint32Array( [0,7,21,33] )

let slotMapIfcBooleanOperator =
  new Int32Array( [2,1,0] )

let encodedDataIfcBooleanOperator =
  (new TextEncoder()).encode( ".UNION..INTERSECTION..DIFFERENCE." )

let IfcBooleanOperatorSearch =
  new MinimalPerfectHash< IfcBooleanOperator >( gMapIfcBooleanOperator, prefixSumAddressIfcBooleanOperator, slotMapIfcBooleanOperator, encodedDataIfcBooleanOperator )

export { IfcBooleanOperatorSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBooleanOperatorDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBooleanOperator | undefined {
  return parser.extract< IfcBooleanOperator >( IfcBooleanOperatorSearch, input, cursor, endCursor )
}
