/* This is generated code, don't alter */
enum IfcBearingTypeEnum {
  CYLINDRICAL = 0,
  DISK = 1,
  ELASTOMERIC = 2,
  GUIDE = 3,
  POT = 4,
  ROCKER = 5,
  ROLLER = 6,
  SPHERICAL = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcBearingTypeEnumCount = 10

export { IfcBearingTypeEnum, IfcBearingTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBearingTypeEnum =
  new Int32Array( [40,124,9] )

let prefixSumAddressIfcBearingTypeEnum =
  new Uint32Array( [0,8,19,32,45,58,64,76,81,88,96] )

let slotMapIfcBearingTypeEnum =
  new Int32Array( [5,7,2,8,0,1,9,4,3,6] )

let encodedDataIfcBearingTypeEnum =
  (new TextEncoder()).encode( ".ROCKER..SPHERICAL..ELASTOMERIC..USERDEFINED..CYLINDRICAL..DISK..NOTDEFINED..POT..GUIDE..ROLLER." )

let IfcBearingTypeEnumSearch =
  new MinimalPerfectHash< IfcBearingTypeEnum >( gMapIfcBearingTypeEnum, prefixSumAddressIfcBearingTypeEnum, slotMapIfcBearingTypeEnum, encodedDataIfcBearingTypeEnum )

export { IfcBearingTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBearingTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBearingTypeEnum | undefined {
  return parser.extract< IfcBearingTypeEnum >( IfcBearingTypeEnumSearch, input, cursor, endCursor )
}
