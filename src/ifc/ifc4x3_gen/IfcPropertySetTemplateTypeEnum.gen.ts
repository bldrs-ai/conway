/* This is generated code, don't alter */
enum IfcPropertySetTemplateTypeEnum {
  PSET_MATERIALDRIVEN = 0,
  PSET_OCCURRENCEDRIVEN = 1,
  PSET_PERFORMANCEDRIVEN = 2,
  PSET_PROFILEDRIVEN = 3,
  PSET_TYPEDRIVENONLY = 4,
  PSET_TYPEDRIVENOVERRIDE = 5,
  QTO_OCCURRENCEDRIVEN = 6,
  QTO_TYPEDRIVENONLY = 7,
  QTO_TYPEDRIVENOVERRIDE = 8,
  NOTDEFINED = 9,
}

const IfcPropertySetTemplateTypeEnumCount = 10

export { IfcPropertySetTemplateTypeEnum, IfcPropertySetTemplateTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcPropertySetTemplateTypeEnum =
  new Int32Array( [4,127,21] )

let prefixSumAddressIfcPropertySetTemplateTypeEnum =
  new Uint32Array( [0,20,43,67,88,109,131,143,167,187,212] )

let slotMapIfcPropertySetTemplateTypeEnum =
  new Int32Array( [3,1,2,0,4,6,9,8,7,5] )

let encodedDataIfcPropertySetTemplateTypeEnum =
  (new TextEncoder()).encode( ".PSET_PROFILEDRIVEN..PSET_OCCURRENCEDRIVEN..PSET_PERFORMANCEDRIVEN..PSET_MATERIALDRIVEN..PSET_TYPEDRIVENONLY..QTO_OCCURRENCEDRIVEN..NOTDEFINED..QTO_TYPEDRIVENOVERRIDE..QTO_TYPEDRIVENONLY..PSET_TYPEDRIVENOVERRIDE." )

let IfcPropertySetTemplateTypeEnumSearch =
  new MinimalPerfectHash< IfcPropertySetTemplateTypeEnum >( gMapIfcPropertySetTemplateTypeEnum, prefixSumAddressIfcPropertySetTemplateTypeEnum, slotMapIfcPropertySetTemplateTypeEnum, encodedDataIfcPropertySetTemplateTypeEnum )

export { IfcPropertySetTemplateTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcPropertySetTemplateTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcPropertySetTemplateTypeEnum | undefined {
  return parser.extract< IfcPropertySetTemplateTypeEnum >( IfcPropertySetTemplateTypeEnumSearch, input, cursor, endCursor )
}
