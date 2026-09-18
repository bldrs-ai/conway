/* This is generated code, don't alter */
enum IfcChangeActionEnum {
  ADDED = 0,
  DELETED = 1,
  MODIFIED = 2,
  NOCHANGE = 3,
  NOTDEFINED = 4,
}

const IfcChangeActionEnumCount = 5

export { IfcChangeActionEnum, IfcChangeActionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcChangeActionEnum =
  new Int32Array( [29] )

let prefixSumAddressIfcChangeActionEnum =
  new Uint32Array( [0,10,22,32,39,48] )

let slotMapIfcChangeActionEnum =
  new Int32Array( [3,4,2,0,1] )

let encodedDataIfcChangeActionEnum =
  (new TextEncoder()).encode( ".NOCHANGE..NOTDEFINED..MODIFIED..ADDED..DELETED." )

let IfcChangeActionEnumSearch =
  new MinimalPerfectHash< IfcChangeActionEnum >( gMapIfcChangeActionEnum, prefixSumAddressIfcChangeActionEnum, slotMapIfcChangeActionEnum, encodedDataIfcChangeActionEnum )

export { IfcChangeActionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcChangeActionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcChangeActionEnum | undefined {
  return parser.extract< IfcChangeActionEnum >( IfcChangeActionEnumSearch, input, cursor, endCursor )
}
