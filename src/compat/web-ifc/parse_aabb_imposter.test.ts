import { describe, expect, test } from '@jest/globals'
import {
  aabbFromStepReals,
  aabbToPreviewMatrix,
  makeParseAabbImposter,
} from './parse_aabb_imposter'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import type { PreviewMeshPayload } from './streamed_preview_channel'


describe( 'parse_aabb_imposter', () => {

  test( 'aabbFromStepReals reads IFCCARTESIANPOINTLIST3D triples', () => {

    const text = '#10=IFCCARTESIANPOINTLIST3D(((0.,0.,0.),(1.,2.,3.),(-1.,0.,1.),' +
      '(4.,5.,6.),(0.,0.,1.),(0.,1.,0.),(1.,0.,0.),(2.,2.,2.)));'
    const bytes = new TextEncoder().encode( text )
    const aabb = aabbFromStepReals( bytes )

    expect( aabb ).not.toBeNull()
    expect( aabb!.min ).toEqual( [-1, 0, 0] )
    expect( aabb!.max ).toEqual( [4, 5, 6] )
  } )

  test( 'aabbFromStepReals returns null for a short list', () => {

    const text = '#1=IFCCARTESIANPOINTLIST3D(((0.,0.,0.),(1.,1.,1.)));'
    expect( aabbFromStepReals( new TextEncoder().encode( text ) ) ).toBeNull()
  } )

  test( 'aabbToPreviewMatrix is Z-up to Y-up and centres the box', () => {

    const matrix = aabbToPreviewMatrix( { min: [0, 0, 0], max: [2, 4, 6] } )

    expect( matrix[ 0 ] ).toBe( 2 )
    expect( matrix[ 5 ] ).toBe( 6 )
    expect( matrix[ 10 ] ).toBe( 4 )
    expect( matrix[ 12 ] ).toBe( 1 )
    expect( matrix[ 13 ] ).toBe( 3 )
    expect( matrix[ 14 ] ).toBe( -2 )
  } )

  test( 'makeParseAabbImposter emits every 8th point list', () => {

    const emitted: PreviewMeshPayload[] = []
    const emit = makeParseAabbImposter( ( mesh ) => emitted.push( mesh ) )
    const points = Array.from( { length: 8 }, ( _, i ) => `(${i}.,0.,0.)` ).join( ',' )
    const bytes = new TextEncoder().encode(
        `#1=IFCCARTESIANPOINTLIST3D((${points}));` )

    for ( let i = 1; i <= 8; ++i ) {
      emit( i, i * 10, EntityTypesIfc.IFCCARTESIANPOINTLIST3D, bytes )
    }

    expect( emitted ).toHaveLength( 1 )
    expect( emitted[ 0 ].aabb ).toBeDefined()
    expect( emitted[ 0 ].expressID ).toBe( 80 )
  } )
} )
