/* eslint-disable no-magic-numbers */
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { IfcAPI } from '../compat/web-ifc/ifc_api'
import IfcStepModel from './ifc_step_model'
import { geometryDispatchKey, shardOfDispatchKey } from './geometry_dispatch'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }


describe( 'geometryDispatchKey', () => {

  test( 'products sharing a representation map key together, and land together',
      async () => {

        // The whole claim in one assertion. data/mapped_shared_representation.ifc
        // has two products 15 apart instancing one IfcRepresentationMap; a
        // partition that splits them makes both shards build the same
        // geometry, which is the +25% to +40% round-robin costs on real
        // models. They must key identically WITHOUT anything having been
        // extracted — that is what makes this usable at dispatch time.
        const api = new IfcAPI()

        await api.Init()

        const fixture = new Uint8Array(
            fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

        const modelID = await api.OpenModelStreamed(
            fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

        // The passthrough's internals are not on the public interface;
        // reaching in is deliberate, as in the pump tests.
        const passthrough = api.getPassthrough( modelID ) as unknown as {
          model: [ IfcStepModel ],
          ensureDemandWorklists_(): void,
          demandProducts_?: number[],
        }

        const model = passthrough.model[ 0 ]

        passthrough.ensureDemandWorklists_()

        const products = passthrough.demandProducts_ ?? []

        expect( products.length ).toBeGreaterThan( 2 )

        const keys = products.map(
            ( localID ) => geometryDispatchKey( model, localID ) )

        // The two mapped products share a key; the fillers, which each own
        // their geometry, do not join them.
        const byKey = new Map< number, number >()

        for ( const key of keys ) {
          byKey.set( key, ( byKey.get( key ) ?? 0 ) + 1 )
        }

        const shared = [ ...byKey.values() ].filter( ( count ) => count > 1 )

        expect( shared ).toEqual( [ 2 ] )

        // ...and at every shard count they co-locate, which is the property
        // the partition actually consumes.
        for ( const shardCount of [ 2, 3, 4, 8 ] ) {

          const sharedKey = [ ...byKey.entries() ]
              .find( ( [ , count ] ) => count > 1 )![ 0 ]

          const shards = new Set(
              keys.filter( ( key ) => key === sharedKey )
                  .map( ( key ) => shardOfDispatchKey( key, shardCount ) ) )

          expect( shards.size ).toBe( 1 )
        }

        api.CloseModel( modelID )
      }, 240000 )

  test( 'a key is produced for every product, resolvable or not', async () => {

    // Totality matters more than accuracy here: this runs per product on the
    // dispatch path, and a product with no representation, or one whose
    // attributes do not resolve, must still be placeable. A thrown error
    // costs the model; a poor key costs one duplicated extraction.
    const api = new IfcAPI()

    await api.Init()

    const fixture = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

    const modelID = await api.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    const model = ( api.getPassthrough( modelID ) as unknown as
      { model: [ IfcStepModel ] } ).model[ 0 ]

    // Local IDs that exist, and one that does not.
    for ( const localID of [ 0, 1, 2, 999999 ] ) {

      const key = geometryDispatchKey( model, localID )

      expect( Number.isFinite( key ) ).toBe( true )
      expect( shardOfDispatchKey( key, 4 ) ).toBeGreaterThanOrEqual( 0 )
      expect( shardOfDispatchKey( key, 4 ) ).toBeLessThan( 4 )
    }

    // Degenerate shard counts collapse rather than throwing or indexing out
    // of range — a pool of one is a normal configuration.
    expect( shardOfDispatchKey( 12345, 1 ) ).toBe( 0 )
    expect( shardOfDispatchKey( 12345, 0 ) ).toBe( 0 )
    expect( shardOfDispatchKey( -7, 4 ) ).toBeLessThan( 4 )

    api.CloseModel( modelID )
  }, 240000 )
} )
