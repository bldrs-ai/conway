/* This is generated code, don't alter */
enum IfcCaissonFoundationTypeEnum {
  CAISSON = 0,
  WELL = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcCaissonFoundationTypeEnumCount = 4

export { IfcCaissonFoundationTypeEnum, IfcCaissonFoundationTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcCaissonFoundationTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcCaissonFoundationTypeEnum =
  new Uint32Array( [0,6,15,28,40] )

let slotMapIfcCaissonFoundationTypeEnum =
  new Int32Array( [1,0,2,3] )

let encodedDataIfcCaissonFoundationTypeEnum =
  (new TextEncoder()).encode( ".WELL..CAISSON..USERDEFINED..NOTDEFINED." )

let IfcCaissonFoundationTypeEnumSearch =
  new MinimalPerfectHash< IfcCaissonFoundationTypeEnum >( gMapIfcCaissonFoundationTypeEnum, prefixSumAddressIfcCaissonFoundationTypeEnum, slotMapIfcCaissonFoundationTypeEnum, encodedDataIfcCaissonFoundationTypeEnum )

export { IfcCaissonFoundationTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcCaissonFoundationTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcCaissonFoundationTypeEnum | undefined {
  return parser.extract< IfcCaissonFoundationTypeEnum >( IfcCaissonFoundationTypeEnumSearch, input, cursor, endCursor )
}
