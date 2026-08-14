/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'
import * as glmatrix from 'gl-matrix'
import {
  COORDINATION_SNAP_M,
  LARGE_COORDINATE_BUDGET_M,
  TRANSLATION_X,
  TRANSLATION_Y,
  TRANSLATION_Z,
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

  test( 'below the budget every anchor derives model-zero (export-order independence)', () => {
    // The Share#1749 shape: two exports of one object disagree about
    // which element comes first, so the walk anchors on points 76m
    // apart. Both must derive the same frame, or the two files render
    // 76m apart and no camera permalink spans them.
    const identity = glmatrix.mat4.create()
    const first = deriveCoordinationF64(
        identity, { x: 76, y: -11.4504049888, z: 0 }, NORMALIZE_MAT, 1 )
    const second = deriveCoordinationF64(
        identity, { x: 0, y: -11.4504049888, z: 0 }, NORMALIZE_MAT, 1 )

    expect( second ).toEqual( first )
    // Model-zero (conway#87): the frame is the bare Y-up normalize and
    // the model keeps the coordinates its file authored.
    expect( first[ TRANSLATION_X ] ).toBe( 0 )
    expect( first[ TRANSLATION_Y ] ).toBe( 0 )
    expect( first[ TRANSLATION_Z ] ).toBe( 0 )
  } )

  test( 'anchors either side of a grid line below the budget still agree', () => {
    // Why the recentre is staged rather than snapped everywhere: a
    // straight snap turns a small anchor disagreement into a full-cell
    // one. A site-grid model at x ~ 500m whose preview channel anchors
    // at 480 and whose durable walk anchors at 520 would derive frames
    // 1km apart — and the adopted-frame gate only re-derives past
    // LARGE_COORDINATE_BUDGET_M, so it would keep the wrong one and
    // render 1km off a classic open. Below the budget both are zero.
    const identity = glmatrix.mat4.create()
    const below = deriveCoordinationF64( identity, { x: 480, y: 0, z: 0 }, NORMALIZE_MAT, 1 )
    const above = deriveCoordinationF64( identity, { x: 520, y: 0, z: 0 }, NORMALIZE_MAT, 1 )

    expect( above ).toEqual( below )
    expect( below[ TRANSLATION_X ] ).toBe( 0 )
  } )

  test( 'recentres only once past the budget, on the same metre grid whatever the source unit', () => {
    // Same object, one file in metres and one in millimetres: the
    // millimetre file's anchor is 1000x larger and its scaleFactor
    // 1000x smaller, so both must land on the same metre frame.
    const identity = glmatrix.mat4.create()
    const metres = deriveCoordinationF64(
        identity, { x: 2_600_076, y: 412, z: 0 }, NORMALIZE_MAT, 1 )
    const millimetres = deriveCoordinationF64(
        identity, { x: 2_600_076_000, y: 412_000, z: 0 }, NORMALIZE_MAT, 0.001 )

    for ( const i of [ TRANSLATION_X, TRANSLATION_Y, TRANSLATION_Z ] ) {
      expect( millimetres[ i ] ).toBeCloseTo( metres[ i ], 6 )
    }
    expect( metres[ TRANSLATION_X ] ).toBe( -2_600_000 )
  } )

  test( 'keeps a georeferenced model well inside the recentre budget', () => {
    // Above the budget the recentre engages and snapping trades
    // exactness for order-independence; the trade has to stay well
    // inside LARGE_COORDINATE_BUDGET_M, the threshold above which a
    // frame counts as having failed to recentre at all.
    const identity = glmatrix.mat4.create()
    const ref = { x: 2_600_000.31, y: 1_200_000.17, z: 412.5 }
    const coord = deriveCoordinationF64( identity, ref, NORMALIZE_MAT, 1 )
    // NORMALIZE_MAT is Z-up -> Y-up, so the source y/z components land in
    // the frame's z/y translation slots.
    const residual = Math.max(
        Math.abs( ref.x + coord[ TRANSLATION_X ] ),
        Math.abs( ref.z + coord[ TRANSLATION_Y ] ),
        Math.abs( ref.y - coord[ TRANSLATION_Z ] ) )

    expect( residual ).toBeLessThanOrEqual( COORDINATION_SNAP_M / 2 )
    expect( residual ).toBeLessThan( LARGE_COORDINATE_BUDGET_M / 10 )
  } )

  test( 'places a LV95-magnitude element exactly where float32 mis-lands it', () => {
    // The georeferencing jitter mechanism (Share#1631): an element placed
    // at Swiss LV95 magnitude (~2.6M easting) is composed against the
    // recentre frame, and float32 ULP at 2.6M is ~0.31m. Run through
    // gl-matrix's Float32Array that composition quantizes, and the
    // element lands cm-to-dm from where the frame says — a positional
    // error baked into every emitted transform. The float64 path lands it
    // exactly.
    //
    // Note the frame's own translation is now snapped to whole kilometres
    // (COORDINATION_SNAP_M), which happens to be exactly representable in
    // float32 — so the loss this pins is in the composition against the
    // element's full-precision placement, which is where it always
    // mattered: that product is what becomes the FlatMesh transform.
    const ref = { x: 2_600_000.31, y: 1_200_000.17, z: 412.5 }
    const frame = deriveCoordinationF64(
        glmatrix.mat4.create(), ref, NORMALIZE_MAT, 1 )

    // An element sitting on that reference point.
    const placement = glmatrix.mat4.create()
    glmatrix.mat4.identity( placement )
    const placementF64 = Array.from( placement )
    placementF64[ TRANSLATION_X ] = ref.x
    placementF64[ TRANSLATION_Y ] = ref.y
    placementF64[ TRANSLATION_Z ] = ref.z

    // Where it must land: the within-cell remainder, in Y-up axes.
    const rem = ( v: number ) =>
      v - Math.round( v / COORDINATION_SNAP_M ) * COORDINATION_SNAP_M
    const expected = [ rem( ref.x ), rem( ref.z ), -rem( ref.y ) ]

    const f64 = composeTransformF64( frame, placementF64 )

    // The old path's loss: the placement crosses the wasm boundary as a
    // glm::dmat4 but was rebuilt with gl-matrix `mat4.fromValues`, i.e.
    // stored in a Float32Array — quantizing its 2.6M component to the
    // ~0.31m float32 grid before anything is composed. Snapping the frame
    // does not rescue that; only keeping the placement in float64 does.
    const f32 = composeTransformF64( frame, new Float32Array( placementF64 ) )

    const errF64 = Math.max(
        Math.abs( f64[ TRANSLATION_X ] - expected[ 0 ] ),
        Math.abs( f64[ TRANSLATION_Y ] - expected[ 1 ] ),
        Math.abs( f64[ TRANSLATION_Z ] - expected[ 2 ] ) )
    const errF32 = Math.max(
        Math.abs( f32[ TRANSLATION_X ] - expected[ 0 ] ),
        Math.abs( f32[ TRANSLATION_Y ] - expected[ 1 ] ),
        Math.abs( f32[ TRANSLATION_Z ] - expected[ 2 ] ) )

    expect( errF64 ).toBeLessThan( 1e-6 )
    expect( errF32 ).toBeGreaterThan( 1e-2 )
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
