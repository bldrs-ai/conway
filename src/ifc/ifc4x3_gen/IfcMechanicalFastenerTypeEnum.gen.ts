/* This is generated code, don't alter */
enum IfcMechanicalFastenerTypeEnum {
  ANCHORBOLT = 0,
  BOLT = 1,
  CHAIN = 2,
  COUPLER = 3,
  DOWEL = 4,
  NAIL = 5,
  NAILPLATE = 6,
  RAILFASTENING = 7,
  RAILJOINT = 8,
  RIVET = 9,
  ROPE = 10,
  SCREW = 11,
  SHEARCONNECTOR = 12,
  STAPLE = 13,
  STUDSHEARCONNECTOR = 14,
  USERDEFINED = 15,
  NOTDEFINED = 16,
}

const IfcMechanicalFastenerTypeEnumCount = 17

export { IfcMechanicalFastenerTypeEnum, IfcMechanicalFastenerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMechanicalFastenerTypeEnum =
  new Int32Array( [22,52,62,5] )

let prefixSumAddressIfcMechanicalFastenerTypeEnum =
  new Uint32Array( [0,11,23,39,52,59,66,86,95,103,110,125,131,143,149,160,166,173] )

let slotMapIfcMechanicalFastenerTypeEnum =
  new Int32Array( [8,0,12,15,4,9,14,3,13,2,7,10,16,5,6,1,11] )

let encodedDataIfcMechanicalFastenerTypeEnum =
  (new TextEncoder()).encode( ".RAILJOINT..ANCHORBOLT..SHEARCONNECTOR..USERDEFINED..DOWEL..RIVET..STUDSHEARCONNECTOR..COUPLER..STAPLE..CHAIN..RAILFASTENING..ROPE..NOTDEFINED..NAIL..NAILPLATE..BOLT..SCREW." )

let IfcMechanicalFastenerTypeEnumSearch =
  new MinimalPerfectHash< IfcMechanicalFastenerTypeEnum >( gMapIfcMechanicalFastenerTypeEnum, prefixSumAddressIfcMechanicalFastenerTypeEnum, slotMapIfcMechanicalFastenerTypeEnum, encodedDataIfcMechanicalFastenerTypeEnum )

export { IfcMechanicalFastenerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMechanicalFastenerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMechanicalFastenerTypeEnum | undefined {
  return parser.extract< IfcMechanicalFastenerTypeEnum >( IfcMechanicalFastenerTypeEnumSearch, input, cursor, endCursor )
}
