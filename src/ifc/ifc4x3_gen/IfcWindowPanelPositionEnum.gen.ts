/* This is generated code, don't alter */
enum IfcWindowPanelPositionEnum {
  BOTTOM = 0,
  LEFT = 1,
  MIDDLE = 2,
  RIGHT = 3,
  TOP = 4,
  NOTDEFINED = 5,
}

const IfcWindowPanelPositionEnumCount = 6

export { IfcWindowPanelPositionEnum, IfcWindowPanelPositionEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWindowPanelPositionEnum =
  new Int32Array( [54] )

let prefixSumAddressIfcWindowPanelPositionEnum =
  new Uint32Array( [0,6,14,26,33,38,46] )

let slotMapIfcWindowPanelPositionEnum =
  new Int32Array( [1,2,5,3,4,0] )

let encodedDataIfcWindowPanelPositionEnum =
  (new TextEncoder()).encode( ".LEFT..MIDDLE..NOTDEFINED..RIGHT..TOP..BOTTOM." )

let IfcWindowPanelPositionEnumSearch =
  new MinimalPerfectHash< IfcWindowPanelPositionEnum >( gMapIfcWindowPanelPositionEnum, prefixSumAddressIfcWindowPanelPositionEnum, slotMapIfcWindowPanelPositionEnum, encodedDataIfcWindowPanelPositionEnum )

export { IfcWindowPanelPositionEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWindowPanelPositionEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWindowPanelPositionEnum | undefined {
  return parser.extract< IfcWindowPanelPositionEnum >( IfcWindowPanelPositionEnumSearch, input, cursor, endCursor )
}
