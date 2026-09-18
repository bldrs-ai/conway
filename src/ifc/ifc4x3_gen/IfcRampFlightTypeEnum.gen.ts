/* This is generated code, don't alter */
enum IfcRampFlightTypeEnum {
  SPIRAL = 0,
  STRAIGHT = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcRampFlightTypeEnumCount = 4

export { IfcRampFlightTypeEnum, IfcRampFlightTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRampFlightTypeEnum =
  new Int32Array( [22] )

let prefixSumAddressIfcRampFlightTypeEnum =
  new Uint32Array( [0,10,23,31,43] )

let slotMapIfcRampFlightTypeEnum =
  new Int32Array( [1,2,0,3] )

let encodedDataIfcRampFlightTypeEnum =
  (new TextEncoder()).encode( ".STRAIGHT..USERDEFINED..SPIRAL..NOTDEFINED." )

let IfcRampFlightTypeEnumSearch =
  new MinimalPerfectHash< IfcRampFlightTypeEnum >( gMapIfcRampFlightTypeEnum, prefixSumAddressIfcRampFlightTypeEnum, slotMapIfcRampFlightTypeEnum, encodedDataIfcRampFlightTypeEnum )

export { IfcRampFlightTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRampFlightTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRampFlightTypeEnum | undefined {
  return parser.extract< IfcRampFlightTypeEnum >( IfcRampFlightTypeEnumSearch, input, cursor, endCursor )
}
