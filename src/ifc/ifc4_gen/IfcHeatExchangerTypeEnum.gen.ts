/* This is generated code, don't alter */
enum IfcHeatExchangerTypeEnum {
  PLATE = 0,
  SHELLANDTUBE = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcHeatExchangerTypeEnumCount = 4

export { IfcHeatExchangerTypeEnum, IfcHeatExchangerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcHeatExchangerTypeEnum =
  new Int32Array( [11] )

let prefixSumAddressIfcHeatExchangerTypeEnum =
  new Uint32Array( [0,14,27,34,46] )

let slotMapIfcHeatExchangerTypeEnum =
  new Int32Array( [1,2,0,3] )

let encodedDataIfcHeatExchangerTypeEnum =
  (new TextEncoder()).encode( ".SHELLANDTUBE..USERDEFINED..PLATE..NOTDEFINED." )

let IfcHeatExchangerTypeEnumSearch =
  new MinimalPerfectHash< IfcHeatExchangerTypeEnum >( gMapIfcHeatExchangerTypeEnum, prefixSumAddressIfcHeatExchangerTypeEnum, slotMapIfcHeatExchangerTypeEnum, encodedDataIfcHeatExchangerTypeEnum )

export { IfcHeatExchangerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcHeatExchangerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcHeatExchangerTypeEnum | undefined {
  return parser.extract< IfcHeatExchangerTypeEnum >( IfcHeatExchangerTypeEnumSearch, input, cursor, endCursor )
}
