/* This is generated code, don't alter */
enum IfcPumpTypeEnum {
  CIRCULATOR = 0,
  ENDSUCTION = 1,
  SPLITCASE = 2,
  SUBMERSIBLEPUMP = 3,
  SUMPPUMP = 4,
  VERTICALINLINE = 5,
  VERTICALTURBINE = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcPumpTypeEnumCount = 9

export { IfcPumpTypeEnum, IfcPumpTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPumpTypeEnum =
  new Int32Array( [1,-7,53] )

let prefixSumAddressIfcPumpTypeEnum =
  new Uint32Array( [0,12,22,39,50,67,83,96,108,120] )

let slotMapIfcPumpTypeEnum =
  new Int32Array( [1,4,6,2,3,5,7,0,8] )

let encodedDataIfcPumpTypeEnum =
  (new TextEncoder()).encode( ".ENDSUCTION..SUMPPUMP..VERTICALTURBINE..SPLITCASE..SUBMERSIBLEPUMP..VERTICALINLINE..USERDEFINED..CIRCULATOR..NOTDEFINED." )

let IfcPumpTypeEnumSearch =
  new MinimalPerfectHash< IfcPumpTypeEnum >( gMapIfcPumpTypeEnum, prefixSumAddressIfcPumpTypeEnum, slotMapIfcPumpTypeEnum, encodedDataIfcPumpTypeEnum )

export { IfcPumpTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPumpTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPumpTypeEnum | undefined {
  return parser.extract< IfcPumpTypeEnum >( IfcPumpTypeEnumSearch, input, cursor, endCursor )
}
