import {describe, expect, test} from '@jest/globals'

import {
  LoadLogAccumulator,
  formatBar,
  formatDemandPrepLine,
  formatMb,
  formatModelLine,
  formatPreviewLine,
  formatSeconds,
  stageLabel,
} from './progress_log'


const HALF_PERCENT = 56
const HALF_DOTS = 9
const SAMPLE_MS = 3210
const SAMPLE_MB = 210
const LOAD_END_MS = 16_600
const LOAD_END_MB = 720

describe( 'formatBar', () => {

  test( 'grows dots with percent and completes at 100', () => {
    expect( formatBar( 0 ) ).toBe( '[0%0%]' )
    expect( formatBar( HALF_PERCENT ) ).toBe( `[0%${'.'.repeat( HALF_DOTS )}56%]` )
  } )

  test( 'renders indeterminate without a percent', () => {
    expect( formatBar( void 0 ) ).toBe( '[...]' )
  } )
} )

describe( 'formatSeconds / formatMb', () => {

  test( 'seconds render to millisecond precision', () => {
    expect( formatSeconds( SAMPLE_MS ) ).toBe( '3.210s' )
  } )

  test( 'memory renders to byte precision', () => {
    expect( formatMb( SAMPLE_MB ) ).toBe( '210.000000' )
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
  } )
} )

describe( 'stageLabel', () => {

  test( 'merges header and data parse into Parsing; title-cases unknowns', () => {
    expect( stageLabel( 'headerParse' ) ).toBe( 'Parsing' )
    expect( stageLabel( 'dataParse' ) ).toBe( 'Parsing' )
    expect( stageLabel( 'geometry' ) ).toBe( 'Geometry' )
    expect( stageLabel( 'somethingElse' ) ).toBe( 'SomethingElse' )
  } )
} )

describe( 'LoadLogAccumulator', () => {

  test( 'a completed stage drops its bar and owns the gap until the next begins', () => {

    const log = new LoadLogAccumulator()

    log.setModelInfo( { fileName: 'index.ifc', schema: 'IFC4' } )

    // Parsing hits 100% at 3200ms, but the real work runs on to the
    // geometry transition at 3300ms / 712 MB — the closing stage owns it.
    log.onProgress( { phase: 'dataParse', completed: 0, total: 100, elapsedMs: 0, memoryMb: 500 } )
    log.onProgress(
        { phase: 'dataParse', completed: 100, total: 100, elapsedMs: 3200, memoryMb: 710 } )

    const closed = log.onProgress(
        { phase: 'geometry', completed: 0, total: 200, elapsedMs: 3300, memoryMb: 712 } )

    // Completed (reached 100%): colon format, no bar, extended to 3300ms.
    expect( closed ).toBe( 'Parsing: 3.300s, +212.000000 MB heap' )
  } )

  test( 'a stage frozen below 100% keeps its bar (failure reach)', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( { phase: 'geometry', completed: 0, total: 200, elapsedMs: 0, memoryMb: 712 } )
    log.onProgress(
        { phase: 'geometry', completed: 112, total: 200, elapsedMs: 41_000, memoryMb: 1100 } )

    // Live line always shows the bar.
    expect( log.currentLine() ).toBe(
        `Geometry [0%${'.'.repeat( HALF_DOTS )}56%] 41.000s, +388.000000 MB heap` )

    // Frozen at 56% (never reached 100%) → keep the bar.
    log.closeCurrentStage()

    expect( log.finishedLines()[ 0 ] ).toBe(
        `Geometry [0%${'.'.repeat( HALF_DOTS )}56%] 41.000s, +388.000000 MB heap` )
  } )

  test( 'closeCurrentStage extends the final stage to the load-end point', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( { phase: 'geometry', completed: 0, elapsedMs: 100, memoryMb: 500 } )
    // Indeterminate stage, load finishes at 16600ms / 720 MB.
    log.closeCurrentStage( LOAD_END_MS, LOAD_END_MB )

    expect( log.finishedLines()[ 0 ] ).toBe( 'Geometry: 16.500s, +220.000000 MB heap' )
    expect( log.totalLine() ).toBe( 'Total: 16.500s, 500.000000 → 720.000000 MB heap' )
  } )

  test( 'appends window residency on the Geometry line when provided', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( {
      phase: 'geometry',
      completed: 0,
      total: 10,
      elapsedMs: 0,
      memoryMb: 100,
      residentSourceMb: 64,
    } )
    log.onProgress( {
      phase: 'geometry',
      completed: 10,
      total: 10,
      elapsedMs: 1000,
      memoryMb: 120,
      residentSourceMb: 64,
    } )
    log.closeCurrentStage()

    expect( log.finishedLines()[ 0 ] ).toBe(
        'Geometry: 1.000s, +20.000000 MB heap, window=64.000000 MB' )
  } )

  test( 'handles indeterminate stages and missing memory', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( { phase: 'geometry', completed: 0, elapsedMs: 0 } )
    log.onProgress( { phase: 'geometry', completed: 0, elapsedMs: 12_400 } )

    expect( log.currentLine() ).toBe( 'Geometry [...] 12.400s' )

    log.closeCurrentStage()

    // Indeterminate + complete → colon, no bar, no heap.
    expect( log.finishedLines()[ 0 ] ).toBe( 'Geometry: 12.400s' )
    expect( log.totalLine() ).toBe( 'Total: 12.400s' )
  } )
} )

describe( 'formatPreviewLine', () => {

  test( 'reports time-to-first-pixel and the deferral split', () => {

    expect( formatPreviewLine( {
      firstMeshMs: 275,
      meshes: 1750,
      emitted: 539,
      deferred: 12,
      deferredOnPlacement: 11,
      retried: 8,
    } ) ).toBe(
        'Preview: first mesh 0.275s, 1750 meshes from 539 units, ' +
        '12 deferred (11 on placements), 8 retried' )
  } )

  test( 'separates meshes delivered from units extracted', () => {

    // Codex round 2 on #543. `emitted` counts units extraction ACCEPTED,
    // and a unit that extracts cleanly can still place nothing: an IfcSite
    // or IfcBuildingStorey has no Representation, so
    // extractProductGeometry returns early while
    // extractProductGeometryByLocalID still answers true. Folded into one
    // number, the line contradicted itself -- "no mesh, 20 emitted" -- so
    // meshes and units are reported separately and the mesh count is what
    // firstMeshMs is consistent with.
    expect( formatPreviewLine( {
      meshes: 0,
      emitted: 20,
      deferred: 0,
      deferredOnPlacement: 0,
      retried: 0,
    } ) ).toBe(
        'Preview: no mesh, 0 meshes from 20 units, ' +
        '0 deferred (0 on placements), 0 retried' )
  } )

  test( 'says so when the preview never emitted a mesh', () => {

    // The load this line exists for: 532 attempts, one mesh's worth of
    // nothing, and a deferral ratio of 1.0 on placements is what names the
    // cause as file layout rather than "the preview is slow" (conway#542).
    expect( formatPreviewLine( {
      meshes: 0,
      emitted: 0,
      deferred: 532,
      deferredOnPlacement: 531,
      retried: 0,
    } ) ).toBe(
        'Preview: no mesh, 0 meshes from 0 units, ' +
        '532 deferred (531 on placements), 0 retried' )
  } )
} )

describe( 'formatDemandPrepLine', () => {

  test( 'a sharded build shows the key pass and how much of the walk it kept',
      () => {

        // The line conway#682 exists to produce, on D3D-shaped numbers: the
        // shard walked every one of the model's products and kept a
        // quarter of them, so `candidates` is work all four workers did in
        // full and `keys` is work the unsharded reference never did at all.
        expect( formatDemandPrepLine( {
          totalMs: 685,
          candidatesMs: 412,
          keysMs: 264,
          candidateProducts: 46166,
          candidateAggregates: 812,
          keptProducts: 11542,
          keptAggregates: 203,
          shardIndex: 1,
          shardCount: 4,
          windowed: false,
        } ) ).toBe(
            'Prep: worklists 0.685s (candidates 0.412s, keys 0.264s), ' +
            'shard 1/4 kept 11542 of 46166 products, 203 of 812 aggregates' )
      } )

  test( 'an unsharded build reports no key pass at all, rather than zero',
      () => {

        // `ensureDemandWorklists_` returns at its `shard_ === void 0` guard
        // before computing a single dispatch key, so an unsharded load's key
        // time is ABSENT, not zero. Printing "keys 0.000s" would read as a
        // free pass rather than one that never ran -- and the whole point of
        // the split is that the unsharded reference cannot be the
        // denominator for work it does not perform (ledger 11.4).
        expect( formatDemandPrepLine( {
          totalMs: 412,
          candidatesMs: 410,
          candidateProducts: 46166,
          candidateAggregates: 812,
          keptProducts: 46166,
          keptAggregates: 812,
          windowed: false,
        } ) ).toBe(
            'Prep: worklists 0.412s (candidates 0.410s), ' +
            '46166 products, 812 aggregates' )
      } )

  test( 'a windowed build says its wall time contains paging', () => {

    // The async builder awaits `ensureAggregateTargetLocalIDs` and
    // `computeDispatchKeys`, both of which page. Without the marker the
    // number reads as compute and would be compared against a resident
    // worker's, which is a different quantity.
    expect( formatDemandPrepLine( {
      totalMs: 1900,
      candidatesMs: 1100,
      keysMs: 700,
      candidateProducts: 24,
      candidateAggregates: 2,
      keptProducts: 11,
      keptAggregates: 1,
      shardIndex: 0,
      shardCount: 2,
      windowed: true,
    } ) ).toBe(
        'Prep: worklists 1.900s (candidates 1.100s, keys 0.700s), ' +
        'shard 0/2 kept 11 of 24 products, 1 of 2 aggregates, windowed' )
  } )
} )

describe( 'LoadLogAccumulator preview line', () => {

  test( 'renders between the stage lines and Total, and only when set', () => {

    const log = new LoadLogAccumulator()

    log.onProgress( { phase: 'dataParse', completed: 0, elapsedMs: 0 } )
    log.onProgress( { phase: 'dataParse', completed: 1, total: 1, elapsedMs: 1000 } )
    log.closeCurrentStage()

    expect( log.allLines() ).toEqual( [
      'Parsing: 1.000s',
      'Total: 1.000s',
    ] )

    log.setPreviewStats( {
      firstMeshMs: 275,
      meshes: 6,
      emitted: 4,
      deferred: 0,
      deferredOnPlacement: 0,
      retried: 0,
    } )

    // The preview runs INSIDE Parsing, so it is not a stage — feeding it
    // through onProgress would close Parsing and reopen it, splitting one
    // parse across two lines.
    expect( log.allLines() ).toEqual( [
      'Parsing: 1.000s',
      'Preview: first mesh 0.275s, 6 meshes from 4 units, ' +
      '0 deferred (0 on placements), 0 retried',
      'Total: 1.000s',
    ] )

    expect( log.finishedLines() ).toEqual( [ 'Parsing: 1.000s' ] )
  } )
} )
