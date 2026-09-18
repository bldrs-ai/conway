/* This is generated code, don't alter */
enum IfcInterceptorTypeEnum {
  CYCLONIC = 0,
  GREASE = 1,
  OIL = 2,
  PETROL = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcInterceptorTypeEnumCount = 6

export { IfcInterceptorTypeEnum, IfcInterceptorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcInterceptorTypeEnum =
  new Int32Array( [12] )

let prefixSumAddressIfcInterceptorTypeEnum =
  new Uint32Array( [0,13,21,26,34,44,56] )

let slotMapIfcInterceptorTypeEnum =
  new Int32Array( [4,1,2,3,0,5] )

let encodedDataIfcInterceptorTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..GREASE..OIL..PETROL..CYCLONIC..NOTDEFINED." )

let IfcInterceptorTypeEnumSearch =
  new MinimalPerfectHash< IfcInterceptorTypeEnum >( gMapIfcInterceptorTypeEnum, prefixSumAddressIfcInterceptorTypeEnum, slotMapIfcInterceptorTypeEnum, encodedDataIfcInterceptorTypeEnum )

export { IfcInterceptorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcInterceptorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcInterceptorTypeEnum | undefined {
  return parser.extract< IfcInterceptorTypeEnum >( IfcInterceptorTypeEnumSearch, input, cursor, endCursor )
}
