/* This is generated code, don't alter */
enum IfcDistributionSystemEnum {
  AIRCONDITIONING = 0,
  AUDIOVISUAL = 1,
  CATENARY_SYSTEM = 2,
  CHEMICAL = 3,
  CHILLEDWATER = 4,
  COMMUNICATION = 5,
  COMPRESSEDAIR = 6,
  CONDENSERWATER = 7,
  CONTROL = 8,
  CONVEYING = 9,
  DATA = 10,
  DISPOSAL = 11,
  DOMESTICCOLDWATER = 12,
  DOMESTICHOTWATER = 13,
  DRAINAGE = 14,
  EARTHING = 15,
  ELECTRICAL = 16,
  ELECTROACOUSTIC = 17,
  EXHAUST = 18,
  FIREPROTECTION = 19,
  FIXEDTRANSMISSIONNETWORK = 20,
  FUEL = 21,
  GAS = 22,
  HAZARDOUS = 23,
  HEATING = 24,
  LIGHTING = 25,
  LIGHTNINGPROTECTION = 26,
  MOBILENETWORK = 27,
  MONITORINGSYSTEM = 28,
  MUNICIPALSOLIDWASTE = 29,
  OIL = 30,
  OPERATIONAL = 31,
  OPERATIONALTELEPHONYSYSTEM = 32,
  OVERHEAD_CONTACTLINE_SYSTEM = 33,
  POWERGENERATION = 34,
  RAINWATER = 35,
  REFRIGERATION = 36,
  RETURN_CIRCUIT = 37,
  SECURITY = 38,
  SEWAGE = 39,
  SIGNAL = 40,
  STORMWATER = 41,
  TELEPHONE = 42,
  TV = 43,
  VACUUM = 44,
  VENT = 45,
  VENTILATION = 46,
  WASTEWATER = 47,
  WATERSUPPLY = 48,
  USERDEFINED = 49,
  NOTDEFINED = 50,
}

const IfcDistributionSystemEnumCount = 51

export { IfcDistributionSystemEnum, IfcDistributionSystemEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcDistributionSystemEnum =
  new Int32Array( [4,210,1,4,96,122,-5,237,587,725,827,1] )

let prefixSumAddressIfcDistributionSystemEnum =
  new Uint32Array( [0,6,10,20,35,44,73,85,102,117,128,139,152,163,171,184,194,212,229,248,276,286,296,312,324,334,343,364,369,375,390,406,412,423,431,445,454,469,477,494,512,525,537,563,580,593,614,619,632,648,658,670] )

let slotMapIfcDistributionSystemEnum =
  new Int32Array( [21,43,14,36,24,33,41,2,5,42,23,1,35,39,48,3,28,0,12,32,25,38,7,16,11,8,29,22,45,6,19,10,9,44,4,18,27,40,17,13,31,50,20,34,49,26,30,46,37,15,47] )

let encodedDataIfcDistributionSystemEnum =
  (new TextEncoder()).encode( ".FUEL..TV..DRAINAGE..REFRIGERATION..HEATING..OVERHEAD_CONTACTLINE_SYSTEM..STORMWATER..CATENARY_SYSTEM..COMMUNICATION..TELEPHONE..HAZARDOUS..AUDIOVISUAL..RAINWATER..SEWAGE..WATERSUPPLY..CHEMICAL..MONITORINGSYSTEM..AIRCONDITIONING..DOMESTICCOLDWATER..OPERATIONALTELEPHONYSYSTEM..LIGHTING..SECURITY..CONDENSERWATER..ELECTRICAL..DISPOSAL..CONTROL..MUNICIPALSOLIDWASTE..GAS..VENT..COMPRESSEDAIR..FIREPROTECTION..DATA..CONVEYING..VACUUM..CHILLEDWATER..EXHAUST..MOBILENETWORK..SIGNAL..ELECTROACOUSTIC..DOMESTICHOTWATER..OPERATIONAL..NOTDEFINED..FIXEDTRANSMISSIONNETWORK..POWERGENERATION..USERDEFINED..LIGHTNINGPROTECTION..OIL..VENTILATION..RETURN_CIRCUIT..EARTHING..WASTEWATER." )

let IfcDistributionSystemEnumSearch =
  new MinimalPerfectHash< IfcDistributionSystemEnum >( gMapIfcDistributionSystemEnum, prefixSumAddressIfcDistributionSystemEnum, slotMapIfcDistributionSystemEnum, encodedDataIfcDistributionSystemEnum )

export { IfcDistributionSystemEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcDistributionSystemEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcDistributionSystemEnum | undefined {
  return parser.extract< IfcDistributionSystemEnum >( IfcDistributionSystemEnumSearch, input, cursor, endCursor )
}
