/* This is generated code, don't alter */
enum IfcAlignmentTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcAlignmentTypeEnumCount = 2

export { IfcAlignmentTypeEnum, IfcAlignmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAlignmentTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcAlignmentTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcAlignmentTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcAlignmentTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcAlignmentTypeEnumSearch =
  new MinimalPerfectHash< IfcAlignmentTypeEnum >( gMapIfcAlignmentTypeEnum, prefixSumAddressIfcAlignmentTypeEnum, slotMapIfcAlignmentTypeEnum, encodedDataIfcAlignmentTypeEnum )

export { IfcAlignmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAlignmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAlignmentTypeEnum | undefined {
  return parser.extract< IfcAlignmentTypeEnum >( IfcAlignmentTypeEnumSearch, input, cursor, endCursor )
}
