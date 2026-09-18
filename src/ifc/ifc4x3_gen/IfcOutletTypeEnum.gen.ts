/* This is generated code, don't alter */
enum IfcOutletTypeEnum {
  AUDIOVISUALOUTLET = 0,
  COMMUNICATIONSOUTLET = 1,
  DATAOUTLET = 2,
  POWEROUTLET = 3,
  TELEPHONEOUTLET = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcOutletTypeEnumCount = 7

export { IfcOutletTypeEnum, IfcOutletTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcOutletTypeEnum =
  new Int32Array( [147] )

let prefixSumAddressIfcOutletTypeEnum =
  new Uint32Array( [0,22,35,52,65,84,96,108] )

let slotMapIfcOutletTypeEnum =
  new Int32Array( [1,3,4,5,0,2,6] )

let encodedDataIfcOutletTypeEnum =
  (new TextEncoder()).encode( ".COMMUNICATIONSOUTLET..POWEROUTLET..TELEPHONEOUTLET..USERDEFINED..AUDIOVISUALOUTLET..DATAOUTLET..NOTDEFINED." )

let IfcOutletTypeEnumSearch =
  new MinimalPerfectHash< IfcOutletTypeEnum >( gMapIfcOutletTypeEnum, prefixSumAddressIfcOutletTypeEnum, slotMapIfcOutletTypeEnum, encodedDataIfcOutletTypeEnum )

export { IfcOutletTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcOutletTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcOutletTypeEnum | undefined {
  return parser.extract< IfcOutletTypeEnum >( IfcOutletTypeEnumSearch, input, cursor, endCursor )
}
