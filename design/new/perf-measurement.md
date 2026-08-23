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
  why that switch exists, and "The A/B runs as two passes inside one rc
  job" for the one caller that sets it.
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
- **Timing columns move, gc on SLOWER** -> the settle is leaking into
  the measured window, which is a bug to fix before anything is blessed
  against those numbers.
- **Timing columns move, gc on FASTER** -> the opposite, and not a
  defect in the shipped configuration: the *control* pass is carrying
  pre-load garbage into the window the blessed pass entered clean. See
  "The settle also cleans the window" below, which is what the first
  measurement of this found.

The middle case is the one #554 wrote the switch for. The third was not
anticipated, and the rule above is stated with a sign because reading a
movement without one would have called a 13% parse difference a leak in
the measurement.

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

### The A/B runs as two passes inside one rc job — on demand

`.github/workflows/rc-regression.yml` can run the corpus **twice in one
`rebless` job**: the blessed pass in the shipped configuration, then a
control pass with `CONWAY_PERF_EXPOSE_GC=0`. `scripts/perf_ab_compare.cjs`
differences them into the job summary and the run's `perf-serial-*`
artifact.

**It is opt-in and off by default, because the comparison has been
made.** Run [32601886424][ab-run]'s public job executed both passes on
one runner: blessed 5m15s, control 5m06s. The settle costs about
**+2.9% of pass wall-clock** — one corpus, one run, both halves on the
same machine, which is the only comparison this question admits (see
below) — and it does not move the timing columns it was feared to move.
The decision off that measurement is that **the settle is always on
going forwards**, so a release no longer re-measures the control
condition. A tag push runs one pass; `workflow_dispatch` with
`perf_ab: true` runs both. Turn it on when the settle itself changes,
or when a timing movement needs explaining — the machinery is the only
valid way to ask, and it stays runnable rather than deleted.

One caveat on that +2.9%: it is the public corpus only. The control
pass has still never executed on private, because the run that would
have produced that figure died in the step before it.

[ab-run]: https://github.com/bldrs-ai/conway/actions/runs/32601886424

**Two separate rc runs cannot answer this, and that was the original
plan.** Two `run-ifc-regression` jobs an hour apart, on near-identical
code, came out with *every* model faster in the later run — median
**1.55x**, MB-Khaya 8039 -> 4745 ms, AC20-FZK-Haus 1524 -> 978 ms. A
third sample since read 7621 ms for MB-Khaya, so that one model's
`totalTimeMs` spans **8039 / 4745 / 7621** across three runs of
near-identical code, a 1.7x spread. The effect under test is about 1%.
A between-run comparison measures which runner the job landed on and
nothing else (#554, comment 5381287618).

Two passes in one job share a runner, a machine and a moment, so the
scale factor applies to both halves and cancels. The same confound is
why a **cross-version `*_delta.csv` timing column is a lead, not a
measurement**: a model that "got 30% faster between releases" may have
changed by nothing at all.

**The blessed pass is the default one, not the control.** The flag-on
pass is what ships, and its `perf.csv` is the only file passed to
`bless_perf_snapshot.cjs` or committed by the re-bless PR. The control
pass writes `perf-nogc.csv` and sends its digests to a scratch folder
outside the models checkout; blessing it would put a release's numbers
under a configuration nobody runs. Neither the failure gate nor the
zero-geometry gate is repeated — a second identical digest run yields
no extra signal — and the control pass reuses the same LFS checkout, so
the perf compute roughly doubles on the runs that ask for it, and the
bandwidth does not.

**What the second pass costs, and the cap it broke.** The private
corpus is the binding constraint: it runs about 4x the public one in
wall time, and it is where a per-model increment shows up first. Step
wall times, from the Actions step timestamps:

| pass | public | private |
|---|---|---|
| blessed digest, no settle (rc-1.549.1515) | 4m48s | **19m55s** |
| blessed digest, with the settle (rc-1.558.1533) | 5m15s | ~20m30s (est.) |
| gc-off control, with the settle (rc-1.558.1533) | 5m06s | never yet run |

Two facts are worth carrying forward. First, the settle's own cost
measured *within one run* is public 5m15s against 5m06s — **+2.9%** over
a full corpus, which is the corpus-scale version of the ~10 ms per load
in the tables above. Second, and the useful one for whoever next adds
per-model work: **the private digest step ran at 19m55s against a
20-minute `timeout-minutes` — 5 seconds of headroom — before this
change existed.** conway#556's settle added the ~35 s that tipped it,
and the first two-pass rc (run 32601886424) died there, killed by its
own cap. Both passes are now capped at 35 min and the job at 90; the
arithmetic is in `.github/workflows/rc-regression.yml`. With the A/B
opt-in, a release's private `rebless` job is back to ~25 minutes and a
`perf_ab` run is the ~45-minute one — but the 35-minute step cap is what
a plain rc depends on, since the pass that broke its cap is the blessed
one, which runs every time.

**What the pass order can and cannot confound.** Pass 2 runs on a
warmer machine than pass 1. Model file I/O is outside all three timing
columns — `parseStartMs` is taken after `readFileSync` in
`ifc_regression_main.ts` — so a warmer page cache cannot reach them
directly; what pass 2 does get is warmer node/wasm module loads and
whatever drift there is in runner contention. Read a small
control-is-faster result with that in mind, and reach for option 2 from
#554 (interleave the two conditions per model) if it ever needs to be
excluded properly.

### The settle also cleans the window

Measured while wiring the CI A/B up: 12 interleaved pairs on a dev
machine, four models through the IFC regression child, one batch run
per side per pair. Taken against pre-#557 code, so the absolute
`geometryTimeMs` figures below no longer reproduce — #557 removed a
second `initialize()` from inside that window (IfcOpenHouse_IFC4 156 ->
70 ms). It cannot touch the parse column: the second engine was
constructed in `geometryExtraction`, after `parseEndMs`.

| model | parse, gc on | parse, gc off |
|---|---|---|
| AC20-FZK-Haus.ifc (2.5 MB) | 58.75 ms (57-63) | 67.42 ms (58-76) |
| ISSUE_005_haus.ifc (2.5 MB) | 58.58 ms (57-62) | 70.08 ms (58-93) |
| IfcOpenHouse_IFC4.ifc (113 kB) | 13.00 ms | 13.42 ms |
| Sample_entities.ifc (29 kB) | 8.08 ms | 9.25 ms |

`geometryTimeMs` showed no consistent direction over the same 12 pairs
(398.5 vs 395.2, 390.8 vs 387.6, 158.6 vs 173.3, 102.4 vs 103.9), which
is the property holding. `parseTimeMs` did: **13-16% lower with the
flag on** on the two mid-size models, with the ranges barely
overlapping.

**It is an absolute cost, and it does not generalise up the corpus.**
The gap is 8.7 and 11.5 ms on the two 2.5 MB models and 0.4 and 1.2 ms
on the two small ones; the fraction reads 13-16% only because those two
parses take about 60 ms. The MB-Khaya table further up is the same
effect at the other end of the range and is *not* a contradiction of
this one: 578.2 ms gc-off against 588.0 ms gc-on, n=5 — the opposite
sign, and well inside a 25-55 ms within-group spread, which is what a
~10 ms shift looks like when it is 1.7% of the figure it is shifting.
So expect the corpus-wide median `parseTimeMs` ratio the rc job reports
to sit far nearer 1.00 than 0.85, weighted as it is by models that
parse in hundreds of ms, and read a per-model ratio against that
model's own parse time rather than against the percentage.

The mechanism is the pre-load settle, not the flag. `--expose-gc` alone
measured neutral in two separate experiments (#554). What moves parse
is that the settle's two collections run immediately before
`parseStartMs`, so the blessed pass enters the timed region with
engine-init garbage already collected while the control pass carries it
in and pays for it inside the window. Same reason the instant memory
columns move: `heapUsedMb` ran 5-11 MB *lower* with the flag on in
every one of the 12 pairs, and `rssMb` 6-9 MB lower. Those columns are
sampled at end of load, downstream of the baseline settle.

Two consequences worth stating before anyone reads a trend:

1. **`parseTimeMs` is not comparable across the #554 boundary** for
   anything that parses quickly. Older blessed snapshots were taken
   with no pre-load settle, so their parse figures carry a collection
   this one does not. A delta across that boundary shows a parse
   improvement that is a change of methodology, not of the parser —
   about 10 ms of it, so material on a 60 ms parse and lost in the
   noise on a 600 ms one. Same for `heapUsedMb` and `rssMb`, in the
   other direction. Distinct from the #557 boundary, which moves
   `geometryTimeMs` and the memory columns on IFC rows only.
2. **The control pass's memory columns are not a defect report.** Only
   the timing columns carry the question the A/B is asking; the memory
   rows in the comparison output are there so their (expected)
   movement is not read as one.

This is n=12 on one machine over four models. The corpus-wide figures
land in the first rc run that carries both passes, and that summary is
what should settle it.

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

## Resolved: `geometryMemoryMb` differs by pipeline, so the row says which

The IFC CLI and the IFC regression child report **different**
`geometryMemoryMb` for the same model — 16.8 vs 22.3 MB on MB-Khaya. Filed as
#555, predating #552 rather than introduced by it.

**The mechanism is the memoization capture mode, not CSG options** — the
issue guessed the latter, and the correct diagnosis is what changes the
resolution. `ifc_regression_main.ts` sets

```ts
RegressionCaptureState.memoization = MemoizationCapture.FULL
```

which is read in several places in `ifc_geometry_extraction.ts`. In the
boolean path it is what stops `dropNonSceneGeometry` / `voidGeometry.delete`
running on the two operands; at the end of the walk it is what stops
`model.geometry.deleteTemporaries()` and
`model.voidGeometry.deleteTemporaries()`. So the regression child's
`model.geometry` still holds every CSG intermediate and boolean operand when
`calculateGeometrySize()` sums it, and the CLI's does not. The ~30% is those
temporaries.

**So "make them agree" is off the table.** The digest below the perf capture
iterates `model.geometry`, and `FULL` is what puts the intermediates in front
of it — that is the regression's whole point. Dropping them to make one
number comparable would move digests, which costs far more than an ambiguous
column.

**The resolution is #555's other option: name the divergence.** Every perf row
carries a `writer` column — `ifc-regression`, `ap214-regression`, `ifc-cli`,
`ap214-cli`, `loader`.

`gen_delta_csv.cjs` then withholds a column when the two rows disagree on the
trait that column depends on. **Two traits, not a list of incomparable writer
pairs**, because that is the shape of the causes — `ifc-regression` differs
from `ap214-regression` in capture but not harness, and from `loader` in
harness but not capture, so a flat pair list would have to restate the
product:

| trait | what it is | columns scoped to it |
|---|---|---|
| `harness` | which process measured the row, and so what else was resident | `rssMb`, `peakRssMb`, `heapUsedMb`, `heapTotalMb`, `externalMb`, `arrayBuffersMb`, and the three retention columns |
| `capture` | `RegressionCaptureState.memoization` | `geometryMemoryMb` |

The harness scope is the snapshot README's own statement made operative: a
regression child's `rssMb` "excludes a GL context and a three.js scene graph",
and the loader carries a per-load `ConwayGeometry` the children do not.

**`peakWasmHeapMb` is deliberately in neither set**, and that is a
measurement rather than an omission. MB-Khaya through one extraction reads it
at **101.56 MB under both capture modes**, against a `geometryMemoryMb` of
16.82 vs 22.26 — the linear memory is a grow-only high-water and the
temporaries are allocated either way, so `FULL` only keeps the JS-side
handles. RSS moved 1 MB in 516 over the same pair, which is noise. Withholding
it would cost a real signal for a difference that does not exist.

Timing columns are likewise not scoped to harness: they are conway's own
stage clocks and broadly comparable on the same runner class. `totalTimeMs`
is the exception, for an unrelated reason — see the `#562` section below.

An **unknown** writer counts as comparable, not as a mismatch. Every snapshot
blessed before #555 has no such column, and treating absence as disagreement
would blank the entire history the delta exists to produce.

Three pairs are now distinguishable where the file previously implied one
quantity:

| pair | why they differ |
|---|---|
| IFC CLI vs IFC regression child | memoization capture: `OPTIMAL` vs `FULL` |
| IFC regression child vs AP214 regression child | same cause. `memoization` is a **process-global** and the children are separate processes, so only the IFC one raises it. A mixed IFC/STEP `perf.csv` has therefore always aggregated two capture modes into one column |
| loader vs either regression child | the retention caveat recorded above: the loader builds a `ConwayGeometry` per load, inside the window |

The middle row is worth stating because it is easy to assume the split is only
CLI-vs-regression. It has not been measured on a shared model — no corpus
model loads through both children — so it is a structural claim from the code,
not a number.

### What the delta had to be taught

Redefining a column is only half the job: the differ has to know where the
seam is, or it publishes the redefinition as a regression. `gen_delta_csv.cjs`
now decides per pair which quantity is actually comparable
(`comparableTotals`), and states the answer in a new `totalTimeMsBasis`
column:

| older row | newer row | differenced |
|---|---|---|
| pre-#562 regression (`stageSum`) | post-#562 regression (`wallClock`) | both sides' **stage sum** — older `totalTimeMs` against newer `parsePlusGeometryMs` |
| two post-#562 regression rows | | `totalTimeMs`, unchanged |
| two three.js-harness rows | | `totalTimeMs`, unchanged |
| **any row** | **a row from a different harness** | nothing — basis `crossHarness`. See below |

The stage-sum fallback is preferred over blanking because the first rc after
this change is precisely where a reader most wants to see that nothing moved,
and `.github/workflows/build.yml` sorts its regression table on
`totalTimeMsPercentageChange`. `engine1TotalTimeMs` / `engine2TotalTimeMs`
report the values actually differenced rather than the raw cells, so the row
the workflow prints is self-consistent.

### No total is comparable across two harnesses

Making `totalTimeMs` a wall clock everywhere did **not** finish the job #562
started, and this is worth stating plainly because it is the same defect one
level down: *"wall clock" is itself two quantities.* The harnesses bound the
interval differently, and `writer` says which pipeline produced a row but not
what its clock enclosed.

`ConwayModelLoader` opens `allTimeStart` and **then** builds and initialises a
per-load `ConwayGeometry` (`conway_model_loader.ts:158`, then `:194` / `:406`).
The regression child initialises its engine in `main()` and starts
`loadStartMs` immediately before the file read (`ifc_regression_main.ts:361`,
then `:454`). Engine init is inside one window and outside the other.

Measured, because "structurally different" does not say whether it matters. A
fresh `new ConwayGeometry()` + `initialize()` runs about **195 ms** (six runs:
178 / 182 / 189 / 195 / 232 / 655 ms, the outlier being the first wasm
compile). Against the regression child's own totals:

| model | child `totalTimeMs` | engine init as a share of it |
|---|---|---|
| `index.ifc` (18 kB) | 162 ms | **120%** |
| `haus.ifc` (2.5 MB) | 796 ms | **24%** |
| `MB-Khaya.ifc` (33 MB) | 4528 ms | **4.3%** |

So differencing across the harnesses reports the removal of engine
initialisation as an engine speedup, at a scale far above anything the release
table exists to flag, and worst on the small models where a real regression is
hardest to see anyway.

**`parsePlusGeometryMs` is not the escape hatch**, which was the obvious
candidate. Two reasons, both checked rather than assumed:

1. The loader path does not emit it at all — `benchmark.cjs` writes `N/A`
   because there is no such log line to scrape — so it would have to be
   manufactured from a sum.
2. The stage clocks it would sum are not the same intervals either. The
   child's parse clock opens before `parseHeader` where the loader times the
   header separately (`headerDataTimeStart`), and the child's geometry clock
   wraps `new IfcGeometryExtraction(...)` where the loader constructs it
   outside the timed region.

Substituting it would put a smaller version of the same defect back under a
new name, which is the thing this file exists to prevent. **A blank cell that
means "not comparable" is worth more than a number that means two different
things**, so the cell is blank and `totalTimeMsBasis` reads `crossHarness` to
say why.

The cost is one historical comparison — the transition from
`benchmark.cjs`-produced snapshots to bless-produced ones — and that is
precisely the comparison with no answer. Every release from here is
regression-against-regression and differences normally.

**`parseTimeMs` and `geometryTimeMs` are deliberately left comparable.** They
carry the smaller boundary differences in (2) above, and a harness difference
in CPU contention besides — the loader runs inside a three.js host holding a
GL context and a scene graph. But that residual has **not been measured**, and
the snapshot README's standing claim is that the stage clocks are broadly
comparable on the same runner class. So this withholds what there is evidence
for and records the rest as a caveat, rather than acting on a
plausible-sounding one. If it matters, measure it and widen the guard.

### Provenance of a row that predates the `writer` column

The table above needs to know which harness wrote a legacy row, and it can:
`bless_perf_snapshot.cjs` hardcodes `N/A` into `schemaVersion`,
`preprocessorVersion` and `originatingSystem` on every row it writes, because
`perf.csv` does not carry them, while `benchmark.cjs` scrapes all three out of
the IFC header. So a file with **any** populated value in those columns came
from the three.js harness and one with none came from a regression child
(`inferLegacyWriter`).

Decided per **file**, not per row: a FAIL row from either writer has all three
`N/A`. Stamped into a separate `inferredWriter` field rather than into
`writer`, so a guess and a statement stay distinguishable, and it never
overrides a stated writer.

This is inference, so it is confined to one function and pinned by tests. The
alternative — treating an unknown writer as comparable — is what the first
draft of #555 did, and it publishes the 16.8-vs-22.3 MB capture-mode gap as a
real change the moment a historical headless-three snapshot is differenced
against a regression-produced one.

## `totalTimeMs` is the load's wall clock, not the sum of the stage clocks

#562 §1. On both regression children `totalTimeMs` was

```ts
const totalTimeMs = geomEndMs - parseStartMs
```

with `geomStartMs` taken on the statement *after* `parseEndMs`. So it was
`parseTimeMs + geometryTimeMs` **by construction** — verified on the blessed
`conway1.451.1357-ci` snapshot, where
`totalTimeMs − (parseTimeMs + geometryTimeMs)` lands between 0 and 5 ms on all
46 OK rows.

The identity is not the defect. Calling the result **Total** is: it excluded
the file read, the `ParsingBuffer` construction, the wasm init and the
teardown, and a reader — human or re-bless diff — takes "Total 26,744 ms" for
what loading that model costs. Worse,
`ConwayModelLoader.loadModelWithScene` already wrote a genuine
`allTimeStart` → `allTimeEnd` wall clock into a column of the same name, so
the two pipelines put different quantities under one heading. Same disease as
`geometryMemoryMb` above.

**Option (b) was taken, and (a) came with it.** `totalTimeMs` is a real wall
clock on every writer now — opened after the pre-load settle and before
`readFileSync`, closed immediately after `model.invalidate(true)` — and the
old sum survives as its own column, `parsePlusGeometryMs`, where the identity
is visible in the name instead of being a coincidence a reader has to derive.
The gap between the two columns is exactly what the stage clocks cannot see.

Two boundary conditions are load-bearing rather than incidental:

- **The clock opens after the settle, not before it.** Both retention samples
  sit outside every timed region by design (see "The timing property, and how
  to check it by measurement" above); folding two forced full collections into
  the load's wall clock would undo that property and make `totalTimeMs` move
  with `--expose-gc`.
- **It closes on the teardown, before the retained settle.** Teardown is real
  load cost and belongs inside; the settle after it is measurement apparatus
  and does not.

**Consequence: `totalTimeMs` steps up once on regression-produced rows**, by
the file read plus the teardown. A delta across this boundary shows a
slowdown that is a change of methodology, not of the engine — the same shape
as the `parseTimeMs` hazard #554 introduced, in the other direction.
`parsePlusGeometryMs` is the column to read for continuity with older
snapshots, and `scripts/perf_ab_compare.cjs` summarises both for that reason.
Baselines are not re-blessed for it: the next rc picks both columns up and
older snapshots difference the new one as `N/A`.

**What is still not measured, and it is the bigger half.** #562 §2 stands
open. The bench runs a resident, fully-extracted open
(`parseDataToModel` → `extractIFCGeometryData`); Share runs a windowed,
deferred, pumped one (`OpenModelStream` + `DEFER_GEOMETRY` +
`ExtractGeometryBatchAsync`). On SKYLARK250 the two parse and extract at
comparable speed while the whole load differs 5.7×, and the entire difference
sits in an interstage window **no column here covers**. Nothing added by this
change approximates time-to-first-mesh, and a green bench still says nothing
about the path every Share user takes.

## Changelog of methodology changes

| when | change | why |
|---|---|---|
| ≤1.451.1357 | `geometryMemoryMb` populated | headless path measured it |
| 1.451 → 1.543 | `geometryMemoryMb` silently became `N/A` | the conway-native perf writers never emitted it; the gap was written into a test as intended behaviour rather than fixed |
| #548 | delta stops fabricating values for missing columns | `parseValue` returned `0.0`; see "The rule for changing fields" |
| #552 (via #553) | add `peakRssMb`, `externalMb`, `arrayBuffersMb`, `peakWasmHeapMb`; restore `geometryMemoryMb` | memory was one un-GC'd instant, and the wasm heap was invisible |
| #554 | add `retainedRssMb`, `retainedHeapUsedMb`, `retainedExternalMb`; pass `--expose-gc` to the regression children and the render server; add the teardown the regression children never had | nothing measured what is held after teardown, and a peak cannot see it |
| #557 | IFC regression child extracts on the engine `main()` initialised, not a second one built in `geometryExtraction` | the alloc telemetry described an idle module, and the second engine put a ~55-60 MB constant in every IFC retention and RSS row plus its init in `geometryTimeMs`; those IFC baselines move once |
| #554 (decision, after the two-pass A/B ran) | the settle stays **always on**; the gc-off control pass and its comparison become opt-in (`perf_ab` dispatch input), off for a release | the question was answered: run 32601886424's public job priced the settle at +2.9% of pass wall-clock with the timing columns unmoved. Re-measuring a settled condition on every rc doubled the perf portion of the most expensive job in CI for no new signal. Not deleted — a between-run comparison cannot answer this, so the in-one-job machinery is the only way to ask again |
| #555 | add a `writer` column to every perf row; `gen_delta_csv.cjs` refuses to difference `geometryMemoryMb` and the three retention columns across two stated writers that disagree | one column meant two things. The IFC regression child runs at `MemoizationCapture.FULL`, so its `geometryMemoryMb` includes the CSG temporaries the CLI's excludes — 22.3 vs 16.8 MB on MB-Khaya, ~30% of pure methodology, in the column read for memory regressions. Making them agree would move digests, so the divergence is named instead. Additive, and an absent `writer` counts as comparable, so historical deltas survive |
| #555 (via #570 review) | the cross-writer guard becomes a two-trait matrix (`harness`, `capture`) and covers every process memory column, not just `geometryMemoryMb` and retention; legacy rows get their writer inferred from the scraped columns | withholding only two column families left `rssMb`/`peakRssMb`/heap/external publishing a harness difference as a change, against the snapshot README's own statement that a regression child excludes a GL context and a scene graph. `peakWasmHeapMb` stays comparable: measured at 101.56 MB under **both** capture modes. Treating an unknown writer as comparable was a choice, not a necessity — provenance is recoverable from the scraped columns, and without it a historical headless-three snapshot differences against a regression one and publishes the 16.8-vs-22.3 MB gap as real |
| #562 §1 (via #570 review, round 2) | no `totalTimeMs` delta is emitted across two harnesses; `totalTimeMsBasis` reads `crossHarness` | a wall clock is two quantities, because the harnesses bound the interval differently: the loader initialises a per-load engine INSIDE its window and the regression child initialises before its window opens. Measured at ~195 ms, which is 120% / 24% / 4.3% of the child's own total on index.ifc / haus.ifc / MB-Khaya — so the delta would publish removing engine init as an engine speedup. `parsePlusGeometryMs` was checked as a substitute and rejected: the loader does not emit it, and the stage clocks it sums are not the same intervals either |
| #562 §1 (via #570 review) | `gen_delta_csv.cjs` learns the seam: `comparableTotals` picks the quantity both rows can express and states it in a new `totalTimeMsBasis` column | redefining a column without teaching the differ means the first rc after the change reports the redefinition as a regression on every model, and build.yml sorts its table by exactly that number. Falls back to the stage sum rather than blanking, so the release spanning the change still shows whether anything moved |
| #562 §1 | `totalTimeMs` on both regression children becomes the load's **wall clock** (before `readFileSync` → after `model.invalidate(true)`); the old sum becomes `parsePlusGeometryMs` | it was `parseTimeMs + geometryTimeMs` by construction — 0-5 ms of slack on all 46 OK rows of the 1.451 snapshot — while meaning a genuine wall clock on the loader path, so one column held two quantities and neither was the load. **`totalTimeMs` steps up once** on regression rows, by the file read plus the teardown; read `parsePlusGeometryMs` across that boundary. Does not touch #562 §2, the larger half: the bench still runs a load path Share never takes |
| #554 (via the two-pass rc A/B) | `parseTimeMs` drops by about 10 ms per load (13-16% at a ~60 ms parse, unresolvable against a 578 ms one), `heapUsedMb` 5-11 MB and `rssMb` 6-9 MB, against the same code without the settle | the pre-load settle collects engine-init garbage *outside* the timed region that used to be collected inside it, and the end-of-load memory instants sample from that collected floor. Not a new column, but a redefinition of three existing ones by methodology: do not difference parse/heapUsed/rss across this boundary. Distinct from #557 above, which moves `geometryTimeMs` and the memory columns on IFC rows only |

Restoring `geometryMemoryMb` checks out against history: SKYLARK250 reads
**185.22** against the **185.836** recorded at 1.451.

## Related

- `design/new/memory-residency.md` — the residency budget, and why live
  native allocation rather than heap high-water is the unit for a ceiling
- `design/new/ci-regression-cost.md` — CI tiering, the rc / re-bless / LFS runbook
- `regression/README.md` — corpus, digest CSVs, smoke subset vs rc pass
- `.github/workflows/rc-regression.yml` — the `rebless` job that runs both
  passes, and `scripts/perf_ab_compare.cjs`, which differences them
- `scripts/bless_perf_snapshot.cjs` — writes the blessed snapshot and the
  README that ships beside it; that README carries the reader-facing half
  of the column definitions above
