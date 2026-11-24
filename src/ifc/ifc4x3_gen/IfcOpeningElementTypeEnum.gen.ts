/* This is generated code, don't alter */
enum IfcOpeningElementTypeEnum {
  OPENING = 0,
  RECESS = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcOpeningElementTypeEnumCount = 4

export { IfcOpeningElementTypeEnum, IfcOpeningElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcOpeningElementTypeEnum =
  new Int32Array( [3] )

let prefixSumAddressIfcOpeningElementTypeEnum =
  new Uint32Array( [0,8,17,29,42] )

let slotMapIfcOpeningElementTypeEnum =
  new Int32Array( [1,0,3,2] )

let encodedDataIfcOpeningElementTypeEnum =
  (new TextEncoder()).encode( ".RECESS..OPENING..NOTDEFINED..USERDEFINED." )

let IfcOpeningElementTypeEnumSearch =
  new MinimalPerfectHash< IfcOpeningElementTypeEnum >( gMapIfcOpeningElementTypeEnum, prefixSumAddressIfcOpeningElementTypeEnum, slotMapIfcOpeningElementTypeEnum, encodedDataIfcOpeningElementTypeEnum )

export { IfcOpeningElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcOpeningElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcOpeningElementTypeEnum | undefined {
  return parser.extract< IfcOpeningElementTypeEnum >( IfcOpeningElementTypeEnumSearch, input, cursor, endCursor )
}
