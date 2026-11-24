/* This is generated code, don't alter */
enum IfcElectricMotorTypeEnum {
  DC = 0,
  INDUCTION = 1,
  POLYPHASE = 2,
  RELUCTANCESYNCHRONOUS = 3,
  SYNCHRONOUS = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcElectricMotorTypeEnumCount = 7

export { IfcElectricMotorTypeEnum, IfcElectricMotorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricMotorTypeEnum =
  new Int32Array( [57] )

let prefixSumAddressIfcElectricMotorTypeEnum =
  new Uint32Array( [0,12,25,38,61,72,83,87] )

let slotMapIfcElectricMotorTypeEnum =
  new Int32Array( [6,5,4,3,1,2,0] )

let encodedDataIfcElectricMotorTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..USERDEFINED..SYNCHRONOUS..RELUCTANCESYNCHRONOUS..INDUCTION..POLYPHASE..DC." )

let IfcElectricMotorTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricMotorTypeEnum >( gMapIfcElectricMotorTypeEnum, prefixSumAddressIfcElectricMotorTypeEnum, slotMapIfcElectricMotorTypeEnum, encodedDataIfcElectricMotorTypeEnum )

export { IfcElectricMotorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricMotorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricMotorTypeEnum | undefined {
  return parser.extract< IfcElectricMotorTypeEnum >( IfcElectricMotorTypeEnumSearch, input, cursor, endCursor )
}
