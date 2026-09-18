/* This is generated code, don't alter */
enum IfcTransportElementTypeEnum {
  CRANEWAY = 0,
  ELEVATOR = 1,
  ESCALATOR = 2,
  HAULINGGEAR = 3,
  LIFTINGGEAR = 4,
  MOVINGWALKWAY = 5,
  USERDEFINED = 6,
  NOTDEFINED = 7,
}

const IfcTransportElementTypeEnumCount = 8

export { IfcTransportElementTypeEnum, IfcTransportElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcTransportElementTypeEnum =
  new Int32Array( [10,5,1] )

let prefixSumAddressIfcTransportElementTypeEnum =
  new Uint32Array( [0,13,26,41,54,64,75,85,97] )

let slotMapIfcTransportElementTypeEnum =
  new Int32Array( [6,3,5,4,0,2,1,7] )

let encodedDataIfcTransportElementTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..HAULINGGEAR..MOVINGWALKWAY..LIFTINGGEAR..CRANEWAY..ESCALATOR..ELEVATOR..NOTDEFINED." )

let IfcTransportElementTypeEnumSearch =
  new MinimalPerfectHash< IfcTransportElementTypeEnum >( gMapIfcTransportElementTypeEnum, prefixSumAddressIfcTransportElementTypeEnum, slotMapIfcTransportElementTypeEnum, encodedDataIfcTransportElementTypeEnum )

export { IfcTransportElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcTransportElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcTransportElementTypeEnum | undefined {
  return parser.extract< IfcTransportElementTypeEnum >( IfcTransportElementTypeEnumSearch, input, cursor, endCursor )
}
