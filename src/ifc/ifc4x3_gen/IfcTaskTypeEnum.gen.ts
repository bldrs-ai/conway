/* This is generated code, don't alter */
enum IfcTaskTypeEnum {
  ADJUSTMENT = 0,
  ATTENDANCE = 1,
  CALIBRATION = 2,
  CONSTRUCTION = 3,
  DEMOLITION = 4,
  DISMANTLE = 5,
  DISPOSAL = 6,
  EMERGENCY = 7,
  INSPECTION = 8,
  INSTALLATION = 9,
  LOGISTIC = 10,
  MAINTENANCE = 11,
  MOVE = 12,
  OPERATION = 13,
  REMOVAL = 14,
  RENOVATION = 15,
  SAFETY = 16,
  SHUTDOWN = 17,
  STARTUP = 18,
  TESTING = 19,
  TROUBLESHOOTING = 20,
  USERDEFINED = 21,
  NOTDEFINED = 22,
}

const IfcTaskTypeEnumCount = 23

export { IfcTaskTypeEnum, IfcTaskTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTaskTypeEnum =
  new Int32Array( [411,1,5,7,106,342] )

let prefixSumAddressIfcTaskTypeEnum =
  new Uint32Array( [0,10,27,40,50,58,70,83,92,101,107,119,133,145,154,167,179,191,201,215,226,238,249,260] )

let slotMapIfcTaskTypeEnum =
  new Int32Array( [17,20,11,10,16,22,21,14,18,12,4,9,1,19,2,15,0,6,3,13,8,7,5] )

let encodedDataIfcTaskTypeEnum =
  (new TextEncoder()).encode( ".SHUTDOWN..TROUBLESHOOTING..MAINTENANCE..LOGISTIC..SAFETY..NOTDEFINED..USERDEFINED..REMOVAL..STARTUP..MOVE..DEMOLITION..INSTALLATION..ATTENDANCE..TESTING..CALIBRATION..RENOVATION..ADJUSTMENT..DISPOSAL..CONSTRUCTION..OPERATION..INSPECTION..EMERGENCY..DISMANTLE." )

let IfcTaskTypeEnumSearch =
  new MinimalPerfectHash< IfcTaskTypeEnum >( gMapIfcTaskTypeEnum, prefixSumAddressIfcTaskTypeEnum, slotMapIfcTaskTypeEnum, encodedDataIfcTaskTypeEnum )

export { IfcTaskTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTaskTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTaskTypeEnum | undefined {
  return parser.extract< IfcTaskTypeEnum >( IfcTaskTypeEnumSearch, input, cursor, endCursor )
}
