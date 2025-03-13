 
import { MemoizationCapture, RegressionCaptureState } from './regression_capture_state'

/**
 * Simple cache by ID.
 */
export default class SimpleMemoization< T > {

  private readonly cache_ = new Map< number, T >()
  private readonly cachePassthrough_ : ( from : T ) => T

  /**
   * Construct this, with an optional cache passthrough method. Use this
   * to add idempotency to memoized objects where needed, such as cloning them
   * or locking them.
   *
   * @param cachePassthrough A function that is called to transform or clone
   * a memoized object when it is added.
   */
  constructor( cachePassthrough?: ( from: T ) => T ) {
    this.cachePassthrough_ = cachePassthrough ?? ( ( from : T ) => from )
  }

  /**
   * Get the number of memoized items
   *
   * @return {number} The number of items memoized in this.
   */
  public get length(): number {
    return this.cache_.size
  }

  /**
   * Iterate through the cached objects
   *
   * @return {IterableIterator<[ number, T ]>} Iterate over this.
   */
  [Symbol.iterator](): IterableIterator<[ number, T ]> {
    return this.cache_[Symbol.iterator]()
  }

  /**
   * Add an item to the cache.
   *
   * @param id
   * @param value
   * @param temporary
   */
  public add( id: number, value: T, temporary: boolean = false ) {
    if ( !temporary || RegressionCaptureState.memoization === MemoizationCapture.FULL ) {
      this.cache_.set( id, this.cachePassthrough_( value ) )
    }
  }

  /**
   * Delete an item from the cache.
   *
   * @param id
   * @return {boolean} True if the item was in the cache.
   */
  public delete( id: number ): boolean {
    return this.cache_.delete( id )
  }

  /**
   * Get the cached item for a particular id.
   *
   * @param id
   * @return {T | undefined}
   */
  public get( id: number ): T | undefined  {
    return this.cache_.get( id )
  }

  /**
   * Clear the cache
   */
  public clear(): void {

    this.cache_.clear()
  }
}
