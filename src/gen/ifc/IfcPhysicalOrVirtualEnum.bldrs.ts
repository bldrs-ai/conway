enum IfcPhysicalOrVirtualEnum {
    PHYSICAL = 0,
    VIRTUAL = 1,
    NOTDEFINED = 2,
}
const IfcPhysicalOrVirtualEnumCount = 3;

export { IfcPhysicalOrVirtualEnum, IfcPhysicalOrVirtualEnumCount };

import MinimalPerfectHash from '../../../dependencies/conway-ds/src/indexing/minimal_perfect_hash';

let gMapIfcPhysicalOrVirtualEnum = new Int32Array( [1] );

let prefixSumAddressIfcPhysicalOrVirtualEnum = new Uint32Array( [0,10,19,31] );

let slotMapIfcPhysicalOrVirtualEnum = new Int32Array( [0,1,2] );

let encodedDataIfcPhysicalOrVirtualEnum = (new TextEncoder()).encode( ".PHYSICAL..VIRTUAL..NOTDEFINED." );

let IfcPhysicalOrVirtualEnumSearch = new MinimalPerfectHash< IfcPhysicalOrVirtualEnum >( gMapIfcPhysicalOrVirtualEnum, prefixSumAddressIfcPhysicalOrVirtualEnum, slotMapIfcPhysicalOrVirtualEnum, encodedDataIfcPhysicalOrVirtualEnum );

export { IfcPhysicalOrVirtualEnumSearch };



import StepEnumParser from '../../../dependencies/conway-ds/src/parsing/step/step_enum_parser';

const parser = StepEnumParser.Instance;

export function IfcPhysicalOrVirtualEnumDeserializeStep( input: Uint8Array, cursor: number, endCursor: number ): IfcPhysicalOrVirtualEnum | undefined
{
    return parser.extract< IfcPhysicalOrVirtualEnum >( IfcPhysicalOrVirtualEnumSearch, input, cursor, endCursor );
}
