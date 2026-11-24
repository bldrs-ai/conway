/* This is generated code, don't alter */
enum IfcFootingTypeEnum {
  CAISSON_FOUNDATION = 0,
  FOOTING_BEAM = 1,
  PAD_FOOTING = 2,
  PILE_CAP = 3,
  STRIP_FOOTING = 4,
  USERDEFINED = 5,
  NOTDEFINED = 6,
}

const IfcFootingTypeEnumCount = 7

export { IfcFootingTypeEnum, IfcFootingTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFootingTypeEnum =
  new Int32Array( [346] )

let prefixSumAddressIfcFootingTypeEnum =
  new Uint32Array( [0,15,35,47,60,73,87,97] )

let slotMapIfcFootingTypeEnum =
  new Int32Array( [4,0,6,2,5,1,3] )

let encodedDataIfcFootingTypeEnum =
  (new TextEncoder()).encode( ".STRIP_FOOTING..CAISSON_FOUNDATION..NOTDEFINED..PAD_FOOTING..USERDEFINED..FOOTING_BEAM..PILE_CAP." )

let IfcFootingTypeEnumSearch =
  new MinimalPerfectHash< IfcFootingTypeEnum >( gMapIfcFootingTypeEnum, prefixSumAddressIfcFootingTypeEnum, slotMapIfcFootingTypeEnum, encodedDataIfcFootingTypeEnum )

export { IfcFootingTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFootingTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFootingTypeEnum | undefined {
  return parser.extract< IfcFootingTypeEnum >( IfcFootingTypeEnumSearch, input, cursor, endCursor )
}
