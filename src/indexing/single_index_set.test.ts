import {describe, expect, test} from '@jest/globals'
import { SingleIndexSet } from './single_index_set'
import { cursorIterator } from './cursor_utilities'

// Test file is number heavy - CS
/* eslint-disable no-magic-numbers */

const ID_SET = [
  9, 17, 31, 102, 103, 1042, 1045, 1046,
  63212, 68993, 68994, ( 1 << 24 ) + 1023, ( 1 << 24 ) + 1024,
]
 

const PERMUTE_CONSTANT = 237

/**
 * Build a single id set from an array of mock local IDs and test
 * that it they are present and permutations not in the set aren't.
 *
 * @return {boolean} True if the test passes.
 */
function buildAndTestSingleSet(): boolean {

  const singleIndexSet = SingleIndexSet.createFromLocalIds( ID_SET )
  const idSet = Array.from( cursorIterator( singleIndexSet.cursor() ) )

  if ( idSet.length !== ID_SET.length ||
       idSet.some( ( value, index ) => ID_SET[index] !== value ) ) {
    return false
  }

  for ( const id of ID_SET ) {

    if ( !singleIndexSet.has( id ) ) {
      return false
    }

    if ( singleIndexSet.has( id + PERMUTE_CONSTANT ) ) {
      return false
    }
  }

  return true
}


describe( 'Single Index Set Test', () => {
  test( 'buildAndTestSingleSet()', () => {

    expect( buildAndTestSingleSet() ).toBe( true )

  } )

})

