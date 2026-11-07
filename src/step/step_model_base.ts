import { StepIndexEntry } from './parsing/step_parser'
import { StepIndexColumns, cloneIndexEntry } from './parsing/columnar_index'
import {
  releaseScratchParsingBuffer,
  stepExtractReference,
} from './parsing/step_deserialization_functions'
import { scanExpressRefs } from './parsing/express_ref_scan'
import {
  ResidentStepBufferProvider,
  StepBufferAcquisition,
  StepBufferNotResidentError,
  StepBufferProvider,
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from './step_buffer_provider'
import StepVtableBuilder from './parsing/step_vtable_builder'
import StepEntityBase from './step_entity_base'
import StepEntitySchema from './step_entity_schema'
import { Uint32Sink, extractIntegerArrayAt } from './parsing/uint32_sink'
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

/* Span reads for visitRecordBytesInFileOrder (conway#755). Over one
 * 860 MB model's IfcRelDefinesByProperties records, a 4 KiB gap gives
 * 1,711 reads for 9.8 MB, 64 KiB 1,075 for 19 MB, and 256 KiB 964 for
 * 31 MB: past 64 KiB the reads barely drop while the bytes climb, and below it a store round
 * trip costs more than the gap's bytes. A 1 MiB span cap keeps one read
 * well under a 4 MiB window. Four in flight hides a store's per-read
 * latency without holding more than ~4 MiB of span bytes. */
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (64KiB)
const DEFAULT_SPAN_GAP_BYTES = 64 * 1024
// eslint-disable-next-line no-magic-numbers -- byte-size arithmetic (1MiB)
const DEFAULT_MAX_SPAN_BYTES = 1024 * 1024
const SPAN_READS_IN_FLIGHT = 4


/**
 * The base for models parsed from STEP.
 */
/**
 * Anything that holds a source-window view in `buffer` — a descriptor, or
 * a multi-mapped class reference — as {@link StepModelBase}'s view release
 * sees it.
 */
interface CapturedViewHolder {
  buffer?: Uint8Array
}


export default abstract class StepModelBase<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase<EntityTypeIDs> = StepEntityBase<EntityTypeIDs> >
implements Iterable<BaseEntity>, Model {
  public readonly abstract typeIndex: MultiIndexSet<EntityTypeIDs>
  public readonly abstract externalMappingType: StepEntityConstructor< EntityTypeIDs, BaseEntity >

  // Merge neighbouring leaf records only when the hole between them is
  // a few small STEP rows. A Faces[] dump is packed; a sparse list
  // must not pin the file in between.
  // eslint-disable-next-line no-magic-numbers
  private static readonly LEAF_SPAN_COALESCE_GAP_ = 1024

  private readonly vtableBuilder_: StepVtableBuilder = new StepVtableBuilder()

  // Scratch for forEachReferenceInFieldOfTypes: one record's field starts at
  // a time, cleared per record. Kept apart from vtableBuilder_ because that
  // one's buffer is shared by every descriptor's retained vtable, which is
  // exactly the per-record retention that sweep exists to avoid.
  private scratchVtable_?: StepVtableBuilder

  // typeID -> 1 (is the type or a subtype) / 2 (is not), per queried
  // constructor — see typeIDIsA.
  private readonly typeIsACache_ = new Map< unknown, Uint8Array >()

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

  // Whether the top-level express IDs arrived in non-decreasing order. The
  // lookup table already knows, but the index sidecar's `flags` word carries
  // it too, and `indexColumns()` must hand back the same verdict the parse
  // produced or an exported sidecar differs from one serialised off the
  // parse's own columns by that one bit (conway#756).
  private readonly expressIdsSorted_: boolean

  // True once `setFieldMasks` has run, whatever it was given. Every caller is
  // the IFC4-compatible IFC4X3 route, whose index is TRANSLATED (4X3 records
  // re-typed as IFC4 ones) and whose masks the v2 sidecar has no slot for —
  // and an eligible file can have nothing to mask, so `fieldMasks_` being
  // unset does not mean the index is untranslated. See `hasFieldMasks`.
  private fieldMasksApplied_: boolean = false

  // Parse-order copies of the complex entries' index fields, taken at
  // construction. The retained descriptors in `complexEntries_` are not a
  // safe source for the index once an entity has been read:
  // `getElementByLocalID` / `getTypedElementByLocalID` sort a holder's
  // `multiMapping` IN PLACE (deepest type first) before materialising it,
  // so serialising the live map after a read writes a reordered mapping and
  // the export stops being byte-identical to a fresh parse's (codex review
  // of conway#760). Complex entries are rare (0 on every corpus model), so
  // a copy costs nothing measurable. `cloneIndexEntry` keeps
  // `inlineEntities` by reference; that is safe because nothing writes an
  // entry's `inlineEntities` after the parse, and the sidecar writer never
  // reads the field.
  private readonly complexIndexEntries_?:
    Map< number, StepIndexEntry< EntityTypeIDs > >

  /**
   * The FNV-1a (`hashSource`) of the exact bytes this model's index was
   * built from, recorded by the open that built it: folded into the parse's
   * own pass on the streaming opens, taken over the resident buffer on the
   * classic ones, and adopted from the sidecar on an index-first open (the
   * index there IS the sidecar's, so its recorded hash is the identity of
   * the bytes the index describes). Recording is opt-in on the parsing
   * opens (`RECORD_SOURCE_HASH` / `recordSourceHash`); undefined when it
   * was off, or for a model built some other way.
   *
   * This, not a hash of the source at export time, is what an exported
   * index sidecar records (conway#756, codex review of conway#760): the
   * index describes the bytes that were PARSED, and a resident buffer
   * mutated after open — or a same-length store swapped in by
   * `spillSourceToExternalStore`, which checks only the length — would
   * otherwise be written under the new bytes' hash and pass a verified
   * reopen with the old offsets. Recorded this way, that reopen is refused
   * as stale instead.
   */
  public indexedSourceHash?: number

  /**
   * The sampled digest (`index_sidecar.ts#sampledSourceSpans`) of the same
   * bytes as {@link indexedSourceHash}, recorded beside it by the same opens
   * and adopted the same way from a sidecar. A v3 sidecar carries it so a
   * revisit can verify about 0.5 MB of the store instead of all of it
   * (conway#758). Undefined whenever `indexedSourceHash` is.
   */
  public indexedSampledHash?: number

  /**
   * Is this model's index a mid-parse PREFIX? True only for a model built
   * over `ColumnarIndexSink.snapshot()` columns — the parse-time preview
   * channel's generations. It changes no behaviour, only what an
   * unresolved reference is allowed to CLAIM: on a prefix the record may
   * still be ahead of the parse (conway#580).
   */
  public readonly indexIsPrefix: boolean

  // Highest express ID in the index, computed on first read. The index is
  // fixed for a model's lifetime (a growing prefix is a NEW model per
  // generation, not a mutated one), so one scan is enough — and only the
  // dangling-reference throw path reads it, so a healthy load never pays
  // for it at all. A full scan rather than a read of the last row: express
  // IDs are not required to be sorted (`expressIdsSorted`).
  private maxIndexedExpressID_?: number

  // Lazily-materialised descriptors for touched entities, indexed by local ID;
  // dropped wholesale by invalidate(). A sparse array, not a Map: at PSB/SKYLARK
  // scale most entities are touched during extraction, where a Map's ~45 B/entry
  // overhead would dominate — an array slot is 8 B.
  private descriptorCache_:
    ( StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > | undefined )[] = []

  /** Decoded-field counts by local ID — see {@link setFieldMasks}. */
  private fieldMasks_?: Map< number, number >

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
   * @param buffer_ The buffer to read this from. Pass `undefined` together
   * with `provider` to build a model whose source is windowed from
   * construction (e.g. a streaming open — see buildModelStreaming); the
   * synchronous read paths (geometry extraction) then require the relevant
   * ranges to be resident, exactly as after `spillSourceToExternalStore`.
   * @param elementIndex The element index for this, parsed or deserialized - note this takes
   * ownership of this array in the sense it will modify values/unfold inline elements etc.
   * @param provider Optional pre-built buffer provider. When omitted, a
   * resident provider over `buffer_` is used (the classic path).
   */
  constructor(
    public readonly schema: StepEntitySchema< EntityTypeIDs, BaseEntity >,
    private buffer_: Uint8Array | undefined,
    elementIndex: StepIndexEntry<EntityTypeIDs>[] | StepIndexColumns<EntityTypeIDs>,
    provider?: StepBufferProvider ) {

    this.bufferProvider_ = provider ?? new ResidentStepBufferProvider( buffer_ as Uint8Array )

    if ( !Array.isArray( elementIndex ) ) {
      // Columns path (M7): the parse produced the SoA columns directly (see
      // columnar_index.ts) — adopt them, build the lookup tables straight off
      // the columns, and skip the object walk entirely. Inline entities are
      // already unfolded into [firstInlineElement, count) in the same order
      // the object path would have produced.
      const columns = elementIndex
      const firstInline = columns.firstInlineElement
      const inlineCount = columns.count - firstInline

      const inlineElementTable = new Uint32Array( inlineCount << 1 )

      for ( let where = 0; where < inlineCount; ++where ) {
        inlineElementTable[ where << 1 ] = firstInline + where
        inlineElementTable[ ( where << 1 ) + 1 ] = columns.address[ firstInline + where ]
      }

      this.inlineAddressMap_ = new InterpolationSearchTable32( inlineElementTable, true )

      const expressIdTable = new Uint32Array( firstInline << 1 )

      for ( let where = 0; where < firstInline; ++where ) {
        expressIdTable[ where << 1 ] = where
        expressIdTable[ ( where << 1 ) + 1 ] = columns.expressID[ where ]
      }

      this.expressIDMap_ =
        new InterpolationSearchTable32( expressIdTable, columns.expressIdsSorted )

      this.address_            = columns.address
      this.length_             = columns.length
      this.typeID_             = columns.typeID
      this.expressID_          = columns.expressID
      this.count_              = columns.count
      this.firstInlineElement_ = firstInline
      this.expressIdsSorted_   = columns.expressIdsSorted
      this.indexIsPrefix       = columns.indexIsPrefix ?? false
      this.complexEntries_     = columns.complexEntries as unknown as
        Map< number, StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > > | undefined
      this.complexIndexEntries_ = StepModelBase.snapshotComplexEntries( columns.complexEntries )
      return
    }

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
    this.expressIdsSorted_   = expressIdsAlreadySorted
    this.complexEntries_     = complexEntries
    this.complexIndexEntries_ = StepModelBase.snapshotComplexEntries(
        complexEntries as unknown as Map< number, StepIndexEntry< EntityTypeIDs > > | undefined )

    // The object index is only ever produced by a completed parse.
    this.indexIsPrefix       = false
  }


  /**
   * Copy complex entries down to their index fields, in parse order — see
   * `complexIndexEntries_`.
   *
   * @param entries The complex entries as the index arrived.
   * @return {Map | undefined} Independent copies, or undefined for none.
   */
  private static snapshotComplexEntries< TypeIDs extends number >(
      entries: Map< number, StepIndexEntry< TypeIDs > > | undefined ):
      Map< number, StepIndexEntry< TypeIDs > > | undefined {

    if ( entries === void 0 ) {
      return
    }

    const copies = new Map< number, StepIndexEntry< TypeIDs > >()

    for ( const [ localID, entry ] of entries ) {
      copies.set( localID, cloneIndexEntry( entry ) as StepIndexEntry< TypeIDs > )
    }

    return copies
  }


  /**
   * The highest express ID this model's index holds.
   *
   * A maximum, and nothing more: because express IDs need not arrive in
   * order, this does NOT bound what has been scanned, and an absent ID
   * below it was not necessarily looked for and missed. Callers must not
   * present it as a scanned range — see {@link
   * import('./dangling_reference_error').DanglingReferenceError}, whose
   * prefix message reports it as a separate fact for exactly this reason.
   *
   * @return {number} The highest indexed express ID, or 0 for an empty index.
   */
  public get maxIndexedExpressID(): number {

    if ( this.maxIndexedExpressID_ !== void 0 ) {
      return this.maxIndexedExpressID_
    }

    const expressIDs = this.expressID_
    const end        = this.firstInlineElement_

    let maximum = 0

    for ( let localID = 0; localID < end; ++localID ) {

      const expressID = expressIDs[ localID ]

      if ( expressID > maximum ) {
        maximum = expressID
      }
    }

    this.maxIndexedExpressID_ = maximum

    return maximum
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

    const descriptor: StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity > = {
      address:   this.address_[ localID ],
      length:    this.length_[ localID ],
      typeID:    typeID === -1 ? void 0 : ( typeID as EntityTypeIDs ),
      expressID: localID < this.firstInlineElement_ ?
        this.expressID_[ localID ] : void 0,
    }

    const maskedFieldCount = this.fieldMasks_?.get( localID )

    if ( maskedFieldCount !== void 0 ) {
      descriptor.maskedFieldCount = maskedFieldCount
    }

    return descriptor
  }


  /**
   * Mask the trailing fields of specific records: for each express ID, only
   * the first `count` fields are ever decoded, and every field at or past
   * `count` reads as `$` through the typed getters (and through any direct
   * `extract*` call — e.g. spatial_imposter.ts's storey `Elevation` read).
   *
   * The mechanism is the vtable: `populateVtableEntryRaw` clamps
   * `vtableCount` to `count` and ends the last kept field where field
   * `count` starts, so no cursor into the masked bytes survives, and
   * `StepEntityBase.getOffsetAndEndCursor` answers a masked record's
   * out-of-range read with a one-byte `$` rather than its "too few fields"
   * throw. Unmasked records keep that throw unchanged.
   *
   * Exists for IFC4X3 records translated to an IFC4 type whose tail
   * attributes mean something else (ifc4x3_ifc4_translation.ts):
   * IFCFACILITYPART's index 9 is a typed select, which would otherwise be
   * decoded as IfcBuildingStorey's `Elevation`. Call before any entity of
   * the model is read. Descriptors materialised earlier would carry no
   * mask, so they are dropped here.
   *
   * @param masks Decoded-field count, keyed by express ID.
   */
  public setFieldMasks( masks: ReadonlyMap< number, number > ): void {

    const byLocalID = new Map< number, number >()

    for ( const [ expressID, count ] of masks ) {

      const localID = this.expressIDMap_.get( expressID )

      if ( localID !== void 0 ) {
        byLocalID.set( localID, count )
      }
    }

    this.fieldMasks_ = byLocalID.size > 0 ? byLocalID : void 0
    this.fieldMasksApplied_ = true
    this.descriptorCache_ = []
  }


  /**
   * Has {@link setFieldMasks} been applied to this model — even with nothing
   * to mask?
   *
   * The only caller is the IFC4-compatible IFC4X3 route
   * (`ifc4x3_ifc4_compat.ts`), so this is also "is this index a translated
   * one". The index sidecar uses it to refuse an export it cannot represent
   * (conway#756): v2 has no slot for the masks, and an index-first open
   * refuses every IFC4X3 header anyway.
   *
   * @return {boolean} True after any setFieldMasks call.
   */
  public get hasFieldMasks(): boolean {
    return this.fieldMasksApplied_
  }


  /**
   * The model's entity index, as the columns it reads from — the shape
   * `serializeIndexSidecarFromColumns` takes, so an open model can write
   * the sidecar an index-first open restores (conway#756).
   *
   * These are the model's OWN arrays, not copies: the index is fixed for a
   * model's lifetime (nothing writes a column after construction), so a
   * view is safe to read and a copy of a 9 M-row index (~150 MB) would be
   * pure waste. **Do not mutate them.**
   *
   * Identity, not equivalence, is the point. Both constructor paths leave
   * the same layout — the object path's breadth-first `inlineEntities`
   * unfold is the order `ColumnarIndexSink` assigns — so the columns here
   * are the columns the parse produced, and a sidecar written from them is
   * byte-identical to one written from the parse's own columns. The parity
   * suite (`ifc_index_sidecar_export.test.ts`) pins that for both a
   * resident and a windowed open.
   *
   * `complexEntries` is NOT the live retained descriptor map but the
   * parse-order copy taken at construction (`complexIndexEntries_`): reading
   * a complex entity sorts its live `multiMapping` in place.
   *
   * @return {StepIndexColumns} The index columns.
   */
  public indexColumns(): StepIndexColumns< EntityTypeIDs > {

    return {
      address: this.address_,
      length: this.length_,
      typeID: this.typeID_,
      expressID: this.expressID_,
      count: this.count_,
      firstInlineElement: this.firstInlineElement_,
      complexEntries: this.complexIndexEntries_,
      expressIdsSorted: this.expressIdsSorted_,
      indexIsPrefix: this.indexIsPrefix ? true : void 0,
    }
  }


  /**
   * The decoded-field count set by {@link setFieldMasks} for a record.
   *
   * @param localID The record's local ID.
   * @return {number | undefined} The count, or undefined if unmasked.
   */
  public fieldMaskOf( localID: number ): number | undefined {
    return this.fieldMasks_?.get( localID )
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

      // The module-level scratch parsing buffer stays pointed at the
      // last buffer a numeric extraction read from — after a parse,
      // that's this model's FULL source. Releasing caches (and
      // especially spilling the source, which routes through here)
      // must drop that pin too, or the released source stays alive
      // via the scratch (heap-snapshot verified). Safe globally: every
      // use reinits the scratch first, and any other live model just
      // repoints it on its next read.
      releaseScratchParsingBuffer()

      // Common entries: drop their materialised descriptors outright — this is
      // the memory the old retained object array could never release. They
      // rematerialise from the columns on next access.
      this.descriptorCache_ = []
      this.capturedViews_.clear()

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
   * Resolve an express ID to a local ID, using `hintLocalID + 1` when
   * the next record is the one we want. Tessellated Faces lists are
   * sequential (PSB: every faceset), so this turns 9.1M interpolation
   * searches into one per faceset.
   *
   * @param expressID The referenced record.
   * @param hintLocalID Local ID of the previous resolve, if any.
   * @return {number | undefined} The local ID, or undefined if unknown.
   */
  public resolveExpressID(
      expressID: number,
      hintLocalID?: number ): number | undefined {

    if ( hintLocalID !== void 0 ) {

      const next = hintLocalID + 1

      if ( next < this.firstInlineElement_ &&
        this.expressID_[ next ] === expressID ) {
        return next
      }
    }

    return this.expressIDMap_.get( expressID )
  }


  /**
   * Append a local record's unsigned-integer list field into `sink`
   * without an express-ID lookup. The reference-level twin of
   * `StepEntityBase.extractIntegerArrayInto`, for hot loops that walk
   * millions of small records (tessellated facesets) where constructing
   * an entity per record dominates. It deliberately handles only the
   * simple case and reports failure otherwise, so callers keep a
   * correct fallback rather than this growing subtle special cases:
   * the record must be single-class (no multi-mapping) and exactly
   * `expectedTypeID`.
   *
   * Field 0 is the data-block start the parser stored in `address_`
   * (after `TYPE(`). Reading it from the columns skips the descriptor
   * and vtable `entry()` would retain — on a 9 M-face model those are
   * the objects the faceset path is trying not to build. Non-zero
   * offsets still go through a vtable, because only field 0 has that
   * address identity.
   *
   * @param localID The record's local ID.
   * @param offset The field's vtable offset.
   * @param expectedTypeID The type the record must be.
   * @param sink Receives the appended values.
   * @return {number | undefined} Count appended, or undefined when the
   * fast path does not apply.
   */
  public extractIntegerArrayByLocalIDInto(
      localID: number,
      offset: number,
      expectedTypeID: EntityTypeIDs,
      sink: Uint32Sink ): number | undefined {

    if ( localID >= this.count_ ) {
      return void 0
    }

    // Multi-mapped records need per-depth base offsets; leave them to
    // the generated getters. typeID_ is -1 when unset.
    if ( this.complexEntries_?.has( localID ) ||
      this.typeID_[ localID ] !== expectedTypeID ) {
      return void 0
    }

    if ( offset === 0 ) {

      const address = this.address_[ localID ]
      const acquisition = this.bufferProvider_.acquire(
          address, this.length_[ localID ] )
      const viewAddress = address - acquisition.offset

      return extractIntegerArrayAt(
          acquisition.buffer,
          viewAddress,
          acquisition.buffer.length,
          sink )
    }

    const element = this.entry( localID )

    if ( element.vtableIndex === void 0 && !this.populateVtableEntryRaw( element ) ) {
      return void 0
    }

    if ( element.buffer === void 0 ) {
      this.populateBufferEntry( localID )
    }

    const vtable = element.vtable
    const buffer = element.buffer

    if ( vtable === void 0 || buffer === void 0 ||
      offset >= ( element.vtableCount ?? 0 ) ) {
      return void 0
    }

    // Same window the vtable cursors were recorded against, and the
    // same end bound the generated array getters use.
    return extractIntegerArrayAt(
        buffer, vtable[ ( element.vtableIndex as number ) + offset ], buffer.length, sink )
  }


  /**
   * Append a referenced record's unsigned-integer list field into `sink`
   * without materialising the referenced entity.
   *
   * @param expressID The referenced record's express ID.
   * @param offset The field's vtable offset within the record.
   * @param expectedTypeID The type the record must be.
   * @param sink Receives the appended values.
   * @return {number | undefined} Count appended, or undefined when the
   * fast path does not apply.
   */
  public extractIntegerArrayByExpressIDInto(
      expressID: number,
      offset: number,
      expectedTypeID: EntityTypeIDs,
      sink: Uint32Sink ): number | undefined {

    const localID = this.expressIDMap_.get( expressID )

    if ( localID === void 0 ) {
      return void 0
    }

    return this.extractIntegerArrayByLocalIDInto(
        localID, offset, expectedTypeID, sink )
  }


  /**
   * Is a schema type ID the given entity class or one of its subclasses?
   *
   * The same predicate {@link getTypedElementByLocalID} applies before it
   * constructs a single-class record (`type === constructor ||
   * constructor.prototype instanceof type`), answered from the type ID
   * alone so no entity has to be built to ask it. Deliberately the
   * prototype chain and not `type.query`: AP214's generated `query`
   * arrays are not full subtype closures (`representation_item.query`
   * omits `geometric_representation_item`), so a `query` test would
   * reject records the typed getter accepts.
   *
   * @param typeID A schema type ID (from {@link typeIDOf}).
   * @param type The entity class to test against.
   * @return {boolean} True if a record of `typeID` reads as `type`.
   */
  public typeIDIsA(
      typeID: number,
      type: StepEntityConstructorAbstract< EntityTypeIDs > ): boolean {

    const constructors = this.schema.constructors as
      ( StepEntityConstructor< EntityTypeIDs, BaseEntity > | undefined )[]

    let cache = this.typeIsACache_.get( type )

    if ( cache === void 0 ) {
      cache = new Uint8Array( constructors.length )
      this.typeIsACache_.set( type, cache )
    }

    let answer = cache[ typeID ]

    if ( answer === 0 ) {

      const constructorRead = constructors[ typeID ]
      const isA = constructorRead !== void 0 &&
        ( ( type as unknown ) === constructorRead ||
          constructorRead.prototype instanceof ( type as unknown as typeof Object ) )

      answer = isA ? 1 : 2

      if ( typeID < cache.length ) {
        cache[ typeID ] = answer
      }
    }

    return answer === 1
  }


  /**
   * Visit, for every record of `types`, the record that one of its
   * single-reference fields names — read straight from the record's
   * source bytes, without materialising a descriptor, an entity or a
   * retained vtable for it.
   *
   * This is the walk `populateStyledItemsMap` does in both IFC and AP214
   * (styled item → the representation item it styles). Through
   * `model.types()` it cost one descriptor + entity + vtable per record,
   * all retained: on a 231 MB IFC with 194k styled items, ~1.6–2.4 s and
   * ~120–136 MB of heap in one synchronous stretch at the end of the open.
   *
   * Only the plain case is answered here, and everything else is handed
   * back to the caller **in the same position in the walk**, so a caller
   * that runs its existing entity-based code in `onOther` gets exactly the
   * old results, in exactly the old order (a `Map` it fills keeps the same
   * insertion order). A record is plain when it:
   *
   *  - is a single-class, top-level record (not complex/multi-mapped, not
   *    an inline entity), with no field mask ({@link setFieldMasks});
   *  - has the field, and the field is a `#<digits>` reference, parsed by
   *    the same `stepExtractReference` the generated getters use;
   *  - names a record this model indexes (a dangling reference goes to
   *    `onOther`, where an AP214 getter throws and logs it); and
   *  - when `targetType` is given, names a single-class record that
   *    {@link typeIDIsA} that type — the check a typed getter
   *    (`extractElement(..., type)`) makes. Anything it would reject goes
   *    to `onOther`, where the getter throws the same error it always did.
   *
   * Field 0 is read at the record's stored address (the data-block start,
   * the same identity {@link extractIntegerArrayByLocalIDInto} relies on);
   * other fields are located with the schema tokenizer into a scratch
   * vtable that is cleared per record.
   *
   * On a windowed source a record that is not resident goes to `onOther`
   * too: `acquire` throws `StepBufferNotResidentError` for it, and the
   * caller's entity path then throws the same error inside its own
   * try/catch, as it did before this helper existed.
   *
   * @param types The entity classes whose `query` to walk — the same cursor
   * {@link types} walks, so the visit order is identical.
   * @param fieldIndex The field's position in a single-class record.
   * @param onReference Called with (record local ID, target local ID) for a
   * plain record.
   * @param onOther Called with the record's local ID for every other record.
   * @param targetType If given, the class the target must be (see above).
   */
  public forEachReferenceInFieldOfTypes(
      types: StepEntityConstructorAbstract< EntityTypeIDs >[],
      fieldIndex: number,
      onReference: ( localID: number, targetLocalID: number ) => void,
      onOther: ( localID: number ) => void,
      targetType?: StepEntityConstructorAbstract< EntityTypeIDs > ): void {

    const distinctTypes = types.length === 1 ? ( types[ 0 ].query ) :
      ( new Set( types.flatMap( ( type ) => type.query ) ) )

    const cursor = this.typeIndex.cursor( ...distinctTypes )

    try {
      while ( cursor.step() ) {

        const high = cursor.high
        let low = cursor.low

        while ( low !== 0 ) {

          const lowestOneHot = extractOneHotLow( low )

          low ^= ( 1 << lowestOneHot )

          const localID = ( high | lowestOneHot )
          const target = this.plainFieldReference_( localID, fieldIndex, targetType )

          if ( target === void 0 ) {
            onOther( localID )
          } else {
            onReference( localID, target )
          }
        }
      }
    } finally {
      cursor.free()
    }
  }


  /**
   * The plain-case read behind {@link forEachReferenceInFieldOfTypes}.
   *
   * @param localID The record.
   * @param fieldIndex The field's position.
   * @param targetType Optional class the target must be.
   * @return {number | undefined} The target's local ID, or undefined when
   * the record is not plain and the caller's entity path must decide.
   */
  private plainFieldReference_(
      localID: number,
      fieldIndex: number,
      targetType: StepEntityConstructorAbstract< EntityTypeIDs > | undefined ):
      number | undefined {

    if ( localID >= this.firstInlineElement_ ||
         this.complexEntries_?.has( localID ) ||
         this.fieldMasks_?.has( localID ) ) {
      return void 0
    }

    const address = this.address_[ localID ]
    const length = this.length_[ localID ]

    let acquisition: StepBufferAcquisition

    try {
      acquisition = this.bufferProvider_.acquire( address, length )
    } catch ( error ) {
      if ( error instanceof StepBufferNotResidentError ) {
        return void 0
      }

      throw error
    }

    const buffer = acquisition.buffer
    const start = address - acquisition.offset
    const end = start + length

    let fieldStart = start
    let fieldEnd = end

    if ( fieldIndex !== 0 ) {

      const scratch = this.scratchVtable_ ??= new StepVtableBuilder()

      scratch.clear()

      const extracted = this.schema.parser.extractDataEntry( buffer, start, end, scratch )

      if ( extracted === void 0 || fieldIndex >= extracted[ 1 ] ) {
        return void 0
      }

      const vtable = scratch.buffer

      fieldStart = vtable[ extracted[ 0 ] + fieldIndex ]
      // Same end bound StepEntityBase.getOffsetAndEndCursor gives a field.
      fieldEnd = fieldIndex + 1 !== extracted[ 1 ] ?
        vtable[ extracted[ 0 ] + fieldIndex + 1 ] - 1 :
        extracted[ 2 ]
    }

    const expressID = stepExtractReference( buffer, fieldStart, fieldEnd )

    if ( expressID === void 0 ) {
      return void 0
    }

    const targetLocalID = this.resolveExpressID( expressID )

    if ( targetLocalID === void 0 ) {
      return void 0
    }

    if ( targetType !== void 0 ) {

      const targetTypeID = this.typeID_[ targetLocalID ]

      if ( targetTypeID < 0 ||
           this.complexEntries_?.has( targetLocalID ) ||
           !this.typeIDIsA( targetTypeID, targetType ) ) {
        return void 0
      }
    }

    return targetLocalID
  }


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

    this.noteCapturedView_( element )

    // setFieldMasks: drop the masked fields' cursors entirely, and end the
    // last kept field exactly where a non-final field ends (the byte before
    // the next field's start), so no read can reach the masked bytes.
    const masked = element.maskedFieldCount

    if ( masked !== void 0 && extratedEntry[ 1 ] > masked ) {
      element.endCursor   = element.vtable[ extratedEntry[ 0 ] + masked ] - 1
      element.vtableCount = masked
    }

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

    this.noteCapturedView_( element )

    if ( element.multiMapping !== void 0 ) {

      for ( const mapped of element.multiMapping ) {
        mapped.buffer =
          this.bufferProvider_.acquire( mapped.address, mapped.length ).buffer

        this.noteCapturedView_( mapped )
      }
    }
  }

  /**
   * Remember a reference that just captured a source-window view, so
   * {@link releaseCapturedSourceViews} can drop it without knowing which
   * records a walk read. Windowed sources only: a resident source's views
   * are the source buffer itself, which nothing frees.
   *
   * @param reference The descriptor (or mapped class reference) whose
   * `buffer` was just set.
   */
  private noteCapturedView_( reference: CapturedViewHolder ): void {

    if ( this.trackCapturedSourceViews && this.buffer_ === void 0 ) {
      this.capturedViews_.add( reference )
    }
  }

  /**
   * Opt in to {@link releaseCapturedSourceViews}: remember every reference
   * that captures a window view, so a walk that cannot name the records it
   * read can drop their views wholesale. Off by default, and only the AP214
   * windowed opens turn it on (`IfcApiProxyAP214`, conway#757).
   *
   * Opt-in rather than always-on for IFC's sake (codex review of
   * conway#769): IFC pages by named closures and drops their views with
   * {@link releaseSourceViews}, which clears `buffer` without touching this
   * set, so tracking on an IFC open would keep a reference to every
   * descriptor it ever paged — memory nothing releases until close, for a
   * mechanism IFC does not use. Off, IFC's windowed opens are exactly as
   * they were.
   */
  public trackCapturedSourceViews: boolean = false

  /**
   * References holding a window view captured since the last
   * {@link releaseCapturedSourceViews}, while
   * {@link trackCapturedSourceViews} is on. A Set, so a reference whose view
   * {@link releaseSourceViews} dropped and that is read again is held once,
   * not once per capture: the size is bounded by the records read since the
   * last release, whatever else clears views in between.
   */
  private capturedViews_ = new Set< CapturedViewHolder >()

  /**
   * How many references hold a tracked window view right now (tests and
   * telemetry; always 0 unless {@link trackCapturedSourceViews} is on).
   *
   * @return {number} The count.
   */
  public get capturedSourceViewCount(): number {
    return this.capturedViews_.size
  }

  /**
   * Drop every source-window view captured since the last call — the
   * whole-model form of {@link releaseSourceViews}, for a walk that cannot
   * name the records it read. Needs {@link trackCapturedSourceViews}.
   *
   * A descriptor that read a record keeps a view of the 4 MiB window it
   * came from, and a view keeps its window alive after the LRU evicts it.
   * A walk that reads all over the model — AP214's assembly walk and its
   * demand units, which read synchronously and fault their windows in
   * (`StepExternalByteStore.readSync`) — would otherwise end up holding
   * every window of the file, however small the LRU cap. Calling this at a
   * quiescent point (between pump batches, after a property index build)
   * returns those windows to the LRU's budget. Vtables stay, and the next
   * read of a record re-acquires its view (see {@link releaseSourceViews}
   * for why the base is stable).
   *
   * No-op while the source is fully resident.
   *
   * @return {number} How many views were dropped.
   */
  public releaseCapturedSourceViews(): number {

    const captured = this.capturedViews_

    if ( captured.size === 0 ) {
      return 0
    }

    for ( const reference of captured ) {
      reference.buffer = void 0
    }

    const released = captured.size

    captured.clear()

    releaseScratchParsingBuffer()

    return released
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
   * Can a synchronous read of this model's source page a missing window in
   * itself — a windowed source over a store with `readSync`
   * (`StepExternalByteStore.readSync`)? Always true while the source is
   * resident, where nothing is ever missing.
   *
   * This is what decides whether a schema without an asynchronous closure
   * pager (AP214) can be read windowed at all.
   *
   * @return {boolean} True when every synchronous read can succeed.
   */
  public get sourceReadsSynchronously(): boolean {
    return !this.isSourceExternal || this.bufferProvider_.faultsInSynchronously === true
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
   * Column type of a record, or `undefined` if the id is unknown / untyped.
   *
   * @param localID The record.
   * @return {number | undefined} The schema type id.
   */
  public typeIDOf( localID: number ): number | undefined {

    if ( localID >= this.count_ ) {
      return
    }

    const typeID = this.typeID_[ localID ]

    return typeID < 0 ? void 0 : typeID
  }

  /**
   * Absolute source address of a record.
   *
   * @param localID The record.
   * @return {number | undefined} The address.
   */
  public recordAddress( localID: number ): number | undefined {

    return localID < this.count_ ? this.address_[ localID ] : void 0
  }

  /**
   * Source length of a record.
   *
   * @param localID The record.
   * @return {number | undefined} The length.
   */
  public recordLength( localID: number ): number | undefined {

    return localID < this.count_ ? this.length_[ localID ] : void 0
  }

  /**
   * Pin an arbitrary source span (e.g. a faceset's packed Faces[] run).
   *
   * @param address Absolute start.
   * @param length Length in bytes.
   */
  public pinAddressRange( address: number, length: number ): void {

    if ( !this.isSourceExternal ) {
      return
    }

    this.bufferProvider_.pinRange?.( address, length )
  }

  /**
   * Drop one {@link pinAddressRange} hold.
   *
   * @param address Absolute start.
   * @param length Length in bytes.
   */
  public unpinAddressRange( address: number, length: number ): void {

    if ( !this.isSourceExternal ) {
      return
    }

    this.bufferProvider_.unpinRange?.( address, length )
  }

  /**
   * Page an arbitrary source span.
   *
   * @param address Absolute start.
   * @param length Length in bytes.
   * @return {Promise<void>} Resolves when resident.
   */
  public async ensureResidentRange( address: number, length: number ): Promise< void > {

    if ( !this.isSourceExternal ) {
      return
    }

    await this.bufferProvider_.ensureResident( address, length )
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
   * Page in the byte ranges a record *and every `#ref` reachable from
   * its text* will need, so a following synchronous extract of that
   * subgraph succeeds on a windowed source. Inverse relationships
   * (not written in the record) are not discovered — callers that
   * need them (rel-voids, styled items) pass their local IDs as
   * `extraLocalIDs`.
   *
   * No-op while the source is fully resident.
   *
   * @param localID Seed record.
   * @param extraLocalIDs Additional seeds (voids, styles, materials).
   * @param seen Optional set to extend (also skips already-pinned IDs).
   * @param descend If set, records for which this returns false are
   * still visited (pinned, in `seen`) but their `#refs` are not
   * followed — e.g. an `IfcPolygonalFaceSet` whose Faces[] payload
   * is paged as one span afterwards.
   * @param leafSpans Optional out-array of coalesced pin ranges for
   * {@link spanLeaf} children — caller must {@link unpinAddressRange}
   * each.
   * @param spanLeaf If set, matching children are *not* visited
   * (absent from `seen`); their bytes are one pin span. Packed
   * extract reads `IfcIndexedPolygonalFace.CoordIndex` as integers —
   * following those faces pinned ~78k records per PSB product. If
   * omitted, `!descend` children use this span path (test helper).
   * @param claimed Optional out-set of the IDs *this call* claimed and
   * awaited residency for — a strict subset of `seen`. When `seen` is
   * shared across concurrent walks (a batch of products sharing mapped
   * geometry), an ID another walk claimed is skipped here and is NOT
   * resident yet from this call's point of view: that walk's pin holds
   * the chunk once it lands, but its read is still in flight. Anything
   * that must synchronously read a record's bytes after this returns
   * has to iterate `claimed`, never `seen` (conway#526).
   * @param skip If set, referenced records for which this returns true are
   * left out entirely: not visited, pinned, paged or spanned, and their
   * `#refs` not followed. For a reader that will not touch their bytes (a
   * property flatten leaving representations as handles). Seeds are never
   * skipped.
   * @return {Promise<Set<number>>} The local IDs that were visited.
   */
  public async ensureResidentClosureByLocalID(
      localID: number,
      extraLocalIDs?: Iterable<number>,
      seen: Set< number > = new Set< number >(),
      descend?: ( localID: number ) => boolean,
      leafSpans?: { address: number, length: number }[],
      spanLeaf?: ( localID: number ) => boolean,
      claimed?: Set< number >,
      skip?: ( localID: number ) => boolean ): Promise< Set< number > > {

    if ( !this.isSourceExternal ) {
      return seen
    }

    // BFS by hop: page a whole frontier in parallel so a product whose
    // #refs sit in different OPFS chunks is one round-trip, not one
    // await per record. Claim `seen` before the await so overlapping
    // walks (a batch of products sharing mapped geometry) pin once.
    const frontier: number[] = []

    const enqueue = ( id: number ) => {

      if ( id < this.count_ && !seen.has( id ) ) {
        frontier.push( id )
      }
    }

    enqueue( localID )

    if ( extraLocalIDs !== void 0 ) {

      for ( const extra of extraLocalIDs ) {
        enqueue( extra )
      }
    }

    while ( frontier.length > 0 ) {

      const wave: number[] = []

      for ( const id of frontier ) {

        if ( seen.has( id ) || id >= this.count_ ) {
          continue
        }

        // Claim + pin before the await so a sibling ensure cannot
        // evict this range once its own ensurePins_ drop.
        seen.add( id )
        this.pinByLocalID( id )
        wave.push( id )
        claimed?.add( id )
      }

      frontier.length = 0

      if ( wave.length === 0 ) {
        break
      }

      await Promise.all( wave.map( ( id ) => this.ensureResidentByLocalID( id ) ) )

      const waveSpans: { address: number, length: number }[] = []

      for ( const id of wave ) {

        if ( descend !== void 0 && !descend( id ) ) {
          continue
        }

        const skipped: number[] = []

        for ( const expressID of this.scanRecordRefs_( id ) ) {

          const referenced = this.expressIDMap_.get( expressID )

          if ( referenced === void 0 || seen.has( referenced ) ||
               skip?.( referenced ) ) {
            continue
          }

          // Packed leaves (Faces[]) are spanned, not visited. Stop
          // nodes (facesets) fail `descend` so we do not scan their
          // refs, but they still go on the frontier so they land in
          // `seen` for the payload pass.
          const leaf = spanLeaf !== void 0 ?
            spanLeaf( referenced ) :
            ( descend !== void 0 && !descend( referenced ) )

          if ( leaf ) {
            skipped.push( referenced )
            continue
          }

          frontier.push( referenced )
        }

        if ( skipped.length > 0 ) {

          for ( const span of this.spansOf_( skipped ) ) {
            this.pinAddressRange( span.address, span.length )
            waveSpans.push( span )
            leafSpans?.push( span )
          }
        }
      }

      if ( waveSpans.length > 0 ) {
        await Promise.all( waveSpans.map( ( span ) =>
          this.ensureResidentRange( span.address, span.length ) ) )
      }
    }

    return seen
  }


  /**
   * Hold a record's source range against windowed LRU eviction until
   * {@link unpinByLocalID}. No-op while the source is fully resident.
   *
   * @param localID The record to pin.
   */
  public pinByLocalID( localID: number ): void {

    if ( !this.isSourceExternal || localID >= this.count_ ) {
      return
    }

    this.bufferProvider_.pinRange?.(
        this.address_[ localID ], this.length_[ localID ] )
  }


  /**
   * Drop one {@link pinByLocalID} hold.
   *
   * @param localID The record to unpin.
   */
  public unpinByLocalID( localID: number ): void {

    if ( !this.isSourceExternal || localID >= this.count_ ) {
      return
    }

    this.bufferProvider_.unpinRange?.(
        this.address_[ localID ], this.length_[ localID ] )
  }


  /**
   * Drop captured source-window views on `localIDs` so the LRU can
   * evict those chunks. Vtables stay — `acquire` of the same
   * `(address, length)` is at a stable base. The next
   * `ensureResident` + field read rematerialises the view.
   *
   * @param localIDs Records whose `buffer` views to drop.
   */
  public releaseSourceViews( localIDs: Iterable< number > ): void {

    if ( !this.isSourceExternal ) {
      return
    }

    for ( const localID of localIDs ) {

      if ( localID >= this.count_ ) {
        continue
      }

      const item =
        this.complexEntries_?.get( localID ) ?? this.descriptorCache_[ localID ]

      if ( item === void 0 ) {
        continue
      }

      item.buffer = void 0

      if ( item.multiMapping !== void 0 ) {

        for ( const mapped of item.multiMapping ) {
          mapped.buffer = void 0
        }
      }
    }

    releaseScratchParsingBuffer()
  }


  /**
   * Evict unpinned source windows until residency is back within the
   * window cap. Eviction otherwise runs only inside an ensure, so a walk
   * that pinned more windows than the cap and has just unpinned them
   * stays over budget until the next ensure. No-op while resident.
   */
  public trimSourceResidency(): void {
    this.bufferProvider_.trimToCap?.()
  }


  /**
   * Unpin every local ID in `localIDs` (best-effort; missing IDs are
   * ignored). Use after {@link ensureResidentClosureByLocalID}, which
   * pins as it walks.
   *
   * @param localIDs The records to unpin.
   */
  public unpinLocalIDs( localIDs: Iterable< number > ): void {

    for ( const localID of localIDs ) {
      this.unpinByLocalID( localID )
    }
  }


  /**
   * Call `visit` once per record with that record's bytes resident,
   * paging a windowed source in **file order**, so each source window
   * is read about once however scattered the records are in the
   * caller's order (conway#752).
   *
   * Callers that need results in their own order collect them here and
   * reorder after. The visit order is by source address, which is not
   * the iteration order of `expressIDs`.
   *
   * On a windowed source, each record is pinned across its await, so an
   * interleaved paging (e.g. a concurrent geometry pump) cannot evict it
   * before `visit` reads it. After `visit` returns, its captured window
   * views are dropped ({@link releaseSourceViews}), so a walk over
   * thousands of records does not keep every window it touched
   * reachable past the LRU budget. `visit` must therefore copy out what
   * it needs, not hold views.
   *
   * Fully resident sources visit in iteration order, with no awaits.
   * Unknown express IDs are visited too (a read of one resolves to
   * nothing, exactly as it would on a resident source), and a repeated
   * express ID is visited once.
   *
   * @param expressIDs The records to visit.
   * @param visit Called synchronously with each express ID while its
   * record is resident.
   * @return {Promise<void>} Resolves after every record is visited.
   */
  public async visitResidentInFileOrder(
      expressIDs: Iterable< number >,
      visit: ( expressID: number ) => void ): Promise< void > {

    const seenExpressIDs = new Set< number >()

    if ( !this.isSourceExternal ) {

      for ( const expressID of expressIDs ) {

        if ( !seenExpressIDs.has( expressID ) ) {

          seenExpressIDs.add( expressID )
          visit( expressID )
        }
      }

      return
    }

    const localIDs: number[] = []
    const localToExpress = new Map< number, number >()

    for ( const expressID of expressIDs ) {

      if ( seenExpressIDs.has( expressID ) ) {
        continue
      }

      seenExpressIDs.add( expressID )

      const localID = this.resolveExpressID( expressID )

      if ( localID === void 0 || localID >= this.count_ ) {
        // Nothing to page: the read resolves to nothing, as on a
        // resident source.
        visit( expressID )
        continue
      }

      localIDs.push( localID )
      localToExpress.set( localID, expressID )
    }

    const address = this.address_

    localIDs.sort( ( a, b ) => address[ a ] - address[ b ] )

    for ( const localID of localIDs ) {

      this.pinByLocalID( localID )

      try {

        await this.ensureResidentByLocalID( localID )
        visit( localToExpress.get( localID )! )

      } finally {

        this.unpinByLocalID( localID )
        this.releaseSourceViews( [ localID ] )
      }
    }
  }


  /**
   * Call `visit` with each record's own source bytes (its argument list,
   * the `[address, address + length)` range that `extractLineArguments`
   * reads) in **file order**, reading a windowed source as coalesced
   * record spans straight from the store instead of paging whole windows.
   *
   * For sweeps over a sparse type: one 860 MB model's 23.5 k
   * IfcRelDefinesByProperties records hold 1.2 MB between them but sit in
   * every one of its 215 4 MiB windows, so {@link visitResidentInFileOrder}
   * over them reads the whole file, where these spans read ~20 MB
   * (conway#755).
   *
   * Records closer than `maxGapBytes` share one read, up to `maxSpanBytes`
   * a span (a record longer than that is a span of its own), and up to
   * {@link SPAN_READS_IN_FLIGHT} reads are in flight at once. Nothing is
   * paged in or cached and no descriptor captures a view, so the sweep
   * leaves the window as it found it (StepBufferProvider.readSpan).
   *
   * Complex (multi-mapped) records keep their fields in their mapped
   * records' ranges, so they are not visited; their local IDs are returned
   * for the caller to read through {@link visitResidentInFileOrder}. Local
   * IDs out of range are skipped, and a repeated one is visited once. On a
   * resident source every record is a view over the buffer, visited
   * without an await.
   *
   * @param localIDs The records to visit.
   * @param visit Called synchronously with each record's local ID and its
   * bytes. The bytes are only valid during the call.
   * @param maxGapBytes Largest gap between records read as one span.
   * @param maxSpanBytes Longest span to read at once.
   * @return {Promise<number[]>} The complex records, in file order, that
   * were not visited.
   */
  public async visitRecordBytesInFileOrder(
      localIDs: Iterable< number >,
      visit: ( localID: number, bytes: Uint8Array ) => void,
      maxGapBytes: number = DEFAULT_SPAN_GAP_BYTES,
      maxSpanBytes: number = DEFAULT_MAX_SPAN_BYTES ): Promise< number[] > {

    const address = this.address_
    const length  = this.length_
    const sorted: number[] = []
    const complex: number[] = []
    const seen = new Set< number >()

    for ( const localID of localIDs ) {

      if ( localID >= this.count_ || seen.has( localID ) ) {
        continue
      }

      seen.add( localID )
      sorted.push( localID )
    }

    sorted.sort( ( a, b ) => address[ a ] - address[ b ] )

    // Coalesce into spans: [first, end) indices into `sorted`, and the
    // byte range covering them.
    const spans: { first: number, end: number, start: number, stop: number }[] = []

    for ( let i = 0; i < sorted.length; ++i ) {

      const localID = sorted[ i ]

      if ( this.complexEntries_?.get( localID )?.multiMapping !== void 0 ) {
        complex.push( localID )
        continue
      }

      const start = address[ localID ]
      const stop  = start + length[ localID ]
      const last  = spans[ spans.length - 1 ]

      if ( last !== void 0 && start - last.stop <= maxGapBytes &&
           Math.max( stop, last.stop ) - last.start <= maxSpanBytes ) {

        last.end  = i + 1
        last.stop = Math.max( stop, last.stop )
        continue
      }

      spans.push( { first: i, end: i + 1, start, stop } )
    }

    const buffer = this.buffer_

    if ( buffer !== void 0 ) {

      for ( const span of spans ) {
        for ( let i = span.first; i < span.end; ++i ) {

          const localID = sorted[ i ]

          if ( this.complexEntries_?.get( localID )?.multiMapping === void 0 ) {
            visit( localID, buffer.subarray( address[ localID ], address[ localID ] + length[ localID ] ) )
          }
        }
      }

      return complex
    }

    const provider = this.bufferProvider_
    const read = ( span: typeof spans[ number ] ) => {
      const bytes = provider.readSpan( span.start, span.stop - span.start )
      // A failed read surfaces at its await below; this keeps the reads
      // queued behind it from rejecting unobserved once that throws.
      bytes.catch( () => void 0 )
      return bytes
    }
    const inflight: Promise< Uint8Array >[] = []

    for ( let next = 0; next < Math.min( SPAN_READS_IN_FLIGHT, spans.length ); ++next ) {
      inflight.push( read( spans[ next ] ) )
    }

    for ( let s = 0; s < spans.length; ++s ) {

      const span  = spans[ s ]
      const bytes = await inflight[ s ]

      if ( s + SPAN_READS_IN_FLIGHT < spans.length ) {
        inflight.push( read( spans[ s + SPAN_READS_IN_FLIGHT ] ) )
      }

      // Drop our hold on the span's bytes once it is visited.
      delete inflight[ s ]

      for ( let i = span.first; i < span.end; ++i ) {

        const localID = sorted[ i ]

        if ( this.complexEntries_?.get( localID )?.multiMapping !== void 0 ) {
          continue
        }

        const from = address[ localID ] - span.start

        visit( localID, bytes.subarray( from, from + length[ localID ] ) )
      }
    }

    return complex
  }


  /**
   * Express-ID twin of {@link ensureResidentClosureByLocalID}. Unknown
   * IDs resolve to an empty visit set.
   *
   * @param expressID Seed record.
   * @param extraLocalIDs Additional seeds (local IDs).
   * @return {Promise<Set<number>>} The local IDs that were visited.
   */
  public async ensureResidentClosureByExpressID(
      expressID: number,
      extraLocalIDs?: Iterable<number>,
      seen?: Set< number > ): Promise< Set< number > > {

    if ( !this.isSourceExternal ) {
      return seen ?? new Set< number >()
    }

    const localID = this.expressIDMap_.get( expressID )

    if ( localID === void 0 ) {
      return seen ?? new Set< number >()
    }

    return this.ensureResidentClosureByLocalID(
        localID, extraLocalIDs, seen )
  }


  /**
   * Source spans covering the records referenced by `expressIDs` from
   * `fromIndex` onward. A packed Faces[] run is consecutive in parse
   * order — two express-ID lookups then cover the whole range. Sparse
   * sets are coalesced into tight runs so intervening file is not
   * pinned.
   *
   * @param expressIDs Referenced express IDs (e.g. a faceset's #refs).
   * @param fromIndex First index to include (skip Coordinates at [0]).
   * @return {{address: number, length: number}[]} The spans.
   */
  public spansOfExpressIDs(
      expressIDs: readonly number[],
      fromIndex: number = 0 ): { address: number, length: number }[] {

    let minExpressID = Infinity
    let maxExpressID = 0
    let count = 0

    for ( let i = fromIndex; i < expressIDs.length; ++i ) {

      const expressID = expressIDs[ i ]

      if ( expressID < minExpressID ) {
        minExpressID = expressID
      }

      if ( expressID > maxExpressID ) {
        maxExpressID = expressID
      }

      ++count
    }

    if ( count === 0 || !Number.isFinite( minExpressID ) ) {
      return []
    }

    const minLocal = this.expressIDMap_.get( minExpressID )
    const maxLocal = this.expressIDMap_.get( maxExpressID )

    if ( minLocal === void 0 || maxLocal === void 0 ) {
      return []
    }

    const lo = Math.min( minLocal, maxLocal )
    const hi = Math.max( minLocal, maxLocal )

    if ( hi - lo + 1 === count ) {
      const address = this.address_[ lo ]
      const end = this.address_[ hi ] + this.length_[ hi ]

      if ( end <= address ) {
        return []
      }

      return [ { address, length: end - address } ]
    }

    const locals: number[] = []

    for ( let i = fromIndex; i < expressIDs.length; ++i ) {

      const localID = this.expressIDMap_.get( expressIDs[ i ] )

      if ( localID !== void 0 ) {
        locals.push( localID )
      }
    }

    return this.spansOf_( locals )
  }


  /**
   * Coalesce `localIDs` into tight source runs. Records more than
   * {@link LEAF_SPAN_COALESCE_GAP_} apart stay separate so a sparse
   * Faces[] list does not pin the file between them.
   *
   * @param localIDs The records.
   * @return {{address: number, length: number}[]} The spans.
   */
  private spansOf_(
      localIDs: number[] ): { address: number, length: number }[] {

    const items: { address: number, length: number }[] = []

    for ( const id of localIDs ) {

      if ( id >= this.count_ ) {
        continue
      }

      items.push( {
        address: this.address_[ id ],
        length: this.length_[ id ],
      } )
    }

    items.sort( ( a, b ) => a.address - b.address )

    const spans: { address: number, length: number }[] = []
    let run: { address: number, length: number } | undefined

    for ( const item of items ) {

      if ( run === void 0 ) {
        run = { address: item.address, length: item.length }
        continue
      }

      const runEnd = run.address + run.length

      if ( item.address <= runEnd + StepModelBase.LEAF_SPAN_COALESCE_GAP_ ) {
        const end = Math.max( runEnd, item.address + item.length )
        run.length = end - run.address
        continue
      }

      spans.push( run )
      run = { address: item.address, length: item.length }
    }

    if ( run !== void 0 ) {
      spans.push( run )
    }

    return spans
  }


  /**
   * Express IDs referenced by a resident record (`#<id>` tokens in its
   * text, including multi-mapped class records). The record itself
   * must already be resident.
   *
   * @param localID The record to scan.
   * @return {number[]} Distinct referenced express IDs.
   */
  public referencedExpressIDs( localID: number ): number[] {
    return this.scanRecordRefs_( localID )
  }


  /**
   * Scan a resident record's bytes for `#<expressID>` references.
   *
   * @param localID The record to scan.
   * @return {number[]} Distinct referenced express IDs.
   */
  private scanRecordRefs_( localID: number ): number[] {

    const address = this.address_[ localID ]
    const length = this.length_[ localID ]
    const acquisition = this.bufferProvider_.acquire( address, length )
    const viewStart = address - acquisition.offset

    const refs = scanExpressRefs( acquisition.buffer, viewStart, length )

    const complex = this.complexEntries_?.get( localID )

    if ( complex?.multiMapping === void 0 ) {
      return refs
    }

    const seen = new Set< number >( refs )

    for ( const mapped of complex.multiMapping ) {

      const mappedAcquisition =
        this.bufferProvider_.acquire( mapped.address, mapped.length )
      const mappedStart = mapped.address - mappedAcquisition.offset

      for ( const expressID of scanExpressRefs(
          mappedAcquisition.buffer, mappedStart, mapped.length ) ) {

        if ( !seen.has( expressID ) ) {
          seen.add( expressID )
          refs.push( expressID )
        }
      }
    }

    return refs
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

    const memoized = element.entity as BaseEntity | undefined

    if ( memoized !== void 0 ) {

      // conway#606. The memo records the entity, never the type a caller
      // asked for, and ANY earlier read populates it — including the
      // untyped `getElementByLocalID`. So the type test below, which used
      // to be the only one in this method, ran on a memo MISS only: a
      // typed lookup of an already-materialised record returned the cached
      // object through the `as O` cast without checking it at all, and
      // callers of `extractElement` got an entity of the wrong class where
      // their own declared field type says otherwise. Memoization defaults
      // to on, so this was the ordinary path, not a corner.
      //
      // `instanceof` is the same predicate the construct below applies,
      // not a second opinion on it. `element.entity` for a single-mapped
      // record is only ever `new schema.constructors[ element.typeID ]`
      // (here, or in `getElementByLocalID`), and for an instance of that
      // constructor `entity instanceof type` holds exactly when
      // `type === constructorRead || constructorRead.prototype instanceof
      // type` does — the first disjunct is the instance's own prototype,
      // the second its strict ancestors, and together they are its whole
      // prototype chain. It is also what the multi-mapping branch above
      // has always used to pick a variant.
      //
      // One record breaks that "only ever `schema.constructors`" rule and
      // is worth naming, because it is the single place where a memo hit
      // and a memo miss can still disagree. A type-0 external-mapping
      // container reaching HERE (rather than the multi-mapping branch)
      // holds an `externalMappingType` instance, since that is what
      // `getElementByLocalID` builds for type 0, while the construct path
      // below reads `schema.constructors[ 0 ]`, which is `undefined`. It
      // is reachable: the parser mints type 0 for a complex instance and
      // normally attaches a `multiMapping`, but a degenerate `#5=();`
      // leaves that undefined and lands here — verified by parsing one.
      // So a cold lookup answers `undefined` where a warm one answers the
      // mapping object. The divergence is confined to a `type` argument of
      // `StepEntityBase` / `StepExternalMapping` / `<Schema>StepExternalMapping`,
      // none of which any generated getter passes; for every schema type a
      // caller can actually name, both answers are `undefined`, because
      // that class descends from `StepEntityBase` alone. Left as it is
      // rather than special-cased: guarding it would add a branch for a
      // query nothing issues, and the warm answer is the truthful one.
      //
      // A mismatch therefore returns `undefined` rather than falling
      // through to reconstruct: the fall-through would call the same
      // constructor and fail the same test, so it could only build the
      // rejected class again. The eviction/churn trade the issue raises is
      // not reachable — a record has one schema type, so "read as two
      // different types" cannot produce two different memo tenants — and
      // not evicting keeps referential equality for the holders that asked
      // for a type this record actually is.
      return ( memoized instanceof type ? memoized : void 0 ) as O | undefined
    }

    let entity: BaseEntity | undefined

    if (element.typeID !== void 0) {

      const elementTypeID = element.typeID

      // TODO - we actually need to make this handle unknown type IDs by adding
      // an ENTITY_UNKNOWN type - CS
      const constructorRead =
          this.schema.constructors[elementTypeID] as StepEntityConstructor< EntityTypeIDs, BaseEntity > | undefined

      if ( constructorRead !== void 0 &&
           ( type === ( constructorRead as unknown ) || constructorRead.prototype instanceof type ) ) {

        entity = new constructorRead(localID, element, this )

        if ( this.elementMemoization ) {
          element.entity = entity
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
   * Iterate the express IDs of entities of a set of types (including sub-types)
   * without materializing entity descriptors or touching the source buffer —
   * only the type index and the express ID column are read, so this stays cheap
   * and safe even when the model source has been spilled to an external store.
   *
   * Multi-mapped elements (e.g. complex/multi-entity mappings) may be yielded
   * once per matching mapping, so callers that need distinct IDs should dedupe.
   *
   * @param types The list of types to iterate.
   * @return {IterableIterator} A lazy iterator of express IDs for matching entities.
   * @yields {number} The express ID of each matching entity.
   */
  public* expressIDsOfTypes<T extends StepEntityConstructorAbstract<EntityTypeIDs>[]>(
      ...types: T ): IterableIterator<number> {
    const distinctTypes = types.length === 1 ? (types[0].query) :
      (new Set(types.flatMap((type) => type.query)))

    const cursor             = this.typeIndex.cursor(...distinctTypes)
    const expressIDs         = this.expressID_
    const firstInlineElement = this.firstInlineElement_

    try {
      while (cursor.step()) {
        const high = cursor.high
        let low = cursor.low

        while (low !== 0) {
          const lowestOneHot = extractOneHotLow(low)

          low ^= (1 << lowestOneHot)

          const localID = (high | lowestOneHot)

          if (localID < firstInlineElement) {
            yield expressIDs[ localID ]
          }
        }
      }
    } finally {
      cursor.free()
    }
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
