/* This is generated code, don't alter */
enum IfcSanitaryTerminalTypeEnum {
  BATH = 0,
  BIDET = 1,
  CISTERN = 2,
  SANITARYFOUNTAIN = 3,
  SHOWER = 4,
  SINK = 5,
  TOILETPAN = 6,
  URINAL = 7,
  WASHHANDBASIN = 8,
  WCSEAT = 9,
  USERDEFINED = 10,
  NOTDEFINED = 11,
}

const IfcSanitaryTerminalTypeEnumCount = 12

export { IfcSanitaryTerminalTypeEnum, IfcSanitaryTerminalTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSanitaryTerminalTypeEnum =
  new Int32Array( [614,2,7] )

let prefixSumAddressIfcSanitaryTerminalTypeEnum =
  new Uint32Array( [0,18,27,38,46,58,71,79,86,94,100,106,121] )

let slotMapIfcSanitaryTerminalTypeEnum =
  new Int32Array( [3,2,6,9,11,10,4,1,7,5,0,8] )

let encodedDataIfcSanitaryTerminalTypeEnum =
  (new TextEncoder()).encode( ".SANITARYFOUNTAIN..CISTERN..TOILETPAN..WCSEAT..NOTDEFINED..USERDEFINED..SHOWER..BIDET..URINAL..SINK..BATH..WASHHANDBASIN." )

let IfcSanitaryTerminalTypeEnumSearch =
  new MinimalPerfectHash< IfcSanitaryTerminalTypeEnum >( gMapIfcSanitaryTerminalTypeEnum, prefixSumAddressIfcSanitaryTerminalTypeEnum, slotMapIfcSanitaryTerminalTypeEnum, encodedDataIfcSanitaryTerminalTypeEnum )

export { IfcSanitaryTerminalTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSanitaryTerminalTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSanitaryTerminalTypeEnum | undefined {
  return parser.extract< IfcSanitaryTerminalTypeEnum >( IfcSanitaryTerminalTypeEnumSearch, input, cursor, endCursor )
}
