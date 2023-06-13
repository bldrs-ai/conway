/* This is generated code, don't alter */
enum IfcPileTypeEnum {
  BORED = 0,
  DRIVEN = 1,
  JETGROUTING = 2,
  COHESION = 3,
  FRICTION = 4,
  SUPPORT = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcPileTypeEnumCount = 8

export { IfcPileTypeEnum, IfcPileTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPileTypeEnum =
  new Int32Array( [1,0,9] )

let prefixSumAddressIfcPileTypeEnum =
  new Uint32Array( [0,9,19,31,38,48,56,69,82] )

let slotMapIfcPileTypeEnum =
  new Int32Array( [5,4,7,0,3,1,6,2] )

let encodedDataIfcPileTypeEnum =
  (new TextEncoder()).encode( ".SUPPORT..FRICTION..NOTDEFINED..BORED..COHESION..DRIVEN..USERDEFINED..JETGROUTING." )

let IfcPileTypeEnumSearch =
  new MinimalPerfectHash< IfcPileTypeEnum >( gMapIfcPileTypeEnum, prefixSumAddressIfcPileTypeEnum, slotMapIfcPileTypeEnum, encodedDataIfcPileTypeEnum )

export { IfcPileTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPileTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPileTypeEnum | undefined {
  return parser.extract< IfcPileTypeEnum >( IfcPileTypeEnumSearch, input, cursor, endCursor )
}
