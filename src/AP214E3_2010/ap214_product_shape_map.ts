/**
 * Maintains a bidirectional mapping between product IDs and shape IDs.
 * 
 * This class allows efficient querying of all shapes associated with a product,
 * all products associated with a shape, and iteration over all unique product-shape pairs.
 *
 * - Each product ID/product def can be associated with multiple shape IDs, and vice versa.
 * - It is expected that a product ID and product definition ID are map a singular product
 *   to one or more product definitions, but that there is only a singular constnat product ID
 *   for a given product definition ID.
 * - The mapping is idempotent: adding the same product-shape pair multiple times has no effect after the first addition.
 * - The total count reflects the number of unique product-shape pairs.
 */
export class AP214ProductShapeMap {

  private productsToProductDefs_ = new Map<number, Set<number>>()
  private productDefsToProducts_ = new Map<number, number>()
  private productDefsToShapes_ = new Map<number, Set<number>>()
  private shapesToProductDefs_ = new Map<number, Set<number>>()
  private _count = 0

  /**
   * Adds a product-shape pair. Idempotent: does not add duplicates.
   *
   * @param productId Product numerical id
   * @param shapeId Shape numerical id
   * 
   * @return {boolean} True if the pair was added, false if it already existed.
   */
 /**
  * Adds a mapping between a product and its product definition to a shape.
  * If the product def share pair does not already exist, it is added to both
  * the product-to-shapes and shape-to-products maps, and the internal count is incremented.
  *
  * @param productId - The local ID of the product.
  * @param productDefitionId - The local ID of the product definition.
  * @param shapeId - The local ID of the shape.
  * @return {true} if the pair was newly added; `false` if the pair already existed.
  */
  public addProductShapePair( productId: number, productDefitionId: number, shapeId: number ): boolean {

    let shapes = this.productDefsToShapes_.get( productDefitionId )
 
    if ( shapes === void 0 ) {

      shapes = new Set<number>()

      this.productDefsToShapes_.set( productDefitionId, shapes )
    }

    const shapesSize    = shapes.size
    const addedToShapes = shapes.add(shapeId).size > shapesSize

    let products = this.shapesToProductDefs_.get( shapeId )

    if ( products === void 0 ) {

      products = new Set<number>()
      
      this.shapesToProductDefs_.set( shapeId, products )
    }

    products.add( productDefitionId )

    if ( addedToShapes ) {

      this.productDefsToProducts_.set( productDefitionId, productId )

      let productDefs = this.productsToProductDefs_.get( productId )

      if ( productDefs === void 0 ) {

        productDefs = new Set<number>()

        this.productsToProductDefs_.set( productId, productDefs )
      }

      this.productDefsToProducts_.set( productDefitionId, productId )

      this._count++
    }

    return addedToShapes
  }

  /**
   * Returns the number of unique product-shape pairs.
   * 
   * @return {number} The count of unique product-shape pairs.
   */
  public get count(): number {
    return this._count
  }

  /**
   * Gets the set of shape ids for a given product id.
   *
   * @param productId Product numerical id
   * 
   * @return {Set<number> | undefined} A set of shape ids associated with the product, or undefined if no shapes are associated.
   */
  public getShapesForProduct(productId: number): Set<number> | undefined {
    return this.productDefsToShapes_.get(productId)
  }

  /**
   * Gets the set of product ids for a given shape id.
   *
   * @param shapeId Shape numerical id
   * 
   * @return {Set<number> | undefined} A set of product ids associated with the shape, or undefined if no products are associated.
   */
  public getProductDefForShape(shapeId: number): Set<number> | undefined {
    return this.shapesToProductDefs_.get(shapeId)
  }

  /**
   * Get the s for a shape, given the shape local ID.
   * 
   * @param shapeId The local ID of the shape.
   * @return {Set< number > | undefined} The local IDs of the product definition associated with the
   * shape, or undefined if no product definition is associated with the shape.
   */
  public getProductDefForShapeId(shapeId: number): Set< number > | undefined {

    const productDefs = this.shapesToProductDefs_.get(shapeId)

    let productIds: Set< number > | undefined = void 0
    
    if (productDefs !== void 0 ) {

      for ( const productDef of productDefs ) {

        if ( productIds === void 0 ) {
          productIds = new Set<number>()
        }

        const productId = this.productDefsToProducts_.get(productDef)

        if ( productId === void 0 ) {
          continue
        }

        productIds.add( productId )
      }
    }
    
    return productIds
  }

  /**
   * Get the ids of product defs mapped to their associated products.
   * 
   * @yields {[number, Set<number>]} Returns an iterator of [productId, Set<shapeId>] pairs.
   */
  public *productsToProductDefs(): IterableIterator<[number, Set<number>]> {
    yield* this.productsToProductDefs_.entries()
  }

  /**
   * Get the ids of products mapped to their associated shapes.
   * 
   * @yields {[number, Set<number>]} Returns an iterator of [productId, Set<shapeId>] pairs.
   */
  public *productDefsToShapes(): IterableIterator<[number, Set<number>]> {
    yield* this.productDefsToShapes_.entries()
  }

  /**
   * Returns an iterator of [shapeId, Set<productId>] pairs.
   * 
   * @yields {[number, Set<number>]} Returns an iterator of [shapeId, Set<productId>] pairs.
   */
  public *shapesToProductsDefs(): IterableIterator<[number, Set<number>]> {
    yield* this.shapesToProductDefs_.entries()
  }

  /**
   * Returns an iterator of all unique [productId productDefinitionId, shapeId] tuples.
   * 
   * @yields {[number, number]} An iterator of unique product-shape tuples.
   */
  public *tuples(): IterableIterator<[number, number, number]> {
    for (const [productDefId, shapes] of this.productDefsToShapes_) {
      
      const productId = this.productDefsToProducts_.get(productDefId)!

      for (const shapeId of shapes) {
        yield [productId, productDefId, shapeId]
      }
    }
  }
}