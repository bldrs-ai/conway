/* This is generated code, don't alter */
enum IfcEvaporativeCoolerTypeEnum {
  DIRECTEVAPORATIVEAIRWASHER = 0,
  DIRECTEVAPORATIVEPACKAGEDROTARYAIRCOOLER = 1,
  DIRECTEVAPORATIVERANDOMMEDIAAIRCOOLER = 2,
  DIRECTEVAPORATIVERIGIDMEDIAAIRCOOLER = 3,
  DIRECTEVAPORATIVESLINGERSPACKAGEDAIRCOOLER = 4,
  INDIRECTDIRECTCOMBINATION = 5,
  INDIRECTEVAPORATIVECOOLINGTOWERORCOILCOOLER = 6,
  INDIRECTEVAPORATIVEPACKAGEAIRCOOLER = 7,
  INDIRECTEVAPORATIVEWETCOIL = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcEvaporativeCoolerTypeEnumCount = 11

export { IfcEvaporativeCoolerTypeEnum, IfcEvaporativeCoolerTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcEvaporativeCoolerTypeEnum =
  new Int32Array( [3,32,26] )

let prefixSumAddressIfcEvaporativeCoolerTypeEnum =
  new Uint32Array( [0,28,41,53,95,132,160,187,225,264,309,353] )

let slotMapIfcEvaporativeCoolerTypeEnum =
  new Int32Array( [0,9,10,1,7,8,5,3,2,6,4] )

let encodedDataIfcEvaporativeCoolerTypeEnum =
  (new TextEncoder()).encode( ".DIRECTEVAPORATIVEAIRWASHER..USERDEFINED..NOTDEFINED..DIRECTEVAPORATIVEPACKAGEDROTARYAIRCOOLER..INDIRECTEVAPORATIVEPACKAGEAIRCOOLER..INDIRECTEVAPORATIVEWETCOIL..INDIRECTDIRECTCOMBINATION..DIRECTEVAPORATIVERIGIDMEDIAAIRCOOLER..DIRECTEVAPORATIVERANDOMMEDIAAIRCOOLER..INDIRECTEVAPORATIVECOOLINGTOWERORCOILCOOLER..DIRECTEVAPORATIVESLINGERSPACKAGEDAIRCOOLER." )

let IfcEvaporativeCoolerTypeEnumSearch =
  new MinimalPerfectHash< IfcEvaporativeCoolerTypeEnum >( gMapIfcEvaporativeCoolerTypeEnum, prefixSumAddressIfcEvaporativeCoolerTypeEnum, slotMapIfcEvaporativeCoolerTypeEnum, encodedDataIfcEvaporativeCoolerTypeEnum )

export { IfcEvaporativeCoolerTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcEvaporativeCoolerTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcEvaporativeCoolerTypeEnum | undefined {
  return parser.extract< IfcEvaporativeCoolerTypeEnum >( IfcEvaporativeCoolerTypeEnumSearch, input, cursor, endCursor )
}
