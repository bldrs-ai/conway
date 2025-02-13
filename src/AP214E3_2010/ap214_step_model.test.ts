/* eslint-disable camelcase */
import {beforeAll, describe, expect, test} from '@jest/globals'

import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { product_definition_formation } from './AP214E3_2010_gen'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const conwayGeom = new ConwayGeometry()

/**
 * Initialize the wasm
 */
async function initializeWasm() {

  await conwayGeom.initialize()

}

const parser = AP214StepParser.Instance

const contextString = `#2 = APPLICATION_CONTEXT(
  'core data for automotive mechanical design processes');
#6 = PRODUCT_DEFINITION_FORMATION('','',#7);
#7 = PRODUCT('KittyCAD Text to CAD','KittyCAD Text to CAD','',(#8));
#8 = PRODUCT_CONTEXT('',#2,'mechanical');`

const contextStringBuffer = new TextEncoder().encode( contextString )

const PRODUCT_DEFINITION_FORMATION_EXPRESS_ID = 6

/**
 * Extract a product definition formation/context.
 *
 * @return {boolean} True if the test succeeds, false if it doesn't.
 */
function extractContext() {

  const bufferInput = new ParsingBuffer( contextStringBuffer )

  const [result, model] = parser.parseDataToModel( bufferInput )

  if ( model === void 0 ||
    ( result !== ParseResult.COMPLETE && result !== ParseResult.INCOMPLETE ) ) {
    return false
  }

  const productDefinitionFormation =
    model.getElementByExpressID( PRODUCT_DEFINITION_FORMATION_EXPRESS_ID )

  if (!( productDefinitionFormation instanceof product_definition_formation )) {
    return false
  }

  const productItem = productDefinitionFormation.of_product
  const productContexts = productItem.frame_of_reference

  if ( productContexts.length !== 1 ) {
    return false
  }

  const applicationContext = productContexts[ 0 ].frame_of_reference

  if ( applicationContext.application !== 'core data for automotive mechanical design processes' ) {
    return false
  }

  return true
}


describe( 'AP214 Step Model Test', () => {

  beforeAll(async () => {

    await initializeWasm()

  })

  test( 'extractContext()', () => {
    expect( extractContext() ).toBe( true )
  } )
})
