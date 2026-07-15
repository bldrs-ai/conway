import { StepIndexEntry } from './parsing/step_parser'
import {
  ResidentStepBufferProvider,
  StepBufferProvider,
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from './step_buffer_provider'
import StepVtableBuilder from './parsing/step_vtable_builder'
import StepEntityBase from './step_entity_base'
import StepEntitySchema from './step_entity_schema'
import StepEntityInternalReference, { StepEntityInternalReferencePrivate } from './step_entity_internal_reference'
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

  // Structure-of-arrays index. The parsed element index used to be retained as
  // one heterogeneous JS object per entity for the model's whole life (~135 B
  // each; SKYLARK's 7.8 M / PSB's 9.4 M entities cost ~1 GB+ that `invalidate`
  // could never reclaim). Instead we keep the persistent scalar fields in
  // parallel typed-array columns (~16 B/entity) and materialise a descriptor
  // object lazily, on demand, into `descriptorCache_` — which `invalidate`
  // clears, so descriptor memory is actually reclaimable. Local IDs index the
  // columns directly. Inline entities are unfolded to a contiguous tail range,
  // so express-ID presence is positional (`localID < firstInlineElement_`).
  private readonly address_: Uint32Array
  private readonly length_: Uint32Array
  private readonly typeID_: Int32Array         // -1 = undefined (0 is external-mapping)
  private readonly expressID_: Uint32Array     // real (non-inline) entries only
  private readonly count_: number
  private readonly firstInlineElement_: number

  // Lazily-materialised descriptors for touched entities, indexed by local ID;
  // dropped wholesale by invalidate(). A sparse array, not a Map: at PSB/SKYLARK
  // scale most entities are touched during extraction, where a Map's ~45 B/entry
  // overhead would dominate — an array slot is 8 B.
  private descriptorCache_:
    ( StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > | undefined )[] = []

  // Rare STEP complex/external-mapping entities (multiMapping) keep their full
  // descriptor object — the multi-entity graph isn't column-encoded.
  private readonly complexEntries_?:
    Map< number, StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > >

  // Residency provider for the raw source bytes. Defaults to a resident
  // provider over the constructor's buffer (historical behaviour,
  // bit-for-bit). `spillSourceToExternalStore` swaps in a windowed
  // provider and releases the resident buffer — after that, synchronous
  // extraction requires the range to have been paged in first (see
  // `ensureResidentByExpressID` / `ensureResidentByLocalID`).
  private bufferProvider_: StepBufferProvider

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
    private buffer_: Uint8Array | undefined, elementIndex: StepIndexEntry<EntityTypeIDs>[]) {

    this.bufferProvider_ = new ResidentStepBufferProvider( buffer_ as Uint8Array )

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

    this.expressIDMap_ = expressIDMap

    // Pack the persistent scalar fields into columns and pull the rare
    // multiMapping (complex/external-mapping) entries aside as retained
    // descriptor objects. After this the `localElementIndex` object array is
    // unreferenced and collected — its per-entity objects no longer pin memory.
    const count      = inlineElementEnd
    const address    = new Uint32Array( count )
    const lengths    = new Uint32Array( count )
    const typeIDs    = new Int32Array( count )
    const expressIDs = new Uint32Array( firstInlineElement )

    let complexEntries:
      Map< number, StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > > | undefined =
        void 0

    for ( let localID = 0; localID < count; ++localID ) {

      const element = localElementIndex[ localID ]

      address[ localID ] = element.address
      lengths[ localID ] = element.length
      typeIDs[ localID ] = element.typeID === void 0 ? -1 : ( element.typeID as number )

      if ( localID < firstInlineElement ) {
        expressIDs[ localID ] = element.expressID as number
      }

      if ( element.multiMapping !== void 0 ) {
        ( complexEntries ??= new Map() ).set( localID, element )
      }
    }

    this.address_            = address
    this.length_             = lengths
    this.typeID_             = typeIDs
    this.expressID_          = expressIDs
    this.count_              = count
    this.firstInlineElement_ = firstInlineElement
    this.complexEntries_     = complexEntries
  }

  /**
   * Materialise the descriptor object for a local ID from the columns. Only the
   * persistent scalars are set; lazy fields (vtable, buffer, entity) are filled
   * in on demand by populateVtableEntry / entity construction.
   *
   * @param localID The local ID to build a descriptor for.
   * @return {StepEntityInternalReferencePrivate} The descriptor.
   */
  private makeDescriptor( localID: number ):
    StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > {

    const typeID = this.typeID_[ localID ]

    return {
      address:   this.address_[ localID ],
      length:    this.length_[ localID ],
      typeID:    typeID === -1 ? void 0 : ( typeID as EntityTypeIDs ),
      expressID: localID < this.firstInlineElement_ ?
        this.expressID_[ localID ] : void 0,
    }
  }

  /**
   * Get the (cached or freshly materialised) descriptor for a local ID. The
   * same object is returned for repeated calls until invalidate(), so entities
   * built on it and populateVtableEntry() mutations agree.
   *
   * @param localID The local ID to get a descriptor for.
   * @return {StepEntityInternalReferencePrivate} The descriptor.
   */
  private entry( localID: number ):
    StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > {

    const complex = this.complexEntries_?.get( localID )

    if ( complex !== void 0 ) {
      return complex
    }

    let descriptor = this.descriptorCache_[ localID ]

    if ( descriptor === void 0 ) {

      descriptor = this.makeDescriptor( localID )

      this.descriptorCache_[ localID ] = descriptor
    }

    return descriptor
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

      // Common entries: drop their materialised descriptors outright — this is
      // the memory the old retained object array could never release. They
      // rematerialise from the columns on next access.
      this.descriptorCache_ = []

      // Complex (multiMapping) entries are retained objects; clear their lazy
      // fields in place, matching the previous per-entry reset. The mapped
      // class references are cleared too — they capture buffer views at
      // populate time, and a stale view would otherwise pin the released
      // source buffer across a spill.
      if ( this.complexEntries_ !== void 0 ) {

        for ( const item of this.complexEntries_.values() ) {

          item.buffer      = void 0
          item.entity      = void 0
          item.vtable      = void 0
          item.vtableCount = void 0
          item.vtableIndex = void 0
          item.multiEntity = void 0

          if ( item.multiMapping !== void 0 ) {

            for ( const mapped of item.multiMapping ) {

              mapped.buffer      = void 0
              mapped.entity      = void 0
              mapped.vtable      = void 0
              mapped.vtableCount = void 0
              mapped.vtableIndex = void 0
            }
          }
        }
      }

    } else {

      for ( const item of this.descriptorCache_ ) {

        if ( item !== void 0 ) {
          item.entity = void 0
        }
      }

      if ( this.complexEntries_ !== void 0 ) {

        for ( const item of this.complexEntries_.values() ) {

          item.entity = void 0
        }
      }
    }
  }

  /**
   * Populate a raw vtable entry for a particular element, extra
   * 
   * @param element The raw elment to populate the vtable entry for.
   * @return {boolean} Did the vtable entry populate correctly?
   */
  public populateVtableEntryRaw(
    element: StepEntityInternalReference< EntityTypeIDs > ): boolean {
    if (element.vtableIndex !== void 0 || element.typeID === 0 ) {
      return true
    }

    // Acquire the record's byte range through the provider — the full
    // resident buffer at offset 0 by default, or a window/merged view
    // after a spill. Cursors recorded below are relative to the view.
    const acquisition = this.bufferProvider_.acquire( element.address, element.length )
    const viewAddress = element.address - acquisition.offset

    const extratedEntry =
      this.schema.parser.extractDataEntry(
          acquisition.buffer,
          viewAddress,
          viewAddress + element.length,
          this.vtableBuilder_)

    if (extratedEntry === void 0) {
      return false
    }

    element.vtableIndex = extratedEntry[ 0 ]
    element.vtableCount = extratedEntry[ 1 ]
    element.endCursor   = extratedEntry[ 2 ]
    element.buffer = acquisition.buffer
    element.vtable = this.vtableBuilder_.buffer

    return true
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
    if (localID >= this.count_) {
      throw new Error(`Invalid localID ${localID}`)
    }

    const element = this.entry(localID)

    return this.populateVtableEntryRaw( element )
  }


  /**
   * Force the population of the the buffer entry for a particular element.
   *
   * @param localID The local id to fetch the buffer entry for.
   * @throws {Error} Throws an error if the ID is invalid.
   */
  public populateBufferEntry( localID: number ): void {
    if (localID >= this.count_) {
      throw new Error(`Invalid localID ${localID}`)
    }

    const element = this.entry(localID)

    element.buffer =
      this.bufferProvider_.acquire( element.address, element.length ).buffer
  }


  /**
   * Get the size in bytes of the backing buffer for this.
   *
   * @return {number} The number of elements.
   */
  public get bufferBytesize(): number {
    return this.bufferProvider_.byteLength
  }

  /**
   * Are the source bytes held externally (spilled), i.e. windowed in
   * on demand rather than fully resident?
   *
   * @return {boolean} True after a successful `spillSourceToExternalStore`.
   */
  public get isSourceExternal(): boolean {
    return this.buffer_ === void 0
  }

  /**
   * Bytes of source currently held resident by the buffer provider
   * (the whole buffer before a spill; the windowed working set after).
   *
   * @return {number} The resident byte count.
   */
  public get residentSourceBytes(): number {
    return this.bufferProvider_.residentBytes
  }

  /**
   * Release the resident source buffer and serve subsequent record
   * reads from fixed-size windows paged in from an external store.
   *
   * The store must contain EXACTLY the model's source bytes (same
   * length; byte-identical content is the caller's responsibility —
   * typically the original file already sitting in OPFS). All cached
   * descriptors/entities are invalidated, since they hold views over
   * the released buffer; they rematerialise on demand through the
   * windowed provider.
   *
   * After this, synchronous extraction of a record whose range isn't
   * resident throws StepBufferNotResidentError — async API surfaces
   * must call `ensureResidentByExpressID` / `ensureResidentByLocalID`
   * first. Parse and geometry extraction always run before any spill,
   * so those paths are unaffected.
   *
   * @param store The external store holding the source bytes.
   * @param chunkBytes Optional window size in bytes.
   * @param maxResidentChunks Optional residency cap in windows.
   */
  public spillSourceToExternalStore(
      store: StepExternalByteStore,
      chunkBytes?: number,
      maxResidentChunks?: number ): void {

    if ( store.byteLength !== this.bufferProvider_.byteLength ) {
      throw new Error(
          `External store byteLength ${store.byteLength} does not match ` +
          `source byteLength ${this.bufferProvider_.byteLength}` )
    }

    this.bufferProvider_ = new WindowedStepBufferProvider( store, chunkBytes, maxResidentChunks )
    this.buffer_         = void 0

    this.invalidate( true )
  }

  /**
   * Page in the byte range(s) backing a record so following
   * synchronous extraction of it succeeds. Covers the record's own
   * range (which contains any inline elements) and, for complex /
   * external-mapped records, each mapped class record's range.
   *
   * No-op (fast resolved promise) while the source is fully resident.
   *
   * @param localID The local ID of the record.
   * @return {Promise< void >} Resolves when resident.
   */
  public async ensureResidentByLocalID( localID: number ): Promise< void > {

    if ( !this.isSourceExternal ) {
      return
    }

    if ( localID >= this.count_ ) {
      throw new Error(`Invalid localID ${localID}`)
    }

    await this.bufferProvider_.ensureResident(
        this.address_[ localID ], this.length_[ localID ] )

    const complex = this.complexEntries_?.get( localID )

    if ( complex?.multiMapping !== void 0 ) {

      for ( const mapped of complex.multiMapping ) {
        await this.bufferProvider_.ensureResident( mapped.address, mapped.length )
      }
    }
  }

  /**
   * Page in the byte range(s) backing a record by express ID — see
   * `ensureResidentByLocalID`. Unknown express IDs resolve silently
   * (the following read will surface the miss the same way it does
   * for a fully-resident model).
   *
   * @param expressID The express ID of the record.
   * @return {Promise< void >} Resolves when resident.
   */
  public async ensureResidentByExpressID( expressID: number ): Promise< void > {

    if ( !this.isSourceExternal ) {
      return
    }

    const localID = this.expressIDMap_.get( expressID )

    if ( localID === void 0 ) {
      return
    }

    await this.ensureResidentByLocalID( localID )
  }


  /**
   * Get the number of elements/entities in this model.
   *
   * @return {number} The number of elements.
   */
  public get size(): number {
    return this.count_
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
   * Get an inline element by address.
   *
   * @param address
   * @param type
   * @return {BaseEntity | undefined} The number of elements.
   */
  public getTypedInlineElementByAddress<T extends StepEntityConstructorAbstract< EntityTypeIDs >, O extends InstanceType< T > & BaseEntity >(address: number | undefined, type: T ): O | undefined {
    if (address === void 0) {
      return
    }

    const localID = this.inlineAddressMap_.get(address)

    if (localID === void 0) {
      return
    }

    return this.getTypedElementByLocalID< T, O >( localID, type )
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
   * Given an express ID, return the matching element if one exists.
   *
   * @param {number} expressID The express ID to fetch the element for.
   * @param {StepEntityConstructorAbstract} type The constructor matching the type
   * of the element to fetch.
   * @return {object | undefined} The element if one exists for that ID,
   * otherwise undefined.
   */
  public getTypedElementByExpressID< T extends StepEntityConstructorAbstract< EntityTypeIDs >, O extends InstanceType< T > & BaseEntity >(
    expressID: number,
    type: T ):
    O | undefined {
    const localID = this.expressIDMap_.get(expressID)

    if (localID === void 0) {
      return
    }

    return this.getTypedElementByLocalID( localID, type )
  }


  /**
   * Given a local ID (i.e. dense index/reference), return the matching element if one
   * exists.
   *
   * @param {number} localID The local ID to fetch for.
   * @param {StepEntityConstructorAbstract} type The constructor matching the type
   * of the element to fetch.
   * @return {object | undefined} The matching element or undefined
   * if none exists.
   */
  public getTypedElementByLocalID< T extends StepEntityConstructorAbstract< EntityTypeIDs >, O extends InstanceType< T > & BaseEntity >(
    localID: number,
    type: StepEntityConstructorAbstract< EntityTypeIDs > ):
    O | undefined {
  
    if (localID >= this.count_) {
      return
    }

    const element = this.entry(localID)
    const multiMapping = element.multiMapping

    if ( multiMapping !== void 0 ) {

      let multiElements = element.multiEntity

      if ( multiElements === void 0 ) {        

        const schema     = this.schema
        const reflection = schema.reflection


        // We sort this way because we want to go deepest first,
        // that way we only visit unvisited elements once.
        // Elements get visited during initialization, so we know that
        // if an element has been previously visited, it is a super class
        // of a current element.
        multiMapping.sort( (a, b ) => reflection[ b.typeID ?? 0 ].depth - reflection[ a.typeID ?? 0 ].depth )

        multiElements = []

        for ( const subElement of multiMapping ) {

          if ( subElement.visitedMulti ) {
            continue
          }

          const elementTypeID = subElement.typeID

          if ( elementTypeID === void 0 ) {
            continue
          }

          const constructorRead =
              schema.constructors[ elementTypeID ]

          if ( constructorRead === void 0 ) {
            continue
          }

          const subEntity = new constructorRead(localID, element, this, multiMapping)

          subElement.entity = subEntity

          multiElements.push( subEntity )
        }

        // We memoize multielements regardless of the setting as they're necessary
        // for resolution of multi-mapping.
        element.multiEntity = multiElements
      }

      return multiElements?.find( where => where instanceof type ) as O | undefined
    }

    let entity = element.entity as BaseEntity | undefined

    if (entity === void 0 && element.typeID !== void 0) {

      const elementTypeID = element.typeID

      // TODO - we actually need to make this handle unknown type IDs by adding
      // an ENTITY_UNKNOWN type - CS
      const constructorRead =
          this.schema.constructors[elementTypeID] as StepEntityConstructor< EntityTypeIDs, BaseEntity > | undefined

      if ( constructorRead !== void 0 &&
           ( type === ( constructorRead as unknown ) || constructorRead.prototype instanceof type ) ) {

        entity = new constructorRead(localID, element, this )

        if ( this.elementMemoization ) {
          element.entity = entity!
        }
      }
    }

    return entity as O | undefined
  }

  /**
   * Map an array of local IDs to their matching express IDs.
   *
   * @param from local ID array
   * @return {Uint32Array} express ID array
   */
  public mapLocalIDsToExpressIDs( from: ReadonlyUint32Array ): Uint32Array {

    const firstInlineElement = this.firstInlineElement_
    const expressIDs         = this.expressID_

    return from.map( ( value ) =>
      value < firstInlineElement ? expressIDs[ value ] : TriangleElementMap.NO_ELEMENT )
  }

  /**
   * Given an express ID, return the matching element if one exists.
   *
   * @param {number} localID The local ID to fetch the element for.
   * @return {number | undefined} The express ID if one exists for that local ID,
   * otherwise undefined.
   */
  public getExpressIDByLocalID(localID: number): number | undefined {

    return localID < this.firstInlineElement_ ? this.expressID_[ localID ] : void 0
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
    if (localID >= this.count_) {
      return
    }

    const element = this.entry(localID)

    let entity = element.entity
    const multiMapping = element.multiMapping

    if ( multiMapping !== void 0 ) {

      let multiElements = element.multiEntity

      if ( multiElements === void 0 ) {        

        const schema     = this.schema
        const reflection = schema.reflection

        // We sort this way because we want to go deepest first,
        // that way we only visit unvisited elements once.
        // Elements get visited during initialization, so we know that
        // if an element has been previously visited, it is a super class
        // of a current element.
        multiMapping.sort( (a, b ) => reflection[ b.typeID ?? 0 ].depth - reflection[ a.typeID ?? 0 ].depth )

        multiElements = []

        for ( const subElement of multiMapping ) {

          if ( subElement.visitedMulti ) {
            continue
          }

          const elementTypeID = subElement.typeID

          if ( elementTypeID === void 0 ) {
            continue
          }

          const constructorRead =
              schema.constructors[ elementTypeID ]

          if ( constructorRead === void 0 ) {
            continue
          }

          const subEntity = new constructorRead(localID, element, this, multiMapping)

          subElement.entity = subEntity

          multiElements.push( subEntity )
        }

        // We memoize multielements regardless of the setting as they're necessary
        // for resolution of multi-mapping.
        element.multiEntity = multiElements
      }

      return multiElements[ 0 ] as BaseEntity | undefined
    }

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
   * Count entities of a set of types (including sub-types) without iterating
   * or materializing them — reads the type index's prefix sums, so it's cheap
   * enough to call up front for progress totals (see core/progress.ts).
   * Multi-mapped elements can be counted once per matching mapping, so treat
   * this as an upper bound; see MultiIndexSet.count.
   *
   * @param types The list of types to count.
   * @return {number} The number of matching entities.
   */
  public typeCount<T extends StepEntityConstructorAbstract<EntityTypeIDs>[]>(
      ...types: T ): number {
    const distinctTypes = types.length === 1 ? (types[0].query) :
      (new Set(types.flatMap((type) => type.query)))

    return this.typeIndex.count(...distinctTypes)
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
    for (let localID = 0, endID = this.count_; localID < endID; ++localID) {
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
