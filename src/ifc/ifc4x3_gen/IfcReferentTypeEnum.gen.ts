/* This is generated code, don't alter */
enum IfcReferentTypeEnum {
  BOUNDARY = 0,
  INTERSECTION = 1,
  KILOPOINT = 2,
  LANDMARK = 3,
  MILEPOINT = 4,
  POSITION = 5,
  REFERENCEMARKER = 6,
  STATION = 7,
  SUPERELEVATIONEVENT = 8,
  WIDTHEVENT = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcReferentTypeEnumCount = 12

export { IfcReferentTypeEnum, IfcReferentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReferentTypeEnum =
  new Int32Array( [2,194,49] )

let prefixSumAddressIfcReferentTypeEnum =
  new Uint32Array( [0,11,28,40,50,60,70,82,91,105,116,137,150] )

let slotMapIfcReferentTypeEnum =
  new Int32Array( [2,6,11,0,3,5,9,7,1,4,8,10] )

let encodedDataIfcReferentTypeEnum =
  (new TextEncoder()).encode( ".KILOPOINT..REFERENCEMARKER..NOTDEFINED..BOUNDARY..LANDMARK..POSITION..WIDTHEVENT..STATION..INTERSECTION..MILEPOINT..SUPERELEVATIONEVENT..USERDEFINED." )

let IfcReferentTypeEnumSearch =
  new MinimalPerfectHash< IfcReferentTypeEnum >( gMapIfcReferentTypeEnum, prefixSumAddressIfcReferentTypeEnum, slotMapIfcReferentTypeEnum, encodedDataIfcReferentTypeEnum )

export { IfcReferentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReferentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReferentTypeEnum | undefined {
  return parser.extract< IfcReferentTypeEnum >( IfcReferentTypeEnumSearch, input, cursor, endCursor )
}
