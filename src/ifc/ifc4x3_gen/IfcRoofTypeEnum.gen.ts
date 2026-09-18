/* This is generated code, don't alter */
enum IfcRoofTypeEnum {
  BARREL_ROOF = 0,
  BUTTERFLY_ROOF = 1,
  DOME_ROOF = 2,
  FLAT_ROOF = 3,
  FREEFORM = 4,
  GABLE_ROOF = 5,
  GAMBREL_ROOF = 6,
  HIPPED_GABLE_ROOF = 7,
  HIP_ROOF = 8,
  MANSARD_ROOF = 9,
  PAVILION_ROOF = 10,
  RAINBOW_ROOF = 11,
  SHED_ROOF = 12,
  USERDEFINED = 13,
  NOTDEFINED = 14,
}

const IfcRoofTypeEnumCount = 15

export { IfcRoofTypeEnum, IfcRoofTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRoofTypeEnum =
  new Int32Array( [-5,82,1,13] )

let prefixSumAddressIfcRoofTypeEnum =
  new Uint32Array( [0,13,23,35,46,59,70,84,95,109,125,137,147,161,176,195] )

let slotMapIfcRoofTypeEnum =
  new Int32Array( [13,8,5,2,0,12,6,3,9,1,14,4,11,10,7] )

let encodedDataIfcRoofTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..HIP_ROOF..GABLE_ROOF..DOME_ROOF..BARREL_ROOF..SHED_ROOF..GAMBREL_ROOF..FLAT_ROOF..MANSARD_ROOF..BUTTERFLY_ROOF..NOTDEFINED..FREEFORM..RAINBOW_ROOF..PAVILION_ROOF..HIPPED_GABLE_ROOF." )

let IfcRoofTypeEnumSearch =
  new MinimalPerfectHash< IfcRoofTypeEnum >( gMapIfcRoofTypeEnum, prefixSumAddressIfcRoofTypeEnum, slotMapIfcRoofTypeEnum, encodedDataIfcRoofTypeEnum )

export { IfcRoofTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRoofTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRoofTypeEnum | undefined {
  return parser.extract< IfcRoofTypeEnum >( IfcRoofTypeEnumSearch, input, cursor, endCursor )
}
