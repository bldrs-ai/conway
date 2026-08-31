# scripts/

Check this index before writing new tooling — most of what a geometry or
performance investigation needs already exists here.

| Script | Use |
|---|---|
| [`debug/model_report.mjs`](debug/README.md) | Why does *this* model look wrong — probes the geometry pipeline and names the entities responsible |
| `render_glb.cjs` | GLB → PNG with a pure-JS software rasterizer. No browser, no native deps, bit-deterministic across machines. `--pair` renders before/after with one shared camera |
| `visual_diff_report.cjs` | Per-model before/after image comparison for a PR's regression run |
| `gen_delta_csv.cjs`, `run_gen_deltas.cjs` | Digest CSV deltas between two conway versions |
| `version_order.cjs` | Ordering for engine version strings and the `conway<version>_<repo>` benchmark directory names. Shared by `run_gen_deltas.cjs` and `bless_perf_snapshot.cjs` so they cannot disagree about which snapshot is newer; handles the `-g<shorthash>` prerelease suffix and the two-component `webifc1.4` shape |
| `benchmark.cjs` | Timing sweep over a model corpus |
| `generate_flame_graph.cjs` | Flame graph from a `yarn cli-profile` run |
| `stream_corpus_sweep.mjs` | Streaming-loader sweep across the corpus |
| `m2_consumer_spike.mjs` | What a semantic consumer costs on the streaming parse's record-event path (M2/#393): event-fed vs derived-from-columns, per model |
| `load_phase_report.mjs` | Where a full durable load's time actually goes (#394 M3): the store-backed open + demand pump broken into named phases — wasm init, index build, index finalize, demand-prep paging and its five relationship sweeps, the pump's prefetch/extract/release, the per-batch scene walk, the rel-aggregate drain — and the serial residual that floors any parallel rework. Instruments the production path by wrapping shipped prototypes, so it cannot drift from it |
| `agg_pager_trace.mjs` | Every window request the store-backed load makes, tagged by caller (#616): per-phase chunk requests / hits / loads / bytes, a per-chunk load histogram, the load-order shape, and per-wave records for `AggregateExtractPager`. `--structure-only` reports just the aggregate shape (relationship count, targets per relationship, address spans, and the product-worklist / aggregate-target partition that #539 is about) for one open. `--chunk` / `--cap` override the window geometry, which both turns "the window is too small" into an A/B and pins the adaptive cap for a baseline run. Also classifies every load as compulsory or capacity (against a ghost list of recent evictions) and reports per-interval trigger statistics — the D3D-vs-PSB discriminator the #616 policy triggers on — and `--dump-stream` writes the request stream for `pager_policy_sim.mjs` |
| `agg_closure_probe.mjs` | Where one aggregate target's paging closure actually lives (#616): samples targets across the file, pages each one's extraction closure with a fresh `seen` set, and reports the closure's chunk footprint plus the entity types sitting outside the product's own chunk. This is what shows a D3D target's closure spanning 208 MB of a 213 MB file |
| `pager_policy_sim.mjs` | Replay a recorded pager request stream through candidate residency policies (#616). Valid because the `WindowedStepBufferProvider` request stream is window-independent — proven identical at every chunk/cap tested — so one instrumented load captures the whole reference string and any LRU policy's *load count* follows offline, exactly. Turns picking a trigger threshold from a 3-minute D3D load per candidate into a sub-second replay. Capture with `agg_pager_trace.mjs --dump-stream`. Models load counts, not time, and replays sequentially (so it is pessimistic about retention) — calibrate the fixed-cap row against the in-vivo number before trusting it |
| `shard_worker_pool_node.mjs` | **Bench transport** for `sharded_index_report.mjs` (#394): a Node `worker_threads` pool implementing the builder's `ShardRunner` contract. Deliberately not in `src/` — it is unpublished, untested by Jest, and its header lists lifecycle defects that are known and unfixed, because a harness one person runs on a quiet box is held to a lower bar than shipped code. Promoting it means owning that lifecycle first |
| `sharded_index_report.mjs` | Serial vs sharded index build over the **shipped** builder (#394 M2): warm and cold wall at each N, per-shard times, shard-only efficiency, and a byte-identity gate plus SHA-256 digest against the single-threaded build. Drives `src/step/parsing/sharded_index_builder.ts` through the Node worker pool rather than carrying its own copy of the logic, so its numbers are about the code that ships. The N=1 row forces the shard path (the shipped builder delegates to the serial one there) and is labelled as such |
| `index_shard_spike.mjs` | The **spike** that preceded the above (#394 M7/M8), kept as the record of how the direction was proven: its own copy of the shard/merge logic, and a `--selftest` that walks adversarial fixtures (quoted `;#…=`, block comments, `''` escapes) at every split offset. For new work use `sharded_index_report.mjs` and `src/step/parsing/sharded_index_builder.test.ts`, which is where the self-test now lives as a real test |
| `sidecar_index_probe.mjs` | Acceptance evidence for open-from-index (#541), on real models rather than `data/index.ifc`. Default mode round-trips a model's index through a **v2** sidecar and proves the restored index IS the cold one — every row of every column, `complexEntries`, the express-ID column's top-level sizing, and inline-valued attributes resolving to identical values through a model opened from the sidecar. `--transfer` prices the worker boundary for the two representations of the same index, because the cost is per-object rather than per-byte: D3D has 3.6× fewer sidecar bytes than PSB and used to pay 25× the transfer, its 720,661 inline entities crossing `postMessage` as structured-cloned objects. One model per run — a PSB-class cold parse peaks around 1.2 GB |
| `m3_worker_pool.mjs` | Geometry parallel efficiency (#394 M3): N `worker_threads`, each with its own `IfcAPI` and its own wasm linear memory (the no-SharedArrayBuffer shape production can actually ship), each claiming a `SetGeometryShard` and pumping to completion. Reports per-shard geometry times and **four duplication factors that must not be confused**: `dupWall` (summed shard **wall** time ÷ single-worker time — inflation, which by itself cannot separate "each shard did more work" from "each shard ran slower under contention"), `dupWork` and `dupVerts` (geometries and vertex floats actually **built**, summed over shards ÷ the single worker's — immune to that, because they count work rather than time), and `dupFirstBatch` (the first batch call, which is where `ensureDemandWorklists_` runs). **`dupFirstBatch` is a window, not a mechanism**: it mixes demand prep every worker repeats, the dispatch-key pass that ONLY a sharded worker runs (the N=1 reference in its denominator takes `ensureDemandWorklists_`'s unsharded early return and computes no key at all), one batch of 64 products of geometry on both sides of the ratio, and — being wall time — contention, exactly as `dupWall` is. `--prep-probe` separates them by measurement: it pumps a batch of 0 at four levels (one unsharded worker, N unsharded workers, N sharded workers, and one unsharded worker at the sweep's batch size), so replicated prep, contention on it and the shard-only key pass are each reported rather than argued about. **The geometry inside each window is removed per worker, not by differencing the levels.** The pump floors a batch of 0 at one product (`Math.max(batchSize, 1)`), so every window this probe can time contains geometry, and a sharded worker's `demandProducts_` is the *filtered* worklist — its first product is not the unsharded reference's first product, so N shards extract N different products where N unsharded workers all extract the same one. Each worker therefore follows its timed first call with up to five geometry-only calls of the same batch and reports the first minus their median, cancelling the geometry against its own products; the spread of those calls is carried through as an error bar, and a derived term smaller than that bar or than its envelope over the repetitions prints as NOT RESOLVED rather than as a number. The third draft of ledger §11.4 differenced whole windows across configurations instead, and published a key-pass share that still had `Σ_shards g(that shard's first product) − N × g(the reference's first product)` inside it. Also per-worker wasm high-water through `wasmHeapByteLength` (the module's cached `HEAPU8` view can be a growth step behind — #485) and per-worker V8, which is `used_heap_size` at one instant and **not** a peak, plus a **cumulative sweep** `VmHWM` rather than a per-N peak, since every worker count runs in one process. The union check compares the shards against the single-worker load in **both** directions and **by geometry ID**: placements missing / extra / **duplicated** (a partition that overlaps outright is invisible to the first two), payload encodings each way, and IDs the reference never built / no shard reproduced / built differently. With `NO_PAYLOAD_DIGEST=1` — the mode every number in the ledger is taken in — that comparison is **size-for-size, not byte-for-byte**; the per-shard SHA-256 is what makes it byte-for-byte, and it rides on the duplication term it is measuring. Measured on D3D at 0.885 (N=2) and 0.46-0.56 (N=4, four repetitions) — see `design/new/load-performance-ledger.md` §11. The union check also caught sharding changing at least 247 of D3D's 46,166 geometries, which it could never previously *report*: its failure path assigned to a read-only ESM namespace and crashed before printing anything |
| `m3_shard_divergence.mjs` | **Which** geometries a shard builds differently, and what they have in common (#640). `m3_worker_pool.mjs` establishes THAT a sharded load diverges but cannot name the IDs, so every hypothesis about the mechanism has had to argue from the count. Three deliberate differences from the sweep, all trading timing fidelity for diagnostic power, because this measures correctness rather than speed: **shards run one at a time** (which makes races, contention and scheduler order unable to produce the result — if divergence survives, it is a pure function of shard MEMBERSHIP); **digests are always on** (the sweep's `NO_PAYLOAD_DIGEST=1` compares sizes, under which the divergence count is a lower bound — it measures 229 at N=2 and 272 at N=4 against the size-only 181 and 247); and **every unique geometry is recorded with the entities that placed it**, alongside a product table giving each product's dispatch key, how that key resolved (`mapped` / `shape` / the positional `self` fallback), and its aggregate-target and `IfcRelVoidsElement` membership. Records go to NDJSON rather than back over `postMessage`. The join is the output: on D3D the divergent set is **100 % placed by more than one entity** against a 40.6 % base and **99.6 % has at least one voided placer** against a 9.7 % base |
| `m3_shard_divergence_explain.mjs` | Per-**geometry** rates over what the probe dumped, plus a mechanism test. The probe's own profile is per-placement, so a population uniformly shared between a voided and an unvoided product reads as ~50 % there rather than as all of it; this re-reduces the same records per geometry. Also runs — and, on D3D, **falsifies** — the specific prediction that the shard reproducing the reference is the one holding a voided placer (2.2 % confirming), which is what redirected #640 from "a shard cannot see the voiding element" to the shared-cache write order |
| `m3_shard_divergence_nesting.mjs` | The order-free test that separates "one writer decides" from "it composes", using nesting the partition already has: `shardOfDispatchKey` is `\|key\| % count`, so shard 0 of 2's products are exactly shard 0 of 4's plus shard 2 of 4's, and the reference is shard 0 of 2 plus shard 1 of 2. If a shared cache entry is decided by a single last writer, a union's payload must equal one of its two halves' — that writer lives in one half, which preserves its relative order. A union matching **neither** half is evidence against it. On D3D 86 of the reference's geometries violate it, which is what identifies writers that are not owners (`addGeometry = !isRelVoid && !isMappedItem`) |
| `m3_aggregate_table.mjs` | Each `IfcRelAggregates`' relating-object dispatch key and the products it carries. Needed because on an assembly-heavy model a product's OWN key is not how it is dispatched: the pump skips aggregate targets in the product worklist entirely and extracts them from the aggregates worklist, keyed by `relatingLocalIDOf`. 96.6 % of D3D's placements are aggregate targets, so an analysis using the product's own key is answering a different question |
| `spin_calibrate.mjs` | The box's own parallel ceiling across N **processes**, on **two kernels**. `spin` is a register-bound integer loop with no allocation and no memory traffic; `stream` reads a per-process working set sized from **this box's** last-level cache — 4x it or 1 GiB, whichever is larger, read from `/sys/devices/system/cpu/cpu0/cache` — so it is DRAM-bound. It prints the cache, the ratio and the achieved GB/s on every run and **refuses** rather than reporting a cache-resident number as a bandwidth ceiling; `--stream-mib` overrides the size, which is how the plateau gets checked (past the cache the GB/s stops changing). The size used to be a fixed 256 MiB justified as "one to two orders of magnitude" past any LLC, which was false on the box the ledger's numbers come from: it reports a 260 MiB L3, so the buffer sat under the cache it claimed to clear. Both are needed: `spin` is **by construction blind to a memory-bandwidth ceiling**, so a high `spin` number cannot be used to rule one out — only the `stream` row speaks to that. Children start behind a ready/go **barrier**, so fork and Node boot sit outside the timed window; without it the first child spins uncontended for the whole boot skew and the ceiling comes out optimistic. Run it immediately before *and* after any efficiency measurement — an efficiency without one is uninterpretable, and a contended box has previously inverted a verdict. Reads ~0.98 (`spin`) and ~0.97 (`stream`) at N=4 on the idle 4-core box in ledger §11.2 — where the two rows are 1.7 points apart against a `stream` spread of 2.3, so that box has barely a bandwidth ceiling to find. The point of the row is that `spin` **cannot** find one, not that the gap between them is a measured quantity |
| `step_nonproduct_survey.py` | Survey of non-product STEP entity usage across the corpus |
| `setup-emsdk.sh`, `build-codex.sh`, `build-gha.sh` | Toolchain and build drivers |
| `code-gen.cjs`, `gen-web-ifc-types.cjs` | Schema code generation |
| `extract-wasm-dependencies.cjs`, `fetch-prebuilt-wasm.cjs`, `fd-patch.cjs` | Build plumbing |
| `check-compiled-fresh.cjs` | Commit-gate guard: names any TypeScript source with no output under `compiled/`. Jest runs over `compiled/`, so an uncompiled test is absent from the run rather than failing it |
| `firestore_*.py`, `upload_to_firestore.py` | Corpus-data plumbing |

Scripts here are not covered by `yarn lint`, which runs over `src` only.

# Performance Test

This document provides detailed instructions on how to set up and run the
performance tests for the project.

> Note: the `performance_test.sh` driver below is no longer in this
> directory; the surrounding setup (headless-three cross-linking, the
> `benchmarks/` output layout) still describes how performance runs work.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js and npm
- A Unix-like environment (for running shell scripts)
- Checkout and build https://github.com/bldrs-ai/headless-three
- Checkout a model repo, like https://github.com/bldrs-ai/test-models

## Build headless-three with latest Conway

Conway performance test uses headless-three (H3) for its rendering environment.  So we have to update it to use the latest conway.  H3 accesses conway via the conway-web-ifc-adapter package.  To get these all using the latest conway version locally (without publishing candidate packages) we use yarn link, which symlinks a project's node_modules/{dependency} to a working repo on your machine.

Follow these steps to cross-link your working repos:

 1. In conway repo, build and test conway (see this project's root README)
 2. Run `npm pack` to verify the npm will look good (i.e. is the size you expect, has the right files)
 3. Run `yarn link`, copy the value it gives you
 4. cd to your local root for `conway-web-ifc-adapter`, paste the value and execute that yarn linking command
    1.  `yarn build` (in conway-web-ifc-adapter root)
    2.  `yarn link`, copy the value it gives you
       1.  cd ${headless-three}, paste the value and execute that yarn linking command
       2.  `yarn build` (in headless-three root)
 5. cd ${conway}

Now your local headless-three depends on your local conway-web-ifc-adapter which depends on the new version of conway.

## Run Performance Test

Run the performance test script using the following command:
```
./performance_test.sh <path to headless-three> <path to models directory>
```

For example, with output:
```
conway/scripts> ./performance_test.sh $HOME/c/b/headless-three $HOME/c/b/test-models
ok, 1s, haus.ifc
ok, 0s, box.ifc
error, 1s, bath-csg-solid.ifc
```

This will also leave output in the `../benchmarks` directory (../ relative to scripts) named for the engine and model dir being tested, e.g. `benchmarks/conway0.1.553_test-models`, including:
- performance.csv             Basic status and timings from performance script
- performance-detail.csv      A rollup of detailed stats from the renering server for all models
- $OLD_$NEW_delta.csv         Delta of performance-detail.csv between NEW and OLD versions, e.g. 0.1.500_0.1.490_delta.csv
- performance.err.txt         The error output from the script
- rendering-server.log.txt    Output from the headless-three http server, including model loading problems

There are also per model outputs including .png renders and .txt detailed stats:
```
conway/scripts> ls ../benchmarks/conway0.1.553_test-models | head
171210AISC_Sculpture_param.ifc-fit.png
171210AISC_Sculpture_param.ifc-statistics.txt
AC20-FZK-Haus.ifc-fit.png
AC20-FZK-Haus.ifc-statistics.txt
C20-Institute-Var-2.ifc-fit.png
```

That directory will also have a delta file comparing the new version of conway to the old version (npm latest).

```

```
