/* This is generated code, don't alter */
enum IfcElementAssemblyTypeEnum {
  ABUTMENT = 0,
  ACCESSORY_ASSEMBLY = 1,
  ARCH = 2,
  BEAM_GRID = 3,
  BRACED_FRAME = 4,
  CROSS_BRACING = 5,
  DECK = 6,
  DILATATIONPANEL = 7,
  ENTRANCEWORKS = 8,
  GIRDER = 9,
  GRID = 10,
  MAST = 11,
  PIER = 12,
  PYLON = 13,
  RAIL_MECHANICAL_EQUIPMENT_ASSEMBLY = 14,
  REINFORCEMENT_UNIT = 15,
  RIGID_FRAME = 16,
  SHELTER = 17,
  SIGNALASSEMBLY = 18,
  SLAB_FIELD = 19,
  SUMPBUSTER = 20,
  SUPPORTINGASSEMBLY = 21,
  SUSPENSIONASSEMBLY = 22,
  TRACKPANEL = 23,
  TRACTION_SWITCHING_ASSEMBLY = 24,
  TRAFFIC_CALMING_DEVICE = 25,
  TRUSS = 26,
  TURNOUTPANEL = 27,
  USERDEFINED = 28,
  NOTDEFINED = 29,
}

const IfcElementAssemblyTypeEnumCount = 30

export { IfcElementAssemblyTypeEnum, IfcElementAssemblyTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElementAssemblyTypeEnum =
  new Int32Array( [356,4,24,55,807,5,1] )

let prefixSumAddressIfcElementAssemblyTypeEnum =
  new Uint32Array( [0,36,48,68,79,91,105,120,140,156,162,169,193,199,205,212,218,230,240,248,277,290,304,324,330,339,354,371,384,396,416] )

let slotMapIfcElementAssemblyTypeEnum =
  new Int32Array( [14,29,15,3,20,27,8,21,18,2,26,25,10,11,13,12,23,0,9,24,28,4,22,6,17,5,7,16,19,1] )

let encodedDataIfcElementAssemblyTypeEnum =
  (new TextEncoder()).encode( ".RAIL_MECHANICAL_EQUIPMENT_ASSEMBLY..NOTDEFINED..REINFORCEMENT_UNIT..BEAM_GRID..SUMPBUSTER..TURNOUTPANEL..ENTRANCEWORKS..SUPPORTINGASSEMBLY..SIGNALASSEMBLY..ARCH..TRUSS..TRAFFIC_CALMING_DEVICE..GRID..MAST..PYLON..PIER..TRACKPANEL..ABUTMENT..GIRDER..TRACTION_SWITCHING_ASSEMBLY..USERDEFINED..BRACED_FRAME..SUSPENSIONASSEMBLY..DECK..SHELTER..CROSS_BRACING..DILATATIONPANEL..RIGID_FRAME..SLAB_FIELD..ACCESSORY_ASSEMBLY." )

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
