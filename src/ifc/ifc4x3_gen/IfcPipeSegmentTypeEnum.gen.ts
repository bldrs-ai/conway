/* This is generated code, don't alter */
enum IfcPipeSegmentTypeEnum {
  CULVERT = 0,
  FLEXIBLESEGMENT = 1,
  GUTTER = 2,
  RIGIDSEGMENT = 3,
  SPOOL = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcPipeSegmentTypeEnumCount = 7

export { IfcPipeSegmentTypeEnum, IfcPipeSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPipeSegmentTypeEnum =
  new Int32Array( [293] )

let prefixSumAddressIfcPipeSegmentTypeEnum =
  new Uint32Array( [0,17,26,33,41,53,67,80] )

let slotMapIfcPipeSegmentTypeEnum =
  new Int32Array( [1,0,4,2,6,3,5] )

let encodedDataIfcPipeSegmentTypeEnum =
  (new TextEncoder()).encode( ".FLEXIBLESEGMENT..CULVERT..SPOOL..GUTTER..NOTDEFINED..RIGIDSEGMENT..USERDEFINED." )

let IfcPipeSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcPipeSegmentTypeEnum >( gMapIfcPipeSegmentTypeEnum, prefixSumAddressIfcPipeSegmentTypeEnum, slotMapIfcPipeSegmentTypeEnum, encodedDataIfcPipeSegmentTypeEnum )

export { IfcPipeSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPipeSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPipeSegmentTypeEnum | undefined {
  return parser.extract< IfcPipeSegmentTypeEnum >( IfcPipeSegmentTypeEnumSearch, input, cursor, endCursor )
}
