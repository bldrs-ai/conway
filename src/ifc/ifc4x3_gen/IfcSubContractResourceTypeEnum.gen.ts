/* This is generated code, don't alter */
enum IfcSubContractResourceTypeEnum {
  PURCHASE = 0,
  WORK = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcSubContractResourceTypeEnumCount = 4

export { IfcSubContractResourceTypeEnum, IfcSubContractResourceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSubContractResourceTypeEnum =
  new Int32Array( [7] )

let prefixSumAddressIfcSubContractResourceTypeEnum =
  new Uint32Array( [0,12,18,28,41] )

let slotMapIfcSubContractResourceTypeEnum =
  new Int32Array( [3,1,0,2] )

let encodedDataIfcSubContractResourceTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..WORK..PURCHASE..USERDEFINED." )

let IfcSubContractResourceTypeEnumSearch =
  new MinimalPerfectHash< IfcSubContractResourceTypeEnum >( gMapIfcSubContractResourceTypeEnum, prefixSumAddressIfcSubContractResourceTypeEnum, slotMapIfcSubContractResourceTypeEnum, encodedDataIfcSubContractResourceTypeEnum )

export { IfcSubContractResourceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSubContractResourceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSubContractResourceTypeEnum | undefined {
  return parser.extract< IfcSubContractResourceTypeEnum >( IfcSubContractResourceTypeEnumSearch, input, cursor, endCursor )
}
