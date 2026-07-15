import {describe, expect, test} from '@jest/globals'

import {
  LoadLogAccumulator,
  formatBar,
  formatModelLine,
  formatSeconds,
  stageLabel,
} from './progress_log'


const HALF_PERCENT = 56
const FULL_PERCENT = 100
const FULL_DOTS = 16
const HALF_DOTS = 9
const SAMPLE_MS = 3210

describe( 'formatBar', () => {

  test( 'grows dots with percent and completes at 100', () => {
    expect( formatBar( 0 ) ).toBe( '[0%0%]' )
    expect( formatBar( HALF_PERCENT ) ).toBe( `[0%${'.'.repeat( HALF_DOTS )}56%]` )
    expect( formatBar( FULL_PERCENT ) ).toBe( `[0%${'.'.repeat( FULL_DOTS )}100%]` )
  } )

  test( 'renders indeterminate without a percent', () => {
    expect( formatBar( void 0 ) ).toBe( '[...]' )
  } )
} )

describe( 'formatModelLine', () => {

  test( 'renders the full header info', () => {
    const line = formatModelLine( {
      fileName: 'Arty_Z7.stp',
      schema: 'AP214',
      originatingSystem: 'SolidWorks 2021',
      preprocessorVersion: 'SwSTEP 2.0',
      byteLength: 39_950_000,
    } )

    expect( line ).toBe( 'Model: Arty_Z7.stp — AP214, 38.1 MB, SolidWorks 2021 (SwSTEP 2.0)' )
  } )

  test( 'degrades gracefully with partial info', () => {
    expect( formatModelLine( {} ) ).toBe( 'Model: (unnamed)' )
    expect( formatModelLine( { fileName: 'a.ifc', schema: 'IFC4' } ) )
        .toBe( 'Model: a.ifc — IFC4' )
  } )
} )

describe( 'stageLabel', () => {

  test( 'merges header and data parse into Parsing; title-cases unknowns', () => {
    expect( stageLabel( 'headerParse' ) ).toBe( 'Parsing' )
    expect( stageLabel( 'dataParse' ) ).toBe( 'Parsing' )
    expect( stageLabel( 'geometry' ) ).toBe( 'Geometry' )
    expect( stageLabel( 'convert' ) ).toBe( 'Convert' )
    expect( stageLabel( 'somethingElse' ) ).toBe( 'SomethingElse' )
  } )
} )

describe( 'LoadLogAccumulator', () => {

  test( 'freezes stage lines with owned deltas and a separate Total', () => {

    const log = new LoadLogAccumulator()

    log.setModelInfo( { fileName: 'index.ifc', schema: 'IFC4' } )

    // Parsing: 0→3200ms, heap 500→710 MB, determinate.
    log.onProgress( { phase: 'dataParse', completed: 0, total: 100, elapsedMs: 0, memoryMb: 500 } )
    log.onProgress(
        { phase: 'dataParse', completed: 100, total: 100, elapsedMs: 3200, memoryMb: 710 } )

    // Geometry begins: closes Parsing.
    const closed = log.onProgress(
        { phase: 'geometry', completed: 0, total: 200, elapsedMs: 3300, memoryMb: 712 } )

    expect( closed ).toBe( `Parsing [0%${'.'.repeat( FULL_DOTS )}100%] 3.2s, +210 MB heap` )

    log.onProgress(
        { phase: 'geometry', completed: 112, total: 200, elapsedMs: 44_300, memoryMb: 1100 } )

    expect( log.currentLine() ).toBe( `Geometry [0%${'.'.repeat( HALF_DOTS )}56%] 41.0s, +388 MB heap` )

    log.closeCurrentStage()

    expect( log.allLines() ).toEqual( [
      'Model: index.ifc — IFC4',
      `Parsing [0%${'.'.repeat( FULL_DOTS )}100%] 3.2s, +210 MB heap`,
      `Geometry [0%${'.'.repeat( FULL_DOTS )}100%] 41.0s, +388 MB heap`,
      'Total: 44.3s, 500 → 1100 MB heap',
    ] )
  } )

  test( 'handles indeterminate stages and missing memory', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( { phase: 'geometry', completed: 0, elapsedMs: 0 } )
    log.onProgress( { phase: 'geometry', completed: 0, elapsedMs: 12_400 } )

    expect( log.currentLine() ).toBe( 'Geometry [...] 12.4s' )

    log.closeCurrentStage()

    expect( log.totalLine() ).toBe( 'Total: 12.4s' )
  } )

  test( 'formatSeconds renders one decimal', () => {
    expect( formatSeconds( SAMPLE_MS ) ).toBe( '3.2s' )
  } )
} )
