/* This is generated code, don't alter */
enum IfcSimplePropertyTemplateTypeEnum {
  P_BOUNDEDVALUE = 0,
  P_ENUMERATEDVALUE = 1,
  P_LISTVALUE = 2,
  P_REFERENCEVALUE = 3,
  P_SINGLEVALUE = 4,
  P_TABLEVALUE = 5,
  Q_AREA = 6,
  Q_COUNT = 7,
  Q_LENGTH = 8,
  Q_NUMBER = 9,
  Q_TIME = 10,
  Q_VOLUME = 11,
  Q_WEIGHT = 12,
}

const IfcSimplePropertyTemplateTypeEnumCount = 13

export { IfcSimplePropertyTemplateTypeEnum, IfcSimplePropertyTemplateTypeEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcSimplePropertyTemplateTypeEnum =
  new Int32Array( [25,2,36,38] )

let prefixSumAddressIfcSimplePropertyTemplateTypeEnum =
  new Uint32Array( [0,8,18,28,41,60,69,79,93,109,124,134,142,160] )

let slotMapIfcSimplePropertyTemplateTypeEnum =
  new Int32Array( [6,8,11,2,1,7,9,5,0,4,12,10,3] )

let encodedDataIfcSimplePropertyTemplateTypeEnum =
  (new TextEncoder()).encode( ".Q_AREA..Q_LENGTH..Q_VOLUME..P_LISTVALUE..P_ENUMERATEDVALUE..Q_COUNT..Q_NUMBER..P_TABLEVALUE..P_BOUNDEDVALUE..P_SINGLEVALUE..Q_WEIGHT..Q_TIME..P_REFERENCEVALUE." )

let IfcSimplePropertyTemplateTypeEnumSearch =
  new MinimalPerfectHash< IfcSimplePropertyTemplateTypeEnum >( gMapIfcSimplePropertyTemplateTypeEnum, prefixSumAddressIfcSimplePropertyTemplateTypeEnum, slotMapIfcSimplePropertyTemplateTypeEnum, encodedDataIfcSimplePropertyTemplateTypeEnum )

export { IfcSimplePropertyTemplateTypeEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcSimplePropertyTemplateTypeEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcSimplePropertyTemplateTypeEnum | undefined {
  return parser.extract< IfcSimplePropertyTemplateTypeEnum >( IfcSimplePropertyTemplateTypeEnumSearch, input, cursor, endCursor )
}
