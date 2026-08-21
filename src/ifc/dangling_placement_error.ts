/**
 * A product whose placement chain is not in the scanned prefix yet.
 *
 * Thrown by `extractPlacementStrict_` under `deferDanglingPlacements`, and
 * caught by the parse-time preview channels, which treat it — like any throw
 * from a product extract — as "not yet extractable, leave it to the durable
 * pump".
 *
 * Strictly "not in the prefix YET": the tag is applied only when the
 * underlying throw is a `DanglingReferenceError`, i.e. the placement chain
 * referenced a record the index does not hold. A placement that is present
 * but broken (wrong entity type, a select that is not an axis placement)
 * propagates untagged, because the channels use this tag to decide what to
 * retry, and retrying a permanently broken placement also keeps the early
 * generation-preemption trigger alive for nothing.
 *
 * It exists only so that catch can ATTRIBUTE the deferral. The preview emits
 * a product once its whole closure sits inside the prefix, and Revit writes
 * per-product placements toward the file tail, so on those files early ticks
 * meet long runs of products that all defer and the user sees nothing until
 * the parse is nearly done. Whether a given blank preview is that, or
 * something else entirely, decides whether sharding the parse would help it
 * at all — so the distinction has to be measurable rather than inferred from
 * a comment (conway#542).
 */
export class DanglingPlacementError extends Error {
  /**
   * @param productLocalID The product that could not be placed.
   * @param cause The underlying dangling-reference error.
   */
  constructor(
    public readonly productLocalID: number,
    public readonly cause: unknown ) {

    super(
        `product ${productLocalID} placement is not resolvable in this ` +
        `prefix: ${cause instanceof Error ? cause.message : String( cause )}` )

    this.name = 'DanglingPlacementError'
  }
}
