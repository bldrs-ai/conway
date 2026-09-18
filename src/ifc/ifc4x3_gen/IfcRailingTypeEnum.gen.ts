/* This is generated code, don't alter */
enum IfcRailingTypeEnum {
  BALUSTRADE = 0,
  FENCE = 1,
  GUARDRAIL = 2,
  HANDRAIL = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcRailingTypeEnumCount = 6

export { IfcRailingTypeEnum, IfcRailingTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRailingTypeEnum =
  new Int32Array( [42] )

let prefixSumAddressIfcRailingTypeEnum =
  new Uint32Array( [0,13,24,36,46,58,65] )

let slotMapIfcRailingTypeEnum =
  new Int32Array( [4,2,5,3,0,1] )

let encodedDataIfcRailingTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..GUARDRAIL..NOTDEFINED..HANDRAIL..BALUSTRADE..FENCE." )

let IfcRailingTypeEnumSearch =
  new MinimalPerfectHash< IfcRailingTypeEnum >( gMapIfcRailingTypeEnum, prefixSumAddressIfcRailingTypeEnum, slotMapIfcRailingTypeEnum, encodedDataIfcRailingTypeEnum )

export { IfcRailingTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRailingTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRailingTypeEnum | undefined {
  return parser.extract< IfcRailingTypeEnum >( IfcRailingTypeEnumSearch, input, cursor, endCursor )
}
