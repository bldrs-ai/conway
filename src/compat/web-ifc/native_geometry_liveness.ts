
/**
 * Whether a native geometry handle has already been freed.
 *
 * The compat layer's express-ID -> geometry map (`model[3]` in both proxies)
 * outlives the natives it points at. Eviction under `GEOMETRY_BUDGET_MB`
 * frees geometry through the residency
 * (`GeometryResidency.evictToBudget` -> `IfcModelGeometry.delete` ->
 * `GeometryObject.delete()`) and there is no back-channel that would purge
 * the map, so a stale entry survives the free. Touching one — `clone()` is
 * the first thing `getGeometry` does — aborts inside embind with
 * *"Cannot pass deleted object as a pointer of type IfcGeometry"*, which is
 * how an evicted asset reached Share as a load failure (Sentry SHARE-1NK)
 * instead of as the documented "gone from `GetGeometry` until something
 * re-extracts it".
 *
 * Embind's class handles carry the predicate: the emitted glue defines
 * `isDeleted(){return!this.$$.ptr}` on the handle prototype (verified in
 * `dependencies/conway-geom/Dist/ConwayGeomWasmNodeMT.js`, not from memory
 * of embind in general). It is probed by shape rather than assumed, because
 * a `GeometryObject` here can also be a hand-rolled test double or a future
 * non-embind binding; anything without the method reads as alive, so the
 * caller's try/catch — not this — is what covers it.
 *
 * @param native The handle to probe. Anything, including undefined.
 * @return {boolean} True only when the handle positively reports itself
 * deleted.
 */
export function isNativeDeleted( native: unknown ): boolean {

  const probe = ( native as { isDeleted?: () => boolean } | undefined )?.isDeleted

  return typeof probe === 'function' && probe.call( native ) === true
}
