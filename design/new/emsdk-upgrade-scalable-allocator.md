# EMSDK upgrade → scalable allocator → enable parallel tessellation (~2× multi-core)

**Status:** Proposal / scoping. No behavior change in this PR — this is the plan.

## TL;DR

The parallel, staged face-tessellation path is already built, verified
byte-identical to the serial path, and merged — but it is **gated off at
runtime** because our default allocator (dlmalloc) serialises every
`malloc`/`free` behind one global lock, which makes allocation-heavy parallel
work *slower* than serial. A thread-scalable allocator (mimalloc, per-thread
heaps) removes that lock and, in local measurement, is where the parallel path
becomes a net win. mimalloc currently **crashes** on our pinned toolchain
(emsdk 3.1.72) and on 4.0.23 with an unaligned-atomic fault in its arena code
near the 4 GB heap ceiling. The opportunity: find/confirm an emscripten version
where that upstream bug is fixed, link the MT modules with mimalloc, flip
`hasScalableAllocator()` → `true`, and turn on the parallel path that already
exists. Expected upside from earlier local runs: roughly **2× geometry time on
multi-core, for both IFC and STEP** (they share the same geometry kernel), on
top of the ~3.8× already shipped.

## Where this stands today (facts, with pointers)

- `hasScalableAllocator()` returns `false` unless the `CONWAY_SCALABLE_ALLOCATOR`
  macro is defined — `dependencies/conway-geom/conway-api.cpp:270-281`. It is
  **not** defined in any current build.
- Callers gate the parallel staged path on that flag; with it `false` they use
  the immediate/serial path. Env overrides exist for experiments:
  `CONWAY_FORCE_STAGED_FACES` / `CONWAY_DISABLE_STAGED_FACES`.
- The MT modules link **without** `-sMALLOC=mimalloc` and with
  `-s MAXIMUM_MEMORY=4GB` + `-s USE_PTHREADS=1` +
  `-sPTHREAD_POOL_SIZE="<cores>"` — `dependencies/conway-geom/genie.lua`
  (`ConwayGeomWasmNodeMT` target, ~lines 908-935; `ConwayGeomWasmWebMT`
  ~1341-1380). So the default dlmalloc is in effect.
- EMSDK is pinned at **3.1.72** — `.github/workflows/build.yml:22`
  (`EMSDK_VERSION`), consumed by the WASM cache key and `setup-emsdk`.
- The staged-tessellation infrastructure (`StageFaceToGeometry` /
  `FinalizeStagedFaces`, thread pool, atomic svg counter) is present and
  exercised; see conway-geom `ConwayGeometryProcessor.{h,cpp}`,
  `structures/thread_pool.h`.

**Known blocker (measured, not assumed):** with `-sMALLOC=mimalloc`, worker
threads allocating near the 4 GB ceiling hit an unaligned atomic in mimalloc's
arena code and crash. Reproduced on **both** emsdk 3.1.72 and 4.0.23 → treated
as an upstream emscripten/mimalloc bug, not something a flag tweak fixes.

## Hypothesis

A newer emscripten release fixes (or lets us configure around) the mimalloc
arena fault. On that toolchain we can:

1. Link the MT modules with `-sMALLOC=mimalloc` +
   `--define-macro=CONWAY_SCALABLE_ALLOCATOR`.
2. `hasScalableAllocator()` returns `true`; the already-built parallel staged
   tessellation activates by default.
3. Geometry time drops ~2× on multi-core for IFC and STEP.

The whole point of the `hasScalableAllocator()` seam was to make this a
link-flag + toolchain change, not a code rewrite.

## Unknowns to resolve first (spike, ~1–2 days)

1. **Which emscripten version fixes the mimalloc arena fault?** Bisect emsdk
   releases > 4.0.23 (and check the emscripten + mimalloc changelogs / issue
   tracker for the specific unaligned-atomic-in-arena fix). Success =
   a minimal repro (worker threads allocating to ~4 GB under
   `-sMALLOC=mimalloc`) that no longer crashes.
2. **Does mimalloc actually win once it doesn't crash?** Re-measure the parallel
   staged path with mimalloc on the fixed toolchain (`CONWAY_FORCE_STAGED_FACES`)
   vs the serial path, on Arty_Z7 / DSA2 / the STEP corpus. Confirm the ~2×
   before committing to the upgrade.
3. **Is 4 GB still the ceiling, or do we want more?** mimalloc + large heaps is
   exactly where the fault lived. Decide whether to stay at
   `MAXIMUM_MEMORY=4GB` (wasm32) or evaluate MEMORY64 (a much bigger change —
   likely out of scope for this effort).
4. **Thread-pool sizing.** `PTHREAD_POOL_SIZE` is baked at link time from a core
   count; confirm the pool size and the runtime `ThreadPool` are sane on the
   target runners and typical user machines once the parallel path is hot.

## Work plan (phased)

**Phase 0 — Spike (answers the unknowns above).** Throwaway branch: bump
`EMSDK_VERSION`, add the mimalloc link flags to the MT targets, build, run the
allocator stress repro, and micro-benchmark the parallel path. Go/no-go gate:
only proceed if (1) mimalloc doesn't crash and (2) the parallel path is
measurably faster.

**Phase 1 — Toolchain upgrade (conway + conway-geom), allocator still dlmalloc.**
Land the EMSDK bump *without* enabling mimalloc yet, to isolate toolchain churn
from the allocator change:
- `.github/workflows/build.yml`: `EMSDK_VERSION` → new version. This changes the
  WASM cache key (full rebuild) and the emsdk system-libs cache key.
- Rebuild locally + in CI; fix any emcc/flag incompatibilities in
  `genie.lua` and the two repos' build scripts.
- **Re-bless all geometry goldens/baselines** — an emscripten bump changes codegen
  and floating-point, so digests will move (they will *not* be byte-identical to
  the 3.1.72 output). This touches:
  - `data/*.csv` Tier-A goldens (conway),
  - the IFC + STEP regression baselines in `test-models` and
    `test-models-private` `regression/test_models/` (the 45 + 100 IFC and the
    50 + 10 STEP CSVs, some just committed),
  - GLB snapshot goldens if affected.
  Bless from CI's toolchain, not local, per the existing golden convention.
- Verify no perf regression vs 3.1.72 on the serial path.

**Phase 2 — Enable mimalloc + flip the gate.**
- Add `-sMALLOC=mimalloc --define-macro=CONWAY_SCALABLE_ALLOCATOR` to the MT
  targets in `genie.lua`. `hasScalableAllocator()` now returns `true`.
- Keep `CONWAY_FORCE_STAGED_FACES` / `CONWAY_DISABLE_STAGED_FACES` as escape
  hatches.
- Confirm output is still byte-identical **to Phase 1** (the staged path was
  verified equal to serial; the allocator must not change geometry).
- Measure IFC + STEP before/after; target ~2× geometry on multi-core.

**Phase 3 — Roll out.** Publish a new `@bldrs-ai/conway`, bump it in Share,
run the perf-three suite to capture the multi-core delta, and document the new
floor.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| mimalloc still crashes on every available emsdk | Phase 0 is a hard go/no-go before any real work. If no version fixes it, stop and file upstream; parallel path stays gated (status quo, no loss). |
| EMSDK bump changes geometry output | Expected. Re-bless goldens + regression baselines from CI's toolchain in Phase 1; the STEP baselines just landed, so the diff is reviewable. |
| Toolchain churn breaks the build (flag removals/renames across ~5 emcc majors) | Isolate in Phase 1 with mimalloc off, so a build break is separable from an allocator problem. |
| CI cost: EMSDK bump busts the WASM cache → full rebuild for a while | One-time; cache repopulates on first green main run. |
| mimalloc raises baseline memory (per-thread heaps) near the 4 GB ceiling | Measure peak RSS/heap in Phase 0/2; if tight, revisit `MAXIMUM_MEMORY` / pool size. |
| Web (browser) MT module regresses even if Node MT wins | Treat `ConwayGeomWasmNodeMT` and `ConwayGeomWasmWebMT` separately; the gate can be per-module. |

## Success criteria

- mimalloc-linked MT module runs the full IFC + STEP corpus with no allocator
  crash near 4 GB.
- Output byte-identical to the serial path (goldens re-blessed for the new
  toolchain, then stable).
- ~2× geometry-time improvement on a multi-core machine for representative
  large models (Arty_Z7, DSA2, jet engine), measured via perf-three.
- No regression on single-core / small models.

## Open questions for reviewers

1. Target emsdk version — do we track latest stable, or pin to the first
   version that fixes the mimalloc fault?
2. Is a one-time re-bless of the freshly-committed STEP baselines acceptable, or
   should we sequence this so STEP baselines are blessed once, on the upgraded
   toolchain, to avoid a double churn?
3. MEMORY64 — explicitly out of scope here, or worth a parallel spike given the
   4 GB ceiling is where the mimalloc fault lives?
4. Default-on vs opt-in (env flag) for the parallel path in the first shipped
   release after the upgrade.
