// The IFC4-under-IFC4X3 decode-compatibility table is a generated,
// committed artifact (ifc4x3_ifc4_compat_gen/decode_compat.gen.ts). This
// file keeps it honest in three ways:
//  1. it recomputes the table from the two vendored EXPRESS schemas and
//     requires equality, so the table cannot drift from the schemas, or
//     from a change to the rule in ifc4x3_decode_compat_derive.ts, without
//     a regeneration showing up in review;
//  2. it pins the translation table's EXPRESS-level soundness checks;
//  3. it verifies, on the real generated IFC4 getters, the "rejects loudly"
//     claim that rule (c) rests on. The rule's comment says which getter
//     shapes qualify; these tests are why it says so.
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { deriveIfc4x3DecodeCompat } from './ifc4x3_decode_compat_derive'
import DECODE_COMPAT from './ifc4x3_ifc4_compat_gen/decode_compat.gen'
import { IFC4X3_TO_IFC4_TRANSLATIONS } from './ifc4x3_ifc4_translation'
import { IfcAxis2Placement3D, IfcLocalPlacement, IfcPropertySingleValue } from './ifc4_gen'
import IfcStepParser from './ifc_step_parser'


const IFC4_EXPRESS = 'scripts/schemas/IFC4.exp'
const ADD2_EXPRESS = 'scripts/schemas/IFC4X3_ADD2.exp'


describe( 'IFC4X3 -> IFC4 decode-compatibility table', () => {

  const derived = deriveIfc4x3DecodeCompat(
      fs.readFileSync( IFC4_EXPRESS, 'utf8' ),
      fs.readFileSync( ADD2_EXPRESS, 'utf8' ),
      IFC4X3_TO_IFC4_TRANSLATIONS )

  test( 'the committed table equals a fresh derivation from the EXPRESS ' +
      'schemas (regenerate with `yarn code-gen-ifc4x3-compat`)', () => {

    expect( derived ).toEqual( DECODE_COMPAT )
  } )

  test( 'every translation-table entry passes its EXPRESS-level checks', () => {

    for ( const [ source, problems ] of Object.entries( derived.translationChecks ) ) {
      expect( [ source, problems ] ).toEqual( [ source, [] ] )
    }

    expect( Object.keys( derived.translationChecks ).sort() )
        .toEqual( Object.keys( IFC4X3_TO_IFC4_TRANSLATIONS ).sort() )
  } )

  test( 'each rule fires on the case it was written for', () => {

    // (b) IFC4's IfcStyleAssignmentSelect contains every ADD2
    // IfcPresentationStyle.
    expect( DECODE_COMPAT.relaxed.IFCSTYLEDITEM )
        .toContain( '1 Styles: (b) IFCSTYLEASSIGNMENTSELECT domain superset of IFCPRESENTATIONSTYLE' )

    // (c) required scalar reference widened to IFC4-known point types.
    expect( DECODE_COMPAT.relaxed.IFCAXIS2PLACEMENT3D ).toEqual( [
      '0 Location: (c) IFCPOINT widens IFCCARTESIANPOINT; loud: IFCPOINTONCURVE,IFCPOINTONSURFACE',
    ] )

    // (c) select widened by an IFC4-known defined type, and (d) a rename.
    expect( DECODE_COMPAT.relaxed.IFCPROPERTYSINGLEVALUE ).toEqual( [
      '1 Description: (d) renamed Specification in ADD2',
      '2 NominalValue: (c) IFCVALUE widens IFCVALUE; loud: IFCURIREFERENCE',
    ] )

    for ( const name of [ 'IFCSTYLEDITEM', 'IFCAXIS2PLACEMENT3D', 'IFCPROPERTYSINGLEVALUE' ] ) {
      expect( DECODE_COMPAT.compatible ).toContain( name )
    }

    // Not compatible: ADD2 adds enumeration values IFC4 would silently
    // decode as null.
    expect( DECODE_COMPAT.incompatible.IFCWALL ).toMatch( /IFCWALLTYPEENUM values .*not in IFC4/ )
  } )
} )


/**
 * Parse an IFC4 DATA section (with a minimal header) into a model.
 *
 * @param data DATA-section records.
 * @return {object} The model.
 */
function ifc4Model( data: string ) {

  const text =
    'ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((\'\'),\'2;1\');\n' +
    'FILE_NAME(\'t.ifc\',\'\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
    'FILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n' + data + 'ENDSEC;\nEND-ISO-10303-21;\n'
  const input = new ParsingBuffer( new TextEncoder().encode( text ) )

  IfcStepParser.Instance.parseHeader( input )

  const [ result, model ] = IfcStepParser.Instance.parseDataToModel( input )

  expect( result ).toBe( ParseResult.COMPLETE )

  return model!
}


describe( 'rule (c) rests on these IFC4 getter behaviours', () => {

  const model = ifc4Model(
      '#1=IFCDIRECTION((1.,0.,0.));\n' +
      '#2=IFCCARTESIANPOINT((0.,0.,0.));\n' +
      '#3=IFCAXIS2PLACEMENT3D(#1,$,$);\n' +
      '#4=IFCAXIS2PLACEMENT3D(#2,$,$);\n' +
      '#5=IFCLOCALPLACEMENT(#1,#4);\n' +
      '#6=IFCPROPERTYSINGLEVALUE(\'p\',$,IFCURIREFERENCE(\'urn:x\'),$);\n' +
      '#7=IFCPROPERTYSINGLEVALUE(\'q\',$,IFCLABEL(\'ok\'),$);\n' )

  test( 'a REQUIRED scalar reference to an out-of-domain entity throws', () => {

    const mistyped = model.getElementByExpressID( 3 ) as IfcAxis2Placement3D

    expect( () => mistyped.Location ).toThrow()
    expect( ( model.getElementByExpressID( 4 ) as IfcAxis2Placement3D ).Location.expressID )
        .toBe( 2 )
  } )

  test( 'a select whose members are not enumerations throws for an ' +
      'out-of-domain IFC4 typed value', () => {

    expect( () => ( model.getElementByExpressID( 6 ) as IfcPropertySingleValue ).NominalValue )
        .toThrow( /incorrectly typed/ )
    expect( ( model.getElementByExpressID( 7 ) as IfcPropertySingleValue ).NominalValue )
        .not.toBeNull()
  } )

  // Why an OPTIONAL scalar reference is excluded from rule (c): under the
  // default nullOnErrors, a mistyped target is indistinguishable from `$`.
  test( 'an OPTIONAL scalar reference to an out-of-domain entity reads as ' +
      'null, silently', () => {

    expect( ( model.getElementByExpressID( 5 ) as IfcLocalPlacement ).PlacementRelTo )
        .toBeNull()
  } )
} )
