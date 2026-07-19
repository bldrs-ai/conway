/* eslint-disable no-magic-numbers */
// M5: the composed view fans a type query across every registered model and
// yields universal addresses, so "every wall in the project" spans files and
// each result round-trips back through the registry to its model.
import { describe, expect, test } from '@jest/globals'

import { ComposedModelSkeleton, TypeQueryableModel } from './composed_model_skeleton'
import { ModelRegistry } from './model_registry'
import { SharedByteBudget } from './shared_byte_budget'

/**
 * A fake type-queryable model returning a fixed express-ID set regardless of
 * the queried types (the query-closure matching itself is covered by the
 * incremental-type-index tests; here we exercise cross-model composition).
 */
class FakeModel implements TypeQueryableModel<number> {

  /**
   * @param ids The express IDs this model reports for any query.
   */
  constructor( private readonly ids: number[] ) {}

  /**
   * @return {IterableIterator<number>} The fixed express IDs.
   */
  public* expressIDsOfTypes(): IterableIterator<number> {
    yield* this.ids
  }
}

// A dummy constructor to satisfy the query signature (unused by FakeModel).
const ANY_TYPE = { query: [ 1 ] } as any

describe( 'ComposedModelSkeleton', () => {

  /**
   * A composed view over two fake models.
   *
   * @return {ComposedModelSkeleton} The composed view.
   */
  function composed(): ComposedModelSkeleton<number, FakeModel> {
    const registry = new ModelRegistry<FakeModel>( new SharedByteBudget( 1000 ) )
    registry.register( 'site/a.ifc', new FakeModel( [ 1, 2 ] ) )
    registry.register( 'site/b.ifc', new FakeModel( [ 10, 11, 12 ] ) )
    return new ComposedModelSkeleton<number, FakeModel>( registry )
  }

  test( 'yields universal addresses across every registered model', () => {
    const view = composed()

    const addresses = [ ...view.entitiesOfType( ANY_TYPE ) ]

    expect( addresses ).toEqual( [
      { modelURI: 'site/a.ifc', expressID: 1 },
      { modelURI: 'site/a.ifc', expressID: 2 },
      { modelURI: 'site/b.ifc', expressID: 10 },
      { modelURI: 'site/b.ifc', expressID: 11 },
      { modelURI: 'site/b.ifc', expressID: 12 },
    ] )
  } )

  test( 'counts across the federation', () => {
    expect( composed().countOfType( ANY_TYPE ) ).toBe( 5 )
  } )

  test( 'each composed address resolves back to its own model', () => {
    const view = composed()

    for ( const address of view.entitiesOfType( ANY_TYPE ) ) {
      const resolved = view.registry.resolve( address )
      expect( resolved ).toBeDefined()
      expect( resolved?.expressID ).toBe( address.expressID )
    }
  } )

  test( 'an empty registry composes to nothing', () => {
    const view = new ComposedModelSkeleton<number, FakeModel>(
        new ModelRegistry<FakeModel>( new SharedByteBudget( 10 ) ) )

    expect( [ ...view.entitiesOfType( ANY_TYPE ) ] ).toEqual( [] )
    expect( view.countOfType( ANY_TYPE ) ).toBe( 0 )
  } )
} )
