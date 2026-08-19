import IfcStepModel from './ifc_step_model'
import {
  IfcMappedItem,
  IfcProduct,
  IfcProductDefinitionShape,
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
 * Total, and deliberately so: a product whose attributes do not resolve gets
 * a usable key rather than aborting a load. A wrong placement costs a
 * duplicated extraction; a thrown error costs the model.
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

  } catch {

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
