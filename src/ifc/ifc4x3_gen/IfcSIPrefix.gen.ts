/* This is generated code, don't alter */
enum IfcSIPrefix {
  ATTO = 0,
  CENTI = 1,
  DECA = 2,
  DECI = 3,
  EXA = 4,
  FEMTO = 5,
  GIGA = 6,
  HECTO = 7,
  KILO = 8,
  MEGA = 9,
  MICRO = 10,
  MILLI = 11,
  NANO = 12,
  PETA = 13,
  PICO = 14,
  TERA = 15,
}

const IfcSIPrefixCount = 16

export { IfcSIPrefix, IfcSIPrefixCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSIPrefix =
  new Int32Array( [8,35,69,25] )

let prefixSumAddressIfcSIPrefix =
  new Uint32Array( [0,6,12,18,24,29,36,42,48,55,62,69,75,82,88,94,100] )

let slotMapIfcSIPrefix =
  new Int32Array( [13,8,12,14,4,11,0,2,1,10,5,9,7,6,3,15] )

let encodedDataIfcSIPrefix =
  (new TextEncoder()).encode( ".PETA..KILO..NANO..PICO..EXA..MILLI..ATTO..DECA..CENTI..MICRO..FEMTO..MEGA..HECTO..GIGA..DECI..TERA." )

let IfcSIPrefixSearch =
  new MinimalPerfectHash< IfcSIPrefix >( gMapIfcSIPrefix, prefixSumAddressIfcSIPrefix, slotMapIfcSIPrefix, encodedDataIfcSIPrefix )

export { IfcSIPrefixSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSIPrefixDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSIPrefix | undefined {
  return parser.extract< IfcSIPrefix >( IfcSIPrefixSearch, input, cursor, endCursor )
}
