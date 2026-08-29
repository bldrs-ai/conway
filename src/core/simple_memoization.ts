 
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
   * Delete every cache entry whose value is reference-equal to `value`.
   *
   * A single memoized extraction can be cached under more than one id when
   * the caller recurses and caches at each level of its own recursion
   * (`cachePassthrough` is the identity transform by default, so the SAME
   * object is what every one of those calls stores) - deleting the value
   * itself and only one of those entries leaves the others pointing at a
   * deleted object. This finds every alias by identity instead of requiring
   * the caller to retrace which recursive shape produced them.
   *
   * @param value The cached value to remove every alias of.
   * @return {number} How many entries were removed.
   */
  public deleteValue( value: T ): number {

    let removed = 0

    for ( const [ id, cached ] of this.cache_ ) {

      if ( cached === value ) {

        this.cache_.delete( id )
        ++removed
      }
    }

    return removed
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
