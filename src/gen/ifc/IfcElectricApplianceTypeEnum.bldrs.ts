enum IfcElectricApplianceTypeEnum {
    DISHWASHER = 0,
    ELECTRICCOOKER = 1,
    FREESTANDINGELECTRICHEATER = 2,
    FREESTANDINGFAN = 3,
    FREESTANDINGWATERHEATER = 4,
    FREESTANDINGWATERCOOLER = 5,
    FREEZER = 6,
    FRIDGE_FREEZER = 7,
    HANDDRYER = 8,
    KITCHENMACHINE = 9,
    MICROWAVE = 10,
    PHOTOCOPIER = 11,
    REFRIGERATOR = 12,
    TUMBLEDRYER = 13,
    VENDINGMACHINE = 14,
    WASHINGMACHINE = 15,
    USERDEFINED = 16,
    NOTDEFINED = 17,
}
export { IfcElectricApplianceTypeEnum };

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcElectricApplianceTypeEnum = new Int32Array( [2,34,-6,16,1] );

let prefixSumAddressIfcElectricApplianceTypeEnum = new Uint32Array( [0,12,25,53,69,81,92,105,122,138,154,165,174,199,224,240,254,270,283] );

let slotMapIfcElectricApplianceTypeEnum = new Int32Array( [17,11,2,9,0,10,13,3,15,14,8,6,5,4,7,12,1,16] );

let encodedDataIfcElectricApplianceTypeEnum = (new TextEncoder()).encode( ".NOTDEFINED..PHOTOCOPIER..FREESTANDINGELECTRICHEATER..KITCHENMACHINE..DISHWASHER..MICROWAVE..TUMBLEDRYER..FREESTANDINGFAN..WASHINGMACHINE..VENDINGMACHINE..HANDDRYER..FREEZER..FREESTANDINGWATERCOOLER..FREESTANDINGWATERHEATER..FRIDGE_FREEZER..REFRIGERATOR..ELECTRICCOOKER..USERDEFINED." );

let IfcElectricApplianceTypeEnumSearch = new MinimalPerfectHash< IfcElectricApplianceTypeEnum >( gMapIfcElectricApplianceTypeEnum, prefixSumAddressIfcElectricApplianceTypeEnum, slotMapIfcElectricApplianceTypeEnum, encodedDataIfcElectricApplianceTypeEnum );

export { IfcElectricApplianceTypeEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcElectricApplianceTypeEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcElectricApplianceTypeEnum | undefined
{
    return parser.extract< IfcElectricApplianceTypeEnum >( IfcElectricApplianceTypeEnumSearch, input, cursor, endCursor );
}
