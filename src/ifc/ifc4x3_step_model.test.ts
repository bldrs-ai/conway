import {describe, expect, test} from '@jest/globals'

import fs from 'fs'
import ParsingBuffer from '../parsing/parsing_buffer'
import {ParseResult} from '../step/parsing/step_parser'
import Ifc4x3StepParser from './ifc4x3_step_parser'
import EntityTypesIfc4x3 from './ifc4x3_gen/entity_types_ifc4x3.gen'
import { selectIfcSchemaKind } from './ifc_schema_selection'
import { extractModelInfo } from '../loaders/loading_utilities'

const KIT_ROAD_MODEL_PATH = '/home/user/models/KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc'

// Counts verified directly against the file (grep '^#n = IFCXXX(') — see
// this task's dispatch brief for the exact figures.
const KIT_IFCROAD_COUNT = 1
const KIT_IFCFACILITYPART_COUNT = 51
const KIT_IFCPAVEMENT_COUNT = 39
const KIT_IFCKERB_COUNT = 27
const KIT_IFCFACETEDBREP_COUNT = 66

// The 4X3-numbered ordinals for a few entities (see critical facts in the
// dispatch brief): these are what the "never mix them" hazard is about —
// under the IFC4 enum's numbering IFCWALL is 119 and IFCBUILDINGSTOREY is
// 147, and no entity is numbered 492 at all (EntityTypesIfc's highest
// value is 908).
const IFC4X3_IFCROAD_ORDINAL = 492
const IFC4X3_IFCWALL_ORDINAL = 154
const IFC4X3_IFCBUILDINGSTOREY_ORDINAL = 125

/**
 * bldrs-ai/conway#280 phase 2a: the KIT road model is the phase's stated
 * target — an IFC4X3_RC2 file whose entities (IFCROAD, IFCFACILITYPART,
 * IFCPAVEMENT, IFCKERB) don't exist in IFC4 at all, so parsing it with the
 * IFC4 schema (this repo's only schema before this phase) necessarily
 * misidentified them. This proves the model layer now assigns the correct,
 * 4X3-numbered entity identities instead.
 */
describe( 'Ifc4x3StepModel: KIT road model (phase 2a target)', () => {

  test( 'FILE_SCHEMA (IFC4X3_RC2) selects the 4X3 schema kind', () => {

    const data = fs.readFileSync( KIT_ROAD_MODEL_PATH )
    const bufferInput = new ParsingBuffer( data )
    const [stepHeader] = Ifc4x3StepParser.Instance.parseHeader( bufferInput )
    const modelInfo = extractModelInfo( stepHeader, data.length )

    expect( modelInfo.schema ).toBe( 'IFC4X3_RC2' )
    expect( selectIfcSchemaKind( modelInfo.schema ) ).toBe( 'ifc4x3' )
  } )

  test( 'parses with correct, 4X3-numbered entity identities', () => {

    const data = fs.readFileSync( KIT_ROAD_MODEL_PATH )
    const bufferInput = new ParsingBuffer( data )

    const [, headerResult] = Ifc4x3StepParser.Instance.parseHeader( bufferInput )

    expect( headerResult ).toBe( ParseResult.COMPLETE )

    const [parseResult, model] = Ifc4x3StepParser.Instance.parseDataToModel( bufferInput )

    expect( parseResult ).toBe( ParseResult.COMPLETE )
    expect( model ).not.toBeUndefined()

    if ( model === void 0 ) {

      return
    }

    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCROAD ) ).toBe( KIT_IFCROAD_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCFACILITYPART ) )
        .toBe( KIT_IFCFACILITYPART_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCPAVEMENT ) ).toBe( KIT_IFCPAVEMENT_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCKERB ) ).toBe( KIT_IFCKERB_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCFACETEDBREP ) )
        .toBe( KIT_IFCFACETEDBREP_COUNT )

    // Asserting the raw ordinals pins that the parse used 4X3's numbering,
    // not IFC4's — see this file's top-of-file comment.
    expect( EntityTypesIfc4x3.IFCROAD ).toBe( IFC4X3_IFCROAD_ORDINAL )
    expect( EntityTypesIfc4x3.IFCWALL ).toBe( IFC4X3_IFCWALL_ORDINAL )
    expect( EntityTypesIfc4x3.IFCBUILDINGSTOREY ).toBe( IFC4X3_IFCBUILDINGSTOREY_ORDINAL )
  } )
} )
