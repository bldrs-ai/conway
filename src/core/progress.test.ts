import {describe, expect, test} from '@jest/globals'

import { ProgressEvent, ProgressTracker, yieldToEventLoop } from './progress'


const TOTAL_BYTES = 1000
const QUARTER = 250
const HALF = 500
const ONE_HOUR_MS = 3_600_000
const TOTAL_PRODUCTS = 100
const UPDATE_COUNT = 50
const SMALL_TOTAL = 10
const OVERSHOOT = 25

describe( 'ProgressTracker', () => {

  test( 'emits unthrottled phase boundaries and throttled updates', () => {

    const events: ProgressEvent[] = []

    // Interval of 0 → every update emits (deterministic in tests).
    const tracker = new ProgressTracker( ( event ) => events.push( event ), 0 )

    tracker.beginPhase( 'dataParse', 'bytes', TOTAL_BYTES )
    tracker.update( QUARTER )
    tracker.update( HALF )
    tracker.endPhase( TOTAL_BYTES )

    expect( events.length ).toBe( 4 )
    expect( events[ 0 ] ).toMatchObject(
        { phase: 'dataParse', completed: 0, total: TOTAL_BYTES, unit: 'bytes' } )
    expect( events[ 1 ].completed ).toBe( QUARTER )
    expect( events[ 2 ].completed ).toBe( HALF )
    expect( events[ 3 ].completed ).toBe( TOTAL_BYTES )
    expect( events.every( ( event ) => event.elapsedMs >= 0 ) ).toBe( true )
  } )

  test( 'throttles updates inside the minimum interval', () => {

    const events: ProgressEvent[] = []

    const tracker = new ProgressTracker( ( event ) => events.push( event ), ONE_HOUR_MS )

    tracker.beginPhase( 'geometry', 'products', TOTAL_PRODUCTS )

    for ( let where = 1; where <= UPDATE_COUNT; ++where ) {
      tracker.update( where )
    }

    tracker.endPhase()

    // begin + end only — all interior updates land inside the interval.
    expect( events.length ).toBe( 2 )
    expect( events[ 1 ].completed ).toBe( TOTAL_PRODUCTS )
  } )

  test( 'clamps completed to total and honors setPhaseTotal', () => {

    const events: ProgressEvent[] = []

    const tracker = new ProgressTracker( ( event ) => events.push( event ), 0 )

    tracker.beginPhase( 'geometry', 'products' )

    expect( events[ 0 ].total ).toBeUndefined()

    tracker.setPhaseTotal( SMALL_TOTAL )
    tracker.update( OVERSHOOT )

    expect( events[ 1 ].total ).toBe( SMALL_TOTAL )
    expect( events[ 1 ].completed ).toBe( SMALL_TOTAL )
  } )

  test( 'ignores updates outside any phase', () => {

    const events: ProgressEvent[] = []

    const tracker = new ProgressTracker( ( event ) => events.push( event ), 0 )

    tracker.update( 5 )

    expect( events.length ).toBe( 0 )
  } )
} )

describe( 'yieldToEventLoop', () => {

  test( 'does not starve queued timers', async () => {

    // The yield posts an ordinary task (scheduler.yield / MessageChannel —
    // deliberately NOT a timer, so background tabs' >=1s setTimeout clamp
    // cannot collapse a cooperative parse). Message tasks can be serviced
    // ahead of the timer queue, so a due timer is not guaranteed to run
    // within ONE yield — the contract is that repeated yielding lets due
    // timers fire promptly (stall watchdogs stay live during a parse).
    let timerRan = false

    setTimeout( () => {
      timerRan = true
    }, 0 )

    const MAX_YIELDS = 50

    for ( let where = 0; where < MAX_YIELDS && !timerRan; ++where ) {
      await yieldToEventLoop()
    }

    expect( timerRan ).toBe( true )
  } )
} )
