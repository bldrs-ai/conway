/* This is generated code, don't alter */
enum IfcConveyorSegmentTypeEnum {
  BELTCONVEYOR = 0,
  BUCKETCONVEYOR = 1,
  CHUTECONVEYOR = 2,
  SCREWCONVEYOR = 3,
  USERDEFINED = 4,
  NOTDEFINED = 5,
}

const IfcConveyorSegmentTypeEnumCount = 6

export { IfcConveyorSegmentTypeEnum, IfcConveyorSegmentTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcConveyorSegmentTypeEnum =
  new Int32Array( [14] )

let prefixSumAddressIfcConveyorSegmentTypeEnum =
  new Uint32Array( [0,16,30,42,57,70,85] )

let slotMapIfcConveyorSegmentTypeEnum =
  new Int32Array( [1,0,5,3,4,2] )

let encodedDataIfcConveyorSegmentTypeEnum =
  (new TextEncoder()).encode( ".BUCKETCONVEYOR..BELTCONVEYOR..NOTDEFINED..SCREWCONVEYOR..USERDEFINED..CHUTECONVEYOR." )

let IfcConveyorSegmentTypeEnumSearch =
  new MinimalPerfectHash< IfcConveyorSegmentTypeEnum >( gMapIfcConveyorSegmentTypeEnum, prefixSumAddressIfcConveyorSegmentTypeEnum, slotMapIfcConveyorSegmentTypeEnum, encodedDataIfcConveyorSegmentTypeEnum )

export { IfcConveyorSegmentTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcConveyorSegmentTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcConveyorSegmentTypeEnum | undefined {
  return parser.extract< IfcConveyorSegmentTypeEnum >( IfcConveyorSegmentTypeEnumSearch, input, cursor, endCursor )
}
