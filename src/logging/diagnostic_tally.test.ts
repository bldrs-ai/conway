import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'

import Logger, { LogLevel } from './logger'
import DiagnosticTally from './diagnostic_tally'


describe( 'DiagnosticTally', () => {

  let tally: DiagnosticTally

  beforeEach( () => {
    Logger.clearLogs()
    Logger.setLogLevel( LogLevel.WARNING )
    // DiagnosticTally is a LoggingProxy, unaffected by the echo threshold or
    // sink — but silence the console echo anyway to keep test output clean.
    Logger.setSink( () => {} )
    tally = new DiagnosticTally()
    Logger.addProxy( tally )
  } )

  afterEach( () => {
    Logger.removeProxy( tally )
    Logger.clearLogs()
    Logger.setLogLevel( LogLevel.INFO )
    Logger.setSink()
  } )

  // The regression this pins: conway#590. A counter built off Logger's
  // console sink sees only a message's first occurrence and so reports
  // every repeat count as 1x — DiagnosticTally must report the real count
  // instead, the way scripts/debug/model_report.mjs's diagnostics section
  // needs to.
  test( 'counts every occurrence of a repeated message, not just the first', () => {

    Logger.warning( 'face contributed no geometry', 1 )
    Logger.warning( 'face contributed no geometry', 2 )
    Logger.warning( 'face contributed no geometry', 3 )
    Logger.error( 'outer bound is collinear', 10 )

    const counts = new Map( tally.entries() )

    expect( counts.get( 'warning: face contributed no geometry' ) ).toBe( 3 )
    expect( counts.get( 'error: outer bound is collinear' ) ).toBe( 1 )
  } )

  test( 'ignores info/debug levels', () => {

    Logger.setLogLevel( LogLevel.DEBUG )
    Logger.info( 'informational' )
    Logger.debug( 'debug line' )

    expect( tally.entries().length ).toBe( 0 )
  } )

  test( 'truncates and single-lines the key the same way model_report.mjs did', () => {

    const keyMessageLength = 120
    const overflow = 80
    const long = 'x'.repeat( keyMessageLength + overflow )

    Logger.warning( `${long}\nsecond line` )

    const [[key]] = tally.entries()

    expect( key ).toBe( `warning: ${'x'.repeat( keyMessageLength )}` )
  } )

  // Two FULL messages that only differ after the truncation point are two
  // distinct Logger entries (Logger dedups on the untruncated message) that
  // collide onto one report key by construction — the key is a deliberate
  // truncation, so this collision is intended. What must not happen is one
  // colliding entry's callback overwriting the other's occurrences: summing
  // their independent counts (3 + 2) must read 5, not whichever of the two
  // was reported to this proxy most recently.
  test( 'sums colliding entries that share a truncated key but differ after it', () => {

    const keyMessageLength = 120
    const prefix = 'x'.repeat( keyMessageLength )
    const messageA = `${prefix} - variant A`
    const messageB = `${prefix} - variant B`

    Logger.warning( messageA, 1 )
    Logger.warning( messageA, 2 )
    Logger.warning( messageA, 3 )
    Logger.warning( messageB, 4 )
    Logger.warning( messageB, 5 )

    const counts = new Map( tally.entries() )

    expect( counts.get( `warning: ${prefix}` ) ).toBe( 5 )
  } )
} )
