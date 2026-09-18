/* This is generated code, don't alter */
enum IfcWindowPanelOperationEnum {
  BOTTOMHUNG = 0,
  FIXEDCASEMENT = 1,
  OTHEROPERATION = 2,
  PIVOTHORIZONTAL = 3,
  PIVOTVERTICAL = 4,
  REMOVABLECASEMENT = 5,
  SIDEHUNGLEFTHAND = 6,
  SIDEHUNGRIGHTHAND = 7,
  SLIDINGHORIZONTAL = 8,
  SLIDINGVERTICAL = 9,
  TILTANDTURNLEFTHAND = 10,
  TILTANDTURNRIGHTHAND = 11,
  TOPHUNG = 12,
  NOTDEFINED = 13,
}

const IfcWindowPanelOperationEnumCount = 14

export { IfcWindowPanelOperationEnum, IfcWindowPanelOperationEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWindowPanelOperationEnum =
  new Int32Array( [1,4,192,19] )

let prefixSumAddressIfcWindowPanelOperationEnum =
  new Uint32Array( [0,15,27,46,68,83,101,118,134,155,167,184,203,222,231] )

let slotMapIfcWindowPanelOperationEnum =
  new Int32Array( [1,13,8,11,4,6,3,2,10,0,9,7,5,12] )

let encodedDataIfcWindowPanelOperationEnum =
  (new TextEncoder()).encode( ".FIXEDCASEMENT..NOTDEFINED..SLIDINGHORIZONTAL..TILTANDTURNRIGHTHAND..PIVOTVERTICAL..SIDEHUNGLEFTHAND..PIVOTHORIZONTAL..OTHEROPERATION..TILTANDTURNLEFTHAND..BOTTOMHUNG..SLIDINGVERTICAL..SIDEHUNGRIGHTHAND..REMOVABLECASEMENT..TOPHUNG." )

let IfcWindowPanelOperationEnumSearch =
  new MinimalPerfectHash< IfcWindowPanelOperationEnum >( gMapIfcWindowPanelOperationEnum, prefixSumAddressIfcWindowPanelOperationEnum, slotMapIfcWindowPanelOperationEnum, encodedDataIfcWindowPanelOperationEnum )

export { IfcWindowPanelOperationEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWindowPanelOperationEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWindowPanelOperationEnum | undefined {
  return parser.extract< IfcWindowPanelOperationEnum >( IfcWindowPanelOperationEnumSearch, input, cursor, endCursor )
}
