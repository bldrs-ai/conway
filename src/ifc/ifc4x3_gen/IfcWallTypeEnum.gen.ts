/* This is generated code, don't alter */
enum IfcWallTypeEnum {
  ELEMENTEDWALL = 0,
  MOVABLE = 1,
  PARAPET = 2,
  PARTITIONING = 3,
  PLUMBINGWALL = 4,
  POLYGONAL = 5,
  RETAININGWALL = 6,
  SHEAR = 7,
  SOLIDWALL = 8,
  STANDARD = 9,
  WAVEWALL = 10,
  USERDEFINED = 11,
  NOTDEFINED = 12,
}

const IfcWallTypeEnumCount = 13

export { IfcWallTypeEnum, IfcWallTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWallTypeEnum =
  new Int32Array( [1,34,4,5] )

let prefixSumAddressIfcWallTypeEnum =
  new Uint32Array( [0,9,21,36,49,63,73,87,102,113,120,130,139,150] )

let slotMapIfcWallTypeEnum =
  new Int32Array( [1,12,6,11,3,9,4,0,8,7,10,2,5] )

let encodedDataIfcWallTypeEnum =
  (new TextEncoder()).encode( ".MOVABLE..NOTDEFINED..RETAININGWALL..USERDEFINED..PARTITIONING..STANDARD..PLUMBINGWALL..ELEMENTEDWALL..SOLIDWALL..SHEAR..WAVEWALL..PARAPET..POLYGONAL." )

let IfcWallTypeEnumSearch =
  new MinimalPerfectHash< IfcWallTypeEnum >( gMapIfcWallTypeEnum, prefixSumAddressIfcWallTypeEnum, slotMapIfcWallTypeEnum, encodedDataIfcWallTypeEnum )

export { IfcWallTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWallTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWallTypeEnum | undefined {
  return parser.extract< IfcWallTypeEnum >( IfcWallTypeEnumSearch, input, cursor, endCursor )
}
