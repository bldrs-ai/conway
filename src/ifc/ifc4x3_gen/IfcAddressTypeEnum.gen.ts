/* This is generated code, don't alter */
enum IfcAddressTypeEnum {
  DISTRIBUTIONPOINT = 0,
  HOME = 1,
  OFFICE = 2,
  SITE = 3,
  USERDEFINED = 4,
}

const IfcAddressTypeEnumCount = 5

export { IfcAddressTypeEnum, IfcAddressTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAddressTypeEnum =
  new Int32Array( [35] )

let prefixSumAddressIfcAddressTypeEnum =
  new Uint32Array( [0,6,14,27,46,52] )

let slotMapIfcAddressTypeEnum =
  new Int32Array( [1,2,4,0,3] )

let encodedDataIfcAddressTypeEnum =
  (new TextEncoder()).encode( ".HOME..OFFICE..USERDEFINED..DISTRIBUTIONPOINT..SITE." )

let IfcAddressTypeEnumSearch =
  new MinimalPerfectHash< IfcAddressTypeEnum >( gMapIfcAddressTypeEnum, prefixSumAddressIfcAddressTypeEnum, slotMapIfcAddressTypeEnum, encodedDataIfcAddressTypeEnum )

export { IfcAddressTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAddressTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAddressTypeEnum | undefined {
  return parser.extract< IfcAddressTypeEnum >( IfcAddressTypeEnumSearch, input, cursor, endCursor )
}
