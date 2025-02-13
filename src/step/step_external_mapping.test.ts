/* eslint-disable camelcase */
import {beforeAll, describe, expect, test} from '@jest/globals'

import AP214StepExternalMapping from '../AP214E3_2010/ap214_step_external_mapping'
import AP214StepParser from '../AP214E3_2010/ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from './parsing/step_parser'
import {
  geometric_representation_context,
  parametric_representation_context,
  representation_context,
} from '../AP214E3_2010/AP214E3_2010_gen'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const parser = AP214StepParser.Instance

// eslint-disable-next-line max-len
const externalMappingString = '#42 = ( GEOMETRIC_REPRESENTATION_CONTEXT(2) PARAMETRIC_REPRESENTATION_CONTEXT() REPRESENTATION_CONTEXT(\'2D SPACE\',\'\' ) );'

const externalMappingStringBuffer = new TextEncoder().encode( externalMappingString )

const EXTERNAL_REFERENCE_EXPRESS_ID = 42

const conwayGeometry = new ConwayGeometry()

/**
 * Intialize conway geom.
 */
async function initializeConwayGeom() {

  await conwayGeometry.initialize()
}


/**
 * Test for extracting an external mapping.
 *
 * @return {boolean} True if the test succeeds, false if it doesn't.
 */
function extractExternalMapping() {

  const bufferInput = new ParsingBuffer( externalMappingStringBuffer )

  const [result, model] = parser.parseDataToModel( bufferInput )

  if ( model === void 0 ||
    ( result !== ParseResult.COMPLETE && result !== ParseResult.INCOMPLETE ) ) {
    return false
  }

  const externalMapping =
    model.getElementByExpressID( EXTERNAL_REFERENCE_EXPRESS_ID )

  if (!(externalMapping instanceof AP214StepExternalMapping )) {
    return false
  }

  // eslint-disable-next-line no-magic-numbers
  if ( externalMapping.items.length !== 3 ) {
    return false
  }

  if (
    !(externalMapping.items[ 0 ] instanceof geometric_representation_context ) ||
    !(externalMapping.items[ 1 ] instanceof parametric_representation_context ) ||
    !(externalMapping.items[ 2 ] instanceof representation_context ) ) {
    return false
  }

  return true
}


describe( 'External Mapping Test', () => {

  beforeAll(async () => {

    await initializeConwayGeom()

  })

  test( 'extractExternalMapping()', () => {
    expect( extractExternalMapping() ).toBe( true )
  } )
})
