# Measuring memory and time in the perf bench

What the benchmark records, why each metric exists, what we deliberately
do **not** record, and the rule for changing any of it.

Written after conway#552, when a bad measurement produced a false
"conway#550's numbers don't reproduce" alarm that cost a round trip. The
numbers were fine; the methodology used to check them was not.

## The rule for changing fields

**Comparability is a preference, not a constraint.** Carry columns
forward when you can, but adding, removing or redefining a field is fine
when the new methodology is better — a metric that measures the wrong
thing consistently is worth less than one that measures the right thing
from today.

Two obligations come with that freedom:

1. **Record the choice here**, in this file, with the reasoning and the
   evidence. A column whose meaning changed silently is worse than no
   column, because it invites a delta across the change.
2. **A missing column must read `N/A`, never a fabricated value.** This
   is not hypothetical: `gen_delta_csv.cjs`'s `parseValue` once returned
   `0.0` for a missing value, so a snapshot lacking `geometryMemoryMb`
   differenced as `-185.836` for SKYLARK250 — a phantom 100% memory win,
   on precisely the model someone reads that delta for. Fixed in #548;
   `src/scripts/perf_csv_quoting.test.ts` pins it. Any new column
   inherits that obligation.

Baselines do not need re-blessing when a column is added — the next rc
picks it up, and older snapshots difference as `N/A` against it.

## Peak and delta answer different questions

Both matter; neither substitutes for the other.

- **Peak** — the high-water mark. Answers *does this survive?* A tab dies
  at its peak, not its average. SKYLARK250 was a peak-and-stall failure.
- **Delta** — retained across a full load and teardown. Answers *do we
  leak?* Share loads models repeatedly into one long-lived tab, so
  retention compounds in a way a single load never shows.

A retained-delta would have looked healthy on SKYLARK while the tab
froze. A peak says nothing about whether the third load in a session
starts from a clean floor. Record both.

## The metrics

### Process-level

| column | source | peak or instant |
|---|---|---|
| `peakRssMb` | `process.resourceUsage().maxRSS` | **peak** (kernel-maintained) |
| `rssMb` | `process.memoryUsage().rss` | instant |
| `heapUsedMb`, `heapTotalMb` | `process.memoryUsage()` | instant |
| `externalMb`, `arrayBuffersMb` | `process.memoryUsage()` | instant |

`peakRssMb` is free: the kernel already maintains the high-water mark, so
reading it costs nothing and perturbs nothing. `process.resourceUsage().maxRSS`
agrees with `/proc/self/status` `VmHWM` and needs no `/proc`, so it works
off Linux too. Note it is in **kB**, not bytes.

`peakRssMb` is not merely decorative next to `rssMb`. On the native CLI the
perf row is usually written at the load's peak by construction, so the two
often agree to 2dp — but not always: `House Aarburg IFC (1).ifc` records
peak **264.70** against end-of-load **260.44**. The gap is wherever a
release happens before the sample, which is the normal case on the loader
path (`model.invalidate(true)` runs before `setMemoryStatistics`).

`externalMb` / `arrayBuffersMb` matter more than they look. `arrayBuffers`
is a subset of `external`, and it is where Node puts Buffers and
TypedArrays — including the source file. Measured on MB-Khaya (31 MB
IFC), the source lands almost entirely in `arrayBuffers` and is
**completely invisible to `heapUsed`**.

### Native / wasm

| column | source | what it is |
|---|---|---|
| `peakWasmHeapMb` | `wasmHeapByteLength()` | wasm linear-memory high-water |
| `geometryMemoryMb` | `calculateGeometrySize()` | vertex+index **payload** |

**Three native quantities exist and must never be collapsed.** They differ
by an order of magnitude. `geometry_residency.ts` records an 8 MB live set
sitting under an **85 MB** wasm heap on MB-Khaya — the gap being allocator
overhead, fragmentation, and the intermediate buffers a boolean leaves
behind.

1. **wasm heap high-water** (`peakWasmHeapMb`) — everything the linear
   memory ever grew to, overhead included. The "did it fit" number.
2. **payload** (`geometryMemoryMb`) — what a consumer would copy out.
3. **live native allocation** (the native's own `getAllocationSize`) —
   what the residency budget governs. Not currently a perf column; see
   `design/new/memory-residency.md` for why that is the honest unit for a
   ceiling.

One real MB-Khaya load through the IFC CLI, all four measured together:

| quantity | value |
|---|---|
| payload (`geometryMemoryMb`) | 16.8 MB |
| wasm heap high-water (`peakWasmHeapMb`) | 101.6 MB |
| external / arrayBuffers | 58.2 / 56.3 MB |
| RSS | 515.7 MB |

No ratio converts one into another, and `box.ifc` shows why trying would be
worse than useless: payload **0.00 MB** under a **16.00 MB** heap, which is
just the initial arena. A column labelled only "geometry memory" invites
exactly this conflation, so the log line keeps them distinct and a test
pins that it does.

`wasmHeapByteLength` is **grow-only**, which is exactly why it is the
right peak metric and the wrong controller input. The residency doc spells
out the second half: a budget driven by it "would evict once, observe no
change, and evict everything." The first half is what we use here — being
grow-only makes it a high-water mark for free, with no sampling.

Use `wasmHeapByteLength`, **not** `HEAPU8.length`: the module's cached view
can be a growth step behind the real heap (#485), and a high-water figure
that under-reports is worse than none.

## Rejected: `total = heapUsed + external` as the headline

A reasonable-sounding suggestion — track a JS-side total instead of RSS,
on the grounds that it is more portable and less noisy. Measured against a
real conway load, it is structurally blind to the thing this bench exists
to track. MB-Khaya, post-GC per stage:

| stage | rss | heapUsed | external | arrayBuffers | total (h+e) |
|---|---|---|---|---|---|
| baseline | 105.7 | 19.8 | 1.7 | 0.1 | 21.5 |
| after readFileSync | 137.1 | 19.8 | 33.1 | 31.5 | 52.9 |
| after parse | 191.8 | 20.0 | 47.9 | 46.3 | 67.9 |
| **after wasm init** | **256.9** | 25.2 | **49.6** | 47.8 | 74.9 |
| after geometry | 510.5 | 225.9 | 58.1 | 56.3 | **284.0** |

At the geometry stage `total` reads 284.0 MB against RSS 510.5 MB — it
misses 44% of the process. The wasm-init row shows why: **+65 MB of RSS
while `external` moves under 2 MB.** Emscripten's wasm heap does not
surface in Node's ArrayBuffer accounting, so a JS-side total cannot see
conway's geometry engine at all.

The portability argument does not hold either — `process.memoryUsage().rss`
is available on every platform Node supports. The real argument for
JS-side accounting is *lower noise*: RSS carries allocator fragmentation
and pages not yet returned to the OS. That argues for recording both,
which we do. It does not argue for dropping the only process-level column
that sees native memory.

So: record `heapUsed`, `external` and `arrayBuffers` as their own columns.
Do not derive a `total` from them and do not treat it as a stand-in for
RSS. `peakWasmHeapMb` is what makes the native side visible.

## Sampling: GC before you look, and mind what it costs

`heapUsed` sampled without a collection is live set *plus* whatever
garbage GC has not reached. On a model that allocates hard this is not a
rounding error — SKYLARK250 reads **2547 MB** un-GC'd against **981 MB**
as post-GC live heap. A 2.6× difference from sampling alone, and the
direct cause of the #552 false alarm.

No always-on perf column forces GC — the peaks above are all free. This
settle is the rule for **probes and any opt-in live-heap pass**, and the
standard to hold a one-off measurement to before quoting its number.

Settle with:

```js
global.gc(); await new Promise((r) => setImmediate(r)); global.gc()
```

Each part earns its place. Two collections catch objects whose freeing
makes more garbage unreachable. The interleaved turn lets queued frees
actually run — notably ArrayBuffer backing-store release, without which
`external` reads high. One GC plus an idle turn is not enough on its own
(V8's GC has concurrent phases, so a turn does not imply a finished
collection); two back-to-back GCs with no turn between is not enough
either.

**Forced-GC sampling perturbs timing badly.** This is a hard constraint,
not a caveat: a run that samples live heap at frequency cannot also
produce trustworthy timing columns. Peak RSS and peak wasm heap are free
and carry no such cost, which is why they are the always-on peaks; live-heap
peak sampling belongs in an opt-in pass writing its own CSV, explicitly
not joined to timing from the same run.

This is also why conway#550's four SKYLARK figures came from **three
separate runs** — memory, timing, and event-loop cadence each measured in
a mode that invalidates the others. Someone later tried to reproduce all
four in one combined run, got numbers that disagreed with all of them, and
filed a false contradiction. **Any quoted benchmark figure should say which
run produced it.**

## Known caveat: `geometryMemoryMb` differs by pipeline

The IFC CLI and the IFC regression child report **different**
`geometryMemoryMb` for the same model — 16.8 vs 22.3 MB on MB-Khaya. Same
function, sampled at different points in two pipelines that run with
different CSG options.

This predates #552 and was not introduced by it, but it means the column is
only comparable **within** a pipeline. Do not difference a CLI figure
against a regression-child figure. Tracked separately.

## Changelog of methodology changes

| when | change | why |
|---|---|---|
| ≤1.451.1357 | `geometryMemoryMb` populated | headless path measured it |
| 1.451 → 1.543 | `geometryMemoryMb` silently became `N/A` | the conway-native perf writers never emitted it; the gap was written into a test as intended behaviour rather than fixed |
| #548 | delta stops fabricating values for missing columns | `parseValue` returned `0.0`; see "The rule for changing fields" |
| #552 (via #553) | add `peakRssMb`, `externalMb`, `arrayBuffersMb`, `peakWasmHeapMb`; restore `geometryMemoryMb` | memory was one un-GC'd instant, and the wasm heap was invisible |
| #554 | *open* — retention across a load/teardown cycle | nothing measures what is held after teardown |

Restoring `geometryMemoryMb` checks out against history: SKYLARK250 reads
**185.22** against the **185.836** recorded at 1.451.

## Related

- `design/new/memory-residency.md` — the residency budget, and why live
  native allocation rather than heap high-water is the unit for a ceiling
- `design/new/ci-regression-cost.md` — CI tiering, the rc / re-bless / LFS runbook
- `regression/README.md` — corpus, digest CSVs, smoke subset vs rc pass
