import {describe, expect, test} from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { IfcCartesianPoint } from '../../ifc/ifc4_gen'
import { ParseResult } from './step_parser'


// Enough entities to cross the parser's progress cadence (one tick per 4096
// elements) several times.
const ENTITY_COUNT = 10_000

/**
 * Build a synthetic IFC buffer with ENTITY_COUNT cartesian points.
 *
 * @return {Uint8Array} The encoded synthetic file.
 */
function makeSyntheticIfc(): Uint8Array {

  const lines: string[] = [
    'ISO-10303-21;',
    'HEADER;',
    'FILE_DESCRIPTION((\'\'),\'2;1\');',
    'FILE_NAME(\'synthetic\',\'\',(\'\'),(\'\'),\'\',\'\',\'\');',
    'FILE_SCHEMA((\'IFC4\'));',
    'ENDSEC;',
    'DATA;',
  ]

  for ( let where = 1; where <= ENTITY_COUNT; ++where ) {
    lines.push( `#${where}=IFCCARTESIANPOINT((0.,0.,0.));` )
  }

  lines.push( 'ENDSEC;', 'END-ISO-10303-21;' )

  return new TextEncoder().encode( lines.join( '\n' ) )
}

const parser = IfcStepParser.Instance

describe( 'parse progress', () => {

  test( 'sync parse ticks a monotonic byte cursor and parses everything', () => {

    const data = makeSyntheticIfc()
    const bufferInput = new ParsingBuffer( data )

    parser.parseHeader( bufferInput )

    const cursors: number[] = []

    const [result, model] =
      parser.parseDataToModel( bufferInput, ( cursor ) => cursors.push( cursor ) )

    expect( result ).toBe( ParseResult.COMPLETE )
    expect( model?.size ).toBe( ENTITY_COUNT )

    expect( cursors.length ).toBeGreaterThanOrEqual( 2 )

    for ( let where = 1; where < cursors.length; ++where ) {
      expect( cursors[ where ] ).toBeGreaterThan( cursors[ where - 1 ] )
    }

    expect( cursors[ cursors.length - 1 ] ).toBeLessThanOrEqual( data.length )
  } )

  test( 'async parse produces the same model as sync', async () => {

    const data = makeSyntheticIfc()

    const syncInput = new ParsingBuffer( data )

    parser.parseHeader( syncInput )

    const [syncResult, syncModel] = parser.parseDataToModel( syncInput )

    const asyncInput = new ParsingBuffer( data )

    parser.parseHeader( asyncInput )

    let ticks = 0

    const [asyncResult, asyncModel] =
      await parser.parseDataToModelAsync( asyncInput, () => ++ticks )

    expect( asyncResult ).toBe( syncResult )
    expect( asyncModel?.size ).toBe( syncModel?.size )
    expect( ticks ).toBeGreaterThanOrEqual( 2 )
  } )

  test( 'typeCount matches lazy iteration without materializing first', () => {

    const data = makeSyntheticIfc()
    const bufferInput = new ParsingBuffer( data )

    parser.parseHeader( bufferInput )

    const model = parser.parseDataToModel( bufferInput )[ 1 ]

    expect( model ).toBeDefined()

    const counted = model!.typeCount( IfcCartesianPoint )
    const iterated = Array.from( model!.types( IfcCartesianPoint ) ).length

    expect( counted ).toBe( iterated )
    expect( counted ).toBe( ENTITY_COUNT )
  } )
} )
