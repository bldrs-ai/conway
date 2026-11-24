/* This is generated code, don't alter */
enum IfcDataOriginEnum {
  MEASURED = 0,
  PREDICTED = 1,
  SIMULATED = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcDataOriginEnumCount = 5

export { IfcDataOriginEnum, IfcDataOriginEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDataOriginEnum =
  new Int32Array( [43] )

let prefixSumAddressIfcDataOriginEnum =
  new Uint32Array( [0,11,21,33,44,57] )

let slotMapIfcDataOriginEnum =
  new Int32Array( [2,0,4,1,3] )

let encodedDataIfcDataOriginEnum =
  (new TextEncoder()).encode( ".SIMULATED..MEASURED..NOTDEFINED..PREDICTED..USERDEFINED." )

let IfcDataOriginEnumSearch =
  new MinimalPerfectHash< IfcDataOriginEnum >( gMapIfcDataOriginEnum, prefixSumAddressIfcDataOriginEnum, slotMapIfcDataOriginEnum, encodedDataIfcDataOriginEnum )

export { IfcDataOriginEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDataOriginEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDataOriginEnum | undefined {
  return parser.extract< IfcDataOriginEnum >( IfcDataOriginEnumSearch, input, cursor, endCursor )
}
