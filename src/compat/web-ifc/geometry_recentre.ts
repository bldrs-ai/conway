/**
 * Per-leaf geometry recentre: recovering the centre `Geometry::Normalize()`
 * subtracted, and making the float32 buffer agree with it.
 *
 * ## What the native call actually does
 *
 * `conway_geometry/representation/Geometry.cpp`'s `Geometry::Normalize()`
 * shifts the **float64** `vertices` array by its own AABB centre and then
 * (as of the wasm this repo pins) gets two things wrong:
 *
 *  1. It computes the shift into a local `centre` but returns the member
 *     `center`, which nothing ever writes — so every caller is handed
 *     (0, 0, 0) no matter how far the geometry was moved.
 *  2. It does not call `ClearReification()`, so the interleaved
 *     **float32** buffer that `GetVertexData()`/`GetVertexArray` serve —
 *     the buffer Share uploads to the GPU — stays the PRE-shift
 *     reification, still holding raw world coordinates.
 *
 * Those two bugs cancel in world space: the emitted transform is missing
 * the recentre term by exactly as much as the vertices are missing the
 * shift, so `transform * vertex` lands in the right place. That is why
 * every cross-path parity test in this directory passed while the defect
 * shipped — all the paths shared it. What does not cancel is
 * **precision**: on a Swiss LV95 model whose national-grid coordinates are
 * baked into the geometry rather than the placements (identity placements,
 * vertices at ~2.6e6 m — Ecobau.ifc, test-models-private#97), the float32
 * ULP at that magnitude is ~0.25 m, and the model visibly jitters as the
 * camera moves (Share#1634).
 *
 * ## What this recovers, and why it survives the C++ fix
 *
 * `normalizeWithCentreF64` ignores the broken return value entirely and
 * measures the shift instead: read `getPoint(0)` (full float64 across the
 * wasm boundary) before the call and after it, and the difference IS the
 * centre that was subtracted. At 2.6e6 m the two reads are exact to ~1 ulp
 * of a double (~5e-10 m), which is nine orders of magnitude below anything
 * that matters here.
 *
 * That measurement stays correct **after** conway-geom is fixed, which is
 * the point of doing it this way rather than reaching for the return value
 * once it works: a fixed `Normalize()` still shifts the vertices by the
 * same centre, so the diff still reports it, and the extra
 * `clearReification()` below is idempotent (it only drops the cached
 * reification; the next `GetVertexData()` rebuilds it). Nothing here has
 * to be revisited when the wasm is rebuilt.
 *
 * ## The cache, and what it is keyed on
 *
 * `Normalize()` is idempotent by its `normalized_` flag: the second call on
 * one native geometry shifts nothing, so the diff comes back zero. Zero is
 * therefore ambiguous — either the geometry is genuinely centred on the
 * origin (correct answer: zero) or an earlier call already moved it
 * (correct answer: the centre that call measured). IFC mapped items make
 * the second case routine: one `IfcRepresentationMap` body is one native
 * geometry walked once per instancing product, and every instance must be
 * placed with the SAME centre or the later ones collapse toward the origin
 * — the failure mode that made AP214 abandon per-leaf normalize outright
 * (conway#308).
 *
 * So the measured centre is remembered in a `WeakMap` keyed on the native
 * geometry handle itself. Three properties of that keying are load-bearing:
 *
 *  - **Identity, not localID.** An embind class handle is a stable JS
 *    object for the life of the native it wraps (the same property
 *    `native_geometry_liveness.isNativeDeleted` relies on), and the scene
 *    holds one handle per canonical mesh, so every walk of a shared body
 *    presents the same key.
 *  - **Eviction self-heals.** Under `GEOMETRY_BUDGET_MB` the residency
 *    frees geometry and a later pump re-extracts it; the re-extraction is
 *    a NEW handle wrapping an un-normalized native, so it misses the cache
 *    and measures a fresh non-zero diff. A localID-keyed cache would
 *    instead have served the stale centre in preference to that fresh
 *    measurement. The entry for the freed handle is simply garbage.
 *  - **Sharing is free but not required.** The durable walk
 *    (`IfcApiProxyIfc.streamNewMeshes_` and its classic siblings) and the
 *    two preview channels (`streamed_preview_channel`,
 *    `store_preview_channel`) do NOT share native geometry today: each
 *    preview generation builds its own `IfcStepModel` +
 *    `IfcGeometryExtraction` and throws it away, so the preview scene owns
 *    separate instances and per-path caches would have sufficed. Keying on
 *    handle identity means one module-level map serves them all correctly
 *    either way, and stays correct if that ever changes.
 */

import { LARGE_COORDINATE_BUDGET_M, Point3Like, TRANSLATION_X, TRANSLATION_Y, TRANSLATION_Z }
  from './coordination_f64'


/**
 * The slice of the native `GeometryObject` surface this module touches.
 *
 * Declared structurally rather than importing `GeometryObject` so the
 * preview channels — which type their scene-walk tuples with their own
 * minimal geometry shape — can pass theirs without widening it to the
 * whole native interface.
 */
export interface NormalizableGeometry {
  getVertexCount(): number
  getPoint( index: number ): Point3Like
  normalize(): Point3Like
  clearReification?(): void
}

/** The answer for geometry that needs no recentre. Never handed out by
 * reference — callers may hold it past the next call. */
const ZERO_CENTRE: Point3Like = { x: 0, y: 0, z: 0 }

/**
 * Centres measured by a previous `normalizeWithCentreF64` on the same
 * native handle. See the module comment for why this is keyed on handle
 * identity and why a stale entry cannot outlive the geometry it describes.
 */
const measuredCentres = new WeakMap< object, Point3Like >()


/**
 * Normalize one native geometry and return the centre that was actually
 * subtracted from its vertices, in the geometry's own (pre-scale) units.
 *
 * The returned centre is what `composeTransformF64`'s `geomCenter`
 * argument expects: composing `coordination * placement * translate(centre)`
 * against the now-shifted vertices reproduces the same world position the
 * un-shifted vertices had, with both factors small enough to survive
 * float32.
 *
 * @param geometry The native geometry to normalize in place.
 * @return {Point3Like} The subtracted centre; all-zero when the geometry
 * is empty or already centred on its own origin.
 */
export function normalizeWithCentreF64(
    geometry: NormalizableGeometry ): Point3Like {

  // getPoint(0) is out of range on an empty mesh, and there is nothing to
  // recentre anyway.
  if ( geometry.getVertexCount() === 0 ) {
    return { ...ZERO_CENTRE }
  }

  const before = geometry.getPoint( 0 )
  const beforeX = before.x
  const beforeY = before.y
  const beforeZ = before.z

  // Return value deliberately dropped: it is (0,0,0) on the pinned wasm
  // and redundant once fixed. The shift is measured, not asked for.
  geometry.normalize()

  const after = geometry.getPoint( 0 )

  const x = beforeX - after.x
  const y = beforeY - after.y
  const z = beforeZ - after.z

  if ( x !== 0 || y !== 0 || z !== 0 ) {

    // This call is the one that performed the shift, so the float32
    // reification built from the old vertices — if any was built — is now
    // stale. Dropping it makes the next GetVertexData() rebuild from the
    // shifted f64 vertices, which is the whole point: it is that buffer
    // Share uploads.
    geometry.clearReification?.()

    const centre: Point3Like = { x, y, z }

    measuredCentres.set( geometry as object, centre )

    return centre
  }

  // Zero diff: either an earlier call already moved this geometry (serve
  // what that call measured) or it was centred on the origin to begin
  // with (a cache miss, and zero is the right answer).
  const cached = measuredCentres.get( geometry as object )

  return cached !== void 0 ? { ...cached } : { ...ZERO_CENTRE }
}


/**
 * The largest absolute translation component of a composed placement, in
 * metres — the quantity `LARGE_COORDINATE_BUDGET_M` bounds.
 *
 * @param transform A composed 16-element column-major transform.
 * @return {number} The magnitude.
 */
export function placementMagnitudeM( transform: ArrayLike< number > ): number {
  return Math.max(
      Math.abs( transform[ TRANSLATION_X ] ),
      Math.abs( transform[ TRANSLATION_Y ] ),
      Math.abs( transform[ TRANSLATION_Z ] ) )
}


/**
 * Whether a composed placement has escaped the large-coordinate budget
 * despite COORDINATE_TO_ORIGIN being on — i.e. the recentre did not
 * achieve what it exists to achieve.
 *
 * Callers latch this to one report per model: on a georeferenced model
 * EVERY placement is over budget, so an unlatched log is 3,691 identical
 * lines on Ecobau. One line naming the magnitude is what keeps this class
 * of silent failure from shipping dark again — the two cancelling
 * `Normalize()` bugs above were invisible for exactly as long as nothing
 * looked at the number.
 *
 * **Empty geometry is exempt, and that exemption is what keeps the
 * report honest.** A placement whose geometry has no vertices has no
 * centre to measure, so `normalizeWithCentreF64` correctly returns zero
 * and the placement keeps the raw coordinate — but nothing is drawn from
 * it and nothing can jitter. Ecobau ends a correct load with exactly 20
 * such placements (failed booleans: *"bool aborted due to empty first
 * operand"*), so without this the fixed engine still warns on the very
 * model the fix repaired, and a warning that fires on a healthy load is
 * one nobody reads.
 *
 * @param transform A composed 16-element column-major transform.
 * @param geometry The geometry the placement draws, when the caller has
 * it; omit only where there is nothing to draw either way.
 * @return {boolean} True when a drawable placement is beyond the budget.
 */
export function exceedsLargeCoordinateBudget(
    transform: ArrayLike< number >,
    geometry?: Pick< NormalizableGeometry, 'getVertexCount' > ): boolean {

  return placementMagnitudeM( transform ) > LARGE_COORDINATE_BUDGET_M &&
    ( geometry === void 0 || geometry.getVertexCount() > 0 )
}
