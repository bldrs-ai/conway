/**
 * Float64 coordinate-to-origin (COORDINATE_TO_ORIGIN) math.
 *
 * gl-matrix's `mat4`/`vec4` are backed by `Float32Array`
 * (`ARRAY_TYPE = Float32Array` in gl-matrix/common.js), so the recentre
 * derivation — which subtracts a large world reference point
 * (`transformedPt = placement * nativePoint`, on the order of 1e5 m for a
 * Swiss/CHE georeferenced IFC, up to ~2.6e6 m in LV95 easting/northing) —
 * loses precision: float32 ULP is ~7.6 mm at 100 km and ~60 mm at 2.6 M m.
 * Baked into the emitted FlatMesh transform that quantization forms a
 * spatial grid that reads as rotational jitter when the camera is zoomed
 * to detail.
 *
 * The native placement crosses the wasm boundary as `glm::dmat4` and the
 * reference point as `glm::dvec3` — both full float64 (see
 * conway-api.cpp `getMatrixValues4x4` / the `glmdVec3` value object), so
 * `nativeTransform.getValues()` and `geometry.getPoint()` deliver doubles.
 * Feeding those doubles straight through a double-precision composition
 * (rather than gl-matrix's float32 path, and without the intermediate
 * `mat4.fromValues` truncation to `Float32Array`) fully recovers the
 * precision for georeferenced models.
 *
 * All layout/multiply conventions match gl-matrix exactly (column-major,
 * `out = a * b`), so near-origin models — where float32 and float64 agree
 * to well under a micron — stay bit-comparable across the
 * classic / deferred / preview paths that share this recentre.
 */

const IDENTITY: readonly number[] =
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/**
 * The Z-up -> Y-up normalize matrix baked into every coordination frame
 * (column-major). Identical to the shim proxies' `NormalizeMat` and the
 * preview channels' local copies — every producer of a coordination
 * frame MUST use the same one, or the frames it derives disagree with
 * the durable walk's (which is exactly how the spatial-imposter plates
 * ended up in a different space from the meshes, conway#515).
 */
export const NORMALIZE_MAT_F64: readonly number[] = [
  1, 0, 0, 0,
  0, 0, -1, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
]

/** Identity, for callers that need a "no coordination" frame. */
export const IDENTITY_MAT4: readonly number[] = IDENTITY

/**
 * Smallest positive magnitude representable in single precision
 * (2 ** -149, the smallest float32 subnormal). The previous code path
 * built the placement with gl-matrix `mat4.fromValues(...)` — a
 * `Float32Array` — so any transform component below this magnitude was
 * stored as exactly zero. Valid geometry never produces a non-zero
 * component this small (positions are metres/kilometres, rotation and
 * scale terms are O(1) or exactly zero), so the only inputs it affects
 * are denormal garbage from degenerate/uninitialised native transforms
 * (e.g. a released-then-reopened model whose `getValues()` returns
 * subnormals). Flushing those to zero here keeps the classic, deferred
 * and preview paths bit-identical on such inputs — matching the old
 * Float32Array behaviour — while leaving every valid value at full
 * double precision.
 */
const FLOAT32_MIN_SUBNORMAL = 2 ** -149

/**
 * Flush non-finite and float32-underflow garbage to zero; pass every
 * valid value through untouched at full double precision.
 *
 * @param v A transform component.
 * @return {number} v, or 0 if it is non-finite or below float32 range.
 */
function flushGarbage(v: number): number {
  return Number.isFinite(v) &&
    (v === 0 || Math.abs(v) >= FLOAT32_MIN_SUBNORMAL) ? v : 0
}

/**
 * Copy 16 matrix components into a fresh `number[]`, flushing float32
 * underflow / non-finite garbage to zero (see FLOAT32_MIN_SUBNORMAL).
 *
 * @param m A 16-element matrix.
 * @return {number[]} The sanitized copy.
 */
function sanitize16(m: ArrayLike<number>): number[] {
  const out = new Array<number>(16)
  for (let i = 0; i < 16; ++i) {
    out[i] = flushGarbage(m[i])
  }
  return out
}

/**
 * A 3D point with double-precision components, as delivered by
 * conway-geom's `getPoint` / `normalize` (glm::dvec3 across the boundary).
 */
export interface Point3Like {
  x: number
  y: number
  z: number
}

/**
 * Multiply two column-major 4x4 matrices in float64.
 *
 * Computes `out = a * b`, the identical formula (and operand order) to
 * gl-matrix `mat4.multiply(out, a, b)`, but retaining double precision.
 *
 * @param a Left matrix (16 elements, column-major).
 * @param b Right matrix (16 elements, column-major).
 * @return {number[]} The product as a fresh 16-element `number[]`.
 */
export function mat4MultiplyF64(
    a: ArrayLike<number>, b: ArrayLike<number>): number[] {

  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  const out = new Array<number>(16)

  for (let i = 0; i < 4; ++i) {
    const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3]
    out[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
  }

  return out
}

/**
 * Grid (metres) a recentre snaps to once it is needed at all.
 *
 * The anchor a recentre is derived from is the *first geometry* the walk
 * reaches, which is an arbitrary interior element: whichever one the file
 * happens to declare first. Left as-is, that makes a model's world
 * position a function of its element order, with two consequences users
 * see (conway#87, "not a sound basis for a camera in the permalink"):
 *
 *  - Two exports of one object — the same logo as IFC and as STEP, a part
 *    re-exported by a different CAD kernel — land in different places,
 *    because they disagree about which element comes first. Share#1749
 *    hit exactly this: `index.step` sat 76m off `index.ifc` because the
 *    IFC declares the x=76 block first and the STEP the x=0 one.
 *  - Re-exporting a model with the element order shuffled moves it, so
 *    every camera permalink saved against it is silently wrong.
 *
 * `quantizeRecentre` answers that in two stages, because the two ranges
 * want different things:
 *
 *  - **Inside LARGE_COORDINATE_BUDGET_M, do not recentre at all.** There
 *    is no float32 benefit below the budget — that constant *is* the
 *    threshold where quantization becomes visible — so a model within
 *    10km of the origin simply keeps the coordinates its file authored.
 *    That is model-zero, conway#87's proposal, and it makes the frame
 *    exactly order-independent for the overwhelming majority of models
 *    rather than order-independent-per-cell.
 *  - **Above it, snap to this grid.** A georeferenced model has to come
 *    back near the origin, and snapping keeps that repeatable across
 *    exports. Half a cell (500m) out of a 1e4 m budget costs ~0.05mm of
 *    float32 resolution, and a whole-kilometre translation is exactly
 *    representable where the raw anchor was not, so the recentre itself
 *    stops contributing rounding.
 *
 * **Quantizing cannot remove the discontinuity, only move it**, and it
 * is worth being precise about where this one sits, because it is not
 * where you would guess. Snapping *everything* to the grid would put a
 * 1km step at every cell edge, including around the near-origin models
 * that make up almost the whole corpus. Staging moves it to the budget:
 * inside, every anchor derives model-zero and there is no edge at all;
 * the single remaining edge is the budget itself, where the step is
 * `LARGE_COORDINATE_BUDGET_M` (1e4), not the grid (1e3) — an anchor at
 * 9900 derives zero and one at 10100 derives -10000.
 *
 * That edge is also invisible to the adopted-preview-frame gate, which
 * re-derives only when a durable placement lands beyond the budget: a
 * preview anchored at 10100 and a durable first placement at 9900 probe
 * at ~100m, so the preview frame is kept and the model renders 10km off
 * a classic open. The trade is deliberate — one edge that a georeferenced
 * model may sit near, rather than an edge every kilometre through the
 * range where nearly every model lives — but it is a real residual, not
 * an eliminated one. design/new/coordination-frame.md tracks it, and
 * conway#87's relative-to-centre direction is what removes it properly.
 */
export const COORDINATION_SNAP_M = 1e3

/**
 * The recentre for an anchor: all zeros while the anchor is close enough
 * to the origin not to need one, else each component snapped to
 * COORDINATION_SNAP_M.
 *
 * The stage decision is made **once, on the anchor's distance from the
 * origin**, and applied to all three components together. Deciding per
 * component would leave a model offset diagonally — say (9km, 9km, 9km),
 * 15.6km out and well past the budget — with no recentre at all, since
 * no single component crosses the threshold. That silently regresses the
 * float32 jitter fix (Share#1631) the budget exists to enforce.
 *
 * Works in source units: the values are pre-scale, so both the budget
 * and the grid convert by the same `scaleFactor` the caller is about to
 * apply (a millimetre model snaps every 1e6 source units, a metre model
 * every 1e3).
 *
 * @param values The three translation components, in source units.
 * @param scaleFactor The linear scaling factor to metres; already
 * sanitized by the caller.
 * @return {number[]} The recentre per component, in source units.
 */
function quantizeRecentre(values: number[], scaleFactor: number): number[] {
  const finite = values.map((v) => (Number.isFinite(v) ? v : 0))

  if (Math.hypot(...finite) * scaleFactor <= LARGE_COORDINATE_BUDGET_M) {
    return [0, 0, 0]
  }

  const gridSourceUnits = COORDINATION_SNAP_M / scaleFactor

  return finite.map((v) => Math.round(v / gridSourceUnits) * gridSourceUnits)
}

/**
 * Derive the coordination (recentre) matrix in float64, matching the
 * gl-matrix op sequence exactly:
 * `scale * NormalizeMat * translate(-quantize(placement * point))`.
 *
 * The quantization is what keeps the derived frame independent of which
 * element a file declares first — see COORDINATION_SNAP_M for why that
 * matters, and why it is staged around LARGE_COORDINATE_BUDGET_M.
 *
 * @param placement The native placement (16 elements, column-major
 * float64 from `getValues()`); `undefined` is treated as identity.
 * @param point The world reference point (`getPoint(0)`), float64.
 * @param normalizeMat The Z-up -> Y-up normalize matrix (16 elements).
 * @param scaleFactor The linear scaling factor.
 * @return {number[]} The coordination matrix as a 16-element `number[]`.
 */
export function deriveCoordinationF64(
    placement: ArrayLike<number> | undefined,
    point: Point3Like,
    normalizeMat: ArrayLike<number>,
    scaleFactor: number): number[] {

  const p = placement !== undefined ? sanitize16(placement) : IDENTITY
  const { x, y, z } = point
  // Sanitized once, here, so the promise the rest of this function makes
  // about degenerate input actually holds: a NaN/Infinite factor from a
  // malformed unit-assignment chain would otherwise pass the recentre
  // guard and then poison every component through the scale matrix below.
  const scale1 = Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1

  // transformedPt = placement * (x, y, z, 1)
  const tx = p[0] * x + p[4] * y + p[8] * z + p[12]
  const ty = p[1] * x + p[5] * y + p[9] * z + p[13]
  const tz = p[2] * x + p[6] * y + p[10] * z + p[14]

  // translate(-quantize(transformedPt))
  const recentre = quantizeRecentre([-tx, -ty, -tz], scale1)
  const translate = IDENTITY.slice()
  translate[12] = recentre[0]
  translate[13] = recentre[1]
  translate[14] = recentre[2]

  // scale(scaleFactor)
  const scale = [
    scale1, 0, 0, 0,
    0, scale1, 0, 0,
    0, 0, scale1, 0,
    0, 0, 0, 1,
  ]

  // scale * (NormalizeMat * translate)
  return mat4MultiplyF64(scale, mat4MultiplyF64(normalizeMat, translate))
}

/**
 * Compose the emitted world transform in float64:
 * `coordination * placement [ * translate(geomCenter) ]`.
 *
 * @param coordination The coordination matrix (16 elements).
 * @param placement The native placement (16 elements, column-major
 * float64 from `getValues()`); `undefined` is treated as identity.
 * @param geomCenter The per-leaf normalize centre; omit for the bare
 * composition used by the AP214 shared-buffer path (issue #308).
 * @return {number[]} The flat transform as a 16-element `number[]`,
 * ready to hand back as a FlatMesh `flatTransformation`.
 */
export function composeTransformF64(
    coordination: ArrayLike<number>,
    placement: ArrayLike<number> | undefined,
    geomCenter?: Point3Like): number[] {

  let out = placement !== undefined ?
    mat4MultiplyF64(coordination, sanitize16(placement)) :
    Array.from(coordination as ArrayLike<number>)

  if (geomCenter !== undefined) {
    const gm = IDENTITY.slice()
    gm[12] = geomCenter.x
    gm[13] = geomCenter.y
    gm[14] = geomCenter.z
    out = mat4MultiplyF64(out, gm)
  }

  return out
}

// Column-major mat4 translation component indices.
export const TRANSLATION_X = 12
export const TRANSLATION_Y = 13
export const TRANSLATION_Z = 14

/**
 * Placement-magnitude budget (metres) above which a coordination frame
 * has failed to recentre a model: float32 (the GPU vertex format and
 * BatchedMesh matrix texture) quantizes at ~1mm per 1e4 m of
 * coordinate, the visible-jitter threshold established in Share#1631.
 * Used to validate an adopted preview coordination frame against the
 * durable walk's first geometry (Share#1634).
 */
export const LARGE_COORDINATE_BUDGET_M = 1e4
