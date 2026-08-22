import { describe, expect, test } from '@jest/globals'
import {
  canSettleMemory,
  exposedGc,
  retainedMemoryMb,
  settleAndSampleMemory,
  settleAndSampleMemoryForPerf,
} from './retained_memory'


/**
 * globalThis with a writable `gc` slot.
 *
 * Cast through `unknown` deliberately: @types/node already declares `gc` as
 * its own `GCFunction` (which may return a promise), and intersecting with
 * that makes the slot unassignable from a plain `() => void` stand-in.
 */
type GlobalWithGc = { gc?: () => void }

/** One megabyte in bytes, for building samples in readable units. */
// eslint-disable-next-line no-magic-numbers
const ONE_MB = 1024 * 1024

/*
 * Sample figures, named so the arithmetic in each expectation reads as the
 * retention it stands for rather than as bare constants.
 */
const BASELINE_RSS_MB = 100
const BASELINE_HEAP_USED_MB = 20
const BASELINE_EXTERNAL_MB = 5
const GREW_RSS_MB = 150
const GREW_HEAP_USED_MB = 24
const GREW_EXTERNAL_MB = 7
const SHRANK_RSS_MB = 90
const SHRANK_HEAP_USED_MB = 18
const SHRANK_EXTERNAL_MB = 4

/**
 * Run a body with `global.gc` replaced, restoring whatever was there.
 *
 * Jest runs without `--expose-gc`, so the real hook is normally absent — the
 * substitute is what lets both branches be exercised in one suite.
 *
 * @param replacement The stand-in collector, or undefined to remove it.
 * @param body The body to run.
 * @return {Promise<void>} Resolves once the body has run and gc is restored.
 */
async function withGc(
    replacement: ( () => void ) | undefined,
    body: () => Promise<void> ): Promise<void> {

  const target = globalThis as unknown as GlobalWithGc
  const original = target.gc

  if ( replacement === void 0 ) {
    delete target.gc
  } else {
    target.gc = replacement
  }

  try {
    await body()
  } finally {
    if ( original === void 0 ) {
      delete target.gc
    } else {
      target.gc = original
    }
  }
}

describe('settleAndSampleMemory', () => {

  test('returns undefined rather than an unsettled sample without gc', async () => {
    // The whole contract of this module. Falling back to a plain
    // process.memoryUsage() here would still produce a difference, and that
    // difference would be GC timing rather than retention — SKYLARK250 reads
    // 2547 MB un-GC'd against 981 MB settled, which is larger than any leak
    // this exists to find. The caller must be able to tell "no measurement"
    // from "measured zero", so the only honest answer is undefined.
    await withGc( void 0, async () => {
      expect( exposedGc() ).toBeUndefined()
      expect( canSettleMemory() ).toBe( false )
      expect( await settleAndSampleMemory() ).toBeUndefined()
    } )
  } )

  test('collects twice with a turn of the event loop between', async () => {
    // Each part of `gc(); await setImmediate(); gc()` earns its place: two
    // collections catch objects whose freeing makes more garbage
    // unreachable, and the interleaved turn is what lets queued frees
    // actually run — notably ArrayBuffer backing-store release, without which
    // `external`, one of the three sampled quantities, reads high. Neither
    // one GC plus a turn nor two back-to-back GCs is enough.
    const events: string[] = []

    await withGc( () => {
      events.push( 'gc' )
    }, async () => {
      setImmediate( () => events.push( 'turn' ) )

      const sample = await settleAndSampleMemory()

      expect( sample ).not.toBeUndefined()
    } )

    expect( events ).toEqual( ['gc', 'turn', 'gc'] )
  } )

  test('samples all three quantities when it can settle', async () => {
    // RSS is here alongside the two JS-side figures because neither of them
    // sees the wasm heap: `heapUsed + external` reads 284 MB against an RSS
    // of 510 MB on MB-Khaya, so a retention delta built only from the JS side
    // would be blind to conway's own memory.
    await withGc( () => { /* no-op collector */ }, async () => {
      const sample = await settleAndSampleMemory()

      expect( sample ).not.toBeUndefined()
      expect( sample!.rssBytes ).toBeGreaterThan( 0 )
      expect( sample!.heapUsedBytes ).toBeGreaterThan( 0 )
      expect( sample!.externalBytes ).toBeGreaterThan( 0 )
    } )
  } )
} )

describe('retainedMemoryMb', () => {

  const baseline = {
    rssBytes: BASELINE_RSS_MB * ONE_MB,
    heapUsedBytes: BASELINE_HEAP_USED_MB * ONE_MB,
    externalBytes: BASELINE_EXTERNAL_MB * ONE_MB,
  }

  test('differences two settled samples into MB', () => {
    const retained = retainedMemoryMb( baseline, {
      rssBytes: GREW_RSS_MB * ONE_MB,
      heapUsedBytes: GREW_HEAP_USED_MB * ONE_MB,
      externalBytes: GREW_EXTERNAL_MB * ONE_MB,
    } )

    expect( retained ).toEqual( {
      rssMb: GREW_RSS_MB - BASELINE_RSS_MB,
      heapUsedMb: GREW_HEAP_USED_MB - BASELINE_HEAP_USED_MB,
      externalMb: GREW_EXTERNAL_MB - BASELINE_EXTERNAL_MB,
    } )
  } )

  test('keeps a cycle that gave memory back negative', () => {
    // Not a defensive case: the teardown releasing more than the baseline
    // held is the direction a fix moves these numbers, and clamping it at
    // zero would make an improvement indistinguishable from no change.
    const retained = retainedMemoryMb( baseline, {
      rssBytes: SHRANK_RSS_MB * ONE_MB,
      heapUsedBytes: SHRANK_HEAP_USED_MB * ONE_MB,
      externalBytes: SHRANK_EXTERNAL_MB * ONE_MB,
    } )

    expect( retained!.rssMb ).toBe( SHRANK_RSS_MB - BASELINE_RSS_MB )
    expect( retained!.heapUsedMb )
        .toBe( SHRANK_HEAP_USED_MB - BASELINE_HEAP_USED_MB )
    expect( retained!.externalMb )
        .toBe( SHRANK_EXTERNAL_MB - BASELINE_EXTERNAL_MB )
    expect( retained!.rssMb ).toBeLessThan( 0 )
  } )

  test('is undefined when either sample is missing', () => {
    // One settled sample and one absent is not half a measurement, it is
    // none: the caller writes N/A for the whole row rather than differencing
    // against something it never took.
    const retained = { rssBytes: 0, heapUsedBytes: 0, externalBytes: 0 }

    expect( retainedMemoryMb( void 0, retained ) ).toBeUndefined()
    expect( retainedMemoryMb( baseline, void 0 ) ).toBeUndefined()
    expect( retainedMemoryMb( void 0, void 0 ) ).toBeUndefined()
  } )
} )

describe('settleAndSampleMemoryForPerf', () => {

  test('forces no collection when no perf row is being written', async () => {
    // The reason this gate exists. ifc_regression_batch_main launches EVERY
    // child with --expose-gc, so `global.gc` is present on a digest-only run
    // too; nothing but this check stops that run from paying two forced full
    // collections per model for a figure writePerfCsvIfRequested discards.
    // Asserting the RETURN VALUE alone would not catch a regression to an
    // unconditional settle — undefined comes back either way once the
    // baseline is undefined — so the collector call count is what is pinned.
    let collections = 0

    await withGc( () => {
      ++collections
    }, async () => {
      expect( await settleAndSampleMemoryForPerf( '' ) ).toBeUndefined()
    } )

    expect( collections ).toBe( 0 )
  } )

  test('settles and samples when a perf row is being written', async () => {
    // The other side of the gate: given a path, it must behave exactly like
    // settleAndSampleMemory, two collections and all. A gate that also
    // suppressed the wanted case would leave the columns permanently N/A.
    let collections = 0

    await withGc( () => {
      ++collections
    }, async () => {
      const sample = await settleAndSampleMemoryForPerf( '/tmp/perf.csv' )

      expect( sample ).not.toBeUndefined()
      expect( typeof sample?.rssBytes ).toBe( 'number' )
    } )

    expect( collections ).toBe( 2 )
  } )

  test('still yields undefined for a wanted row with no collector', async () => {
    // The gate must not become a second way to claim a measurement. With a
    // perf path but no --expose-gc there is nothing to settle with, and the
    // answer stays undefined -> N/A rather than an unsettled sample.
    await withGc( void 0, async () => {
      expect(
          await settleAndSampleMemoryForPerf( '/tmp/perf.csv' ) ).toBeUndefined()
    } )
  } )
} )
