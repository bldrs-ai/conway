/* This is generated code, don't alter */
enum IfcCooledBeamTypeEnum {
  ACTIVE = 0,
  PASSIVE = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcCooledBeamTypeEnumCount = 4

export { IfcCooledBeamTypeEnum, IfcCooledBeamTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCooledBeamTypeEnum =
  new Int32Array( [22] )

let prefixSumAddressIfcCooledBeamTypeEnum =
  new Uint32Array( [0,8,21,30,42] )

let slotMapIfcCooledBeamTypeEnum =
  new Int32Array( [0,2,1,3] )

let encodedDataIfcCooledBeamTypeEnum =
  (new TextEncoder()).encode( ".ACTIVE..USERDEFINED..PASSIVE..NOTDEFINED." )

let IfcCooledBeamTypeEnumSearch =
  new MinimalPerfectHash< IfcCooledBeamTypeEnum >( gMapIfcCooledBeamTypeEnum, prefixSumAddressIfcCooledBeamTypeEnum, slotMapIfcCooledBeamTypeEnum, encodedDataIfcCooledBeamTypeEnum )

export { IfcCooledBeamTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCooledBeamTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCooledBeamTypeEnum | undefined {
  return parser.extract< IfcCooledBeamTypeEnum >( IfcCooledBeamTypeEnumSearch, input, cursor, endCursor )
}
