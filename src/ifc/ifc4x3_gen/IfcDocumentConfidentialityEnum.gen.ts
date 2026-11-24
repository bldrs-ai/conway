/* This is generated code, don't alter */
enum IfcDocumentConfidentialityEnum {
  CONFIDENTIAL = 0,
  PERSONAL = 1,
  PUBLIC = 2,
  RESTRICTED = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcDocumentConfidentialityEnumCount = 6

export { IfcDocumentConfidentialityEnum, IfcDocumentConfidentialityEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDocumentConfidentialityEnum =
  new Int32Array( [101] )

let prefixSumAddressIfcDocumentConfidentialityEnum =
  new Uint32Array( [0,12,24,37,51,59,69] )

let slotMapIfcDocumentConfidentialityEnum =
  new Int32Array( [5,3,4,0,2,1] )

let encodedDataIfcDocumentConfidentialityEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..RESTRICTED..USERDEFINED..CONFIDENTIAL..PUBLIC..PERSONAL." )

let IfcDocumentConfidentialityEnumSearch =
  new MinimalPerfectHash< IfcDocumentConfidentialityEnum >( gMapIfcDocumentConfidentialityEnum, prefixSumAddressIfcDocumentConfidentialityEnum, slotMapIfcDocumentConfidentialityEnum, encodedDataIfcDocumentConfidentialityEnum )

export { IfcDocumentConfidentialityEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDocumentConfidentialityEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDocumentConfidentialityEnum | undefined {
  return parser.extract< IfcDocumentConfidentialityEnum >( IfcDocumentConfidentialityEnumSearch, input, cursor, endCursor )
}
