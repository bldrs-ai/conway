/* This is generated code, don't alter */
enum IfcBenchmarkEnum {
  EQUALTO = 0,
  GREATERTHAN = 1,
  GREATERTHANOREQUALTO = 2,
  INCLUDEDIN = 3,
  INCLUDES = 4,
  LESSTHAN = 5,
  LESSTHANOREQUALTO = 6,
  NOTEQUALTO = 7,
  NOTINCLUDEDIN = 8,
  NOTINCLUDES = 9,
}

const IfcBenchmarkEnumCount = 10

export { IfcBenchmarkEnum, IfcBenchmarkEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBenchmarkEnum =
  new Int32Array( [2,77,31] )

let prefixSumAddressIfcBenchmarkEnum =
  new Uint32Array( [0,19,29,38,53,65,87,100,113,123,135] )

let slotMapIfcBenchmarkEnum =
  new Int32Array( [6,5,0,8,3,2,9,1,4,7] )

let encodedDataIfcBenchmarkEnum =
  (new TextEncoder()).encode( ".LESSTHANOREQUALTO..LESSTHAN..EQUALTO..NOTINCLUDEDIN..INCLUDEDIN..GREATERTHANOREQUALTO..NOTINCLUDES..GREATERTHAN..INCLUDES..NOTEQUALTO." )

let IfcBenchmarkEnumSearch =
  new MinimalPerfectHash< IfcBenchmarkEnum >( gMapIfcBenchmarkEnum, prefixSumAddressIfcBenchmarkEnum, slotMapIfcBenchmarkEnum, encodedDataIfcBenchmarkEnum )

export { IfcBenchmarkEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBenchmarkEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBenchmarkEnum | undefined {
  return parser.extract< IfcBenchmarkEnum >( IfcBenchmarkEnumSearch, input, cursor, endCursor )
}
