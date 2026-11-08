/* eslint-disable no-magic-numbers */
import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { ConwayGeometry } from '../../../dependencies/conway-geom'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import {
  PreviewPrefixGeneration,
  PreviewSchemaAdapter,
  StreamedPreviewChannel,
} from './streamed_preview_channel'


/**
 * The share-of-parse bound (PREVIEW_PARSE_SHARE, conway#775 stage 1).
 *
 * Time is Date.now, stubbed, so "a build costs 40 ms" and "the parse has run
 * for 1 s" are facts of the test rather than races on a loaded runner. A
 * build's cost is charged by advancing the clock inside buildGeneration,
 * where the channel times it.
 */
describe( 'preview channel: all of its work is bounded at a share of the parse', () => {

  let conwayGeometry: ConwayGeometry
  let now = 0

  beforeAll( async () => {
    conwayGeometry = new ConwayGeometry()
    expect( await conwayGeometry.initialize() ).toBe( true )
  }, 120000 )

  afterEach( () => {
    jest.restoreAllMocks()
  } )

  /**
   * A sink with a settable record count.
   *
   * @param records The count.
   * @return {ColumnarIndexSink} The sink.
   */
  const makeSink = ( records: { count: number } ) => ( {
    get topLevelCount() {
      return records.count
    },
    snapshot: () => ( {} ),
  } as unknown as ColumnarIndexSink< number > )

  /**
   * A generation of `units` units that run instantly and capture nothing.
   *
   * @param units Unit count.
   * @param runs Ordinals run, appended.
   * @return {PreviewPrefixGeneration} The generation.
   */
  const makeGeneration = ( units: number, runs: number[] ): PreviewPrefixGeneration => ( {
    scene: { *walk() { /* no instances */ } },
    unitCount: units,
    linearScalingFactor: 1,
    runUnits: ( from: number ) => {
      runs.push( from )
      return 0
    },
    // Every unit defers on a placement, so each generation is evidence that a
    // longer index would help and the growth gate preempts it.
    takeDeferrals: () => [],
    geometryExpressID: () => void 0,
    recenter: true,
    dispose: () => { /* nothing native */ },
  } )

  /**
   * A channel whose builds cost `fixedMs + perRecordMs × records` of clock,
   * the shape real builds have: mostly fixed while the prefix is small.
   *
   * @param records The live record count.
   * @param builds Record counts at each build, appended.
   * @param fixedMs Charged by every build.
   * @param perRecordMs Charged per record by each build.
   * @param runs Ordinals run, appended.
   * @return {StreamedPreviewChannel} The channel, share 0.2.
   */
  const makeChannel = (
      records: { count: number },
      builds: number[],
      fixedMs: number,
      perRecordMs: number,
      runs: number[] ) => {

    const adapter: PreviewSchemaAdapter = {
      buildGeneration: () => {
        builds.push( records.count )
        now += fixedMs + perRecordMs * records.count
        // A new generation always lists more units, so the channel wants it.
        return makeGeneration( records.count, runs )
      },
    }

    jest.spyOn( Date, 'now' ).mockImplementation( () => now )

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( records ), adapter,
        false, () => { /* no payloads */ }, void 0, void 0, 1 )

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const internals = channel as any
    /* eslint-enable @typescript-eslint/no-explicit-any */

    internals.parseShare_ = 0.2
    internals.tickIntervalMs_ = 0

    return { channel, internals }
  }

  test( 'a build the share cannot afford waits until the parse has run long enough', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []

    // 60 ms + 0.01 ms per record: 70 ms for the first build, 80 ms at 2000.
    const { channel, internals } = makeChannel( records, builds, 60, 0.01, runs )

    // Exhaust the first generation so a rebuild is due on growth alone.
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000 ] )
    internals.unitOrdinal_ = 1000

    // 100 ms into the parse: the floor (100 ms) less the 70 ms spent leaves
    // 30 ms, and the next build is predicted at 70 ms (one build so far, so
    // the prediction is that build's cost). It waits.
    records.count = 2000
    now = 1100
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000 ] )

    // 1 s in, the share allows 200 ms: 130 ms left, so it runs.
    now = 2000
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000, 2000 ] )

    // Both builds are on the channel's account.
    expect( channel.previewYield.channelMs ).toBe( 70 + 80 )

    channel.stop()
  }, 240000 )

  test( 'with the share lifted the same build runs at once', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel, internals } = makeChannel( records, builds, 60, 0.01, runs )

    internals.parseShare_ = Infinity

    channel.maybeTickInline()
    internals.unitOrdinal_ = 1000
    records.count = 2000
    now = 1100
    channel.maybeTickInline()

    // The control for the test above: the only thing that held that build
    // back was the share.
    expect( builds ).toEqual( [ 1000, 2000 ] )

    channel.stop()
  }, 240000 )

  test( 'once the share is spent a tick runs no unit, but the one after a build', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel, internals } = makeChannel( records, builds, 0, 0, runs )

    internals.tickBudgetMs_ = Number.MAX_SAFE_INTEGER

    // Spent: the floor is 100 ms, and the channel has had it.
    internals.spentMs_ = 100

    // The first build is always allowed, and the generation it built runs
    // one unit (see the next test) — and only one.
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000 ] )
    expect( runs ).toEqual( [ 0 ] )

    // No build this tick, and nothing left of the share: nothing runs.
    channel.maybeTickInline()
    expect( runs ).toEqual( [ 0 ] )

    // 10 s in, the share allows 2 s and the tick runs.
    now = 11000
    channel.maybeTickInline()
    expect( runs.length ).toBeGreaterThan( 1 )

    channel.stop()
  }, 240000 )

  // codex on conway#777: the floor is meant to keep the first preview where
  // it was, but a first build that costs more than the floor used up the
  // tick's deadline before any unit could run, and with the build charged,
  // a short parse's flush got a negative share and ran nothing either. A
  // windowed first build pays residency and prep, so 300 ms is not exotic.
  test( 'a first build slower than the floor still runs its first unit, in the flush', async () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel } = makeChannel( records, builds, 300, 0, runs )

    // A one-second parse whose index only reached the first generation's
    // size at the end: the flush builds it, for 300 ms against the 200 ms
    // the share allows.
    now = 2000
    await channel.flushAsync()
    expect( builds ).toEqual( [ 1000 ] )
    expect( runs ).toEqual( [ 0 ] )

    channel.stop()
  }, 240000 )

  test( 'a first build slower than the floor still runs its first unit, in a parse-time tick', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel } = makeChannel( records, builds, 300, 0, runs )

    now = 1050
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000 ] )
    expect( runs ).toEqual( [ 0 ] )

    channel.stop()
  }, 240000 )

  // codex on conway#777: fitted through two samples, one slow build gives the
  // predictor a slope that prices every later build out of the share, and
  // only a build replaces a sample, so the channel never builds again and
  // its retry queue is stranded.
  test( 'one slow build does not price every later build out of the share', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const costs = [ 10, 1000, 40 ]

    const adapter: PreviewSchemaAdapter = {
      buildGeneration: () => {
        builds.push( records.count )
        now += costs[ builds.length - 1 ]
        return makeGeneration( records.count, runs )
      },
    }

    jest.spyOn( Date, 'now' ).mockImplementation( () => now )

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( records ), adapter,
        false, () => { /* no payloads */ }, void 0, void 0, 1 )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    internals.tickIntervalMs_ = 0
    internals.tickMaxAttempts_ = 1

    // 10 ms at 1k records, then a transiently slow 1,000 ms at 2k, both let
    // through with the share lifted.
    internals.parseShare_ = Infinity
    channel.maybeTickInline()
    internals.unitOrdinal_ = 1000
    records.count = 2000
    channel.maybeTickInline()
    internals.unitOrdinal_ = 2000
    expect( builds ).toEqual( [ 1000, 2000 ] )

    // The fit through those two is 1,000 + 0.99 per record: 2,980 ms at 4k,
    // which no share of a few seconds' parse covers.
    expect( internals.predictBuildMs_( 4000 ) ).toBeCloseTo( 2980, 6 )

    // Back on the share, with 100 ms of it left: the fit refuses, the probe
    // prices the build at the cheaper observed rate (0.01 ms per record,
    // 40 ms), and it runs.
    internals.parseShare_ = 0.2
    records.count = 4000
    now = internals.startedMs_ + ( ( internals.spentMs_ + 100 ) / 0.2 )
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000, 2000, 4000 ] )

    // Its 40 ms is a sample now, and the fit through 1,000 ms at 2k and
    // 40 ms at 4k is flat (a cheaper second build is no discount): 40 ms at
    // 8k, which the fit lets through on its own and which comes in at its
    // prediction, re-arming the probe.
    costs.push( 40 )
    internals.unitOrdinal_ = 4000
    records.count = 8000
    now = internals.startedMs_ + ( ( internals.spentMs_ + 50 ) / 0.2 )
    // The cadence backs off after a productive tick; this test is about the
    // share, so take the cadence out of it.
    internals.lastInlineTick_ = 0
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000, 2000, 4000, 8000 ] )
    expect( internals.probeArmed_ ).toBe( true )

    channel.stop()
  }, 240000 )

  // codex on conway#777, round 2: a standing "cheapest observed rate" floor
  // under the prediction underprices every build when cost grows faster than
  // the records do. At k·r², samples at r/2 and r price 2r at k·r² against
  // an actual 4k·r², at every doubling, so the channel overshoots its share
  // by three quarters of a build each time. The fit alone underprices too,
  // but by less (2.5k·r² for 4k·r²), and the probe may add one cheap-rate
  // build per stretch of mispredicting fit, which here is the whole parse.
  test( 'builds that cost k·r² overshoot the share by more than half a build at most once', () => {

    now = 1000
    const records = { count: 0 }
    const builds: number[] = []
    const runs: number[] = []
    const k = 1e-7
    const costs: number[] = []

    const adapter: PreviewSchemaAdapter = {
      buildGeneration: () => {
        builds.push( records.count )
        const ms = k * records.count * records.count
        costs.push( ms )
        now += ms
        return makeGeneration( records.count, runs )
      },
    }

    jest.spyOn( Date, 'now' ).mockImplementation( () => now )

    const channel = new StreamedPreviewChannel(
        new Uint8Array( 0 ), conwayGeometry, makeSink( records ), adapter,
        false, () => { /* no payloads */ }, void 0, void 0, 1 )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = channel as any

    internals.tickIntervalMs_ = 0
    internals.tickMaxAttempts_ = 1
    internals.parseShare_ = 0.2

    const startedMs = internals.startedMs_
    const overshoots: number[] = []

    // Each step doubles the index and exhausts the generation, so a rebuild
    // is due and only the share decides when it runs. Time then advances a
    // millisecond at a time until it does, i.e. the build starts the moment
    // the estimator says it fits; how far past the share its actual cost
    // lands is the estimator's error.
    records.count = 1000
    channel.maybeTickInline()

    for ( let step = 1; step <= 10; ++step ) {
      records.count = 1000 * ( 2 ** step )
      internals.unitOrdinal_ = Number.MAX_SAFE_INTEGER
      const before = builds.length

      for ( let wait = 0; builds.length === before && wait < 10000000; ++wait ) {
        now += 1
        internals.lastInlineTick_ = 0
        channel.maybeTickInline()
      }

      expect( builds.length ).toBe( before + 1 )
      const allowed = Math.max( 100, 0.2 * ( now - startedMs ) )
      overshoots.push( ( internals.spentMs_ - allowed ) / costs[ costs.length - 1 ] )
    }

    // Measured here: a standing cheap-rate floor admits every doubling at a
    // quarter of its cost and lands 0.55 of a build past the share each time
    // (the share accrues a little during the build itself); the fit lands
    // 0.17 past it, and the probe adds one 0.55, once.
    expect( overshoots.filter( ( o ) => o > 0.5 ).length ).toBeLessThanOrEqual( 1 )

    channel.stop()
  }, 240000 )

  // What PSB showed in Share's worker path. The first build is small
  // (~1k records) and costs mostly its fixed part; by the time its units run
  // out the parse has indexed a large share of the file. Priced per record
  // off that first build, the next one looked like it would cost more than
  // the whole parse and never ran: the bounded preview stopped at 137 meshes.
  test( 'a small first build does not price a large index out of the share', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []

    // 15 ms, all fixed, like a first prefix generation.
    const { channel, internals } = makeChannel( records, builds, 15, 0, runs )

    // The clock is frozen inside a tick, so bound the tick by attempts.
    internals.tickMaxAttempts_ = 1

    channel.maybeTickInline()
    internals.unitOrdinal_ = 1000

    // 2 s in, a million records indexed. The share allows 400 ms; the last
    // build's 15 ms, times a thousand times the records, would be 15 s.
    records.count = 1000000
    now = 3000
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000, 1000000 ] )

    channel.stop()
  }, 240000 )

  test( 'two builds fit a fixed cost and a cost per record', () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel, internals } = makeChannel( records, builds, 60, 0.01, runs )

    internals.parseShare_ = Infinity

    channel.maybeTickInline()
    internals.unitOrdinal_ = 1000
    records.count = 2000
    channel.maybeTickInline()
    expect( builds ).toEqual( [ 1000, 2000 ] )

    // 70 ms at 1000 records, 80 ms at 2000: 60 ms fixed and 0.01 ms per
    // record, so 10,060 ms at a million.
    expect( internals.predictBuildMs_( 1000000 ) ).toBeCloseTo( 10060, 6 )

    channel.stop()
  }, 240000 )

  // Share#2087 / conway#777: bounded by the share too, the parse-end flush of
  // a short parse that had spent its floor ran nothing, and Momentum.ifc
  // showed 7–9 preview meshes at the index instead of the store channel's 73.
  test( 'a short parse that spent its floor still flushes for the flush budget', async () => {

    now = 1000
    const records = { count: 1000 }
    const builds: number[] = []
    const runs: number[] = []
    const { channel, internals } = makeChannel( records, builds, 0, 0, runs )

    // A unit costs 10 ms, so the flush's 100 ms clock runs ten of them.
    const generation = makeGeneration( 1000, runs )
    const runUnits = generation.runUnits
    generation.runUnits = ( from: number, count: number ) => {
      now += 10
      return runUnits( from, count )
    }
    internals.adapter.buildGeneration = () => {
      builds.push( records.count )
      return generation
    }

    // The parse-time tick builds, runs its one unit, and the floor is spent.
    internals.tickMaxAttempts_ = 1
    await channel.maybeTickAsync()
    expect( builds ).toEqual( [ 1000 ] )
    internals.spentMs_ = 100

    // 300 ms in, the share allows 100 ms, all spent: a parse-time tick runs
    // nothing,
    now = 1300
    internals.lastInlineTick_ = 0
    const before = runs.length
    await channel.maybeTickAsync()
    expect( runs.length ).toBe( before )

    // but the flush, after the parse, runs for its own clock.
    await channel.flushAsync()
    expect( runs.length - before ).toBe( 10 )
    expect( builds ).toEqual( [ 1000 ] )

    channel.stop()
  }, 240000 )
} )
