/* This is generated code, don't alter */
enum IfcMechanicalFastenerTypeEnum {
  ANCHORBOLT = 0,
  BOLT = 1,
  DOWEL = 2,
  NAIL = 3,
  NAILPLATE = 4,
  RIVET = 5,
  SCREW = 6,
  SHEARCONNECTOR = 7,
  STAPLE = 8,
  STUDSHEARCONNECTOR = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcMechanicalFastenerTypeEnumCount = 12

export { IfcMechanicalFastenerTypeEnum, IfcMechanicalFastenerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMechanicalFastenerTypeEnum =
  new Int32Array( [60,46,8] )

let prefixSumAddressIfcMechanicalFastenerTypeEnum =
  new Uint32Array( [0,13,24,32,44,64,71,77,83,99,106,113,125] )

let slotMapIfcMechanicalFastenerTypeEnum =
  new Int32Array( [10,4,8,0,9,5,3,1,7,2,6,11] )

let encodedDataIfcMechanicalFastenerTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NAILPLATE..STAPLE..ANCHORBOLT..STUDSHEARCONNECTOR..RIVET..NAIL..BOLT..SHEARCONNECTOR..DOWEL..SCREW..NOTDEFINED." )

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
