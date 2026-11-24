/* This is generated code, don't alter */
enum IfcDiscreteAccessoryTypeEnum {
  ANCHORPLATE = 0,
  BIRDPROTECTION = 1,
  BRACKET = 2,
  CABLEARRANGER = 3,
  ELASTIC_CUSHION = 4,
  EXPANSION_JOINT_DEVICE = 5,
  FILLER = 6,
  FLASHING = 7,
  INSULATOR = 8,
  LOCK = 9,
  PANEL_STRENGTHENING = 10,
  POINTMACHINEMOUNTINGDEVICE = 11,
  POINT_MACHINE_LOCKING_DEVICE = 12,
  RAILBRACE = 13,
  RAILPAD = 14,
  RAIL_LUBRICATION = 15,
  RAIL_MECHANICAL_EQUIPMENT = 16,
  SHOE = 17,
  SLIDINGCHAIR = 18,
  SOUNDABSORPTION = 19,
  TENSIONINGEQUIPMENT = 20,
  USERDEFINED = 21,
  NOTDEFINED = 22,
}

const IfcDiscreteAccessoryTypeEnumCount = 23

export { IfcDiscreteAccessoryTypeEnum, IfcDiscreteAccessoryTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDiscreteAccessoryTypeEnum =
  new Int32Array( [7,113,2,645,4,86] )

let prefixSumAddressIfcDiscreteAccessoryTypeEnum =
  new Uint32Array( [0,21,48,57,65,82,95,106,117,123,141,156,177,183,195,212,240,270,286,300,324,337,347,356] )

let slotMapIfcDiscreteAccessoryTypeEnum =
  new Int32Array( [10,16,14,6,4,0,13,8,17,15,3,20,9,22,19,11,12,1,18,5,21,7,2] )

let encodedDataIfcDiscreteAccessoryTypeEnum =
  (new TextEncoder()).encode( ".PANEL_STRENGTHENING..RAIL_MECHANICAL_EQUIPMENT..RAILPAD..FILLER..ELASTIC_CUSHION..ANCHORPLATE..RAILBRACE..INSULATOR..SHOE..RAIL_LUBRICATION..CABLEARRANGER..TENSIONINGEQUIPMENT..LOCK..NOTDEFINED..SOUNDABSORPTION..POINTMACHINEMOUNTINGDEVICE..POINT_MACHINE_LOCKING_DEVICE..BIRDPROTECTION..SLIDINGCHAIR..EXPANSION_JOINT_DEVICE..USERDEFINED..FLASHING..BRACKET." )

let IfcDiscreteAccessoryTypeEnumSearch =
  new MinimalPerfectHash< IfcDiscreteAccessoryTypeEnum >( gMapIfcDiscreteAccessoryTypeEnum, prefixSumAddressIfcDiscreteAccessoryTypeEnum, slotMapIfcDiscreteAccessoryTypeEnum, encodedDataIfcDiscreteAccessoryTypeEnum )

export { IfcDiscreteAccessoryTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDiscreteAccessoryTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDiscreteAccessoryTypeEnum | undefined {
  return parser.extract< IfcDiscreteAccessoryTypeEnum >( IfcDiscreteAccessoryTypeEnumSearch, input, cursor, endCursor )
}
