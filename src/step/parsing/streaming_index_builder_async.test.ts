/* eslint-disable no-magic-numbers */
// The cooperative streamed columnar build must be byte-identical to the
// synchronous build (same columns, same window mechanics) AND actually
// yield to the event loop mid-parse — the repaint/no-stall property
// (#301 §2) the streamed open path relies on. The parse generator only
// suspends every PARSE_PROGRESS_ELEMENT_MASK+1 (4096) records, so the
// yield/progress assertions use a synthesized >4096-record model; the
// column-parity assertions use the real fixture.
import fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import { BufferByteSource } from './byte_source'
import {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
} from './streaming_index_builder'
import { ParseResult } from './step_parser'

const POOL = 8 * 1024 // small window → forces slides on both inputs

/**
 * Synthesize a valid IFC4 file with `recordCount` simple records — enough
 * to cross the parser's progress-suspension mask several times.
 *
 * @param recordCount Number of data records.
 * @return {Uint8Array} The encoded file.
 */
function syntheticIfc( recordCount: number ): Uint8Array {

  const parts: string[] = [
    'ISO-10303-21;\nHEADER;\n' +
    'FILE_DESCRIPTION((\'\'),\'2;1\');\n' +
    'FILE_NAME(\'\',\'\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
    'FILE_SCHEMA((\'IFC4\'));\nENDSEC;\nDATA;\n',
  ]

  for ( let where = 1; where <= recordCount; ++where ) {
    parts.push( `#${where}=IFCCARTESIANPOINT((${where}.,0.,0.));\n` )
  }

  parts.push( 'ENDSEC;\nEND-ISO-10303-21;\n' )

  return new TextEncoder().encode( parts.join( '' ) )
}

describe( 'buildColumnarIndexStreamingAsync', () => {

  test( 'produces identical columns to the sync build (real fixture)', async () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const parser = IfcStepParser.Instance

    const sync = buildColumnarIndexStreaming(
        new BufferByteSource( bytes ), parser, POOL )
    const cooperative = await buildColumnarIndexStreamingAsync(
        new BufferByteSource( bytes ), parser, POOL, void 0, void 0, 0 )

    expect( sync.result ).toBe( ParseResult.COMPLETE )
    expect( cooperative.result ).toBe( ParseResult.COMPLETE )

    const a = sync.columns
    const b = cooperative.columns

    expect( b.count ).toBe( a.count )
    expect( b.firstInlineElement ).toBe( a.firstInlineElement )
    expect( Array.from( b.address ) ).toEqual( Array.from( a.address ) )
    expect( Array.from( b.length ) ).toEqual( Array.from( a.length ) )
    expect( Array.from( b.typeID ) ).toEqual( Array.from( a.typeID ) )
    expect( Array.from( b.expressID ) ).toEqual( Array.from( a.expressID ) )

    // Same window mechanics (slides prove the moving window really moved).
    expect( cooperative.stats.slides ).toBe( sync.stats.slides )
    expect( cooperative.stats.slides ).toBeGreaterThan( 0 )
  }, 60000 )

  test( 'yields to the event loop and reports absolute progress mid-parse', async () => {

    const bytes = syntheticIfc( 10000 )
    const parser = IfcStepParser.Instance

    // Count macrotask turns that run while the build is in flight — with a
    // zero yield interval the parse must give the event loop real turns.
    let turns = 0
    let pumping = true
    const pump = (): void => {
      if ( !pumping ) {
        return
      }
      ++turns
      setTimeout( pump, 0 )
    }
    setTimeout( pump, 0 )

    const progressCursors: number[] = []

    const cooperative = await buildColumnarIndexStreamingAsync(
        new BufferByteSource( bytes ), parser, POOL,
        void 0, ( cursor ) => progressCursors.push( cursor ), 0 )

    pumping = false

    expect( cooperative.result ).toBe( ParseResult.COMPLETE )
    expect( cooperative.columns.count ).toBe( 10000 )
    expect( turns ).toBeGreaterThan( 0 )

    // Progress reports absolute source cursors: monotonically
    // non-decreasing, bounded by the file size, and past the first window —
    // the window-relative → absolute translation must hold across slides.
    expect( progressCursors.length ).toBeGreaterThan( 1 )
    for ( let where = 1; where < progressCursors.length; ++where ) {
      expect( progressCursors[ where ] )
          .toBeGreaterThanOrEqual( progressCursors[ where - 1 ] )
    }
    expect( progressCursors[ progressCursors.length - 1 ] )
        .toBeLessThanOrEqual( bytes.byteLength )
    expect( progressCursors[ progressCursors.length - 1 ] )
        .toBeGreaterThan( POOL )

    // And the synthetic build matches its own sync twin exactly.
    const sync = buildColumnarIndexStreaming(
        new BufferByteSource( bytes ), parser, POOL )

    expect( Array.from( cooperative.columns.address ) )
        .toEqual( Array.from( sync.columns.address ) )
    expect( Array.from( cooperative.columns.expressID ) )
        .toEqual( Array.from( sync.columns.expressID ) )
    expect( cooperative.stats.slides ).toBe( sync.stats.slides )
  }, 60000 )
} )
