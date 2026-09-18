/* This is generated code, don't alter */
enum IfcReflectanceMethodEnum {
  BLINN = 0,
  FLAT = 1,
  GLASS = 2,
  MATT = 3,
  METAL = 4,
  MIRROR = 5,
  PHONG = 6,
  PHYSICAL = 7,
  PLASTIC = 8,
  STRAUSS = 9,
  NOTDEFINED = 10,
}

const IfcReflectanceMethodEnumCount = 11

export { IfcReflectanceMethodEnum, IfcReflectanceMethodEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcReflectanceMethodEnum =
  new Int32Array( [13,58,10] )

let prefixSumAddressIfcReflectanceMethodEnum =
  new Uint32Array( [0,6,13,20,28,34,41,53,60,69,78,88] )

let slotMapIfcReflectanceMethodEnum =
  new Int32Array( [3,6,0,5,1,2,10,4,8,9,7] )

let encodedDataIfcReflectanceMethodEnum =
  (new TextEncoder()).encode( ".MATT..PHONG..BLINN..MIRROR..FLAT..GLASS..NOTDEFINED..METAL..PLASTIC..STRAUSS..PHYSICAL." )

let IfcReflectanceMethodEnumSearch =
  new MinimalPerfectHash< IfcReflectanceMethodEnum >( gMapIfcReflectanceMethodEnum, prefixSumAddressIfcReflectanceMethodEnum, slotMapIfcReflectanceMethodEnum, encodedDataIfcReflectanceMethodEnum )

export { IfcReflectanceMethodEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcReflectanceMethodEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcReflectanceMethodEnum | undefined {
  return parser.extract< IfcReflectanceMethodEnum >( IfcReflectanceMethodEnumSearch, input, cursor, endCursor )
}
