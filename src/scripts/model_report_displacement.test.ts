import { describe, expect, test } from '@jest/globals'
// @ts-expect-error -- an untyped .mjs helper beside the CLI it serves.
import { robustCentre, worldCentre } from '../../../scripts/debug/displacement.mjs'

/* eslint-disable no-magic-numbers -- these are synthetic coordinates and
   distances chosen to mirror the real model in conway#456. Naming each one
   would obscure the shape the cases exist to express: a tight cluster near
   the site origin plus one part flung far away. */

/**
 * The scoring behind model_report.mjs's `displacement` stage (conway#456).
 *
 * The stage answers "which parts are flung away from where they belong",
 * which the `mesh` stage cannot: `mesh` measures extent in MESH-LOCAL
 * coordinates, so on an export that writes geometry directly in site
 * coordinates every honest part looks displaced by its distance from the
 * file origin.
 *
 * These cases use synthetic centres rather than a model, because the
 * motivating file is 256 MB and private. What is worth pinning is the
 * scoring, and the scoring is pure — which is why it lives in
 * displacement.mjs rather than in the CLI script, whose module body runs
 * the whole tool on import.
 */

/**
 * Column-major 4x4 translation, matching the walk tuple's layout.
 *
 * @param x Translation along x.
 * @param y Translation along y.
 * @param z Translation along z.
 * @return The 16-element matrix.
 */
function translation(x: number, y: number, z: number): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
}

/**
 * A stub geometry over a fixed point list.
 *
 * @param points One [x, y, z] per vertex.
 * @return Something with the getPoint() shape worldCentre reads.
 */
function geometryOf(points: number[][]) {
  return {
    getPoint: (i: number) => ({ x: points[i][0], y: points[i][1], z: points[i][2] }),
  }
}


describe('displacement scoring', () => {

  test('the robust centre ignores outliers rather than chasing them', () => {

    // Nine parts clustered near the site origin, one flung far away — the
    // shape of the motivating model, scaled down.
    const centres = [
      ...Array.from({ length: 9 }, (_, i) => [578 + i, 763, 3]),
      [-751, 1075, 1377],
    ]

    const centre = robustCentre(centres)

    // A MEAN would sit ~130 units off in x and ~137 in z, dragged by the
    // single outlier; every honest part would then score as displaced and
    // the outlier's own score would shrink. That inversion is the reason
    // this is a median.
    expect(centre[0]).toBeGreaterThan(577)
    expect(centre[0]).toBeLessThan(587)
    expect(centre[2]).toBeCloseTo(3, 6)

    const distances = centres.map((each: number[]) =>
      Math.hypot(each[0] - centre[0], each[1] - centre[1], each[2] - centre[2]))

    const cluster = distances.slice(0, 9)
    const outlier = distances[9]

    // The signal the stage's `factor x median` threshold consumes: the
    // outlier has to clear 8x the median by a wide margin, or it would be
    // reported as ordinary.
    const median = [...cluster].sort((a, b) => a - b)[Math.floor(cluster.length / 2)]

    expect(outlier).toBeGreaterThan(median * 8)
  })

  test('a mesh centre is placed by its transform, not left local', () => {

    // The defect this stage exists to fix in one assertion: identical local
    // geometry at two different placements must score differently. Reading
    // local coordinates would make these indistinguishable.
    const unitBox = [[-1, -1, -1], [1, 1, 1]]

    const atOrigin = worldCentre(geometryOf(unitBox), 2, translation(0, 0, 0))
    const farAway = worldCentre(geometryOf(unitBox), 2, translation(1000, 0, 0))

    expect(atOrigin).toEqual([0, 0, 0])
    expect(farAway).toEqual([1000, 0, 0])
  })

  test('an undefined transform means identity, not a skipped mesh', () => {

    expect(worldCentre(geometryOf([[2, 4, 6], [4, 8, 12]]), 2, undefined))
        .toEqual([3, 6, 9])
  })

  test('a wrong walk-tuple index throws rather than scoring NaN', () => {

    // conway#456 names the transform as walked[1]; it is walked[0].
    // Following the issue verbatim handed this an object, every
    // multiplication produced NaN, Stage.record silently discarded every
    // non-finite value, and the stage reported "N calls, 0 measured" — a
    // clean-looking result manufactured by a bug. That is hazard 1 from the
    // script's own header, so it has to be loud.
    const notATransform = { someObject: true } as unknown as number[]

    expect(() => worldCentre(geometryOf([[0, 0, 0]]), 1, notATransform))
        .toThrow(/walk tuple index/)
  })

  test('non-finite vertex data yields no centre rather than a NaN score', () => {

    expect(worldCentre(geometryOf([[0, 0, 0], [NaN, 0, 0]]), 2, undefined))
        .toBeUndefined()
  })

  test('a right-shaped transform holding NaN drops the mesh, and does not throw', () => {

    // Data, not a programming error: one unusable placement must not take
    // down the whole run and discard the other stages' reports.
    const nanTransform = translation(NaN, 0, 0)

    expect(worldCentre(geometryOf([[0, 0, 0], [2, 2, 2]]), 2, nanTransform))
        .toBeUndefined()
  })
})
