/* This is generated code, don't alter */
enum IfcRoadTypeEnum {
  USERDEFINED = 0,
  NOTDEFINED = 1,
}

const IfcRoadTypeEnumCount = 2

export { IfcRoadTypeEnum, IfcRoadTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRoadTypeEnum =
  new Int32Array( [1] )

let prefixSumAddressIfcRoadTypeEnum =
  new Uint32Array( [0,13,25] )

let slotMapIfcRoadTypeEnum =
  new Int32Array( [0,1] )

let encodedDataIfcRoadTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..NOTDEFINED." )

let IfcRoadTypeEnumSearch =
  new MinimalPerfectHash< IfcRoadTypeEnum >( gMapIfcRoadTypeEnum, prefixSumAddressIfcRoadTypeEnum, slotMapIfcRoadTypeEnum, encodedDataIfcRoadTypeEnum )

export { IfcRoadTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRoadTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRoadTypeEnum | undefined {
  return parser.extract< IfcRoadTypeEnum >( IfcRoadTypeEnumSearch, input, cursor, endCursor )
}
