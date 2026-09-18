/* This is generated code, don't alter */
enum IfcRoleEnum {
  ARCHITECT = 0,
  BUILDINGOPERATOR = 1,
  BUILDINGOWNER = 2,
  CIVILENGINEER = 3,
  CLIENT = 4,
  COMMISSIONINGENGINEER = 5,
  CONSTRUCTIONMANAGER = 6,
  CONSULTANT = 7,
  CONTRACTOR = 8,
  COSTENGINEER = 9,
  ELECTRICALENGINEER = 10,
  ENGINEER = 11,
  FACILITIESMANAGER = 12,
  FIELDCONSTRUCTIONMANAGER = 13,
  MANUFACTURER = 14,
  MECHANICALENGINEER = 15,
  OWNER = 16,
  PROJECTMANAGER = 17,
  RESELLER = 18,
  STRUCTURALENGINEER = 19,
  SUBCONTRACTOR = 20,
  SUPPLIER = 21,
  USERDEFINED = 22,
}

const IfcRoleEnumCount = 23

export { IfcRoleEnum, IfcRoleEnumCount }

/* This is generated code, don't alter */
import MinimalPerfectHash from '../../indexing/minimal_perfect_hash'

let gMapIfcRoleEnum =
  new Int32Array( [32,1,81,8,34,483] )

let prefixSumAddressIfcRoleEnum =
  new Uint32Array( [0,15,26,42,63,76,96,122,137,145,155,175,189,203,223,233,251,274,281,296,306,318,330,349] )

let slotMapIfcRoleEnum =
  new Int32Array( [2,0,17,6,22,15,13,3,4,21,10,9,14,19,11,1,5,16,20,18,7,8,12] )

let encodedDataIfcRoleEnum =
  (new TextEncoder()).encode( ".BUILDINGOWNER..ARCHITECT..PROJECTMANAGER..CONSTRUCTIONMANAGER..USERDEFINED..MECHANICALENGINEER..FIELDCONSTRUCTIONMANAGER..CIVILENGINEER..CLIENT..SUPPLIER..ELECTRICALENGINEER..COSTENGINEER..MANUFACTURER..STRUCTURALENGINEER..ENGINEER..BUILDINGOPERATOR..COMMISSIONINGENGINEER..OWNER..SUBCONTRACTOR..RESELLER..CONSULTANT..CONTRACTOR..FACILITIESMANAGER." )

let IfcRoleEnumSearch =
  new MinimalPerfectHash< IfcRoleEnum >( gMapIfcRoleEnum, prefixSumAddressIfcRoleEnum, slotMapIfcRoleEnum, encodedDataIfcRoleEnum )

export { IfcRoleEnumSearch }


/* This is generated cold, don't alter */
import StepEnumParser from '../../step/parsing/step_enum_parser'

const parser = StepEnumParser.Instance

export function IfcRoleEnumDeserializeStep(
  input: Uint8Array,
  cursor: number,
  endCursor: number ): IfcRoleEnum | undefined {
  return parser.extract< IfcRoleEnum >( IfcRoleEnumSearch, input, cursor, endCursor )
}
