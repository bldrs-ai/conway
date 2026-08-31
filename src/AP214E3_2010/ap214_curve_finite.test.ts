import { describe, expect, test } from '@jest/globals'
import { isCurveFinite } from './ap214_geometry_extraction'
import type { CurveObject } from '../../dependencies/conway-geom'


/**
 * Build a CurveObject stand-in over a fixed list of points — the only
 * method isCurveFinite reads is getPointsSize/get3d.
 *
 * @param points The 3D samples to serve back through get3d.
 * @return {CurveObject} A minimal curve exposing just those points.
 */
function curveOf(points: Array<{ x: number, y: number, z: number }>): CurveObject {
  return {
    getPointsSize: () => points.length,
    get3d: (index: number) => points[index],
  } as CurveObject
}


describe('isCurveFinite', () => {

  test('an empty curve is finite (vacuously true, no point to fail on)', () => {

    expect(isCurveFinite(curveOf([]))).toBe(true)
  })

  test('all-finite points pass', () => {

    expect(isCurveFinite(curveOf([
      { x: 0, y: 0, z: 0 },
      { x: 1.5, y: -2.25, z: 3 },
    ]))).toBe(true)
  })

  // The shape conway#591 describes: a degenerate AXIS2_PLACEMENT_3D basis
  // (conway#592) makes every recovered sample NaN, not just one of them —
  // "v nan nan nan" repeated across the whole curve. One bad point is
  // already enough to reject the curve, so this also covers that case.
  test('a single non-finite coordinate rejects the whole curve', () => {

    expect(isCurveFinite(curveOf([
      { x: 0, y: 0, z: 0 },
      { x: NaN, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
    ]))).toBe(false)
  })

  test('a NaN y or z coordinate is caught too, not just x', () => {

    expect(isCurveFinite(curveOf([{ x: 0, y: NaN, z: 0 }]))).toBe(false)
    expect(isCurveFinite(curveOf([{ x: 0, y: 0, z: NaN }]))).toBe(false)
  })

  test('an infinite coordinate rejects the curve, not just NaN', () => {

    expect(isCurveFinite(curveOf([{ x: Infinity, y: 0, z: 0 }]))).toBe(false)
    expect(isCurveFinite(curveOf([{ x: 0, y: 0, z: -Infinity }]))).toBe(false)
  })

  test('the bad point can be anywhere in the curve, not just the first', () => {

    expect(isCurveFinite(curveOf([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 2, z: NaN },
    ]))).toBe(false)
  })
})
