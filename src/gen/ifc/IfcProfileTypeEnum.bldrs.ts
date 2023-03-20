enum IfcProfileTypeEnum {
    CURVE = 0,
    AREA = 1,
}
export { IfcProfileTypeEnum };

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcProfileTypeEnum = new Int32Array( [1] );

let prefixSumAddressIfcProfileTypeEnum = new Uint32Array( [0,7,13] );

let slotMapIfcProfileTypeEnum = new Int32Array( [0,1] );

let encodedDataIfcProfileTypeEnum = (new TextEncoder()).encode( ".CURVE..AREA." );

let IfcProfileTypeEnumSearch = new MinimalPerfectHash< IfcProfileTypeEnum >( gMapIfcProfileTypeEnum, prefixSumAddressIfcProfileTypeEnum, slotMapIfcProfileTypeEnum, encodedDataIfcProfileTypeEnum );

export { IfcProfileTypeEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcProfileTypeEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcProfileTypeEnum | undefined
{
    return parser.extract< IfcProfileTypeEnum >( IfcProfileTypeEnumSearch, input, cursor, endCursor );
}