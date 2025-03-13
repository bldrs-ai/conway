import {describe, expect, test} from '@jest/globals'

import fs from 'fs'
import ParsingBuffer from '../parsing/parsing_buffer'
import {ParseResult} from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'


const parser = IfcStepParser.Instance
const indexIfcBuffer = fs.readFileSync( 'data/index.ifc' )

/**
 * Test parsing an index header.
 *
 * @return {ParseResult} Returns the parse result from parsing the header from the index IFC buffer.
 */
function parseIndexIfcHeader() {
  const bufferInput = new ParsingBuffer( indexIfcBuffer )
  const result = parser.parseHeader( bufferInput )[ 1 ]

  return result
}

/**
 * Test parsing the data block from index IFC.
 *
 * @return {ParseResult} Returns the parse result from parsing the data block.
 */
function parseIndexIfcData() {
  const bufferInput = new ParsingBuffer( indexIfcBuffer )
  const result0 = parser.parseHeader( bufferInput )[ 1 ]

  if ( result0 !== ParseResult.COMPLETE ) {
    return result0
  }

  const result = parser.parseDataBlock( bufferInput )[ 1 ]

  return result
}

describe( 'IFC Step Parsing Test', () => {
  test( 'parseIndexIfcHeader()', () => {
    expect( parseIndexIfcHeader() ).toBe( ParseResult.COMPLETE )
  } )

  test( 'parseIndexIfcData()', () => {
    expect( parseIndexIfcData() ).toBe( ParseResult.COMPLETE )
  } )
})
