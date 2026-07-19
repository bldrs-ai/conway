/* eslint-disable no-magic-numbers */
// M5: the registry keys open models by URI, resolves universal addresses to
// the live model, and hands every model the one shared budget.
import { describe, expect, test } from '@jest/globals'

import { ModelRegistry } from './model_registry'
import { SharedByteBudget } from './shared_byte_budget'

/** A stand-in model handle: just its URI. */
interface FakeModel { uri: string }

describe( 'ModelRegistry', () => {

  /**
   * A registry with two registered fake models.
   *
   * @return {ModelRegistry} The populated registry.
   */
  function twoModels(): ModelRegistry<FakeModel> {
    const registry = new ModelRegistry<FakeModel>( new SharedByteBudget( 1000 ) )
    registry.register( 'https://ex.com/a.ifc', { uri: 'a' } )
    registry.register( 'https://ex.com/b.ifc', { uri: 'b' } )
    return registry
  }

  test( 'registers, looks up and counts models', () => {
    const registry = twoModels()

    expect( registry.size ).toBe( 2 )
    expect( registry.has( 'https://ex.com/a.ifc' ) ).toBe( true )
    expect( registry.get( 'https://ex.com/b.ifc' )?.uri ).toBe( 'b' )
    expect( [ ...registry.uris() ].sort() ).toEqual(
        [ 'https://ex.com/a.ifc', 'https://ex.com/b.ifc' ] )
  } )

  test( 'resolves an address string to the model and express ID', () => {
    const registry = twoModels()

    const resolved = registry.resolve( 'https://ex.com/b.ifc#42' )
    expect( resolved?.model.uri ).toBe( 'b' )
    expect( resolved?.expressID ).toBe( 42 )
  } )

  test( 'resolves a pre-parsed address object too', () => {
    const registry = twoModels()

    const resolved =
      registry.resolve( { modelURI: 'https://ex.com/a.ifc', expressID: 7 } )
    expect( resolved?.model.uri ).toBe( 'a' )
    expect( resolved?.expressID ).toBe( 7 )
  } )

  test( 'returns undefined for an unregistered model (open-then-retry cue)', () => {
    const registry = twoModels()

    expect( registry.resolve( 'https://ex.com/missing.ifc#1' ) )
        .toBeUndefined()
  } )

  test( 'unregister removes a model', () => {
    const registry = twoModels()

    expect( registry.unregister( 'https://ex.com/a.ifc' ) ).toBe( true )
    expect( registry.has( 'https://ex.com/a.ifc' ) ).toBe( false )
    expect( registry.size ).toBe( 1 )
  } )

  test( 'rejects registering a URI with a fragment', () => {
    const registry = new ModelRegistry<FakeModel>( new SharedByteBudget( 10 ) )
    expect( () => registry.register( 'a.ifc#1', { uri: 'a' } ) ).toThrow( /#/ )
  } )

  test( 'exposes the one shared budget every model draws from', () => {
    const budget = new SharedByteBudget( 1000 )
    const registry = new ModelRegistry<FakeModel>( budget )

    expect( registry.budget ).toBe( budget )
    registry.budget.reserve( 400 )
    expect( registry.budget.available ).toBe( 600 )
  } )
} )
