/* This is generated code, don't alter */
enum IfcVibrationIsolatorTypeEnum {
  BASE = 0,
  COMPRESSION = 1,
  SPRING = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcVibrationIsolatorTypeEnumCount = 5

export { IfcVibrationIsolatorTypeEnum, IfcVibrationIsolatorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcVibrationIsolatorTypeEnum =
  new Int32Array( [11] )

let prefixSumAddressIfcVibrationIsolatorTypeEnum =
  new Uint32Array( [0,13,25,38,44,52] )

let slotMapIfcVibrationIsolatorTypeEnum =
  new Int32Array( [1,4,3,0,2] )

let encodedDataIfcVibrationIsolatorTypeEnum =
  (new TextEncoder()).encode( ".COMPRESSION..NOTDEFINED..USERDEFINED..BASE..SPRING." )

let IfcVibrationIsolatorTypeEnumSearch =
  new MinimalPerfectHash< IfcVibrationIsolatorTypeEnum >( gMapIfcVibrationIsolatorTypeEnum, prefixSumAddressIfcVibrationIsolatorTypeEnum, slotMapIfcVibrationIsolatorTypeEnum, encodedDataIfcVibrationIsolatorTypeEnum )

export { IfcVibrationIsolatorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcVibrationIsolatorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcVibrationIsolatorTypeEnum | undefined {
  return parser.extract< IfcVibrationIsolatorTypeEnum >( IfcVibrationIsolatorTypeEnumSearch, input, cursor, endCursor )
}
