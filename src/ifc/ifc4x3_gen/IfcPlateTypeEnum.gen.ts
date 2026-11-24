/* This is generated code, don't alter */
enum IfcPlateTypeEnum {
  BASE_PLATE = 0,
  COVER_PLATE = 1,
  CURTAIN_PANEL = 2,
  FLANGE_PLATE = 3,
  GUSSET_PLATE = 4,
  SHEET = 5,
  SPLICE_PLATE = 6,
  STIFFENER_PLATE = 7,
  WEB_PLATE = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcPlateTypeEnumCount = 11

export { IfcPlateTypeEnum, IfcPlateTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPlateTypeEnum =
  new Int32Array( [5,1,508] )

let prefixSumAddressIfcPlateTypeEnum =
  new Uint32Array( [0,14,28,45,58,71,86,98,112,119,131,142] )

let slotMapIfcPlateTypeEnum =
  new Int32Array( [4,6,7,9,1,2,10,3,5,0,8] )

let encodedDataIfcPlateTypeEnum =
  (new TextEncoder()).encode( ".GUSSET_PLATE..SPLICE_PLATE..STIFFENER_PLATE..USERDEFINED..COVER_PLATE..CURTAIN_PANEL..NOTDEFINED..FLANGE_PLATE..SHEET..BASE_PLATE..WEB_PLATE." )

let IfcPlateTypeEnumSearch =
  new MinimalPerfectHash< IfcPlateTypeEnum >( gMapIfcPlateTypeEnum, prefixSumAddressIfcPlateTypeEnum, slotMapIfcPlateTypeEnum, encodedDataIfcPlateTypeEnum )

export { IfcPlateTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPlateTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPlateTypeEnum | undefined {
  return parser.extract< IfcPlateTypeEnum >( IfcPlateTypeEnumSearch, input, cursor, endCursor )
}
