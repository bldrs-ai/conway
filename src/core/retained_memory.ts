/**
 * Settled process-memory sampling for the retention columns (conway#554).
 *
 * The perf bench's other memory columns answer "does this survive?" — peaks,
 * and end-of-load instants. This one answers "do we leak?": what is still
 * held after a load has been torn down. Share loads models repeatedly into
 * one long-lived tab, so retention compounds in a way a single load never
 * shows, and it is invisible to every peak. See
 * design/new/perf-measurement.md §"Peak and delta answer different questions".
 *
 * A retention figure is a DIFFERENCE between two samples, so both of them
 * have to be settled or the difference is GC timing rather than retention.
 * SKYLARK250 reads 2547 MB un-GC'd against 981 MB as post-GC live heap — a
 * 2.6x spread from sampling alone, which is larger than any leak this is
 * meant to find. Hence `settleAndSampleMemory` is the only sampler here:
 * there is deliberately no un-settled variant to reach for.
 *
 * When `global.gc` is not exposed the settle cannot run, and every caller
 * must emit N/A rather than a number. That is why the sampler returns
 * `undefined` instead of falling back to an unsettled `process.memoryUsage()`
 * — an unsettled retention figure is noise wearing a number, and would be
 * read as a leak signal. Same family as the `parseValue` -> `0.0`
 * fabrication conway#548 fixed.
 */

// Bytes per megabyte, for the MB conversions the perf columns are in.
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_MB = 1024 * 1024

/** globalThis as it looks when node runs with `--expose-gc`. */
type GlobalWithGc = typeof globalThis & { gc?: () => void }

/**
 * A settled sample of the three process-memory quantities a retention delta
 * is taken over. Bytes, straight out of `process.memoryUsage()`.
 *
 * `heapUsed` and `external` are disjoint (`external` holds the ArrayBuffer
 * backing stores and other off-heap bytes V8 knows about) and neither sees
 * the wasm heap, which is why RSS is here as well rather than being derived.
 */
export interface SettledMemorySample {

  /** Resident set size in bytes. */
  rssBytes: number

  /** V8 live heap in bytes, post-collection. */
  heapUsedBytes: number

  /** Off-heap bytes V8 accounts for, post-collection. */
  externalBytes: number
}

/** A retention delta, in MB, over one load/teardown cycle. */
export interface RetainedMemoryMb {

  /** RSS held after teardown, over the pre-load baseline. */
  rssMb: number

  /** V8 live heap held after teardown, over the pre-load baseline. */
  heapUsedMb: number

  /** Off-heap bytes held after teardown, over the pre-load baseline. */
  externalMb: number
}

/**
 * The forced-collection hook, when the host exposes one.
 *
 * Node only defines `global.gc` under `--expose-gc`; browsers only under
 * `--js-flags="--expose-gc"`. Absence is the normal case, not an error.
 *
 * @return {(() => void) | undefined} The collector, or undefined where the
 * host does not expose one.
 */
export function exposedGc(): ( () => void ) | undefined {

  const candidate = ( globalThis as GlobalWithGc ).gc

  return typeof candidate === 'function' ? candidate : void 0
}

/**
 * Whether a settled sample can be taken at all in this process, without
 * paying for a collection to find out.
 *
 * No production caller: every call site instead calls
 * `settleAndSampleMemory` and treats `undefined` as N/A, which is one branch
 * rather than two and cannot drift out of agreement with the sampler. This
 * stays exported as the cheap probe for tests that need to assert the
 * no-collector path without a collector present.
 *
 * @return {boolean} True where both the collector and node's memory
 * accounting are available.
 */
export function canSettleMemory(): boolean {

  return exposedGc() !== void 0 &&
    typeof process !== 'undefined' &&
    typeof process.memoryUsage === 'function'
}

/**
 * Settle the heap, then sample it.
 *
 * The settle is `gc(); await setImmediate(); gc()`, and each part earns its
 * place. Two collections catch objects whose freeing makes more garbage
 * unreachable. The interleaved turn is what lets queued frees actually run —
 * notably ArrayBuffer backing-store release, without which `external` reads
 * high, which matters here because `external` is one of the three sampled
 * quantities. One GC plus an idle turn is not enough on its own (V8's GC has
 * concurrent phases, so a turn does not imply a finished collection), and two
 * back-to-back GCs with no turn between is not enough either.
 *
 * This perturbs timing, so every call site must sit OUTSIDE the region that
 * produces `parseTimeMs` / `geometryTimeMs` / `totalTimeMs` — baseline before
 * the load starts, retained sample after teardown. That property is what
 * makes the retention columns free, and it is checkable by measurement: a run
 * with `--expose-gc` and a run without share identical code, so any movement
 * in the timing columns between them is down to the settle. The SIGN says
 * which way: gc-on slower is the settle leaking into the measured window,
 * which is a bug; gc-on faster is the pre-load settle taking engine-init
 * garbage OUT of that window. That is an absolute cost of about 10 ms per
 * load, measured as 13-16% of `parseTimeMs` on models that parse in ~60 ms
 * and unresolvable against one that parses in 578 ms, so read a ratio
 * against the model's own parse time. `rc-regression.yml` runs both
 * conditions in one job; see design/new/perf-measurement.md §"The settle
 * also cleans the window".
 *
 * @return {Promise<SettledMemorySample | undefined>} The settled sample, or
 * undefined where no collector is exposed — in which case the caller emits
 * N/A. Never returns an unsettled sample.
 */
export async function settleAndSampleMemory():
    Promise<SettledMemorySample | undefined> {

  const gc = exposedGc()

  if ( gc === void 0 || typeof process === 'undefined' ||
      typeof process.memoryUsage !== 'function' ) {

    return void 0
  }

  gc()

  await new Promise( ( resolve ) => setImmediate( resolve ) )

  gc()

  const usage = process.memoryUsage()

  return {
    rssBytes: usage.rss,
    heapUsedBytes: usage.heapUsed,
    externalBytes: usage.external,
  }
}

/**
 * The settled sample for a perf row, taken only when a perf row is coming.
 *
 * The gate is not an optimisation detail, it is the difference between
 * charging a cost to a run that uses it and charging it to one that does not.
 * `ifc_regression_batch_main.ts` launches EVERY regression child with
 * `--expose-gc`, not only the ones given `--perf`, so a child that settles
 * unconditionally makes a digest-only run pay two forced full collections per
 * model for a figure `writePerfCsvIfRequested` immediately discards. Measured
 * on node 22: one settle costs ~0.8 s on a 500 MB live heap and ~1.6 s on a
 * 1 GB one.
 *
 * It lives here rather than inlined at each call site so both regression
 * children share one definition of "is retention wanted", and so it can be
 * pinned by a test — an unnecessary settle is invisible in the output, so
 * nothing downstream would catch a regression to an unconditional one.
 *
 * @param perfPath The child's `--perf` destination. Empty means no perf row
 * is being written, so no sample is taken and no collection is forced.
 * @return {Promise<SettledMemorySample | undefined>} The settled sample, or
 * undefined when no perf row is wanted or no collector is exposed.
 */
export async function settleAndSampleMemoryForPerf(
    perfPath: string ): Promise<SettledMemorySample | undefined> {

  return perfPath.length !== 0 ? settleAndSampleMemory() : void 0
}

/**
 * Difference two settled samples into the retention columns.
 *
 * Deltas are signed and may legitimately come out negative: a cycle can end
 * with the allocator holding less than the baseline did, and rounding that up
 * to zero would hide exactly the direction a fix is trying to move.
 *
 * @param baseline The settled sample taken before the load.
 * @param retained The settled sample taken after teardown.
 * @return {RetainedMemoryMb | undefined} The retention delta in MB, or
 * undefined when either sample is missing (the settle could not run).
 */
export function retainedMemoryMb(
    baseline: SettledMemorySample | undefined,
    retained: SettledMemorySample | undefined ): RetainedMemoryMb | undefined {

  if ( baseline === void 0 || retained === void 0 ) {
    return void 0
  }

  return {
    rssMb: ( retained.rssBytes - baseline.rssBytes ) / BYTES_PER_MB,
    heapUsedMb:
      ( retained.heapUsedBytes - baseline.heapUsedBytes ) / BYTES_PER_MB,
    externalMb:
      ( retained.externalBytes - baseline.externalBytes ) / BYTES_PER_MB,
  }
}
