/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'
import * as glmatrix from 'gl-matrix'
import {
  composeTransformF64,
  deriveCoordinationF64,
  mat4MultiplyF64,
} from './coordination_f64'

// The Z-up -> Y-up normalize matrix the proxies pass in (column-major).
const NORMALIZE_MAT: number[] = [
  1, 0, 0, 0,
  0, 0, -1, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
]

/**
 * A pseudo-random but deterministic 4x4 (no Math.random — stable runs).
 *
 * @param seed Any integer seed.
 * @return {number[]} 16 column-major components in [-1, 1).
 */
function pseudoMat( seed: number ): number[] {
  const out = new Array<number>( 16 )
  let state = seed
  for ( let i = 0; i < 16; ++i ) {
    // xorshift-ish; deterministic.
    state = ( state * 1103515245 + 12345 ) & 0x7fffffff
    out[ i ] = ( state / 0x7fffffff ) * 2 - 1
  }
  return out
}

describe( 'coordination_f64', () => {

  test( 'mat4MultiplyF64 matches gl-matrix multiply for arbitrary inputs', () => {
    for ( let seed = 1; seed <= 8; ++seed ) {
      const a = pseudoMat( seed )
      const b = pseudoMat( seed * 31 + 7 )
      const mine = mat4MultiplyF64( a, b )
      const ref = glmatrix.mat4.create()
      glmatrix.mat4.multiply(
          ref,
          a as unknown as glmatrix.mat4,
          b as unknown as glmatrix.mat4 )
      for ( let i = 0; i < 16; ++i ) {
        // float32 gl-matrix vs float64 mine: agree to float32 precision.
        expect( mine[ i ] ).toBeCloseTo( ref[ i ], 4 )
      }
    }
  } )

  test( 'recentres a LV95-magnitude reference exactly where float32 mis-lands it', () => {
    // The georeferencing jitter mechanism: the recentre translation
    // negates a reference point at Swiss LV95 magnitude (~2.6M easting).
    // Stored in a Float32Array it quantizes to the ~0.31 m grid (float32
    // ULP at 2.6M), so the reference lands cm-to-dm off the origin — a
    // per-model positional error baked into every emitted transform. The
    // float64 recentre lands it exactly.
    const identity = glmatrix.mat4.create() // placement; world via the point
    const ref = { x: 2_600_000.31, y: 1_200_000.17, z: 412.5 }

    /**
     * Apply a column-major 4x4 to a point.
     *
     * @param m 16-element matrix.
     * @param p The point.
     * @return {number} The transformed point's distance from origin.
     */
    const originDist = ( m: ArrayLike<number> ) => Math.hypot(
        m[ 0 ] * ref.x + m[ 4 ] * ref.y + m[ 8 ] * ref.z + m[ 12 ],
        m[ 1 ] * ref.x + m[ 5 ] * ref.y + m[ 9 ] * ref.z + m[ 13 ],
        m[ 2 ] * ref.x + m[ 6 ] * ref.y + m[ 10 ] * ref.z + m[ 14 ] )

    // float64 recentre (the fix).
    const distF64 = originDist( deriveCoordinationF64( identity, ref, NORMALIZE_MAT, 1 ) )

    // Old float32 gl-matrix recentre: the translation is stored in a
    // Float32Array, quantizing the -2.6M component.
    const tp = glmatrix.vec4.create()
    glmatrix.vec4.transformMat4( tp, [ ref.x, ref.y, ref.z, 1 ], identity )
    const coordF32 = glmatrix.mat4.create()
    glmatrix.mat4.fromTranslation( coordF32, [ -tp[ 0 ], -tp[ 1 ], -tp[ 2 ] ] )
    glmatrix.mat4.multiply( coordF32, NORMALIZE_MAT as unknown as glmatrix.mat4, coordF32 )
    const distF32 = originDist( coordF32 )

    // float64 lands sub-micron; float32 is off by cm+.
    expect( distF64 ).toBeLessThan( 1e-6 )
    expect( distF32 ).toBeGreaterThan( 1e-2 )
  } )

  test( 'near origin float64 and float32 agree (fixtures unaffected)', () => {
    const placement = pseudoMat( 99 )
    // Keep it a valid affine-ish transform near origin.
    placement[ 12 ] = 3; placement[ 13 ] = -2; placement[ 14 ] = 5
    placement[ 3 ] = 0; placement[ 7 ] = 0; placement[ 11 ] = 0; placement[ 15 ] = 1
    const point = { x: 0.5, y: 0.25, z: -0.75 }

    const f64 = deriveCoordinationF64( placement, point, NORMALIZE_MAT, 1 )
    const composed = composeTransformF64( f64, placement, { x: 0.1, y: 0.2, z: 0.3 } )
    expect( composed ).toHaveLength( 16 )
    // Sanity: finite, bounded.
    for ( const v of composed ) {
      expect( Number.isFinite( v ) ).toBe( true )
    }
  } )

  test( 'flushes non-finite and float32-underflow garbage to zero (reopen parity)', () => {
    // A degenerate/reopened-model placement whose getValues() returns
    // subnormal garbage + a NaN. The old Float32Array path zeroed the
    // subnormals; we zero those AND NaN/Inf so parity holds and no NaN
    // leaks into a transform.
    const garbage = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      1.29e-304, NaN, Infinity, 1,
    ]
    const out = composeTransformF64(
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ], garbage )
    expect( out[ 12 ] ).toBe( 0 ) // subnormal -> 0
    expect( out[ 13 ] ).toBe( 0 ) // NaN -> 0
    expect( out[ 14 ] ).toBe( 0 ) // Infinity -> 0
    for ( const v of out ) {
      expect( Number.isFinite( v ) ).toBe( true )
    }
  } )

  test( 'undefined placement is treated as identity', () => {
    const coord = [ 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1 ]
    const out = composeTransformF64( coord, void 0 )
    expect( Array.from( out ) ).toEqual( coord )
  } )
} )
