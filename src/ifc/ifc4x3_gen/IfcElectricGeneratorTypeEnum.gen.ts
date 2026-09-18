/* This is generated code, don't alter */
enum IfcElectricGeneratorTypeEnum {
  CHP = 0,
  ENGINEGENERATOR = 1,
  STANDALONE = 2,
  USERDEFINED = 3,
  NOTDEFINED = 4,
}

const IfcElectricGeneratorTypeEnumCount = 5

export { IfcElectricGeneratorTypeEnum, IfcElectricGeneratorTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcElectricGeneratorTypeEnum =
  new Int32Array( [10] )

let prefixSumAddressIfcElectricGeneratorTypeEnum =
  new Uint32Array( [0,13,25,30,42,59] )

let slotMapIfcElectricGeneratorTypeEnum =
  new Int32Array( [3,2,0,4,1] )

let encodedDataIfcElectricGeneratorTypeEnum =
  (new TextEncoder()).encode( ".USERDEFINED..STANDALONE..CHP..NOTDEFINED..ENGINEGENERATOR." )

let IfcElectricGeneratorTypeEnumSearch =
  new MinimalPerfectHash< IfcElectricGeneratorTypeEnum >( gMapIfcElectricGeneratorTypeEnum, prefixSumAddressIfcElectricGeneratorTypeEnum, slotMapIfcElectricGeneratorTypeEnum, encodedDataIfcElectricGeneratorTypeEnum )

export { IfcElectricGeneratorTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcElectricGeneratorTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcElectricGeneratorTypeEnum | undefined {
  return parser.extract< IfcElectricGeneratorTypeEnum >( IfcElectricGeneratorTypeEnumSearch, input, cursor, endCursor )
}
