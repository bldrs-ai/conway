/* This is generated code, don't alter */
enum IfcLightDistributionCurveEnum {
  TYPE_A = 0,
  TYPE_B = 1,
  TYPE_C = 2,
  NOTDEFINED = 3,
}

const IfcLightDistributionCurveEnumCount = 4

export { IfcLightDistributionCurveEnum, IfcLightDistributionCurveEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcLightDistributionCurveEnum =
  new Int32Array( [5] )

let prefixSumAddressIfcLightDistributionCurveEnum =
  new Uint32Array( [0,8,16,24,36] )

let slotMapIfcLightDistributionCurveEnum =
  new Int32Array( [1,0,2,3] )

let encodedDataIfcLightDistributionCurveEnum =
  (new TextEncoder()).encode( ".TYPE_B..TYPE_A..TYPE_C..NOTDEFINED." )

let IfcLightDistributionCurveEnumSearch =
  new MinimalPerfectHash< IfcLightDistributionCurveEnum >( gMapIfcLightDistributionCurveEnum, prefixSumAddressIfcLightDistributionCurveEnum, slotMapIfcLightDistributionCurveEnum, encodedDataIfcLightDistributionCurveEnum )

export { IfcLightDistributionCurveEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcLightDistributionCurveEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcLightDistributionCurveEnum | undefined {
  return parser.extract< IfcLightDistributionCurveEnum >( IfcLightDistributionCurveEnumSearch, input, cursor, endCursor )
}
