/* This is generated code, don't alter */
enum IfcVibrationDamperTypeEnum {
  AXIAL_YIELD = 0,
  BENDING_YIELD = 1,
  FRICTION = 2,
  RUBBER = 3,
  SHEAR_YIELD = 4,
  VISCOUS = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcVibrationDamperTypeEnumCount = 8

export { IfcVibrationDamperTypeEnum, IfcVibrationDamperTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcVibrationDamperTypeEnum =
  new Int32Array( [2,5,16] )

let prefixSumAddressIfcVibrationDamperTypeEnum =
  new Uint32Array( [0,9,19,32,47,59,67,80,93] )

let slotMapIfcVibrationDamperTypeEnum =
  new Int32Array( [5,2,4,1,7,3,0,6] )

let encodedDataIfcVibrationDamperTypeEnum =
  (new TextEncoder()).encode( ".VISCOUS..FRICTION..SHEAR_YIELD..BENDING_YIELD..NOTDEFINED..RUBBER..AXIAL_YIELD..USERDEFINED." )

let IfcVibrationDamperTypeEnumSearch =
  new MinimalPerfectHash< IfcVibrationDamperTypeEnum >( gMapIfcVibrationDamperTypeEnum, prefixSumAddressIfcVibrationDamperTypeEnum, slotMapIfcVibrationDamperTypeEnum, encodedDataIfcVibrationDamperTypeEnum )

export { IfcVibrationDamperTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcVibrationDamperTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcVibrationDamperTypeEnum | undefined {
  return parser.extract< IfcVibrationDamperTypeEnum >( IfcVibrationDamperTypeEnumSearch, input, cursor, endCursor )
}
