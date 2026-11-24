/* This is generated code, don't alter */
enum IfcDistributionBoardTypeEnum {
  CONSUMERUNIT = 0,
  DISPATCHINGBOARD = 1,
  DISTRIBUTIONBOARD = 2,
  DISTRIBUTIONFRAME = 3,
  MOTORCONTROLCENTRE = 4,
  SWITCHBOARD = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcDistributionBoardTypeEnumCount = 8

export { IfcDistributionBoardTypeEnum, IfcDistributionBoardTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDistributionBoardTypeEnum =
  new Int32Array( [1,2,23] )

let prefixSumAddressIfcDistributionBoardTypeEnum =
  new Uint32Array( [0,13,32,46,66,78,96,109,128] )

let slotMapIfcDistributionBoardTypeEnum =
  new Int32Array( [5,2,0,4,7,1,6,3] )

let encodedDataIfcDistributionBoardTypeEnum =
  (new TextEncoder()).encode( ".SWITCHBOARD..DISTRIBUTIONBOARD..CONSUMERUNIT..MOTORCONTROLCENTRE..NOTDEFINED..DISPATCHINGBOARD..USERDEFINED..DISTRIBUTIONFRAME." )

let IfcDistributionBoardTypeEnumSearch =
  new MinimalPerfectHash< IfcDistributionBoardTypeEnum >( gMapIfcDistributionBoardTypeEnum, prefixSumAddressIfcDistributionBoardTypeEnum, slotMapIfcDistributionBoardTypeEnum, encodedDataIfcDistributionBoardTypeEnum )

export { IfcDistributionBoardTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDistributionBoardTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDistributionBoardTypeEnum | undefined {
  return parser.extract< IfcDistributionBoardTypeEnum >( IfcDistributionBoardTypeEnumSearch, input, cursor, endCursor )
}
