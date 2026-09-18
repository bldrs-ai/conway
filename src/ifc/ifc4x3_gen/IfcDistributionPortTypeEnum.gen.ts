/* This is generated code, don't alter */
enum IfcDistributionPortTypeEnum {
  CABLE = 0,
  CABLECARRIER = 1,
  DUCT = 2,
  PIPE = 3,
  WIRELESS = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcDistributionPortTypeEnumCount = 7

export { IfcDistributionPortTypeEnum, IfcDistributionPortTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDistributionPortTypeEnum =
  new Int32Array( [92] )

let prefixSumAddressIfcDistributionPortTypeEnum =
  new Uint32Array( [0,10,16,30,43,49,61,68] )

let slotMapIfcDistributionPortTypeEnum =
  new Int32Array( [4,3,1,5,2,6,0] )

let encodedDataIfcDistributionPortTypeEnum =
  (new TextEncoder()).encode( ".WIRELESS..PIPE..CABLECARRIER..USERDEFINED..DUCT..NOTDEFINED..CABLE." )

let IfcDistributionPortTypeEnumSearch =
  new MinimalPerfectHash< IfcDistributionPortTypeEnum >( gMapIfcDistributionPortTypeEnum, prefixSumAddressIfcDistributionPortTypeEnum, slotMapIfcDistributionPortTypeEnum, encodedDataIfcDistributionPortTypeEnum )

export { IfcDistributionPortTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDistributionPortTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDistributionPortTypeEnum | undefined {
  return parser.extract< IfcDistributionPortTypeEnum >( IfcDistributionPortTypeEnumSearch, input, cursor, endCursor )
}
