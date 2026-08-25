import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import Logger, { LogLevelName } from '../logging/logger'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'


/**
 * conway#580: `quietRecoverableLogging` is the flag a PREFIX extraction sets
 * (`ap214PreviewAdapter`, and the store channel's generation build) because a
 * mid-parse snapshot hits dangling records BY CONSTRUCTION. The per-item
 * catch in `prepareDemandExtraction` was the one recoverable-path log in that
 * method that ignored the flag, so a preview generation printed a full stack
 * per failed item — four red errors in an otherwise-healthy Arty load.
 *
 * Both directions are pinned here, because either one alone can be satisfied
 * by a mistake: suppressing unconditionally would pass a "quiet is quiet"
 * test, and reverting the gate would pass a "loud is loud" test.
 */

/**
 * Six items whose first is a MAPPED_ITEM that throws inside the
 * representation-items loop (its REPRESENTATION_MAP's
 * `mapped_representation` points at a CARTESIAN_POINT, so the dereference
 * fails). It is the only fixture in the corpus that drives this catch
 * deterministically — see ap214_demand_unit_slicing.test.ts, which pins the
 * geometry either side of the same failure.
 */
const MAPPED_ITEM_FAILURE_FIXTURE = 'data/ap214-mapped-item-failure.step'

/** The log family the gate is about. */
const ITEM_ERROR_PREFIX = 'Error processing representation item'

const WASM_INIT_TIMEOUT_MS = 60_000
const EXTRACT_TIMEOUT_MS = 120_000

let conwayGeometry: ConwayGeometry

beforeAll( async () => {

  conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )
}, WASM_INIT_TIMEOUT_MS )


/** What a user would have seen on the console for one extraction. */
type ConsoleLine = { level: LogLevelName, message: string }


/**
 * Extract the failing fixture at one `quietRecoverableLogging` setting,
 * capturing the lines Logger would have echoed to the console.
 *
 * The whole extraction runs, not just the prep: the per-item catch lives in
 * the demand-unit THUNK `prepareDemandExtraction` builds, so nothing enters
 * it until the units are pulled.
 *
 * The sink is swapped rather than read back out of the buffer because the
 * console echo is the thing the issue is about, and swapping it also keeps
 * the (deliberately noisy) loud case out of the test run's own output.
 *
 * @param quietRecoverableLogging Value for the extraction's flag.
 * @return {[ConsoleLine[], number]} Echoed lines, and the unit count — the
 * latter to show the two runs did the same work, not just the same logging.
 */
function extractAt(
    quietRecoverableLogging: boolean ): [ ConsoleLine[], number ] {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( MAPPED_ITEM_FAILURE_FIXTURE ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , model ] = parser.parseDataToModel( buffer )

  expect( model ).not.toBe( void 0 )

  const extraction = new AP214GeometryExtraction( conwayGeometry, model! )

  extraction.quietRecoverableLogging = quietRecoverableLogging

  const lines: ConsoleLine[] = []

  // Only the FIRST occurrence of a distinct message echoes, so the buffer
  // has to start empty or a repeat from an earlier test would be swallowed.
  Logger.clearLogs()
  Logger.setSink( ( level, message ) => {
    lines.push( { level, message } )
  } )

  try {
    extraction.prepareDemandExtraction()

    expect( extraction.extractAP214GeometryData()[0] ).toBe( ExtractResult.COMPLETE )
  } finally {
    Logger.setSink()
    Logger.clearLogs()
  }

  return [ lines, extraction.demandUnitCount ]
}


/**
 * The echoed lines belonging to the per-item catch.
 *
 * @param lines Everything echoed during one run.
 * @return {ConsoleLine[]} Just the representation-item errors.
 */
function itemErrors( lines: ConsoleLine[] ): ConsoleLine[] {
  return lines.filter( ( line ) => line.message.startsWith( ITEM_ERROR_PREFIX ) )
}


describe( 'quietRecoverableLogging gates the per-item error log', () => {

  test( 'a normal load still prints the error, with its stack', () => {

    const [ lines ] = extractAt( false )
    const errors = itemErrors( lines )

    expect( errors.length ).toBeGreaterThan( 0 )
    expect( errors[ 0 ].level ).toBe( 'error' )

    // The stack is what the comment at the log site is defending: this
    // family's message text is constant, so without frames there is nothing
    // to tell one occurrence from another.
    expect( errors[ 0 ].message ).toMatch( /\n\s+at .+/ )
  }, EXTRACT_TIMEOUT_MS )

  test( 'a prefix/preview extraction prints nothing for the same failure', () => {

    const [ loudLines, loudUnits ] = extractAt( false )
    const [ quietLines, quietUnits ] = extractAt( true )

    expect( itemErrors( loudLines ).length ).toBeGreaterThan( 0 )
    expect( itemErrors( quietLines ) ).toStrictEqual( [] )

    // Same walk, same failure, same units — only the logging differs.
    expect( quietUnits ).toBe( loudUnits )
  }, EXTRACT_TIMEOUT_MS )
} )
