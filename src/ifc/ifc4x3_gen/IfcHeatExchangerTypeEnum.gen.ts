/* This is generated code, don't alter */
enum IfcHeatExchangerTypeEnum {
  PLATE = 0,
  SHELLANDTUBE = 1,
  TURNOUTHEATING = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcHeatExchangerTypeEnumCount = 5

export { IfcHeatExchangerTypeEnum, IfcHeatExchangerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcHeatExchangerTypeEnum =
  new Int32Array( [63] )

let prefixSumAddressIfcHeatExchangerTypeEnum =
  new Uint32Array( [0,12,19,32,46,62] )

let slotMapIfcHeatExchangerTypeEnum =
  new Int32Array( [4,0,3,1,2] )

let encodedDataIfcHeatExchangerTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..PLATE..USERDEFINED..SHELLANDTUBE..TURNOUTHEATING." )

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
