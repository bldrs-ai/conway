/* This is generated code, don't alter */
enum IfcOccupantTypeEnum {
  ASSIGNEE = 0,
  ASSIGNOR = 1,
  LESSEE = 2,
  LESSOR = 3,
  LETTINGAGENT = 4,
  OWNER = 5,
  TENANT = 6,
  USERDEFINED = 7,
  NOTDEFINED = 8,
}

const IfcOccupantTypeEnumCount = 9

export { IfcOccupantTypeEnum, IfcOccupantTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcOccupantTypeEnum =
  new Int32Array( [1,7,-5] )

let prefixSumAddressIfcOccupantTypeEnum =
  new Uint32Array( [0,8,18,28,36,44,56,69,76,90] )

let slotMapIfcOccupantTypeEnum =
  new Int32Array( [3,0,1,2,6,8,7,5,4] )

let encodedDataIfcOccupantTypeEnum =
  (new TextEncoder()).encode( ".LESSOR..ASSIGNEE..ASSIGNOR..LESSEE..TENANT..NOTDEFINED..USERDEFINED..OWNER..LETTINGAGENT." )

let IfcOccupantTypeEnumSearch =
  new MinimalPerfectHash< IfcOccupantTypeEnum >( gMapIfcOccupantTypeEnum, prefixSumAddressIfcOccupantTypeEnum, slotMapIfcOccupantTypeEnum, encodedDataIfcOccupantTypeEnum )

export { IfcOccupantTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcOccupantTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcOccupantTypeEnum | undefined {
  return parser.extract< IfcOccupantTypeEnum >( IfcOccupantTypeEnumSearch, input, cursor, endCursor )
}
