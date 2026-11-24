/* This is generated code, don't alter */
enum IfcCableSegmentTypeEnum {
  BUSBARSEGMENT = 0,
  CABLESEGMENT = 1,
  CONDUCTORSEGMENT = 2,
  CONTACTWIRESEGMENT = 3,
  CORESEGMENT = 4,
  FIBERSEGMENT = 5,
  FIBERTUBE = 6,
  OPTICALCABLESEGMENT = 7,
  STITCHWIRE = 8,
  WIREPAIRSEGMENT = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcCableSegmentTypeEnumCount = 12

export { IfcCableSegmentTypeEnum, IfcCableSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCableSegmentTypeEnum =
  new Int32Array( [1,8,1] )

let prefixSumAddressIfcCableSegmentTypeEnum =
  new Uint32Array( [0,20,35,46,60,77,90,103,117,138,150,168,180] )

let slotMapIfcCableSegmentTypeEnum =
  new Int32Array( [3,0,6,1,9,4,10,5,7,8,2,11] )

let encodedDataIfcCableSegmentTypeEnum =
  (new TextEncoder()).encode( ".CONTACTWIRESEGMENT..BUSBARSEGMENT..FIBERTUBE..CABLESEGMENT..WIREPAIRSEGMENT..CORESEGMENT..USERDEFINED..FIBERSEGMENT..OPTICALCABLESEGMENT..STITCHWIRE..CONDUCTORSEGMENT..NOTDEFINED." )

let IfcCableSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcCableSegmentTypeEnum >( gMapIfcCableSegmentTypeEnum, prefixSumAddressIfcCableSegmentTypeEnum, slotMapIfcCableSegmentTypeEnum, encodedDataIfcCableSegmentTypeEnum )

export { IfcCableSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCableSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCableSegmentTypeEnum | undefined {
  return parser.extract< IfcCableSegmentTypeEnum >( IfcCableSegmentTypeEnumSearch, input, cursor, endCursor )
}
