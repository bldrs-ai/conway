/* This is generated code, don't alter */
enum IfcMotorConnectionTypeEnum {
  BELTDRIVE = 0,
  COUPLING = 1,
  DIRECTDRIVE = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcMotorConnectionTypeEnumCount = 5

export { IfcMotorConnectionTypeEnum, IfcMotorConnectionTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMotorConnectionTypeEnum =
  new Int32Array( [23] )

let prefixSumAddressIfcMotorConnectionTypeEnum =
  new Uint32Array( [0,13,23,35,48,59] )

let slotMapIfcMotorConnectionTypeEnum =
  new Int32Array( [2,1,4,3,0] )

let encodedDataIfcMotorConnectionTypeEnum =
  (new TextEncoder()).encode( ".DIRECTDRIVE..COUPLING..NOTDEFINED..USERDEFINED..BELTDRIVE." )

let IfcMotorConnectionTypeEnumSearch =
  new MinimalPerfectHash< IfcMotorConnectionTypeEnum >( gMapIfcMotorConnectionTypeEnum, prefixSumAddressIfcMotorConnectionTypeEnum, slotMapIfcMotorConnectionTypeEnum, encodedDataIfcMotorConnectionTypeEnum )

export { IfcMotorConnectionTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMotorConnectionTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMotorConnectionTypeEnum | undefined {
  return parser.extract< IfcMotorConnectionTypeEnum >( IfcMotorConnectionTypeEnumSearch, input, cursor, endCursor )
}
