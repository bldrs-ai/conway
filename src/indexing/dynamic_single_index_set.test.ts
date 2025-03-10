import {describe, expect, test} from '@jest/globals'
import seedrandom from 'seedrandom'
import DynamicSingleIndexSet from './dynamic_single_index_set'


const rng = seedrandom( 'dynamic index set tests')

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

const testNotFoundList =
  Array.from(
       
      getRandom32List( 100000 ) ).filter( (value ) => !filterSetOne.has( value ) )

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
function buildDynamicSetAndTest(): boolean {

  const set = new DynamicSingleIndexSet()
  const alreadyInserted = new Set< number >()

  for ( const value of testInsertList ) {

    if ( set.insert( value ) ) {

      if ( alreadyInserted.has( value ) ) {
        console.log( 'inserted duplicate' )
        return false
      }

      alreadyInserted.add( value )

    } else if ( !alreadyInserted.has( value ) ) {

      console.log( 'insertion rejected on unseen value')
      return false
    }
  }

  return true
}

/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 * @returns True if the test passes, false otherwise
 */
function buildDynamicSetAndTestHas(): boolean {

  const set = new DynamicSingleIndexSet()

  for ( const value of filterSetOne ) {

    if ( set.insert( value ) && !set.has( value ) ) {

      console.log( 'has failed immediately after insert')
      return false
    }
  }

  for ( const value of testInsertList ) {

    if ( !set.has( value ) ) {

      console.log( 'has failed in subsequent test for inserted value' )
      return false
    }
  }

  for ( const value of testNotFoundList ) {

    if ( set.has( value ) ) {

      console.log( 'has value that should not be found' )
      return false
    }
  }

  return true
}

/**
 * Test that builds a dynamic set via inserts and that none
 * of the initial inserts return false, while subsequent
 * inserts of duplicate values do return false.
 * @returns True if the test passes, false otherwise
 */
function buildDynamicSetAndTestDelete(): boolean {

  const set = new DynamicSingleIndexSet()

  for ( const value of testInsertList ) {

    set.insert( value )
  }

  for ( const value of deleteList ) {

    if ( !set.delete( value ) ) {

      console.log( 'delete failed' )
      return false
    }

    if ( set.has( value ) ) {

      console.log( 'set still has value immediately after delete')
      return false
    }
  }

  for ( const value of deleteList ) {

    if ( set.has( value ) ) {

      console.log( 'set has value after all deletes' )
      return false
    }
  }

  return true
}


describe( 'Single Index Set Test', () => {
  test( 'buildAndTestSingleSet()', () => {

    expect( buildDynamicSetAndTest() ).toBe( true )

  } )

  test( 'buildDynamicSetAndTestHas()', () => {

    expect( buildDynamicSetAndTestHas() ).toBe( true )

  } )

  test( 'buildDynamicSetAndTestDelete()', () => {

    expect( buildDynamicSetAndTestDelete() ).toBe( true )

  } )
})
