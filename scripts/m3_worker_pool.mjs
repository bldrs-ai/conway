/**
 * A worker pool for demand-driven geometry extraction — the across-product
 * parallelism axis, running for real rather than simulated by processes.
 *
 * Each worker opens the model, claims a shard with `SetGeometryShard`, and
 * pumps to completion. There is NO scheduling channel between them:
 * placement is a pure function of the product (its representation's mapped
 * source), so N workers independently agree on who owns what, and products
 * sharing geometry land together instead of every shard rebuilding it.
 *
 * **Every worker parses.** The index could be transferred instead — the
 * columns are four typed arrays and `IfcStepModel` takes them directly — but
 * that needs a construct-from-columns entry on the open path, which does not
 * exist yet. Parsing per worker costs N times the parse CPU and N copies of
 * the index in memory, while costing only ONE parse of latency, because they
 * run concurrently. So it is the right shape to measure first: if the
 * geometry win covers it, transfer is an optimisation rather than a
 * prerequisite, and this script is what says which.
 *
 * Correctness is checked, not assumed: the union of the shards' placements
 * must equal what a single unsharded worker delivers. A pool that loses or
 * duplicates instances is not faster, it is wrong.
 *
 * **The sweep runs every worker count in ONE process**, so the kernel's
 * `VmHWM` it reports is a cumulative high-water mark over the whole sweep
 * rather than a per-N peak — see `peakRssMb`.
 *
 *   node scripts/m3_worker_pool.mjs <model> [--workers 1,2,4] [--prep-probe]
 *
 * `--prep-probe` skips the pump entirely and reports what the first-batch
 * window is made of — replicated demand prep, contention on it, the
 * dispatch-key pass only a sharded worker runs, and the geometry batch that
 * rides along inside the window. The geometry is removed **per worker**,
 * against that worker's own products, because a sharded worker's first
 * product is not the unsharded reference's first product; see `prepProbe`
 * and `runPrepProbe`.
 *
 * Each level now also prints a `direct (engine)` line, read from
 * `IfcAPI.GetDemandPrepYield` (conway#682). That figure is timed inside
 * `ensureDemandWorklists_` itself, so it contains no geometry at all and
 * needs neither the tail correction nor an error bar for the product that
 * correction stands in for — which is what lets the candidate/key split
 * resolve on models where the differenced estimate reported
 * `NOT RESOLVED` (ledger §11.4: Snowdon and MB-Khaya). The differenced
 * lines stay: agreement between the two is what says the direct timer
 * measures the window the sweep's `dupFirstBatch` ratio is about, and
 * `prepMs` legitimately includes one-time extraction-path warmup that the
 * direct figure, by construction, excludes.
 *
 * D3D needs `--max-old-space-size=12288`; nothing here calls `gc()`, so
 * `--expose-gc` buys nothing and is deliberately not in that line.
 */
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

import { wasmHeapByteLength } from '../compiled/src/core/wasm_heap.js'


const REPO_ROOT = path.resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '..' )
const DEFAULT_WORKERS = [ 1, 2, 4 ]
const BATCH_SIZE = 64
const MS_PER_S = 1000
// Geometry-only calls each prep-probe worker makes after its timed first
// call, so the geometry inside that window can be subtracted using the same
// worker's own products (see `prepProbe`). Five rather than one because the
// subtraction takes their MEDIAN: per-product extraction cost is skewed, and
// a single sample would hand one expensive product straight into the prep
// figure. Their spread is what the reported error bars are built from.
const PROBE_TAIL_CALLS = 5
// Below this the estimate has no error bar, and a prep figure with no error
// bar is what the previous round published.
const MIN_TAIL_SAMPLES = 2


/**
 * A transform's exact bytes, as a comparable string.
 *
 * Rounding here would make the union check unable to fail: a shard that
 * shifted a component by less than half the last printed digit would
 * serialize identically to the reference and report OK on output that is
 * not the same output. The whole point of this script is detecting that,
 * so the encoding has to be lossless.
 *
 * @param {ArrayLike<number>} transform The flat transformation.
 * @return {string} A lossless encoding of every component.
 */
function transformKey( transform ) {

  const exact = new Float64Array( transform )

  return Buffer.from( exact.buffer, exact.byteOffset, exact.byteLength )
      .toString( 'base64' )
}


/**
 * Payload entries grouped by the geometry ID they encode.
 *
 * An entry is `${id}:${vertexFloats}:${indexCount}:${digest?}`, so a set over
 * whole entries is a set over (geometry, how it came out) pairs, NOT over
 * geometries: one ID built differently by two shards is two members. Every
 * count that is about the model rather than about the encoding has to come
 * through here.
 *
 * @param {string[]} entries Payload entries, any order.
 * @return {Map<string, string[]>} ID to its encodings, in the input's order.
 */
function groupPayloadsById( entries ) {

  const byId = new Map()

  for ( const entry of entries ) {

    const id = entry.slice( 0, entry.indexOf( ':' ) )
    const existing = byId.get( id )

    if ( existing === void 0 ) {
      byId.set( id, [ entry ] )
    } else {
      existing.push( entry )
    }
  }

  return byId
}


/**
 * One worker, prep only — and the geometry that cannot be kept out of it.
 *
 * `pumpGeometryBatch_` floors its budget at one product
 * (`ifc_api_proxy_ifc.ts:3007` — `Math.max(batchSize, 1)`), so there is no
 * call that runs `ensureDemandWorklists_` and extracts nothing: every window
 * this probe can time is prep PLUS at least one product of real geometry.
 * That geometry has to come back out, and the only sound place to subtract
 * it is INSIDE the same worker.
 *
 * So: one timed call, which builds the worklists and pumps `batch` products,
 * then up to `PROBE_TAIL_CALLS` more timed calls of the same size, which pump
 * `batch` more products each and run no prep at all — `ensureDemandWorklists_`
 * returns at its `demandProducts_ !== void 0` guard. `prepMs` is the first
 * call minus the median of those, so the geometry is cancelled against *this
 * worker's own worklist*.
 *
 * **That is the whole point, and the first version of this probe got it
 * wrong.** The levels do not share a worklist: `demandProducts_` is the
 * FILTERED list on a sharded worker, so shard *i*'s first product is not the
 * unsharded worklist's first product — it is the first product that survives
 * shard *i*'s filter, and N shards extract N *different* products where N
 * unsharded workers all extract the same one. Subtracting one
 * configuration's summed window from another's therefore leaves
 * `Σ_shards g(shard's first product) − N × g(the whole worklist's first
 * product)` inside what gets reported as the dispatch-key pass. Per-product
 * extraction cost is heterogeneous by orders of magnitude, and §11.4
 * measured the small models' window as 84 % geometry, so that residue could
 * be the entire signal there.
 *
 * The cancellation is not exact — the estimate's bias is
 * `g(first product) − median(g(the next few))`, since no two products cost
 * the same — so `tailMs` comes back with the estimate and the caller sizes
 * the bias from the observed spread and prints it as an error bar rather
 * than implying there is none.
 *
 * **`prepMs` is "what the first call does that later calls do not", which is
 * a superset of the worklist build.** One-time warmup on the extraction path
 * — wasm scratch, the first trip through `extractProductGeometryByLocalID`,
 * JIT — lands in it too, and no instrument outside `src/` can separate the
 * two. It is charged identically at every level, so it cancels in the two
 * differences below (contention, key pass); what it does is inflate the
 * absolute replicated-prep term, which is the conservative direction for
 * §11.4's conclusion 2.
 *
 * A tail call whose `extracted` differs from the first call's is dropped and
 * ends the tail: that means the product worklist ran out and the pump has
 * moved on to the rel-aggregates pass, which is different work and would
 * bias the subtraction by an unknown amount rather than by a product's cost.
 *
 * @param {object} api The opened `IfcAPI`.
 * @param {number} modelID The open model.
 * @param {object} task `{index, count, shard, batch}`.
 * @param {number} openMs What the open before it cost.
 * @return {object} What this level cost, prep separated from geometry.
 */
function prepProbe( api, modelID, task, openMs ) {

  const batch = task.batch ?? 0
  const tWindow = performance.now()
  const { extracted } = api.ExtractGeometryBatch( modelID, batch, () => {} )
  const windowMs = performance.now() - tWindow

  // The engine's own measurement of the same window, read after the call
  // that built the worklists. It carries NO geometry — the timer closes
  // where the build ends, before the pump starts — so it needs neither the
  // tail correction below nor an error bar for the product the correction
  // stands in for, and it resolves on every model rather than only the two
  // whose prep is large against one product's extraction (conway#682,
  // ledger §11.4). Everything else here is left in place: the differenced
  // estimate is what says the direct one is measuring the same window, and
  // `prepMs` still legitimately contains one-time extraction-path warmup
  // that the direct figure, by construction, does not.
  const directPrep = api.GetDemandPrepYield( modelID )
  const tailMs = []

  for ( let call = 0; call < PROBE_TAIL_CALLS; ++call ) {

    const tTail = performance.now()
    const tail = api.ExtractGeometryBatch( modelID, batch, () => {} )
    const elapsed = performance.now() - tTail

    if ( tail.extracted !== extracted ) {
      break
    }

    tailMs.push( elapsed )
  }

  // Two comparable calls minimum, not one. A single sample would produce a
  // point estimate with a zero-width error bar, and a zero error bar here
  // asserts exactly the thing this rewrite exists to stop asserting: that
  // the geometry cancelled exactly.
  const geometryMs = tailMs.length >= MIN_TAIL_SAMPLES ? median( tailMs ) : void 0

  return {
    index: task.index,
    openMs,
    windowMs,
    tailMs,
    // Undefined rather than 0 where the tail is empty: a 0 here would report
    // the uncorrected window as if it were prep, which is the exact defect
    // this rewrite exists to remove. The caller refuses instead.
    prepMs: geometryMs === void 0 ? void 0 : windowMs - geometryMs,
    geometryMs,
    extracted,
    // Flattened rather than passed whole: this crosses a worker_threads
    // postMessage boundary, so it has to be plain data.
    directTotalMs: directPrep?.totalMs,
    directCandidatesMs: directPrep?.candidatesMs,
    directKeysMs: directPrep?.keysMs,
    directCandidateProducts: directPrep?.candidateProducts,
    directKeptProducts: directPrep?.keptProducts,
  }
}


/**
 * @param {number[]} samples At least one, any order.
 * @return {number} The lower median — the same pick the repetition chooser
 * below makes, so a median-of-medians never lands between two samples.
 */
function median( samples ) {

  const sorted = [ ...samples ].sort( ( a, b ) => a - b )

  return sorted[ ( sorted.length - 1 ) >> 1 ]
}


/**
 * How far a worker's geometry samples reach from their own median.
 *
 * This is the error bar on that worker's `prepMs`: the subtraction removes
 * the median of the tail, and the product it is standing in for could
 * plausibly have cost anything the tail spans. One-sided max rather than
 * half the range, because the distribution is not symmetric — one expensive
 * product among cheap ones is the shape to expect.
 *
 * @param {number[]} tailMs That worker's geometry-only calls.
 * @return {number} The uncertainty in ms, 0 where there is nothing to say.
 */
function spread( tailMs ) {

  if ( tailMs.length < 2 ) {
    return 0
  }

  const mid = median( tailMs )

  return Math.max( Math.max( ...tailMs ) - mid, mid - Math.min( ...tailMs ) )
}


/**
 * The prep probe: what the first-batch window is actually made of.
 *
 * Prints the levels and the arithmetic between them, because the sweep's
 * `dupFirstBatch` ratio cannot distinguish them and was read as if it could:
 *
 *   summed prep at N  =  N x one unsharded worker    (replicated prep)
 *                     +  N unsharded workers - that  (contention)
 *                     +  N sharded workers - those   (shard-only key pass)
 *
 * Every term on the right is a measured level, not a residual: the first is
 * what an unsharded pool of N would also pay; the second is what running them
 * together costs, which the `open` control in ledger §11.2 independently
 * brackets; and the third exists ONLY because sharding exists, since the
 * unsharded reference computes not one dispatch key. Charging that third term
 * to "prep every worker repeats" attributes sharding's own overhead to a
 * lever that predates it, which is what the second draft of §11.4 did.
 *
 * **The arithmetic is only sound because every level's geometry is removed
 * per worker first** (see `prepProbe`). The third draft subtracted whole
 * windows across configurations, which left a difference of *different
 * products' geometry* inside the key-pass term; that is the finding this
 * version answers. Two things are reported so it cannot be papered over
 * again: a per-worker error bar summed from the tail spreads, and the
 * envelope of each derived term over the repetitions. A term smaller than
 * either is printed as NOT RESOLVED rather than as a number.
 *
 * @param {number[]} sweep Worker counts, ascending, starting at 1.
 * @param {Function} runPool `(count, mode, shardOf, batch) => Promise<object[]>`.
 * @param {number} runs Repetitions per level; the median summed one wins.
 * @return {Promise<void>} When every level has been reported.
 */
async function runPrepProbe( sweep, runPool, runs ) {

  console.log(
      `prep probe: ${runs} repetition(s) per level, median reported, envelope ` +
      'over the\n  repetitions in brackets. Each worker times one call that ' +
      `builds its worklists and\n  pumps a batch, then up to ` +
      `${PROBE_TAIL_CALLS} more calls of the same batch that pump only ` +
      'geometry;\n  prep is the first minus the median of those, so the ' +
      "geometry cancels against that\n  worker's OWN products. +/- is the " +
      'summed spread of those geometry calls — the\n  residual the ' +
      'cancellation cannot remove. A batch of 0 is floored at one product by ' +
      '\n  the pump.' )

  /**
   * One level, repeated; every repetition kept, the median summed one picked.
   *
   * Median of the SUM across workers rather than of each worker separately:
   * the sum is the quantity every ratio below is built from, and taking
   * medians per worker first would mix repetitions inside one figure.
   *
   * @param {number} count How many workers.
   * @param {Function} [shardOf] Descriptor per worker index.
   * @param {number} [batch] Batch size to pump, default 0.
   * @return {Promise<object>} `{chosen, lo, hi}` — the median repetition, and
   * the summed prep envelope over all of them.
   */
  async function level( count, shardOf, batch ) {

    const samples = []

    for ( let run = 0; run < runs; ++run ) {

      const results = await runPool( count, 'prep', shardOf, batch )
      const uncorrected = results.filter( ( r ) => r.prepMs === void 0 )

      // Refused rather than reported: with no geometry-only call to subtract,
      // this level's "prep" would be the raw window, which is the quantity
      // that made the third draft's key pass wrong. A model too small to
      // spare a few products past the first batch needs a smaller batch.
      if ( uncorrected.length > 0 ) {

        throw new Error(
            `prep probe: ${uncorrected.length} of ${count} worker(s) at ` +
            `batch=${batch ?? 0} could not run ${MIN_TAIL_SAMPLES} ` +
            'comparable geometry-only calls — their product worklist ran out ' +
            'inside the first batches, so the geometry cannot be cancelled ' +
            'out of the window and no split of it would mean anything' )
      }

      // Refused for the same reason the tail refusal above is: a level
      // whose workers did not all report the engine timer would sum a
      // partial set and print it as if it were the level's, and that is
      // the "looks measured, is not" shape this probe keeps running into.
      const untimed = results.filter( ( r ) => r.directTotalMs === void 0 )

      if ( untimed.length > 0 ) {

        throw new Error(
            `prep probe: ${untimed.length} of ${count} worker(s) reported no ` +
            'demand-prep yield — GetDemandPrepYield returned undefined, so ' +
            'either the model was not opened deferred or this build predates ' +
            'conway#682' )
      }

      samples.push( {
        summed: results.reduce( ( sum, r ) => sum + r.prepMs, 0 ),
        geometry: results.reduce( ( sum, r ) => sum + r.geometryMs, 0 ),
        uncertainty: results.reduce( ( sum, r ) => sum + spread( r.tailMs ), 0 ),
        // The engine's own split of the same window, summed the same way.
        // `keysMs` is undefined on every unsharded level — that build
        // computes no keys — and summing it as 0 there is not a hidden
        // zero: it is the level's defining property, and it is what the
        // differenced key-pass term below is measured against.
        directSummed: results.reduce( ( sum, r ) => sum + r.directTotalMs, 0 ),
        directCandidates:
          results.reduce( ( sum, r ) => sum + r.directCandidatesMs, 0 ),
        directKeys:
          results.reduce( ( sum, r ) => sum + ( r.directKeysMs ?? 0 ), 0 ),
        directWalked:
          results.reduce( ( sum, r ) => sum + r.directCandidateProducts, 0 ),
        directKept: results.reduce( ( sum, r ) => sum + r.directKeptProducts, 0 ),
        // The uncorrected first-batch window, kept because the two N=1
        // levels below are differenced rather than tail-corrected — see the
        // batch-BATCH_SIZE report.
        windowSummed: results.reduce( ( sum, r ) => sum + r.windowMs, 0 ),
        perWorker: results.map( ( r ) => r.prepMs ),
      } )
    }

    const ordered = [ ...samples ].sort( ( a, b ) => a.summed - b.summed )
    const windows = samples.map( ( sample ) => sample.windowSummed )

    return {
      chosen: ordered[ ( ordered.length - 1 ) >> 1 ],
      lo: ordered[ 0 ].summed,
      hi: ordered[ ordered.length - 1 ].summed,
      // The window envelope is its own, not the prep envelope shifted: the
      // repetition with the smallest prep is not necessarily the one with
      // the smallest window.
      windowLo: Math.min( ...windows ),
      windowHi: Math.max( ...windows ),
    }
  }

  /**
   * A derived term, with everything needed to say whether it is real.
   *
   * The envelope is deliberately the worst case in each direction over the
   * observed repetitions rather than a paired difference: run *r* of one
   * level and run *r* of another were not taken together, so pairing them by
   * index would invent a correlation. It is wide, and it is honest about
   * three or five samples on a shared box.
   *
   * @param {object} above The larger level.
   * @param {object} below The level it is measured over.
   * @return {object} `{value, lo, hi, error}`, all in ms.
   */
  function over( above, below ) {

    return {
      value: above.chosen.summed - below.chosen.summed,
      lo: above.lo - below.hi,
      hi: above.hi - below.lo,
      error: above.chosen.uncertainty + below.chosen.uncertainty,
    }
  }

  /**
   * @param {object} term From `over`.
   * @param {number} whole What it is a share of.
   * @return {string} The term, its envelope, its error bar and its share —
   * or a refusal where the envelope or the error bar covers zero.
   */
  function report( term, whole ) {

    const resolved =
      Math.abs( term.value ) > term.error && term.lo > 0 === term.hi > 0

    return `${toS( term.value )}s ` +
      `[${toS( term.lo )}..${toS( term.hi )}] +/-${toS( term.error )} ` +
      ( resolved ? `(${percent( term.value, whole )})` :
        '(NOT RESOLVED: smaller than its own spread)' )
  }

  /**
   * The engine timer's own reading of a level, printed beside the
   * differenced one.
   *
   * This is the line conway#682 asked for. It needs no error bar and no
   * `NOT RESOLVED` case: `keysMs` is the dispatch-key pass as the code
   * measured it, not a difference between two configurations that pump
   * different products, so a model whose prep is smaller than one product
   * of geometry still reports it. The walked/kept counts are on the line
   * because they are the replication itself — a level whose workers walked
   * four times what they kept has enumerated the model four times.
   *
   * @param {object} chosen The median repetition's sample.
   * @return {string} The direct line.
   */
  function directLine( chosen ) {

    const keys = chosen.directKeys > 0 ?
      `, keys ${toS( chosen.directKeys )}s` : ', keys none (unsharded)'

    return '                   direct (engine)     ' +
      `${toS( chosen.directSummed )}s summed ` +
      `(candidates ${toS( chosen.directCandidates )}s${keys}), ` +
      `walked ${chosen.directWalked} products to keep ${chosen.directKept}`
  }

  const unsharded = await level( 1, () => void 0 )
  const shardOfOne = await level( 1, () => ( { index: 0, count: 1 } ) )
  const withBatch = await level( 1, () => void 0, BATCH_SIZE )

  console.log(
      `level=unsharded    workers=1 batch=0  prep=${toS( unsharded.chosen.summed )}s ` +
      `[${toS( unsharded.lo )}..${toS( unsharded.hi )}] ` +
      `+/-${toS( unsharded.chosen.uncertainty )}  (worklist build with no ` +
      'dispatch key computed at all, plus\n                   whatever the ' +
      'first extraction call warms up; the one product of geometry\n' +
      `                   is out — it measured ${toS( unsharded.chosen.geometry )}s)` )
  console.log( directLine( unsharded.chosen ) )
  console.log(
      `level=shard-of-1   workers=1 batch=0  prep=${toS( shardOfOne.chosen.summed )}s ` +
      `[${toS( shardOfOne.lo )}..${toS( shardOfOne.hi )}] ` +
      `+/-${toS( shardOfOne.chosen.uncertainty )}  ` +
      `(${( shardOfOne.chosen.summed / unsharded.chosen.summed ).toFixed( 2 )}x) -> ` +
      'NULL CONTROL: setGeometryShard normalises count 1 to\n                   ' +
      'unsharded, so this must match the line above. It is here to prove the\n' +
      '                   key-pass figure below is the sharded BRANCH and not ' +
      'the cost of\n                   calling SetGeometryShard.' )
  // Differenced against the batch-0 window, NOT tail-corrected like every
  // other line here — and that is not an inconsistency, it is the same rule.
  // Differencing is sound exactly when both sides pump the same products,
  // and these two levels are one unsharded worker on one worklist where the
  // batch-0 call is a PREFIX of this one, so the difference is precisely
  // products 1..BATCH_SIZE-1 of that shared worklist. It is the condition
  // that fails between a sharded level and an unsharded one, which is why
  // those are corrected per worker instead. The tail cannot stand in here:
  // it measures the NEXT BATCH_SIZE products, and on D3D those cost 0.008 s
  // against the first batch's 0.278 s — a worklist is not homogeneous along
  // its length, only comparable to itself at the same offset.
  const referenceWindow = withBatch.chosen.windowSummed
  const inWindow = referenceWindow - unsharded.chosen.windowSummed

  console.log(
      `level=unsharded    workers=1 batch=${BATCH_SIZE} ` +
      `window=${toS( referenceWindow )}s ` +
      `[${toS( withBatch.windowLo )}..${toS( withBatch.windowHi )}] -> the ` +
      "sweep's own " +
      `reference window.\n                   Of it, ${toS( inWindow )}s ` +
      `(${percent( inWindow, referenceWindow )}) is the ${BATCH_SIZE - 1} ` +
      'products of geometry this level\n                   pumps that the ' +
      'batch-0 level does not — differenced, because these two levels ARE\n' +
      '                   the same worker on the same worklist and the batch-0 ' +
      'call is a prefix of\n                   this one. That is the condition ' +
      'the sharded levels do not meet.' )

  for ( const count of sweep ) {

    if ( count < 2 ) {
      continue
    }

    // N workers doing the SAME prep with no shard applied — the control that
    // makes the split measured rather than subtracted. It is the sharded
    // level in every respect except the one branch under test, so the
    // difference between them is the shard-only key pass at this N, and the
    // difference between it and N x the single uncontended worker is
    // contention on the replicated part. Without it the growth from N=1 to
    // N=4 has to be attributed by assumption, which is the error this whole
    // probe exists to undo.
    const replicatedAtN = await level( count, () => void 0 )
    const shards = await level( count, void 0 )
    // N x a level rather than a level of its own, so its envelope scales with
    // it: the same worker count is what makes it comparable to the two above.
    const replicatedLevel = {
      chosen: {
        summed: count * unsharded.chosen.summed,
        uncertainty: count * unsharded.chosen.uncertainty,
      },
      lo: count * unsharded.lo,
      hi: count * unsharded.hi,
    }
    const contention = over( replicatedAtN, replicatedLevel )
    const keyPass = over( shards, replicatedAtN )
    const whole = shards.chosen.summed

    console.log(
        `level=unsharded    workers=${count} batch=0  ` +
        `per-worker=${replicatedAtN.chosen.perWorker.map( toS ).join( '/' )}s ` +
        `summed=${toS( replicatedAtN.chosen.summed )}s ` +
        `[${toS( replicatedAtN.lo )}..${toS( replicatedAtN.hi )}] ` +
        `+/-${toS( replicatedAtN.chosen.uncertainty )}  ` +
        `(${( replicatedAtN.chosen.summed / replicatedLevel.chosen.summed )
          .toFixed( 2 )}x N x the single worker:\n                   ` +
        'contention on the replicated prep alone)' )
    console.log( directLine( replicatedAtN.chosen ) )
    console.log(
        `level=shards       workers=${count} batch=0  ` +
        `per-shard=${shards.chosen.perWorker.map( toS ).join( '/' )}s ` +
        `summed=${toS( whole )}s [${toS( shards.lo )}..${toS( shards.hi )}] ` +
        `+/-${toS( shards.chosen.uncertainty )}` )
    console.log( directLine( shards.chosen ) )
    console.log(
        '                   replicated prep     ' +
        `${toS( replicatedLevel.chosen.summed )}s ` +
        `[${toS( replicatedLevel.lo )}..${toS( replicatedLevel.hi )}] ` +
        `+/-${toS( replicatedLevel.chosen.uncertainty )} ` +
        `(${percent( replicatedLevel.chosen.summed, whole )})` )
    console.log(
        `                   contention on it    ${report( contention, whole )}` )
    console.log(
        `                   shard-only key pass ${report( keyPass, whole )}` )
  }
}


/**
 * @param {number} ms A duration.
 * @return {string} It, in seconds, to milliseconds.
 *
 * Three decimals, not the sweep's one: the small models' whole demand prep is
 * tens of milliseconds, and at 0.1 s resolution the terms this probe exists
 * to separate all print as 0.0.
 */
function toS( ms ) {

  return ( ms / MS_PER_S ).toFixed( 3 )
}


/**
 * @param {number} part A term.
 * @param {number} whole What it is a share of.
 * @return {string} The share, as a percentage.
 */
function percent( part, whole ) {

  return `${( 100 * part / whole ).toFixed( 0 )} %`
}


/**
 * One worker: open, claim a shard, pump it dry, report what it delivered.
 *
 * Reports per-placement digests rather than a count, so the union check can
 * catch a shard that delivers the right NUMBER of instances at the wrong
 * placements — which is what a mis-shared representation looks like.
 *
 * @param {object} task `{filePath, index, count}`.
 * @return {Promise<object>} What this shard produced.
 */
async function runWorker( task ) {

  const fs = await import( 'node:fs' )
  const { IfcAPI } = await import( '../compiled/src/compat/web-ifc/ifc_api.js' )

  const noPayloadDigest = process.env.NO_PAYLOAD_DIGEST === '1'
  const api = new IfcAPI()

  await api.Init()

  const bytes = new Uint8Array( fs.readFileSync( task.filePath ) )
  const tOpen = performance.now()

  // No COORDINATE_TO_ORIGIN: the recentre anchor is derived from whichever
  // product a model captures first, so shards would each derive their own
  // and merge subsets shifted by whole grid cells on a model spanning more
  // than one recentre cell. SetGeometryShard refuses the combination; this
  // is the other half of that decision.
  const modelID = await api.OpenModelStreamed( bytes, {
    USE_FAST_BOOLS: true,
    DEFER_GEOMETRY: true,
  } )

  const openMs = performance.now() - tOpen

  // The descriptor is passed in rather than derived from `task.count`,
  // because the prep probe needs configurations the efficiency sweep cannot
  // express: N workers with NO shard (the control that separates contention
  // from the sharded branch) and a shard of one (a null control —
  // `setGeometryShard` normalises `count === 1` back to unsharded).
  if ( task.shard !== void 0 ) {
    api.SetGeometryShard( modelID, task.shard )
  }

  if ( task.mode === 'prep' ) {
    return prepProbe( api, modelID, task, openMs )
  }

  const placements = []

  // Payload digests too, not just placements. Identical express IDs and
  // transforms can sit over different vertex data — a cache-order or
  // master-void regression looks exactly like that — so a placement-only
  // digest would report OK on visibly different geometry. Hashed once per
  // geometry, since instances share it.
  const payloads = new Map()
  // Accumulated over UNIQUE geometries only (the map guards re-entry), so a
  // shard's totals are what it built, not what it instanced.
  const sizes = { vertexFloats: 0, indexCount: 0 }
  // `placed.geometryExpressID` is `getElementByLocalID( ... )?.expressID as
  // number` at four sites in `ifc_api_proxy_ifc.ts`, so it can be undefined.
  // Undefined stringifies to "undefined" in the payload key, which would
  // collapse EVERY such geometry into one bucket per worker — deflating the
  // unique-geometry count and manufacturing a cross-shard difference out of
  // nothing. The residual divergence this script reports is read as evidence
  // for a specific engine hypothesis, so the case is excluded by
  // construction: skipped here, then failed loudly below.
  let unidentifiedGeometries = 0
  const tGeometry = performance.now()
  // The FIRST batch call is where `ensureDemandWorklists_` runs (see
  // `ifc_api_proxy_ifc.ts:extractGeometryBatch`), so this is the window that
  // contains demand prep — and it is named for the window rather than for
  // the prep, because it is NOT the same prep in every worker:
  //
  //  - `ensureDemandWorklists_` returns early at `this.shard_ === void 0`
  //    (`ifc_api_proxy_ifc.ts:2280`). The unsharded N=1 reference therefore
  //    computes **not one dispatch key**. Every N>1 worker additionally runs
  //    `geometryDispatchKey` over every worklist product AND over every
  //    `IfcRelAggregates` (`:2298-2313`), then filters both lists. That work
  //    exists only because sharding exists; an unsharded pool would not pay
  //    it, and dividing it by a reference that never did it is not
  //    "the same prep, N times".
  //  - What IS replicated is `collectDemandCandidates_`: the `IfcProduct`
  //    walk and `aggregateTargetLocalIDs()` over every `IfcRelAggregates`.
  //    A shard does not shrink that, and every worker does all of it.
  //  - It is WALL time, with the same exposure `dupWall` has: it cannot
  //    separate work from contention.
  //  - It also contains one batch of BATCH_SIZE products of real geometry.
  //
  // `--prep-probe` separates all four: it runs the same call with a batch of
  // 0 (which the pump floors at one product) at one unsharded worker, N
  // unsharded workers and N sharded workers, plus one unsharded worker at
  // BATCH_SIZE — so replicated prep, contention on it, the shard-only key
  // pass and the geometry riding inside the window are each measured rather
  // than summed into one ratio. The geometry comes out of every level
  // through follow-up calls in the SAME worker, not by differencing one
  // configuration's window against another's: `demandProducts_` is the
  // filtered list on a sharded worker, so the two configurations do not
  // extract the same products and that difference does not cancel.
  let firstBatchMs = 0
  let batches = 0

  for ( ;; ) {

    const tBatch = performance.now()
    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH_SIZE, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )

            if ( !Number.isInteger( placed.geometryExpressID ) ) {
              ++unidentifiedGeometries
              continue
            }

            // Entity, geometry, colour and transform. Without the entity a
            // placement attributed to the wrong FlatMesh reads identical
            // (picking and metadata differ, geometry does not); without the
            // colour a different material resolving to the same mesh does
            // too.
            placements.push(
                `${mesh.expressID}/${placed.geometryExpressID}` +
                `#${placed.color.x},${placed.color.y},${placed.color.z},${placed.color.w}` +
                `@${transformKey( placed.flatTransformation )}` )

            if ( !payloads.has( placed.geometryExpressID ) ) {

              // GetGeometry hands back an OWNING clone, and embind
              // finalization is nondeterministic — keeping one per geometry
              // for the length of a run inflates both the timings this
              // script reports and the memory it needs to report them.
              const geometry = api.GetGeometry( modelID, placed.geometryExpressID )

              try {

                const vertices = api.GetVertexArray(
                    geometry.GetVertexData(), geometry.GetVertexDataSize() )
                const indices = api.GetIndexArray(
                    geometry.GetIndexData(), geometry.GetIndexDataSize() )

                // The digest is the union check's evidence, and it is also
                // harness cost that a real pool would not pay — charged once
                // per shard that touches a shared geometry, so it rides on
                // exactly the duplication term the efficiency number is
                // trying to measure. NO_PAYLOAD_DIGEST=1 keeps the copy-out
                // (which a consumer does pay) and drops only the hash, to
                // bound how much of a reported loss is the instrument.
                // Sizes travel alongside the digest in BOTH modes, so the
                // run can prove it did the work (vertex/triangle totals
                // against the model's known figures) without depending on
                // which verification mode is on. A timing line alone cannot
                // distinguish a fast run from a skipped one.
                sizes.vertexFloats += vertices.length
                sizes.indexCount += indices.length

                // Sizes ALWAYS, digest optionally. Sizes alone already
                // catch a shard building different topology (which is what
                // D3D turned out to do); the digest additionally catches
                // same-sized geometry with different values.
                const digested = noPayloadDigest ? '' :
                  createHash( 'sha256' )
                      .update( new Uint8Array( vertices.buffer, vertices.byteOffset,
                          vertices.byteLength ) )
                      .update( new Uint8Array( indices.buffer, indices.byteOffset,
                          indices.byteLength ) )
                      .digest( 'hex' )

                payloads.set( placed.geometryExpressID,
                    `${vertices.length}:${indices.length}:${digested}` )

              } finally {
                geometry.delete()
              }
            }
          }
        } )

    if ( batches === 0 ) {
      firstBatchMs = performance.now() - tBatch
    }

    ++batches

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  const geometryMs = performance.now() - tGeometry

  // After the pump, not inside the callback: throwing across the embind
  // boundary is not a supported unwind.
  if ( unidentifiedGeometries > 0 ) {
    throw new Error(
        `shard ${task.index}: ${unidentifiedGeometries} placements carry a ` +
        'non-integer geometryExpressID, so the payload key cannot identify ' +
        'their geometry and every union count below would be wrong' )
  }

  // Per-worker memory, read after the pump and before anything is released.
  //
  // The wasm figure is this worker's OWN linear memory: worker_threads give
  // each thread its own isolate and each `IfcAPI` its own wasm instance, so N
  // of these are N separate heaps, which is exactly the shape production can
  // have (no COEP, so no SharedArrayBuffer). Linear memory is grow-only, so
  // one read after the fact IS its high-water mark — but only if the read
  // sees the current heap. `wasmHeapByteLength` is in the repo precisely
  // because `HEAPU8.length` on its own under-reports by a whole growth step
  // whenever the module's cached views are behind (#485); reading the view
  // directly here would have silently under-reported the peak this run
  // exists to bound. Same call the sibling bench `m3_pump_spike.mjs` makes.
  //
  // The V8 figure is NOT a high-water mark of anything: `used_heap_size` is
  // an instantaneous reading taken at this one point after the pump. It is
  // per-isolate, so it is per-worker, but it is a snapshot next to a peak.
  // Process RSS is neither — the main thread reads VmHWM for the whole
  // process instead.
  const v8 = await import( 'node:v8' )

  return {
    index: task.index,
    openMs,
    geometryMs,
    firstBatchMs,
    vertexFloats: sizes.vertexFloats,
    indexCount: sizes.indexCount,
    wasmHeapBytes: wasmHeapByteLength( api.wasmModule ),
    v8HeapBytes: v8.getHeapStatistics().used_heap_size,
    placements,
    payloads: [ ...payloads ].map( ( [ id, hash ] ) => `${id}:${hash}` ),
  }
}


/**
 * The process's peak resident set, in MB, from the kernel rather than from V8.
 *
 * `process.memoryUsage().rss` is an instant; a pool's peak happens while the
 * workers are alive and is gone by the time the main thread reads anything.
 * `VmHWM` is the kernel's own high-water mark for the whole process, so it
 * survives worker teardown — which is the number the memory question in
 * load-performance-ledger.md §4 actually needs.
 *
 * **It is a SWEEP high-water mark, not a per-N peak, and the caller labels it
 * that way.** `VmHWM` never falls, the whole sweep runs N=1 → 2 → 4 in one
 * process, and the main thread holds the reference union (562,367 placement
 * strings on D3D) and the reference payloads for the entire sweep. So the row
 * printed for N=4 is the peak of a process that has already run N=1 and N=2
 * and is still carrying N=1's output. The direction is pessimistic — the true
 * per-N figure is at or below what is printed — but a per-N number needs one
 * worker count per process invocation.
 *
 * @return {number | undefined} Peak RSS in MB, or undefined where /proc could
 * not be read — never 0, which is a plausible-looking measurement.
 */
async function peakRssMb() {

  const fs = await import( 'node:fs' )
  let status

  // Reported, not swallowed: a bare `catch { return 0 }` here prints a
  // credible `0MB` for an unreadable file, which is the same class of silent
  // failure as the union check that could not report (§11.5).
  try {
    status = fs.readFileSync( '/proc/self/status', 'utf8' )
  } catch ( error ) {
    console.error( `  peak RSS unavailable: /proc/self/status: ${error}` )

    return void 0
  }

  const found = ( /VmHWM:\s+(\d+) kB/ ).exec( status )

  if ( found === null ) {
    console.error( '  peak RSS unavailable: no VmHWM line in /proc/self/status' )

    return void 0
  }

  return Number( found[ 1 ] ) / 1024
}


if ( !isMainThread ) {

  runWorker( workerData )
      .then( ( result ) => parentPort.postMessage( { ok: true, ...result } ) )
      .catch( ( error ) => parentPort.postMessage(
          { ok: false, index: workerData.index, error: String( error ) } ) )

} else {

  const argv = process.argv.slice( 2 )
  const usage =
    'usage: m3_worker_pool.mjs <model> [--workers 1,2,4] ' +
    '[--prep-probe [--runs 5]]'

  /**
   * Give up with a usage line rather than measure the wrong thing.
   *
   * @param {string} why What is wrong with the arguments.
   * @return {never} Does not return.
   */
  function refuse( why ) {

    console.error( `${why}\n${usage}` )
    process.exit( 2 )
  }

  // Parsed positionally rather than by "the first argument that is not a
  // flag": that shape reads `--workers 2,4 model.ifc` as a model path of
  // `2,4`. It happens to fail loudly at readFileSync today, so no wrong
  // number was ever produced by it, but the failure names the wrong thing.
  const workersFlag = argv.indexOf( '--workers' )
  const runsFlag = argv.indexOf( '--runs' )
  // -1 when the flag is absent, NOT `workersFlag + 1` — that is 0, which
  // would filter out argv[0] and reject the one-argument invocation.
  const workersValueAt = workersFlag >= 0 ? workersFlag + 1 : -1
  const runsValueAt = runsFlag >= 0 ? runsFlag + 1 : -1
  const positional = argv.filter( ( value, at ) =>
    !value.startsWith( '--' ) && at !== workersValueAt && at !== runsValueAt )

  if ( positional.length !== 1 ) {
    refuse( positional.length === 0 ? 'no model given' :
      `expected one model path, got ${positional.length}: ${positional.join( ' ' )}` )
  }

  const [ filePath ] = positional

  if ( workersFlag >= 0 && argv[ workersFlag + 1 ] === void 0 ) {
    refuse( '--workers needs a value' )
  }

  const counts = workersFlag >= 0 ?
    argv[ workersFlag + 1 ].split( ',' ).map( Number ) : DEFAULT_WORKERS
  // A bare flag, so the positional filter above already skips it.
  const prepProbeOnly = argv.includes( '--prep-probe' )

  if ( runsFlag >= 0 && argv[ runsFlag + 1 ] === void 0 ) {
    refuse( '--runs needs a value' )
  }

  // Five, not three. Round 3 quoted spreads of three and a fourth repetition
  // landed outside them on three of four models (ledger §11.3), so three is
  // known on this box to understate the variance rather than merely to be
  // few.
  const probeRuns = runsFlag >= 0 ? Number( argv[ runsFlag + 1 ] ) : 5

  if ( !Number.isInteger( probeRuns ) || probeRuns < 1 ) {
    refuse( `--runs must be a positive integer; got ${argv[ runsFlag + 1 ]}` )
  }

  // Refused rather than ignored: --runs on the pump sweep would look like it
  // set the repetition count the ledger's medians come from, and it does not
  // — those are separate invocations of the whole script.
  if ( runsFlag >= 0 && !prepProbeOnly ) {
    refuse( '--runs applies to --prep-probe only; the pump sweep is repeated ' +
      'by re-invoking the script' )
  }

  if ( counts.length === 0 ||
       counts.some( ( count ) => !Number.isInteger( count ) || count < 1 ) ) {
    refuse( `--workers must be positive integers; got ${counts.join( ',' )}` )
  }

  // Always run 1 first: every ratio below is against it, and it is also the
  // reference the union is compared to.
  const sweep = [ ...new Set( [ 1, ...counts ] ) ].sort( ( a, b ) => a - b )

  let referenceDigest
  let referenceWall
  let referenceGeometry
  let referenceUnion
  let referencePayloads
  // The N=1 run's own work counts, for the duplication factors below.
  let referenceFirstBatch
  let referenceWork
  let referenceVertexFloats

  const resolvedPath = path.resolve( REPO_ROOT, filePath )

  /**
   * N workers, started together, awaited together.
   *
   * @param {number} count How many workers.
   * @param {string} [mode] `'prep'` for the prep probe, omitted for the pump.
   * @param {object} [shardOf] `(index, count) => descriptor | undefined`.
   * @param {number} [batch] Batch size, for the prep probe only.
   * @return {Promise<object[]>} Each worker's report, in spawn order.
   */
  function runPool( count, mode, shardOf, batch ) {

    return Promise.all(
        Array.from( { length: count }, ( _, index ) =>
          new Promise( ( resolve, reject ) => {

            const worker = new Worker( fileURLToPath( import.meta.url ), {
              // No execArgv: a worker inherits the parent's V8 flags, which
              // is what gets --max-old-space-size to the shards. (Nothing
              // here calls gc(), so there is no --expose-gc to pass on
              // either — it used to be in the usage line and was inert.)
              workerData: {
                filePath: resolvedPath,
                index,
                count,
                mode,
                shard: shardOf === void 0 ?
                  ( count > 1 ? { index, count } : void 0 ) :
                  shardOf( index, count ),
                batch,
              },
            } )

            worker.on( 'message', ( message ) => {
              worker.terminate()
              message.ok ? resolve( message ) : reject( new Error( message.error ) )
            } )

            worker.on( 'error', reject )
          } ) ) )
  }

  if ( prepProbeOnly ) {
    await runPrepProbe( sweep, runPool, probeRuns )
    process.exit( process.exitCode ?? 0 )
  }

  for ( const count of sweep ) {

    const started = performance.now()

    const results = await runPool( count )

    const wallMs = performance.now() - started

    // Order-independent: shards finish in any order, and the union is a
    // multiset. Sorting before hashing is what makes two runs comparable.
    const union = results.flatMap( ( result ) => result.placements ).sort()

    // Payload hashes are per geometry, so shards that both touched one report
    // it twice; dedupe before hashing or the digest would depend on how the
    // partition happened to split shared geometry.
    //
    // Deduping the WHOLE ENTRY only merges shards that AGREE, though. An
    // entry is `${id}:${vertexFloats}:${indexCount}:${digest?}`, so this set
    // is over (geometry, how it came out) pairs: one ID that two shards built
    // differently contributes TWO members. That makes `payloadUnion.length` a
    // count of payload ENCODINGS, not of geometries, and the two are reported
    // separately below — their difference is the divergence signal itself,
    // and calling the encoding count "unique geometries" (which this script
    // used to do) turns a defect report into a claim about the model.
    const payloadUnion =
      [ ...new Set( results.flatMap( ( result ) => result.payloads ) ) ].sort()
    const payloadsById = groupPayloadsById( payloadUnion )

    // One entry per distinct ID, so a divergent geometry counts once rather
    // than twice. `payloadUnion` is sorted, so the encoding kept for an ID is
    // the lexicographically first of its encodings. That choice is ARBITRARY
    // — the point of an ID with several encodings is that there is no right
    // one — and it is made only because it is deterministic, which is what
    // makes two runs comparable. Where the encodings differ, read the
    // divergence counters rather than these totals.
    let vertexFloats = 0
    let triangles = 0

    for ( const encodings of payloadsById.values() ) {

      const parts = encodings[ 0 ].split( ':' )

      vertexFloats += Number( parts[ 1 ] )
      triangles += Number( parts[ 2 ] ) / 3
    }

    const digest = createHash( 'sha256' )
        .update( union.join( '\n' ) )
        .update( '\u0000' )
        .update( payloadUnion.join( '\n' ) )
        .digest( 'hex' )

    if ( referenceDigest === void 0 ) {
      referenceDigest = digest
      referenceWall = wallMs
    }

    const matched = digest === referenceDigest

    if ( referenceUnion === void 0 ) {
      referenceUnion = union
      referencePayloads = payloadUnion
      referenceFirstBatch =
        results.reduce( ( sum, r ) => sum + r.firstBatchMs, 0 )
      referenceWork = results.reduce( ( sum, r ) => sum + r.payloads.length, 0 )
      referenceVertexFloats =
        results.reduce( ( sum, r ) => sum + r.vertexFloats, 0 )
    }

    // Duplicate placements are invisible to missing/extra, which are set
    // differences: a placement TWO shards both delivered is in the reference
    // set and in the sharded set, so the classic partition failure — every
    // shard doing everything — reports "missing 0, extra 0". The multiset
    // length against the set length is what catches it, so it is computed on
    // every run rather than only on a mismatch.
    const shardedSet = new Set( union )
    const duplicatePlacements = union.length - shardedSet.size

    // What a mismatch actually is, not just that there is one.
    //
    // This path had never executed before D3D: `process` here is an ESM
    // NAMESPACE (`import * as process`), whose properties are read-only, so
    // the `process.exitCode = 1` that used to sit above threw a TypeError and
    // took the run down before it printed a single timing — the union check
    // could detect a bad partition but never report one. Assign through
    // globalThis, and print the timings and a decomposition FIRST, so a
    // mismatch is a diagnosis rather than a crash.
    let detail = ''

    if ( !matched ) {

      const referenceSet = new Set( referenceUnion )
      const missing = referenceUnion.filter( ( key ) => !shardedSet.has( key ) )
      const extra = union.filter( ( key ) => !referenceSet.has( key ) )
      const referencePayloadSet = new Set( referencePayloads )
      const payloadSet = new Set( payloadUnion )

      // BOTH directions. Counting only `sharded \ reference` reports 0 for a
      // pool that LOSES geometry — the more serious of the two failures, and
      // the one the D3D numbers turned out to contain.
      const encodingsNotInReference =
        payloadUnion.filter( ( key ) => !referencePayloadSet.has( key ) ).length
      const encodingsNotRebuilt =
        referencePayloads.filter( ( key ) => !payloadSet.has( key ) ).length

      // And by ID, because an ID no shard ever built and an ID that came out
      // DIFFERENT are two different engine bugs — a visibility hole versus a
      // shard-dependent build — and an encoding-level count conflates them.
      const referenceById = groupPayloadsById( referencePayloads )
      let idsOnlyInSharded = 0
      let idsChanged = 0

      for ( const [ id, encodings ] of payloadsById ) {

        const reference = referenceById.get( id )

        if ( reference === void 0 ) {
          ++idsOnlyInSharded
        } else if ( encodings.join( '\u0000' ) !== reference.join( '\u0000' ) ) {
          ++idsChanged
        }
      }

      let idsNotRebuilt = 0

      for ( const id of referenceById.keys() ) {

        if ( !payloadsById.has( id ) ) {
          ++idsNotRebuilt
        }
      }

      detail =
        `\n       placements ${union.length} vs ${referenceUnion.length} ` +
        `(missing ${missing.length}, extra ${extra.length}, ` +
        `duplicated ${duplicatePlacements})` +
        `\n       payload encodings ${payloadUnion.length} vs ` +
        `${referencePayloads.length} (${encodingsNotInReference} not in the ` +
        `reference, ${encodingsNotRebuilt} of the reference's not reproduced)` +
        `\n       geometry IDs ${payloadsById.size} vs ${referenceById.size} ` +
        `(${idsOnlyInSharded} the reference never built, ` +
        `${idsNotRebuilt} no shard reproduced, ${idsChanged} built differently)`
    }

    const verdict = ( matched ?
      'OK   union matches the single-worker load' :
      'FAIL union DIFFERS from the single-worker load (placements or payloads)' ) +
      detail

    const slowestGeometry = Math.max( ...results.map( ( r ) => r.geometryMs ) )
    const slowestOpen = Math.max( ...results.map( ( r ) => r.openMs ) )

    // Three duplication factors, because one of them cannot carry the claim
    // that gets made from it.
    //
    // `dupWall` is summed shard geometry time against the single worker's.
    // It is WALL time (`performance.now()` around each shard's pump), not
    // CPU: no `getrusage`, no per-thread clock. So it answers "how much more
    // shard-time did the partition spend" and CANNOT separate its two causes
    // — each shard doing twice the work, versus each shard running at half
    // speed against the same work under memory-bandwidth or cache contention.
    // Both land as 2.0x. Reading a mechanism off it alone is the error this
    // script previously invited by calling it CPU.
    //
    // `dupWork` and `dupVerts` are immune to that, because they count WORK
    // rather than time: how many geometries the shards built in total, and
    // how many vertex floats those came to, both against the single worker's
    // own totals. The per-shard counters accumulate over unique geometries
    // only (the `payloads` map guards re-entry), so a shard's contribution is
    // what it BUILT, not what it instanced. `dupWork ~= dupWall` means the
    // loss is rebuilt geometry; `dupWork ~= 1` with `dupWall ~= N` means the
    // shards each did their own share and simply ran slower, which is
    // contention and wants a completely different fix.
    const totalGeometry = results.reduce( ( sum, r ) => sum + r.geometryMs, 0 )
    // `dupFirstBatch` is the third term, and it is named for the window it
    // times rather than for a mechanism, because it is a MIXTURE: replicated
    // demand prep, the dispatch-key pass that only a sharded worker runs at
    // all, one batch of BATCH_SIZE products of geometry, and — being wall
    // time — contention, exactly as `dupWall` is. The N=1 reference in its
    // denominator takes `ensureDemandWorklists_`'s unsharded early return, so
    // it never computes a key; the ratio is therefore NOT "the same prep, N
    // times", and reading it as replication overcharges replication by
    // whatever the key pass costs. `--prep-probe` splits it — and splits it
    // per worker, because the shards and the unsharded reference do not pump
    // the same products, so the split cannot be done by differencing this
    // ratio's own terms either.
    const totalFirstBatch =
      results.reduce( ( sum, r ) => sum + r.firstBatchMs, 0 )
    const totalWork = results.reduce( ( sum, r ) => sum + r.payloads.length, 0 )
    const totalVertexFloats =
      results.reduce( ( sum, r ) => sum + r.vertexFloats, 0 )
    const wasmMb = results.map( ( r ) => ( r.wasmHeapBytes / 1048576 ).toFixed( 0 ) )
    const v8Mb = results.map( ( r ) => ( r.v8HeapBytes / 1048576 ).toFixed( 0 ) )

    if ( referenceGeometry === void 0 ) {
      referenceGeometry = slowestGeometry
    }

    // Labelled `sweep` in the output because that is what VmHWM is here: it
    // never falls, every worker count runs in this one process, and the main
    // thread holds the reference union throughout. See `peakRssMb`.
    const sweepPeakRss = await peakRssMb()

    console.log(
        `workers=${count} wall=${( wallMs / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceWall / wallMs ).toFixed( 2 )}x) ` +
        `open=${( slowestOpen / MS_PER_S ).toFixed( 1 )}s ` +
        `geometry=${( slowestGeometry / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceGeometry / slowestGeometry ).toFixed( 2 )}x, ` +
        `eff=${( referenceGeometry / ( slowestGeometry * count ) ).toFixed( 3 )}, ` +
        `dupWall=${( totalGeometry / referenceGeometry ).toFixed( 2 )}x, ` +
        `dupWork=${( totalWork / referenceWork ).toFixed( 2 )}x, ` +
        `dupFirstBatch=${( totalFirstBatch / referenceFirstBatch ).toFixed( 2 )}x, ` +
        `dupVerts=${( totalVertexFloats / referenceVertexFloats ).toFixed( 2 )}x) ` +
        `instances=${union.length} (duplicated ${duplicatePlacements}) ` +
        `per-shard=${results.map( ( r ) => r.placements.length ).join( '/' )} ` +
        `shard-geometry=${results.map( ( r ) =>
          ( r.geometryMs / MS_PER_S ).toFixed( 1 ) ).join( '/' )}s ` +
        `shard-built=${results.map( ( r ) => r.payloads.length ).join( '/' )} ` +
        `shard-firstBatch=${results.map( ( r ) =>
          ( r.firstBatchMs / MS_PER_S ).toFixed( 1 ) ).join( '/' )}s ` +
        `wasm=${wasmMb.join( '/' )}MB v8=${v8Mb.join( '/' )}MB(instant) ` +
        `sweepPeakRss=${sweepPeakRss === void 0 ? 'n/a' :
          `${sweepPeakRss.toFixed( 0 )}MB`}` )

    console.log( `  ${verdict}` )

    // Asserted, not gated. This line exists BECAUSE a timing line cannot
    // distinguish a fast run from a skipped one, so `if ( vertexFloats > 0 )`
    // gave it the one failure mode it must not have: a payload format change
    // makes `Number( parts[ 1 ] )` NaN, `NaN > 0` is false, and the proof
    // line vanishes silently — indistinguishable from running an older build.
    if ( !Number.isFinite( vertexFloats ) || vertexFloats <= 0 ) {
      throw new Error(
          `the payload entries decode to ${vertexFloats} vertex floats, so ` +
          'this run cannot prove it built any geometry; the entry encoding ' +
          'and this reader have diverged' )
    }

    console.log(
        `  geometry built: ${( vertexFloats / 6 ).toLocaleString( 'en-US' )} ` +
        `vertices (at 6 floats each), ` +
        `${triangles.toLocaleString( 'en-US' )} triangles, ` +
        `${payloadsById.size.toLocaleString( 'en-US' )} unique geometries by ` +
        `ID, ${payloadUnion.length.toLocaleString( 'en-US' )} payload ` +
        `encodings` )

    // After the report, never before it: a wrong partition is not a slow
    // result, and anything scripting this must not keep the timings — but a
    // human reading the output needs them to work out WHY it is wrong.
    if ( !matched ) {
      globalThis.process.exitCode = 1
    }
  }
}
