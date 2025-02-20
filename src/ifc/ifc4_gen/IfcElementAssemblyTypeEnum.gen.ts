/* This is generated code, don't alter */
enum IfcElementAssemblyTypeEnum {
  ACCESSORY_ASSEMBLY = 0,
  ARCH = 1,
  BEAM_GRID = 2,
  BRACED_FRAME = 3,
  GIRDER = 4,
  REINFORCEMENT_UNIT = 5,
  RIGID_FRAME = 6,
  SLAB_FIELD = 7,
  TRUSS = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcElementAssemblyTypeEnumCount = 11

export { IfcElementAssemblyTypeEnum, IfcElementAssemblyTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElementAssemblyTypeEnum =
  new Int32Array( [235,2,19] )

let prefixSumAddressIfcElementAssemblyTypeEnum =
  new Uint32Array( [0,12,20,27,47,61,73,79,92,105,116,136] )

let slotMapIfcElementAssemblyTypeEnum =
  new Int32Array( [7,4,8,0,3,10,1,6,9,2,5] )

let encodedDataIfcElementAssemblyTypeEnum =
  (new TextEncoder()).encode( ".SLAB_FIELD..GIRDER..TRUSS..ACCESSORY_ASSEMBLY..BRACED_FRAME..NOTDEFINED..ARCH..RIGID_FRAME..USERDEFINED..BEAM_GRID..REINFORCEMENT_UNIT." )

let IfcElementAssemblyTypeEnumSearch =
  new MinimalPerfectHash< IfcElementAssemblyTypeEnum >( gMapIfcElementAssemblyTypeEnum, prefixSumAddressIfcElementAssemblyTypeEnum, slotMapIfcElementAssemblyTypeEnum, encodedDataIfcElementAssemblyTypeEnum )

export { IfcElementAssemblyTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElementAssemblyTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElementAssemblyTypeEnum | undefined {
  return parser.extract< IfcElementAssemblyTypeEnum >( IfcElementAssemblyTypeEnumSearch, input, cursor, endCursor )
}
