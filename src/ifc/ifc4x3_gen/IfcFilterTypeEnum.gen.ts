/* This is generated code, don't alter */
enum IfcFilterTypeEnum {
  AIRPARTICLEFILTER = 0,
  COMPRESSEDAIRFILTER = 1,
  ODORFILTER = 2,
  OILFILTER = 3,
  STRAINER = 4,
  WATERFILTER = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcFilterTypeEnumCount = 8

export { IfcFilterTypeEnum, IfcFilterTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFilterTypeEnum =
  new Int32Array( [1,1,54] )

let prefixSumAddressIfcFilterTypeEnum =
  new Uint32Array( [0,21,40,52,62,74,87,100,111] )

let slotMapIfcFilterTypeEnum =
  new Int32Array( [1,0,7,4,2,5,6,3] )

let encodedDataIfcFilterTypeEnum =
  (new TextEncoder()).encode( ".COMPRESSEDAIRFILTER..AIRPARTICLEFILTER..NOTDEFINED..STRAINER..ODORFILTER..WATERFILTER..USERDEFINED..OILFILTER." )

let IfcFilterTypeEnumSearch =
  new MinimalPerfectHash< IfcFilterTypeEnum >( gMapIfcFilterTypeEnum, prefixSumAddressIfcFilterTypeEnum, slotMapIfcFilterTypeEnum, encodedDataIfcFilterTypeEnum )

export { IfcFilterTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFilterTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFilterTypeEnum | undefined {
  return parser.extract< IfcFilterTypeEnum >( IfcFilterTypeEnumSearch, input, cursor, endCursor )
}
