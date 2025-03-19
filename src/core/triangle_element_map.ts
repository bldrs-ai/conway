import { ReadonlyUint32Array } from './readonly_typed_array'

/**
 * Map where the index is the triangle index of a geometry object, and the
 * values are the local IDs of the matching elements.
 */
export class TriangleElementMap {

  private map_: Uint32Array
  private size_: number

  public static readonly NO_ELEMENT = 0xFFFFFFFF

  private currentSection_?: ReadonlyUint32Array
  private inverse_?: ReadonlyMap< number, ReadonlyUint32Array >

  /**
   * Create a triangle element map with an initial allocation capacity.
   *
   * @param initialCapacity The initial allocation size for the map to grow up to
   */
  constructor( initialCapacity: number = 1 ) {
    this.map_ = new Uint32Array( initialCapacity )
    this.size_ = 0
  }

  /**
   * Get the number of triangles in the map.
   *
   * @return {number} Return the size of this.
   */
  public get size(): number {
    return this.size_
  }

  /**
   * Get the current forwards mapping, note this is a snapshot
   * at the current time.
   *
   * @return {ReadonlyUint32Array} The forwards mapping.
   */
  public get map() : ReadonlyUint32Array {

    if ( this.currentSection_ === void 0 ) {

      if ( this.map_.length === this.size_ ) {
        this.currentSection_ = this.map_
      } else {
        this.currentSection_ = this.map_.subarray(0, this.size_)
      }
    }

    return this.currentSection_
  }

  /**
   * Add a mapping range for a particular element.
   *
   * @param beginTriangleIndex The beginning triangle index (inclusive)
   * @param endTriangleIndex The ending triangle index (exclusive)
   * @param elementLocalIndex The element index to fill in.
   */
  public addMappingRange(
      beginTriangleIndex: number,
      endTriangleIndex: number,
      elementLocalIndex: number ) {

    delete this.currentSection_
    delete this.inverse_

    if ( endTriangleIndex > this.map_.length ) {

      const newLength = endTriangleIndex << 1
      const newMap    = new Uint32Array(newLength)

      newMap.set(this.map_)

      this.map_ = newMap
    }

    const localMap = this.map_

    localMap.fill(elementLocalIndex, beginTriangleIndex, endTriangleIndex)

    this.size_ = Math.max( endTriangleIndex, this.size_ )
  }

  /**
   * Get the inverse map from elements to triangle indices
   *
   * Note this is a snapshot at the current time.
   *
   * @return {ReadonlyMap< number, ReadonlyUint32Array >}
   */
  public get inverseMap(): ReadonlyMap< number, ReadonlyUint32Array > {

    if ( this.inverse_ === void 0 ) {

      const copiedBuffer = new Uint32Array( this.size_ )

      for ( let where = 0, end = copiedBuffer.length; where < end; ++where ) {
        copiedBuffer[ where ] = where
      }

      const localMap = this.map_

      // sort the indices to cluster them by map value
      copiedBuffer.sort( (a, b) => {

        let result = localMap[ a ] - localMap[ b ]

        if ( result === 0 ) {
          result = a - b
        }

        return result
      })

      let previousValue: number | undefined = void 0
      let valueChangeIndex = 0

      const result = new Map< number, ReadonlyUint32Array >()

      for ( let currentIndex = 0; currentIndex < copiedBuffer.length; ++currentIndex ) {

        const triangleIndex = copiedBuffer[ currentIndex ]
        const elementIndex = localMap[ triangleIndex ]

        if ( elementIndex !== previousValue ) {

          if ( previousValue !== void 0 ) {

            result.set( previousValue, copiedBuffer.subarray( valueChangeIndex, currentIndex ) )
          }

          valueChangeIndex = currentIndex
          previousValue    = elementIndex
        }
      }

      if ( previousValue !== void 0 ) {

        result.set( previousValue, copiedBuffer.subarray( valueChangeIndex, copiedBuffer.length ) )
      }

      this.inverse_ = result
    }

    return this.inverse_
  }
}
