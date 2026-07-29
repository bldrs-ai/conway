/**
 * Growable Uint32Array append sink.
 *
 * Exists so hot extraction loops can parse integer list fields straight
 * out of the STEP buffer into one reusable typed array, instead of
 * allocating (and caching) a boxed `Array< number >` per record. On
 * tessellated IFC4 models that difference is structural: a large
 * polygonal-faceset model carries millions of IfcIndexedPolygonalFace
 * records, and a per-record array for each is the dominant source of
 * both GC time and retained heap during geometry extraction.
 */
export class Uint32Sink {

  private data_: Uint32Array
  private length_: number = 0

  /**
   * @param initialCapacity Initial element capacity.
   */
  constructor( initialCapacity: number = 1024 ) {
    this.data_ = new Uint32Array( Math.max( 1, initialCapacity ) )
  }

  /** @return {number} Element count appended since the last reset. */
  public get length(): number {
    return this.length_
  }

  /**
   * A view of exactly the appended elements. Only valid until the next
   * append (which may reallocate) — copy it if it must outlive that.
   *
   * @return {Uint32Array} View over [0, length).
   */
  public get view(): Uint32Array {
    return this.data_.subarray( 0, this.length_ )
  }

  /** Drop all appended elements, keeping the allocated capacity. */
  public reset(): void {
    this.length_ = 0
  }

  /**
   * Append one value, growing geometrically when full.
   *
   * @param value The value to append.
   */
  public push( value: number ): void {

    if ( this.length_ === this.data_.length ) {

      const grown = new Uint32Array( this.data_.length * 2 )

      grown.set( this.data_ )

      this.data_ = grown
    }

    this.data_[ this.length_++ ] = value
  }
}
