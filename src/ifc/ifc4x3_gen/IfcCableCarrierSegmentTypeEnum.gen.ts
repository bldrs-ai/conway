/* This is generated code, don't alter */
enum IfcCableCarrierSegmentTypeEnum {
  CABLEBRACKET = 0,
  CABLELADDERSEGMENT = 1,
  CABLETRAYSEGMENT = 2,
  CABLETRUNKINGSEGMENT = 3,
  CATENARYWIRE = 4,
  CONDUITSEGMENT = 5,
  DROPPER = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcCableCarrierSegmentTypeEnumCount = 9

export { IfcCableCarrierSegmentTypeEnum, IfcCableCarrierSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCableCarrierSegmentTypeEnum =
  new Int32Array( [2,7,407] )

let prefixSumAddressIfcCableCarrierSegmentTypeEnum =
  new Uint32Array( [0,16,25,37,57,71,85,107,125,138] )

let slotMapIfcCableCarrierSegmentTypeEnum =
  new Int32Array( [5,6,8,1,0,4,3,2,7] )

let encodedDataIfcCableCarrierSegmentTypeEnum =
  (new TextEncoder()).encode( ".CONDUITSEGMENT..DROPPER..NOTDEFINED..CABLELADDERSEGMENT..CABLEBRACKET..CATENARYWIRE..CABLETRUNKINGSEGMENT..CABLETRAYSEGMENT..USERDEFINED." )

let IfcCableCarrierSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcCableCarrierSegmentTypeEnum >( gMapIfcCableCarrierSegmentTypeEnum, prefixSumAddressIfcCableCarrierSegmentTypeEnum, slotMapIfcCableCarrierSegmentTypeEnum, encodedDataIfcCableCarrierSegmentTypeEnum )

export { IfcCableCarrierSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCableCarrierSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCableCarrierSegmentTypeEnum | undefined {
  return parser.extract< IfcCableCarrierSegmentTypeEnum >( IfcCableCarrierSegmentTypeEnumSearch, input, cursor, endCursor )
}
