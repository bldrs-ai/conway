/* This is generated code, don't alter */
enum IfcTransformerTypeEnum {
  CHOPPER = 0,
  COMBINED = 1,
  CURRENT = 2,
  FREQUENCY = 3,
  INVERTER = 4,
  RECTIFIER = 5,
  VOLTAGE = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcTransformerTypeEnumCount = 9

export { IfcTransformerTypeEnum, IfcTransformerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTransformerTypeEnum =
  new Int32Array( [4,102,4] )

let prefixSumAddressIfcTransformerTypeEnum =
  new Uint32Array( [0,9,20,29,39,49,58,70,81,94] )

let slotMapIfcTransformerTypeEnum =
  new Int32Array( [0,3,6,4,1,2,8,5,7] )

let encodedDataIfcTransformerTypeEnum =
  (new TextEncoder()).encode( ".CHOPPER..FREQUENCY..VOLTAGE..INVERTER..COMBINED..CURRENT..NOTDEFINED..RECTIFIER..USERDEFINED." )

let IfcTransformerTypeEnumSearch =
  new MinimalPerfectHash< IfcTransformerTypeEnum >( gMapIfcTransformerTypeEnum, prefixSumAddressIfcTransformerTypeEnum, slotMapIfcTransformerTypeEnum, encodedDataIfcTransformerTypeEnum )

export { IfcTransformerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTransformerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTransformerTypeEnum | undefined {
  return parser.extract< IfcTransformerTypeEnum >( IfcTransformerTypeEnumSearch, input, cursor, endCursor )
}
