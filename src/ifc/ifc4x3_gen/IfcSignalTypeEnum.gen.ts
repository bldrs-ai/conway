/* This is generated code, don't alter */
enum IfcSignalTypeEnum {
  AUDIO = 0,
  MIXED = 1,
  VISUAL = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcSignalTypeEnumCount = 5

export { IfcSignalTypeEnum, IfcSignalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSignalTypeEnum =
  new Int32Array( [32] )

let prefixSumAddressIfcSignalTypeEnum =
  new Uint32Array( [0,12,25,32,40,47] )

let slotMapIfcSignalTypeEnum =
  new Int32Array( [4,3,1,2,0] )

let encodedDataIfcSignalTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..USERDEFINED..MIXED..VISUAL..AUDIO." )

let IfcSignalTypeEnumSearch =
  new MinimalPerfectHash< IfcSignalTypeEnum >( gMapIfcSignalTypeEnum, prefixSumAddressIfcSignalTypeEnum, slotMapIfcSignalTypeEnum, encodedDataIfcSignalTypeEnum )

export { IfcSignalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSignalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSignalTypeEnum | undefined {
  return parser.extract< IfcSignalTypeEnum >( IfcSignalTypeEnumSearch, input, cursor, endCursor )
}
