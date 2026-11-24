/* This is generated code, don't alter */
enum IfcElectricDistributionBoardTypeEnum {
  CONSUMERUNIT = 0,
  DISTRIBUTIONBOARD = 1,
  MOTORCONTROLCENTRE = 2,
  SWITCHBOARD = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcElectricDistributionBoardTypeEnumCount = 6

export { IfcElectricDistributionBoardTypeEnum, IfcElectricDistributionBoardTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricDistributionBoardTypeEnum =
  new Int32Array( [49] )

let prefixSumAddressIfcElectricDistributionBoardTypeEnum =
  new Uint32Array( [0,14,27,39,58,78,91] )

let slotMapIfcElectricDistributionBoardTypeEnum =
  new Int32Array( [0,4,5,1,2,3] )

let encodedDataIfcElectricDistributionBoardTypeEnum =
  (new TextEncoder()).encode( ".CONSUMERUNIT..USERDEFINED..NOTDEFINED..DISTRIBUTIONBOARD..MOTORCONTROLCENTRE..SWITCHBOARD." )

let IfcElectricDistributionBoardTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricDistributionBoardTypeEnum >( gMapIfcElectricDistributionBoardTypeEnum, prefixSumAddressIfcElectricDistributionBoardTypeEnum, slotMapIfcElectricDistributionBoardTypeEnum, encodedDataIfcElectricDistributionBoardTypeEnum )

export { IfcElectricDistributionBoardTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricDistributionBoardTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricDistributionBoardTypeEnum | undefined {
  return parser.extract< IfcElectricDistributionBoardTypeEnum >( IfcElectricDistributionBoardTypeEnumSearch, input, cursor, endCursor )
}
