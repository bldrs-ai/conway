import { describe, expect, test } from '@jest/globals'
import { isTransformFinite } from './ap214_geometry_extraction'
import type { NativeTransform4x4 } from '../../dependencies/conway-geom'


/**
 * Build a NativeTransform4x4 stand-in over a fixed 16-value column-major
 * array — the only method isTransformFinite reads is getValues.
 *
 * @param values The 16 matrix components to serve back through getValues.
 * @return {NativeTransform4x4} A minimal transform exposing just those values.
 */
function transformOf(values: number[]): NativeTransform4x4 {
  return { getValues: () => values } as unknown as NativeTransform4x4
}


// A well-formed identity, for contrast with the degenerate matrices below.
const IDENTITY = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]


describe('isTransformFinite', () => {

  test('an ordinary transform passes', () => {

    expect(isTransformFinite(transformOf(IDENTITY))).toBe(true)
  })

  // The exact shape conway#592 describes: GetAxis2Placement3D normalising a
  // NaN or zero-length direction ratio comes back with the X and Y basis
  // columns entirely NaN while Z and the translation still look ordinary —
  // [NaN,NaN,NaN,0, NaN,NaN,NaN,0, 0,1,0,0, 0,4,0,1] in the issue's own
  // example. A check that only looked at Z or the translation would miss it.
  test('NaN X and Y basis columns are caught, even with an ordinary Z and translation', () => {

    expect(isTransformFinite(transformOf([
      NaN, NaN, NaN, 0,
      NaN, NaN, NaN, 0,
      0, 1, 0, 0,
      0, 4, 0, 1,
    ]))).toBe(false)
  })

  test('a single non-finite component anywhere in the matrix is enough to reject it', () => {

    for (let i = 0; i < IDENTITY.length; ++i) {

      const values = [...IDENTITY]
      values[i] = NaN
      expect(isTransformFinite(transformOf(values))).toBe(false)
    }
  })

  test('an infinite component rejects the transform, not just NaN', () => {

    const values = [...IDENTITY]
    values[0] = Infinity
    expect(isTransformFinite(transformOf(values))).toBe(false)
  })
})
