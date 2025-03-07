/* This is generated code, don't alter */
enum IfcBeamTypeEnum {
  BEAM = 0,
  JOIST = 1,
  HOLLOWCORE = 2,
  LINTEL = 3,
  SPANDREL = 4,
  T_BEAM = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcBeamTypeEnumCount = 8

export { IfcBeamTypeEnum, IfcBeamTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBeamTypeEnum =
  new Int32Array( [9,0,4] )

let prefixSumAddressIfcBeamTypeEnum =
  new Uint32Array( [0,7,17,29,41,54,62,70,76] )

let slotMapIfcBeamTypeEnum =
  new Int32Array( [1,4,7,2,6,3,5,0] )

let encodedDataIfcBeamTypeEnum =
  (new TextEncoder()).encode( ".JOIST..SPANDREL..NOTDEFINED..HOLLOWCORE..USERDEFINED..LINTEL..T_BEAM..BEAM." )

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
