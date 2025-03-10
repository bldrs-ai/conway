import {describe, expect, test} from '@jest/globals'
import seedrandom from 'seedrandom'
import DynamicSingleIndexSet from './dynamic_single_index_set'
import { cursorIterator } from './cursor_utilities'


const rng = seedrandom( 'dynamic index cursor tests')

/**
 * Get a random 32 bit safe unsigned integer (seeded
 * for determinism).
 * @returns A random 32 bit safe unsigned integer
 */
function getRandom32(): number {
   
  return Math.floor(rng() * 0xFFFFFFFF) >>> 0
}

/**
 * Get a list of 32 bit safe unsigned integers (seeded for determinism)
 * @param count The number of integers to return.
 * @yields {number} A 32 bit safe unsigned integer.
 */
function* getRandom32List( count: number ): IterableIterator< number > {

  for ( let where = 0; where < count; ++where ) {
    yield getRandom32()
  }
}

 
const testInsertList = Array.from( getRandom32List( 100000 ) )

const filterSetOne = new Set< number >( testInsertList )

const filterSetOneIterator = filterSetOne.keys()

const deleteList: number[] = []

for ( let where = 0, end = filterSetOne.size >>> 1; where < end; ++where ) {

  const {value, done} = filterSetOneIterator.next()

  if ( done ) {
    break
  }

  deleteList.push( value )
}

const notDeletedList: number[] = []

{
  let {value: restValue, done: restDone} = filterSetOneIterator.next()

  while ( !restDone ) {

    notDeletedList.push( restValue! );

    ({value: restValue, done: restDone} = filterSetOneIterator.next())
  }
}

/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 * @returns True if the test passes, false otherwise
 */
function buildDynamicSetCursorTest(): boolean {

  const set = new DynamicSingleIndexSet()

  for ( const value of filterSetOne ) {

    set.insert( value )
  }

  const fromCursorArray = Array.from( cursorIterator( set.cursor() ) )
  const fromCursorSet   = new Set< number >( fromCursorArray )

  if ( !fromCursorArray.every( ( x ) => filterSetOne.has( x ) ) ) {

    console.log( 'cursor had element not in original set' )
    return false
  }

  if ( !(Array.from( filterSetOne )).every( ( x ) => fromCursorSet.has( x ) ) ) {

    console.log( 'original set had item not in cursor' )
    return false
  }

  return true
}

/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 * @returns True if the test passes, false otherwise
 */
function buildDynamicSetOrderCursorTest(): boolean {

  const set = new DynamicSingleIndexSet()

  for ( const value of filterSetOne ) {

    set.insert( value )
  }

  const fromCursorArray = Array.from( cursorIterator( set.cursor() ) )
  const filterSetArray  = Array.from( filterSetOne ).sort( ( x, y ) => ( x - y ) )

  if ( !fromCursorArray.every( ( x, i ) => filterSetArray[ i ] === x ) ) {

    console.log( 'sort ordered cursor data did not match' )
    return false
  }

  return true
}


/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 * @returns True if the test passes, false otherwise
 */
function buildDynamicSetCursorTestDelete(): boolean {

  const set = new DynamicSingleIndexSet()

  for ( const value of testInsertList ) {

    set.insert( value )
  }

  for ( const value of deleteList ) {

    set.delete( value )
  }

  const fromCursorArray = Array.from( cursorIterator( set.cursor() ) )
  const filterSetArray  = Array.from( notDeletedList ).sort( ( x, y ) => ( x - y ) )

  if ( !fromCursorArray.every( ( x, i ) => filterSetArray[ i ] === x ) ) {

    console.log( 'sort ordered cursor data did not match after deletes' )
    return false
  }

  return true
}


describe( 'Single Index Set Cursor Test', () => {
  test( 'buildDynamicSetCursorTest()', () => {

    expect( buildDynamicSetCursorTest() ).toBe( true )

  } )

  test( 'buildDynamicSetOrderTest()', () => {

    expect( buildDynamicSetOrderCursorTest() ).toBe( true )

  } )

  test( 'buildDynamicSetCursorTestDelete()', () => {

    expect( buildDynamicSetCursorTestDelete() ).toBe( true )

  } )
})
