/* This is generated code, don't alter */
enum IfcArithmeticOperatorEnum {
  ADD = 0,
  DIVIDE = 1,
  MODULO = 2,
  MULTIPLY = 3,
  SUBTRACT = 4,
}

const IfcArithmeticOperatorEnumCount = 5

export { IfcArithmeticOperatorEnum, IfcArithmeticOperatorEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcArithmeticOperatorEnum =
  new Int32Array( [33] )

let prefixSumAddressIfcArithmeticOperatorEnum =
  new Uint32Array( [0,8,18,28,33,41] )

let slotMapIfcArithmeticOperatorEnum =
  new Int32Array( [2,3,4,0,1] )

let encodedDataIfcArithmeticOperatorEnum =
  (new TextEncoder()).encode( ".MODULO..MULTIPLY..SUBTRACT..ADD..DIVIDE." )

let IfcArithmeticOperatorEnumSearch =
  new MinimalPerfectHash< IfcArithmeticOperatorEnum >( gMapIfcArithmeticOperatorEnum, prefixSumAddressIfcArithmeticOperatorEnum, slotMapIfcArithmeticOperatorEnum, encodedDataIfcArithmeticOperatorEnum )

export { IfcArithmeticOperatorEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcArithmeticOperatorEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcArithmeticOperatorEnum | undefined {
  return parser.extract< IfcArithmeticOperatorEnum >( IfcArithmeticOperatorEnumSearch, input, cursor, endCursor )
}
