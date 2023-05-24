import {
  addCompactedElement32State,
  addCompactedElementCount32State,
  initCountCompactedElements32State,
} from '../../indexing/bit_operations'
import { MultiIndexSet } from '../../indexing/multi_index_set'
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
   * Create a type index from a set of parsed STEP elements.
   *
   * @param elements The elements to type index.
   * @return {MultiIndexSet} The created multi-set index.
   */
  public create( elements: StepIndexEntry< TypeIDType >[] ): MultiIndexSet< TypeIDType > {
    // eslint-disable-next-line no-magic-numbers
    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const elementCounter = this.elementCounter_
    const prefixSum      = new Uint32Array( ( this.elementCounter_.length >>> 1 ) + 1 )

    for ( let denseIndex = 0, endIndex = elements.length; denseIndex < endIndex; ++denseIndex ) {
      const element = elements[ denseIndex ]

      if ( element.typeID !== void 0 ) {
        prefixSum[ element.typeID + 1 ] =
          addCompactedElementCount32State( denseIndex, elementCounter, element.typeID << 1 )
      }
    }

    for ( let prefixSumIndex = 2, prefixSumEnd = prefixSum.length;
      prefixSumIndex < prefixSumEnd;
      ++prefixSumIndex ) {
      prefixSum[ prefixSumIndex ] += prefixSum[ prefixSumIndex - 1 ]
    }

    // Reset, because now we have actually counted all the indices, we can put out the
    // compacted versions
    // eslint-disable-next-line no-magic-numbers -- we're using a 2 stride here, it's not magic.
    for ( let where = 0, end = this.elementCounter_.length; where < end; where += 2 ) {
      initCountCompactedElements32State( this.elementCounter_, where )
    }

    const indexOutput = new Uint32Array( prefixSum[ prefixSum.length - 1 ] << 1 )

    for ( let denseIndex = 0, endIndex = elements.length; denseIndex < endIndex; ++denseIndex ) {
      const element = elements[ denseIndex ]

      if ( element.typeID !== void 0 ) {
        addCompactedElement32State(
            denseIndex,
            elementCounter,
            indexOutput,
            element.typeID << 1,
            prefixSum[ element.typeID ] << 1 )
      }
    }

    return new MultiIndexSet< TypeIDType >( prefixSum, indexOutput )
  }
}
