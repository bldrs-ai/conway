import {describe, expect, test} from '@jest/globals'

import fs from 'fs'
import ParsingBuffer from '../parsing/parsing_buffer'
import {ParseResult} from '../step/parsing/step_parser'
import Ifc4x3StepParser from './ifc4x3_step_parser'
import EntityTypesIfc4x3 from './ifc4x3_gen/entity_types_ifc4x3.gen'
import { selectIfcSchemaKind } from './ifc_schema_selection'
import { extractModelInfo } from '../loaders/loading_utilities'

// A small hand-written IFC4X3_RC2 fixture (~1.3 KB, in line with the rest
// of data/) rather than the 394 KB KIT-Simple-Road-Test model: it tests
// exactly the property in question — that a 4X3 file is routed to the 4X3
// schema and its entities resolve to correct EntityTypesIfc4x3 ordinals —
// without vendoring a file ~16x the size of the largest existing fixture.
// Precedent for a hand-written IFC4X3 snippet of this shape (same four
// entities, argument-for-argument) is
// src/compat/web-ifc/ifc4x3_getline_property_corruption.test.ts on the
// sibling branch claude/test-models-corpus-issues-kendhq-ifc4x3.
const ROAD_MODEL_PATH = 'data/ifc4x3_road_entities.ifc'

// Counts verified directly against the fixture:
//   grep -c '^#[0-9]*=IFCROAD(' data/ifc4x3_road_entities.ifc         -> 1
//   grep -c '^#[0-9]*=IFCFACILITYPART(' data/ifc4x3_road_entities.ifc -> 2
//   grep -c '^#[0-9]*=IFCPAVEMENT(' data/ifc4x3_road_entities.ifc     -> 3
//   grep -c '^#[0-9]*=IFCKERB(' data/ifc4x3_road_entities.ifc         -> 4
//   grep -c '^#[0-9]*=IFCFACETEDBREP(' data/ifc4x3_road_entities.ifc  -> 5
// Deliberately distinct per entity so a miscount (e.g. two counts
// transposed) would fail rather than pass by coincidence.
const IFCROAD_COUNT = 1
const IFCFACILITYPART_COUNT = 2
const IFCPAVEMENT_COUNT = 3
const IFCKERB_COUNT = 4
const IFCFACETEDBREP_COUNT = 5

// The 4X3-numbered ordinals for a few entities (see critical facts in the
// dispatch brief): these are what the "never mix them" hazard is about —
// under the IFC4 enum's numbering IFCWALL is 119 and IFCBUILDINGSTOREY is
// 147, and no entity is numbered 492 at all (EntityTypesIfc's highest
// value is 908).
const IFC4X3_IFCROAD_ORDINAL = 492
const IFC4X3_IFCWALL_ORDINAL = 154
const IFC4X3_IFCBUILDINGSTOREY_ORDINAL = 125

/**
 * bldrs-ai/conway#280 phase 2a: entities like IFCROAD, IFCFACILITYPART,
 * IFCPAVEMENT and IFCKERB don't exist in IFC4 at all, so parsing an
 * IFC4X3_RC2 file with the IFC4 schema (this repo's only schema before
 * this phase) necessarily misidentified them. This proves the model layer
 * now assigns the correct, 4X3-numbered entity identities instead. The
 * fixture is a small hand-written IFC4X3_RC2 file — see ROAD_MODEL_PATH
 * above for why. Real-KIT-model coverage is tracked separately; see this
 * file's bottom-of-file note.
 */
describe( 'Ifc4x3StepModel: synthetic road-entities fixture (phase 2a target)', () => {

  test( 'FILE_SCHEMA (IFC4X3_RC2) selects the 4X3 schema kind', () => {

    const data = fs.readFileSync( ROAD_MODEL_PATH )
    const bufferInput = new ParsingBuffer( data )
    const [stepHeader] = Ifc4x3StepParser.Instance.parseHeader( bufferInput )
    const modelInfo = extractModelInfo( stepHeader, data.length )

    expect( modelInfo.schema ).toBe( 'IFC4X3_RC2' )
    expect( selectIfcSchemaKind( modelInfo.schema ) ).toBe( 'ifc4x3' )
  } )

  test( 'parses with correct, 4X3-numbered entity identities', () => {

    const data = fs.readFileSync( ROAD_MODEL_PATH )
    const bufferInput = new ParsingBuffer( data )

    const [, headerResult] = Ifc4x3StepParser.Instance.parseHeader( bufferInput )

    expect( headerResult ).toBe( ParseResult.COMPLETE )

    const [parseResult, model] = Ifc4x3StepParser.Instance.parseDataToModel( bufferInput )

    expect( parseResult ).toBe( ParseResult.COMPLETE )
    expect( model ).not.toBeUndefined()

    if ( model === void 0 ) {

      return
    }

    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCROAD ) ).toBe( IFCROAD_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCFACILITYPART ) )
        .toBe( IFCFACILITYPART_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCPAVEMENT ) ).toBe( IFCPAVEMENT_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCKERB ) ).toBe( IFCKERB_COUNT )
    expect( model.typeIndex.count( EntityTypesIfc4x3.IFCFACETEDBREP ) )
        .toBe( IFCFACETEDBREP_COUNT )

    // Asserting the raw ordinals pins that the parse used 4X3's numbering,
    // not IFC4's — see this file's top-of-file comment.
    expect( EntityTypesIfc4x3.IFCROAD ).toBe( IFC4X3_IFCROAD_ORDINAL )
    expect( EntityTypesIfc4x3.IFCWALL ).toBe( IFC4X3_IFCWALL_ORDINAL )
    expect( EntityTypesIfc4x3.IFCBUILDINGSTOREY ).toBe( IFC4X3_IFCBUILDINGSTOREY_ORDINAL )
  } )
} )

// bldrs-ai/conway#280 phase 2b note: once 4x3 files are extractable
// end-to-end, real-model coverage (the actual KIT-Simple-Road-Test file)
// belongs in the `run-ifc-regression` job's test-models corpus (already
// checked out there and already containing this file), not in this unit
// suite — that job is the one place a multi-hundred-KB fixture doesn't
// weigh down `yarn test`, and it's the existing home for whole-model
// regression coverage. This file stays synthetic/unit-scoped.
