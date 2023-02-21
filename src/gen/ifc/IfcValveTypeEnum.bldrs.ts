enum IfcValveTypeEnum {
    AIRRELEASE = 0,
    ANTIVACUUM = 1,
    CHANGEOVER = 2,
    CHECK = 3,
    COMMISSIONING = 4,
    DIVERTING = 5,
    DRAWOFFCOCK = 6,
    DOUBLECHECK = 7,
    DOUBLEREGULATING = 8,
    FAUCET = 9,
    FLUSHING = 10,
    GASCOCK = 11,
    GASTAP = 12,
    ISOLATING = 13,
    MIXING = 14,
    PRESSUREREDUCING = 15,
    PRESSURERELIEF = 16,
    REGULATING = 17,
    SAFETYCUTOFF = 18,
    STEAMTRAP = 19,
    STOPCOCK = 20,
    USERDEFINED = 21,
    NOTDEFINED = 22,
}
export default IfcValveTypeEnum;

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcValveTypeEnum = new Int32Array( [3,1,270,556,-18,9] );

let prefixSumAddressIfcValveTypeEnum = new Uint32Array( [0,8,18,27,34,45,57,68,76,89,100,112,124,140,153,171,181,194,209,227,241,253,261,273] );

let slotMapIfcValveTypeEnum = new Int32Array( [14,20,11,3,5,0,19,12,21,13,1,2,16,7,15,10,6,4,8,18,22,9,17] );

let encodedDataIfcValveTypeEnum = (new TextEncoder()).encode( ".MIXING..STOPCOCK..GASCOCK..CHECK..DIVERTING..AIRRELEASE..STEAMTRAP..GASTAP..USERDEFINED..ISOLATING..ANTIVACUUM..CHANGEOVER..PRESSURERELIEF..DOUBLECHECK..PRESSUREREDUCING..FLUSHING..DRAWOFFCOCK..COMMISSIONING..DOUBLEREGULATING..SAFETYCUTOFF..NOTDEFINED..FAUCET..REGULATING." );

let IfcValveTypeEnumSearch = new MinimalPerfectHash< IfcValveTypeEnum >( gMapIfcValveTypeEnum, prefixSumAddressIfcValveTypeEnum, slotMapIfcValveTypeEnum, encodedDataIfcValveTypeEnum );

export { IfcValveTypeEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcValveTypeEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcValveTypeEnum | undefined
{
    return parser.parse< IfcValveTypeEnum >( IfcValveTypeEnumSearch, input, cursor, endCursor );
}

