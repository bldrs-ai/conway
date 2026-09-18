/* This is generated code, don't alter */
enum IfcSurfaceFeatureTypeEnum {
  DEFECT = 0,
  HATCHMARKING = 1,
  LINEMARKING = 2,
  MARK = 3,
  NONSKIDSURFACING = 4,
  PAVEMENTSURFACEMARKING = 5,
  RUMBLESTRIP = 6,
  SYMBOLMARKING = 7,
  TAG = 8,
  TRANSVERSERUMBLESTRIP = 9,
  TREATMENT = 10,
  USERDEFINED = 11,
  NOTDEFINED = 12,
}

const IfcSurfaceFeatureTypeEnumCount = 13

export { IfcSurfaceFeatureTypeEnum, IfcSurfaceFeatureTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSurfaceFeatureTypeEnum =
  new Int32Array( [16,46,24,1] )

let prefixSumAddressIfcSurfaceFeatureTypeEnum =
  new Uint32Array( [0,13,37,42,48,59,72,87,100,118,130,144,167,175] )

let slotMapIfcSurfaceFeatureTypeEnum =
  new Int32Array( [6,5,8,3,10,2,7,11,4,12,1,9,0] )

let encodedDataIfcSurfaceFeatureTypeEnum =
  (new TextEncoder()).encode( ".RUMBLESTRIP..PAVEMENTSURFACEMARKING..TAG..MARK..TREATMENT..LINEMARKING..SYMBOLMARKING..USERDEFINED..NONSKIDSURFACING..NOTDEFINED..HATCHMARKING..TRANSVERSERUMBLESTRIP..DEFECT." )

let IfcSurfaceFeatureTypeEnumSearch =
  new MinimalPerfectHash< IfcSurfaceFeatureTypeEnum >( gMapIfcSurfaceFeatureTypeEnum, prefixSumAddressIfcSurfaceFeatureTypeEnum, slotMapIfcSurfaceFeatureTypeEnum, encodedDataIfcSurfaceFeatureTypeEnum )

export { IfcSurfaceFeatureTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSurfaceFeatureTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSurfaceFeatureTypeEnum | undefined {
  return parser.extract< IfcSurfaceFeatureTypeEnum >( IfcSurfaceFeatureTypeEnumSearch, input, cursor, endCursor )
}
