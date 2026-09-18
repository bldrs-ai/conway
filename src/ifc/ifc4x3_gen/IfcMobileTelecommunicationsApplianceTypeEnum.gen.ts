/* This is generated code, don't alter */
enum IfcMobileTelecommunicationsApplianceTypeEnum {
  ACCESSPOINT = 0,
  BASEBANDUNIT = 1,
  BASETRANSCEIVERSTATION = 2,
  E_UTRAN_NODE_B = 3,
  GATEWAY_GPRS_SUPPORT_NODE = 4,
  MASTERUNIT = 5,
  MOBILESWITCHINGCENTER = 6,
  MSCSERVER = 7,
  PACKETCONTROLUNIT = 8,
  REMOTERADIOUNIT = 9,
  REMOTEUNIT = 10,
  SERVICE_GPRS_SUPPORT_NODE = 11,
  SUBSCRIBERSERVER = 12,
  USERDEFINED = 13,
  NOTDEFINED = 14,
}

const IfcMobileTelecommunicationsApplianceTypeEnumCount = 15

export { IfcMobileTelecommunicationsApplianceTypeEnum, IfcMobileTelecommunicationsApplianceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcMobileTelecommunicationsApplianceTypeEnum =
  new Int32Array( [69,6,47,2] )

let prefixSumAddressIfcMobileTelecommunicationsApplianceTypeEnum =
  new Uint32Array( [0,23,36,55,67,79,96,123,134,152,166,193,209,233,245,258] )

let slotMapIfcMobileTelecommunicationsApplianceTypeEnum =
  new Int32Array( [6,0,8,10,14,9,4,7,12,1,11,3,2,5,13] )

let encodedDataIfcMobileTelecommunicationsApplianceTypeEnum =
  (new TextEncoder()).encode( ".MOBILESWITCHINGCENTER..ACCESSPOINT..PACKETCONTROLUNIT..REMOTEUNIT..NOTDEFINED..REMOTERADIOUNIT..GATEWAY_GPRS_SUPPORT_NODE..MSCSERVER..SUBSCRIBERSERVER..BASEBANDUNIT..SERVICE_GPRS_SUPPORT_NODE..E_UTRAN_NODE_B..BASETRANSCEIVERSTATION..MASTERUNIT..USERDEFINED." )

let IfcMobileTelecommunicationsApplianceTypeEnumSearch =
  new MinimalPerfectHash< IfcMobileTelecommunicationsApplianceTypeEnum >( gMapIfcMobileTelecommunicationsApplianceTypeEnum, prefixSumAddressIfcMobileTelecommunicationsApplianceTypeEnum, slotMapIfcMobileTelecommunicationsApplianceTypeEnum, encodedDataIfcMobileTelecommunicationsApplianceTypeEnum )

export { IfcMobileTelecommunicationsApplianceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcMobileTelecommunicationsApplianceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcMobileTelecommunicationsApplianceTypeEnum | undefined {
  return parser.extract< IfcMobileTelecommunicationsApplianceTypeEnum >( IfcMobileTelecommunicationsApplianceTypeEnumSearch, input, cursor, endCursor )
}
