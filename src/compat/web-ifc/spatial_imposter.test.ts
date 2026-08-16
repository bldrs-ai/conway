/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import type { PreviewMeshPayload } from './streamed_preview_channel'
import {
  aabbMostlyEqual,
  emitSpatialStructureImposters,
  shouldEmitSpatialNode,
  spatialImposterDepthCap,
  SPATIAL_IMPOSTER_COLOR,
  unionAabb,
} from './spatial_imposter'


describe( 'spatial_imposter policy', () => {

  test( 'depth cap is half the tree, rounded up', () => {

    expect( spatialImposterDepthCap( 0 ) ).toBe( 0 )
    expect( spatialImposterDepthCap( 1 ) ).toBe( 1 )
    expect( spatialImposterDepthCap( 4 ) ).toBe( 2 )
    expect( spatialImposterDepthCap( 5 ) ).toBe( 3 )
  } )

  test( 'never emits spaces; always emits storeys; half-depth otherwise', () => {

    expect( shouldEmitSpatialNode( 4, 4, EntityTypesIfc.IFCSPACE ) ).toBe( false )
    expect( shouldEmitSpatialNode( 3, 4, EntityTypesIfc.IFCBUILDINGSTOREY ) ).toBe( true )
    expect( shouldEmitSpatialNode( 2, 4, EntityTypesIfc.IFCBUILDING ) ).toBe( true )
    expect( shouldEmitSpatialNode( 3, 4, EntityTypesIfc.IFCBUILDING ) ).toBe( false )
    expect( shouldEmitSpatialNode( 0, 4, EntityTypesIfc.IFCPROJECT ) ).toBe( true )
  } )

  test( 'unionAabb and aabbMostlyEqual', () => {

    const a = { min: [0, 0, 0] as [number, number, number], max: [10, 10, 4] as [number, number, number] }
    const b = { min: [8, 8, 0] as [number, number, number], max: [12, 12, 4] as [number, number, number] }
    const u = unionAabb( a, b )!

    expect( u.min ).toEqual( [0, 0, 0] )
    expect( u.max ).toEqual( [12, 12, 4] )
    expect( aabbMostlyEqual( a, a ) ).toBe( true )
    expect( aabbMostlyEqual( a, b ) ).toBe( false )
  } )

  test( 'imposter colour is black at 0.3 opacity', () => {

    expect( SPATIAL_IMPOSTER_COLOR ).toEqual( { x: 0, y: 0, z: 0, w: 0.3 } )
  } )
} )


describe( 'emitSpatialStructureImposters', () => {

  test( 'index.ifc emits storey-scale solid black boxes, not spaces', async () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const open = await openStreamedIfcModelFromStore(
        new InMemoryStepByteStore( bytes ), { pool: 4 * 1024 } )
    const payloads: PreviewMeshPayload[] = []

    const emitted = await emitSpatialStructureImposters(
        open.model!, ( mesh ) => payloads.push( mesh ) )

    expect( emitted ).toBeGreaterThan( 0 )
    expect( payloads ).toHaveLength( emitted )

    for ( const payload of payloads ) {

      expect( payload.solid ).toBe( true )
      expect( payload.aabb ).toBeDefined()
      expect( payload.geometryExpressID ).toBe( -1 )
      expect( payload.color ).toEqual( SPATIAL_IMPOSTER_COLOR )
      expect( payload.flatTransformation ).toHaveLength( 16 )
    }

    const types = new Set(
        payloads.map( ( p ) => open.model!.typeIDOf(
            open.model!.resolveExpressID( p.expressID )! ) ) )

    expect( types.has( EntityTypesIfc.IFCSPACE ) ).toBe( false )
  } )
} )
