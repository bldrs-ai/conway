/* This is generated code, don't alter */
enum IfcDocumentStatusEnum {
  DRAFT = 0,
  FINAL = 1,
  FINALDRAFT = 2,
  REVISION = 3,
  NOTDEFINED = 4,
}

const IfcDocumentStatusEnumCount = 5

export { IfcDocumentStatusEnum, IfcDocumentStatusEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDocumentStatusEnum =
  new Int32Array( [9] )

let prefixSumAddressIfcDocumentStatusEnum =
  new Uint32Array( [0,7,19,29,41,48] )

let slotMapIfcDocumentStatusEnum =
  new Int32Array( [0,4,3,2,1] )

let encodedDataIfcDocumentStatusEnum =
  (new TextEncoder()).encode( ".DRAFT..NOTDEFINED..REVISION..FINALDRAFT..FINAL." )

let IfcDocumentStatusEnumSearch =
  new MinimalPerfectHash< IfcDocumentStatusEnum >( gMapIfcDocumentStatusEnum, prefixSumAddressIfcDocumentStatusEnum, slotMapIfcDocumentStatusEnum, encodedDataIfcDocumentStatusEnum )

export { IfcDocumentStatusEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDocumentStatusEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDocumentStatusEnum | undefined {
  return parser.extract< IfcDocumentStatusEnum >( IfcDocumentStatusEnumSearch, input, cursor, endCursor )
}
