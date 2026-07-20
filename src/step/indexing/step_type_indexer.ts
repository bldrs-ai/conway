import {
  addCompactedElement32State,
  addCompactedElementCount32State,
  initCountCompactedElements32State,
} from '../../indexing/bit_operations'
import { MultiIndexSet } from '../../indexing/multi_index_set'
import { StepIndexColumns } from '../parsing/columnar_index'
import { StepIndexEntry } from '../parsing/step_parser'

/**
 * Indexes STEP by type so that it can be searched by type.
 */
export class StepTypeIndexer< TypeIDType extends number > {
  private readonly elementCounter_: Int32Array

  /**
   * Construct this with the number of types that will be indexed.
   *
   * @param typeCount The number of types that will be indexed.
   */
  public constructor( typeCount: number ) {
    this.elementCounter_ = new Int32Array( typeCount << 1 )
  }

  /**
   * Create a type index from either index form — the parsed object array or
   * the columnar index (M7).
   *
   * @param index The element index, object or columnar.
   * @return {MultiIndexSet} The created multi-set index.
   */
  public createFor(
      index: StepIndexEntry< TypeIDType >[] | StepIndexColumns< TypeIDType > ):
      MultiIndexSet< TypeIDType > {

    return Array.isArray( index ) ? this.create( index ) : this.createFromColumns( index )
  }

  /**
   * Create a type index straight from the columnar index — the same
   * membership `create` produces from the unfolded object array: every row's
   * concrete type (top-level + inline; −1 rows skipped) plus the
   * multi-mapping subtypes of retained complex entries at their parent's
   * dense index.
   *
   * @param columns The columnar index.
   * @return {MultiIndexSet} The created multi-set index.
   */
  public createFromColumns(
      columns: StepIndexColumns< TypeIDType > ): MultiIndexSet< TypeIDType > {

    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const elementCounter = this.elementCounter_
    const prefixSum      = new Uint32Array( ( this.elementCounter_.length >>> 1 ) + 1 )
    const typeIDs        = columns.typeID
    const count          = columns.count

    // Walk retained complex entries alongside the rows (their keys ascend in
    // localID order) so multi-mapping subtypes interleave at their parent's
    // dense index — the object path's exact output order.
    const walkRows = ( addOne: ( denseIndex: number, typeID: number ) => void ): void => {

      const complexIterator = columns.complexEntries?.entries()
      let nextComplex = complexIterator?.next()

      for ( let denseIndex = 0; denseIndex < count; ++denseIndex ) {
        const typeID = typeIDs[ denseIndex ]

        if ( typeID >= 0 ) {
          addOne( denseIndex, typeID )
        }

        if ( nextComplex !== void 0 && !nextComplex.done &&
            nextComplex.value[ 0 ] === denseIndex ) {

          for ( const subElement of nextComplex.value[ 1 ].multiMapping ?? [] ) {
            const subTypeID = subElement.typeID

            if ( subTypeID !== void 0 ) {
              addOne( denseIndex, subTypeID as number )
            }
          }

          nextComplex = ( complexIterator as
            IterableIterator<[number, StepIndexEntry<TypeIDType>]> ).next()
        }
      }
    }

    walkRows( ( denseIndex, typeID ) => {
      prefixSum[ typeID + 1 ] =
        addCompactedElementCount32State( denseIndex, elementCounter, typeID << 1 )
    } )

    for ( let prefixSumIndex = 2, prefixSumEnd = prefixSum.length;
      prefixSumIndex < prefixSumEnd;
      ++prefixSumIndex ) {
      prefixSum[ prefixSumIndex ] += prefixSum[ prefixSumIndex - 1 ]
    }

    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const indexOutput = new Uint32Array( prefixSum[ prefixSum.length - 1 ] << 1 )

    walkRows( ( denseIndex, typeID ) => {
      addCompactedElement32State(
          denseIndex,
          elementCounter,
          indexOutput,
          typeID << 1,
          prefixSum[ typeID ] << 1 )
    } )

    return new MultiIndexSet< TypeIDType >( prefixSum, indexOutput )
  }

  /**
   * Create a type index from a set of parsed STEP elements.
   *
   * @param elements The elements to type index.
   * @return {MultiIndexSet} The created multi-set index.
   */
  public create( elements: StepIndexEntry< TypeIDType >[] ): MultiIndexSet< TypeIDType > {
     
    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const elementCounter = this.elementCounter_
    const prefixSum      = new Uint32Array( ( this.elementCounter_.length >>> 1 ) + 1 )

    for ( let denseIndex = 0, endIndex = elements.length; denseIndex < endIndex; ++denseIndex ) {
      const element = elements[ denseIndex ]

      const typeID = element.typeID

      if ( typeID !== void 0 ) {
        prefixSum[ typeID + 1 ] =
          addCompactedElementCount32State( denseIndex, elementCounter, typeID << 1 )
      }

      const multiElements = element.multiMapping

      if ( multiElements !== void 0 ) {

        for ( const subElement of multiElements ) {

          const subTypeID = subElement.typeID

          if ( subTypeID === void 0 ) {
            continue
          }

          // This is a multi-mapping, so we need to add the element to the index as well.
          // We can use the same denseIndex, because it is the same element.
          prefixSum[ subTypeID + 1 ] =
            addCompactedElementCount32State( denseIndex, elementCounter, subTypeID << 1 )
        } 
      }
    }

    for ( let prefixSumIndex = 2, prefixSumEnd = prefixSum.length;
      prefixSumIndex < prefixSumEnd;
      ++prefixSumIndex ) {
      prefixSum[ prefixSumIndex ] += prefixSum[ prefixSumIndex - 1 ]
    }

    // Reset, because now we have actually counted all the indices, we can put out the
    // compacted versions
     
    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const indexOutput = new Uint32Array( prefixSum[ prefixSum.length - 1 ] << 1 )

    for ( let denseIndex = 0, endIndex = elements.length; denseIndex < endIndex; ++denseIndex ) {
      const element = elements[ denseIndex ]

      const typeID = element.typeID

      if ( typeID !== void 0 ) {
        addCompactedElement32State(
            denseIndex,
            elementCounter,
            indexOutput,
            typeID << 1,
            prefixSum[ typeID ] << 1 )
      }

      const multiElements = element.multiMapping

      if ( multiElements !== void 0 ) {

        for ( const subElement of multiElements ) {

          const subTypeID = subElement.typeID

          if ( subTypeID === void 0 ) {
            continue
          }

          // This is a multi-mapping, so we need to add the element to the index as well.
          // We can use the same denseIndex, because it is the same element.
          addCompactedElement32State(
            denseIndex,
            elementCounter,
            indexOutput,
            subTypeID << 1,
            prefixSum[ subTypeID ] << 1 )
        }
      }
    }

    return new MultiIndexSet< TypeIDType >( prefixSum, indexOutput )
  }
}
