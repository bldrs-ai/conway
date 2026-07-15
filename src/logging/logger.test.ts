import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'

import Logger, { LogLevel, LogLevelName } from './logger'


type Echoed = [LogLevelName, string]

describe( 'Logger levels + sink', () => {

  let echoed: Echoed[] = []

  beforeEach( () => {
    echoed = []
    Logger.clearLogs()
    Logger.setSink( ( level, message ) => echoed.push( [level, message] ) )
    Logger.setLogLevel( LogLevel.INFO )
  } )

  afterEach( () => {
    Logger.clearLogs()
    Logger.setSink()
    Logger.setLogLevel( LogLevel.INFO )
  } )

  test( 'echoes at or above the threshold only', () => {

    Logger.setLogLevel( LogLevel.WARNING )

    Logger.debug( 'debug line' )
    Logger.info( 'info line' )
    Logger.warning( 'warning line' )
    Logger.error( 'error line' )

    expect( echoed ).toEqual( [
      ['warning', 'warning line'],
      ['error', 'error line'],
    ] )
  } )

  test( 'OFF silences everything, buffer still collects', () => {

    Logger.setLogLevel( LogLevel.OFF )

    Logger.error( 'not echoed' )

    expect( echoed.length ).toBe( 0 )
    expect( Logger.getLogs().length ).toBe( 1 )
  } )

  test( 'echoes the first occurrence only, dedups repeats into the buffer', () => {

    Logger.warning( 'repeated expressID: 1' )
    Logger.warning( 'repeated expressID: 2' )
    Logger.warning( 'repeated expressID: 3' )

    expect( echoed.length ).toBe( 1 )

    const entry = Logger.getLogs().find( ( log ) => log.message === 'repeated' )

    expect( entry?.count ).toBe( 3 )
    expect( entry?.expressIDs.size ).toBe( 3 )
  } )

  test( 'isLevelEnabled matches the threshold ordering', () => {

    Logger.setLogLevel( LogLevel.WARNING )

    expect( Logger.isLevelEnabled( LogLevel.DEBUG ) ).toBe( false )
    expect( Logger.isLevelEnabled( LogLevel.INFO ) ).toBe( false )
    expect( Logger.isLevelEnabled( LogLevel.WARNING ) ).toBe( true )
    expect( Logger.isLevelEnabled( LogLevel.ERROR ) ).toBe( true )
  } )

  test( 'proxies receive entries regardless of the threshold', () => {

    const proxied: string[] = []
    const proxy = { log: ( entry: { message: string } ) => proxied.push( entry.message ) }

    Logger.addProxy( proxy )

    try {
      Logger.setLogLevel( LogLevel.OFF )
      Logger.info( 'proxied line' )

      expect( proxied ).toEqual( ['proxied line'] )
    } finally {
      Logger.removeProxy( proxy )
    }
  } )
} )
