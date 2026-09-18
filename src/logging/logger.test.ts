import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'

import Logger, { DATA_DEFECT, LogLevel, LogLevelName } from './logger'


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

  // The whole point of the parameter: an ID written into the message text
  // makes every occurrence its own entry, and `count` then reports 1 for a
  // problem that hit hundreds of records. One AP242 model in the regression
  // corpus produced 272 such rows before this.
  test( 'the expressID argument dedupes where interpolating the ID does not', () => {

    // Deliberately mixed: the parameter takes an express ID as a number and a
    // local ID as an already-formatted string, and both must key the same way.
    const numericRecord = 11
    const records: Array< number | string > = [ numericRecord, '22', '33' ]

    for ( const record of records ) {
      Logger.error( 'boom', record )
    }

    const entries = Logger.getErrors()

    expect( entries.length ).toBe( 1 )
    expect( entries[ 0 ].count ).toBe( records.length )
    expect( entries[ 0 ].expressIDs ).toEqual(
      new Set( records.map( ( record ) => `${record}` ) ) )

    // ...and the ID never reaches the buffered message, so the CSV cell is the
    // family rather than one instance of it.
    expect( entries[ 0 ].message ).toBe( 'boom' )

    // The console echo still carries it, though. Only the buffer needs the ID
    // out of the way, and a console line read once by a person should not lose
    // its only pointer to the record.
    expect( echoed ).toEqual( [ [ 'error', `boom expressID: ${numericRecord}` ] ] )
  } )

  test( 'the argument wins over an in-message expressID suffix', () => {

    Logger.error( 'clash expressID: 1', 2 )

    const entries = Logger.getErrors()

    expect( entries[ 0 ].message ).toBe( 'clash' )
    expect( entries[ 0 ].expressIDs ).toEqual( new Set( [ '2' ] ) )
  } )

  test( 'a data-defect category rides on the entry, not in the message ' +
    '(conway#708)', () => {

    // The marker Share#1863 reads. It has to survive dedup and stay off the
    // message, because the message is what Logger dedups on — a marker
    // spelled into the text would be inside the key that a future rewording
    // changes.
    Logger.error( 'skipped something', 1, DATA_DEFECT )
    Logger.error( 'skipped something', 2, DATA_DEFECT )
    Logger.error( 'unrelated failure' )

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].message ).toBe( 'skipped something' )
    expect( defects[ 0 ].count ).toBe( 2 )
    expect( defects[ 0 ].expressIDs ).toEqual( new Set( [ '1', '2' ] ) )
    expect( defects[ 0 ].level ).toBe( 'error' )

    // The uncategorised entry is still an error, and still nothing to do
    // with data quality — the split is the point of the field.
    expect( Logger.getErrors().length ).toBe( 2 )
  } )

  test( 'the same message logged uncategorised then categorised stays two ' +
    'entries', () => {

    // `error`/`warning` are public and take the category as an optional
    // argument, so one message reaching them both ways is a state a caller
    // can produce. Folding the two together would let this later call
    // RETROACTIVELY mark the engine error above as the file's fault, and
    // add its occurrence to the defect's count — and Share#1863 triages on
    // exactly that marker (codex round 1 on conway#708).
    Logger.error( 'same text', 1 )
    Logger.error( 'same text', 2, DATA_DEFECT )

    const entries = Logger.getErrors()

    expect( entries.length ).toBe( 2 )
    expect( entries.map( ( entry ) => entry.count ) ).toEqual( [ 1, 1 ] )
    expect( entries.map( ( entry ) => entry.category ) ).toEqual( [ void 0, DATA_DEFECT ] )

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].count ).toBe( 1 )
    expect( defects[ 0 ].expressIDs ).toEqual( new Set( [ '2' ] ) )
  } )

  test( 'and stays two entries in the other order, with no marker leaking ' +
    'backwards', () => {

    // The mirror. This ordering is the one that used to look correct —
    // both occurrences ended up categorised — which is why it needs its own
    // test rather than being assumed symmetric.
    Logger.error( 'same text', 1, DATA_DEFECT )
    Logger.error( 'same text', 2 )

    const entries = Logger.getErrors()

    expect( entries.length ).toBe( 2 )
    expect( entries.map( ( entry ) => entry.count ) ).toEqual( [ 1, 1 ] )
    expect( entries.map( ( entry ) => entry.category ) ).toEqual( [ DATA_DEFECT, void 0 ] )

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].count ).toBe( 1 )
    expect( defects[ 0 ].expressIDs ).toEqual( new Set( [ '1' ] ) )
  } )

  test( 'same message, same category still dedups to one counted entry', () => {

    // The behaviour every path fixture in this change rests on: one defect
    // family is one entry whose `count` sizes it. Widening the dedup
    // identity must not cost this.
    Logger.error( 'skipped something', 1, DATA_DEFECT )
    Logger.error( 'skipped something', 2, DATA_DEFECT )
    Logger.error( 'skipped something', 3, DATA_DEFECT )

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].count ).toBe( 3 )
    expect( defects[ 0 ].expressIDs ).toEqual( new Set( [ '1', '2', '3' ] ) )
  } )

  test( 'a data defect keeps whatever level its call site chose', () => {

    // Severity is Share's call (Share#1815), so conway does not move these
    // entries to one level — which also keeps the regression corpus's
    // errors.csv where it was.
    Logger.warning( 'skipped quietly', 7, DATA_DEFECT )

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].level ).toBe( 'warning' )
    expect( Logger.getErrors() ).toEqual( [] )
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
