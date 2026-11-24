/* This is generated code, don't alter */
enum IfcPavementTypeEnum {
  FLEXIBLE = 0,
  RIGID = 1,
  USERDEFINED = 2,
  NOTDEFINED = 3,
}

const IfcPavementTypeEnumCount = 4

export { IfcPavementTypeEnum, IfcPavementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPavementTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcPavementTypeEnum =
  new Uint32Array( [0,10,17,30,42] )

let slotMapIfcPavementTypeEnum =
  new Int32Array( [0,1,2,3] )

let encodedDataIfcPavementTypeEnum =
  (new TextEncoder()).encode( ".FLEXIBLE..RIGID..USERDEFINED..NOTDEFINED." )

let IfcPavementTypeEnumSearch =
  new MinimalPerfectHash< IfcPavementTypeEnum >( gMapIfcPavementTypeEnum, prefixSumAddressIfcPavementTypeEnum, slotMapIfcPavementTypeEnum, encodedDataIfcPavementTypeEnum )

export { IfcPavementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPavementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPavementTypeEnum | undefined {
  return parser.extract< IfcPavementTypeEnum >( IfcPavementTypeEnumSearch, input, cursor, endCursor )
}
