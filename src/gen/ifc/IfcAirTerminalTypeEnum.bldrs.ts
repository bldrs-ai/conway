enum IfcAirTerminalTypeEnum {
    DIFFUSER = 0,
    GRILLE = 1,
    LOUVRE = 2,
    REGISTER = 3,
    USERDEFINED = 4,
    NOTDEFINED = 5,
}
const IfcAirTerminalTypeEnumCount = 6;

export { IfcAirTerminalTypeEnum, IfcAirTerminalTypeEnumCount };

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcAirTerminalTypeEnum = new Int32Array( [50] );

let prefixSumAddressIfcAirTerminalTypeEnum = new Uint32Array( [0,13,21,31,41,53,61] );

let slotMapIfcAirTerminalTypeEnum = new Int32Array( [4,1,0,3,5,2] );

let encodedDataIfcAirTerminalTypeEnum = (new TextEncoder()).encode( ".USERDEFINED..GRILLE..DIFFUSER..REGISTER..NOTDEFINED..LOUVRE." );

let IfcAirTerminalTypeEnumSearch = new MinimalPerfectHash< IfcAirTerminalTypeEnum >( gMapIfcAirTerminalTypeEnum, prefixSumAddressIfcAirTerminalTypeEnum, slotMapIfcAirTerminalTypeEnum, encodedDataIfcAirTerminalTypeEnum );

export { IfcAirTerminalTypeEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcAirTerminalTypeEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcAirTerminalTypeEnum | undefined
{
    return parser.extract< IfcAirTerminalTypeEnum >( IfcAirTerminalTypeEnumSearch, input, cursor, endCursor );
}
