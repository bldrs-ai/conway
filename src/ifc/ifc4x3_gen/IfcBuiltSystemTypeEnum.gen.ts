/* This is generated code, don't alter */
enum IfcBuiltSystemTypeEnum {
  EROSIONPREVENTION = 0,
  FENESTRATION = 1,
  FOUNDATION = 2,
  LOADBEARING = 3,
  MOORING = 4,
  OUTERSHELL = 5,
  PRESTRESSING = 6,
  RAILWAYLINE = 7,
  RAILWAYTRACK = 8,
  REINFORCING = 9,
  SHADING = 10,
  TRACKCIRCUIT = 11,
  TRANSPORT = 12,
  USERDEFINED = 13,
  NOTDEFINED = 14,
}

const IfcBuiltSystemTypeEnumCount = 15

export { IfcBuiltSystemTypeEnum, IfcBuiltSystemTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcBuiltSystemTypeEnum =
  new Int32Array( [2,24,182,136] )

let prefixSumAddressIfcBuiltSystemTypeEnum =
  new Uint32Array( [0,12,26,39,52,64,77,89,98,112,126,139,153,162,181,192] )

let slotMapIfcBuiltSystemTypeEnum =
  new Int32Array( [2,11,7,13,14,3,5,4,6,8,9,1,10,0,12] )

let encodedDataIfcBuiltSystemTypeEnum =
  (new TextEncoder()).encode( ".FOUNDATION..TRACKCIRCUIT..RAILWAYLINE..USERDEFINED..NOTDEFINED..LOADBEARING..OUTERSHELL..MOORING..PRESTRESSING..RAILWAYTRACK..REINFORCING..FENESTRATION..SHADING..EROSIONPREVENTION..TRANSPORT." )

let IfcBuiltSystemTypeEnumSearch =
  new MinimalPerfectHash< IfcBuiltSystemTypeEnum >( gMapIfcBuiltSystemTypeEnum, prefixSumAddressIfcBuiltSystemTypeEnum, slotMapIfcBuiltSystemTypeEnum, encodedDataIfcBuiltSystemTypeEnum )

export { IfcBuiltSystemTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcBuiltSystemTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcBuiltSystemTypeEnum | undefined {
  return parser.extract< IfcBuiltSystemTypeEnum >( IfcBuiltSystemTypeEnumSearch, input, cursor, endCursor )
}
