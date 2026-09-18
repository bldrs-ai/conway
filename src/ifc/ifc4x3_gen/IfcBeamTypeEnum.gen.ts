/* This is generated code, don't alter */
enum IfcBeamTypeEnum {
  BEAM = 0,
  CORNICE = 1,
  DIAPHRAGM = 2,
  EDGEBEAM = 3,
  GIRDER_SEGMENT = 4,
  HATSTONE = 5,
  HOLLOWCORE = 6,
  JOIST = 7,
  LINTEL = 8,
  PIERCAP = 9,
  SPANDREL = 10,
  T_BEAM = 11,
  USERDEFINED = 12,
  NOTDEFINED = 13,
}

const IfcBeamTypeEnumCount = 14

export { IfcBeamTypeEnum, IfcBeamTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBeamTypeEnum =
  new Int32Array( [20,22,-6,4] )

let prefixSumAddressIfcBeamTypeEnum =
  new Uint32Array( [0,12,19,28,38,46,58,69,77,93,102,112,118,131,141] )

let slotMapIfcBeamTypeEnum =
  new Int32Array( [13,7,1,10,11,6,2,8,4,9,3,0,12,5] )

let encodedDataIfcBeamTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..JOIST..CORNICE..SPANDREL..T_BEAM..HOLLOWCORE..DIAPHRAGM..LINTEL..GIRDER_SEGMENT..PIERCAP..EDGEBEAM..BEAM..USERDEFINED..HATSTONE." )

let IfcBeamTypeEnumSearch =
  new MinimalPerfectHash< IfcBeamTypeEnum >( gMapIfcBeamTypeEnum, prefixSumAddressIfcBeamTypeEnum, slotMapIfcBeamTypeEnum, encodedDataIfcBeamTypeEnum )

export { IfcBeamTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBeamTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBeamTypeEnum | undefined {
  return parser.extract< IfcBeamTypeEnum >( IfcBeamTypeEnumSearch, input, cursor, endCursor )
}
