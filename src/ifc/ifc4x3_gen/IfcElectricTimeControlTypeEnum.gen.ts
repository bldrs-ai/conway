/* This is generated code, don't alter */
enum IfcElectricTimeControlTypeEnum {
  RELAY = 0,
  TIMECLOCK = 1,
  TIMEDELAY = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcElectricTimeControlTypeEnumCount = 5

export { IfcElectricTimeControlTypeEnum, IfcElectricTimeControlTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricTimeControlTypeEnum =
  new Int32Array( [28] )

let prefixSumAddressIfcElectricTimeControlTypeEnum =
  new Uint32Array( [0,7,20,31,42,54] )

let slotMapIfcElectricTimeControlTypeEnum =
  new Int32Array( [0,3,1,2,4] )

let encodedDataIfcElectricTimeControlTypeEnum =
  (new TextEncoder()).encode( ".RELAY..USERDEFINED..TIMECLOCK..TIMEDELAY..NOTDEFINED." )

let IfcElectricTimeControlTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricTimeControlTypeEnum >( gMapIfcElectricTimeControlTypeEnum, prefixSumAddressIfcElectricTimeControlTypeEnum, slotMapIfcElectricTimeControlTypeEnum, encodedDataIfcElectricTimeControlTypeEnum )

export { IfcElectricTimeControlTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricTimeControlTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricTimeControlTypeEnum | undefined {
  return parser.extract< IfcElectricTimeControlTypeEnum >( IfcElectricTimeControlTypeEnumSearch, input, cursor, endCursor )
}
