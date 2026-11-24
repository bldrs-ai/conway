/* This is generated code, don't alter */
enum IfcAudioVisualApplianceTypeEnum {
  AMPLIFIER = 0,
  CAMERA = 1,
  COMMUNICATIONTERMINAL = 2,
  DISPLAY = 3,
  MICROPHONE = 4,
  PLAYER = 5,
  PROJECTOR = 6,
  RECEIVER = 7,
  RECORDINGEQUIPMENT = 8,
  SPEAKER = 9,
  SWITCHER = 10,
  TELEPHONE = 11,
  TUNER = 12,
  USERDEFINED = 13,
  NOTDEFINED = 14,
}

const IfcAudioVisualApplianceTypeEnumCount = 15

export { IfcAudioVisualApplianceTypeEnum, IfcAudioVisualApplianceTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcAudioVisualApplianceTypeEnum =
  new Int32Array( [118,87,5,2] )

let prefixSumAddressIfcAudioVisualApplianceTypeEnum =
  new Uint32Array( [0,11,22,31,40,52,60,70,81,88,98,106,129,141,161,174] )

let slotMapIfcAudioVisualApplianceTypeEnum =
  new Int32Array( [6,0,9,3,14,1,7,11,12,10,5,2,4,8,13] )

let encodedDataIfcAudioVisualApplianceTypeEnum =
  (new TextEncoder()).encode( ".PROJECTOR..AMPLIFIER..SPEAKER..DISPLAY..NOTDEFINED..CAMERA..RECEIVER..TELEPHONE..TUNER..SWITCHER..PLAYER..COMMUNICATIONTERMINAL..MICROPHONE..RECORDINGEQUIPMENT..USERDEFINED." )

let IfcAudioVisualApplianceTypeEnumSearch =
  new MinimalPerfectHash< IfcAudioVisualApplianceTypeEnum >( gMapIfcAudioVisualApplianceTypeEnum, prefixSumAddressIfcAudioVisualApplianceTypeEnum, slotMapIfcAudioVisualApplianceTypeEnum, encodedDataIfcAudioVisualApplianceTypeEnum )

export { IfcAudioVisualApplianceTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcAudioVisualApplianceTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcAudioVisualApplianceTypeEnum | undefined {
  return parser.extract< IfcAudioVisualApplianceTypeEnum >( IfcAudioVisualApplianceTypeEnumSearch, input, cursor, endCursor )
}
