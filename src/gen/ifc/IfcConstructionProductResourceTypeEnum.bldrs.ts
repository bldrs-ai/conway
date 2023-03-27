enum IfcConstructionProductResourceTypeEnum {
    ASSEMBLY = 0,
    FORMWORK = 1,
    USERDEFINED = 2,
    NOTDEFINED = 3,
}
export { IfcConstructionProductResourceTypeEnum };

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcConstructionProductResourceTypeEnum = new Int32Array( [38] );

let prefixSumAddressIfcConstructionProductResourceTypeEnum = new Uint32Array( [0,13,23,33,45] );

let slotMapIfcConstructionProductResourceTypeEnum = new Int32Array( [2,1,0,3] );

let encodedDataIfcConstructionProductResourceTypeEnum = (new TextEncoder()).encode( ".USERDEFINED..FORMWORK..ASSEMBLY..NOTDEFINED." );

let IfcConstructionProductResourceTypeEnumSearch = new MinimalPerfectHash< IfcConstructionProductResourceTypeEnum >( gMapIfcConstructionProductResourceTypeEnum, prefixSumAddressIfcConstructionProductResourceTypeEnum, slotMapIfcConstructionProductResourceTypeEnum, encodedDataIfcConstructionProductResourceTypeEnum );

export { IfcConstructionProductResourceTypeEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcConstructionProductResourceTypeEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcConstructionProductResourceTypeEnum | undefined
{
    return parser.extract< IfcConstructionProductResourceTypeEnum >( IfcConstructionProductResourceTypeEnumSearch, input, cursor, endCursor );
}
