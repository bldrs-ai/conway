// A select member whose type is an enum may be written bare or in its typed
// form - `.NULL.` or `NULL_STYLE(.NULL.)`. Inside a SELECT the typed form is
// how a reader tells which member the value is, so exporters use it, and the
// NIST AP242 set uses it throughout.
//
// Reading the typed form used to throw 'Value in select must be populated',
// because the generated getter's enum fallback is a bare parse starting at
// the cursor and the wrapper made it fail. Entity-valued members were never
// affected - the parser indexes an inline TYPENAME(...) entity and
// extractBufferReference resolves it by address - so this was specific to
// enum members, and `null_style` is the only enum inside a select in either
// schema. It accounted for 274 of the public regression baseline's error
// rows, every one of them a lost styled item. See bldrs-ai/conway#489.
import { beforeAll, describe, expect, test } from '@jest/globals'

import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { null_style, presentation_style_assignment } from './AP214E3_2010_gen'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const conwayGeom = new ConwayGeometry()

/**
 * Initialize the wasm.
 */
async function initializeWasm() {

  await conwayGeom.initialize()
}

const parser = AP214StepParser.Instance

// Lifted from nist_stc_06_asme1_ap242-e3.stp, which produces 82 of these.
// The surrounding ANNOTATION_PLANE is what actually got dropped in the
// corpus: the throw escaped the styled-item extraction and was caught per
// representation item.
const TYPED_STYLE = `#10028 = PRESENTATION_STYLE_ASSIGNMENT((NULL_STYLE(.NULL.)));`

// The same value written bare, which always worked. Kept alongside so a
// change that fixes one by breaking the other cannot pass.
const BARE_STYLE = `#10028 = PRESENTATION_STYLE_ASSIGNMENT((.NULL.));`

const STYLE_EXPRESS_ID = 10028

/**
 * Parse one PRESENTATION_STYLE_ASSIGNMENT and read back its styles.
 *
 * @param source The STEP text to parse.
 * @return {Array<unknown>} The resolved styles array.
 */
function stylesOf( source: string ): Array<unknown> {

  const [ result, model ] =
    parser.parseDataToModel( new ParsingBuffer( new TextEncoder().encode( source ) ) )

  if ( model === void 0 ||
    ( result !== ParseResult.COMPLETE && result !== ParseResult.INCOMPLETE ) ) {
    throw new Error( `parse failed with result ${result}` )
  }

  const assignment = model.getElementByExpressID( STYLE_EXPRESS_ID )

  if ( !( assignment instanceof presentation_style_assignment ) ) {
    throw new Error( 'expected a presentation_style_assignment' )
  }

  return assignment.styles
}


beforeAll( async () => {
  await initializeWasm()
})

describe( 'a typed enum in a select', () => {

  test( 'NULL_STYLE(.NULL.) resolves instead of throwing', () => {

    expect( stylesOf( TYPED_STYLE ) ).toEqual( [ null_style.NULL ] )
  })

  test( 'the bare form still resolves', () => {

    expect( stylesOf( BARE_STYLE ) ).toEqual( [ null_style.NULL ] )
  })
})
