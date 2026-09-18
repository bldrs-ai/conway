/* This is generated code, don't alter */
enum IfcTrimmingPreference {
  CARTESIAN = 0,
  PARAMETER = 1,
  UNSPECIFIED = 2,
}

const IfcTrimmingPreferenceCount = 3

export { IfcTrimmingPreference, IfcTrimmingPreferenceCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTrimmingPreference =
  new Int32Array( [2] )

let prefixSumAddressIfcTrimmingPreference =
  new Uint32Array( [0,13,24,35] )

let slotMapIfcTrimmingPreference =
  new Int32Array( [2,0,1] )

let encodedDataIfcTrimmingPreference =
  (new TextEncoder()).encode( ".UNSPECIFIED..CARTESIAN..PARAMETER." )

let IfcTrimmingPreferenceSearch =
  new MinimalPerfectHash< IfcTrimmingPreference >( gMapIfcTrimmingPreference, prefixSumAddressIfcTrimmingPreference, slotMapIfcTrimmingPreference, encodedDataIfcTrimmingPreference )

export { IfcTrimmingPreferenceSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTrimmingPreferenceDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTrimmingPreference | undefined {
  return parser.extract< IfcTrimmingPreference >( IfcTrimmingPreferenceSearch, input, cursor, endCursor )
}
