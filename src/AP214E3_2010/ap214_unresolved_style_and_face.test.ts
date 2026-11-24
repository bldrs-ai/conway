import fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import Logger, { DATA_DEFECT } from '../logging/logger'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import AP214StepParser from './ap214_step_parser'


/**
 * conway#708's audit half: the two paths that already logged and continued
 * on an unresolved reference — styled-item map population (Sentry SHARE-1NA,
 * a SolidWorks 2020 export, 7 users) and `ADVANCED_FACE` extraction (Sentry
 * SHARE-1NB).
 *
 * Neither ever threw, so the acceptance question for them was whether the
 * skip is COUNTED and the entity cleanly omitted. It was not counted: both
 * wrote the caught error into the message, and Logger dedups on the
 * message, so a `DanglingReferenceError` — which spells the missing express
 * ID into its own text — gave every bad record its own entry with `count`
 * stuck at 1. These tests pin the counted form and the marker; the fact
 * that a skipped face still leaves an empty geometry placed for its body is
 * pre-existing and deliberately left alone (changing it moves regression
 * digests).
 */

/**
 * A styled item and an advanced face whose references are absent from the
 * file, beside the tessellated solid that must still render. See the
 * fixture's own header for the express ids.
 */
const FIXTURE = 'data/ap242-unresolved-style-and-face.step'

/** `styled_item.toString()` for #900 — a reference, not an internal index. */
const STYLED_ITEM_REFERENCE = '#900'

/** The advanced face whose only bound does not resolve. */
const FACE_EXPRESS_ID = '912'

const WASM_INIT_TIMEOUT_MS = 60_000
const EXTRACT_TIMEOUT_MS = 120_000

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )

beforeEach( () => {
  Logger.clearLogs()

  // Diverted, not silenced: the assertions read the buffer, which the sink
  // does not feed.
  Logger.setSink( () => { /* diverted — the buffer is what is asserted */ } )
} )

afterEach( () => {
  Logger.setSink()
  Logger.clearLogs()
} )

/**
 * Run the whole-model walk over the fixture.
 */
function extractFixture(): void {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  const extraction = new AP214GeometryExtraction( conwayGeometry, model! )
  const [ result ] = extraction.extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )
}

describe( 'already-permissive skips are counted and marked (conway#708)', () => {

  test( 'the styled-item map skip names its record and carries the marker', () => {

    extractFixture()

    const defect = Logger.getDataDefects().find(
        ( entry ) => entry.message.startsWith( 'Error populating styled item map' ) )

    expect( defect ).toBeDefined()
    expect( defect!.category ).toBe( DATA_DEFECT )
    expect( [ ...defect!.expressIDs ] ).toEqual( [ STYLED_ITEM_REFERENCE ] )

    // The message no longer carries the error, which is what makes `count`
    // a number: two bad styled items in one file now share this entry
    // instead of opening one each.
    expect( defect!.message ).not.toContain( 'not in the index' )
  }, EXTRACT_TIMEOUT_MS )

  test( 'the face skip names its record and carries the marker', () => {

    extractFixture()

    const defect = Logger.getDataDefects().find(
        ( entry ) => entry.message.startsWith( 'Skipping face' ) )

    expect( defect ).toBeDefined()
    expect( defect!.category ).toBe( DATA_DEFECT )
    expect( [ ...defect!.expressIDs ] ).toEqual( [ FACE_EXPRESS_ID ] )

    // The face TYPE stays in the message — it is a bounded vocabulary, so
    // it costs no dedup — while the per-throw stack and message that used to
    // follow it are gone.
    expect( defect!.message ).toContain( 'ADVANCED_FACE' )
    expect( defect!.message ).not.toContain( 'at ' )
  }, EXTRACT_TIMEOUT_MS )

  test( 'nothing in this load is reported as an unclassified engine error', () => {

    extractFixture()

    // Both defects are the file's, and both are marked as such. An error
    // entry without the marker here would mean conway is blaming itself for
    // a bad reference — which is the triage noise ops#28 exists to end.
    const unmarked = Logger.getErrors().filter(
        ( entry ) => entry.category !== DATA_DEFECT )

    expect( unmarked ).toEqual( [] )
  }, EXTRACT_TIMEOUT_MS )
} )
