/* This is generated code, don't alter */
enum IfcAssemblyPlaceEnum {
  FACTORY = 0,
  SITE = 1,
  NOTDEFINED = 2,
}

const IfcAssemblyPlaceEnumCount = 3

export { IfcAssemblyPlaceEnum, IfcAssemblyPlaceEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAssemblyPlaceEnum =
  new Int32Array( [2] )

let prefixSumAddressIfcAssemblyPlaceEnum =
  new Uint32Array( [0,9,21,27] )

let slotMapIfcAssemblyPlaceEnum =
  new Int32Array( [0,2,1] )

let encodedDataIfcAssemblyPlaceEnum =
  (new TextEncoder()).encode( ".FACTORY..NOTDEFINED..SITE." )

let IfcAssemblyPlaceEnumSearch =
  new MinimalPerfectHash< IfcAssemblyPlaceEnum >( gMapIfcAssemblyPlaceEnum, prefixSumAddressIfcAssemblyPlaceEnum, slotMapIfcAssemblyPlaceEnum, encodedDataIfcAssemblyPlaceEnum )

export { IfcAssemblyPlaceEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAssemblyPlaceEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAssemblyPlaceEnum | undefined {
  return parser.extract< IfcAssemblyPlaceEnum >( IfcAssemblyPlaceEnumSearch, input, cursor, endCursor )
}
