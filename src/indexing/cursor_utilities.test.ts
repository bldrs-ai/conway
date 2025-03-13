import {describe, expect, test} from '@jest/globals'
import { SingleIndexSet } from './single_index_set'
import { cursorCount, cursorIterator, cursorMap } from './cursor_utilities'

/* eslint-disable no-magic-numbers */
const ID_SET = [
  9, 17, 31, 102, 103, 1042, 1045, 1046,
  63212, 68993, 68994, ( 1 << 24 ) + 1023, ( 1 << 24 ) + 1024,
]
/* eslint-enable no-magic-numbers */


/**
 * Build a single id set from an array of mock local IDs and test
 * that it they are present and permutations not in the set aren't.
 *
 * @return {boolean} True if the test passes.
 */
function testCursorCount(): boolean {

  const singleIndexSet = SingleIndexSet.createFromLocalIds( ID_SET )
  const idSetCount = cursorCount( singleIndexSet.cursor() )

  if ( idSetCount !== ID_SET.length ) {
    return false
  }

  return true
}

/**
 * Build a single id set from an array of mock local IDs and test
 * that it they are present and permutations not in the set aren't.
 *
 * @return {boolean} True if the test passes.
 */
function testCursorMap(): boolean {

  const singleIndexSet = SingleIndexSet.createFromLocalIds( ID_SET )
  const idSet = Array.from( cursorMap( singleIndexSet.cursor(), ( localId ) => localId + 1 ) )

  if ( idSet.length !== ID_SET.length ||
       idSet.some( ( value, index ) => ( ID_SET[index] + 1 ) !== value ) ) {
    return false
  }

  return true
}

/**
 * Build a single id set from an array of mock local IDs and test
 * that it they are present given the iterator
 *
 * @return {boolean} True if the test passes.
 */
function testCursorIterator(): boolean {

  const singleIndexSet = SingleIndexSet.createFromLocalIds( ID_SET )
  const idSet = Array.from( cursorIterator( singleIndexSet.cursor() ) )

  if ( idSet.length !== ID_SET.length ||
       idSet.some( ( value, index ) => ID_SET[index] !== value ) ) {
    return false
  }

  return true
}

describe( 'Cursor Utilities Test', () => {

  test( 'testCursorCount()', () => {

    expect( testCursorCount() ).toBe( true )

  } )

  test( 'testCursorIterator()', () => {

    expect( testCursorIterator() ).toBe( true )

  } )

  test( 'testCursorMap()', () => {

    expect( testCursorMap() ).toBe( true )

  } )

})

