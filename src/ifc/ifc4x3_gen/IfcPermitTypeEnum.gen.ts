/* This is generated code, don't alter */
enum IfcPermitTypeEnum {
  ACCESS = 0,
  BUILDING = 1,
  WORK = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcPermitTypeEnumCount = 5

export { IfcPermitTypeEnum, IfcPermitTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPermitTypeEnum =
  new Int32Array( [18] )

let prefixSumAddressIfcPermitTypeEnum =
  new Uint32Array( [0,6,18,28,41,49] )

let slotMapIfcPermitTypeEnum =
  new Int32Array( [2,4,1,3,0] )

let encodedDataIfcPermitTypeEnum =
  (new TextEncoder()).encode( ".WORK..NOTDEFINED..BUILDING..USERDEFINED..ACCESS." )

let IfcPermitTypeEnumSearch =
  new MinimalPerfectHash< IfcPermitTypeEnum >( gMapIfcPermitTypeEnum, prefixSumAddressIfcPermitTypeEnum, slotMapIfcPermitTypeEnum, encodedDataIfcPermitTypeEnum )

export { IfcPermitTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPermitTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPermitTypeEnum | undefined {
  return parser.extract< IfcPermitTypeEnum >( IfcPermitTypeEnumSearch, input, cursor, endCursor )
}
