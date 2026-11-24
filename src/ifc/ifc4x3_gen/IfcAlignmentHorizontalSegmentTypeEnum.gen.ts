/* This is generated code, don't alter */
enum IfcAlignmentHorizontalSegmentTypeEnum {
  BLOSSCURVE = 0,
  CIRCULARARC = 1,
  CLOTHOID = 2,
  COSINECURVE = 3,
  CUBIC = 4,
  HELMERTCURVE = 5,
  LINE = 6,
  SINECURVE = 7,
  VIENNESEBEND = 8,
}

const IfcAlignmentHorizontalSegmentTypeEnumCount = 9

export { IfcAlignmentHorizontalSegmentTypeEnum, IfcAlignmentHorizontalSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAlignmentHorizontalSegmentTypeEnum =
  new Int32Array( [299,0,17] )

let prefixSumAddressIfcAlignmentHorizontalSegmentTypeEnum =
  new Uint32Array( [0,7,17,30,42,48,59,73,86,100] )

let slotMapIfcAlignmentHorizontalSegmentTypeEnum =
  new Int32Array( [4,2,1,0,6,7,5,3,8] )

let encodedDataIfcAlignmentHorizontalSegmentTypeEnum =
  (new TextEncoder()).encode( ".CUBIC..CLOTHOID..CIRCULARARC..BLOSSCURVE..LINE..SINECURVE..HELMERTCURVE..COSINECURVE..VIENNESEBEND." )

let IfcAlignmentHorizontalSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcAlignmentHorizontalSegmentTypeEnum >( gMapIfcAlignmentHorizontalSegmentTypeEnum, prefixSumAddressIfcAlignmentHorizontalSegmentTypeEnum, slotMapIfcAlignmentHorizontalSegmentTypeEnum, encodedDataIfcAlignmentHorizontalSegmentTypeEnum )

export { IfcAlignmentHorizontalSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAlignmentHorizontalSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAlignmentHorizontalSegmentTypeEnum | undefined {
  return parser.extract< IfcAlignmentHorizontalSegmentTypeEnum >( IfcAlignmentHorizontalSegmentTypeEnumSearch, input, cursor, endCursor )
}
