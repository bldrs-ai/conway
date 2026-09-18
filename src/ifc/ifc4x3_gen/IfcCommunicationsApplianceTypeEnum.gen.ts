/* This is generated code, don't alter */
enum IfcCommunicationsApplianceTypeEnum {
  ANTENNA = 0,
  AUTOMATON = 1,
  COMPUTER = 2,
  FAX = 3,
  GATEWAY = 4,
  INTELLIGENTPERIPHERAL = 5,
  IPNETWORKEQUIPMENT = 6,
  LINESIDEELECTRONICUNIT = 7,
  MODEM = 8,
  NETWORKAPPLIANCE = 9,
  NETWORKBRIDGE = 10,
  NETWORKHUB = 11,
  OPTICALLINETERMINAL = 12,
  OPTICALNETWORKUNIT = 13,
  PRINTER = 14,
  RADIOBLOCKCENTER = 15,
  REPEATER = 16,
  ROUTER = 17,
  SCANNER = 18,
  TELECOMMAND = 19,
  TELEPHONYEXCHANGE = 20,
  TRANSITIONCOMPONENT = 21,
  TRANSPONDER = 22,
  TRANSPORTEQUIPMENT = 23,
  USERDEFINED = 24,
  NOTDEFINED = 25,
}

const IfcCommunicationsApplianceTypeEnumCount = 26

export { IfcCommunicationsApplianceTypeEnum, IfcCommunicationsApplianceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCommunicationsApplianceTypeEnum =
  new Int32Array( [11,713,2,18,1093,34] )

let prefixSumAddressIfcCommunicationsApplianceTypeEnum =
  new Uint32Array( [0,9,24,48,66,74,95,107,112,130,140,149,168,188,197,217,227,247,270,283,292,305,326,339,346,357,369] )

let slotMapIfcCommunicationsApplianceTypeEnum =
  new Int32Array( [0,10,7,15,17,12,25,3,9,16,4,20,6,14,13,2,23,5,19,18,22,21,24,8,1,11] )

let encodedDataIfcCommunicationsApplianceTypeEnum =
  (new TextEncoder()).encode( ".ANTENNA..NETWORKBRIDGE..LINESIDEELECTRONICUNIT..RADIOBLOCKCENTER..ROUTER..OPTICALLINETERMINAL..NOTDEFINED..FAX..NETWORKAPPLIANCE..REPEATER..GATEWAY..TELEPHONYEXCHANGE..IPNETWORKEQUIPMENT..PRINTER..OPTICALNETWORKUNIT..COMPUTER..TRANSPORTEQUIPMENT..INTELLIGENTPERIPHERAL..TELECOMMAND..SCANNER..TRANSPONDER..TRANSITIONCOMPONENT..USERDEFINED..MODEM..AUTOMATON..NETWORKHUB." )

let IfcCommunicationsApplianceTypeEnumSearch =
  new MinimalPerfectHash< IfcCommunicationsApplianceTypeEnum >( gMapIfcCommunicationsApplianceTypeEnum, prefixSumAddressIfcCommunicationsApplianceTypeEnum, slotMapIfcCommunicationsApplianceTypeEnum, encodedDataIfcCommunicationsApplianceTypeEnum )

export { IfcCommunicationsApplianceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCommunicationsApplianceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCommunicationsApplianceTypeEnum | undefined {
  return parser.extract< IfcCommunicationsApplianceTypeEnum >( IfcCommunicationsApplianceTypeEnumSearch, input, cursor, endCursor )
}
