import { IIndexSetCursor } from '../core/i_index_set_cursor'
import { ReadonlyUint32Array } from '../core/readonly_typed_array'
import {
  addCompactedElement32State,
  addCompactedElementCount32State,
  initCountCompactedElements32State } from './bit_operations'
import { indexSetPointQuery32 } from './search_operations'
import { SingleIndexSetCursor } from './single_index_set_cursor'

 
const localState = new Int32Array( 2 )

/**
 * A single set of indices
 */
export class SingleIndexSet {
   
  /**
   * Construct this with a matching elements table.
   * @param start_
   * @param end_
   * @param elements_ The elements in the index, matching the start->end indices * 2,
   * where there's 2 elements in the array for each item,
   * packed (first has the bottom 5 bits masked out, and is the top bits, the second
   * is a bit field representing the elements for the top bit range, in a
   * unioned-one-hot representation).
   */
  public constructor(
    private readonly start_: number,
    private readonly end_: number,
    private readonly elements_: Uint32Array ) {}
   

  /**
   * Get the buffer elements from this (treat as immutable)
   * @returns The buffer elements.
   */
  public get buffer(): ReadonlyUint32Array {
    return this.elements_
  }

  /**
   * Does the set have a particular index for a particular type.
   * @param indexType The index type to check for.
   * @param denseIndex The dense index in the set to check.
   * @returns True if it has the type.
   */
  public has( denseIndex: number ): boolean {
    return indexSetPointQuery32( denseIndex, this.elements_, this.start_, this.end_ << 1 )
  }

  /**
   * Get a cursor that lets you iterate over the union of the sets of multiple indices.
   * @param indexTypes The list of types to build a cursor out of.
   * @returns The cursor for the list of types.
   */
  public cursor(): IIndexSetCursor {

    return SingleIndexSetCursor.allocate( this.elements_, this.start_, this.end_ )

  }

  /**
   * Create an index from a single local id.
   * @param localId The local id.
   * @returns The created multi-set index.
   */
  public static createFromSingleLocalId( localId: number ): SingleIndexSet {

    initCountCompactedElements32State( localState, 0 )

    const SLOTS = 1
    const indexSize = SLOTS << 1
    const indexOutput = new Uint32Array( indexSize )

    addCompactedElement32State(
        localId,
        localState,
        indexOutput )

    return new SingleIndexSet( 0, SLOTS, indexOutput )
  }

  /**
   * Create an index from an ascended sorting set of local IDs.
   * @param localIds The local ids to create this
   * @returns The created index sex.
   */
  public static createFromLocalIds( localIds: number[] | ReadonlyUint32Array ): SingleIndexSet {

    initCountCompactedElements32State( localState, 0 )

    let countedSlots = 0

    for ( const localId of localIds ) {

      countedSlots = addCompactedElementCount32State( localId, localState, 0 )
    }

    initCountCompactedElements32State( localState, 0 )

    const indexSize = countedSlots << 1
    const indexOutput = new Uint32Array( indexSize )

    for ( const localId of localIds ) {

      addCompactedElement32State(
          localId,
          localState,
          indexOutput )
    }

    return new SingleIndexSet( 0, countedSlots, indexOutput )
  }
}
