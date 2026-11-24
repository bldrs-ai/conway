/* This is generated code, don't alter */
enum IfcDuctSegmentTypeEnum {
  FLEXIBLESEGMENT = 0,
  RIGIDSEGMENT = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcDuctSegmentTypeEnumCount = 4

export { IfcDuctSegmentTypeEnum, IfcDuctSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDuctSegmentTypeEnum =
  new Int32Array( [7] )

let prefixSumAddressIfcDuctSegmentTypeEnum =
  new Uint32Array( [0,12,26,43,56] )

let slotMapIfcDuctSegmentTypeEnum =
  new Int32Array( [3,1,0,2] )

let encodedDataIfcDuctSegmentTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..RIGIDSEGMENT..FLEXIBLESEGMENT..USERDEFINED." )

let IfcDuctSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcDuctSegmentTypeEnum >( gMapIfcDuctSegmentTypeEnum, prefixSumAddressIfcDuctSegmentTypeEnum, slotMapIfcDuctSegmentTypeEnum, encodedDataIfcDuctSegmentTypeEnum )

export { IfcDuctSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDuctSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDuctSegmentTypeEnum | undefined {
  return parser.extract< IfcDuctSegmentTypeEnum >( IfcDuctSegmentTypeEnumSearch, input, cursor, endCursor )
}
