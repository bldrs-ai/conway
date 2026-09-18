/* This is generated code, don't alter */
enum IfcWindowTypePartitioningEnum {
  DOUBLE_PANEL_HORIZONTAL = 0,
  DOUBLE_PANEL_VERTICAL = 1,
  SINGLE_PANEL = 2,
  TRIPLE_PANEL_BOTTOM = 3,
  TRIPLE_PANEL_HORIZONTAL = 4,
  TRIPLE_PANEL_LEFT = 5,
  TRIPLE_PANEL_RIGHT = 6,
  TRIPLE_PANEL_TOP = 7,
  TRIPLE_PANEL_VERTICAL = 8,
  USERDEFINED = 9,
  NOTDEFINED = 10,
}

const IfcWindowTypePartitioningEnumCount = 11

export { IfcWindowTypePartitioningEnum, IfcWindowTypePartitioningEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcWindowTypePartitioningEnum =
  new Int32Array( [2,3,321] )

let prefixSumAddressIfcWindowTypePartitioningEnum =
  new Uint32Array( [0,13,38,61,79,93,105,124,147,167,188,213] )

let slotMapIfcWindowTypePartitioningEnum =
  new Int32Array( [9,4,1,7,2,10,5,8,6,3,0] )

let encodedDataIfcWindowTypePartitioningEnum =
  (new TextEncoder()).encode( ".USERDEFINED..TRIPLE_PANEL_HORIZONTAL..DOUBLE_PANEL_VERTICAL..TRIPLE_PANEL_TOP..SINGLE_PANEL..NOTDEFINED..TRIPLE_PANEL_LEFT..TRIPLE_PANEL_VERTICAL..TRIPLE_PANEL_RIGHT..TRIPLE_PANEL_BOTTOM..DOUBLE_PANEL_HORIZONTAL." )

let IfcWindowTypePartitioningEnumSearch =
  new MinimalPerfectHash< IfcWindowTypePartitioningEnum >( gMapIfcWindowTypePartitioningEnum, prefixSumAddressIfcWindowTypePartitioningEnum, slotMapIfcWindowTypePartitioningEnum, encodedDataIfcWindowTypePartitioningEnum )

export { IfcWindowTypePartitioningEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcWindowTypePartitioningEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcWindowTypePartitioningEnum | undefined {
  return parser.extract< IfcWindowTypePartitioningEnum >( IfcWindowTypePartitioningEnumSearch, input, cursor, endCursor )
}
