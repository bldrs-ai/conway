/* This is generated code, don't alter */
enum IfcFacilityUsageEnum {
  LATERAL = 0,
  LONGITUDINAL = 1,
  REGION = 2,
  VERTICAL = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcFacilityUsageEnumCount = 6

export { IfcFacilityUsageEnum, IfcFacilityUsageEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcFacilityUsageEnum =
  new Int32Array( [16] )

let prefixSumAddressIfcFacilityUsageEnum =
  new Uint32Array( [0,12,21,35,48,58,66] )

let slotMapIfcFacilityUsageEnum =
  new Int32Array( [5,0,1,4,3,2] )

let encodedDataIfcFacilityUsageEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..LATERAL..LONGITUDINAL..USERDEFINED..VERTICAL..REGION." )

let IfcFacilityUsageEnumSearch =
  new MinimalPerfectHash< IfcFacilityUsageEnum >( gMapIfcFacilityUsageEnum, prefixSumAddressIfcFacilityUsageEnum, slotMapIfcFacilityUsageEnum, encodedDataIfcFacilityUsageEnum )

export { IfcFacilityUsageEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcFacilityUsageEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcFacilityUsageEnum | undefined {
  return parser.extract< IfcFacilityUsageEnum >( IfcFacilityUsageEnumSearch, input, cursor, endCursor )
}
