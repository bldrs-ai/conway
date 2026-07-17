/* eslint-disable no-magic-numbers */
// M0 spike: streaming index build must be byte-identical to the resident
// parse. The parser reads file-absolute addresses and only rewinds within a
// single top-level record, so feeding it from a moving window that slides at
// record boundaries must produce the exact same index columns — at every
// pool size, including one small enough to force many slides + straddles.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { BufferByteSource } from './byte_source'
import { buildIndexStreaming } from './streaming_index_builder'
import { ParseResult, StepIndexEntry } from './step_parser'

import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'

/**
 * Flatten the index (top-level records + their inline / multi-mapping
 * children) into a stable, comparable column dump: every field the streaming
 * parse must reproduce identically.
 *
 * @param elements The index elements.
 * @return {object[]} A flat list of column tuples in traversal order.
 */
function columns( elements: StepIndexEntry<EntityTypesIfc>[] ): object[] {
  const out: object[] = []

  const visit = ( e: any ): void => {
    out.push( {
      address: e.address,
      length: e.length,
      typeID: e.typeID,
      expressID: e.expressID ?? null,
    } )
    for ( const child of e.inlineEntities ?? [] ) {
      visit( child )
    }
    for ( const child of e.multiMapping ?? [] ) {
      visit( child )
    }
  }

  for ( const e of elements ) {
    visit( e )
  }

  return out
}

let bytes: Uint8Array
let residentColumns: object[]
let residentCount: number

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

  const input = new ParsingBuffer( bytes )
  IfcStepParser.Instance.parseHeader( input )
  const [ index, result ] = IfcStepParser.Instance.parseDataBlock( input )

  expect( result ).toBe( ParseResult.COMPLETE )

  residentColumns = columns( index.elements )
  residentCount = index.elements.length
} )

describe( 'buildIndexStreaming', () => {

  // A tiny pool relative to the 18 KB fixture forces repeated slides and at
  // least one record straddling a window boundary; a large one takes the
  // whole file in a single window (no slide). Both must match the resident
  // parse exactly.
  const POOLS = [ 4 * 1024, 8 * 1024, 16 * 1024, 128 * 1024 ]

  test.each( POOLS )( 'produces the resident index at pool=%d bytes', ( pool ) => {
    const source = new BufferByteSource( bytes )
    const result = buildIndexStreaming( source, IfcStepParser.Instance, pool )

    expect( result.result ).toBe( ParseResult.COMPLETE )
    expect( result.elements.length ).toBe( residentCount )
    expect( columns( result.elements ) ).toEqual( residentColumns )
  } )

  test( 'the small pool actually slides the window (straddle exercised)', () => {
    const source = new BufferByteSource( bytes )
    const result = buildIndexStreaming( source, IfcStepParser.Instance, 4 * 1024 )

    // 18 KB fixture through a 4 KB window must slide several times.
    expect( result.stats.slides ).toBeGreaterThan( 1 )
    // Physical window never grew past the pool (no record exceeds it).
    expect( result.stats.windowBytes ).toBe( 4 * 1024 )
    // Every byte read once (no growth re-reads) — bounded to file size.
    expect( result.stats.bytesRead ).toBe( bytes.length )
  } )

  test( 'the large pool takes the whole file in one window (no slide)', () => {
    const source = new BufferByteSource( bytes )
    const result = buildIndexStreaming( source, IfcStepParser.Instance, 128 * 1024 )

    expect( result.stats.slides ).toBe( 0 )
    expect( result.stats.maxRecordLen ).toBeGreaterThan( 0 )
  } )

  test( 'grows the window and restarts when a single record exceeds the pool', () => {
    // Synthetic file with one record far larger than a tiny pool — the
    // corpus never hits this (largest STEP record ~25 KB), so exercise the
    // grow-and-restart safety valve directly. A long text literal makes one
    // record ~12 KB; a 4 KB pool must grow past it and still index it.
    const bigValue = 'X'.repeat( 12000 )
    const text =
      "ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\n" +
      "#1=IFCWALL('a');\n" +
      `#2=IFCPROPERTYSINGLEVALUE('${bigValue}');\n` +
      "#3=IFCWALL('c');\nENDSEC;\n"
    const synthetic = new TextEncoder().encode( text )

    const resident = new ParsingBuffer( synthetic )
    IfcStepParser.Instance.parseHeader( resident )
    const [ residentIndex, residentResult ] = IfcStepParser.Instance.parseDataBlock( resident )
    expect( residentResult ).toBe( ParseResult.COMPLETE )

    const streamed = buildIndexStreaming(
        new BufferByteSource( synthetic ), IfcStepParser.Instance, 4 * 1024 )

    expect( streamed.result ).toBe( ParseResult.COMPLETE )
    // Window grew past the 4 KB pool to fit the ~12 KB record.
    expect( streamed.stats.windowBytes ).toBeGreaterThan( 4 * 1024 )
    expect( streamed.stats.maxRecordLen ).toBeGreaterThan( 12000 )
    // ...and the index is still byte-identical to the resident parse.
    expect( columns( streamed.elements ) ).toEqual( columns( residentIndex.elements ) )
  } )
} )
