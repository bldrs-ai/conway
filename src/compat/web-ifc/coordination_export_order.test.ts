/* eslint-disable no-magic-numbers */
// Export-order independence of the COORDINATE_TO_ORIGIN frame (Share#1749).
//
// The recentre anchors on the first geometry the walk reaches, which is
// whichever element the file happens to declare first. Unsnapped, that
// makes a model's rendered position a function of its element order:
// Share shipped the Bldrs logo as both `index.ifc` and `index.step`, and
// the STEP rendered 76m off the IFC because the two files disagree about
// which block comes first. Every camera permalink spanning the pair was
// wrong, and auto-framing hid it — the models look identical until a
// `#c:` camera pins them.
//
// This drives the same surface Share does (the compat IfcAPI, not the
// CLI's native writer, which has its own recentre convention) and pins
// the properties the snap has to hold together: a near-origin model
// keeps the coordinates its file authored — which is what makes two
// exports of one object coincide — a georeferenced model still
// recentres, and the classic and streamed opens agree.
//
// Not covered here: the AP214 arm. Its placements come back at the
// origin with the geometry carrying the world transform, so neither
// placement bounds nor a fixture pair in two element orders reproduces
// the defect through this surface; the cross-format claim is pinned
// Share-side instead (`src/Containers/indexStepLogo.spec.ts`, which
// compares the rendered bounds of `index.ifc` and `index.step`).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { LARGE_COORDINATE_BUDGET_M, COORDINATION_SNAP_M } from './coordination_f64'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

let api: IfcAPI
let local: Uint8Array
let georeferenced: Uint8Array

/**
 * World-space bounds of every placed geometry in a model, as the
 * consumer sees them: the placement translation is what Share stamps
 * onto its instances.
 *
 * @param modelID An open model.
 * @return {{min: number[], max: number[]}} Translation bounds.
 */
function placementBounds( modelID: number ): { min: number[], max: number[] } {

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]

  api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {
    for ( let where = 0; where < mesh.geometries.size(); ++where ) {

      const t = mesh.geometries.get( where ).flatTransformation

      for ( let axis = 0; axis < 3; ++axis ) {
        min[ axis ] = Math.min( min[ axis ], t[ 12 + axis ] )
        max[ axis ] = Math.max( max[ axis ], t[ 12 + axis ] )
      }
    }
  } )

  return { min, max }
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  local = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
  georeferenced = new Uint8Array( fs.readFileSync( 'data/index_georeferenced.ifc' ) )
}, 120000 )

describe( 'COORDINATE_TO_ORIGIN export-order independence (Share#1749)', () => {

  test( 'a near-origin model keeps its authored coordinates', async () => {

    const modelID = await api.OpenModel( local, { ...SETTINGS } )
    const { min, max } = placementBounds( modelID )

    expect( Number.isFinite( min[ 0 ] ) ).toBe( true )

    // The logo's first-declared block sits at x=76, so the unsnapped
    // frame used to drag the whole model 76m negative. Snapped, the
    // anchor lands in the origin cell and the model stays where the file
    // put it — which is what makes a second export of the same object
    // coincide with it regardless of element order.
    expect( Math.max( ...min.map( Math.abs ), ...max.map( Math.abs ) ) )
        .toBeLessThan( COORDINATION_SNAP_M )
    expect( min[ 0 ] ).toBeGreaterThanOrEqual( 0 )

    api.CloseModel( modelID )
  }, 120000 )

  test( 'a georeferenced model still recentres, inside the budget', async () => {

    const modelID = await api.OpenModel( georeferenced, { ...SETTINGS } )
    const { min, max } = placementBounds( modelID )

    // Snapping costs at most half a cell on top of the model's own
    // extent; the budget is the threshold above which float32 jitter
    // becomes visible (Share#1631).
    expect( Math.max( ...min.map( Math.abs ), ...max.map( Math.abs ) ) )
        .toBeLessThan( LARGE_COORDINATE_BUDGET_M )

    // The applied-frame report (Share#1634) is not asserted here — it is
    // pinned against known authored coordinates in
    // `coordination_baked_geometry.test.ts`, which this fixture cannot
    // do — but it IS filled in on this classic open, and the note that
    // used to stand here saying only the deferred pump records it is no
    // longer true of any IFC emit site.
    api.CloseModel( modelID )
  }, 120000 )

  test( 'the classic and streamed opens agree on the frame', async () => {

    // Both paths derive through deriveCoordinationF64, so the snap has
    // to leave them identical — otherwise one model renders in two
    // places depending on which open Share happened to take. Compared
    // through the emitted placements, which is the property that
    // actually matters to a consumer; the narrower claim that the two
    // opens also AGREE on what GetAppliedCoordinationMatrix reports is
    // asserted directly in `coordination_baked_geometry.test.ts`.
    const classicID = await api.OpenModel( georeferenced, { ...SETTINGS } )
    const classic = placementBounds( classicID )
    api.CloseModel( classicID )

    const streamedID = await api.OpenModelStreamed( georeferenced, { ...SETTINGS } )
    const streamed = placementBounds( streamedID )
    api.CloseModel( streamedID )

    expect( Number.isFinite( classic.min[ 0 ] ) ).toBe( true )

    for ( let axis = 0; axis < 3; ++axis ) {
      expect( streamed.min[ axis ] ).toBeCloseTo( classic.min[ axis ], 6 )
      expect( streamed.max[ axis ] ).toBeCloseTo( classic.max[ axis ], 6 )
    }
  }, 120000 )
} )
