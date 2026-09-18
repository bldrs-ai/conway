/* This is generated code, don't alter */
enum IfcProfileTypeEnum {
  AREA = 0,
  CURVE = 1,
}

const IfcProfileTypeEnumCount = 2

export { IfcProfileTypeEnum, IfcProfileTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcProfileTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcProfileTypeEnum =
  new Uint32Array( [0,7,13] )

let slotMapIfcProfileTypeEnum =
  new Int32Array( [1,0] )

let encodedDataIfcProfileTypeEnum =
  (new TextEncoder()).encode( ".CURVE..AREA." )

let IfcProfileTypeEnumSearch =
  new MinimalPerfectHash< IfcProfileTypeEnum >( gMapIfcProfileTypeEnum, prefixSumAddressIfcProfileTypeEnum, slotMapIfcProfileTypeEnum, encodedDataIfcProfileTypeEnum )

export { IfcProfileTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcProfileTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcProfileTypeEnum | undefined {
  return parser.extract< IfcProfileTypeEnum >( IfcProfileTypeEnumSearch, input, cursor, endCursor )
}
