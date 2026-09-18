/* This is generated code, don't alter */
enum IfcFanTypeEnum {
  CENTRIFUGALAIRFOIL = 0,
  CENTRIFUGALBACKWARDINCLINEDCURVED = 1,
  CENTRIFUGALFORWARDCURVED = 2,
  CENTRIFUGALRADIAL = 3,
  PROPELLORAXIAL = 4,
  TUBEAXIAL = 5,
  VANEAXIAL = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcFanTypeEnumCount = 9

export { IfcFanTypeEnum, IfcFanTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFanTypeEnum =
  new Int32Array( [13,1,12] )

let prefixSumAddressIfcFanTypeEnum =
  new Uint32Array( [0,35,46,62,75,86,98,118,144,163] )

let slotMapIfcFanTypeEnum =
  new Int32Array( [1,5,4,7,6,8,0,2,3] )

let encodedDataIfcFanTypeEnum =
  (new TextEncoder()).encode( ".CENTRIFUGALBACKWARDINCLINEDCURVED..TUBEAXIAL..PROPELLORAXIAL..USERDEFINED..VANEAXIAL..NOTDEFINED..CENTRIFUGALAIRFOIL..CENTRIFUGALFORWARDCURVED..CENTRIFUGALRADIAL." )

let IfcFanTypeEnumSearch =
  new MinimalPerfectHash< IfcFanTypeEnum >( gMapIfcFanTypeEnum, prefixSumAddressIfcFanTypeEnum, slotMapIfcFanTypeEnum, encodedDataIfcFanTypeEnum )

export { IfcFanTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFanTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFanTypeEnum | undefined {
  return parser.extract< IfcFanTypeEnum >( IfcFanTypeEnumSearch, input, cursor, endCursor )
}
