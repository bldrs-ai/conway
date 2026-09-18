/* This is generated code, don't alter */
enum IfcVirtualElementTypeEnum {
  BOUNDARY = 0,
  CLEARANCE = 1,
  PROVISIONFORVOID = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcVirtualElementTypeEnumCount = 5

export { IfcVirtualElementTypeEnum, IfcVirtualElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcVirtualElementTypeEnum =
  new Int32Array( [32] )

let prefixSumAddressIfcVirtualElementTypeEnum =
  new Uint32Array( [0,12,25,43,54,64] )

let slotMapIfcVirtualElementTypeEnum =
  new Int32Array( [4,3,2,1,0] )

let encodedDataIfcVirtualElementTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..USERDEFINED..PROVISIONFORVOID..CLEARANCE..BOUNDARY." )

let IfcVirtualElementTypeEnumSearch =
  new MinimalPerfectHash< IfcVirtualElementTypeEnum >( gMapIfcVirtualElementTypeEnum, prefixSumAddressIfcVirtualElementTypeEnum, slotMapIfcVirtualElementTypeEnum, encodedDataIfcVirtualElementTypeEnum )

export { IfcVirtualElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcVirtualElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcVirtualElementTypeEnum | undefined {
  return parser.extract< IfcVirtualElementTypeEnum >( IfcVirtualElementTypeEnumSearch, input, cursor, endCursor )
}
