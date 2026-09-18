import {describe, expect, test} from '@jest/globals'

import {
  UnrecognizedIfc4x3SchemaError,
  selectIfcSchemaKind,
  selectIfcSchemaKindForHeader,
} from './ifc_schema_selection'
import { StepHeader } from '../step/parsing/step_parser'

/**
 * Build a minimal StepHeader carrying only a FILE_SCHEMA entry, in the raw
 * (unparsed) shape `stepHeader.headers.get('FILE_SCHEMA')` returns it
 * (e.g. `('IFC4')` or `('IFC4','IFC4X3_ADD2')`).
 *
 * @param fileSchemaRaw The raw FILE_SCHEMA header value.
 * @return {StepHeader} A header exposing just that one entry.
 */
function headerWithSchema( fileSchemaRaw: string ): StepHeader {

  return { headers: new Map( [['FILE_SCHEMA', fileSchemaRaw]] ) }
}

describe( 'selectIfcSchemaKind', () => {

  test( 'undefined is treated as ifc4 (historical fallback)', () => {

    expect( selectIfcSchemaKind( void 0 ) ).toBe( 'ifc4' )
  } )

  test( 'IFC4 selects ifc4', () => {

    expect( selectIfcSchemaKind( 'IFC4' ) ).toBe( 'ifc4' )
  } )

  test( 'a non-4X3 unrecognised identifier still falls back to ifc4', () => {

    // Matches this repo's historical, only-ever-IFC4 behaviour for
    // anything that isn't 4X3-family — e.g. IFC2X3.
    expect( selectIfcSchemaKind( 'IFC2X3' ) ).toBe( 'ifc4' )
  } )

  test( 'each recognised 4X3-family identifier selects ifc4x3', () => {

    expect( selectIfcSchemaKind( 'IFC4X3' ) ).toBe( 'ifc4x3' )
    expect( selectIfcSchemaKind( 'IFC4X3_RC2' ) ).toBe( 'ifc4x3' )
    expect( selectIfcSchemaKind( 'IFC4X3_ADD2' ) ).toBe( 'ifc4x3' )
    expect( selectIfcSchemaKind( 'IFC4X3_TC1' ) ).toBe( 'ifc4x3' )
  } )

  test( 'is case-insensitive', () => {

    expect( selectIfcSchemaKind( 'ifc4x3_rc2' ) ).toBe( 'ifc4x3' )
  } )

  // codex review of bldrs-ai/conway#713 (P1): an unrecognised 4X3-family
  // spelling (another release-candidate/addendum label, a future
  // corrigendum) must fail closed, never silently fall back to IFC4 —
  // that fallback would reinterpret the file's reordered 4X3 entity space
  // under IFC4's ordinals with no error at all.
  test( 'an unrecognised 4X3-family identifier throws rather than falling back', () => {

    expect( () => selectIfcSchemaKind( 'IFC4X3_ADD1' ) )
        .toThrow( UnrecognizedIfc4x3SchemaError )
    expect( () => selectIfcSchemaKind( 'IFC4X3_RC1' ) )
        .toThrow( /IFC4X3_RC1/ )
  } )
} )

describe( 'selectIfcSchemaKindForHeader', () => {

  test( 'a single-entry IFC4 header selects ifc4', () => {

    expect( selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4')" ) ) )
        .toBe( 'ifc4' )
  } )

  test( 'a single-entry IFC4X3_RC2 header selects ifc4x3', () => {

    expect( selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4X3_RC2')" ) ) )
        .toBe( 'ifc4x3' )
  } )

  // codex review of #713 (P2): extractModelInfo/ModelInfo.schema only keeps
  // a FILE_SCHEMA header's FIRST quoted entry, so a multi-entry header
  // naming IFC4X3 second (or later) must still be caught here even though
  // it would be invisible to plain selectIfcSchemaKind(modelInfo.schema).
  test( 'a multi-entry header selects ifc4x3 when ANY entry is 4X3-family, ' +
      'regardless of position', () => {

    expect( selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4','IFC4X3_ADD2')" ) ) )
        .toBe( 'ifc4x3' )
    expect( selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4X3_ADD2','IFC4')" ) ) )
        .toBe( 'ifc4x3' )
  } )

  test( 'a multi-entry header with no 4X3-family entry selects ifc4', () => {

    expect( selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4','IFC2X3')" ) ) )
        .toBe( 'ifc4' )
  } )

  test( 'an unrecognised 4X3-family entry anywhere in a multi-entry header ' +
      'throws rather than being silently accepted alongside a plain IFC4 entry', () => {

    expect( () => selectIfcSchemaKindForHeader( headerWithSchema( "('IFC4','IFC4X3_ADD1')" ) ) )
        .toThrow( UnrecognizedIfc4x3SchemaError )
  } )

  test( 'a header with no FILE_SCHEMA entry selects ifc4', () => {

    expect( selectIfcSchemaKindForHeader( { headers: new Map() } ) ).toBe( 'ifc4' )
  } )
} )
