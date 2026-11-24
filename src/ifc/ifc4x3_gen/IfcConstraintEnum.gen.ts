/* This is generated code, don't alter */
enum IfcConstraintEnum {
  ADVISORY = 0,
  HARD = 1,
  SOFT = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcConstraintEnumCount = 5

export { IfcConstraintEnum, IfcConstraintEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcConstraintEnum =
  new Int32Array( [17] )

let prefixSumAddressIfcConstraintEnum =
  new Uint32Array( [0,13,19,29,35,47] )

let slotMapIfcConstraintEnum =
  new Int32Array( [3,2,0,1,4] )

let encodedDataIfcConstraintEnum =
  (new TextEncoder()).encode( ".USERDEFINED..SOFT..ADVISORY..HARD..NOTDEFINED." )

let IfcConstraintEnumSearch =
  new MinimalPerfectHash< IfcConstraintEnum >( gMapIfcConstraintEnum, prefixSumAddressIfcConstraintEnum, slotMapIfcConstraintEnum, encodedDataIfcConstraintEnum )

export { IfcConstraintEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcConstraintEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcConstraintEnum | undefined {
  return parser.extract< IfcConstraintEnum >( IfcConstraintEnumSearch, input, cursor, endCursor )
}
