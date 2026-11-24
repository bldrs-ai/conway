/* This is generated code, don't alter */
enum IfcDistributionChamberElementTypeEnum {
  FORMEDDUCT = 0,
  INSPECTIONCHAMBER = 1,
  INSPECTIONPIT = 2,
  MANHOLE = 3,
  METERCHAMBER = 4,
  SUMP = 5,
  TRENCH = 6,
  VALVECHAMBER = 7,
  USERDEFINED = 8,
  NOTDEFINED = 9,
}

const IfcDistributionChamberElementTypeEnumCount = 10

export { IfcDistributionChamberElementTypeEnum, IfcDistributionChamberElementTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDistributionChamberElementTypeEnum =
  new Int32Array( [3,46,5] )

let prefixSumAddressIfcDistributionChamberElementTypeEnum =
  new Uint32Array( [0,14,26,40,55,63,76,82,91,110,122] )

let slotMapIfcDistributionChamberElementTypeEnum =
  new Int32Array( [4,9,7,2,6,8,5,3,1,0] )

let encodedDataIfcDistributionChamberElementTypeEnum =
  (new TextEncoder()).encode( ".METERCHAMBER..NOTDEFINED..VALVECHAMBER..INSPECTIONPIT..TRENCH..USERDEFINED..SUMP..MANHOLE..INSPECTIONCHAMBER..FORMEDDUCT." )

let IfcDistributionChamberElementTypeEnumSearch =
  new MinimalPerfectHash< IfcDistributionChamberElementTypeEnum >( gMapIfcDistributionChamberElementTypeEnum, prefixSumAddressIfcDistributionChamberElementTypeEnum, slotMapIfcDistributionChamberElementTypeEnum, encodedDataIfcDistributionChamberElementTypeEnum )

export { IfcDistributionChamberElementTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDistributionChamberElementTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDistributionChamberElementTypeEnum | undefined {
  return parser.extract< IfcDistributionChamberElementTypeEnum >( IfcDistributionChamberElementTypeEnumSearch, input, cursor, endCursor )
}
