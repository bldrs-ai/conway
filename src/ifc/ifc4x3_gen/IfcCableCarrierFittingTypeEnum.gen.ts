/* This is generated code, don't alter */
enum IfcCableCarrierFittingTypeEnum {
  BEND = 0,
  CONNECTOR = 1,
  CROSS = 2,
  JUNCTION = 3,
  REDUCER = 4,
  TEE = 5,
  TRANSITION = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcCableCarrierFittingTypeEnumCount = 9

export { IfcCableCarrierFittingTypeEnum, IfcCableCarrierFittingTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCableCarrierFittingTypeEnum =
  new Int32Array( [1,11,84] )

let prefixSumAddressIfcCableCarrierFittingTypeEnum =
  new Uint32Array( [0,9,21,33,44,50,60,73,80,85] )

let slotMapIfcCableCarrierFittingTypeEnum =
  new Int32Array( [4,8,6,1,0,3,7,2,5] )

let encodedDataIfcCableCarrierFittingTypeEnum =
  (new TextEncoder()).encode( ".REDUCER..NOTDEFINED..TRANSITION..CONNECTOR..BEND..JUNCTION..USERDEFINED..CROSS..TEE." )

let IfcCableCarrierFittingTypeEnumSearch =
  new MinimalPerfectHash< IfcCableCarrierFittingTypeEnum >( gMapIfcCableCarrierFittingTypeEnum, prefixSumAddressIfcCableCarrierFittingTypeEnum, slotMapIfcCableCarrierFittingTypeEnum, encodedDataIfcCableCarrierFittingTypeEnum )

export { IfcCableCarrierFittingTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCableCarrierFittingTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCableCarrierFittingTypeEnum | undefined {
  return parser.extract< IfcCableCarrierFittingTypeEnum >( IfcCableCarrierFittingTypeEnumSearch, input, cursor, endCursor )
}
