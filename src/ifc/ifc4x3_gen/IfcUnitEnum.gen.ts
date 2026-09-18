/* This is generated code, don't alter */
enum IfcUnitEnum {
  ABSORBEDDOSEUNIT = 0,
  AMOUNTOFSUBSTANCEUNIT = 1,
  AREAUNIT = 2,
  DOSEEQUIVALENTUNIT = 3,
  ELECTRICCAPACITANCEUNIT = 4,
  ELECTRICCHARGEUNIT = 5,
  ELECTRICCONDUCTANCEUNIT = 6,
  ELECTRICCURRENTUNIT = 7,
  ELECTRICRESISTANCEUNIT = 8,
  ELECTRICVOLTAGEUNIT = 9,
  ENERGYUNIT = 10,
  FORCEUNIT = 11,
  FREQUENCYUNIT = 12,
  ILLUMINANCEUNIT = 13,
  INDUCTANCEUNIT = 14,
  LENGTHUNIT = 15,
  LUMINOUSFLUXUNIT = 16,
  LUMINOUSINTENSITYUNIT = 17,
  MAGNETICFLUXDENSITYUNIT = 18,
  MAGNETICFLUXUNIT = 19,
  MASSUNIT = 20,
  PLANEANGLEUNIT = 21,
  POWERUNIT = 22,
  PRESSUREUNIT = 23,
  RADIOACTIVITYUNIT = 24,
  SOLIDANGLEUNIT = 25,
  THERMODYNAMICTEMPERATUREUNIT = 26,
  TIMEUNIT = 27,
  VOLUMEUNIT = 28,
  USERDEFINED = 29,
}

const IfcUnitEnumCount = 30

export { IfcUnitEnum, IfcUnitEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcUnitEnum =
  new Int32Array( [52,9,15,393,3,20,99] )

let prefixSumAddressIfcUnitEnum =
  new Uint32Array( [0,12,33,43,53,64,88,113,133,149,164,174,185,197,222,235,252,270,289,307,332,362,378,399,417,437,460,476,488,502,525] )

let slotMapIfcUnitEnum =
  new Int32Array( [15,7,27,2,22,8,6,5,25,12,20,11,10,18,29,13,0,24,19,4,26,21,9,16,3,1,14,28,23,17] )

let encodedDataIfcUnitEnum =
  (new TextEncoder()).encode( ".LENGTHUNIT..ELECTRICCURRENTUNIT..TIMEUNIT..AREAUNIT..POWERUNIT..ELECTRICRESISTANCEUNIT..ELECTRICCONDUCTANCEUNIT..ELECTRICCHARGEUNIT..SOLIDANGLEUNIT..FREQUENCYUNIT..MASSUNIT..FORCEUNIT..ENERGYUNIT..MAGNETICFLUXDENSITYUNIT..USERDEFINED..ILLUMINANCEUNIT..ABSORBEDDOSEUNIT..RADIOACTIVITYUNIT..MAGNETICFLUXUNIT..ELECTRICCAPACITANCEUNIT..THERMODYNAMICTEMPERATUREUNIT..PLANEANGLEUNIT..ELECTRICVOLTAGEUNIT..LUMINOUSFLUXUNIT..DOSEEQUIVALENTUNIT..AMOUNTOFSUBSTANCEUNIT..INDUCTANCEUNIT..VOLUMEUNIT..PRESSUREUNIT..LUMINOUSINTENSITYUNIT." )

let IfcUnitEnumSearch =
  new MinimalPerfectHash< IfcUnitEnum >( gMapIfcUnitEnum, prefixSumAddressIfcUnitEnum, slotMapIfcUnitEnum, encodedDataIfcUnitEnum )

export { IfcUnitEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcUnitEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcUnitEnum | undefined {
  return parser.extract< IfcUnitEnum >( IfcUnitEnumSearch, input, cursor, endCursor )
}
