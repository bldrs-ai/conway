/* This is generated code, don't alter */
enum IfcAlignmentCantSegmentTypeEnum {
  BLOSSCURVE = 0,
  CONSTANTCANT = 1,
  COSINECURVE = 2,
  HELMERTCURVE = 3,
  LINEARTRANSITION = 4,
  SINECURVE = 5,
  VIENNESEBEND = 6,
}

const IfcAlignmentCantSegmentTypeEnumCount = 7

export { IfcAlignmentCantSegmentTypeEnum, IfcAlignmentCantSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAlignmentCantSegmentTypeEnum =
  new Int32Array( [308] )

let prefixSumAddressIfcAlignmentCantSegmentTypeEnum =
  new Uint32Array( [0,11,25,43,55,69,83,96] )

let slotMapIfcAlignmentCantSegmentTypeEnum =
  new Int32Array( [5,1,4,0,6,3,2] )

let encodedDataIfcAlignmentCantSegmentTypeEnum =
  (new TextEncoder()).encode( ".SINECURVE..CONSTANTCANT..LINEARTRANSITION..BLOSSCURVE..VIENNESEBEND..HELMERTCURVE..COSINECURVE." )

let IfcAlignmentCantSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcAlignmentCantSegmentTypeEnum >( gMapIfcAlignmentCantSegmentTypeEnum, prefixSumAddressIfcAlignmentCantSegmentTypeEnum, slotMapIfcAlignmentCantSegmentTypeEnum, encodedDataIfcAlignmentCantSegmentTypeEnum )

export { IfcAlignmentCantSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAlignmentCantSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAlignmentCantSegmentTypeEnum | undefined {
  return parser.extract< IfcAlignmentCantSegmentTypeEnum >( IfcAlignmentCantSegmentTypeEnumSearch, input, cursor, endCursor )
}
