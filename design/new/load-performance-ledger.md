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
| geometry N=2 | **0.74 measured** (§11) | 70.7 s | 82.5 s | **1.41×** |
| geometry N=4 | **0.47 measured** (§11) | 55.7 s | 67.4 s | **1.73×** |
| geometry N=4 + parse N=4 | 0.47 / 0.857 | 55.7 s | 60.6 s | **1.92×** |
| geometry N=8 | **unmeasurable here** — 4-core box; §11 | — | — | — |

The assumed numbers were borrowed from the *parse* measurements, on the
reasoning that parse sharding degraded from 0.94 at N=2 to 0.857 at N=4 while a
register-bound spin loop held 0.97 — a memory-bandwidth signature — and that
geometry, being compute-heavy with a small working set, was plausibly a
*better* scaler.

**It is a worse one, at every N measured, and the mechanism is not the one
either guess named.** It is neither memory bandwidth nor a shared wasm heap:
the box calibration ran 0.997/0.987 alongside these runs and each worker has
its own linear memory, which *shrinks* with N. It is **duplicated work** —
geometry shared below the representation level gets rebuilt in every shard that
touches it, costing 1.7–2.9× the total CPU at N=4. §11 has the numbers, the
decomposition, and the three qualifiers that stop 0.47 from being read as a
D3D number.

The rows above still assume D3D's geometry shards as well as the models §11
could actually measure. §11's SKYLARK250 result — 1/N efficiency, no partition
at all — is the reminder that it might not.


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
  §11: worse, at every N measured** — 0.74 at N=2 and 0.47 at N=4 against
  parse's 0.94 and 0.857, on three models on a box calibrated at 0.997/0.987.
  What is still open is the *D3D* number specifically (the file is not on this
  box) and whether the duplication that causes it is reducible. §6's worry
  about N workers sharing one 4 GiB linear memory turns out not to apply to
  the shape that ships: with separate module instances per worker — which is
  what a no-COEP production has anyway — per-worker wasm memory *falls* with
  N, and total wasm grew only 1.4–2.2× at N=4.
- **Why did geometry take 4,256 s here against 104.7 s in §0?** A 40×
  gap is not explained by "slower box". The two candidate differences are
  named in §8 (HTTP fetch + materialised source rather than an OPFS
  store-backed open, so no windowed provider and no `window=` in the report)
  and neither has been tested. If the resident-source path is genuinely
  *slower* than the windowed one, that inverts an assumption in
  `memory-residency.md`.
- **What does the tail of the 4 GiB budget actually do?** Nobody has driven
  a browser load into the wasm ceiling on purpose. `-s ABORTING_MALLOC=0`
  means a failed allocation returns null rather than aborting, so the first
  symptom is likely a nonsense pointer surfacing as one of #485's
  `Invalid typed array length` errors rather than an out-of-memory message.
  Worth knowing before a user finds it.


## 11. Geometry parallel efficiency, measured — and §2's 0.80 does not hold

**Answer first: geometry parallelises *worse* than parse, not better.**
Measured **0.74 at N=2 and 0.47 at N=4**, against parse's 0.94 and 0.857, on a
box whose own ceiling was 0.997 and 0.987 in the same session. §2's assumed
0.80 at N=4 is optimistic by a factor of 1.7, and the projected whole-load win
from geometry parallelism drops from **2.62× to 1.73×**.

That is the more valuable half of the result, so it is stated before the
qualifiers rather than after them: **a geometry worker pool is worth about
seventy percent more speed at four cores, not two and a half times.** Whether
that still justifies the machinery — a pool, a merged scene, asset-keyed delta
capture, and on the browser side COEP and the Google Picker — is a decision
this number should be fed into before more of it is built.

The mechanism is not the one either guess in §2 named. It is not memory
bandwidth and it is not a shared wasm heap. It is **duplicated work**.

### 11.1 What was measured, and on what

`scripts/m3_worker_pool.mjs` (instrumented here to report per-shard geometry
times, per-worker wasm and V8 heaps, duplication factor and process peak RSS).
N `worker_threads`, each with **its own `IfcAPI`, its own wasm instance and its
own linear memory** — deliberately the no-SharedArrayBuffer shape, because
Share's `netlify.toml` omits COEP on purpose (§6) and the MT/SAB build is not
what production could ship. Each worker opens the model, claims a shard with
`SetGeometryShard`, and pumps to completion; the script's union check confirms
every configuration reported here delivered byte-identical placements and
payloads to the single-worker load.

Sharding is `geometryDispatchKey` / `shardOfDispatchKey` exactly as
`parallel-load-pipeline.md` §5 describes it — the mapping-source key, not an
invented partition.

Efficiency is `T₁ / (N × Tₙ)` over the **geometry phase only** (`open` excluded,
so parse and file read are not diluting it), with `Tₙ` the slowest shard —
makespan, which is what wall clock becomes. Three runs per configuration;
median reported, full spread alongside.

Models: whatever is on this box. **D3D is not**, which is the first thing §11
cannot answer — see §11.5.

### 11.2 Box calibration

A register-bound integer spin loop, N separate **processes**, no allocation and
no memory traffic, run immediately before and immediately after the geometry
runs. Same instrument as M2's (which read 0.995 / 0.969 on its box).

| when | N=2 | N=4 | N=1 / N=2 / N=4 medians |
|---|---:|---:|---|
| before | **0.997** | **0.990** | 20 745 / 20 802 / 20 956 ms |
| after | **0.997** | **0.987** | 20 860 / 20 932 / 21 134 ms |

Load average 0.02–0.35 before, no swap, 14.4 GB free; the box stayed idle
between the two, and the two agree to 0.003. **So the hardware gives back
98.7 % at N=4 and geometry gives back 47 %. The missing 52 points are
algorithmic, and nothing about this box explains them.** This box is in fact
*better* than M2's at N=4 (0.987 vs 0.969), so the geometry number is not being
flattered by a favourable comparison — it is being measured against a stricter
ceiling than parse was.

### 11.3 The numbers

Primary set, payload digest off (see §11.4 for why, and for the digest-on set).

| model | file | geometry T₁ | N=2 efficiency (median, spread) | N=4 efficiency (median, spread) |
|---|---:|---:|---|---|
| MB-Khaya (IFC2X3, Archicad) | 31.4 MB | 3.5 s | **0.764** (0.741–0.775) | **0.471** (0.450–0.517) |
| Schependomlaan | 47.0 MB | 1.8 s | **0.686** (0.681–0.688) | **0.347** (0.322–0.375) |
| Snowdon Towers (IFC4, Revit) | 79.3 MB | 5.9 s | **0.743** (0.724–0.776) | **0.468** (0.451–0.475) |
| SKYLARK250 design-kit | 381.7 MB | 36.8 s | 0.522 *(1 run)* | 0.252 *(1 run)* |
| **median of the three that shard** | | | **0.74** | **0.47** |

Spreads are tight — no configuration's three runs span more than 0.07, and
Schependomlaan's N=2 spans 0.007. This is not a noisy measurement being
over-read.

**SKYLARK250 is not a fourth data point on the same curve; it is a different
failure.** It did not shard *at all*: 2,924 placements, and at both N=2 and
N=4 **every one of them landed in shard 0** — the other workers opened the
model, found nothing to do, and exited. 0.252 at N=4 is exactly 1/N, the
signature of no parallelism rather than of bad parallelism.

The cause is worth recording, because it is a property of the dispatch design
rather than of this model. Probing the key histogram directly: SKYLARK's 2,000
products carry 2,000 *distinct* dispatch keys and would split 460/506/490/544
at N=4 — the per-product partition is fine. But SKYLARK's geometry does not go
through the per-product pass. It hangs off `IfcRelAggregates`, of which the
model has **two**, and aggregate targets are excluded from the product worklist
and dispatched on the *relationship's* key
(`ifc_api_proxy_ifc.ts:2362-2364`). **Two aggregates is a hard ceiling of two
shards, and one of the two carries essentially all the geometry, so the real
ceiling is one.** For comparison the other models have 28 (MB-Khaya) and 86
(Snowdon) aggregates, enough that the aggregate pass is not the constraint.

So the partition has a floor set by aggregate count that nothing in
`geometry_dispatch.ts` can see, and an assembly-shaped model can sit on it.
Any pool design needs a within-aggregate axis or a check that refuses to spawn
workers that will have nothing to do.

### 11.4 Where the 53 points go: duplication, then imbalance

The harness reports the summed shard CPU as well as the makespan, and the two
separate cleanly.

| model, N=4 | duplication (Σ shard CPU ÷ T₁) | ceiling that implies (1/dup) | measured | gap = imbalance |
|---|---:|---:|---:|---:|
| MB-Khaya | 1.77× | 0.565 | 0.471 | 0.094 |
| Schependomlaan | 2.61× | 0.383 | 0.347 | 0.036 |
| Snowdon IFC4 | 1.68× | 0.595 | 0.468 | 0.127 |

At N=2 duplication is 1.17–1.38×; at N=4 it is 1.68–2.61×. **It grows with N,
and it is the dominant term at both.** Imbalance is real but secondary —
Schependomlaan's four shards run 1.4/1.4/1.2/1.2 s, near-perfectly balanced,
and *still* return 0.347, because balance cannot help when the same geometry is
being built four times.

This is the affinity limit `parallel-load-pipeline.md` §5 names, arriving
exactly where it said it would. `geometryDispatchKey` puts every occurrence of
one mapping source in one shard, which removes duplication at the
*representation* level; the sharing that remains lives **below** it — profiles,
boolean operands, void geometry — where an attribute walk cannot see it.
#394's own correction comment priced that residue at +15 % CPU on PSB and
+40 % on MB-Khaya at N=4. Measured here on MB-Khaya: **+77 %**. The correction
comment was the right shape and low by half.

Two consequences for planning:

1. **This is not a scheduling problem and a work-stealing queue will not fix
   it.** Better balance buys 0.036–0.127. Removing duplication buys the other
   half. The lever is a partition that sees sub-representation sharing, or a
   shared asset cache across workers — which separate module instances, the
   only shape available without COEP, structurally cannot have.
2. **The efficiency will keep falling as N rises**, because duplication rose
   monotonically from N=2 to N=4 on all three models. Whatever N=8 is, it is
   below the naive extrapolation, not above it.

### 11.5 Three things this does not say

**It is not a D3D number.** `D3D.ifc` is not on this box — not in
`test-models/`, not anywhere on the filesystem. D3D is the model §0 measured
and the model §2's projection is about, and it is a Tekla IFC4 export with
20.995 % inline entities and an affinity profile (#536: 81,639 duplicated
assets against an oracle of 65,288) unlike any of the three measured here.
**Applying 0.47 to D3D's 104.7 s is an extrapolation across models, and it is
labelled as one in §2.** SKYLARK is the standing warning that the
model-to-model spread on this axis runs all the way to 1/N.

**It is the resident-source path, not the windowed one.** Each worker does
`readFileSync` into a full in-memory copy and opens with `DEFER_GEOMETRY` —
which is precisely the "materialised source, no windowed provider"
configuration §10 names as a candidate for the unexplained 40× Node-vs-browser
gap. Two things to hold about that:

- **The 40× does not reproduce on the models measured here.** MB-Khaya's
  geometry is 3.5 s in Node against ~6.8 s in CI; Snowdon's is 5.9 s. These
  are the same order as the browser, not 40× off it. So the gap looks
  D3D-specific — an aggregate/pager pathology — rather than a general property
  of the Node path, and measuring efficiency here is not measuring a uniformly
  40×-slow thing.
- **The direction of the remaining bias is favourable, not adverse.** Every
  worker holds its own private copy of the file and contends with no one for
  I/O. A windowed, store-backed provider adds a shared resource that this
  configuration does not have. **So 0.47 is more likely an upper bound on the
  windowed path than a lower one** — the honest reading is "at best 0.47", not
  "0.47 ± something".

**N=8 is unmeasured and unmeasurable here.** This box has 4 cores. Any N=8
number from it would be oversubscription behaviour, not scaling, so none was
run and §2's N=8 row is marked unmeasurable rather than left looking pending.

### 11.6 Memory: it is not the first wall, and the reason is a surprise

§4 asked for this before anything got built, and the trap named in the brief —
that N instances multiply D3D's 2.66 GB and simply OOM — **does not
materialise, for a reason worth keeping.**

Peak process RSS (kernel `VmHWM`, so it survives worker teardown) and summed
per-worker wasm linear memory, medians:

| model | RSS N=1 | RSS N=2 | RSS N=4 | ×N=4 | wasm N=1 | wasm N=2 | wasm N=4 | ×N=4 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| MB-Khaya | 590 MB | 830 MB | 1 348 MB | 2.28× | 102 MB | 130 MB | 198 MB | 1.94× |
| Schependomlaan | 475 MB | 822 MB | 1 528 MB | 3.22× | 74 MB | 100 MB | 165 MB | 2.23× |
| Snowdon IFC4 | 635 MB | 978 MB | 1 757 MB | 2.77× | 209 MB | 245 MB | 298 MB | 1.43× |
| SKYLARK250 | 4 139 MB | 4 287 MB | 4 639 MB | 1.12×¹ | 707 MB | 723 MB | 755 MB | 1.07×¹ |

¹ Not a scaling number — SKYLARK never partitioned, so N=2 and N=4 are one
working worker plus idle ones at ~64 MB each.

**Per-worker wasm memory falls with N.** Snowdon: 209 MB at N=1 becomes
71/71/85/71 MB at N=4. Each shard's working set is a fraction of the model's,
so the linear memory each instance grows to is a fraction too. That is why the
totals land at 1.4–2.2× rather than 4×, and it inverts §6's stated worry: §6
reasoned about N workers sharing **one** 4 GiB memory on the MT build and
concluded per-shard transient multiplies inside a fixed ceiling. With separate
instances — the shape production can actually have — each worker gets its own
4 GiB budget *and* needs less of it. **Per-worker headroom improves with N.**

What does grow near-linearly is the V8 side (Snowdon 174 → 291 → 460 MB) plus a
~55–65 MB per-worker Node floor, which is what carries the total RSS to
2.3–3.2×.

**Extrapolating to D3D** (labelled as extrapolation, since D3D is absent): a
2.66 GB single-instance peak at 2.3–3.2× is 6–8.5 GB device-total at N=4, with
each worker holding roughly 1.5–2.1 GB — comfortably under both the 4 GiB wasm
ceiling and the ~4 GB JS heap cap that §6 says a load must fit under
*simultaneously*. On a 16 GB box that fits; on an 8 GB laptop it does not.

So the finding §4 asked for is: **memory is not what gates geometry
parallelism at N=4 — the partition is.** That reorders #635: the duplication
problem is the prerequisite, and the memory work that was assumed to gate the
pool turns out not to. What memory *does* gate is the device class, and that
is a product decision (which laptops open a 2 GB model) rather than an
engineering one.

### 11.7 Reproducing this

```sh
# box calibration, before and after — N processes, register-bound, no memory
node scripts/spin_calibrate.mjs --workers 1,2,4 --runs 3

# efficiency, per model; NO_PAYLOAD_DIGEST=1 removes the harness's own
# per-shard SHA-256, which rides on the duplication term it is measuring
NO_PAYLOAD_DIGEST=1 node --expose-gc scripts/m3_worker_pool.mjs <model.ifc> --workers 1,2,4
```

`spin_calibrate.mjs` is committed rather than re-derived per investigation:
M2 established the practice of calibrating the box and left no artifact, and
the practice is worth exactly nothing if the next measurement has to reinvent
it and gets a subtly different kernel. Run it **immediately before and after**
the thing being measured, not once a session — an earlier M2 run on a
contended box reported D3D as a net loss at every N, and re-measurement on an
idle box turned it into a 1.15× win.

The digest-on set, kept because it is the conservative reading and because the
gap between the two bounds the instrument, is: MB-Khaya 0.727 / 0.422,
Schependomlaan 0.723 / 0.322, Snowdon 0.764 / 0.450 at N=2 / N=4. **The digest
costs at most 0.05 of efficiency**, most of it on the models with the highest
duplication, exactly as expected — a shared geometry that two shards both build
is also a geometry that two shards both hash. Every number in §11.3 and §11.4
is from the digest-off runs; every union check passed in both sets.
