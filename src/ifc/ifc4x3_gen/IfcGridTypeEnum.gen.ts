/* This is generated code, don't alter */
enum IfcGridTypeEnum {
  IRREGULAR = 0,
  RADIAL = 1,
  RECTANGULAR = 2,
  TRIANGULAR = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcGridTypeEnumCount = 6

export { IfcGridTypeEnum, IfcGridTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcGridTypeEnum =
  new Int32Array( [210] )

let prefixSumAddressIfcGridTypeEnum =
  new Uint32Array( [0,12,25,36,49,57,69] )

let slotMapIfcGridTypeEnum =
  new Int32Array( [5,2,0,4,1,3] )

let encodedDataIfcGridTypeEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..RECTANGULAR..IRREGULAR..USERDEFINED..RADIAL..TRIANGULAR." )

let IfcGridTypeEnumSearch =
  new MinimalPerfectHash< IfcGridTypeEnum >( gMapIfcGridTypeEnum, prefixSumAddressIfcGridTypeEnum, slotMapIfcGridTypeEnum, encodedDataIfcGridTypeEnum )

export { IfcGridTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcGridTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcGridTypeEnum | undefined {
  return parser.extract< IfcGridTypeEnum >( IfcGridTypeEnumSearch, input, cursor, endCursor )
}
