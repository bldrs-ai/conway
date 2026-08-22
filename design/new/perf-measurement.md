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

Since conway#554 we do. The delta half is three columns —
`retainedRssMb`, `retainedHeapUsedMb`, `retainedExternalMb` — described
under "Retention" below.

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

### Retention (conway#554)

| column | source | peak, instant or delta |
|---|---|---|
| `retainedRssMb` | settled `memoryUsage().rss` | **delta** |
| `retainedHeapUsedMb` | settled `memoryUsage().heapUsed` | **delta** |
| `retainedExternalMb` | settled `memoryUsage().external` | **delta** |

Each is one settled sample taken **after the model was torn down** minus
one settled sample taken **before the load began**, so it is what a full
load/teardown cycle left behind. They are the only columns in the file
that answer *do we leak?*; every other memory column answers *does this
survive?*, and a leak that fits inside the peak is invisible to all of
them.

They are **signed**. A cycle can legitimately end below its baseline,
and clamping that at zero would make an improvement indistinguishable
from no change.

They read **`N/A` wherever `global.gc` was not exposed**. See
"`--expose-gc`" below.

**The shape: option 1, load → teardown → settle → sample, same
process.** conway#554 listed three options, the other two being N
repeats of one model and N different models in sequence. Option 1 was
chosen. The consequence worth stating is that one cycle *is* one
model-load, so retention is a per-model figure and belongs as ordinary
columns on `performance-detail.csv` rather than in a CSV of its own.
The repetition options remain the way to catch slow accumulation that a
single cycle rounds away; this does not close that off.

**Where the boundaries are.**

- *Teardown* is `model.invalidate(true)`. On the loader path that call
  already existed (`src/loaders/conway_model_loader.ts`). On the
  regression children it did **not** — the CLIs both called it after
  extraction and the children simply ran to process exit — so #554
  added it. That is recorded rather than glossed: without a teardown
  boundary there is nothing to measure retention *across*, and a sample
  taken at that point would be a strictly larger figure than what
  survives the call. It runs after the perf figures are captured and
  before the digest; `invalidate` drops JS-side caches that
  rematerialise on demand, and the digests are byte-identical with and
  without it (checked on AC20-FZK-Haus and DSA2).

  **Read "teardown" as exactly that call, not as "drop all
  references."** `invalidate(true)` clears the vtable builder, the
  descriptor cache, the module-level scratch parsing buffer and the
  lazy fields of complex entries (`src/step/step_model_base.ts`). It
  does **not** touch `geometry`, `voidGeometry`, `curves`, `profiles`,
  `materials` or the source buffer, and it cannot: the digest below it
  iterates all of those, so they have to survive. The model payload
  `geometryMemoryMb` measures is therefore *inside* every retention
  figure, and so is the source `Buffer`. That is the metric working as
  defined rather than a flaw in it — those bytes genuinely are still
  held at the sample point — but it has a consequence worth stating
  before anyone reads a trend: **a change that makes the live model
  bigger moves these columns in the same direction a leak does.** Use
  them to compare one pipeline against its own history, and read a
  movement alongside `geometryMemoryMb` before calling it a leak.
- *Baseline* is after engine/wasm init and immediately before the load,
  not at process start. Sampling before init would fold the wasm
  module's fixed cost into every model's retention and make them all
  look leaky by the same constant.

**One place the baseline cannot be where that rule wants it**, worth
knowing before reading a number (the teardown caveat above is a second,
and applies on every path): the **loader path** brings up its own
`ConwayGeometry` per load, *inside* the region `allTimeStart` opens, so
there is no point that is both after init and outside the timed region.
The baseline is taken at function entry instead — which keeps the
no-perturbation property, at the cost of counting that per-load module
against the cycle. Nothing releases it, so that is a real retention on
that path, but it is a large constant sitting on top of the
model-specific figure.

**The IFC regression child used to be a second such place, and conway#557
fixed it.** It initialised one engine in `main()` and then
`geometryExtraction` constructed a *second* one, which was the engine the
extraction actually ran against — so the engine that was initialised
before the baseline was not the engine that did the work, and the second
engine's whole footprint landed inside the window. Measured on MB-Khaya
before the fix: telemetry engine 16,777,216 bytes of untouched initial
arena, extraction engine 106,496,000 bytes, `sameObject=false`. The
extraction now runs against the module-level engine, the way the AP214
child always has, and the constant comes off every IFC row: MB-Khaya
`retainedRssMb` 379.58/385.60/388.59 over three runs before, against
326.48/326.94/327.02/329.23/333.11/333.24 over six after; index.ifc
58.96 -> 2.38, AC20-FZK-Haus 95.77 -> 36.35, duplex 97.73 -> 42.52,
Schependomlaan 371.75 -> 308.89 — a ~55-60 MB fixed term regardless of
model size, which
is what a second engine looks like. Digests were byte-identical on all
seven models checked. `peakRssMb` drops by the same term, and
`geometryTimeMs` loses the second `initialize()` that sat inside the
timed region (IfcOpenHouse_IFC4 156 -> 70 ms), so the **rc baselines for
those columns move once** with that fix.

So, as with `geometryMemoryMb`, **do not difference a retention figure
between the loader path and a regression child** — the loader's per-load
module is a constant one side carries and the other does not. The two
regression children are now the same shape as each other: one engine,
initialised before the baseline, growing inside the window as the model
loads. Within one pipeline the figure is stable: six MB-Khaya runs
through the IFC child after #557 gave `retainedRssMb` 326.48-333.24,
`retainedHeapUsedMb` 9.72-9.78, `retainedExternalMb` 46.19 every time.
(Before #557 the recorded five-run check read 382.86-390.98 /
10.76-10.80 / 47.77 — stable then too, around a centre that included the
second engine.)

What remains inside the window on both children is the *growth* of the
one engine's linear memory during the load — MB-Khaya's arena goes from
16 MB at the baseline to the 101.56 MB `peakWasmHeapMb` reports, and
emscripten never gives it back. That is a real cost of loading the model,
not a measurement artefact, and it is symmetric across the two children.

**No `retainedWasmHeapMb`.** conway#554 proposed one and it is
deliberately excluded. `wasmHeapByteLength` is grow-only — it does not
fall when natives are freed — so over a single cycle a "retained wasm
heap" would always equal `peakWasmHeapMb` wearing a different name. A
metric whose name lies about what it measures is exactly what this file
exists to prevent. The wasm side is covered by `peakWasmHeapMb`. A
genuine native-retention figure needs live allocation (the native's own
`getAllocationSize`, the third quantity in the table above), which is a
larger change.

### `--expose-gc`, and the N/A fallback

The settle needs `global.gc`, which node only defines under
`--expose-gc`. Before #554 nothing in the repo passed it, so the
retention columns could not have been measured at all.

Both halves of the decision are implemented:

- **The flag is passed.** `ifc_regression_batch_main.ts` launches every
  regression child with it, and `scripts/benchmark.cjs` puts it in the
  render server's `NODE_OPTIONS`. `CONWAY_PERF_EXPOSE_GC=0` (also
  `false`, `off`) turns it off in both places — see the A/B below for
  why that switch exists.
- **`N/A` is emitted where it is absent.** `settleAndSampleMemory`
  returns `undefined` rather than falling back to an unsettled
  `process.memoryUsage()`, and every writer turns that into `N/A`.

That fallback is not a nicety. An unsettled retention figure is
GC-timing noise wearing a number, and it would be read as a leak
signal — the same family as the `parseValue` -> `0.0` fabrication #548
fixed. SKYLARK250's 2547 MB un-GC'd against 981 MB settled is the scale
of noise on offer.

Passing the flag was measured before it was adopted, on #554: MB-Khaya
through the IFC path, flag passed but no `gc()` call anywhere,
off/on interleaved with the page cache pre-warmed, moved geometry time
by 31 ms against a 375 ms within-group spread, sign flipping between
stages. (A first pass suggested a 10% speedup; all the off-runs had run
first, so a cold page cache loaded the first sample. Interleaving
removed it entirely.)

### The timing property, and how to check it by measurement

**Both samples sit outside the timed region** — baseline before the
load starts, retained sample after teardown — so the forced collections
never run inside the window that produces `parseTimeMs` /
`geometryTimeMs` / `totalTimeMs`. This is the whole reason option 1
costs nothing, and unlike live-heap peak sampling it is a property that
can be *tested* rather than asserted: with the code identical, a run
with `--expose-gc` and a run without differ only in whether the settle
executes.

- **Timing columns hold** -> the property is confirmed.
- **Timing columns move** -> the settle is leaking into the measured
  window, which is a bug to fix before anything is blessed against
  those numbers.

Measured that way at implementation time, MB-Khaya through the IFC
regression child, five runs per side interleaved:

| | parse (mean of 5) | geometry (mean of 5) | total (mean of 5) |
|---|---|---|---|
| gc off | 578.2 ms | 4067.0 ms | 4645.2 ms |
| gc on | 588.0 ms | 4103.8 ms | 4691.8 ms |
| difference | +9.8 ms | +36.8 ms | +46.6 ms |
| within-group spread | 25-55 ms | 166-201 ms | 185-218 ms |

Every difference is well inside the spread of its own group, which is
what the design predicts. n=5 does not exclude an effect of about 1%;
it does exclude anything that would matter to a regression signal.

`CONWAY_PERF_EXPOSE_GC` exists so this A/B can be run against a released
build without editing code — otherwise "flag off" would mean "different
code", and the comparison would prove nothing about either variable.

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
| #554 | add `retainedRssMb`, `retainedHeapUsedMb`, `retainedExternalMb`; pass `--expose-gc` to the regression children and the render server; add the teardown the regression children never had | nothing measured what is held after teardown, and a peak cannot see it |
| #557 | IFC regression child extracts on the engine `main()` initialised, not a second one built in `geometryExtraction` | the alloc telemetry described an idle module, and the second engine put a ~55-60 MB constant in every IFC retention and RSS row plus its init in `geometryTimeMs`; those IFC baselines move once |

Restoring `geometryMemoryMb` checks out against history: SKYLARK250 reads
**185.22** against the **185.836** recorded at 1.451.

## Related

- `design/new/memory-residency.md` — the residency budget, and why live
  native allocation rather than heap high-water is the unit for a ceiling
- `design/new/ci-regression-cost.md` — CI tiering, the rc / re-bless / LFS runbook
- `regression/README.md` — corpus, digest CSVs, smoke subset vs rc pass
