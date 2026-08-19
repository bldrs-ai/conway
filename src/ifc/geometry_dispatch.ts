import { StepBufferNotResidentError } from '../step/step_buffer_provider'
import IfcStepModel from './ifc_step_model'
import {
  IfcMappedItem,
  IfcProduct,
  IfcProductDefinitionShape,
  IfcRelAggregates,
  IfcRepresentation,
} from './ifc4_gen'


/**
 * Placement keys for demand-driven geometry extraction: which shard — worker,
 * process, queue — should own a product, decided BEFORE extracting it.
 *
 * **Why this exists as engine code rather than a heuristic in a driver.** The
 * across-product parallelism axis (own instance, own heap, disjoint products)
 * is bounded by duplication, not by cores: shards that do not agree on where
 * shared representation geometry belongs each rebuild it. Round-robin costs
 * +25 % assets on MB-Khaya and +40.7 % on D3D at N=4. Placement fixes that,
 * but the strategies that fixed it completely in the spike scored products
 * from a graph of what they turned out to touch — an oracle a live worker
 * cannot have.
 *
 * This is the online form: an identity derived from attributes alone, over
 * columns the streamed parse already builds, costing pointer-chasing against
 * tessellation. Measured against those oracles by
 * `scripts/m3_affinity_spike.mjs`:
 *
 * | model | round-robin | this key | oracle |
 * | --- | --- | --- | --- |
 * | MB-Khaya, N=4 | 9 020 assets (+25 %) | **7 193 (+0 %)** | 7 193 (+0 %) |
 * | D3D, N=4 | 83 177 (+40.7 %) | 81 639 (+38.1 %) | 65 288 (+10.5 %) |
 *
 * **So it is exact on one model and weak on the other, and ships anyway**,
 * because wall-clock is what a user feels: 1.76x on MB-Khaya and 2.34x on
 * D3D, both better than the oracle's, which places well but balances badly
 * (its D3D shards came out 15896/29030/19585/2837).
 *
 * The D3D gap is the honest limit. On an assembly-heavy model the sharing
 * lives BELOW the representation — a profile swept along different
 * directrices, boolean operands, void geometry — where an attribute walk
 * cannot see it. Closing that needs a key with sub-representation reach and
 * a load balancer to go with it; the headroom is ~30 points of duplication,
 * about 14s of CPU on D3D at N=4.
 */

/**
 * The identity a product should be placed by.
 *
 * Follows `IfcProduct.Representation` to its shape, then to the first mapped
 * item's `MappingSource` — the shared definition every instance of a block
 * points at, so all of them hash together. Falls back to the shape
 * representation itself (products sharing a whole shape still co-locate),
 * then to the product's own local ID, which is unique and therefore places
 * that product positionally rather than pretending to know better.
 *
 * Total for attribute failures, and deliberately so: a product whose
 * attributes do not resolve gets a usable key rather than aborting a load. A
 * wrong placement costs a duplicated extraction; a thrown error costs the
 * model. That is safe precisely because an unresolvable attribute is a
 * property of the FILE — every worker sees it and takes the same fallback.
 *
 * A NON-RESIDENT read is not: it is a property of one worker's paging, and a
 * fallback taken for it is a key another worker will not agree with. Those
 * propagate. On a windowed source, call {@link computeDispatchKeys} rather
 * than this — it pages the walk's closure first, so the only way to reach
 * that throw is a defect in the paging itself.
 *
 * @param model The model to read attributes from.
 * @param productLocalID The product's local ID.
 * @return {number} A placement key, stable across runs of the same model.
 */
export function geometryDispatchKey(
    model: IfcStepModel,
    productLocalID: number ): number {

  try {

    const product = model.getElementByLocalID( productLocalID )

    if ( !( product instanceof IfcProduct ) ) {
      return productLocalID
    }

    const definition = product.Representation

    if ( !( definition instanceof IfcProductDefinitionShape ) ) {
      return productLocalID
    }

    for ( const representation of definition.Representations ) {

      const mappedKey = mappedSourceOf( representation )

      if ( mappedKey !== void 0 ) {
        return mappedKey
      }
    }

    // No mapped item: co-locate by the shape itself, which still groups
    // products that share one representation.
    const [ firstRepresentation ] = definition.Representations

    return firstRepresentation?.localID ?? productLocalID

  } catch ( error ) {

    if ( error instanceof StepBufferNotResidentError ) {
      throw error
    }

    return productLocalID
  }
}


/**
 * The shard a product belongs to.
 *
 * Modulo rather than a range: the keys are local IDs, which cluster by file
 * position, and ranges over them would reproduce contiguous sharding's
 * imbalance while looking like placement.
 *
 * @param key A key from {@link geometryDispatchKey}.
 * @param shardCount How many shards; values below 1 collapse to one.
 * @return {number} The owning shard index.
 */
export function shardOfDispatchKey( key: number, shardCount: number ): number {

  if ( !Number.isFinite( shardCount ) || shardCount < 2 ) {
    return 0
  }

  // Local IDs are non-negative, but a key that arrived negative would
  // otherwise index outside the shard array.
  return Math.abs( key ) % Math.floor( shardCount )
}


/**
 * The mapped source behind a representation, if it has one.
 *
 * @param representation A shape representation.
 * @return {number|undefined} The representation map's local ID.
 */
function mappedSourceOf( representation: IfcRepresentation ): number | undefined {

  for ( const item of representation.Items ) {

    if ( item instanceof IfcMappedItem ) {
      return item.MappingSource?.localID
    }
  }

  return void 0
}


/* Products whose dispatch closure is held resident at once. Each wave pins
 * four hops of small attribute records — product, shape, representations,
 * mapped items — so this bounds the pinned set rather than the paged one;
 * 1024 products is a few thousand records, well inside a windowed source's
 * resident chunk allowance on every model in the corpus. */
const DISPATCH_WAVE_SIZE = 1024


/**
 * Dispatch keys for a worklist, computed with the source bytes guaranteed
 * present. Parallel to the worklist — `keys[i]` places `localIDs[i]`.
 *
 * **This is what makes a windowed source shardable.** Called inline,
 * {@link geometryDispatchKey} reads records as it walks; on a windowed
 * source a record that is not paged in throws, and the walk would fall back
 * to the product's own local ID — so *which* products fell back would depend
 * on which chunks that worker happened to hold. Two workers then disagree
 * about a product, and both moduli select it (extracted twice) or neither
 * (dropped silently). Paging the walk's own closure first removes the
 * dependence: every worker reads the same bytes and computes the same key.
 *
 * A fully resident source takes the direct walk — there is nothing to page,
 * and the keys are identical by construction rather than by agreement, which
 * is what the paired windowed/resident fixtures assert.
 *
 * **Aligned to the worklist, not indexed by local ID.** Keys are wanted for
 * products and for rel-aggregates' relating objects — tens of thousands of
 * entries — and the consumer filters the worklist in order, so there is
 * nothing to look up. A column over local IDs would be 37 MB on PSB's 9.4 M
 * records to carry ~24 k useful ones.
 *
 * @param model The model to read attributes from.
 * @param localIDs The worklist, in the order the consumer will filter it.
 * @param waveSize Products whose closure is pinned at once.
 * @return {Promise<Uint32Array>} Keys aligned to `localIDs`.
 */
export async function computeDispatchKeys(
    model: IfcStepModel,
    localIDs: readonly number[],
    waveSize: number = DISPATCH_WAVE_SIZE ): Promise< Uint32Array > {

  const keys = new Uint32Array( localIDs.length )

  if ( !model.isSourceExternal ) {

    for ( let where = 0; where < localIDs.length; ++where ) {
      keys[ where ] = geometryDispatchKey( model, localIDs[ where ] )
    }

    return keys
  }

  const wave = Math.max( 1, Math.floor( waveSize ) )

  for ( let start = 0; start < localIDs.length; start += wave ) {

    const end = Math.min( start + wave, localIDs.length )
    const pinned = new Set< number >()

    try {

      await pageDispatchClosure( model, localIDs, start, end, pinned )

      // Deliberately the same function the resident path calls, re-walking
      // records this pass has just read. The duplicated getter work buys the
      // property that matters: there is one walk, so a resident key and a
      // windowed key cannot drift apart as either is edited. The pass it
      // replaces walked once per product too — this is not new work against
      // an unsharded load, it is the same walk paid before the split.
      for ( let where = start; where < end; ++where ) {
        keys[ where ] = geometryDispatchKey( model, localIDs[ where ] )
      }

    } finally {
      model.releaseSourceViews( pinned )
      model.unpinLocalIDs( pinned )
    }
  }

  return keys
}


/**
 * Page every record {@link geometryDispatchKey} will read for one wave of
 * products, pinning each hop's records so a later hop's paging cannot evict
 * an earlier one.
 *
 * Four hops, matching the walk exactly: the product record carries
 * `Representation`; the shape record carries `Representations`; each
 * representation record carries `Items`; a mapped item's record carries
 * `MappingSource`. Nothing below that is read — whether an item IS an
 * `IfcMappedItem`, and the local ID a resolved reference reports, both come
 * from the index columns rather than from bytes — so the closure stops here
 * rather than descending into geometry.
 *
 * @param model The model to page.
 * @param localIDs The worklist.
 * @param start First worklist entry in this wave.
 * @param end One past the last.
 * @param pinned Collects every pinned local ID for the caller to release.
 */
async function pageDispatchClosure(
    model: IfcStepModel,
    localIDs: readonly number[],
    start: number,
    end: number,
    pinned: Set< number > ): Promise< void > {

  const seeds: number[] = []

  for ( let where = start; where < end; ++where ) {
    seeds.push( localIDs[ where ] )
  }

  await pinAndPage( model, seeds, pinned )

  const shapes: number[] = []

  for ( const productLocalID of seeds ) {

    const product = readResolved( () => model.getElementByLocalID( productLocalID ) )

    if ( !( product instanceof IfcProduct ) ) {
      continue
    }

    const definition = readResolved( () => product.Representation )

    if ( definition instanceof IfcProductDefinitionShape ) {
      shapes.push( definition.localID )
    }
  }

  await pinAndPage( model, shapes, pinned )

  const representations: number[] = []

  for ( const shapeLocalID of shapes ) {

    const definition = model.getElementByLocalID( shapeLocalID )

    if ( !( definition instanceof IfcProductDefinitionShape ) ) {
      continue
    }

    for ( const representation of readResolved(
        () => definition.Representations ) ?? [] ) {

      representations.push( representation.localID )
    }
  }

  await pinAndPage( model, representations, pinned )

  const mappedItems: number[] = []

  for ( const representationLocalID of representations ) {

    const representation = model.getElementByLocalID( representationLocalID )

    if ( !( representation instanceof IfcRepresentation ) ) {
      continue
    }

    for ( const item of readResolved( () => representation.Items ) ?? [] ) {

      if ( item instanceof IfcMappedItem ) {
        mappedItems.push( item.localID )
      }
    }
  }

  await pinAndPage( model, mappedItems, pinned )
}


/**
 * Hold one hop's records against eviction and page them in as one wave.
 *
 * Pin BEFORE the await, as the closure walk in `StepModelBase` does: an
 * overlapping page-in for a different range would otherwise be free to evict
 * a chunk this hop already landed, and the read after the await would throw
 * for a record this function reported as resident.
 *
 * @param model The model to page.
 * @param hopLocalIDs Records this hop needs; duplicates and already-pinned
 * entries are skipped.
 * @param pinned Every local ID pinned so far, extended in place.
 */
async function pinAndPage(
    model: IfcStepModel,
    hopLocalIDs: readonly number[],
    pinned: Set< number > ): Promise< void > {

  const fresh: number[] = []

  for ( const localID of hopLocalIDs ) {

    if ( pinned.has( localID ) ) {
      continue
    }

    pinned.add( localID )
    model.pinByLocalID( localID )
    fresh.push( localID )
  }

  if ( fresh.length === 0 ) {
    return
  }

  await Promise.all(
      fresh.map( ( localID ) => model.ensureResidentByLocalID( localID ) ) )
}


/**
 * Read an attribute, treating an unresolvable one as absent — but never a
 * non-resident one.
 *
 * The distinction is the whole point of this pass. A malformed or missing
 * attribute is a property of the FILE: every worker sees it, every worker
 * takes the same fallback, and the partition holds. A non-resident read is a
 * property of THIS worker's paging, and swallowing it is exactly the silent
 * disagreement that kept windowed sources unshardable. So it propagates, and
 * a paging defect fails the load instead of quietly corrupting the split.
 *
 * @param read The attribute access.
 * @return {T|undefined} The value, or undefined if it did not resolve.
 */
function readResolved< T >( read: () => T ): T | undefined {

  try {
    return read()
  } catch ( error ) {

    if ( error instanceof StepBufferNotResidentError ) {
      throw error
    }

    return void 0
  }
}


/**
 * The local IDs an aggregate pass should be PLACED by — each
 * `IfcRelAggregates`' relating object, paged first on a windowed source.
 *
 * A rel-aggregates entry is not an `IfcProduct`, so keying on the
 * relationship record itself falls straight through
 * {@link geometryDispatchKey} to its own local ID and shards by file
 * position while claiming to place by representation. The assembly whose
 * geometry the pass actually builds is the relating object, and that is what
 * has to agree across workers.
 *
 * An aggregate whose relating object does not resolve keys by its own local
 * ID — the same file-wide fallback the product walk takes, and the same
 * reason it is safe.
 *
 * @param model The model to read attributes from.
 * @param aggregateLocalIDs The `IfcRelAggregates` worklist, in order.
 * @param waveSize Records whose bytes are pinned at once.
 * @return {Promise<number[]>} Seeds aligned to `aggregateLocalIDs`.
 */
export async function computeRelatingLocalIDs(
    model: IfcStepModel,
    aggregateLocalIDs: readonly number[],
    waveSize: number = DISPATCH_WAVE_SIZE ): Promise< number[] > {

  const seeds: number[] = []

  if ( !model.isSourceExternal ) {

    for ( const localID of aggregateLocalIDs ) {
      seeds.push( relatingLocalIDOf( model, localID ) )
    }

    return seeds
  }

  const wave = Math.max( 1, Math.floor( waveSize ) )

  for ( let start = 0; start < aggregateLocalIDs.length; start += wave ) {

    const end = Math.min( start + wave, aggregateLocalIDs.length )
    const pinned = new Set< number >()

    try {

      await pinAndPage(
          model, aggregateLocalIDs.slice( start, end ), pinned )

      for ( let where = start; where < end; ++where ) {
        seeds.push( relatingLocalIDOf( model, aggregateLocalIDs[ where ] ) )
      }

    } finally {
      model.releaseSourceViews( pinned )
      model.unpinLocalIDs( pinned )
    }
  }

  return seeds
}


/**
 * One aggregate's relating object, or the aggregate itself when it does not
 * resolve.
 *
 * Reads the aggregate's record, so a windowed caller must have paged it —
 * {@link computeRelatingLocalIDs} is that caller. Exported for the resident
 * path, which has nothing to page.
 *
 * @param model The model to read attributes from.
 * @param aggregateLocalID The `IfcRelAggregates` record.
 * @return {number} The local ID to key by.
 */
export function relatingLocalIDOf( model: IfcStepModel, aggregateLocalID: number ): number {

  const aggregate =
    readResolved( () => model.getElementByLocalID( aggregateLocalID ) )

  if ( !( aggregate instanceof IfcRelAggregates ) ) {
    return aggregateLocalID
  }

  return readResolved( () => aggregate.RelatingObject?.localID ) ?? aggregateLocalID
}
