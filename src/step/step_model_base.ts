import { StepIndexEntry } from './parsing/step_parser'
import StepVtableBuilder from './parsing/step_vtable_builder'
import StepEntityBase from './step_entity_base'
import StepEntitySchema from './step_entity_schema'
import { StepEntityInternalReferencePrivate } from './step_entity_internal_reference'
import { IIndexSetCursor } from '../core/i_index_set_cursor'
import { extractOneHotLow } from '../indexing/bit_operations'
import { MultiIndexSet } from '../indexing/multi_index_set'
import StepEntityConstructor, { StepEntityConstructorAbstract } from './step_entity_constructor'
import { Model, ModelGeometry } from '../core/model'
import { ReadonlyUint32Array } from '../core/readonly_typed_array'
import { TriangleElementMap } from '../core/triangle_element_map'
import InterpolationSearchTable32 from '../indexing/interpolation_search_table_32'
import { CanonicalMaterial } from '../core/canonical_material'
import { SceneNodeGeometry } from '../core/scene_node'
import { CanonicalMesh } from '../core/canonical_mesh'
import { ModelMaterials } from '../core/model_materials'


/**
 * The base for models parsed from STEP.
 */
export default abstract class StepModelBase<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase<EntityTypeIDs> = StepEntityBase<EntityTypeIDs> >
implements Iterable<BaseEntity>, Model {
  public readonly abstract typeIndex: MultiIndexSet<EntityTypeIDs>
  public readonly abstract externalMappingType: StepEntityConstructor< EntityTypeIDs, BaseEntity >

  private readonly vtableBuilder_: StepVtableBuilder = new StepVtableBuilder()
  private readonly expressIDMap_: InterpolationSearchTable32
  private readonly inlineAddressMap_: InterpolationSearchTable32
  private readonly elementIndex_: StepEntityInternalReferencePrivate<EntityTypeIDs, BaseEntity>[]

  /**
   * Will this model memoize elements, set to false to disable,
   * true to enable.
   *
   * Note that during periods where element memoization is disabled,
   * it's not guaranteed element objects returned from this have referential
   * equality even if they have ID equality.
   */
  public elementMemoization: boolean = true

  /**
   * When an atribute is parsed from an entity in the model that causes a recoverable
   * error, and the field is optional, return null instead of throwing an exception.
   */
  public nullOnErrors: boolean = true

  public abstract readonly materials?: ModelMaterials

  public abstract readonly geometry?: ModelGeometry

  /**
   * Construct this step model with its matching schema, a buffer to read from and an element index.
   *
   * @param schema The Step schema this is based on.
   * @param buffer_ The buffer to read this from.
   * @param elementIndex The element index for this, parsed or deserialized - note this takes
   * ownership of this array in the sense it will modify values/unfold inline elements etc.
   */
  constructor(
    public readonly schema: StepEntitySchema< EntityTypeIDs, BaseEntity >,
    private readonly buffer_: Uint8Array, elementIndex: StepIndexEntry<EntityTypeIDs>[]) {

    const localElementIndex: StepEntityInternalReferencePrivate<EntityTypeIDs, BaseEntity>[] =
      elementIndex

    let where = 0

    const firstInlineElement = localElementIndex.length

    while (where < localElementIndex.length) {
      const element = localElementIndex[where]

      if (element.inlineEntities !== void 0) {

        localElementIndex.push(...element.inlineEntities)
      }

      ++where
    }

    const inlineElementEnd   = localElementIndex.length
    const inlineElementCount = inlineElementEnd - firstInlineElement

    const inlineElementTable = new Uint32Array( inlineElementCount << 1 )

    for (
      let inlineElementLocalId = firstInlineElement;
      inlineElementLocalId < inlineElementEnd;
      ++inlineElementLocalId ) {

      const tableIndex = ( inlineElementLocalId - firstInlineElement ) << 1

      inlineElementTable[ tableIndex ] = inlineElementLocalId
      inlineElementTable[ tableIndex + 1 ] = localElementIndex[inlineElementLocalId].address
    }

    const inlineAddressMap = new InterpolationSearchTable32( inlineElementTable, true )

    this.inlineAddressMap_ = inlineAddressMap

    const expressIdTable = new Uint32Array( firstInlineElement << 1 )

    let expressIdsAlreadySorted = true
    let previousExpressID = 0

    for (
      let elementLocalId = 0;
      elementLocalId < firstInlineElement;
      ++elementLocalId ) {

      const tableIndex = elementLocalId << 1

      const currentExpressId =  localElementIndex[elementLocalId].expressID as number

      expressIdTable[ tableIndex ] = elementLocalId
      expressIdTable[ tableIndex + 1 ] = currentExpressId

      if ( currentExpressId < previousExpressID ) {

        expressIdsAlreadySorted = false
      }

      previousExpressID = currentExpressId
    }

    const expressIDMap = new InterpolationSearchTable32( expressIdTable, expressIdsAlreadySorted )

    // Continguous dense array map from express IDs.
    // for (const element of elementIndex) {
    //   if (element.expressID !== void 0) {
    //     expressIDMap.set(element.expressID, indexId++)
    //   }
    // }

    this.expressIDMap_ = expressIDMap
    this.elementIndex_ = localElementIndex
  }


  /**
   * Invalidate the cache store for this, so new items will be created.
   *
   * @param dropVtable If true, remove the vtable entries for old entries as well,
   * freeing up the v-table space on garbage collection.
   */
  public invalidate( dropVtable: boolean = false ): void {

    if ( dropVtable ) {

      this.vtableBuilder_.clear( true )

      for ( const item of this.elementIndex_ ) {

        item.buffer = void 0
        item.entity = void 0
        item.vtable = void 0
        item.vtableCount = void 0
        item.vtableIndex = void 0
      }
    } else {

      for ( const item of this.elementIndex_ ) {

        item.entity = void 0
      }
    }
  }

  /**
   * Force the population of the the vtable entry for a particular ID
   * (i.e. extracting the field locations)
   *
   * @param localID The id to fetch the vtable entry for.
   * @throws {Error} Throws an error if the ID is invalid.
   * @return {boolean} Did the vtable entry populate correctly?
   */
  public populateVtableEntry(localID: number): boolean {
    if (localID > this.elementIndex_.length) {
      throw new Error(`Invalid localID ${localID}`)
    }

    const element = this.elementIndex_[localID]

    if (element.vtableIndex !== void 0 || element.typeID === 0 ) {
      return true
    }

    const extratedEntry =
      this.schema.parser.extractDataEntry(
          this.buffer_,
          element.address,
          element.address + element.length,
          this.vtableBuilder_)

    if (extratedEntry === void 0) {
      return false
    }

    element.vtableIndex = extratedEntry[ 0 ]
    element.vtableCount = extratedEntry[ 1 ]
    element.endCursor   = extratedEntry[ 2 ]
    element.buffer = this.buffer_
    element.vtable = this.vtableBuilder_.buffer

    return true
  }


  /**
   * Force the population of the the buffer entry for a particular element.
   *
   * @param localID The local id to fetch the buffer entry for.
   * @throws {Error} Throws an error if the ID is invalid.
   */
  public populateBufferEntry( localID: number ): void {
    if (localID > this.elementIndex_.length) {
      throw new Error(`Invalid localID ${localID}`)
    }

    const element = this.elementIndex_[localID]

    element.buffer = this.buffer_
  }


  /**
   * Get the size in bytes of the backing buffer for this.
   *
   * @return {number} The number of elements.
   */
  public get bufferBytesize(): number {
    return this.buffer_.byteLength
  }


  /**
   * Get the number of elements/entities in this model.
   *
   * @return {number} The number of elements.
   */
  public get size(): number {
    return this.elementIndex_.length
  }

  /**
   * Get an inline element by address.
   *
   * @param address
   * @return {BaseEntity | undefined} The number of elements.
   */
  public getInlineElementByAddress(address: number | undefined): BaseEntity | undefined {
    if (address === void 0) {
      return
    }

    const localID = this.inlineAddressMap_.get(address)

    if (localID === void 0) {
      return
    }

    return this.getElementByLocalID(localID)
  }

  /**
   * Given an express ID, return the matching element if one exists.
   *
   * @param {number} expressID The express ID to fetch the element for.
   * @return {object | undefined} The element if one exists for that ID,
   * otherwise undefined.
   */
  public getElementByExpressID(expressID: number): BaseEntity | undefined {
    const localID = this.expressIDMap_.get(expressID)

    if (localID === void 0) {
      return
    }

    return this.getElementByLocalID(localID)
  }

  /**
   * Map an array of local IDs to their matching express IDs.
   *
   * @param from Local ID array
   * @return express ID array
   */
  public mapLocalIDsToExpressIDs( from: ReadonlyUint32Array ): Uint32Array {

    const index = this.elementIndex_

    return from.map( (value) => index[ value ]?.expressID ?? TriangleElementMap.NO_ELEMENT )
  }

  /**
   * Given an express ID, return the matching element if one exists.
   *
   * @param {number} localID The local ID to fetch the element for.
   * @return {number | undefined} The express ID if one exists for that local ID,
   * otherwise undefined.
   */
  public getExpressIDByLocalID(localID: number): number | undefined {

    const index = this.elementIndex_

    return index[ localID ]?.expressID
  }

  /**
   * Given a local ID (i.e. dense index/reference), return the matching element if one
   * exists.
   *
   * @param {number} localID The local ID to fetch for.
   * @return {object | undefined} The matching element or undefined
   * if none exists.
   */
  public getElementByLocalID(localID: number): BaseEntity | undefined {
    if (localID > this.elementIndex_.length) {
      return
    }

    const element = this.elementIndex_[localID]

    let entity = element.entity

    if (entity === void 0 && element.typeID !== void 0) {

      const elementTypeID = element.typeID

      // TODO - we actually need to make this handle unknown type IDs by adding
      // an ENTITY_UNKNOWN type - CS
      const constructorRead =
        elementTypeID !== 0 ?
          this.schema.constructors[elementTypeID] :
          this.externalMappingType

      if (constructorRead !== void 0) {

        entity = new constructorRead(localID, element, this) as BaseEntity

        if ( this.elementMemoization ) {
          element.entity = entity
        }
      }
    }

    return entity
  }

  /**
   * Use the type index to get set of entities of a set of types including sub-types, acts
   * as a union given the input type list, with lazy iteration over the set.
   *
   * @param types The list of types to return
   * @return {IterableIterator} An iterable corresponding to
   * the lazy set of items.
   */
  public types<T extends StepEntityConstructorAbstract<EntityTypeIDs>[]>(...types: T):
    IterableIterator<InstanceType<T[number]>> {
    const distinctTypes = types.length === 1 ? (types[0].query) :
      (new Set(types.flatMap((type) => type.query)))

    return this.from(
        this.typeIndex.cursor(...distinctTypes),
        true) as IterableIterator<InstanceType<T[number]>>
  }

  /**
   * Get the non empty type IDs for this.
   *
   * @return {Set} The unique set of non empty type IDs for this model.
   */
  public nonEmptyTypeIDs() : Set< EntityTypeIDs > {

    const types = Array.from( this.typeIndex.types() )

    return new Set( types.flatMap((type) => this.schema.queries[ type as number ] ) )
  }

  /**
   * Get the non empty type IDs for this without including sub-types, only direct instances.
   *
   * @return {IterableIterator} The unique set of non empty type IDs for this model.
   */
  public nonEmptyTypeIDNoSubtypes() : IterableIterator< EntityTypeIDs > {

    return this.typeIndex.types()
  }

  /**
   * Use the type index to get set of entities of a set of types not including sub-types from
   * the list of type ids, acts as a union given the input type list, with lazy iteration over
   * the set.
   *
   * @param types The type ids for the types to get.
   * @return {IterableIterator} An iterable corresponding to the lazy set of items.
   */
  public typeIDs(...types: EntityTypeIDs[]): IterableIterator<BaseEntity> {
    const distinctTypes = types.length === 1 ? (this.schema.queries[types[0] as number]) :
    (new Set(types.flatMap((type) => this.schema.queries[type as number])))

    return this.from(this.typeIndex.cursor(...distinctTypes), true)
  }

  /**
   * Use the type index to get set of entities of a set of types including sub-types from the
   * list of type ids, acts as a union given the input type list, with lazy
   * iteration over the set.
   *
   * @param types The type ids for the types to get.
   * @return {IterableIterator} An iterable corresponding to the lazy set of items.
   */
  public typesIDSNoSubtypes(...types: EntityTypeIDs[]): IterableIterator<BaseEntity> {
    return this.from(this.typeIndex.cursor(...types), true)
  }

  /**
   * Given a cursor, get the matching entities for it as a lazy iterable iterator.
   *
   * @param cursor The cursor to iterate over.
   * @param freeCursor Should the cursor be freed after
   * @return {IterableIterator} The iterable iterator to allow lazy
   * iteration over a cursor.
   * @yields An element per iteration matching the ids in the cursor.
   */
  public* from(cursor: IIndexSetCursor, freeCursor: boolean = false): IterableIterator<BaseEntity> {
    while (cursor.step()) {
      const high = cursor.high
      let low = cursor.low

      while (low !== 0) {
        const lowestOneHot = extractOneHotLow(low)

        low ^= (1 << lowestOneHot)

        const localID = (high | lowestOneHot)

        const foundElement = this.getElementByLocalID(localID)

        if (foundElement !== void 0) {
          yield foundElement
        }
      }
    }

    if (freeCursor) {
      cursor.free()
    }
  }

  /**
   * Extract a set of elements given a local ID iterator.
   *
   * @param from An iterable of local IDs
   * @return {IterableIterator} The iterable iterator to allow lazy
   * iteration over the elements matching the local ids.
   * @yields An element per iteration matching the ids in from.
   */
  public* extract(from: Iterable<number>): IterableIterator<BaseEntity> {
    for (const localID of from) {
      const foundElement = this.getElementByLocalID(localID)

      if (foundElement !== void 0) {
        yield foundElement
      }
    }
  }

  /**
   * Iterate over all the elements in this.
   *
   * @return {IterableIterator} The iterable iterator to allow lazy
   * iteration over all the elements in this.
   * @yields An element per iteration for all the elements in this.
   */
  public* [Symbol.iterator](): IterableIterator<BaseEntity> {
    for (let localID = 0, endID = this.elementIndex_.length; localID < endID; ++localID) {
      const foundElement = this.getElementByLocalID(localID)

      if (foundElement !== void 0) {
        yield foundElement
      }
    }
  }


  /**
   * Get the material matching a geometry node.
   *
   * Geometry must have been extracted first.
   *
   * @param node The geometry node to match a material for.
   * @return {CanonicalMaterial | undefined} A material, or undefined if it is not found.
   */
  public getMaterialFromGeometryNode( node: SceneNodeGeometry ):
    CanonicalMaterial | undefined {

    return this.materials?.getMaterialFromGeometryNode( node )
  }

  /**
   * Get the mesh matching a geometry node.
   *
   * Geometry must have been extracted first.
   *
   * @param node The geometry node to match a material for.
   * @return {CanonicalMesh | undefined} A mesh, or undefined if it is not found.
   */
  public getMeshFromGeometryNode( node: SceneNodeGeometry ): CanonicalMesh | undefined {

    return this.geometry?.getByLocalID( node.localID )
  }
}
