/* eslint-disable no-magic-numbers */
// COORDINATE_TO_ORIGIN on a model whose national-grid coordinates live in
// the GEOMETRY rather than the placements (Share#1634,
// test-models-private#97).
//
// Why this file exists when coordination is already covered: every other
// coordination test in this directory compares one emit path against
// another. All of them shared the defect — conway-geom's
// `Geometry::Normalize()` returned a dead (0,0,0) member instead of the
// centre it had just subtracted, AND left the float32 reification
// un-cleared, so the composed transform was missing exactly the term the
// vertices were missing. Those two errors cancel in world space, which is
// precisely why path-parity assertions could not see them: the classic,
// deferred and preview paths agreed with each other, and all three
// uploaded LV95 coordinates (~2.6e6 m, float32 ULP ~0.25 m) to the GPU.
//
// So the assertions below deliberately do NOT compare paths. They read the
// float32 vertex buffer a consumer actually uploads, and the transform it
// actually applies, and check both against the coordinates the fixture
// declares.

import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcAPI } from './ifc_api'
import { LARGE_COORDINATE_BUDGET_M } from './coordination_f64'
import {
  exceedsLargeCoordinateBudget,
  normalizeWithCentreF64,
  placementMagnitudeM,
} from './geometry_recentre'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/** Interleaved position + normal, as GetVertexArray serves it. */
const FLOATS_PER_VERTEX = 6

/**
 * The LV95 origin data/lv95_baked_geometry.ifc is authored around, and the
 * recentre COORDINATION_SNAP_M quantizes that anchor to.
 */
const GRID_EASTING = 2646000
const GRID_NORTHING = 1249000

/**
 * Source-space (Z-up, raw IFC units) bounds of each product's box, read
 * straight off the fixture: profile half-extents 1 x 2 about the
 * IfcAxis2Placement3D position, extruded 3 in +Z.
 *
 * The fractional .37 / .61 are load-bearing. Integers below 2^24 are
 * EXACT in float32, so a fixture on whole metres reproduces its own
 * coordinates perfectly even with the pre-fix 2.6e6 m vertex buffer, and
 * the world-position assertion below would pass against the bug it exists
 * to pin. Off-grid coordinates round to the nearest 0.25 m at that
 * magnitude — which is the defect, made measurable.
 */
const SOURCE_BOXES: ReadonlyMap< number, { min: number[], max: number[] } > =
  new Map( [
    // #1000, own body at the fixture's LV95 origin.
    [ 1000,
      { min: [ 2645999.37, 1248998.61, 0 ], max: [ 2646001.37, 1249002.61, 3 ] } ],
    // #1100, own body 30m east.
    [ 1100,
      { min: [ 2646029.37, 1248998.61, 0 ], max: [ 2646031.37, 1249002.61, 3 ] } ],
    // #1200, the shared map body, identity placement.
    [ 1200,
      { min: [ 2646019.37, 1249008.61, 0 ], max: [ 2646021.37, 1249012.61, 3 ] } ],
    // #1300, the SAME map body, placed 20m north.
    [ 1300,
      { min: [ 2646019.37, 1249028.61, 0 ], max: [ 2646021.37, 1249032.61, 3 ] } ],
  ] )

/**
 * Where a source-space point lands after the coordination frame:
 * translate by the quantized grid anchor, then Z-up -> Y-up.
 *
 * Written out rather than reusing deriveCoordinationF64 on purpose — a
 * test that re-derives the frame from the same code under test cannot
 * catch the frame being wrong.
 *
 * @param p A point in raw IFC source space.
 * @return {number[]} The expected world position.
 */
function expectedWorld( p: number[] ): number[] {
  return [ p[ 0 ] - GRID_EASTING, p[ 2 ], -( p[ 1 ] - GRID_NORTHING ) ]
}

/**
 * Apply a column-major 4x4 to a point.
 *
 * @param m The transform.
 * @param p The point.
 * @return {number[]} The transformed point.
 */
function transformPoint( m: ArrayLike< number >, p: number[] ): number[] {
  return [
    m[ 0 ] * p[ 0 ] + m[ 4 ] * p[ 1 ] + m[ 8 ] * p[ 2 ] + m[ 12 ],
    m[ 1 ] * p[ 0 ] + m[ 5 ] * p[ 1 ] + m[ 9 ] * p[ 2 ] + m[ 13 ],
    m[ 2 ] * p[ 0 ] + m[ 6 ] * p[ 1 ] + m[ 10 ] * p[ 2 ] + m[ 14 ],
  ]
}

interface Placement {
  expressID: number
  geometryExpressID: number
  flatTransformation: number[]
}

let api: IfcAPI
let buffer: Uint8Array

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array( fs.readFileSync( 'data/lv95_baked_geometry.ifc' ) )
}, 120000 )

/**
 * Pump the fixture through the deferred/streamed open Share uses on a
 * cache miss and collect every emitted placement.
 *
 * @return {Promise<Placement[]>} The placements, in emission order.
 */
async function openAndPump(): Promise< [ number, Placement[] ] > {

  const modelID = await api.OpenModelStreamed(
      buffer, { ...SETTINGS, DEFER_GEOMETRY: true, STREAMING_CONSUMER: true } )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const placements: Placement[] = []

  for ( ; ; ) {

    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, 2, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )

            placements.push( {
              expressID: mesh.expressID,
              geometryExpressID: placed.geometryExpressID,
              flatTransformation: [ ...placed.flatTransformation ],
            } )
          }
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return [ modelID, placements ]
}

/**
 * The float32 vertex positions a consumer uploads for one geometry —
 * exactly the read Share's flatMeshToBufferGeometry performs.
 *
 * @param modelID The open model.
 * @param geometryExpressID The placement's geometry.
 * @return {number[][]} One [x, y, z] per vertex.
 */
function uploadedPositions( modelID: number, geometryExpressID: number ):
    number[][] {

  const geometry = api.GetGeometry( modelID, geometryExpressID )
  const size = geometry.GetVertexDataSize()

  expect( size ).toBeGreaterThan( 0 )

  const data = api.GetVertexArray( geometry.GetVertexData(), size )
  const positions: number[][] = []

  for ( let at = 0; at + FLOATS_PER_VERTEX - 1 < data.length;
    at += FLOATS_PER_VERTEX ) {
    positions.push( [ data[ at ], data[ at + 1 ], data[ at + 2 ] ] )
  }

  expect( positions.length ).toBeGreaterThan( 0 )

  return positions
}

describe( 'COORDINATE_TO_ORIGIN with grid coordinates baked into geometry', () => {

  test( 'every placement and every uploaded vertex is inside the budget',
      async () => {

        const [ , placements ] = await openAndPump()

        expect( placements.length ).toBe( SOURCE_BOXES.size )

        for ( const placement of placements ) {

          expect( SOURCE_BOXES.has( placement.expressID ) ).toBe( true )

          // (1) The transform the consumer applies.
          expect( placementMagnitudeM( placement.flatTransformation ) )
              .toBeLessThan( LARGE_COORDINATE_BUDGET_M )
        }
      }, 120000 )

  test( 'uploaded float32 vertices are local, not national-grid', async () => {

    const [ modelID, placements ] = await openAndPump()

    let worst = 0

    for ( const geometryExpressID of
      new Set( placements.map( ( p ) => p.geometryExpressID ) ) ) {

      for ( const position of uploadedPositions( modelID, geometryExpressID ) ) {
        for ( const component of position ) {
          worst = Math.max( worst, Math.abs( component ) )
        }
      }
    }

    // (2) Pre-fix this was 2.65e6 — where a float32 ULP is 0.25 m.
    expect( worst ).toBeLessThan( LARGE_COORDINATE_BUDGET_M )

    // Tighter than the budget, and the real claim: the boxes are metres
    // across, so a correct recentre leaves them metres from their own
    // origin. A merely-smaller number would satisfy the line above.
    expect( worst ).toBeLessThan( 10 )
  }, 120000 )

  test( 'transform x uploaded vertex reproduces the authored coordinates',
      async () => {

        const [ modelID, placements ] = await openAndPump()

        for ( const placement of placements ) {

          const source = SOURCE_BOXES.get( placement.expressID )!
          const expectedMin = expectedWorld( source.min )
          const expectedMax = expectedWorld( source.max )

          const worldMin = [ Infinity, Infinity, Infinity ]
          const worldMax = [ -Infinity, -Infinity, -Infinity ]

          for ( const position of
            uploadedPositions( modelID, placement.geometryExpressID ) ) {

            const world =
              transformPoint( placement.flatTransformation, position )

            for ( let axis = 0; axis < 3; ++axis ) {
              worldMin[ axis ] = Math.min( worldMin[ axis ], world[ axis ] )
              worldMax[ axis ] = Math.max( worldMax[ axis ], world[ axis ] )
            }
          }

          // (3) Both orderings of expectedWorld's Z flip are covered by
          // comparing sorted extents rather than assuming which is which.
          for ( let axis = 0; axis < 3; ++axis ) {

            const lo = Math.min( expectedMin[ axis ], expectedMax[ axis ] )
            const hi = Math.max( expectedMin[ axis ], expectedMax[ axis ] )

            // 1 mm: the uploaded vertices are float32 at ~2 m magnitude
            // (ULP ~2e-7 m) and the transform is float64, so anything this
            // loose is still three orders tighter than the 0.25 m
            // quantization the fix removes.
            expect( worldMin[ axis ] ).toBeCloseTo( lo, 3 )
            expect( worldMax[ axis ] ).toBeCloseTo( hi, 3 )
          }
        }
      }, 120000 )

  test( 'a geometry shared by two placements is recentred once, not twice',
      async () => {

        const [ , placements ] = await openAndPump()

        const byGeometry = new Map< number, Placement[] >()

        for ( const placement of placements ) {

          const group = byGeometry.get( placement.geometryExpressID ) ?? []

          group.push( placement )
          byGeometry.set( placement.geometryExpressID, group )
        }

        const shared =
          [ ...byGeometry.values() ].filter( ( group ) => group.length > 1 )

        // The fixture's IfcRepresentationMap: one native geometry, two
        // instancing products. If this stops being true the assertion
        // below silently stops testing anything.
        expect( shared.length ).toBe( 1 )
        expect( shared[ 0 ].length ).toBe( 2 )

        const [ first, second ] =
          [ ...shared[ 0 ] ].sort( ( a, b ) => a.expressID - b.expressID )

        expect( first.expressID ).toBe( 1200 )
        expect( second.expressID ).toBe( 1300 )

        // (4) Both emissions must carry the SAME recovered centre, so the
        // only thing separating their transforms is the 20m the second
        // product's placement adds — Z-up -> Y-up turns +20 north into
        // -20 in Z. The second call to normalize() shifts nothing and
        // reports a zero diff, so this passes only if the cached centre
        // was served; without it the second instance composes as if the
        // body were at the origin and lands ~2.6e6 m away.
        expect( second.flatTransformation[ 12 ] - first.flatTransformation[ 12 ] )
            .toBeCloseTo( 0, 6 )
        expect( second.flatTransformation[ 13 ] - first.flatTransformation[ 13 ] )
            .toBeCloseTo( 0, 6 )
        expect( second.flatTransformation[ 14 ] - first.flatTransformation[ 14 ] )
            .toBeCloseTo( -20, 6 )
      }, 120000 )
} )

describe( 'normalizeWithCentreF64', () => {

  /**
   * A stand-in for the native geometry, with `normalize()`'s pinned-wasm
   * behaviour: shift the vertices once (guarded by `normalized_`), return
   * a useless (0,0,0), and leave the reification alone.
   *
   * @param at Where the single vertex sits.
   * @return {object} The double, plus its observable side-effect counters.
   */
  function nativeDouble( at: number[] ) {

    return {
      point: { x: at[ 0 ], y: at[ 1 ], z: at[ 2 ] },
      normalized: false,
      normalizeCalls: 0,
      clears: 0,
      getVertexCount(): number {
        return 1
      },
      getPoint(): { x: number, y: number, z: number } {
        return { ...this.point }
      },
      normalize(): { x: number, y: number, z: number } {
        ++this.normalizeCalls
        if ( !this.normalized ) {
          // A one-vertex mesh's AABB centre is the vertex itself.
          this.point = { x: 0, y: 0, z: 0 }
          this.normalized = true
        }
        return { x: 0, y: 0, z: 0 }
      },
      clearReification(): void {
        ++this.clears
      },
    }
  }

  test( 'measures the shift normalize() will not report, and drops the ' +
    'stale reification', () => {

    const geometry = nativeDouble( [ 2646398.5, 1248917.25, 5.75 ] )

    const centre = normalizeWithCentreF64( geometry )

    expect( centre.x ).toBe( 2646398.5 )
    expect( centre.y ).toBe( 1248917.25 )
    expect( centre.z ).toBe( 5.75 )
    expect( geometry.clears ).toBe( 1 )
  } )

  test( 'serves the measured centre on a second walk of the same geometry',
      () => {

        const geometry = nativeDouble( [ 2646398.5, 1248917.25, 5.75 ] )

        const first = normalizeWithCentreF64( geometry )
        const second = normalizeWithCentreF64( geometry )

        expect( second ).toEqual( first )

        // The second call shifted nothing, so there is no stale
        // reification to drop — re-clearing would throw away a rebuild
        // once per instance of a mapped body.
        expect( geometry.normalizeCalls ).toBe( 2 )
        expect( geometry.clears ).toBe( 1 )
      } )

  test( 'a re-extracted geometry measures afresh rather than inheriting a ' +
    'cached centre', () => {

    const evicted = nativeDouble( [ 2646398.5, 1248917.25, 5.75 ] )

    normalizeWithCentreF64( evicted )

    // What the residency hands back after evictToBudget + re-extract: a
    // new handle around an un-normalized native at the same coordinates.
    const reextracted = nativeDouble( [ 2646398.5, 1248917.25, 5.75 ] )
    const centre = normalizeWithCentreF64( reextracted )

    expect( centre.x ).toBe( 2646398.5 )
    expect( reextracted.clears ).toBe( 1 )
  } )

  test( 'geometry already at its own origin reports no centre', () => {

    const geometry = nativeDouble( [ 0, 0, 0 ] )

    const centre = normalizeWithCentreF64( geometry )

    expect( centre ).toEqual( { x: 0, y: 0, z: 0 } )

    // Nothing moved, so nothing was invalidated.
    expect( geometry.clears ).toBe( 0 )
  } )

  test( 'empty geometry is left alone entirely', () => {

    const geometry = {
      ...nativeDouble( [ 2646398.5, 1248917.25, 5.75 ] ),
      getVertexCount: () => 0,
    }

    const centre = normalizeWithCentreF64( geometry )

    expect( centre ).toEqual( { x: 0, y: 0, z: 0 } )

    // getPoint(0) is out of range on an empty mesh; normalize() must not
    // be reached at all.
    expect( geometry.normalizeCalls ).toBe( 0 )
  } )
} )

describe( 'exceedsLargeCoordinateBudget', () => {

  /**
   * A column-major identity with the given translation.
   *
   * @param t The translation.
   * @return {number[]} The transform.
   */
  function placedAt( t: number[] ): number[] {
    return [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[ 0 ], t[ 1 ], t[ 2 ], 1 ]
  }

  test( 'fires on a drawable placement past the budget', () => {
    expect( exceedsLargeCoordinateBudget(
        placedAt( [ -2646000, 0, 1249000 ] ), { getVertexCount: () => 36 } ) )
        .toBe( true )
  } )

  test( 'stays quiet inside the budget', () => {
    expect( exceedsLargeCoordinateBudget(
        placedAt( [ 414, 6, 82 ] ), { getVertexCount: () => 36 } ) )
        .toBe( false )
  } )

  test( 'exempts empty geometry, which cannot jitter', () => {

    // Ecobau ends a CORRECT load with 20 of these — placements whose
    // boolean produced no vertices, so nothing recentres them and nothing
    // draws them either. Warning on those would fire the alarm on the
    // model the fix repaired.
    expect( exceedsLargeCoordinateBudget(
        placedAt( [ -2646000, 0, 1249000 ] ), { getVertexCount: () => 0 } ) )
        .toBe( false )
  } )
} )
