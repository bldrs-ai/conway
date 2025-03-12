import {describe, expect, test} from '@jest/globals'
import seedrandom from 'seedrandom'
import InterpolationSearchTable32 from './interpolation_search_table_32'


const rng = seedrandom( 'dynamic index set tests')

/**
 * Get a random 32 bit safe unsigned integer (seeded
 * for determinism).
 *
 * @return {number} A random 32 bit safe unsigned integer
 */
function getRandom32(): number {
  // eslint-disable-next-line no-magic-numbers
  return Math.floor(rng() * 0xFFFFFFFF) >>> 0
}

/**
 * Get a list of 32 bit safe unsigned integers (seeded for determinism)
 *
 * @param count The number of integers to return.
 * @yields {number} A 32 bit safe unsigned integer.
 */
function* getRandom32List( count: number ): IterableIterator< number > {

  for ( let where = 0; where < count; ++where ) {
    yield getRandom32()
  }
}

// eslint-disable-next-line no-magic-numbers
const randomNumberList = Array.from( getRandom32List( 100000 ) )

const filterSetOne = new Set< number >( randomNumberList )

const filterSetOneIterator = filterSetOne.keys()

const insertSet: number[] = []

for ( let where = 0, end = filterSetOne.size >>> 1; where < end; ++where ) {

  const {value, done} = filterSetOneIterator.next()

  if ( done ) {
    break
  }

  insertSet.push( value )
}

const notInsertSet: number[] = []

{
  let {value: restValue, done: restDone} = filterSetOneIterator.next()

  while ( !restDone ) {

    notInsertSet.push( restValue! );

    ({value: restValue, done: restDone} = filterSetOneIterator.next())
  }
}

const matchingMap = new Map< number, number >()

 
for ( let where = 0; where < insertSet.length; where += 2 ) {

  matchingMap.set( insertSet[ where + 1 ], insertSet[ where ] )
}

/**
 * Tests building an interpolation search table with sorting
 *
 * @return {boolean} True if the test passes, false otherwise
 */
function buildInterpolationSearchTable32(): boolean {

  const searchTable =
    new InterpolationSearchTable32( new Uint32Array( insertSet ), false )

  const tableSize = searchTable.size

  if ( matchingMap.size !== tableSize ) {
    console.log( 'Size failed' )
    return false
  }

  let itemCounter = 0
  let previousKey = -1

  for ( const [key, value] of searchTable ) {

    if ( matchingMap.get( key ) !== value ) {
      return false
    }

    if ( searchTable.get( key ) !== value ) {
      return false
    }

    if ( previousKey >= key ) {
      return false
    }

    previousKey = key
    ++itemCounter
  }

  if ( itemCounter !== tableSize ) {
    return false
  }

  return true
}

/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 *
 * @return {boolean} True if the test passes, false otherwise
 */
function testNotInsertedKeys32(): boolean {

  const searchTable =
    new InterpolationSearchTable32( new Uint32Array( insertSet ), false )

  for ( const key of notInsertSet ) {

    // We do this just to make sure our behaviour matches the actual map behaviour
    if ( matchingMap.get( key ) !== void 0 ) {
      return false
    }

    if ( searchTable.get( key ) !== void 0 ) {
      return false
    }
  }

  return true
}


describe( 'Interpolation Search Table Test', () => {
  test( 'buildInterpolationSearchTable32()', () => {

    expect( buildInterpolationSearchTable32() ).toBe( true )

  } )

  test( 'testNotInsertedKeys32()', () => {

    expect( testNotInsertedKeys32() ).toBe( true )

  } )
})
