/* eslint-disable no-magic-numbers */
// M5: the per-browser shared budget is what keeps federation from re-growing
// memory O(N) with the number of open models — reservations across all models
// draw from one ceiling.
import { describe, expect, test } from '@jest/globals'

import { SharedByteBudget } from './shared_byte_budget'

describe( 'SharedByteBudget', () => {

  test( 'reserves up to the ceiling and refuses to overcommit', () => {
    const budget = new SharedByteBudget( 1000 )

    expect( budget.reserve( 600 ) ).toBe( true )
    expect( budget.reserve( 300 ) ).toBe( true )
    expect( budget.used ).toBe( 900 )
    expect( budget.available ).toBe( 100 )

    // 200 doesn't fit in the remaining 100 — refused, no change.
    expect( budget.reserve( 200 ) ).toBe( false )
    expect( budget.used ).toBe( 900 )
  } )

  test( 'releasing frees room for later reservations', () => {
    const budget = new SharedByteBudget( 1000 )

    budget.reserve( 800 )
    expect( budget.reserve( 300 ) ).toBe( false )

    budget.release( 500 )
    expect( budget.used ).toBe( 300 )
    expect( budget.reserve( 300 ) ).toBe( true )
  } )

  test( 'release clamps at zero (a double release is not corruption)', () => {
    const budget = new SharedByteBudget( 1000 )

    budget.reserve( 100 )
    budget.release( 100 )
    budget.release( 100 )
    expect( budget.used ).toBe( 0 )
  } )

  test( 'overageFor reports how much must be evicted before a reservation fits', () => {
    const budget = new SharedByteBudget( 1000 )

    budget.reserve( 700 )
    // 500 wanted, 300 available → must evict 200.
    expect( budget.overageFor( 500 ) ).toBe( 200 )
    // 200 wanted, 300 available → fits, no eviction.
    expect( budget.overageFor( 200 ) ).toBe( 0 )
  } )

  test( 'the ceiling is shared: two models cannot each spend the whole budget', () => {
    const budget = new SharedByteBudget( 1000 )

    // "Model A" and "model B" both draw from the same budget.
    expect( budget.reserve( 700 ) ).toBe( true )  // A
    expect( budget.reserve( 700 ) ).toBe( false ) // B — only 300 left
    expect( budget.reserve( 300 ) ).toBe( true )  // B fits in the remainder
    expect( budget.used ).toBe( budget.total )
  } )

  test( 'rejects an invalid ceiling and negative amounts', () => {
    expect( () => new SharedByteBudget( 0 ) ).toThrow()
    const budget = new SharedByteBudget( 10 )
    expect( () => budget.reserve( -1 ) ).toThrow()
    expect( () => budget.release( -1 ) ).toThrow()
  } )
} )
