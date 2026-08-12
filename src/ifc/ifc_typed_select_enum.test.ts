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
// enum members, and `null_style` / `IfcNullStyle` is the only enum inside a
// select in either schema. It accounted for 274 of the public regression
// baseline's error rows, every one of them a lost styled item. See
// bldrs-ai/conway#489.
//
// Both schemas are covered: the fix is emitted by the generator at two sites,
// one per schema, and a regeneration that reverted either would otherwise
// ship green. scripts/code-gen.cjs clones the generator unpinned, so that is
// not a hypothetical.
//
// Parser-only, so no geometry wasm is initialized here - importing it would
// make this fail at import in a checkout without the Dist built, for a
// dependency it never uses.
import { describe, expect, test } from '@jest/globals'

import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { IfcNullStyle, IfcPresentationStyleAssignment } from './ifc4_gen'


const parser = IfcStepParser.Instance

const TYPED_STYLE =
  `#10028 = IFCPRESENTATIONSTYLEASSIGNMENT((IFCNULLSTYLE(.NULL.)));`

// The same value written bare, which always worked. Kept alongside so a
// change that fixes one by breaking the other cannot pass.
const BARE_STYLE = `#10028 = IFCPRESENTATIONSTYLEASSIGNMENT((.NULL.));`

const STYLE_EXPRESS_ID = 10028

/**
 * Parse one IFCPRESENTATIONSTYLEASSIGNMENT and read back its styles.
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

  if ( !( assignment instanceof IfcPresentationStyleAssignment ) ) {
    throw new Error( 'expected an IfcPresentationStyleAssignment' )
  }

  return assignment.Styles
}


describe( 'a typed enum in an IFC select', () => {

  test( 'IFCNULLSTYLE(.NULL.) resolves instead of throwing', () => {

    expect( stylesOf( TYPED_STYLE ) ).toEqual( [ IfcNullStyle.NULL ] )
  })

  test( 'the bare form still resolves', () => {

    expect( stylesOf( BARE_STYLE ) ).toEqual( [ IfcNullStyle.NULL ] )
  })
})
