/* This is generated code, don't alter */
enum IfcDoorPanelPositionEnum {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
  NOTDEFINED = 3,
}

const IfcDoorPanelPositionEnumCount = 4

export { IfcDoorPanelPositionEnum, IfcDoorPanelPositionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDoorPanelPositionEnum =
  new Int32Array( [2] )

let prefixSumAddressIfcDoorPanelPositionEnum =
  new Uint32Array( [0,12,19,27,33] )

let slotMapIfcDoorPanelPositionEnum =
  new Int32Array( [3,2,1,0] )

let encodedDataIfcDoorPanelPositionEnum =
  (new TextEncoder()).encode( ".NOTDEFINED..RIGHT..MIDDLE..LEFT." )

let IfcDoorPanelPositionEnumSearch =
  new MinimalPerfectHash< IfcDoorPanelPositionEnum >( gMapIfcDoorPanelPositionEnum, prefixSumAddressIfcDoorPanelPositionEnum, slotMapIfcDoorPanelPositionEnum, encodedDataIfcDoorPanelPositionEnum )

export { IfcDoorPanelPositionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDoorPanelPositionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDoorPanelPositionEnum | undefined {
  return parser.extract< IfcDoorPanelPositionEnum >( IfcDoorPanelPositionEnumSearch, input, cursor, endCursor )
}
