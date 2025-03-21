/* This is generated code, don't alter */
enum IfcTransitionCode {
  DISCONTINUOUS = 0,
  CONTINUOUS = 1,
  CONTSAMEGRADIENT = 2,
  CONTSAMEGRADIENTSAMECURVATURE = 3,
}

const IfcTransitionCodeCount = 4

export { IfcTransitionCode, IfcTransitionCodeCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTransitionCode =
  new Int32Array( [13] )

let prefixSumAddressIfcTransitionCode =
  new Uint32Array( [0,31,43,58,76] )

let slotMapIfcTransitionCode =
  new Int32Array( [3,1,0,2] )

let encodedDataIfcTransitionCode =
  (new TextEncoder()).encode( ".CONTSAMEGRADIENTSAMECURVATURE..CONTINUOUS..DISCONTINUOUS..CONTSAMEGRADIENT." )

let IfcTransitionCodeSearch =
  new MinimalPerfectHash< IfcTransitionCode >( gMapIfcTransitionCode, prefixSumAddressIfcTransitionCode, slotMapIfcTransitionCode, encodedDataIfcTransitionCode )

export { IfcTransitionCodeSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTransitionCodeDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTransitionCode | undefined {
  return parser.extract< IfcTransitionCode >( IfcTransitionCodeSearch, input, cursor, endCursor )
}
