import fs from 'fs'
import { describe, expect, test } from '@jest/globals'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import {
  AP214PropertyExtraction,
  ExtractedProperty,
  ExtractedPropertyMap,
} from './ap214_property_extraction'


const parser = AP214StepParser.Instance

/** Express id of the single part (`product_definition`) in the CTC fixture. */
const CTC_PRODUCT_DEFINITION_EXPRESS_ID = 4368

/** Expected volume validation value for the CTC fixture. */
const CTC_VOLUME_MEASURE = 14644822.6361138

/**
 * Parse the hermetic CTC properties fixture and extract its property map.
 *
 * @return {ExtractedPropertyMap} Properties keyed by owning product definition.
 */
function extractCtcProperties(): ExtractedPropertyMap {

  const buffer = fs.readFileSync( 'data/nist-ctc-properties.step' )
  const bufferInput = new ParsingBuffer( buffer )

  const headerResult = parser.parseHeader( bufferInput )[1]

  expect( headerResult ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( bufferInput )

  expect( model ).not.toBe( void 0 )
  expect(
      result === ParseResult.COMPLETE || result === ParseResult.INCOMPLETE ).toBe( true )

  return new AP214PropertyExtraction( model! ).extractProperties()
}

/**
 * Find a property by key among a part's property rows.
 *
 * @param rows The property rows for a part.
 * @param name The property key to find.
 * @return {ExtractedProperty} The matching property row.
 */
function property( rows: ExtractedProperty[], name: string ): ExtractedProperty {

  const found = rows.find( ( row ) => row.name === name )

  expect( found ).not.toBe( void 0 )

  return found!
}

describe( 'AP214PropertyExtraction', () => {

  test( 'attaches properties to the owning product definition', () => {

    const properties = extractCtcProperties()

    expect( properties.has( CTC_PRODUCT_DEFINITION_EXPRESS_ID ) ).toBe( true )
  } )

  test( 'extracts the NIST attribute key/values', () => {

    const rows = extractCtcProperties().get( CTC_PRODUCT_DEFINITION_EXPRESS_ID )!

    expect( property( rows, 'Modeled By' ).value ).toBe( 'Engineer' )
    expect( property( rows, 'CAGE Code' ).value ).toBe( '64JW1' )
    expect( property( rows, 'Company' ).value ).toBe( 'ACME' )
  } )

  test( 'extracts the geometric validation volume property', () => {

    const rows = extractCtcProperties().get( CTC_PRODUCT_DEFINITION_EXPRESS_ID )!

    const volume = property( rows, 'volume measure' )

    expect( volume.numericValue ).toBeCloseTo( CTC_VOLUME_MEASURE )
    expect( volume.group ).toBe( 'geometric validation property' )
  } )
} )
