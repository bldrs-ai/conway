/**
 * World-space displacement scoring for model_report.mjs's `displacement`
 * stage (conway#456).
 *
 * Kept in its own module, with no side effects on import, so the scoring can
 * be unit-tested without running the CLI. model_report.mjs executes its
 * `main()` at import time, so importing *it* from a test runs the whole tool
 * inside the test runner.
 */

/**
 * The middle value of a numeric list, taking the lower of the two middles
 * for an even count. Sorts a copy — callers reuse their arrays.
 *
 * @param {number[]} values At least one value
 * @return {number} The median
 */
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.floor((sorted.length - 1) / 2)]
}


/**
 * The model's robust centre: the component-wise median of mesh centres.
 *
 * Median, not mean, and that choice is the whole point. A mean is dragged
 * toward the outliers being hunted, which shrinks their own scores and
 * inflates everyone else's — on a model with a handful of parts flung
 * kilometres away, a mean centre sits out in empty space and every honest
 * part scores as displaced.
 *
 * @param {number[][]} centres One [x, y, z] per mesh, at least one
 * @return {number[]} [x, y, z]
 */
export function robustCentre(centres) {
  return [0, 1, 2].map((axis) => median(centres.map((each) => each[axis])))
}


/**
 * A mesh's centre in WORLD space: the centre of its local bounds, placed by
 * its absolute transform.
 *
 * Bounds centre rather than vertex mean, so a face with a dense cluster of
 * vertices at one end does not drag the centre toward it — this is asking
 * where a part sits, not where its detail is.
 *
 * The transform is validated rather than trusted. A wrong walk-tuple index
 * hands this an object, every multiplication yields NaN, `Stage.record`
 * discards non-finite values, and the stage reports "N calls, 0 measured" —
 * a clean-looking result produced by a bug, which is hazard 1 in
 * model_report.mjs's header arriving through the back door. It cost a
 * debugging cycle already: conway#456 names the transform as `walked[1]`,
 * and it is `walked[0]`.
 *
 * @param {object} geometry A conway GeometryObject
 * @param {number} count Vertex count
 * @param {Float64Array|number[]|undefined} transform Column-major 4x4, or
 *   undefined for identity
 * @return {number[]|undefined} [x, y, z], or undefined if any vertex or any
 *   resulting coordinate was not finite
 */
export function worldCentre(geometry, count, transform) {
  /** Elements in a column-major 4x4. */
  const MATRIX_ELEMENTS = 16

  if (transform !== undefined &&
      (typeof transform.length !== 'number' || transform.length < MATRIX_ELEMENTS)) {
    throw new Error(
        'worldCentre: expected a column-major 4x4 transform or undefined, got ' +
        `${Object.prototype.toString.call(transform)} — check the walk tuple index`)
  }

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < count; ++i) {
    // getPoint(), never a held HEAPF32 view — see model_report.mjs's header.
    const point = geometry.getPoint(i)
    const axes = [point.x, point.y, point.z]

    for (let axis = 0; axis < 3; ++axis) {
      if (!Number.isFinite(axes[axis])) {
        return undefined
      }

      min[axis] = Math.min(min[axis], axes[axis])
      max[axis] = Math.max(max[axis], axes[axis])
    }
  }

  if (!Number.isFinite(min[0])) {
    return undefined
  }

  const local = [0, 1, 2].map((axis) => (min[axis] + max[axis]) / 2)

  if (transform === undefined) {
    return local
  }

  const [x, y, z] = local

  const placed = [
    (transform[0] * x) + (transform[4] * y) + (transform[8] * z) + transform[12],
    (transform[1] * x) + (transform[5] * y) + (transform[9] * z) + transform[13],
    (transform[2] * x) + (transform[6] * y) + (transform[10] * z) + transform[14],
  ]

  // A transform of the right SHAPE can still hold NaN. Returning undefined
  // drops the mesh from the sample rather than throwing, because unlike a
  // wrong tuple index this is data, not a programming error, and one bad
  // placement must not discard the curve/loop/face/mesh reports already
  // collected by the same run.
  return placed.every(Number.isFinite) ? placed : undefined
}
