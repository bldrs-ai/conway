/* This is generated code, don't alter */
enum IfcAlignmentVerticalSegmentTypeEnum {
  CIRCULARARC = 0,
  CLOTHOID = 1,
  CONSTANTGRADIENT = 2,
  PARABOLICARC = 3,
}

const IfcAlignmentVerticalSegmentTypeEnumCount = 4

export { IfcAlignmentVerticalSegmentTypeEnum, IfcAlignmentVerticalSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAlignmentVerticalSegmentTypeEnum =
  new Int32Array( [3] )

let prefixSumAddressIfcAlignmentVerticalSegmentTypeEnum =
  new Uint32Array( [0,18,32,42,55] )

let slotMapIfcAlignmentVerticalSegmentTypeEnum =
  new Int32Array( [2,3,1,0] )

let encodedDataIfcAlignmentVerticalSegmentTypeEnum =
  (new TextEncoder()).encode( ".CONSTANTGRADIENT..PARABOLICARC..CLOTHOID..CIRCULARARC." )

let IfcAlignmentVerticalSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcAlignmentVerticalSegmentTypeEnum >( gMapIfcAlignmentVerticalSegmentTypeEnum, prefixSumAddressIfcAlignmentVerticalSegmentTypeEnum, slotMapIfcAlignmentVerticalSegmentTypeEnum, encodedDataIfcAlignmentVerticalSegmentTypeEnum )

export { IfcAlignmentVerticalSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAlignmentVerticalSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAlignmentVerticalSegmentTypeEnum | undefined {
  return parser.extract< IfcAlignmentVerticalSegmentTypeEnum >( IfcAlignmentVerticalSegmentTypeEnumSearch, input, cursor, endCursor )
}
