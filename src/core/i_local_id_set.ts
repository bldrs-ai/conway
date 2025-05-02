import { IIndexSetCursor } from './i_index_set_cursor'

/**
 * Interface for a set of local IDs.
 */
export interface ILocalIdSet {

  /**
   * Does this set have a particular local ID?
   *
   * @param localId The local ID to check for.
   * @return {boolean} True if it has the local ID. 
   */
  has(localId: number): boolean

  /**
   * The number of items in the set.
   */
  readonly size: number
}

/**
 * Interface for a set of local IDs with a cursor.
 */
export interface ILocalIDSetWithCursor extends ILocalIdSet {

  /**
   * Get a cursor that lets you iterate over the items in this set.
   */
  cursor(): IIndexSetCursor
}