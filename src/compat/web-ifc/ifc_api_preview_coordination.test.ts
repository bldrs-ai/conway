/* eslint-disable no-magic-numbers, dot-notation */
// Adopted preview-channel coordination frames must be validated against
// the durable walk's first geometry (Share#1634): a model can carry
// geometry in more than one frame, so a preview anchored on a
// local-scale unit hands the deferred pump a ~identity frame and the
// georeferenced body streams out raw. The deferred pump now re-derives
// from its own first geometry when the adopted frame leaves it beyond
// the large-coordinate budget.
//
// The adoption is injected directly (tiny fixtures parse in one tick,
// so the parse-time preview channel never fires on them); the injected
// identity frame is exactly what a wrong-frame preview anchor produces.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { LARGE_COORDINATE_BUDGET_M } from './coordination_f64'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
}
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

let api: IfcAPI
let georeferenced: Uint8Array
let local: Uint8Array

/**
 * Pump a deferred model to completion and collect every placement
 * translation.
 *
 * @param modelID The deferred model.
 * @return {number[][]} One [x, y, z] per placed geometry.
 */
function pumpTranslations( modelID: number ): number[][] {

  const translations: number[][] = []

  for ( ; ; ) {

    const batch: FlatMesh[] = []
    const { extracted, remaining } =
      api.ExtractGeometryBatch( modelID, 4, ( mesh ) => batch.push( mesh ) )

    for ( const mesh of batch ) {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {

        const placed = mesh.geometries.get( where )

        translations.push( [
          placed.flatTransformation[ 12 ],
          placed.flatTransformation[ 13 ],
          placed.flatTransformation[ 14 ],
        ] )
      }
    }

    if ( remaining === 0 || extracted === 0 ) {
      break
    }
  }

  return translations
}

/**
 * @param translations Placement translations.
 * @return {number} Largest absolute component.
 */
function maxComponent( translations: number[][] ): number {
  return translations.reduce(
      ( max, t ) => Math.max( max, ...t.map( Math.abs ) ), 0 )
}

/**
 * Simulate a preview channel that anchored in the wrong frame: adopt an
 * identity coordination exactly the way createDeferred does.
 *
 * @param modelID The deferred model.
 */
function injectIdentityPreviewFrame( modelID: number ): void {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxy = ( api as any ).models.get( modelID )

  expect( proxy ).toBeDefined()

  proxy[ 'demandCoordination_' ] = [ ...IDENTITY ]
  proxy[ '_isCoordinated' ] = true
  proxy[ 'demandCoordinationFromPreview_' ] = true
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  georeferenced = new Uint8Array( fs.readFileSync( 'data/index_georeferenced.ifc' ) )
  local = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
}, 120000 )

describe( 'deferred pump preview-frame validation (Share#1634)', () => {

  test( 'wrong-frame adopted coordination is re-derived on a georeferenced model', async () => {

    // Control: no preview involvement — the pump derives its own frame.
    const controlID = await api.OpenModelStreamed( georeferenced, { ...SETTINGS } )
    const control = pumpTranslations( controlID )

    expect( control.length ).toBeGreaterThan( 0 )
    expect( maxComponent( control ) ).toBeLessThan( LARGE_COORDINATE_BUDGET_M )

    // Explicit applied-frame report (Share#1634 acceptance): the real
    // recenter offset — while GetCoordinationMatrix keeps its classic
    // identity contract for assembled-model stamping.
    const applied = api.GetAppliedCoordinationMatrix( controlID )
    expect( Math.max( ...applied.map( Math.abs ) ) )
        .toBeGreaterThan( LARGE_COORDINATE_BUDGET_M )
    expect( api.GetCoordinationMatrix( controlID ) ).toEqual( IDENTITY )

    // Adopting an identity frame (wrong-frame preview anchor) must not
    // leave the body raw: the first durable geometry fails the budget
    // check and the frame re-derives.
    const adoptedID = await api.OpenModelStreamed( georeferenced, { ...SETTINGS } )
    injectIdentityPreviewFrame( adoptedID )
    const adopted = pumpTranslations( adoptedID )

    expect( adopted.length ).toEqual( control.length )
    expect( maxComponent( adopted ) ).toBeLessThan( LARGE_COORDINATE_BUDGET_M )

    for ( let where = 0; where < control.length; ++where ) {
      expect( adopted[ where ][ 0 ] ).toBeCloseTo( control[ where ][ 0 ], 6 )
      expect( adopted[ where ][ 1 ] ).toBeCloseTo( control[ where ][ 1 ], 6 )
      expect( adopted[ where ][ 2 ] ).toBeCloseTo( control[ where ][ 2 ], 6 )
    }
  }, 120000 )

  test( 'a within-budget adopted frame is kept (no false-positive re-derive)', async () => {

    // On a local-scale model an identity frame is a VALID preview
    // frame — validation must keep it, preserving preview/durable
    // agreement, rather than re-deriving to the first-geometry anchor.
    const adoptedID = await api.OpenModelStreamed( local, { ...SETTINGS } )
    injectIdentityPreviewFrame( adoptedID )
    const adopted = pumpTranslations( adoptedID )

    expect( adopted.length ).toBeGreaterThan( 0 )
    expect( maxComponent( adopted ) ).toBeLessThan( LARGE_COORDINATE_BUDGET_M )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proxy = ( api as any ).models.get( adoptedID )

    // Frame survived untouched: still exactly the injected identity.
    expect( [ ...proxy[ 'demandCoordination_' ] ] ).toEqual( IDENTITY )
    expect( proxy[ 'demandCoordinationFromPreview_' ] ).toBe( false )
  }, 120000 )
} )
