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
 * conway#708 / bldrs-ai/ops#28: a reference the schema cannot resolve skips
 * an entity, it does not end a load — and the skip is counted and named.
 *
 * The path is the STEP demand pump. A demand unit is an opaque closure, so
 * when the thunk behind one rethrew an untypeable `representation.items`,
 * the pump's catch could only say *"Error processing demand unit: Value in
 * STEP was incorrectly typed"* — an error-level diagnostic naming no
 * entity, which is what Sentry SHARE-1P2 is 100% made of. Reported at the
 * thunk instead, where the owning representation is still in hand, the same
 * load says which records it dropped.
 *
 * Measured against the real file this fixture is cut from: before,
 * `node scripts/debug/model_report.mjs nist_ftc_08_asme1_ap242-e1-tg.stp`
 * printed `1x error: Error processing demand unit:`; after, `1x error:
 * Skipping representation items with an unresolved or mistyped STEP
 * reference` with `expressID: 25231`. Geometry is unchanged either way
 * (TESSELLATED_SOLID×1) — the thunk already unwound its transform state
 * before the rethrow (test-models#62), so only the reporting moved.
 */

/**
 * Two free-root representations whose `items` cannot be read — one over a
 * TESSELLATED_SHELL the AP214 loader has no class for (the NIST shape,
 * #25231 there), one over a reference that is not in the file — beside the
 * tessellated solid that must still render. See the fixture's own header.
 */
const FIXTURE = 'data/ap242-untypeable-representation-item.step'

/** The two representations the fixture expects to be skipped. */
const SKIPPED_REPRESENTATIONS = [ '811', '821' ]

const WASM_INIT_TIMEOUT_MS = 60_000
const EXTRACT_TIMEOUT_MS = 120_000

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )

beforeEach( () => {
  // Logger's buffer is static, and it is the assertion subject here.
  Logger.clearLogs()

  // Diverted, not silenced: every assertion below reads the buffer, which
  // the sink does not feed, so the expected diagnostics stay checkable while
  // the test console stays clean.
  Logger.setSink( () => { /* diverted — the buffer is what is asserted */ } )
} )

afterEach( () => {
  Logger.setSink()
  Logger.clearLogs()
} )

/**
 * Extract the fixture through the ordinary whole-model walk, which runs
 * every demand unit in order (see `prepareDemandExtraction`).
 *
 * @return {number} Placed geometry instances the scene ended up with.
 */
function extractFixture(): number {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  const extraction = new AP214GeometryExtraction( conwayGeometry, model! )
  const [ result, scene ] = extraction.extractAP214GeometryData()

  expect( result ).toBe( ExtractResult.COMPLETE )

  let placed = 0

  for ( const _instance of scene.walk() ) {
    ++placed
  }

  return placed
}

describe( 'untypeable representation items in the demand pump (conway#708)', () => {

  test( 'the load completes and the intact representation still renders',
      () => {

        // One placed instance: #530's tessellated solid, through #540. The
        // two skipped representations contribute nothing, which is the
        // whole cost of the skip — a fixture that rendered zero would pass
        // "no throw" while having lost the model.
        expect( extractFixture() ).toBe( 1 )
      }, EXTRACT_TIMEOUT_MS )

  test( 'both skips land in one counted, data-defect-marked diagnostic named ' +
    'by representation', () => {

    extractFixture()

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )

    const [ defect ] = defects

    expect( defect.category ).toBe( DATA_DEFECT )

    // Count 2 from one entry is the claim that the old message could not
    // make: it interpolated the error, and DanglingReferenceError writes
    // "#9999" into its own message, so #821 and #811 would have been two
    // entries of count 1 with nothing to add up.
    expect( defect.count ).toBe( SKIPPED_REPRESENTATIONS.length )
    expect( [ ...defect.expressIDs ].sort() ).toEqual( SKIPPED_REPRESENTATIONS )
  }, EXTRACT_TIMEOUT_MS )

  test( 'nothing reaches the pump\'s unnamed demand-unit channel', () => {

    extractFixture()

    // The generic catch in extractDemandUnitBatch is still there, and still
    // the right home for a throw nothing has classified — but a data defect
    // reaching it means the entity identity was lost on the way, which is
    // the defect this change is about. Asserting its absence is what keeps
    // the classification from silently regressing into "reported twice, once
    // usefully".
    const unnamed = Logger.getLogs().filter(
        ( entry ) => entry.message.includes( 'processing demand unit' ) )

    expect( unnamed ).toEqual( [] )
  }, EXTRACT_TIMEOUT_MS )
} )
