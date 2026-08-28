# Load performance ledger: what the M3 work cost, what it bought, and where the wall moved

Companion to [parallel-load-pipeline.md](parallel-load-pipeline.md), which asks
whether O(cores) is reachable and answers it from Node measurements. This doc
asks a different question — **was the complexity worth it, and what should be
built next** — and answers it from the first production load of D3D on the
shipped engine.

Its conclusion is not the one the roadmap assumed: on a real IFC4 model in a
real browser, **geometry is 90 % of the load and parse is 8 %**, so the parse
work that dominated M2/M7/M8 is worth at most 9 % no matter how many cores it
gets. And the binding constraint for the models users are actually bringing is
no longer time at all — it is **peak heap, currently 9.8× file size**.


## 0. The measurement

First production D3D load with the shipped wins. Share `v1.1772.e431cbd`,
conway `v1.1565.608-g18366f01`, uploaded file served from the OPFS cache.

| phase | time | % of load | heap Δ | % of growth |
|---|---:|---:|---:|---:|
| Preparing file | 0.056 s | 0.05 % | 12.5 MB | 0.6 % |
| Hashing model | 0.395 s | 0.34 % | 210.1 MB | 10.4 % |
| Opening model | 0.049 s | 0.04 % | 0.0 MB | 0.0 % |
| **Parsing** | **9.639 s** | **8.28 %** | 778.2 MB | 38.4 % |
| **Geometry** | **104.683 s** | **89.92 %** | 1002.6 MB | 49.4 % |
| Assembling render mesh | 1.602 s | 1.38 % | 25.7 MB | 1.3 % |
| **Total** | **116.424 s** | | 67.9 → **2097.1 MB** | |

Model: 213.6 MB IFC4 (Tekla export), 3,204,852 vertices, 2,453,022 triangles,
units mm. Geometry window held at 197.6 MB.

**Read §5 before reusing this table.** The heap column is
`performance.memory.usedJSHeapSize`, which is frozen for twenty minutes at a
time in any Chrome not launched with `--enable-precise-memory-info`. It is
wasm-inclusive, so 2,097 MB is a real JS + wasm total and 9.82x is not an
undercount — but a run without that flag prints `+0.000000 MB heap` on every
line, so this table cannot be reproduced by simply loading the model again.

**The before number is reported, not measured.** Prior behaviour on this model
is recalled as *"700 s+ and something like 6–7 GB"*. Treat it as an order of
magnitude — roughly 6× the time and 3× the peak — not as a baseline. If the
comparison matters for anything load-bearing, re-measure it against a pinned
older conway rather than citing this line.

The bulk of that win is **#616/#617** (adaptive residency in the windowed
pager), which took D3D's aggregate read amplification from 220.9× to 5.1× —
measured in Node at 225.8 s → 75.4 s. Everything else in the M3 batch was
either correctness or an enabler that nothing yet calls.


## 1. The ledger

What the four PRs of the M3 batch cost, and what they return. "Shipped" means a
user sees it today; "enabled" means it is a precondition for something not yet
built.

| change | added (incl. tests/docs) | shipped gain | enabled gain |
|---|---:|---|---|
| #617 adaptive residency | ~100 | **D3D 225.8 s → 75.4 s (Node)** | — |
| #623 v2 sidecar + open-from-index | ~2,700 | 0 — plus a real correctness fix | 16.7× (PSB) / 19.4× (D3D) per *additional* consumer |
| #624 sharded index build | ~3,400 | 0 — no production caller by design | 3.26× on the parse phase, N=4 |
| #622 + #629 | ~1,500 | 0 — correctness | — |

Roughly 7,700 added lines for one shipped speedup, and that speedup came from
the smallest change in the set.

**The pattern in the repo's own data is that waste-elimination beat parallelism
on every axis measured.** #617 got its 3× by not re-reading the same bytes 220
times. #541's 16–19× is the same shape: N workers not re-parsing one file.
Sharding got 3.26× on one phase for 1,175 lines of builder plus a transport
that needed five review rounds and was ultimately demoted to bench code
(see #631).

Two entries deserve their qualifier stated rather than assumed:

- **#623's correctness fix is not incidental.** The v1 sidecar carried only
  `[0, firstInlineElement)`, so a model restored from one resolved every inline
  entity to `null` — surface styles, transparency and measure-valued attributes
  degrading silently on a model that still loaded and looked approximately
  right. Inline share ranges from 0.274 % (MB-Khaya) to 20.995 % (D3D), a 77×
  spread, so whether v1 was safe depended on the exporter. That fix would
  justify a good part of the diff on its own.
- **#624 is speculative inventory.** Its value is entirely contingent on a
  worker pool that does not exist. The shipped artifact — builder plus a merge
  proven byte-identical — has a production caller of exactly zero, and its
  default runner (`inProcessShardRunner`) is sequential with no lifecycle at
  all.


## 2. The production shape retires the parse-first plan for D3D-shaped models

[parallel-load-pipeline.md §8.6](parallel-load-pipeline.md) already computed
that parse parallelism on D3D yields **1.03×** overall. Production says
**1.061×** at the measured 3.26× shard efficiency. The doc was right, and
slightly conservative.

The arithmetic, from the table in §0:

```
parse is 8.28 % of the load
  → Amdahl cap for parallelising parse alone      1.090x   (infinite cores)
  → at the measured 3.26x (N=4)                   1.061x   (116.4 s → 109.7 s)
                                                           5.7 % of wall clock
```

So **M2 buys under six percent on this workload**, and cannot buy more than
nine even in the limit. That is not an argument that M2 was wrong — PSB is a
different shape, and the seam it defines is reusable — but it does mean the
parse phase is finished as a target. Further parse work should be justified by
a model whose profile is not D3D's.

Geometry is where the load is:

```
geometry is 89.92 % of the load
  → Amdahl cap for parallelising geometry alone   9.92x
```

**This table was assumed; §11 has now measured it, and the assumption was
optimistic by about a factor of two.** Both rows are kept — the assumed one so
the correction is legible, the measured one because it is what should be
planned against.

| configuration | efficiency | geometry | total | speedup |
|---|---|---:|---:|---:|
| ~~geometry N=4~~ | ~~0.80 assumed~~ | ~~32.7 s~~ | ~~44.5 s~~ | ~~2.62×~~ |
| ~~geometry N=8~~ | ~~0.65 assumed~~ | ~~20.1 s~~ | ~~31.9 s~~ | ~~3.65×~~ |
| ~~geometry N=4 + parse N=4~~ | ~~0.80 / 0.857 assumed~~ | — | ~~37.8 s~~ | ~~**3.08×**~~ |
| geometry N=2 | **0.864 measured on D3D** (§11) | 60.6 s | 72.3 s | **1.61×** |
| geometry N=4 | **0.476 measured on D3D** (§11) | 55.0 s | 66.7 s | **1.75×** |
| geometry N=4 + parse N=4 | 0.476 / 0.857 | 55.0 s | 59.9 s | **1.94×** |
| geometry N=8 | **unmeasurable here** — 4-core box; §11.6 | — | — | — |

These are measured **on D3D itself**, not transferred from another model —
which matters, because §11.3's SKYLARK250 result (1/N efficiency, no partition
at all) shows the model-to-model spread on this axis runs the whole way down.

**Read the first two rows together before planning anything.** Going from two
workers to four moves geometry 60.6 s → 55.0 s: **5.6 seconds of a 116-second
load, 4.8 %.** Efficiency more than halves across that step (0.864 → 0.476)
because duplicated work grows with N, so nearly the entire available win is
already banked at N=2 — and N=2 needs two wasm instances and 4.0 GB rather
than four and 6.2 GB (§11.7).

Both bounds on these numbers point the same way, so they are ceilings rather
than midpoints: the partition measured **does not reproduce the
single-worker output on D3D** (§11.5 — 285 geometries differ at N=4, and a
fix makes shards see more, not less), and the load path measured has **no
contended provider** where a windowed one would (§11.6).

The assumed numbers were borrowed from the *parse* measurements, on the
reasoning that parse sharding degraded from 0.94 at N=2 to 0.857 at N=4 while a
register-bound spin loop held 0.97 — a memory-bandwidth signature — and that
geometry, being compute-heavy with a small working set, was plausibly a
*better* scaler.

**At N=4 it is a worse one, and the mechanism is not the one either guess
named.** It is neither memory bandwidth nor a shared wasm heap: four
independent box calibrations bracketing these runs read 0.984–0.990 at N=4,
and each worker has its own linear memory, which *shrinks* with N (611 MB →
207 MB each on D3D). It is **duplicated work** — geometry shared below the
representation level gets rebuilt in every shard that touches it, at 2.03× the
total CPU on D3D at N=4, and 97 % of D3D's loss is that rather than imbalance.

The root cause on D3D is sharper than "an imperfect key": **60.7 % of its
product worklist (29,031 of 47,791) resolves no mapping source at all**, so
most of the production model is sharded positionally. §11.4 has the
decomposition.


## 3. The wall moved, and it is memory

Peak heap on this load was **2,097 MB for a 213.6 MB file — 9.82×**.

Users are now bringing 2 GB and 3 GB models. At the current amplification:

| model | projected peak |
|---|---:|
| 2 GB | ~19.6 GB |
| 3 GB | ~29.5 GB |

Neither loads. This is not a "slow" outcome, it is a hard failure, and it is
reached long before wall-clock becomes the complaint. **For the large-model
positioning, the amplification factor — not the load time — is the constraint
that decides which files open at all.**

To fit a 2 GB model inside a 4 GB budget, amplification must come down to
**≤ 2×**, a **4.9× reduction** from where it is.

Where the bytes are, from the same load:

| phase | heap Δ | what it is | lever |
|---|---:|---|---|
| Geometry | 1002.6 MB | 49 % of growth. Final mesh is only ~106–132 MB¹, so this is **7.6–9.4× the output** in transient | the largest and least understood term — needs profiling before design |
| Parsing | 778.2 MB | 38 % of growth, for a 213.6 MB file | index + materialised entities; the columnar index is already compact, so this is likely entity objects |
| Hashing | 210.1 MB | 10 % of growth — the file materialised solely to digest it | ~~#623's `HashingByteSource`~~ — **wrong lever, see §7**: this stage is Share's GLB cache-key SHA-1, not conway's sidecar digest |
| Mesh assembly | 25.7 MB | 1 % | — |

¹ Estimated as `vertices × (24–32 B) + triangles × 12 B` for f32
position+normal(+uv) and u32 indices. If the real vertex format is fatter this
ratio shrinks; it does not change the conclusion that the transient dominates.
(§7 replaces the estimate with the actual layouts: 132.0 MB merged,
106.3 MB batched — and notes that both are held *twice* on the JS side.)

The geometry **window** was held at 197.6 MB throughout, so streaming residency
is working as designed. The 1 GB is not the window — it is output plus
transient, and it is the single biggest item on the page.


## 4. What this implies for sequencing

1. **Measure geometry's memory profile before building geometry parallelism.**
   A worker pool that runs N geometry shards concurrently multiplies whichever
   part of that 1 GB is per-shard transient. Parallelising into a memory wall
   makes the 2 GB case worse, not better. This is the one measurement that
   should gate the next design.
2. ~~**Wire `HashingByteSource`.**~~ **Retracted — see §7.** It is a
   different digest on a different code path, it is not on `main`, and it
   would not remove a byte of the `Hashing model` stage. The replacement
   items, in the order §7 and §8 put them: fix the instrument
   (`--enable-precise-memory-info`, one line in `tools/playwright.config.js`),
   take a heap snapshot of the 1,233 MB of V8 objects §8 found, and extend
   AFTP's arena scopes to the IFC tessellation entry points, which today
   record zero scoped faces on D3D-shaped models.
3. **Geometry before parse, for anything D3D-shaped.** 89.92 % versus 8.28 %.
4. **Keep hunting waste.** #617 returned 3× for ~100 lines; #547 (retry-first
   starvation) is filed and still unmeasured; the browser measurement harness
   built for this batch has been used once. On the evidence in §1, one more
   profiling pass has a better expected return than another thousand lines of
   parallel machinery.
5. **Do not land #624 without a scheduled consumer**, or accept it as inventory
   with a carrying cost. The `ShardRunner` seam is the durable asset and it is
   small; the builder is 1,175 lines of proof-carrying merge that nothing calls.


## 5. What the instrument actually measures

*Method extracted and generalised in
[browser-memory-analysis.md](browser-memory-analysis.md) — read that before
measuring anything else; this section is the D3D-specific instance of it.*

**Before reading §0 or §3 again, know this: the heap column in a load report
is blank in every browser that is not launched with a debug flag, and the
numbers in §0 could only have come from a run that was.**

The column is `performance.memory.usedJSHeapSize`, sampled twice over —
Share's `usedHeapMb()` (`src/loader/loadProgress.js`) for legacy string
stages, conway's `Memory.usedHeapMb()` (`src/memory/memory.ts`) for engine
`ProgressEvent`s. Two properties of it were measured on the shipped build
(Chromium 141.0.7390.37 (Playwright 1194), conway 1.588.1550, Share 1.1773):

1. **It DOES include WebAssembly linear memory.** Growing and touching a
   512 MiB `WebAssembly.Memory` moves `usedJSHeapSize` by 511.65 MB; so does
   a 512 MiB plain `ArrayBuffer`; so do 512 MiB of ordinary JS objects. It
   is V8's used heap **plus external memory**, and wasm memory is external
   memory. (This is the opposite of the Node side, where
   `heapUsed + external` is structurally blind to the wasm heap — the
   contrast is already documented in `src/memory/memory.ts` and
   `src/ifc/ifc_regression_main.ts`. Do not carry a Node intuition across.)
2. **It is frozen unless Chrome is launched with
   `--enable-precise-memory-info`.** Sampled every 5 s for 113 s while
   3.6 GB of wasm memory was committed in 200 MB steps, it returned
   **202.18 MB at every single sample** — the value latched at the first
   read and never moved again. `crossOriginIsolated` does not change this;
   only the flag does. (Blink rate-limits and bucketizes the default
   precision deliberately, as a side-channel defence; the *duration* of the
   latch was not measured here, only that it outlasts any load. Since a
   report is emitted from a single document, one latch covers the whole
   load.)

Both halves were confirmed end to end by loading the same model twice on the
same build, changing nothing but that flag:

| launch | the report Share printed |
|---|---|
| default | `Total: 5.403s, 9.536743 → 9.536743 MB heap`, and **every stage line `+0.000000 MB heap`** |
| `--enable-precise-memory-info` | `Total: 5.186s, 54.410274 → 133.049745 MB heap`, stages populated (`Geometry: +39.269753 MB`) |

**Consequences.**

- **The §0 table is a wasm-inclusive measurement** — so 2,097 MB is a real
  total for JS + wasm together, and 9.82× is not an undercount. That much of
  the ledger stands.
- **It was taken with the flag on** (or on something other than a stock
  browser). Nothing else can produce non-zero per-stage deltas inside a
  116 s load. Whoever reproduces §0 must set the same flag or they will get
  a page of zeros and read it as "no growth".
- **The shipped report's heap column is misinformation for every real
  user.** `+0.000000 MB heap` is not "this stage allocated nothing", it is
  "this browser will not tell me" — and it is printed with six decimal
  places of false precision on every load. Two cheap fixes, neither
  attempted here: have `usedHeapMb()` detect the frozen sampler (two reads
  either side of a known allocation) and omit the column, and add
  `--enable-precise-memory-info` to `tools/playwright.config.js` so the
  measurement harness gets real numbers by default.
- Note also what `usedJSHeapSize` is *not*: a live set. It counts
  unreclaimed garbage until a GC runs, exactly as `heapUsedMb` does in the
  Node regression columns (`ifc_regression_main.ts` documents SKYLARK250 at
  2547 MB instant against 981 MB after two forced collections). A per-stage
  delta in this column is "bytes allocated and not yet collected during that
  stage", not "bytes the stage needs".


## 6. The ceiling is 4 GiB, and it is hard

Read straight out of the shipped binary rather than the build scripts, because
the build scripts are not the artifact:

| build | memory | 64-bit? | initial | maximum |
|---|---|---|---|---|
| `ConwayGeomWasmWeb` (single-thread, `SINGLE_FILE`) | defined in-module | **no** | 256 pages / 16 MiB | **65 536 pages / 4096 MiB** |
| `ConwayGeomWasmWebMT` | imported `a.a`, `shared` | **no** | 256 pages / 16 MiB | **65 536 pages / 4096 MiB** |

`genie.lua` carries `-s ALLOW_MEMORY_GROWTH=1 -sGROWABLE_ARRAYBUFFERS=0
-s MAXIMUM_MEMORY=4GB` on every target and `-sMEMORY64` on none. So:

- **The wasm heap can never exceed 4 GiB on any machine**, and in practice
  4 GiB − 64 KiB: emscripten's own failure text from the mimalloc spike
  (`emsdk-upgrade-scalable-allocator.md`) reads *"requested 4294962208 bytes,
  but the limit is 4294901760 bytes"*, i.e. 65 535 pages. A full 65 536-page
  memory could not be viewed anyway — `new Int8Array(buffer)` over a
  4 GiB buffer exceeds V8's maximum typed-array length, and
  `updateMemoryViews()` builds ten such views on every growth.
- **The JS heap has its own, separate ~4 GB cap.** `jsHeapSizeLimit` reads
  4095.8 MB on this build. A load must fit under *both*, not under their sum.
- `WebAssembly.Memory` only grows. Once geometry has driven the heap up, the
  pages stay committed for the tab's lifetime; no `free()` inside wasm
  returns them. Peak, not retention, is the number that decides whether a
  model opens — which is why `wasmHeapByteLength` is used as a high-water
  reading in the Node regression columns with nothing to sample.

Production is on the **single-threaded** build, not the MT one:
`netlify.toml` deliberately omits COEP (the Google Picker sends
`CORP: same-site`), so `crossOriginIsolated` is false, so
`pThreadsAllowed()` returns false and `conway_geometry.ts` imports
`ConwayGeomWasmWeb.js`. Everything in this doc about wasm memory is about
that build; the MT one is not what users run.


## 7. Corrections to §3's lever table

Four of §3's claims say something different once the code behind them is
read — including the one §4 nominated as the cheapest item on the page.

**"Hashing — already solved but unwired: #623's `HashingByteSource`" is
wrong on every clause.** The 210 MB stage is Share's, not conway's: `Loader.js`
prints `Hashing model...` around `sha1HexFromBlob` (`src/utils/contentHash.js`),
which computes the **GLB cache key** — a chained fold of per-slice SHA-1s over
8 MiB slices, deliberately never materialising the file. `HashingByteSource`
is conway's FNV-1a **sidecar trust gate** on the open-from-index path, it
lives on branch `claude/issue-541-open-from-index` and is not on `main`, and
wiring it would not delete a byte of this stage, because this stage is not
computing that digest. What the 210 MB actually is: 213.6 MB / 8 MiB ≈ 26.7
per-slice `incoming` ArrayBuffers, allocated one per iteration and dropped,
with a `setTimeout(0)` yield only every 8th slice. The number matches the file
size to within 2 %, which is what an un-collected allocation-per-slice looks
like — it is garbage, not live data, and the lever is GC pressure (yield every
slice, or read into the existing `scratch` without the intermediate
`arrayBuffer()`), not a different hash. **Unmeasured**: nobody has confirmed
the garbage reading by forcing a collection at that stage boundary, and §8's
finding that the *end-of-load* peak is live does not settle a mid-load stage.

**"Geometry … the largest and least understood term — needs profiling before
design" understates what is already known and already shipped.** Two things
are already in the tree and bear directly on it:

- **The geometry store is already budgeted, and the budget is not where the
  gigabyte is.** Share passes `GEOMETRY_BUDGET_MB: 64` on the demand path
  (`conwayDirectIfcLoader.js`), and `demandGeometry` is `isActive: true`, so
  the production load in §0 ran with conway's LRU residency capping the
  **live** wasm-side geometry set at 64 MB. `geometry_residency.ts` measured
  that cap taking PSB's wasm peak from 1284 MB to 298 MB, and D3D under the
  same 64 MB rebuilding 2.8 % more assets in the same wall clock. So the
  1,002 MB is allocator high-water over a 64 MB live set, plus the JS-side
  copies — not a runaway cache.
- **The multiple over the live set is the documented signature, and the fix
  for it does not cover D3D.** `geometry_residency.ts` records an 8 MB live
  set under an 85 MB heap on MB-Khaya (10.6×); the AFTP telemetry in
  `emsdk-upgrade-scalable-allocator.md` records Arty_Z7 at ~75 MB retained
  under a 4.5 GB peak (60×), and names the two mechanisms — realloc-growth
  transients on mesh accumulation buffers, and ~218 M per-face
  malloc/free pairs. The arena that fixed it is scoped to
  `AddFaceToGeometry`, i.e. the **STEP / IFC advanced-BREP** path; the same
  telemetry pass records **zero scoped faces** on ordinary
  extrusion/profile/CSG IFC models. D3D is a Tekla IFC4 export of exactly
  that kind. **The shipped transient-memory fix does not run on D3D's
  tessellation path at all**, and extending its scopes to the IFC entry
  points is the single largest identified lever on this page.

**Two JS-side copies of the same geometry are live at peak.**
`incrementalBatchedBuilder.js` keeps a `geometryCache` entry — a full
`BufferGeometry` per unique geometry — for the life of the load, *and*
appends the same vertices and indices into the `BatchedMesh`'s packed
buffers, which three.js grows by doubling in place (so a growth event
transiently holds old + new). Clearing `geometryCache` at `finalize()`, or
evicting entries once every instance referencing them is placed, is a small
change with a bounded, arithmetically checkable saving.

**§3's footnote 1 can be replaced with the real vertex format.** The merged
path writes position + normal + `expressID` + `instanceID` = 32 B/vertex and
4 B/index, so D3D's 3,204,852 vertices / 2,453,022 triangles are 102.6 MB +
29.4 MB = **132.0 MB**, the top of the estimated range. The batched path
drops the two per-vertex u32s to 24 B/vertex → 106.3 MB. Both were guesses in
§3 and both are now exact.

**§3's "the geometry window (197.6 MB) is working as designed" deserves its
consequence spelled out.** By `memory-residency.md` §4, #616's adaptive
residency ends a D3D load holding **the whole 213.6 MB source** (64 MB →
213 MB, "whole file"), because D3D's rel-aggregate closure spans 52 of 54
chunks. The 3× speed-up in §1 was bought with roughly +150 MB of permanent
residency. That is a defensible trade at 2 GB total; at a 2 GB *model* it is
the first thing that has to become a policy rather than a constant.


## 8. Where the bytes are: JS versus wasm, measured

A full D3D load was re-run in Chromium with the flag on, with the wasm
memories instrumented (`WebAssembly.Memory` / `instantiate` wrapped at
document start), CDP `Runtime.getHeapUsage` for the V8 heap alone, and
renderer RSS from `/proc`. **This box is not §0's machine and the numbers are
not comparable to §0's line for line** — geometry took 4,256 s here against
104.7 s there, and the model was fetched over HTTP and materialised
(`Download: +207.8 MB`) rather than served from the OPFS cache. What
transfers is the *composition*, which nothing in §0 could see.

The report this run printed:

```
Share v1.1773.9a7c323, 57.446417 MB heap before load
Downloading model data:   0.704s,    +2.098222 MB heap
Download:                18.471s,  +207.832649 MB heap
Opening model:            0.210s,   +22.294870 MB heap
Parsing:                 21.069s,  +320.964076 MB heap
Geometry:              4256.060s, +1988.961535 MB heap
Assembling render mesh:   1.789s,   +50.995492 MB heap
Total:                 4298.303s, 54.68 -> 2647.83 MB | vertices=3204852 triangles=2453022 units=mm
```

and what that 2,648 MB is actually made of, sampled three times over 60 s
after the load settled and after two forced `HeapProfiler.collectGarbage`:

| component | MB | share | how read |
|---|---:|---:|---|
| V8 JS heap (objects) | **1,233** | 47 % | CDP `Runtime.getHeapUsage().usedSize` |
| External, non-wasm (ArrayBuffers) | **796** | 30 % | `usedJSHeapSize` − V8 − wasm |
| **wasm linear memory** | **611** | **23 %** | `buffer.byteLength`, both memories |
| = `performance.memory.usedJSHeapSize` | 2,640 | | |
| renderer RSS at that moment | 2,935 | | `/proc`, out of band |
| renderer RSS high-water seen | 3,574 | | same |

**Three things follow, and two of them cut against the ledger's working
assumptions.**

1. **This is not primarily a wasm problem.** Linear memory is 23 % of the
   total (2,648 MB against a 213.6 MB file is 12.4x here, against §0's
   9.82x). The hypothesis "the transient is wasm-side, therefore
   unreclaimable, therefore the only fix is high-water reduction" is *false
   for the bulk of it*: 77 % sits in the V8 heap and in ArrayBuffers, which
   the browser **can** hand back once the references go — unlike wasm pages,
   which it cannot (§6). The grow-only property is real and it does bind that
   611 MB; a fix aimed only there addresses under a quarter of the peak.
2. **The peak is live, not garbage.** Two forced full collections moved
   `usedJSHeapSize` by 7.6 MB out of 2,648. Whatever this is, it is
   *retained* through the end of the load, so "release it sooner" is a design
   change, not a GC-tuning one. (The 3,574 MB RSS high-water against a
   2,935 MB settled RSS says there is also a ~640 MB genuinely transient
   spike, and it lands after the `Total` line — in assembly / GLB export, not
   in geometry.)
3. **1,233 MB of V8 *objects* is the largest single item on the page, and
   it has never been attributed on the browser side.** Not ArrayBuffers —
   on-heap objects. conway #372 cut the parse index from ~1 GB to ~24 MB
   post-`invalidate` on a 7.8 M-entity model, so whatever this is, it is
   probably not that. Only a heap snapshot will say, and taking one is the
   obvious next move — §9.1 records that on this heap it is also an
   impossible one; the candidates visible in the code are
   `conwayDirectIfcLoader`'s `captured` array (every `FlatMesh` for the whole
   model, held for the whole load), conway's per-entity descriptor cache, and
   three.js's per-instance bookkeeping. **§9 measures all three**: the first
   is right but only half the owner, the second is worth nothing at all, and
   the third is 4.31 MB.

**Unmeasured, and it is the piece I most wanted:** the split *within* the
geometry stage. The in-page sampler took 21 samples during the 19 s download
and then **nothing at all for the next 72 minutes** — `page.evaluate` needs
the main thread, and the demand pump's `yieldToEventLoop()` between batches
never gave it up. Note the harness consequence: *any* in-page probe is blind
for the whole of geometry on a model this size, and the `/proc` reads were
blind too because they sat in the same loop. A per-phase memory profile needs
its RSS sampler in a process the page cannot starve, and its in-page reads
piggy-backed on conway's own progress callback rather than injected from
outside.


## 9. What the 1,233 MB of V8 objects is

§8's largest item, attributed. Same box, same build, two D3D loads: one to
reproduce §8's composition and try the obvious instrument, one to measure
what §8's number is made of.

**The composition reproduces exactly**, on a deliberately unminified build
(`MINIFY=false SHARE_CONFIG=playwright`, so every frame and class name below
is a real name rather than `pOA`; it costs ~3 MB of V8 objects on a small
model, measured, and nothing else changed):

| | §8 | run 1 | run 2 |
|---|---:|---:|---:|
| `performance.memory.usedJSHeapSize` | 2,648 | 2,664.9 | 2,664.2 |
| V8 JS heap objects | 1,233 | 1,237.4 | **1,236.8** |
| external, non-wasm (ArrayBuffers) | 796 | 816.5 | 816.5 |
| wasm linear memory | 611 | 610.9 | 610.9 |
| renderer RSS, settled | 2,935 | 2,953.7 | 3,013.6 |
| renderer RSS, high-water *during the load* | 3,574 | 3,598.5 | 3,603.9 |

Same setup as §8 in every other respect — `D3D.ifc` served over HTTP from
localhost into `/share/v/u/…`, Chromium launched with
**`--enable-precise-memory-info`** (without it every number in this section
is a frozen constant, §5) and `--js-flags=--expose-gc`, wasm memories
instrumented at document start, RSS read out of band from `/proc` so the
starved main thread cannot blind it. Run 2's own report line:
`Total: 4667.160s, 77.25 → 2665.16 MB heap | vertices=3204852
triangles=2453022`. The scene it left behind is **one** `BatchedMesh` with
**562,351** instances — that count is the denominator for everything below.


### 9.1 A heap snapshot is not available at this heap size

*Generalised, with the budget rule and the techniques that replace it, in
[browser-memory-analysis.md](browser-memory-analysis.md) §3–§4.*

The obvious move — `HeapProfiler.takeHeapSnapshot` — **cannot be taken on
this load, and that is a finding rather than a harness problem.** On the
settled D3D heap (V8 1,236 MB, renderer RSS 2.95 GB) the snapshot walk drove
the renderer from 2.95 GB to **13.1 GB anon-rss**, where the cgroup OOM-killed
it. It emitted **zero** `addHeapSnapshotChunk` events and never reported the
walk finished, so there is no partial artifact either — roughly 10 GB of
transient for a 1.24 GB heap, about 8× the heap it is describing. The same
harness on a 46 MB heap (dental_clinic.ifc) produces an 87 MB snapshot in
5.1 s without trouble, so this is a scale wall, not a broken pipe. Anyone
planning to "just take a snapshot" of a big-model load should budget ~10× the
V8 heap in free RAM, or plan not to.

`Runtime.queryObjects` is expensive here too but survivable: enumerating the
**656,251 live `Set`s** took the renderer to 5.33 GB.

### 9.2 Two instruments that do work, and they agree

1. **Allocation site.** V8's sampling heap profiler
   (`HeapProfiler.startSampling`, 128 KB mean interval) started before
   navigation. It holds each sampled object through a weak handle and drops
   the sample when the object is collected, so a profile read after a forced
   GC is a live-heap attribution by JS call stack. Cost measured at ~10 % of
   geometry wall clock (4,626 s against run 1's 4,161 s). Its live total,
   **1,234.7 MB, is 99.8 % of the 1,236.7 MB the CDP counter reports** — the
   profile covers essentially the whole heap.
2. **Causal retention.** `Runtime.queryObjects` (which collects first, so
   everything it returns is live by construction) enumerates every `Set` and
   `Map`, then each big one is `.clear()`ed with a forced full collection
   either side. The drop in `Runtime.getHeapUsage().usedSize` is not an
   estimate of what a `.clear()` would save; it *is* what it saves.

### 9.3 Where the 1,236.8 MB is

By allocation site, rolled up to the structure that ends up holding the bytes:

| holder | MB | share |
|---|---:|---:|
| conway `FlatMesh`/`PlacedGeometry` stream — Share's `captured` **and** conway's `meshMap`/`vectorFlatMesh` | **475.0** | 38.5 % |
| `IncrementalBatchedBuilder.seenPlacements` — `coincidenceKey` strings + the `Set` | **396.0** | 32.1 % |
| Share's own `SearchIndex` (`initSearch` → `indexElement`) | 131.6 | 10.7 % |
| three.js batched model (BufferGeometry, instance tables, BVH) | 87.2 | 7.1 % |
| conway `ResidencyController` | 67.1 | 5.4 % |
| builder per-placement bookkeeping (`appendPlacement_`) | 30.4 | 2.5 % |
| conway parse (`StepStringParser`, vtable, descriptors) | 4.6 | 0.4 % |
| app shell / React / bundle | 4.9 | 0.4 % |
| unattributed (spread thin; largest single site 4.3 MB) | 38.0 | 3.1 % |

The clear-and-collect experiment, on the same settled load, against a
post-GC baseline of **1,237.63 MB**:

| cleared | entries | freed (MB) |
|---|---:|---:|
| the 562,351-entry `Set` of `coincidenceKey`s (`seenPlacements`) | 562,351 | **396.65** |
| a 192,022-entry `Map` — one entry per unique geometry, the shape of `geometryCache` | 192,022 | 48.77 |
| every other `Set` with ≥ 1,000 entries (7 named + the rest) | 1,612,962 | 22.39 |
| every other `Map` with ≥ 1,000 entries (7 named + the rest) | 659,603 | 26.26 |
| **conway `ReleaseEntityCache`** (found by walking the store + scene) | — | **−0.10** |
| the `BatchedMesh` per-instance pick tables (`instanceColors` + 4 more) | 1,124,702 | 4.31 |
| removing the whole model group from the scene | 4 roots | 0.15 |
| **total** | | **498.43** → 739.20 MB |

**The two instruments agree where they overlap**: the sampler attributes
396.0 MB to `coincidenceKey` and its `+=`, and clearing that one `Set`
measures 396.65 MB. That is the cross-check that makes the rest of the table
trustworthy.

§8's three named candidates each land somewhere other than where §8 put
them:

- **`captured` was right, but it is only half the owner.** The
  `FlatMesh`/`PlacedGeometry` graph is retained *twice*: by
  `conwayDirectIfcLoader.js`'s `captured.push(...batch)` and by conway's own
  `streamNewMeshes_`, which does `meshMap.set(entity.expressID, mesh)` and
  `vectorFlatMesh.push(deltaMesh)` (`ifc_api_proxy_ifc.ts`). Dropping one
  frees nothing, and that is measured, not argued: clearing the heap's
  largest express-ID-keyed `Map` — 228,971 entries, which is `meshMap`'s
  shape — freed **4.4 MB** of the 475 MB it participates in.
- **conway's descriptor cache is not the problem.** `ReleaseEntityCache`
  on the live model freed **−0.10 MB** — i.e. nothing, within noise. conway
  #372's columnar index is doing exactly what it claims; there is no
  gigabyte of parsed entities here to reclaim. §8 guessed this correctly
  ("probably not that") and it is now measured.
- **three.js's per-instance bookkeeping is small.** All five per-instance
  tables over 562,351 instances — 1.12 M array slots — are 4.31 MB.

And one item nobody had named: **Share's own `SearchIndex` is 131.6 MB**.
`src/search/SearchIndex.js` builds `eltsByType` / `eltsByName` /
`eltsByGlobalId` / `eltsByExpressId` / `eltsByText`, one `Set` per distinct
token — and `indexElementByString` indexes every key **twice**, verbatim and
`toLowerCase()`d, so the `Set` count is doubled by construction. That is
where the **656,251 live `Set`s** come from. It is built eagerly from
`CadView#initSearch` as soon as the model lands, and bounded by nothing.

### 9.4 The 396 MB is a string-building accident, not a data structure

562,351 placements, 396.65 MB, is **739 bytes per placement** — for a key
like `794:791:7:0:7:0:7:0:-7:0:0:10:0:0:1940550:201995:-1733751:10000:0:0:0:10000`,
76 characters, which as a flat one-byte string is ~96 B plus a hash-table
slot. The excess is visible in the profile's split: 211.8 MB in
`coincidenceKey`'s own allocations and **184.5 MB in the `+=` inside it**.
`coincidenceKey` (`flatMeshToBatchedModel.js`) builds its key with seventeen
successive `key += …` — sixteen in a loop over the matrix, one for the colour
— and the intermediates survive two forced full collections alongside the
finished key. So roughly 6× the flat-string cost, and the multiplier is the
construction, not the content.

### 9.5 Steady state versus transient

| | MB | verdict |
|---|---:|---|
| `seenPlacements` | 396.0 | **transient, outlived its use.** A load-time guard against exact-duplicate placements. Nothing reads it after `finalize()`. |
| `FlatMesh`/`PlacedGeometry` graph | 475.0 | **transient, outlived its use** on the incremental path. The builder consumes each batch as it streams; `captured` exists only for the end-of-load *fallback* build and two debug-gated consumers, and conway's `meshMap` only to survive geometry eviction during the pump. |
| `SearchIndex` | 131.6 | **steady state as designed**, but unbounded and eager — a policy question, not a leak. |
| three.js batched model | 87.2 | **necessary steady state** (and its real cost is the ~796 MB of ArrayBuffers, not these objects). |
| `ResidencyController` | 67.1 | **steady state while the model can re-extract geometry on demand.** |
| everything else | 77.8 | mixed; no single site over 5 MB. |

**871 MB — 70.5 % of the V8 heap — is transient that outlived its use.**

### 9.6 How much survives to idle: all of it

| | V8 used (MB) |
|---|---:|
| settled, at `data-model-ready` | 1,236.75 |
| after 120 s of idle | 1,236.99 |
| after two forced `HeapProfiler.collectGarbage` | 1,236.67 |

**Nothing decays.** Idle costs the heap 0.24 MB in the wrong direction, and
forced collection recovers 0.32 MB out of 1,237. Run 1 says the same
(1,237.43 → 1,237.48 → 1,236.15). So the answer to "can a second model be
opened in the same tab" is **no, and not close**: the tab sits at 2,664 MB of
a ~4,096 MB `jsHeapSizeLimit` with the whole 611 MB of wasm linear memory
permanently committed (§6), leaving under 1.4 GB for a load that needs 2.7 GB.
Even after this section's clears — which are more aggressive than any real fix
would be — the tab still holds 2,167 MB, because the 816 MB of ArrayBuffers
and the 611 MB of wasm pages are untouched by any of it.

### 9.7 The lever

**Stop building `coincidenceKey` as a string.** It is worth **~380 MB of
both peak and retention** — the largest single actionable item on this page.
A numeric key (a hash, or a packed index) costs tens of bytes per entry
against the measured **739 B**, so 562,351 placements go from 396.65 MB to
somewhere around 15 MB. It is one function (`coincidenceKey` in
`flatMeshToBatchedModel.js`), the `Set` is private to the builder, and no
consumer reads either one. And the retention half of that is free without
touching the key at all: `this.seenPlacements.clear()` in `finalize()`, one
line, 396.65 MB measured. What that one line does **not** buy is the peak —
the `Set` is at its maximum exactly when the load ends, so only a cheaper key
moves the 2,664 MB high-water.

Second, and larger but not one-line: **the 475 MB `FlatMesh` graph needs
both of its owners dropped.** Share must stop accumulating `captured` when
`onMeshBatch` is consuming the stream (the fallback build is the only reader,
and it is dead code on a successful incremental assembly), and conway must
stop retaining `meshMap`/`vectorFlatMesh` entries past the batch that emitted
them. Either alone frees ~nothing; that is measured.

**Corrections this section forces on §7.** §7 says the two JS copies of every
geometry are "132.0 MB merged / 106.3 MB batched… ~238 MB of the 1,233".
That is a category error: geometry vertex and index data live in
`ArrayBuffer` backing stores, which are the **796 MB external bucket**, not
V8 objects. In the V8-object bucket `geometryCache` is **48.8 MB**, and
clearing it is worth that, not 238 MB. §7's arithmetic about the buffers
themselves stands; only its attribution to §8's 1,233 MB line does not.

**Unmeasured, and worth naming.** (a) Both `Map` identifications — the
192,022-entry one as `geometryCache`, the 228,971-entry one as conway's
`meshMap` — are by entry count and key shape, not proven: the probe recorded
each `Map`'s size and first key, not its value shape. Their *sizes* are
measured; their *names* are inferred. (b) Nothing here says when
during the load each structure grows, only what is standing at the end; the
per-stage split §8 wanted is still open. (c) The 38.0 MB unattributed is
spread thin enough (largest single site 4.3 MB) that it was not chased.


## 10. Still open

- **What is the split inside the geometry stage?** §8 says what the load ends
  holding and §9 says what that is made of; neither says what geometry itself
  added *when*, because the sampler was starved (see §8's last paragraph).
  Fixing the harness — out-of-band RSS sampling, in-page reads riding
  conway's progress callback — is a prerequisite for the next attempt.
  §9's sampling profiler is the missing half: it survives a starved main
  thread, and reading `getSamplingProfile` at each stage boundary would give
  the per-stage split directly.
- **Does parse's 778 MB scale with file size or with entity count?** Still
  unmeasured. D3D is 20.995 % inline entities, the highest in the corpus;
  PSB is 0.594 % and four times the size — comparing the two separates the
  terms, and the run in §8 is one env var away from PSB.
- ~~**Does geometry parallelise better or worse than parse?**~~ **Answered in
  §11, on D3D itself: comparable at N=2 (0.864 vs parse's 0.94) and much worse
  at N=4 (0.476 vs 0.857)**, on a box calibrated at 0.984–0.990 across four
  brackets. §6's worry about N workers sharing one 4 GiB linear memory does
  not apply to the shape that ships: with separate module instances per worker
  — what a no-COEP production has anyway — per-worker wasm memory *falls* with
  N (D3D 611 → 207 MB each at N=4) and total wasm grew 1.36×.
  **What is now open in its place:** why 60.7 % of D3D's products resolve no
  mapping source, and whether that is reducible; and why sharding changes 285
  of D3D's geometries (§11.5), which is a correctness defect rather than a
  performance one.
- **Why did geometry take 4,256 s here against 104.7 s in §0?** Still open,
  but **§11.7 eliminates the leading candidate.** Both of those are browser
  runs; §11 ran the *same source shape as the slow one* — materialised, not
  windowed — in Node and got **49.7 s**, i.e. 86× faster than §8 and 2.1×
  faster than §0's windowed browser load. So "materialised rather than
  windowed" is not what costs 4,256 s, and nothing here inverts
  `memory-residency.md`. The cost is browser-side and specific to that
  configuration; §8's own note that its main thread was starved for 72 minutes
  is the candidate now worth testing. Caveat: the browser figures come from
  other sessions, so this locates the cost rather than identifying it.
- **What does the tail of the 4 GiB budget actually do?** Nobody has driven
  a browser load into the wasm ceiling on purpose. `-s ABORTING_MALLOC=0`
  means a failed allocation returns null rather than aborting, so the first
  symptom is likely a nonsense pointer surfacing as one of #485's
  `Invalid typed array length` errors rather than an out-of-memory message.
  Worth knowing before a user finds it.

## 11. Geometry parallel efficiency, measured — and §2's 0.80 does not hold

**Answer first, on D3D itself: geometry's parallel efficiency is 0.86 at N=2
and 0.48 at N=4.** §2's assumed 0.80 at N=4 is wrong by a factor of 1.7. The
projected whole-load speedup from parallelising geometry falls from **2.62× to
1.75×**.

The sharper planning consequence is in the *shape* of the curve rather than
its level. Efficiency more than halves between N=2 and N=4, so on D3D's
104.7 s of geometry:

- N=2 takes it to **60.6 s**
- N=4 takes it to **55.0 s**

**Doubling from two workers to four buys 5.6 seconds of a 116-second load —
4.8 %.** Whatever a geometry pool is worth, essentially all of it is available
at N=2, and the machinery that makes N=4 work (four wasm instances, 6.2 GB of
device memory, a merged scene, asset-keyed delta capture) is being paid for a
twentieth of the load. That is the number to take into #635.

The mechanism is not either of the two §2 guessed at. It is not memory
bandwidth and it is not a shared wasm heap. It is **duplicated work**, and on
D3D conway itself names the cause in a warning printed by every shard:

```
[shard 0/4] 29031 of 47791 products have no placement key, so sharding is
mostly positional and shared geometry will be rebuilt per shard.
```

**60.7 % of D3D's product worklist has no mapping-source key at all.** For
those products `geometryDispatchKey` falls back to the product's own
`localID`, which is parse-order — so more than half of the production model is
sharded *positionally*, and positional sharding on a model with shared
assemblies rebuilds the shared geometry in every shard that touches it.
Measured: **2.03× the total CPU at N=4.**

### 11.1 What was measured, and on what

`scripts/m3_worker_pool.mjs` (instrumented here — see §11.8). N
`worker_threads`, each with **its own `IfcAPI`, its own wasm instance and its
own linear memory** — deliberately the no-SharedArrayBuffer shape, because
Share's `netlify.toml` omits COEP on purpose (§6) and the MT/SAB build is not
what production could ship. Each worker opens the model, claims a shard with
`SetGeometryShard`, and pumps to completion.

Sharding is `geometryDispatchKey` / `shardOfDispatchKey` exactly as
`parallel-load-pipeline.md` §5 describes it — the mapping-source key, not an
invented partition.

Efficiency is `T₁ / (N × Tₙ)` over the **geometry phase only** (`open`
excluded, so parse and file read are not diluting it), with `Tₙ` the slowest
shard — makespan, which is what wall clock actually becomes.

**Proof the work happened.** A timing line cannot distinguish a fast run from
a skipped one, so every run reports the geometry it actually built, deduped
across shards:

| | D3D, this harness at N=1 | D3D, §0's browser load |
|---|---:|---:|
| vertices | **3,204,498** | 3,204,852 |
| triangles | **2,452,715** | 2,453,022 |
| unique geometries | 46,166 | — |

**0.011 % apart on both counts**, and byte-identical across four separate
invocations. The run is real, and it is the same model: `FILE_NAME` reads
`D3D_POE 03-2-101_123_0002_18.0_Tekla model_03-2-101_123.ifc`, Tekla
Structures 2023, IFC4, 223,990,340 bytes = 213.6 MiB.

### 11.2 Box calibration

A register-bound integer spin loop, N separate **processes**, no allocation and
no memory traffic, run immediately before and immediately after each block of
geometry runs. Same instrument as M2's (which read 0.995 / 0.969 on its box).

| bracket | N=2 | N=4 | N=1 / N=2 / N=4 medians |
|---|---:|---:|---|
| before the model sweep | 0.997 | 0.990 | 20 745 / 20 802 / 20 956 ms |
| after the model sweep | 0.997 | 0.987 | 20 860 / 20 932 / 21 134 ms |
| before D3D | 1.003 | 0.988 | 20 914 / 20 860 / 21 168 ms |
| after D3D | 0.991 | 0.984 | 20 782 / 20 971 / 21 111 ms |

Idle box throughout — load average 0.02–1.9 at each bracket, no swap, 12.8 GB
or more free. Four independent brackets agree to 0.012 at N=2 and 0.006 at
N=4. **The hardware gives back 98.4–99.0 % at N=4; geometry gives back 48 %.
The missing 50 points are algorithmic, and nothing about this box explains
them.** This box is *better* than M2's at N=4 (≈0.986 vs 0.969), so the
geometry number is measured against a stricter ceiling than parse was, not a
more forgiving one.

### 11.3 The numbers

Payload digest off (see §11.8 for why, and for the digest-on set). Median
first, full spread in parentheses.

| model | file | geometry T₁ | N=2 efficiency | N=4 efficiency | runs |
|---|---:|---:|---|---|---:|
| **D3D (IFC4, Tekla)** | **213.6 MB** | **49.7 s** | **0.864** (0.863–0.865) | **0.476** (0.438–0.478) | 2 / 3 |
| MB-Khaya (IFC2X3, Archicad) | 31.4 MB | 3.5 s | 0.764 (0.741–0.775) | 0.471 (0.450–0.517) | 3 / 3 |
| Schependomlaan | 47.0 MB | 1.8 s | 0.686 (0.681–0.688) | 0.347 (0.322–0.375) | 3 / 3 |
| Snowdon Towers (IFC4, Revit) | 79.3 MB | 5.9 s | 0.743 (0.724–0.776) | 0.468 (0.451–0.475) | 3 / 3 |
| SKYLARK250 design-kit | 381.7 MB | 36.8 s | 0.522 | 0.252 | 1 / 1 |

Spreads are tight — no configuration spans more than 0.07, and D3D's N=2 spans
0.002. This is not a noisy measurement being over-read.

**D3D is the row that matters** (§0's load, 89.92 % geometry, the production
shape) and it is the reason the earlier draft of this section should not be
trusted where it extrapolated: D3D's N=2 efficiency of 0.864 is *better* than
any of the small models, while its N=4 of 0.476 sits right in the middle of
them. Extrapolating the small-model median (0.74 at N=2) to D3D would have
understated N=2 by 0.12 and, more importantly, would have hidden the collapse
between N=2 and N=4 that is this section's main planning result.

**SKYLARK250 is not a data point on the same curve; it is a different
failure.** It did not shard at all: 2,924 placements, and at both N=2 and N=4
**every one landed in shard 0** — the other workers opened the model, found
nothing to do, and exited. 0.252 at N=4 is exactly 1/N, the signature of no
parallelism rather than of bad parallelism. Its geometry hangs off
`IfcRelAggregates`, of which the model has **two**, and aggregate targets are
excluded from the product worklist and dispatched on the *relationship's* key
(`ifc_api_proxy_ifc.ts:2362-2364`). Two aggregates is a hard ceiling of two
shards, and one of them carries essentially everything.

**D3D does not have that problem**, which was worth checking because it would
have outranked the efficiency number. Probed directly:

| model | products | distinct product keys | `IfcRelAggregates` | aggregates per shard, N=4 |
|---|---:|---:|---:|---|
| D3D | 229,320 | 204,794 | **27,766** | 6 872 / 7 051 / 6 870 / 6 973 |
| Snowdon IFC4 | 7,115 | 4,106 | 86 | 30 / 18 / 17 / 21 |
| MB-Khaya | 2,872 | 2,384 | 28 | 4 / 7 / 7 / 10 |
| SKYLARK250 | 2,000 | 2,000 | **2** | 1 / 1 / 0 / 0 |

D3D's occupancy is genuinely balanced in both axes, and the delivered work
confirms it: **133,887 / 142,491 / 143,736 / 142,253** placements per shard, a
7 % spread. So aggregate count is a real partition floor that
`geometry_dispatch.ts` cannot see, SKYLARK250 sits on it, and **D3D does
not** — D3D's loss is duplication, not floor.

### 11.4 Where the points go: duplication, then imbalance

The harness reports summed shard CPU as well as makespan, and the two separate
cleanly. Duplication caps efficiency at `1/dup` before balance is considered
at all.

| model, N=4 | duplication (Σ shard CPU ÷ T₁) | ceiling that implies | measured | gap = imbalance |
|---|---:|---:|---:|---:|
| **D3D** | **2.03×** | **0.493** | **0.476** | **0.017** |
| MB-Khaya | 1.77× | 0.565 | 0.471 | 0.094 |
| Schependomlaan | 2.61× | 0.383 | 0.347 | 0.036 |
| Snowdon IFC4 | 1.68× | 0.595 | 0.468 | 0.127 |

At N=2 duplication is 1.15× on D3D and 1.17–1.38× on the others; at N=4 it is
1.68–2.61×. **It grows with N, and it is the dominant term at both.**

**D3D is the cleanest case in the set: 97 % of its N=4 loss is duplication and
3 % is imbalance.** Its four shards ran 25.2/24.7/23.3/24.2 s — near-perfect
balance — and still returned 0.476, because balance cannot help when the same
geometry is being built twice. Schependomlaan makes the same point
independently at 1.4/1.4/1.2/1.2 s for 0.347.

Two consequences for planning:

1. **This is not a scheduling problem and a work-stealing queue will not fix
   it.** On D3D better balance is worth 0.017. Removing duplication is worth
   the other half of the load. The lever is a partition that sees
   sub-representation sharing — or a geometry cache shared across workers,
   which separate module instances, the only shape available without COEP,
   structurally cannot have.
2. **Efficiency will keep falling as N rises**, because duplication rose
   monotonically from N=2 to N=4 on every model. Whatever N=8 is, it is below
   the naive extrapolation. It was not measured — see §11.6.

`parallel-load-pipeline.md` §5 predicted this shape and named the limit:
`geometryDispatchKey` removes duplication at the *representation* level, and
the sharing that remains lives below it — profiles, boolean operands, void
geometry — where an attribute walk cannot see. #394's correction comment
priced that residue at +15 % CPU on PSB and +40 % on MB-Khaya at N=4.
Measured here: **+77 % on MB-Khaya and +103 % on D3D.** The correction comment
had the right shape and was low by half.

What §5 did *not* predict is the 60.7 % keyless share on D3D. That is not the
residue of an imperfect key; it is the key not applying to most of the model.
**Any work on this should start by finding out why 29,031 of 47,791 products
resolve no mapping source**, because a partition that cannot see 60 % of the
worklist is not going to be fixed by refining the 40 % it can.

### 11.5 Sharding changes D3D's output, and that is a defect

At N=2 and N=4 on D3D the union check **fails**, deterministically and
identically across repetitions:

| configuration | placements | missing | extra | payload entries not in the reference | unique geometries | vertices |
|---|---:|---:|---:|---:|---:|---:|
| N=1 (reference) | 562,367 | — | — | — | 46,166 | 3,204,498 |
| N=2 | 562,367 | 0 | 0 | **188** | 46,317 | 3,230,586 |
| N=4 | 562,367 | 0 | 0 | **285** | 46,430 | 3,256,938 |

**Every placement is correct** — same count, nothing lost, nothing duplicated,
identical express IDs, colours and transforms. What differs is the *geometry
behind* some of them: at N=4, 285 entries carry vertex or index counts the
single-worker load never produced, and the model ends with 264 more unique
geometries and 1.6 % more vertices.

Four things pin this down as real rather than instrument noise:

- **It does not happen on the other models.** MB-Khaya at N=2 builds
  297,418 vertices / 251,242 triangles / 5,600 geometries, identical to its
  N=1 load; Schependomlaan likewise at 251,444 / 169,706 / 4,761, and that one
  through the digest path, so the bytes match too. The harness reports "OK" on
  those in exactly the runs that report "FAIL" on D3D. Whatever this is, it is
  a property of D3D's geometry, not of the instrument.

- **N=1 is deterministic.** Four separate invocations produced
  3,204,498 / 2,452,715 / 46,166 to the vertex.
- **The divergence is deterministic too**, and reproduces exactly: 188 at N=2
  and 285 at N=4 in both repetitions.
- **It scales with N** — more shards, more divergence — which is the signature
  of a shard-visibility effect, not of floating-point jitter. The counts
  differ, so this is different *topology*, not the same topology with
  different values.

The likely area is the interaction between shard membership and the
void/boolean handling that `ifc_api_proxy_ifc.ts` documents around
`aggregateTargetLocalIDs` and master rel-voids: a shard that cannot see the
voiding element produces the uncut solid. That is a hypothesis from the shape
of the evidence, **not something measured here**, and it should be run down
before any of this ships.

Two consequences worth stating plainly:

1. **The efficiency numbers in §11.3 are measured on a partition that does not
   reproduce the single-worker output on D3D.** A corrected partition has to
   make shards see more, not less, so if anything it does *more* work per
   shard. **0.476 is therefore an optimistic bound, not a midpoint.**
2. **This had never been detectable.** The union check's failure path carried
   a latent bug since #536: `process` in that script is an ESM *namespace*
   (`import * as process`), whose properties are read-only, so
   `process.exitCode = 1` threw a `TypeError` and killed the run before it
   printed a single timing. Every prior "OK" was real, but the first genuine
   mismatch — D3D's — surfaced as a crash with no numbers. Fixed here (assign
   through `globalThis`, report before flagging, and print what actually
   differs).

### 11.6 What this does not say

**N=8 is unmeasured and unmeasurable here.** This box has 4 cores. Any N=8
number from it would be oversubscription behaviour, not scaling, so none was
run and §2's N=8 row is marked unmeasurable rather than left looking pending.

**The path measured is the resident-source one.** Each worker does
`readFileSync` into a full in-memory copy and opens with `DEFER_GEOMETRY` —
no windowed provider, no store-backed open. Its bias is *favourable* to
parallelism: every worker holds a private copy and contends with no one for
I/O, where a shared windowed provider would add a contended resource this
configuration does not have. Combined with §11.5's optimism, **0.476 should be
read as "at best" rather than "about".**

**A correction to the earlier draft of this section, recorded so the next
person does not repeat it.** It claimed D3D was "not in `test-models/`, not
anywhere on the filesystem" and extrapolated 0.47 to D3D from four other
models. **That was wrong, and the search was the thing at fault.** There are
**two** model clones on this box:

| path | size | contains |
|---|---:|---|
| `/home/user/test-models` | 9.9 GB | the public corpus — MB-Khaya, Schependomlaan, Snowdon, SKYLARK250 |
| `/home/user/test-models-private` | 3.9 GB | the private, LFS-backed corpus — **`ifc/ryuga/D3D.ifc`**, and the `sp-*` set |

A `find` rooted at the public clone reports D3D missing and looks conclusive.
**Check both roots.** The extrapolation this forced was exactly the inference
§11.3's SKYLARK250 result says is unsafe, and measuring D3D changed the
headline: its N=2 efficiency is 0.12 higher than the extrapolated value, and
the N=2→N=4 collapse that §11's lede now leads with was invisible without it.

### 11.7 Memory is not the wall, and Node is not the slow path

**Memory.** §4 asked for this before anything got built, and the trap — that N
instances multiply D3D's peak and OOM — **does not materialise.**

| model | RSS N=1 | RSS N=2 | RSS N=4 | ×N=4 | wasm N=1 | wasm N=2 | wasm N=4 | ×N=4 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **D3D** | **3 045 MB** | **4 008 MB** | **6 220 MB** | **2.04×** | **611 MB** | **716 MB** | **828 MB** | **1.36×** |
| MB-Khaya | 590 MB | 830 MB | 1 348 MB | 2.28× | 102 MB | 130 MB | 198 MB | 1.94× |
| Schependomlaan | 475 MB | 822 MB | 1 528 MB | 3.22× | 74 MB | 100 MB | 165 MB | 2.23× |
| Snowdon IFC4 | 635 MB | 978 MB | 1 757 MB | 2.77× | 209 MB | 245 MB | 298 MB | 1.43× |

**Per-worker wasm memory falls with N, and on D3D it falls almost
perfectly: 611 MB at N=1 → 358 MB each at N=2 → 207 MB each at N=4.** Each
shard's working set is a fraction of the model's, so the linear memory each
instance grows to is a fraction too. D3D's *total* wasm across four workers is
828 MB against 611 MB for one — a 1.36× multiplier, not 4×.

This inverts §6's stated worry. §6 reasoned about N workers sharing **one**
4 GiB memory on the MT build and concluded per-shard transient multiplies
inside a fixed ceiling. With separate instances — the shape production can
actually have — each worker gets its own 4 GiB budget *and* needs a third of
it. **Per-worker headroom improves with N.**

D3D at N=4 peaked at **6.2 GB** total process RSS on a 16 GB box with no swap,
and did not come close to failing. What grows near-linearly is the V8 side
(D3D 1,693 MB → ~1,876 MB → ~2,167 MB) plus a per-worker Node floor.

So: **memory does not gate geometry parallelism at N=4 — the partition does.**
That reorders #635. What memory still gates is device class: 6.2 GB is fine on
a 16 GB machine and fatal on an 8 GB one, which is a product decision about
which laptops open a 213 MB model, not an engineering blocker on the pool.

**Node is not the slow path, and §10's 40× question needs restating.** §10
asks why geometry took 4,256 s "here" against 104.7 s in §0. Both of those are
**browser** runs: §0 is the OPFS store-backed load with a windowed provider,
§8's is `D3D.ifc` over HTTP into a materialised source with no windowed
provider. Against them, this section's Node number on the *same source shape
as the slow one*:

| run | runtime | source | D3D geometry |
|---|---|---|---:|
| §0 | Chromium | OPFS store-backed, windowed | 104.7 s |
| §8 | Chromium | HTTP fetch, materialised, not windowed | **4,256 s** |
| §11 | Node | `readFileSync`, materialised, not windowed | **49.7 s** |

**§10's leading candidate does not survive this.** If the materialised,
non-windowed source were what costs 4,256 s, the Node run of that same shape
would be slow too; it is 86× faster, and 2.1× faster than the windowed browser
load. So the 4,256 s is not a property of "materialised rather than windowed"
— it is something browser-side and specific to that configuration, and §8
names a plausible one in passing: its main thread was starved so hard that an
in-page sampler got 21 readings in 19 s and then nothing for 72 minutes.

The practical consequence for this section is the one the brief warned about,
and it resolves the other way: **Node is not a 40×-slow path for D3D
geometry, so measuring efficiency here is not measuring the wrong thing.**
The caveat that remains is the honest one — the browser figures come from
other sessions and possibly another box, so this is a comparison across
records rather than a controlled A/B, and it locates the cost rather than
identifying it.

### 11.8 Reproducing this

```sh
# box calibration, before and after — N processes, register-bound, no memory
node scripts/spin_calibrate.mjs --workers 1,2,4 --runs 3

# efficiency, per model; NO_PAYLOAD_DIGEST=1 removes the harness's own
# per-shard SHA-256, which rides on the duplication term it is measuring
NO_PAYLOAD_DIGEST=1 node --expose-gc --max-old-space-size=12288 \
  scripts/m3_worker_pool.mjs /home/user/test-models-private/ifc/ryuga/D3D.ifc \
  --workers 2,4
```

`spin_calibrate.mjs` is committed rather than re-derived per investigation:
M2 established the practice of calibrating the box and left no artifact, and
the practice is worth nothing if the next measurement reinvents the kernel and
gets a subtly different one. Run it **immediately before and after** the thing
being measured, not once a session — an earlier M2 run on a contended box
reported D3D as a net loss at every N, and re-measurement on an idle box
turned it into a 1.15× win.

`m3_worker_pool.mjs` gained four things here, all of which the D3D run needed:
the duplication factor and per-shard geometry times (§11.4 is not derivable
without them), per-worker wasm/V8 heaps and kernel `VmHWM` (§11.7),
`NO_PAYLOAD_DIGEST=1`, and the geometry-built line (§11.1) — because a timing
line cannot distinguish a fast run from a skipped one, and D3D's two-minute
run needed to prove itself against a 70-minute expectation. Plus the union
check's crash fix (§11.5).

The digest-on set, kept because it is the conservative reading and because the
gap between the two bounds the instrument, is: MB-Khaya 0.727 / 0.422,
Schependomlaan 0.723 / 0.322, Snowdon 0.764 / 0.450 at N=2 / N=4. **The digest
costs at most 0.05 of efficiency**, most of it on the models with the highest
duplication, exactly as expected — a shared geometry that two shards both
build is also one that two shards both hash. Every number in §11.3–§11.7 is
from the digest-off runs.
