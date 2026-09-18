/* This is generated code, don't alter */
enum IfcCrewResourceTypeEnum {
  OFFICE = 0,
  SITE = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcCrewResourceTypeEnumCount = 4

export { IfcCrewResourceTypeEnum, IfcCrewResourceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCrewResourceTypeEnum =
  new Int32Array( [2] )

let prefixSumAddressIfcCrewResourceTypeEnum =
  new Uint32Array( [0,12,18,26,39] )

let slotMapIfcCrewResourceTypeEnum =
  new Int32Array( [3,1,0,2] )

let encodedDataIfcCrewResourceTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..SITE..OFFICE..USERDEFINED." )

let IfcCrewResourceTypeEnumSearch =
  new MinimalPerfectHash< IfcCrewResourceTypeEnum >( gMapIfcCrewResourceTypeEnum, prefixSumAddressIfcCrewResourceTypeEnum, slotMapIfcCrewResourceTypeEnum, encodedDataIfcCrewResourceTypeEnum )

export { IfcCrewResourceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCrewResourceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCrewResourceTypeEnum | undefined {
  return parser.extract< IfcCrewResourceTypeEnum >( IfcCrewResourceTypeEnumSearch, input, cursor, endCursor )
}
