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
optimistic by about 1.45× at N=4.** Both rows are kept — the assumed one so
the correction is legible, the measured one because it is what should be
planned against. *(The measured rows were themselves corrected once — an
earlier draft of §11 read 0.864 / 0.476 off a harness whose duplication
factor was wall time reported as CPU. §11's lede has the retraction; these
are the numbers from the corrected instrument.)*

| configuration | efficiency | geometry | total | speedup |
|---|---|---:|---:|---:|
| ~~geometry N=4~~ | ~~0.80 assumed~~ | ~~32.7 s~~ | ~~44.5 s~~ | ~~2.62×~~ |
| ~~geometry N=8~~ | ~~0.65 assumed~~ | ~~20.1 s~~ | ~~31.9 s~~ | ~~3.65×~~ |
| ~~geometry N=4 + parse N=4~~ | ~~0.80 / 0.857 assumed~~ | — | ~~37.8 s~~ | ~~**3.08×**~~ |
| geometry N=2 | **0.885 measured on D3D** (§11) | 59.1 s | 70.9 s | **1.64×** |
| geometry N=4 | **0.552 measured on D3D** (§11) | 47.4 s | 59.2 s | **1.97×** |
| geometry N=4 + parse N=4 | 0.552 / 0.857 | 47.4 s | 52.3 s | **2.23×** |
| geometry N=8 | **unmeasurable here** — 4-core box; §11.6 | — | — | — |

These are measured **on D3D itself**, not transferred from another model —
which matters, because §11.3's SKYLARK250 result (1/N efficiency, no partition
at all) shows the model-to-model spread on this axis runs the whole way down.

**Read the first two rows together before planning anything.** Going from two
workers to four moves geometry 59.1 s → 47.4 s: **11.7 seconds of a
116-second load, 10.1 %.** Efficiency falls by 38 % across that step
(0.885 → 0.552), so **N=2 banks 80 % of everything N=4 offers** — on two wasm
instances and 4.0 GB rather than four and 6.2 GB (§11.7). *(An earlier draft
put the N=2→N=4 step at 4.8 % and called the efficiency fall a halving. Both
came from the pre-correction efficiencies; the conclusion is the same and the
margin behind it is twice as wide.)*

Both bounds on these numbers point the same way, so they are ceilings rather
than midpoints: the partition measured **does not reproduce the
single-worker output on D3D** (§11.5 — 247 of its 46,166 geometries come out
with different topology at N=4, and a fix makes shards see more, not less),
and the load path measured has **no contended provider** where a windowed one
would (§11.6).

The assumed numbers were borrowed from the *parse* measurements, on the
reasoning that parse sharding degraded from 0.94 at N=2 to 0.857 at N=4 while a
register-bound spin loop held 0.97 — a memory-bandwidth signature — and that
geometry, being compute-heavy with a small working set, was plausibly a
*better* scaler.

**At N=4 it is a worse one, and the dominant term is the one neither guess
named.** It is not a shared wasm heap — each worker has its own linear memory,
which *shrinks* with N (611 MB → 207 MB each on D3D). It is mostly
**duplicated work**: geometry shared below the representation level gets
rebuilt in every shard that touches it, and the shards build **1.48× as many
geometries** as one worker does on D3D at N=4. That is **72 %** of the loss.

Memory bandwidth is *not* eliminated, though, which an earlier draft of §11
claimed on the strength of a register-bound spin loop that by construction
cannot see it. Measured against a bandwidth-bound kernel and against the
harness's own `open` and prep-probe contention controls, the box accounts
for about **5 of the 45 points** lost at N=4 (4–9 across repetitions) — a
minority, but not nothing.

§11's prep-side split has since been corrected a second time: the shard-only
dispatch-key pass is **23 % of sharded prep on D3D and 69 % on
Schependomlaan**, and on Snowdon and MB-Khaya it is **not resolvable** from
outside `src/` at all. §11.4 leads with why.

The root cause of the duplication on D3D is sharper than "an imperfect key":
**60.7 % of its product worklist (29,031 of 47,791) resolves no mapping source
at all**, so most of the production model is sharded positionally. §11.4 has
the full decomposition — and note that on the three smaller models the shards
rebuild **no emitted geometry at all**, so this mechanism is D3D's, not the
corpus's. (Sharing *below* the emitted level is what `dupWork` cannot see and
what §10 carries as open.)


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
  §11, on D3D itself: comparable at N=2 (0.885 vs parse's 0.94) and much worse
  at N=4 (0.46–0.56 vs 0.857)**, on a box calibrated at 0.983 (register-bound)
  and 0.966 (bandwidth-bound, on a working set derived from this box's L3) at
  N=4 across three brackets. §6's worry about N
  workers sharing one 4 GiB linear memory does not apply to the shape that
  ships: with separate module instances per worker — what a no-COEP production
  has anyway — per-worker wasm memory *falls* with N (D3D 611 → 207 MB each at
  N=4) and total wasm grew 1.36×.
  **What is now open in its place:** why 60.7 % of D3D's product worklist
  resolves no mapping source, and whether that is reducible; why sharding
  changes at least 247 of D3D's 46,166 geometries (§11.5), which is a
  correctness defect rather than a performance one; and — from §11.4 —
  whether the worklists *and dispatch keys* can be computed once and handed
  to the workers, since where the term resolves the key pass alone is 69 % of
  sharded prep on Schependomlaan and 23 % on D3D and no partition change
  touches it. (On Snowdon and MB-Khaya it does not resolve — §11.4 — so a
  fourth open question is an in-`src/` timer for `ensureDemandWorklists_`,
  since the first-batch window on those models is 82–83 % geometry and no
  external instrument can see past it.)
- **Do the shards rebuild shared geometry *below* the representation?**
  Untested, and it is the one hypothesis §11's retractions do not exclude.
  `dupWork` is keyed on emitted `geometryExpressID`s, so profiles, boolean
  operands, void/master geometry and mapped-item sources — the exact class
  `geometry_dispatch.ts` says the key cannot see — are invisible to it
  (§11.6). §11.4 reports per-geometry slowdowns of **1.33× on MB-Khaya and
  2.29× on Schependomlaan with `dupWork` 1.00**, and this box's `stream`
  ceiling at N=4 is 0.966 with four processes reaching 3.8× of a possible 4×
  of memory bandwidth (§11.2) — so contention does not plausibly account for
  2.29×. A shard rebuilding shared sub-representation geometry produces
  exactly that signature. This is the hypothesis that would resurrect the
  retracted "+77 % on MB-Khaya", and nothing in §11 tests it. What would: a
  `CanonicalMesh`-level construction counter inside the geometry pipeline,
  summed per shard against the single worker's, which is the same
  unique-only accumulation `dupWork` already does one level up.
- **Why did geometry take 4,256 s here against 104.7 s in §0?** Still open,
  but **§11.7 eliminates the leading candidate.** Both of those are browser
  runs; §11 ran the *same source shape as the slow one* — materialised, not
  windowed — in Node and got **36.0 s**, i.e. 118× faster than §8 and 2.9×
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

## 11. Geometry parallel efficiency, measured — with a correction to this section's own first draft

**Read the correction before the numbers.** The first version of this section
reported a **duplication factor of 2.03× on D3D at N=4** and built its whole
mechanism claim on it. That number was **summed shard *wall* time**, printed
under a comment calling it CPU. A wall ratio cannot separate "each shard did
twice the work" from "each shard ran twice as slow under contention" — which
is exactly the alternative it was used to eliminate.

The harness now counts the work itself as well as the time: geometries
built and vertex floats built, summed over shards, against the single
worker's own totals (`dupWork` / `dupVerts`), plus the first-batch window
that contains worklist prep (`dupFirstBatch`, called `dupPrep` in the second
draft and renamed here — §11.1 and §11.4 say why). Re-measured on the same
box, same models, same mode:

| model, N=4 | `dupWall` (the old "duplication") | **`dupWork`** | what the old number was |
|---|---:|---:|---|
| **D3D** | 1.72× | **1.48×** | real duplication, overstated by a third |
| MB-Khaya | 1.94× | **1.00×** | **not duplication at all** |
| Schependomlaan | 3.17× | **1.00×** | **not duplication at all** |
| Snowdon IFC4 | 1.84× | **1.05×** | **not duplication at all** |

So, plainly:

- **Retained, corrected.** D3D *does* rebuild geometry under sharding. The
  factor is **1.48×**, not 2.03×. That reconciles with the repo's own figure
  from the other side: `ifc_api_proxy_ifc.ts` records **+38.1 % duplicated
  assets on D3D at N=4** under this dispatch key, and 1.48 is near 1.38, not
  near 2.03. The 2.03 had no in-repo counterpart and should have been chased
  at the time.
- **Retracted, scoped.** "Measured here: +77 % on MB-Khaya and +103 % on D3D"
  against #394's predicted +40 %. MB-Khaya rebuilds **no emitted geometry** —
  its four shards build 5,600 geometry IDs between them, exactly what one
  worker builds. Same for Schependomlaan. The correction comment was not "low
  by half"; on three of four models it was high, and #394's prediction is not
  contradicted by anything measured here. **The scope is load-bearing:**
  `dupWork` counts geometry that reaches a placed ID, and this repo's own
  dispatch code says the sharing that survives its key lives *below* that
  (§11.6). "Rebuilds nothing" is one level up from what the counter measures.
- **Retracted.** "97 % of D3D's N=4 loss is duplication and 3 % is
  imbalance." The real split is **72 % duplication, 12 % per-geometry
  slowdown, 9 % the first-batch window, 7 % imbalance** (§11.4) — where the
  middle two are one measured quantity split by a cut, and only their sum
  (21 %) is measured.
- **Retracted.** "The missing 50 points are algorithmic, and nothing about
  this box explains them." A register-bound spin loop is *by construction*
  blind to a memory ceiling, so it never could have supported that. With a
  bandwidth-bound kernel and with the harness's own `open` and prep-probe
  contention controls, the box explains **about 5 of the 45 points** D3D
  loses at N=4 (4–9 across three repetitions) — a minority, but not zero
  (§11.2). The second draft's *quantity* for the kernel gap ("three points of
  ceiling") is dropped in this round: it was half the spread of its own
  samples, and on a working set that was 1.6 % **under** this box's L3 rather
  than orders of magnitude past it (§11.2).
- **Retracted, narrowed.** "On all three small models the largest prep-side
  term is the shard-only dispatch-key pass, 52–68 % of sharded prep." That
  came from subtracting the unsharded pool's summed first-batch window from
  the sharded pool's, and the two do not pump the same products — a sharded
  worker's `demandProducts_` is the filtered worklist, so its first product
  is not the reference's (§11.4). Re-measured with the geometry removed
  per worker, the key pass is **23 % of sharded prep on D3D and 69 % on
  Schependomlaan**, both resolved in two sessions and at both N; on **Snowdon
  and MB-Khaya it does not clear its own error bar** and is withdrawn rather
  than restated. The lever's direction survives; its evidence on the small
  models is one model, not three.
- **Unchanged.** §2's assumed 0.80 at N=4 still does not hold, the memory
  result in §11.7 stands to the megabyte, and SKYLARK250 still does not shard.

**Answer first, on D3D itself, on the corrected instrument: geometry's
parallel efficiency is 0.885 at N=2 and 0.552 at N=4.** The projected
whole-load speedup from parallelising geometry is **1.97× at N=4**, against
§2's assumed 2.62×.

The planning shape survives the correction and is milder than the first draft
said. On D3D's 104.7 s of browser geometry:

- N=2 takes it to **59.1 s**
- N=4 takes it to **47.4 s**

**Doubling from two workers to four buys 11.7 seconds of a 116-second load —
10.1 %**, where the first draft said 4.8 %. N=2 still banks **80 %** of
everything N=4 offers, on two wasm instances and 4.0 GB rather than four and
6.2 GB (§11.7), so the recommendation into #635 is the same one; the margin
behind it is twice as wide as reported.

### 11.1 What was measured, and on what

`scripts/m3_worker_pool.mjs` (fixed here — see §11.8). N `worker_threads`,
each with **its own `IfcAPI`, its own wasm instance and its own linear
memory** — deliberately the no-SharedArrayBuffer shape, because Share's
`netlify.toml` omits COEP on purpose (§6) and the MT/SAB build is not what
production could ship. Each worker opens the model, claims a shard with
`SetGeometryShard`, and pumps to completion.

Sharding is `geometryDispatchKey` / `shardOfDispatchKey` exactly as
`parallel-load-pipeline.md` §5 describes it — the mapping-source key, not an
invented partition.

Efficiency is `T₁ / (N × Tₙ)` over the **geometry phase only** (`open`
excluded, so parse and file read are not diluting it), with `Tₙ` the slowest
shard — makespan, which is what wall clock actually becomes.

**Three duplication factors, and they are not interchangeable.** This is the
distinction the first draft did not have:

| reported | what it is | what it can and cannot say |
|---|---|---|
| `dupWall` | Σ shard geometry **wall** time ÷ T₁ | how much shard-time the partition spent. Cannot say why. |
| `dupWork`, `dupVerts` | geometries and vertex floats **built**, Σ over shards ÷ the single worker's | whether the shards did more *work* — of the kind that reaches a placed geometry ID. Immune to speed. See §11.6 for what it cannot see. |
| `dupFirstBatch` | first-batch **wall** time, Σ over shards ÷ the single worker's | how much longer the window containing worklist prep took. A **mixture**, and it has `dupWall`'s exposure exactly. |

`dupFirstBatch` is reported because the first `ExtractGeometryBatch` call is
where `ensureDemandWorklists_` runs. **It is named for the window, not for a
mechanism, because this round found it is not one** — the second draft
reported it as `dupPrep` and read it as "the same prep, N times", and it is
four things at once:

- **Replicated prep.** `collectDemandCandidates_` — the `IfcProduct` walk and
  `aggregateTargetLocalIDs()` over every `IfcRelAggregates`. A shard does not
  shrink this, and every worker does all of it. This is the part the name
  claimed.
- **A dispatch-key pass that only a sharded worker runs at all.**
  `ensureDemandWorklists_` returns early at `this.shard_ === void 0`
  (`ifc_api_proxy_ifc.ts:2280`), so **the N=1 reference in the denominator
  computes not one dispatch key.** Every N>1 worker additionally runs
  `geometryDispatchKey` over every worklist product *and* every
  `IfcRelAggregates` (`:2298-2313`), then filters both lists. Dividing shard
  work by a reference that is a strict subset of it is not a replication
  factor, and this term is not something an unsharded pool of N would pay —
  it exists because sharding exists.
- **One batch of 64 products of real geometry**, on both sides of the ratio
  and in different proportions.
- **Contention**, because it is wall time — the identical exposure the row
  above caveats for `dupWall`, and the second draft's table put this row
  beside it with no such caveat.

`--prep-probe` separates them by measurement rather than by argument, and
§11.4 reports what it found — including where the separation **fails**, which
on two of the four models it does: the pump floors a batch of 0 at one
product, so the smallest window the probe can time still contains geometry,
and where that one product costs more than the term being separated the split
is not resolvable from outside `src/`. The ratio itself is kept, under a name
that claims only what it times.

**Proof the work happened.** A timing line cannot distinguish a fast run from
a skipped one, so every run reports the geometry it actually built, by
geometry ID across shards:

| | D3D, this harness at N=1 | D3D, §0's browser load |
|---|---:|---:|
| vertices | **3,204,498** | 3,204,852 |
| triangles | **2,452,715** | 2,453,022 |
| unique geometries by ID | 46,166 | — |

**0.011 % apart on both counts**, and identical across every N=1 invocation in
both measurement sessions. The run is real, and it is the same model:
`FILE_NAME` reads `D3D_POE 03-2-101_123_0002_18.0_Tekla
model_03-2-101_123.ifc`, Tekla Structures 2023, IFC4, 223,990,340 bytes =
213.6 MiB.

### 11.2 Box calibration — and what a spin loop cannot calibrate

Brackets run immediately before and immediately after each block of geometry
runs, N separate **processes**. Two kernels now, because one of them was
being asked a question it cannot answer:

- **`spin`** — register-bound integer loop, no allocation, no memory traffic.
  Same instrument as M2's (which read 0.995 / 0.969 on its box).
- **`stream`** — sequential reads over a per-process working set sized past
  this box's last-level cache, so it is bound by DRAM bandwidth. **New
  here.** The spin loop never touches memory, so it is *by construction*
  incapable of detecting a memory-bandwidth ceiling; the first draft used it
  to rule one out anyway.

**The `stream` kernel's stated justification was false, and the working set is
now derived rather than asserted.** It was fixed at 256 MiB, justified as
"far larger than any last-level cache … one to two orders of magnitude below
this". This box reports **L3 = 266,240 K = 260 MiB, shared across cpus 0-3**
(`/sys/devices/system/cpu/cpu0/cache/index3`), so the buffer sat **1.6 %
under** the cache it claimed to be two orders of magnitude above. The number
survived anyway, but by measurement rather than by the margin — swept at N=1:

| working set | GB/s per process |
|---:|---:|
| 64 MiB | **11.62** (cache-resident) |
| 256 MiB | 5.63 |
| 1,024 MiB | 5.51 |
| 2,048 MiB | 5.50 |

Flat from 256 MiB to 2 GiB, so 256 MiB was already DRAM-bound on this box —
the reported 260 MiB L3 is almost certainly the *host's* whole shared cache
seen from a guest, not a share four cores can hold. `spin_calibrate.mjs` now
reads the cache from sysfs, sizes the working set at **4× it or 1 GiB,
whichever is larger** (1,040 MiB here), prints the ratio and the achieved
GB/s on every run, and **refuses** rather than reporting a cache-resident
number as a bandwidth ceiling. `--stream-mib` overrides it, which is how the
table above was taken.

**The numbers below are on the corrected kernel and are not comparable to the
second draft's**, which used the 256 MiB one. Three brackets around this
round's runs:

| bracket | `spin` N=1 median | `spin` N=2 | `spin` N=4 | `stream` N=2 | `stream` N=4 |
|---|---:|---:|---:|---:|---:|
| before | 19,555 ms | 0.996 | 0.983 | 1.002 | 0.970 |
| between | 19,427 ms | 0.991 | 0.981 | 0.980 | 0.966 |
| after | 19,553 ms | 0.996 | 0.987 | 0.982 | 0.947 |
| **median** | **19,553 ms** | **0.996** | **0.983** | **0.982** | **0.966** |

**The absolute median column is restored, and it is not decoration.** It is
the only cross-session *level* control this method has: `spin()` and
`ITERATIONS = 3_000_000_000` are byte-identical across every commit on this
branch, so the milliseconds are directly comparable between sessions where
the efficiency ratios — `base ÷ median(table[N])` — are invariant to how fast
the box is and cannot speak to level at all. The second draft deleted the
column and then used the ratios to argue about level; §11.3 has the
consequence. Session 1's column, for comparison: 20,745 / 20,860 / 20,914 /
20,782 ms.

Idle box throughout — load average 0.6–3.0 at each bracket (the higher
readings are the previous block's decay, taken before the first timed spin),
no swap, 12 GB or more free. The children start behind a **ready/go
barrier**, so fork and Node boot are outside the timed window; without it the
first child spins uncontended for the whole boot skew and the ceiling comes
out optimistic by about the same order as the deficit being measured.

**A spin loop cannot see a memory-bandwidth ceiling. On this box there is
barely one to see, and the second draft over-read its own samples.** That
draft put the gap at "three points of ceiling the first draft's instrument was
structurally unable to see" — 0.030, from five `stream` N=4 readings of 0.951
/ 0.980 / 0.935 / 0.923 / 0.958, a spread of **0.057**, one of which read N=4
*above* its own N=2, which is not physical for a bandwidth-bound kernel. The
quantity was half the spread of the samples it came from. On the corrected
kernel the gap is **1.7 points** (`spin` 0.983 against `stream` 0.966) with
the `stream` row itself spread 0.023 — still not resolved above its own
noise. **The qualitative point stands and matters** (a register-bound loop
gives no licence to rule out a memory ceiling); **the number does not**, in
either draft.

The mechanism is visible in the bandwidth column: 5.60 GB/s per process at
N=1 and 5.30 at N=4, so **four processes deliver 21.2 GB/s against one's
5.6 — 3.8× of a possible 4×.** This box's memory system is nowhere near
saturated by four cores, which is what a 260 MiB host L3 implies about the
rest of the host. That bounds how much of §11.4's per-geometry slowdown
memory bandwidth can be — see §11.6.

**A third calibration, and the most relevant one, is inside the harness
already.** The `open` phase is *identical work in every worker* — each opens
the whole file, with no shard applied at all — so any wall inflation at N is
pure contention on a real conway workload:

| model | `open` N=1 | N=2 | N=4 | N=4 inflation |
|---|---:|---:|---:|---:|
| **D3D** | **3.8 s** | **3.8 s** | **4.7 s** | **1.24×** |
| SKYLARK250 | 4.1 s | 4.4 s | 5.1 s | 1.24× |
| Snowdon IFC4 | 0.8 s | 0.8 s | 1.0 s | 1.25× |
| Schependomlaan | 0.7 s | 0.8 s | 1.2 s | 1.71× |
| MB-Khaya | 0.4 s | 0.4 s | 0.8 s | 2.0× |

(The two multi-second rows are the trustworthy ones; the sub-second ones are
at the harness's 0.1 s print resolution.) **Four concurrent workers doing
identical conway work take 1.24× as long as one** — an effective ceiling of
**0.81**, not 0.98. So the honest statement is: this box gives back somewhere
between 0.81 and 0.98 at N=4 depending on how memory-hungry the kernel is,
and §11.4 measures where geometry actually falls in that range: **1.09× per
geometry on D3D at N=4** (1.07–1.15 across three repetitions), i.e. an
effective 0.92. **About 5 of the 45 points D3D loses at N=4 are the box**, 4
to 9 depending on the repetition. The remaining ~40 are algorithmic. That is a
weaker claim than "nothing about this box explains them", and it is the one
the evidence supports.

**A fourth control agrees with the third.** `--prep-probe` runs N workers
through the identical *unsharded* worklist build — same code path, same work,
no shard — so its inflation over N times one worker is contention and nothing
else. On the corrected instrument (§11.4: the geometry is now subtracted per
worker, so this ratio is prep against prep rather than window against window)
it reads **1.35× on D3D at N=4**, against the `open` control's 1.24× on the
same model, and 1.51–2.57× on the small models where `open` reads 1.25–2.0×.
Two independent slices of real conway work, taken years apart in the load,
bracket this box's contention on conway at **1.24–1.35× at N=4** on the model
that matters. (The third draft published 1.27× and 1.31–1.89× here, from the
uncorrected windows; the direction is unchanged and the bracket widens by
four points.)

### 11.3 The numbers

Payload digest off (see §11.8). Median of three repetitions per model, full
spread in parentheses. **Read the spreads as the range of three samples, not
as an interval anything falls inside.** A fourth repetition of every model,
taken while fixing round 2, landed outside the quoted spread on three of the
four: D3D 0.880 / 0.460 (against 0.873–0.908 and 0.530–0.562), Schependomlaan
0.741 / 0.325 (0.664–0.678, 0.284–0.303), Snowdon 0.759 / 0.418
(0.669–0.782, 0.396–0.447), MB-Khaya 0.723 / 0.469 (0.724–0.755,
0.477–0.479). The *conclusions* are unmoved — the ordering across models, the
N=2-banks-most-of-N=4 shape and every `dupWork` are identical — but a
three-sample range on this box understates the variance by roughly a factor
of two.

| model | file | geometry T₁ | N=2 efficiency | N=4 efficiency | runs |
|---|---:|---:|---|---|---:|
| **D3D (IFC4, Tekla)** | **213.6 MB** | **36.0 s** | **0.885** (0.873–0.908) | **0.552** (0.530–0.562) | 3 / 3 |
| MB-Khaya (IFC2X3, Archicad) | 31.4 MB | 2.6 s | 0.724 (0.724–0.755) | 0.478 (0.477–0.479) | 3 / 3 |
| Schependomlaan | 47.0 MB | 1.4 s | 0.665 (0.664–0.678) | 0.295 (0.284–0.303) | 3 / 3 |
| Snowdon Towers (IFC4, Revit) | 79.3 MB | 4.4 s | 0.734 (0.669–0.782) | 0.425 (0.396–0.447) | 3 / 3 |
| SKYLARK250 design-kit¹ | 381.7 MB | 25.8 s | 0.552 | 0.292 | 1 / 1 |

¹ One run, and the only one in this table not taken on a quiet box — a few
seconds of unrelated smoke runs overlapped its N=1 phase. It is kept because
its result is structural rather than timed: every placement lands in one
shard, so its efficiency is 1/N by construction and no timing precision
changes it. Its absolute `T₁` (25.8 s against the first draft's 36.8 s) should
be trusted least of any number here.

**A level shift against the first draft — and the current level is the
reproducible one.** D3D's `T₁` reads **36.0 s** here (39.9 / 35.7 / 36.0
across three invocations, the first cold) against **49.7 s** in session 1,
and its efficiencies come out correspondingly better (0.885 / 0.552 against
0.864 / 0.476).

**The second draft's control for this was invalid and is withdrawn.** It
argued the box was not faster because "this session's `spin` medians are
marginally worse (0.981 vs 0.984–0.990 at N=4)". Those are **efficiency
ratios** — `base ÷ median(table[N])` — which are invariant to how fast the
box is: a box 40 % faster reports identical efficiency. The argument cannot
bear on a level question **by construction**, which is the same class of error
that killed `dupWall` in round 1, made two sections later.

**The absolute data existed and the rewrite deleted it.** `spin()` and
`ITERATIONS` are byte-identical between `0c9312a4` and this commit and the
script has always printed `median=…ms`; session 1's §11.2 recorded exactly
that column. Restored in §11.2, and it answers the question the ratios could
not: **`spin` N=1 medians 19,427–19,555 ms now against 20,745–20,914 ms in
session 1 — this box is about 6.5 % faster than it was.**

Everything else was run down in this round, and most of it is ruled out:

| candidate | verdict | evidence |
|---|---|---|
| the instrument diff touched the timed region | ruled out | inside `tGeometry`…`geometryMs` the diff adds a `Number.isInteger` guard per placement and one `performance.now()` per batch (~750 calls) |
| the `wasmHeapByteLength` refresh perturbs timing | ruled out | read after `geometryMs` is taken, not inside it |
| the `open`/geometry boundary moved | ruled out | identical in both commits |
| the reference path shares work it used to repeat | ruled out | this PR changes no `src/` file at all |
| `--expose-gc` (the one documented invocation difference) | **ruled out, measured** | D3D N=1: 37.0 s with it, 37.2 s without |
| host memory-bandwidth contention in session 1 | largely ruled out, measured | two saturating DRAM streamers on 2 of 4 cores cost D3D N=1 **+4.6 %** (37.2 → 38.9 s) |
| scalar CPU speed | **bounded, measured** | `spin` N=1 median 19,553 ms today against session 1's ~20,820 ms: the box is **6.5 % faster** |
| 49.7 s was the outlier | **supported** | eight independent N=1 readings now — 39.9 / 35.7 / 36.0 in the sweeps, 37.2 / 37.0 / 38.9 in the review, 35.9 and 34.3 while fixing this round. **49.7 s has never reproduced**, and it was a median of *two* samples against an N=4 spread of 0.438–0.478 |

Provenance: the `--expose-gc`, DRAM-streamer and three-reading rows were
measured in the round-2 review of this section; the `spin` column, the two
newest `T₁` readings and the diff audit were re-taken here.

So: **the current level reproduces and the old one does not.** Of the 38 %
gap (49.7 ÷ 36.0 = 1.38), box speed accounts for 6.5 points; on today's
silicon session 1's own work would have read about 38 s, not 49.7 s. The
remaining ~30 % is still unexplained, with cross-session variance on a shared
host and session 1's leaked `spin_calibrate.mjs` children (it had no cleanup
path; fixed in §11.8) the surviving candidates. **Every ratio in this section
is computed within one invocation against that invocation's own `T₁`**, so
the ratios do not depend on the level; the absolute seconds do, and should
not be compared across sessions.

**D3D's N=4 efficiency is looser than the three-run spread says.** A fourth
full sweep, taken while fixing this round, reads **0.460** — below the
0.530–0.562 quoted above. Its N=4 makespan is ordinary (18.6 s against the
median run's 18.1 s); what moved is `T₁`, which came out at **34.3 s**, the
fastest recorded. Efficiency is `T₁ ÷ (N × Tₙ)`, so most of D3D's
repetition-to-repetition spread at N=4 is `T₁` variance rather than anything
about the pool. Read the N=4 figure as **~0.46–0.56**, and the planning
numbers built on 0.552 as the optimistic end of that — which is the same
direction §11.5 and §11.6 already point.

**D3D is the row that matters** — §0's load, 89.92 % geometry, the production
shape. Its N=2 efficiency of 0.885 is the best in the set, and its N=4 of
0.552 is also the best. Extrapolating from the small models would still have
been wrong, in the same direction as before.

**SKYLARK250 is not a data point on the same curve; it is a different
failure**, and the corrected instrument makes that sharper rather than
softer. It did not shard at all: 2,924 placements, and at both N=2 and N=4
**every one landed in shard 0** — `per-shard=2924/0` and `2924/0/0/0`, with
`shard-built` the same shape. Its `dupWork` is **1.00** and its `dupWall` at
N=4 is **0.86**, i.e. below
one: the single working shard ran slightly *faster* than the reference,
because the other three workers had nothing to do and never contended. 0.292
at N=4 is 1/N, the signature of no parallelism rather than of bad
parallelism. Its geometry hangs off `IfcRelAggregates`, of which the model has
**two**, and aggregate targets are excluded from the product worklist and
dispatched on the *relationship's* key (`ifc_api_proxy_ifc.ts:2362-2364`).
Two aggregates is a hard ceiling of two shards, and one of them carries
essentially everything.

**D3D does not have that problem**, which was worth checking because it would
have outranked the efficiency number. Probed directly:

| model | `IfcProduct` total | in the demand **product worklist** | distinct product keys | `IfcRelAggregates` | aggregates per shard, N=4 |
|---|---:|---:|---:|---:|---|
| D3D | 229,320 | **47,791** | 204,794 | **27,766** | 6 872 / 7 051 / 6 870 / 6 973 |
| Snowdon IFC4 | 7,115 | — | 4,106 | 86 | 30 / 18 / 17 / 21 |
| MB-Khaya | 2,872 | — | 2,384 | 28 | 4 / 7 / 7 / 10 |
| SKYLARK250 | 2,000 | — | 2,000 | **2** | 1 / 1 / 0 / 0 |

**The two D3D product counts are different populations, and dividing one by
the other means nothing.** `collectDemandCandidates_` builds the product
worklist as `model.types(IfcProduct)` **minus** `aggregateTargetLocalIDs()`
(`ifc_api_proxy_ifc.ts`), because aggregate targets are extracted by the
rel-aggregates pass instead, on the relationship's key. So D3D's 229,320
products are 47,791 worklist products plus **181,529 aggregate targets**
reached through the 27,766 relationships. The keyless share quoted below —
and everywhere in this section — is a share of the **47,791**, which is the
population `geometryDispatchKey` is called on and the one
`parallel-load-pipeline.md` §5 means by "the model with 47 k products".

D3D's occupancy is genuinely balanced in both axes, and the delivered work
confirms it: **133,887 / 142,491 / 143,736 / 142,253** placements per shard, a
7 % spread. So aggregate count is a real partition floor that
`geometry_dispatch.ts` cannot see, SKYLARK250 sits on it, and **D3D does
not**.

### 11.4 Where the points go: duplication, then contention, then the first-batch window, then imbalance

The harness reports summed shard time, summed shard *work*, and the summed
first-batch window, and the four terms separate cleanly. Everything below is
D3D at N=4, from the repetition whose efficiency **is** the median of the
three (`T₁ = 39.9 s`, so the terms and the headline number are one
self-consistent run rather than four separately-medianed ones):

| term | measured | efficiency after it | cost | share of the loss |
|---|---:|---:|---:|---:|
| perfect N=4 | — | 1.000 | — | — |
| **duplicated geometry** | `dupWork` **1.48×** (68,192 built vs 46,166) | 0.677 | **0.323** | **72 %** |
| **per-geometry slowdown** | **1.09×** (0.922 ms vs 0.847 ms each) | 0.622 | 0.055 | 12 % |
| **the first-batch window** | residual **1.07×** — 5.8 s summed vs 0.8 s of window, decomposed below | 0.581 | 0.041 | 9 % |
| **imbalance** | 18.1 / 17.3 / 16.5 / 16.8 s | **0.552** | 0.029 | 7 % |

The three repetitions agree on the largest term to the third decimal —
`dupWork` is **1.48× in every one** — and spread the smaller ones: slowdown
costs 0.043–0.089, the window 0.033–0.041, imbalance 0.024–0.037.

**Three things about this table's arithmetic, since it is the load-bearing
one.**

1. **It closes exactly.** 0.323 + 0.055 + 0.041 + 0.029 = 0.448, which is
   1.000 − 0.552 to the last digit, and the shares sum to 100 %. No residual
   is parked on a favoured term.
2. **It is multiplicative and order-dependent.** Each factor divides what the
   one above it left, so the term applied first collects the largest absolute
   cost for a given ratio. Duplication is applied first and takes 72 %; the
   same three ratios in a different order would apportion differently. The
   ordering is the causal one (a shard first decides *what* to build, then
   how fast it goes), not a neutral choice.
3. **Terms 2 and 3 are one measured quantity split by a cut, not two
   measurements.** Both hinge on where `firstBatchMs` cuts the geometry
   phase: the slowdown term is per-geometry cost *outside* the first batch,
   and term 3 is what is left over inside it. Term 3's 0.041 is a pure
   residual — `dupWall ÷ (dupWork × slowdown)` — and is **not** derived from
   the `dupFirstBatch` figure the second draft displayed beside it. Together
   they are **0.096 of 0.448, 21 % of the loss, and only their sum is
   measured.**

**What is actually inside that window — and a correction to the third draft's
answer.** `--prep-probe` pumps a batch of 0 — the pump floors it at one
product — at four levels, so the window's contents are measured instead of
named. **The third draft's split of it was wrong, and the numbers below
replace it.** That draft subtracted one configuration's summed window from
another's: `keyPass = shards.summed − replicatedAtN.summed`. Both sides
contain geometry, and it does not cancel, because the two sides do not pump
the same products. `pumpGeometryBatch_` floors a batch of 0 at one product
and then reads `demandProducts_[0]` (`ifc_api_proxy_ifc.ts:3007`), and
`demandProducts_` is the **filtered** worklist on a sharded worker. So N
unsharded workers all extract the *same* first product of the whole worklist,
while N shards each extract the first product *of their own filter* — N
different ones. The published figure was therefore

```
key pass  +  ( Σ_shards g(that shard's first product)
              − N × g(the whole worklist's first product) )
```

reported as if the bracket were zero. It is not: per-product extraction cost
is skewed, and this same probe measures the first-batch window as 82–83 %
geometry on Snowdon and MB-Khaya — the two models the third draft gave a
52–60 % key-pass share.

The probe now removes the geometry **inside each worker**: every worker times
one call that builds its worklists and pumps its batch, then up to five more
calls of the same batch that pump only geometry, and reports the first minus
the median of those. The subtraction is against that worker's *own* products,
so the mismatch cancels by construction rather than by hope. What it cannot
cancel — the first product is still one draw, and no two products cost the
same — is carried as an explicit error bar from the spread of those calls,
and **a term smaller than its own error bar, or whose envelope over the
repetitions crosses zero, is printed and reported here as NOT RESOLVED rather
than as a number.** Two consequences the tables below carry: `prep` is now
"what the first call does that later calls do not", which includes one-time
extraction-path warmup as well as the worklist build (nothing outside `src/`
can separate them, and it inflates the *replicated* term, not the key pass);
and on two of the four models the split no longer resolves at all.

Re-measured: **two sessions, nine repetitions per level on the small models
and five on D3D**, with `spin_calibrate` run before and after (spin 0.965 →
0.987, stream 0.973 → 0.962 at N=4 — an idle, stable box). The two sessions
agree to within 0.015 s on every resolved term. Medians of the second
session, envelope over its repetitions in brackets:

| model | level | N=1 | N=2 summed | N=4 summed |
|---|---|---:|---:|---:|
| **D3D** | unsharded (`collectDemandCandidates_` only) | **0.426 s** | 0.926 s | 2.305 s |
| | sharded — adds the dispatch-key pass | — | 1.153 s | 2.990 s |
| Snowdon | unsharded | 0.030 s | 0.072 s | 0.304 s |
| | sharded | — | 0.176 s | 0.555 s |
| MB-Khaya | unsharded | 0.027 s | 0.051 s | 0.170 s |
| | sharded | — | 0.114 s | 0.245 s |
| Schependomlaan | unsharded | 0.021 s | 0.043 s | 0.128 s |
| | sharded | — | 0.133 s | 0.414 s |

Which decomposes as — at N=4, and **only where it resolves**:

| model, N=4 | replicated prep | contention on it | **shard-only key pass** | key-pass envelope | error bar | geometry in the N=1 batch-64 window |
|---|---:|---:|---:|---:|---:|---:|
| **D3D** | 1.704 s (57 %) | 0.601 s (20 %) | **0.685 s (23 %)** | 0.397–0.944 s | ±0.010 s | 0.289 s of 0.715 s (**40 %**) |
| Schependomlaan | 0.084 s (20 %) | 0.043 s (10 %) | **0.286 s (69 %)** | 0.171–0.411 s | ±0.012 s | 0.034 s of 0.056 s (**61 %**) |
| Snowdon IFC4 | 0.118 s (21 %) | *not resolved* | ***not resolved*** | 0.119–0.472 s | ±0.628 s | 0.147 s of 0.177 s (**83 %**) |
| MB-Khaya | 0.107 s (44 %) | *not resolved* | ***not resolved*** | −0.072–0.208 s | ±0.307 s | 0.138 s of 0.168 s (**82 %**) |

At N=2 the same two models resolve and the same two do not: D3D's key pass is
**0.227 s, 20 % of sharded prep** (0.141–0.296, ±0.001) and Schependomlaan's
is **0.091 s, 68 %** (0.054–0.111, ±0.006). Snowdon does not resolve at either
N. MB-Khaya at N=2 resolves in one session (0.063 s, 55 %) and not in the
other (0.037 s), which is itself the answer: two nine-repetition sessions that
disagree by 70 % of the smaller estimate are not measuring the term, and it
is carried as unresolved.

**Why the small models do not resolve, stated plainly.** The instrument's
floor is the cost of *one product of geometry*, times the number of workers,
because that is what the per-worker subtraction is standing in for. On D3D
that floor is microseconds against a 0.685 s term — the four workers' geometry
calls span ±0.010 s in total — so the split is clean. On Snowdon a single
product's extraction ranges over ±0.111 s at N=1 and the four-worker sum
spans ±0.628 s, against a 0.251 s point estimate. **The signal is smaller
than one product.** No number of repetitions fixes that: the same shard
always extracts the same first product, so the bias is systematic per
configuration rather than something averaging removes. Resolving it needs an
instrument inside `src/` that can time `ensureDemandWorklists_` without
pumping, and this PR deliberately changes no `src/` file.

**That instrument now exists (conway#682), and the four rows above have not
been re-measured with it.** `ensureDemandWorklists_` times itself and reports
through `IfcAPI.GetDemandPrepYield` — `candidatesMs` for the whole-model walk
every worker replicates, `keysMs` for the dispatch-key pass only a sharded
worker runs, and the candidate-versus-kept counts that make the replication
an exact integer rather than an inference. It closes where the build ends, so
there is no geometry inside it, no per-worker subtraction, and no error bar
for the product that subtraction stood in for: the two `NOT RESOLVED` rows
are resolvable by construction rather than by more repetitions.
`scripts/m3_worker_pool.mjs --prep-probe` prints it beside the differenced
estimate at every level. **Until a session actually re-runs the four models,
the numbers in the tables above stand as the differenced ones they are** —
the ledger does not inherit resolution from an instrument it has not been
read with.

(A fifth level applies a shard of *one* and must land on the first:
`setGeometryShard` normalises `count === 1` back to unsharded
(`ifc_api_proxy_ifc.ts:2680`). It does — 1.00× on D3D, 0.93× on
Schependomlaan, 0.93× on MB-Khaya, 1.02× on Snowdon — which is what proves
the key-pass column is the sharded **branch** rather than the cost of making
the call.)

**The geometry column is differenced, and that is not a relapse.** It comes
from the batch-64 window minus the batch-0 window, both one unsharded worker
on one worklist, where the batch-0 call is a **prefix** of the batch-64 one —
so the difference is exactly products 1–63 of a worklist both sides share.
That is the condition the sharded levels fail, and it is why they are
corrected per worker instead. It also cannot be done with the tail: a
worklist is not homogeneous along its length, and on D3D the first 64
products cost 0.289 s where the next 64 cost 0.008 s.

**So the second draft's third term was mostly not what it was called — and
the third draft's replacement was right about D3D and Schependomlaan and
unsupported about the other two.** Where it resolves, the dispatch-key pass
is real and it is not small: **69 % of sharded prep on Schependomlaan** and
**23 % on D3D**, work the N=1 reference in the denominator never performs and
which exists only because sharding exists. On Snowdon and MB-Khaya the
published 60 % and 52 % are **withdrawn**; the point estimates fell to 45 %
and 31 % and neither clears its own spread. And the ratio the second draft
reported — `dupFirstBatch`, 7.6× on D3D and **10.2–15.7× on the small
models** — is still not a replication factor at all: four workers cannot
replicate anything 15.7 times. The rest of that ratio is the geometry batch,
charged asymmetrically (N shards each pumping 64 products against one worker
pumping 64), and it is **40 % of the reference window on D3D** but **82–83 %
on Snowdon and MB-Khaya and 61 % on Schependomlaan** — the models whose
worklists are two orders of magnitude smaller, and the ones the second draft
made prep the headline lever for.

The first draft assigned 97 % of this to duplication and 3 % to imbalance. It
was right that duplication dominates and right that a work-stealing queue
will not fix it — **but the number was 2.03× wall, and the work is 1.48×.**

The same decomposition on the other models is where the first draft goes from
overstated to wrong:

| model, N=4 | `dupWall` | `dupWork` | per-geometry slowdown | first-batch window summed / T₁ | of which replicated prep | imbalance |
|---|---:|---:|---:|---:|---:|---:|
| **D3D** | 1.72× | **1.48×** | 1.09× | 5.8 s / 39.9 s | 1.70 s (**4.3 % of T₁**) | 0.029 |
| Snowdon IFC4 | 1.84× | **1.05×** | 1.32× | 2.2 s / 4.4 s | 0.12 s (**2.7 %**) | 0.127 |
| MB-Khaya | 1.94× | **1.00×** | 1.33× | 1.8 s / 2.6 s | 0.11 s (**4.1 %**) | 0.020 |
| Schependomlaan | 3.17× | **1.00×** | 2.29× | 1.1 s / 1.4 s | 0.08 s (**6.0 %**) | 0.034 |

(The replicated-prep column is the corrected per-worker estimate above, and
it moves by at most 0.2 s: unlike the key pass, this term was never the one
the third draft's subtraction damaged — its two sides are both unsharded and
both pump the same first product, so the geometry did cancel there.)

**On three of the four models, no *emitted* geometry is rebuilt.** Their
shards build exactly the geometry IDs one worker builds — 5,600 on MB-Khaya,
4,761 on Schependomlaan, to the unit — so their `dupWall` is (a) the
first-batch window, decomposed above, and (b) each shard running slower per
unit of work. §11.6 says what "no emitted geometry" does and does not
exclude; a partition that sees sub-representation sharing is *not* ruled out
by these counters, and on Schependomlaan's 2.29× per-unit slowdown it remains
an untested candidate.

Two consequences for planning, restated:

1. **On D3D, removing duplication is still the biggest single lever** — 0.323
   of an available 0.448 — and it is still not a scheduling problem: better
   balance is worth 0.029. That part of the first draft survives, at 72 %
   rather than 97 %.
2. **Hoisting the worklists and dispatch keys is still the right lever, and
   still not for the reason the second draft gave — but the evidence for it
   on the small models is now one model, not three.** That draft said prep
   is "whole-model work done N times; it grows with N by construction", that
   "a shard does not shrink any of it", and that an unsharded pool would pay
   it too. Where the split resolves, the opposite holds: the largest
   prep-side term is the **shard-only dispatch-key pass**, which exists only
   because sharding exists and which an unsharded pool would not pay at all
   — **69 % of sharded prep and 20 % of `T₁` on Schependomlaan** (against
   replicated prep's 6.0 %), and **23 % of sharded prep on D3D**. Both are
   resolved in two independent sessions and at both N. **The third draft's
   "52–68 % on all three small models" is withdrawn:** on Snowdon and
   MB-Khaya the term does not clear its own error bar in either session, and
   its point estimates dropped to 45 % and 31 %. Replicated prep is a
   **2.7–6.0 % of `T₁`** term everywhere, D3D included — that part is
   unchanged, and it is the term the correction did not touch.
   **The lever's direction is unchanged** — "computing worklists *and
   dispatch keys* once and handing them to the workers" names both halves,
   and where it can be measured the key pass is the half that dominates —
   but the case for it now rests on Schependomlaan and D3D, and on the two
   models where prep is 82–83 % geometry the honest statement is that this
   instrument cannot see the term at all.

**A rule from the first draft that does not survive.** It said "duplication
caps efficiency at `1/dup` before balance is considered at all". That assumes
per-unit cost is constant, and it is not: **D3D at N=2 measures `dupWork`
1.23× and efficiency 0.885, which is above the 0.814 that rule would cap it
at**, because each shard's smaller working set makes it **10 % faster per
geometry** than the single worker. Duplication is a term, not a ceiling.

`parallel-load-pipeline.md` §5 predicted the *shape* on D3D and named the
limit: `geometryDispatchKey` removes duplication at the *representation*
level, and the sharing that remains lives below it — profiles, boolean
operands, void geometry — where an attribute walk cannot see. Its published
figure is **D3D duplicated assets 83,177 round-robin → 81,639 with this key**,
and `ifc_api_proxy_ifc.ts` prices the key's residue at **+38.1 % on D3D at
N=4**. `dupWork` measures **+48 %** on the same model, key and worker count.

**Same direction, populations not reconciled** — and the second draft said
more than that. It called them "the same finding from two directions,
differing by the ~10 % the harness counts as separate geometries where the
asset counter counts assets, plus the 264 divergent encodings of §11.5".
Neither half of that holds up. The asset counter's percentages are against an
N=1 base of about **59,116 assets** (83,177 is +40.7 % of it), stated nowhere;
this harness's N=1 base is **46,166 geometry IDs**. The two populations are
**28 % apart, four times the 7-point ratio gap being explained**, and the
"~10 %" was asserted rather than derived. The 264 divergent encodings are
264/68,192 = **0.39 %** and cannot move a 7-point gap at all. They are also
different instruments (`m3_affinity_spike.mjs` against this harness).

The gap does look systematic rather than random, which is a lead rather than
a reconciliation: on MB-Khaya the same table's base is **7,193 assets**
against this harness's **5,600** emitted geometry IDs — a ratio of 1.284,
against D3D's 59,116/46,166 = **1.280**. Two models agreeing to four decimal
places says the two counters differ by a definition, not by noise. Nobody has
found the definition.

So the honest statement is the weaker one: **two instruments counting
different populations both find D3D rebuilding a large minority of its
geometry under this key at N=4, +38 % and +48 %, and the difference between
them is not accounted for.** That is enough to retain D3D's duplication
claim — which is what this evidence is load-bearing for, since §11 retracts
duplication on every other model — and not enough to call them the same
measurement. **The 2.03× of the first draft had no counterpart of any kind in
the repo, and that mismatch was the signal it was the wrong quantity.**

What §5 did *not* predict is the 60.7 % keyless share on D3D. Conway names it
in a warning printed by every shard:

```
[shard 0/4] 29031 of 47791 products have no placement key, so sharding is
mostly positional and shared geometry will be rebuilt per shard.
```

**60.7 % of D3D's product worklist** — of the 47,791, not of the 229,320 —
**has no mapping-source key at all.** For those products `geometryDispatchKey`
falls back to the product's own `localID`, which is parse-order, so more than
half of the production model is sharded *positionally*. That is consistent
with a 1.48× rebuild and it remains the thing to chase: **a partition that
cannot see 60 % of the worklist is not going to be fixed by refining the 40 %
it can.**

### 11.5 Sharding changes D3D's geometry — 247 of 46,166, and nothing is lost

At N=2 and N=4 on D3D the union check **fails**, deterministically and
identically across repetitions. The first draft reported this at the level of
the harness's payload *strings*, which double-counts: an entry is
`id:vertexFloats:indexCount:digest`, so one geometry two shards built
differently is two members of that set. Counted by geometry **ID**, and in
**both** directions:

| configuration | placements | missing | extra | **duplicated** | geometry IDs | IDs the reference never built | IDs no shard reproduced | **IDs built differently** | payload encodings | encodings not in the reference | reference encodings not reproduced |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| N=1 (reference) | 562,367 | — | — | — | 46,166 | — | — | — | 46,166 | — | — |
| N=2 | 562,367 | 0 | 0 | **0** | **46,166** | **0** | **0** | **181** | 46,317 | 188 | **37** |
| N=4 | 562,367 | 0 | 0 | **0** | **46,166** | **0** | **0** | **247** | 46,430 | 285 | **21** |

Three corrections to the first draft's reading of this, all in the direction
of a *smaller and better-localised* defect:

- **Retracted: "the model ends with 264 more unique geometries and 1.6 % more
  vertices."** It ends with **the same 46,166 geometries**. Nothing is lost,
  nothing is invented — every geometry ID the single worker builds is built
  by some shard, and no shard builds an ID the single worker did not.
  Vertices come out at 3,201,959 against 3,204,498, **0.08 % fewer**, and even
  that is an artifact of which encoding the harness picks for a divergent ID,
  so the honest statement is "unchanged to within a tenth of a percent". The
  "+264 geometries / +1.6 % vertices" was the string set being read as the
  model.
- **New, and it was invisible before.** The old counter was one-directional —
  it counted only entries the reference lacked — so a pool that *lost*
  geometry would have reported zero. Counted both ways, **37 reference
  encodings at N=2 and 21 at N=4 are never reproduced by any shard.** Since no
  *ID* is missing, these are the reference's version of a geometry that came
  out differently, not a hole; but the counter that would have shown a hole
  now exists.
- **New.** Placements are exact at every N and, now that duplicates are
  counted rather than inferred from set differences, **provably not
  duplicated**: `missing 0, extra 0, duplicated 0`. The old missing/extra pair
  were set differences and would both have read 0 for a partition where every
  shard did everything.

**Scope, before the four points: these runs compare sizes, not bytes.** Every
number in §11.2–§11.7 is from `NO_PAYLOAD_DIGEST=1` runs (§11.3, §11.8), where
`digested` is `''` and a payload entry is `id:vertexFloats:indexCount:` — so
the comparison is **size-for-size**, exactly as `scripts/README.md` says. The
second draft said here that Snowdon's rebuilds "come out byte-identical",
which these runs cannot show; corrected above. Two consequences, and they run
opposite ways:

- **"247 built differently" is a lower bound.** Any geometry with identical
  vertex and index counts but different coordinates is invisible in every
  number in §11.2–§11.7. The 247 are the ones whose *topology* changed;
  the undetected population is unmeasured, not measured at zero.
- **"Everything else about the output is exact" is exact about sizes.**
  Placements are compared losslessly (entity, geometry ID, colour and the
  full-precision transform — `transformKey` is base64 of the raw
  `Float64Array`), so that half is byte-exact. The geometry payloads are not.

§11.5's inference from the counts — *the vertex and index counts differ, so
this is different topology rather than the same topology with different
values* — is sound for the 247 it detects and **silent about the population
it cannot see**. The digest-on mode is what closes that, and it was not run
here because its per-shard SHA-256 rides on the duplication term §11.4
measures (§11.8).

So the defect is: **at least 247 of 46,166 geometries (0.54 %) come out with
different topology under a four-way shard, and everything else the instrument
can see about the output is exact.** Four things pin it down as real rather
than instrument noise:

- **It does not happen on the other models.** MB-Khaya, Schependomlaan and
  Snowdon report `OK` with identical vertex, triangle and by-ID geometry
  counts at every N, in exactly the runs that report `FAIL` on D3D. Snowdon
  is the instructive one: its `dupWork` is 1.05, so its shards **do** rebuild
  shared geometry — and every rebuild comes out **the same size**, so the
  union still matches. Duplication and divergence are independent axes, and
  only the corrected instrument reports both.
- **N=1 is deterministic** — 3,204,498 / 2,452,715 / 46,166 across every
  invocation in two sessions.
- **The divergence is deterministic too**, and reproduces exactly: 181 at N=2
  and 247 at N=4 in all three repetitions.
- **It scales with N** — the signature of a shard-visibility effect, not of
  floating-point jitter. The counts differ, so this is different *topology*,
  not the same topology with different values.

The likely area is unchanged: the interaction between shard membership and
the void/boolean handling that `ifc_api_proxy_ifc.ts` documents around
`aggregateTargetLocalIDs` and master rel-voids — a shard that cannot see the
voiding element produces the uncut solid. That is a hypothesis from the shape
of the evidence, **not something measured here**, and it should be run down
before any of this ships.

Two consequences worth stating plainly:

1. **The efficiency numbers in §11.3 are measured on a partition that does not
   reproduce the single-worker output on D3D.** A corrected partition has to
   make shards see more, not less, so if anything it does *more* work per
   shard. **0.552 is therefore an optimistic bound, not a midpoint.** (The
   defect is 0.54 % of geometries, so the correction it implies is small —
   which the first draft could not say, because it thought the model had
   gained 264 geometries and 1.6 % of its vertices.)
2. **This had never been detectable.** The union check's failure path carried
   a latent bug since #536: `process` in that script is an ESM *namespace*
   (`import * as process`), whose properties are read-only, so
   `process.exitCode = 1` threw a `TypeError` and killed the run before it
   printed a single timing. Fixed in the previous commit on this branch. **The
   same trap was still live in `spin_calibrate.mjs`** and was found by running
   it: `node:process` exports `argv`, `env`, `exit`, `exitCode` and `hrtime`
   by name but **not `on` or `send`**, so the new IPC barrier `TypeError`d in
   the child on first use. Both now go through `globalThis.process`.

### 11.6 What this does not say

**N=8 is unmeasured and unmeasurable here.** This box has 4 cores. Any N=8
number from it would be oversubscription behaviour, not scaling, so none was
run and §2's N=8 row is marked unmeasurable rather than left looking pending.

**The path measured is the resident-source one.** Each worker does
`readFileSync` into a full in-memory copy and opens with `DEFER_GEOMETRY` —
no windowed provider, no store-backed open. Its bias is *favourable* to
parallelism: every worker holds a private copy and contends with no one for
I/O, where a shared windowed provider would add a contended resource this
configuration does not have. Combined with §11.5's optimism, **0.552 should be
read as "at best" rather than "about".**

**The per-geometry slowdown term is a residual, not a mechanism.** §11.4
computes it as what is left of summed shard time after duplication and the
first-batch window are removed, so it collects memory-bandwidth contention,
cache pressure, scheduler effects and anything else that makes a shard slower
per unit of work. The `stream` calibration and the `open` control (§11.2)
both bound it from outside; neither identifies it. On D3D at 1.09× they agree
with its size. **On Schependomlaan at 2.29× they do not** — this box's
`stream` ceiling at N=4 is 0.966 and its four processes deliver 3.8× of a
possible 4× of memory bandwidth (§11.2), so a 2.29× per-unit slowdown is far
outside what contention on this box explains. §10 carries that as an open
item.

**`dupWork` counts *emitted* geometry, and the duplication this repo predicts
lives below that.** `payloads` is keyed on `placed.geometryExpressID` from
the FlatMeshes a shard emits. Profiles, boolean operands, void and master
geometry and mapped-item sources are intermediate `CanonicalMesh`es that
never surface as a placed ID, so a shard that rebuilds one of those is
invisible to this counter. `src/ifc/geometry_dispatch.ts:40-44` says exactly
this about the key it implements: *"the sharing lives BELOW the
representation — a profile swept along different directrices, boolean
operands, void geometry — where an attribute walk cannot see it."* **So
`dupWork` is a lower bound, blind to precisely the class of duplication this
repo's own dispatch code names**, and "`dupWork` 1.00, so this model rebuilds
nothing" should be read as **rebuilds no emitted geometry**. §11.4's
retraction is warranted at the level the counter measures and over-reaches
one level up; §10 carries the untested alternative.

**Two things about `dupWork` do hold, and they are worth keeping straight
from the caveat above.** It is immune to round 1's failure: per-shard totals
accumulate over unique geometries only (the `payloads` map guards re-entry),
the reference comes from the identical `reduce` over the forced N=1 run, no
harness bookkeeping is counted on either side, and non-integer geometry IDs
are excluded and then thrown on rather than silently bucketed. And
`dupWork = 1.00` **together with** a matching union is a rigorous proof that
the shards' emitted-geometry sets are pairwise disjoint: Σ|setᵢ| = |∪ setᵢ|
holds if and only if they are. That is a strong statement about the
partition; it is simply a statement about *emitted* geometry.

**A correction to the earlier draft of this section, recorded so the next
person does not repeat it.** An earlier draft claimed D3D was "not in
`test-models/`, not anywhere on the filesystem" and extrapolated 0.47 to D3D
from four other models. **That was wrong, and the search was the thing at
fault.** There are **two** model clones on this box:

| path | size | contains |
|---|---:|---|
| `/home/user/test-models` | 9.9 GB | the public corpus — MB-Khaya, Schependomlaan, Snowdon, SKYLARK250 |
| `/home/user/test-models-private` | 3.9 GB | the private, LFS-backed corpus — **`ifc/ryuga/D3D.ifc`**, and the `sp-*` set |

A `find` rooted at the public clone reports D3D missing and looks conclusive.
**Check both roots.**

### 11.7 Memory is not the wall, and Node is not the slow path

**Memory.** §4 asked for this before anything got built, and the trap — that N
instances multiply D3D's peak and OOM — **does not materialise.** These
numbers reproduce the first draft's to within a percent on a corrected
instrument (the wasm figure now goes through `wasmHeapByteLength`, which
cannot lag a growth step behind the real heap — #485):

| model | RSS N=1 | RSS N=2 | RSS N=4 | ×N=4 | wasm N=1 | wasm N=2 | wasm N=4 | ×N=4 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **D3D** | **3 045 MB** | **4 020 MB** | **6 208 MB** | **2.04×** | **611 MB** | **716 MB** | **828 MB** | **1.36×** |
| MB-Khaya | 589 MB | 845 MB | 1 336 MB | 2.27× | 102 MB | 130 MB | 198 MB | 1.94× |
| Schependomlaan | 481 MB | 819 MB | 1 537 MB | 3.20× | 74 MB | 100 MB | 165 MB | 2.23× |
| Snowdon IFC4 | 639 MB | 1 004 MB | 1 636 MB | 2.56× | 209 MB | 245 MB | 298 MB | 1.43× |

**The RSS column is a cumulative sweep high-water mark, not a per-N peak.**
`VmHWM` never falls; the whole sweep runs N=1 → 2 → 4 in one process; and the
main thread holds the reference union (562,367 placement strings on D3D) and
the reference payloads throughout. So the N=4 row is the peak of a process
that has already run two pools and is still carrying the first one's output.
The direction is pessimistic — a per-N figure is at or below what is printed —
so nothing in this subsection's conclusion depends on the difference, but a
true per-N number needs one worker count per process invocation and was not
taken. **The V8 column is not a peak either**: `used_heap_size` is one
instantaneous reading after the pump.

**Per-worker wasm memory falls with N, and on D3D it falls almost
perfectly: 611 MB at N=1 → 358 MB each at N=2 → 207 MB each at N=4.** Each
shard's working set is a fraction of the model's, so the linear memory each
instance grows to is a fraction too. D3D's *total* wasm across four workers is
828 MB against 611 MB for one — a 1.36× multiplier, not 4×. (This is also the
direct mechanism behind §11.4's finding that D3D's shards run **faster per
geometry at N=2** than the single worker does.)

This inverts §6's stated worry. §6 reasoned about N workers sharing **one**
4 GiB memory on the MT build and concluded per-shard transient multiplies
inside a fixed ceiling. With separate instances — the shape production can
actually have — each worker gets its own 4 GiB budget *and* needs a third of
it. **Per-worker headroom improves with N.**

D3D at N=4 drove the sweep to **6.2 GB** of process RSS on a 16 GB box with no
swap, and did not come close to failing. What grows near-linearly is the V8
side (D3D 1,693 MB → ~1,881 MB → ~2,173 MB) plus a per-worker Node floor.

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
| §11 | Node | `readFileSync`, materialised, not windowed | **36.0 s** |

**§10's leading candidate does not survive this.** If the materialised,
non-windowed source were what costs 4,256 s, the Node run of that same shape
would be slow too; it is 118× faster, and 2.9× faster than the windowed
browser load. So the 4,256 s is not a property of "materialised rather than
windowed" — it is something browser-side and specific to that configuration,
and §8 names a plausible one in passing: its main thread was starved so hard
that an in-page sampler got 21 readings in 19 s and then nothing for 72
minutes.

The practical consequence for this section is the one the brief warned about,
and it resolves the other way: **Node is not a 40×-slow path for D3D
geometry, so measuring efficiency here is not measuring the wrong thing.**
The caveat that remains is the honest one — the browser figures come from
other sessions and possibly another box, so this is a comparison across
records rather than a controlled A/B, and it locates the cost rather than
identifying it. §11.3's own 38 % cross-session shift in `T₁` is a reminder of
how loose a cross-record comparison is.

### 11.8 Reproducing this

```sh
# box calibration, before and after — N processes; both kernels, because the
# register-bound one cannot see a memory-bandwidth ceiling. The stream working
# set is now derived from this box's last-level cache; the run prints the
# ratio and refuses if it cannot clear 4x.
node scripts/spin_calibrate.mjs --workers 1,2,4 --runs 3

# the plateau check behind §11.2's table — sweep the working set and read the
# GB/s column; past the cache it stops changing
for mib in 64 256 1024 2048; do
  node scripts/spin_calibrate.mjs --workers 1 --runs 1 --kernel stream \
    --stream-mib $mib
done

# efficiency, per model; NO_PAYLOAD_DIGEST=1 removes the harness's own
# per-shard SHA-256, which rides on the duplication term it is measuring —
# and makes the union check size-for-size rather than byte-for-byte (§11.5)
NO_PAYLOAD_DIGEST=1 node --max-old-space-size=12288 \
  scripts/m3_worker_pool.mjs /home/user/test-models-private/ifc/ryuga/D3D.ifc \
  --workers 2,4

# what the first-batch window is made of: replicated prep, contention on it,
# and the dispatch-key pass only a sharded worker runs (§11.4). Each worker
# subtracts the geometry using its OWN products (five geometry-only follow-up
# calls), because the shards and the unsharded control do not pump the same
# products; a term smaller than the resulting error bar prints as NOT
# RESOLVED. Nearly free — it opens and preps, it does not pump the model.
node --max-old-space-size=12288 scripts/m3_worker_pool.mjs \
  /home/user/test-models-private/ifc/ryuga/D3D.ifc --workers 2,4 \
  --prep-probe --runs 5
```

There is no `--expose-gc`. The first draft prescribed it in both this block
and the script's own usage line, and nothing in the script calls `gc()`;
it has been dropped from both rather than left looking load-bearing.

`spin_calibrate.mjs` is committed rather than re-derived per investigation:
M2 established the practice of calibrating the box and left no artifact, and
the practice is worth nothing if the next measurement reinvents the kernel and
gets a subtly different one. Run it **immediately before and after** the thing
being measured, not once a session — an earlier M2 run on a contended box
reported D3D as a net loss at every N, and re-measurement on an idle box
turned it into a 1.15× win. It now kills its children on a failed sweep, which
it did not before; a sweep that threw used to leave four reparented processes
spinning at full tilt through whatever ran next.

`m3_worker_pool.mjs` was corrected across three rounds. Round 1:
`dupWork`/`dupVerts` beside `dupWall`, by-ID geometry counting,
two-directional and duplicate-aware union reporting, `wasmHeapByteLength`, an
honestly-labelled sweep RSS, and an assertion in place of the silently-skipped
proof line. Round 2: `dupPrep` renamed to `dupFirstBatch` because it is a
window rather than a mechanism, and `--prep-probe` added to decompose that
window by measurement. Round 3: `--prep-probe`'s decomposition rebuilt,
because subtracting one configuration's window from another's does not
cancel the geometry when the two configurations pump different products
(§11.4) — it now subtracts per worker, carries an error bar, refuses to
print a term smaller than that bar, and defaults to five repetitions rather
than three. `spin_calibrate.mjs` in round 2 derives its stream
working set from sysfs instead of asserting a margin it did not have, and
refuses a cache-resident run. The commit messages have the full list and the
reasoning for each.

**Numbers from before round 2 are not all reproducible on today's scripts.**
The `stream` rows in the second draft's §11.2 used the 256 MiB kernel;
`--stream-mib 256` reproduces them. Everything else — efficiencies,
`dupWork`, the union counts — is unchanged by round 2's edits, and D3D's
were re-run here to confirm it: `dupWork` 1.48×, 68,192 built against 46,166,
247 built differently, 285 encodings not in the reference and 21 of the
reference's not reproduced, all identical to the digit.

The digest-on set from the first draft is retained as the conservative
reading, though it predates the corrections and its `dup` column should be
read as `dupWall`: MB-Khaya 0.727 / 0.422, Schependomlaan 0.723 / 0.322,
Snowdon 0.764 / 0.450 at N=2 / N=4. **The digest costs at most 0.05 of
efficiency**, most of it on the models with the highest wall inflation — a
shared geometry that two shards both build is also one that two shards both
hash. Every number in §11.2–§11.7 is from the digest-off runs.
