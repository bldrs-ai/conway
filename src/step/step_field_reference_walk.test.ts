/* eslint-disable no-magic-numbers */
// StepModelBase.forEachReferenceInFieldOfTypes, and the two
// populateStyledItemsMap callers built on it (IFC and AP214).
//
// The claim the helper makes is narrow and it is what these tests pin: a
// plain `#n` field is answered from the record bytes WITHOUT materialising
// the record (that is the whole saving — on sp-231MB the old walk built and
// retained an entity per styled item, ~1.6–2.4 s and ~120 MB), and every
// other record reaches the caller's entity path at the same point in the
// walk, so the map a caller fills is identical, insertion order included.
//
// Each schema test therefore checks three things against the pre-helper
// algorithm (copied below as the reference, run on a fresh parse so no memo
// state leaks between the two):
//
//  - the map, as an ordered entry list;
//  - the errors logged (AP214 reports mistyped/dangling items by name);
//  - which styled items were materialised — the plain ones must not be.
//    This is the assertion a revert to `model.types()` fails, since that
//    walk materialises every record.
//
// Fixtures are inline rather than data/ files because the Tier A
// quick-check in build.yml globs data/*.ifc and would demand a golden.
import { describe, expect, test, beforeAll, jest } from '@jest/globals'

import { ConwayGeometry } from '../../dependencies/conway-geom'
import ParsingBuffer from '../parsing/parsing_buffer'
import Logger from '../logging/logger'
import { ParseResult } from './parsing/step_parser'
import { BufferByteSource } from './parsing/byte_source'
import { InMemoryStepByteStore } from './step_buffer_provider'
import IfcStepParser from '../ifc/ifc_step_parser'
import IfcStepModel from '../ifc/ifc_step_model'
import { IfcGeometryExtraction } from '../ifc/ifc_geometry_extraction'
import { IfcCartesianPoint, IfcStyledItem } from '../ifc/ifc4_gen/index'
import { openStreamedIfcModel } from '../ifc/ifc_stream_open'
import AP214StepParser from '../AP214E3_2010/ap214_step_parser'
import AP214StepModel from '../AP214E3_2010/ap214_step_model'
import { AP214GeometryExtraction } from '../AP214E3_2010/ap214_geometry_extraction'
import {
  over_riding_styled_item,
  representation_item,
  styled_item,
} from '../AP214E3_2010/AP214E3_2010_gen/index'


const WASM_INIT_TIMEOUT_MS = 60_000

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )


// #10 / #11 / #14 / #15 are plain; #15 names #1 again, so it overwrites
// #10's value while keeping #10's map position. #11 has whitespace before its
// reference: the parser's stored record address is already past it, so it is
// plain too (and the entity path reads the same reference). #12 is `$` and
// #13 dangles — neither is plain.
const IFC_FIXTURE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('styled-items.ifc','2026-11-02T00:00:00',(''),(''),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1= IFCCARTESIANPOINT((0.,0.,0.));
#2= IFCCARTESIANPOINT((1.,0.,0.));
#3= IFCCARTESIANPOINT((2.,0.,0.));
#9= IFCSURFACESTYLE('s',.BOTH.,());
#10= IFCSTYLEDITEM(#1,(#9),$);
#11= IFCSTYLEDITEM( #2,(#9),$);
#12= IFCSTYLEDITEM($,(#9),$);
#13= IFCSTYLEDITEM(#999,(#9),$);
#14= IFCSTYLEDITEM(#3,(#9),'b');
#15= IFCSTYLEDITEM(#1,(#9),'dup');
ENDSEC;
END-ISO-10303-21;
`

// #10 / #14 are plain styled items, #13 a plain over-riding one (it must
// win #1 over #10). #11 names a PRODUCT, which is not a representation_item,
// and #12 dangles: the typed getter throws for both and the error is logged.
const AP214_FIXTURE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('styled items'),'2;1');
FILE_NAME('styled-items','2026-11-02T00:00:00',('test'),('bldrs'),'','','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 3 1 1 }'));
ENDSEC;
DATA;
#1 = CARTESIAN_POINT('',(0.,0.,0.));
#2 = CARTESIAN_POINT('',(1.,0.,0.));
#3 = PRESENTATION_STYLE_ASSIGNMENT(());
#10 = STYLED_ITEM('',(#3),#1);
#11 = STYLED_ITEM('',(#3),#20);
#12 = STYLED_ITEM('',(#3),#999);
#13 = OVER_RIDING_STYLED_ITEM('',(#3),#1,#10);
#14 = STYLED_ITEM('',(#3),#2);
#20 = PRODUCT('p','p','',());
ENDSEC;
END-ISO-10303-21;
`


/**
 * @param fixture STEP text.
 * @return {IfcStepModel} A fresh resident model.
 */
function parseIfc( fixture: string ): IfcStepModel {

  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer( Buffer.from( fixture, 'utf8' ) )

  expect( parser.parseHeader( input )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( input )

  expect( result ).toBe( ParseResult.COMPLETE )

  return model!
}


/**
 * @param fixture STEP text.
 * @return {AP214StepModel} A fresh resident model.
 */
function parseAP214( fixture: string ): AP214StepModel {

  const parser = AP214StepParser.Instance
  const input = new ParsingBuffer( Buffer.from( fixture, 'utf8' ) )

  expect( parser.parseHeader( input )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( input )

  expect( result ).toBe( ParseResult.COMPLETE )

  return model!
}


/**
 * Record which local IDs the model materialises while `run` executes.
 *
 * @param model The model to watch.
 * @param run The work to watch.
 * @return {Set<number>} Express IDs passed to getElementByLocalID.
 */
function materialisedDuring(
    model: IfcStepModel | AP214StepModel, run: () => void ): Set< number > {

  // One shape for both schemas' models, so the spy needs no union overload.
  type Watched = {
    getElementByLocalID( localID: number ): unknown,
    getExpressIDByLocalID( localID: number ): number | undefined,
  }

  const watched = model as unknown as Watched
  const seen = new Set< number >()
  const original = watched.getElementByLocalID.bind( watched )

  const spy = jest.spyOn( watched, 'getElementByLocalID' ).mockImplementation(
      ( localID: number ) => {
        seen.add( watched.getExpressIDByLocalID( localID )! )
        return original( localID )
      } )

  try {
    run()
  } finally {
    spy.mockRestore()
  }

  return seen
}


/**
 * Capture Logger.error messages while `run` executes.
 *
 * @param run The work to watch.
 * @return {string[]} The messages, in order.
 */
function errorsDuring( run: () => void ): string[] {

  const messages: string[] = []
  const spy = jest.spyOn( Logger, 'error' ).mockImplementation(
      ( ...args: unknown[] ) => {
        messages.push( args.map( String ).join( ' | ' ) )
      } )

  try {
    run()
  } finally {
    spy.mockRestore()
  }

  return messages
}


describe( 'StepModelBase.forEachReferenceInFieldOfTypes', () => {

  test( 'answers plain field-0 references and hands every other record back in walk order', () => {

    const model = parseIfc( IFC_FIXTURE )
    const visits: string[] = []

    model.forEachReferenceInFieldOfTypes(
        [ IfcStyledItem ],
        0,
        ( localID, target ) => {
          visits.push( `ref #${model.getExpressIDByLocalID( localID )}->#${model.getExpressIDByLocalID( target )}` )
        },
        ( localID ) => {
          visits.push( `other #${model.getExpressIDByLocalID( localID )}` )
        } )

    expect( visits ).toEqual( [
      'ref #10->#1',
      'ref #11->#2',
      'other #12',
      'other #13',
      'ref #14->#3',
      'ref #15->#1',
    ] )
  } )

  test( 'locates a non-zero field with the tokenizer, and applies the target type', () => {

    const model = parseAP214( AP214_FIXTURE )
    const visits: string[] = []

    model.forEachReferenceInFieldOfTypes(
        [ styled_item ],
        2,
        ( localID, target ) => {
          visits.push( `ref #${model.getExpressIDByLocalID( localID )}->#${model.getExpressIDByLocalID( target )}` )
        },
        ( localID ) => {
          visits.push( `other #${model.getExpressIDByLocalID( localID )}` )
        },
        representation_item )

    // #11's target (#20, a PRODUCT) resolves but is not a
    // representation_item, so it is not plain under a target type.
    expect( visits ).toEqual( [
      'ref #10->#1',
      'other #11',
      'other #12',
      'ref #14->#2',
    ] )
  } )

  test( 'typeIDIsA follows the prototype chain, not the generated query', () => {

    const model = parseAP214( AP214_FIXTURE )
    const point = model.typeIDOf( model.resolveExpressID( 1 )! )!

    // CARTESIAN_POINT is a geometric_representation_item, which
    // representation_item.query does not list.
    expect( representation_item.query ).not.toContain( point )
    expect( model.typeIDIsA( point, representation_item ) ).toBe( true )
    expect( model.typeIDIsA( point, styled_item ) ).toBe( false )
  } )

  test( 'hands back records whose bytes are not resident on a windowed source', async () => {

    const bytes = Buffer.from( IFC_FIXTURE, 'utf8' )
    const open = openStreamedIfcModel(
        new BufferByteSource( bytes ), new InMemoryStepByteStore( bytes ) )

    expect( open.result ).toBe( ParseResult.COMPLETE )

    const model = open.model!
    const plain: number[] = []
    const other: number[] = []

    const walk = () => {
      plain.length = 0
      other.length = 0
      model.forEachReferenceInFieldOfTypes(
          [ IfcStyledItem ], 0,
          ( localID ) => plain.push( model.getExpressIDByLocalID( localID )! ),
          ( localID ) => other.push( model.getExpressIDByLocalID( localID )! ) )
    }

    // Nothing paged in yet: acquire throws StepBufferNotResidentError for
    // every record, and each is handed back rather than thrown.
    walk()

    expect( plain ).toEqual( [] )
    expect( other ).toEqual( [ 10, 11, 12, 13, 14, 15 ] )

    for ( const expressID of [ 10, 11, 12, 13, 14, 15 ] ) {
      await model.ensureResidentByLocalID( model.resolveExpressID( expressID )! )
    }

    walk()

    expect( plain ).toEqual( [ 10, 11, 14, 15 ] )
    expect( other ).toEqual( [ 12, 13 ] )
  } )

  test( 'IfcCartesianPoint records have no reference in field 0, so all go to the caller', () => {

    const model = parseIfc( IFC_FIXTURE )
    let plain = 0
    let other = 0

    model.forEachReferenceInFieldOfTypes(
        [ IfcCartesianPoint ], 0, () => ++plain, () => ++other )

    expect( plain ).toBe( 0 )
    expect( other ).toBe( 3 )
  } )
} )


describe( 'populateStyledItemsMap on the shared walk', () => {

  test( 'IFC: same map and order as the entity walk, without materialising plain styled items', () => {

    // The pre-helper algorithm, verbatim apart from the map it fills.
    const referenceModel = parseIfc( IFC_FIXTURE )
    const expected = new Map< number, number >()

    for ( const styledItem of referenceModel.types( IfcStyledItem ) ) {

      const itemLocalID = styledItem.extractReferenceLocalID( 0, 0, 1, true )

      if ( itemLocalID !== null ) {
        expected.set( itemLocalID, styledItem.localID )
      }
    }

    const model = parseIfc( IFC_FIXTURE )
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )

    const materialised =
      materialisedDuring( model, () => extraction.populateStyledItemsMap() )

    expect( [ ...extraction.materials.styledItemMap ] ).toEqual( [ ...expected ] )
    // #1 -> #15 (last write), #2 -> #11, #3 -> #14, in first-insertion order.
    expect( [ ...extraction.materials.styledItemMap ].map(
        ( [ item, styled ] ) => [
          model.getExpressIDByLocalID( item ), model.getExpressIDByLocalID( styled ) ] ) )
        .toEqual( [ [ 1, 15 ], [ 2, 11 ], [ 3, 14 ] ] )

    for ( const plain of [ 10, 11, 14, 15 ] ) {
      expect( materialised ).not.toContain( plain )
    }

    for ( const handedBack of [ 12, 13 ] ) {
      expect( materialised ).toContain( handedBack )
    }
  } )

  test( 'AP214: same map, order and logged errors as the entity walk, overriding items still win', () => {

    // The pre-helper algorithm, with the same two log messages.
    const referenceModel = parseAP214( AP214_FIXTURE )
    const expected = new Map< number, number >()
    const expectedErrors: string[] = []

    for ( const styledItem of referenceModel.types( styled_item ) ) {

      if ( styledItem instanceof over_riding_styled_item ) {
        continue
      }

      try {
        expected.set( styledItem.item.localID, styledItem.localID )
      } catch {
        expectedErrors.push( styledItem.toString() )
      }
    }

    for ( const overriding of referenceModel.types( over_riding_styled_item ) ) {

      try {
        expected.set( overriding.item.localID, overriding.localID )
      } catch {
        expectedErrors.push( overriding.toString() )
      }
    }

    const model = parseAP214( AP214_FIXTURE )
    const extraction = new AP214GeometryExtraction( conwayGeometry, model )

    let materialised = new Set< number >()

    const errors = errorsDuring( () => {
      materialised =
        materialisedDuring( model, () => extraction.populateStyledItemsMap() )
    } )

    expect( [ ...extraction.materials.styledItemMap ] ).toEqual( [ ...expected ] )
    expect( [ ...extraction.materials.styledItemMap ].map(
        ( [ item, styled ] ) => [
          model.getExpressIDByLocalID( item ), model.getExpressIDByLocalID( styled ) ] ) )
        .toEqual( [ [ 1, 13 ], [ 2, 14 ] ] )

    // One error per rejected styled item, naming it, in walk order.
    expect( expectedErrors ).toEqual( [ '#11', '#12' ] )
    expect( errors ).toHaveLength( 2 )
    expect( errors[ 0 ] ).toContain( 'Error populating styled item map' )
    expect( errors[ 0 ] ).toContain( '#11' )
    expect( errors[ 1 ] ).toContain( '#12' )

    for ( const plain of [ 10, 13, 14 ] ) {
      expect( materialised ).not.toContain( plain )
    }

    for ( const handedBack of [ 11, 12 ] ) {
      expect( materialised ).toContain( handedBack )
    }
  } )
} )
