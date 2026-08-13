// `INF` where a real belongs is not valid ISO 10303-21, but exporters emit it
// for unbounded quantities and the parser recovers from it. The recovery used
// to stamp the offending record's express ID over every top-level entry
// indexed so far in the block, which corrupted every lookup that followed.
//
// It stayed hidden only because no public corpus model reaches this recovery.
// Not because a failed parse is harmless: the stamping ran before the rollback
// and the INF check, so any top-level inline-instance failure poisoned the
// index, and parseDataToModel builds a model from those elements whatever the
// ParseResult. A private model reaches it - `IFCQUANTITYLENGTH(...,INF,$)`
// from a Swiss architectural export - where it cost 3,116 entities and
// produced 630 relationship failures all reporting the same express ID.
// See bldrs-ai/conway#412, #481, #482.
//
// Parser-only, so no geometry wasm is initialized here.
import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ParseResult } from './step_parser'


const parser = IfcStepParser.Instance

// The middle record carries the bare INF. The records around it are ordinary,
// and they are the ones the stamping loop used to overwrite - the bug is not
// in how the INF record itself is read, it is in what reading it does to
// everything already indexed.
// The express IDs under test, kept in one place so the assertions read as
// "the IDs written in the source", which is exactly what the bug destroyed.
const BEFORE_ID = 11
const INF_ID = 22
const AFTER_ID = 33
const EXPECTED_IDS = [ BEFORE_ID, INF_ID, AFTER_ID ]

// One template, one substitution point. Derived with String.replace on a
// whitespace-exact literal, the controls below would silently become copies of
// the INF case the moment anyone reflowed the source - replace() returns its
// input unchanged when the token is absent - and "indexes the same as the
// equivalent record with a real" would degrade to expect(x).toEqual(x), which
// passes even with the bug reinstated.
const VALUE_SLOT = '<<VALUE>>'

const TEMPLATE = [
  `#${BEFORE_ID}= IFCQUANTITYLENGTH('before',$,$,1.5,$);`,
  `#${INF_ID}= IFCQUANTITYLENGTH('unbounded',$,$,${VALUE_SLOT},$);`,
  `#${AFTER_ID}= IFCQUANTITYLENGTH('after',$,$,2.5,$);`,
].join( '\n' )

/**
 * Build the fixture with a given value in the middle record's 4th attribute.
 *
 * @param value The value text to substitute.
 * @return {string} The fixture source.
 */
function withValue( value: string ): string {

  if ( !TEMPLATE.includes( VALUE_SLOT ) ) {
    throw new Error( 'fixture template lost its substitution slot' )
  }

  return TEMPLATE.replace( VALUE_SLOT, value )
}

// Leading whitespace preserved from the real export, since it is what puts an
// identifier-like token where an attribute is expected.
const WITH_INF = withValue( '          INF' )

// The control: whatever the index looks like with an ordinary real is what the
// INF version has to match.
const WITHOUT_INF = withValue( '3.5' )

// The same export writes `-INF` for the opposite bound. Also a CONTROL, not a
// second case of the bug: a leading '-' is dispatched as a number, so it never
// reaches the inline-instance recovery and was never affected. Kept so that
// stays visible - the defect is specific to the bare identifier-like form, and
// anyone reading INF handling should not assume both directions went through
// it.
const WITH_NEGATIVE_INF = withValue( '         -INF' )


/**
 * Parse a data block and return each top-level entry's express ID, in order.
 *
 * @param source The STEP text to parse.
 * @return {number[]} Express IDs as indexed.
 */
function indexedExpressIDs( source: string ): number[] {

  const input = new ParsingBuffer( new TextEncoder().encode( source ) )
  const [ index, result ] = parser.parseDataBlock( input )

  // INCOMPLETE is the expected result for a bare run of records with no
  // ENDSEC; terminator - what matters here is that it is not a syntax error.
  expect( [ ParseResult.COMPLETE, ParseResult.INCOMPLETE ] ).toContain( result )

  return index.elements.map( ( element ) => element.expressID )
}


describe( 'a bare INF attribute', () => {

  test( 'does not stamp its express ID over the records before it', () => {

    expect( indexedExpressIDs( WITH_INF ) ).toEqual( EXPECTED_IDS )
  } )

  test( 'indexes the same as the equivalent record with a real', () => {

    expect( indexedExpressIDs( WITH_INF ) )
      .toEqual( indexedExpressIDs( WITHOUT_INF ) )
  } )

  // Passes with or without the fix, by design - see WITH_NEGATIVE_INF above.
  test( 'negative INF is dispatched as a number and never took this path', () => {

    expect( indexedExpressIDs( WITH_NEGATIVE_INF ) ).toEqual( EXPECTED_IDS )
  } )

  // The whole file has to remain resolvable, not just the index array: a
  // corrupted express ID column makes getElementByExpressID hand back the
  // wrong record, which is how this surfaced as relationship failures rather
  // than as a parse error.
  test( 'every record is still reachable by its own express ID', () => {

    const [ result, model ] =
      parser.parseDataToModel(
        new ParsingBuffer( new TextEncoder().encode( WITH_INF ) ) )

    expect( [ ParseResult.COMPLETE, ParseResult.INCOMPLETE ] ).toContain( result )
    expect( model ).not.toBeUndefined()

    for ( const expressID of EXPECTED_IDS ) {

      const element = model?.getElementByExpressID( expressID )

      expect( element ).not.toBeUndefined()
      expect( element?.expressID ).toBe( expressID )
    }
  } )
} )
