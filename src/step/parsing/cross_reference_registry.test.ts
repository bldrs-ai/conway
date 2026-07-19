/* eslint-disable no-magic-numbers */
// M5: outbound cross-model references are collected during the parse (by type,
// via the dispatcher) and resolved to navigable federation links against the
// source model URI once their Location strings are readable.
import { describe, expect, test } from '@jest/globals'

import {
  ReferenceLocationReader,
  CrossReferenceRegistry,
} from './cross_reference_registry'
import { StreamingRecordDispatcher } from './streaming_record_dispatcher'
import { IfcExternalReference } from '../../ifc/ifc4_gen'

/**
 * A mock reader over a fixed express-ID → Location map.
 *
 * @param locations The express-ID → Location map.
 * @return {ReferenceLocationReader} The reader.
 */
function reader( locations: Record<number, string | null> ): ReferenceLocationReader {
  return { locationOf: ( expressID ) => locations[ expressID ] }
}

describe( 'CrossReferenceRegistry', () => {

  test( 'collects references handed to its handler and resolves them', () => {
    const registry = new CrossReferenceRegistry<number>( 'https://ex.com/site/plan.ifc' )

    // Simulate the dispatcher delivering three reference records.
    registry.handler( 0, 100, 1 )
    registry.handler( 1, 200, 1 )
    registry.handler( 2, 300, 1 )

    expect( registry.count ).toBe( 3 )

    const links = registry.resolve( reader( {
      100: '../shared/grid.ifc',
      200: 'https://other.org/lib.ifc',
      300: 'wing-A.ifc#4022',
    } ) )

    const byFrom = new Map( links.map( ( l ) => [ l.fromExpressID, l ] ) )

    expect( byFrom.get( 100 )?.targetURI ).toBe( 'https://ex.com/shared/grid.ifc' )
    expect( byFrom.get( 200 )?.targetURI ).toBe( 'https://other.org/lib.ifc' )

    // A location with a #expressID resolves to a full entity address.
    const wing = byFrom.get( 300 )
    expect( wing?.targetURI ).toBe( 'https://ex.com/site/wing-A.ifc#4022' )
    expect( wing?.targetEntity ).toEqual( {
      modelURI: 'https://ex.com/site/wing-A.ifc',
      expressID: 4022,
    } )
  } )

  test( 'skips references with no location', () => {
    const registry = new CrossReferenceRegistry<number>( 'base.ifc' )
    registry.handler( 0, 1, 1 )
    registry.handler( 1, 2, 1 )

    const links = registry.resolve( reader( { 1: null, 2: '' } ) )
    expect( links ).toEqual( [] )
  } )

  test( 'is idempotent under the streaming grow-restart (dedupes express IDs)', () => {
    const registry = new CrossReferenceRegistry<number>( 'base.ifc' )
    registry.handler( 0, 42, 1 )
    registry.handler( 0, 42, 1 ) // re-fire from localID 0 after a restart
    expect( registry.count ).toBe( 1 )
  } )

  test( 'wires to the dispatcher, collecting only the reference types', () => {
    const registry = new CrossReferenceRegistry<number>( 'base.ifc' )
    const dispatcher = new StreamingRecordDispatcher<number>()
    dispatcher.on( [ IfcExternalReference as any ], registry.handler )

    // One record of a matching (subtype-closure) type, one outside it.
    const matching = ( IfcExternalReference as any ).query[ 0 ] as number
    const nonMatching = 10_000_000 // not in the reference closure

    dispatcher.onRecordIndexed( 0, 500, matching )
    dispatcher.onRecordIndexed( 1, 600, nonMatching )

    expect( [ ...registry.expressIDs() ] ).toEqual( [ 500 ] )
  } )
} )
