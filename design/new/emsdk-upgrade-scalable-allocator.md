# EMSDK upgrade → scalable allocator → enable parallel tessellation (~2× multi-core)

**Status:** Phase 0 spike executed (results below) and **Phase 1 — the EMSDK
6.0.2 toolchain bump — ships in this same PR**: `EMSDK_VERSION` → 6.0.2, the
conway-geom link-flag fixes (HEAP view exports, workerfs ENVIRONMENT), and
re-blessed goldens/baselines via companion PRs in test-models and
test-models-private. Phases 2-3 are parked behind the upstream mimalloc bug;
Phase 4 (AFTP, below) is the planned successor.

## Phase 0 spike results (executed 2026-07-08, emsdk 6.0.2, 4-core container)

Branch: `conway-geom` `spike/emsdk6-mimalloc` (throwaway; `-sMALLOC=mimalloc`
on the NodeMT target only, gate left off so one binary A/Bs via
`CONWAY_FORCE_STAGED_FACES`).

**mimalloc 3.3.1: NO-GO.** The 3.x rewrite did not fix the big-heap failure —
it changed its shape. On Arty_Z7 (needs a multi-GB heap), right after parse the
allocator issues a single bogus ~4 GB enlarge request and dies, then poisons
every subsequent allocation:

```
Cannot enlarge memory, requested 4294962208 bytes, but the limit is 4294901760 bytes!
Aborted(Assertion failed: ... "pthread mutex deadlock detected",
  at: .../musl/src/thread/pthread_mutex_timedlock.c,95,__pthread_mutex_timedlock)   × hundreds
```

The request (0xFFFFEC20, ≈ UINT32_MAX) looks like a size computation overflow
in mimalloc's arena/growth path on wasm32. Pre-reserving the heap
(`-sINITIAL_MEMORY=3072MB`) does **not** avoid it — same abort cascade — so
it's not merely the growth *event*; the request size itself is wrong. Small and
mid-size models (≤ ~14 MB source) run fine under mimalloc, confirming it's the
large-heap regime, same territory as the 2.x unaligned-atomic fault.
**Action:** file upstream (emscripten-core/emscripten) with this repro;
parallel tessellation stays gated off until a fixed allocator exists.

**EMSDK 6.0.2 serial performance: initial measurements suggested ~17-27%
faster, but interleaved re-measurement demoted that to "unconfirmed,
likely modest".** The initial single-shot comparisons (driver 6.1→5.1 s,
jet 17.0→12.9 s, Arty 67.6→49.2 s) were taken hours apart in a shared
container whose absolute speed later proved to swing by ±18% (the same
3.1.72 binary measured 64.7 s and 92.3 s across three interleaved
rounds). Interleaved A/B on Arty averages 75.9 s (3.1.72) vs 70.8 s
(6.0.2) — a ~5-15% improvement at best, within this container's noise
floor. **The definitive number will come from the perf-three CI delta on
dedicated runners after this merges** — the pipeline fixed in #358 is
precisely the instrument for it. The upgrade is justified regardless:
three-major toolchain currency, the HEAP-export fix, MEMORY64 maturity,
and the platform for future allocator work.

Correctness sanity: supercap.step digest under 6.0.2/dlmalloc has identical
structure to the committed baseline (1169 rows, same IDs and types); only
geometry hashes moved — the expected codegen/FP drift, confirming the Phase 1
re-bless plan.

**Build fallout actually observed (small):** the 3.1.72-era genie.lua flags all
still work (deprecation warnings only: `USE_PTHREADS` → prefer `-pthread`);
prebuilt 3.1.72 dependency archives (draco/manifold/gltfsdk) link fine under
6.0.2's wasm-ld; and the predicted 4.0.7 breakage is real — `'HEAPU8' was not
exported` surfaces in conway's error path, so the MT targets need the used heap
views added to `EXPORTED_RUNTIME_METHODS` in Phase 1.

**Revised recommendation:** decouple. Do Phase 1 (EMSDK bump to 6.0.2, dlmalloc,
re-bless) now — perf upside is unconfirmed-but-likely (see the corrected
measurement note above; CI perf-three will quantify it) and the toolchain
currency + HEAP fixes stand on their own; park Phases 2-3 behind the upstream mimalloc
fix. The plan below is kept as originally scoped for reference.

## Deep-debug session (2026-07-08, follow-up): root cause isolated

We instrumented emscripten's vendored mimalloc (marker strings verified present
in the linked binary each iteration — earlier "healthy" runs turned out to be
stale-toolchain artifacts and were discarded) and tested three hypotheses
against a deterministic 5-second Arty_Z7 repro:

| hypothesis | patch tried | result |
|---|---|---|
| exponential arena escalation (32 MB → 1 GiB → ~4 GiB) overruns wasm32 | cap per-arena reserve at 256 MiB on 32-bit (`mi_arena_reserve`) | failures moved from 1 GiB to exactly 256 MiB — **still dies identically** |
| purge churn (decommit is a no-op on wasm, purge_delay default 1000 ms) | `purge_delay = -1` (never purge) | **zero behavior change** |
| growth-event overhead | `-sINITIAL_MEMORY=3072MB` pre-reserve | **zero behavior change** |

The tell: the instrumented count of ≥32 MB system-level allocations is **2504
in every configuration** — these are not allocator-internal arena operations,
they are the workload's own large tessellation buffers passing through to
emmalloc. Emscripten's port builds mimalloc with 16 KiB arena slices
(`-DMI_ARENA_SLICE_SHIFT=(12+MI_SIZE_SHIFT)`), which makes the maximum
in-arena object small, so every multi-MB geometry buffer bypasses arenas
entirely and goes to emmalloc. Conway's tessellation grows vertex/index
buffers by realloc: each step allocates a larger block and frees the smaller
one, and emmalloc cannot reuse the accumulated smaller holes for the next
larger request — the sbrk break ratchets monotonically upward until it hits
the 4 GiB ceiling (`Cannot enlarge memory, requested 4294962208`) while live
data is only ~1.5 GB. **dlmalloc survives the identical allocation pattern
because it extends its top chunk in place instead of leapfrogging.**

Secondary bug: when that allocation fails, mimalloc's failure path aborts (or
returns) while internal locks are held, so every subsequent allocation from any
thread deadlocks (`pthread mutex deadlock detected` cascade with assertions; a
silent hang without them).

**Conclusions**

1. This is not fixable with mimalloc *tuning*; it needs an upstream change to
   large-object handling on wasm32/emmalloc (e.g. realloc-aware pass-through,
   or in-place growth cooperation with emmalloc), plus the lock-safety fix on
   the failure path. Upstream report material: deterministic repro, the three
   falsified hypotheses, instrumentation traces, and both patches (in the
   session's instrumented emsdk tree; arena cap + purge default).
2. Even with a working allocator, the parallel-tessellation prize has shrunk:
   post-NURBS-optimization, staged face tessellation is only ~20-25% of Arty
   geometry time (best parallel run 37.8 s vs 45.1 s serial, 2.3× CPU
   utilization ⇒ Amdahl-bound ≤ ~1.3×). The "~2×" in this doc's title was
   calibrated before the NURBS wins landed. A future parallel win needs to
   widen the parallel section (parallelize profile/curve/CSG stages, batch
   ThreadPool jobs more coarsely), which is a conway-geom design effort, not
   an allocator flip.
3. **Phase 1 (EMSDK 6.0.2 + dlmalloc; serial delta to be confirmed by CI
   perf-three) remains the action
   item.** Phases 2-3 are parked: blocked upstream AND their expected value
   needs re-estimation per (2). The successor to Phases 2-3 is the
   Allocation-Free Tessellation Pipeline below.

## Phase 4 — Allocation-Free Tessellation Pipeline (AFTP)

**Goal:** tame transient memory and unlock high multi-core utilization by
removing allocation from the tessellation hot path entirely, instead of
swapping global allocators.

**Why this supersedes the mimalloc plan.** The debug session showed the
multi-GB peaks are an artifact of allocation *strategy*, not intrinsic need:
Arty_Z7's retained geometry is ~75 MB while RSS peaked at 4.5 GB. Two
mechanisms dominate: (a) mesh accumulation buffers grow by realloc
(geometric growth → transient old+new copies → fragmentation; the traced
2504 ≥32 MB system allocations), and (b) per-face temporaries (CDT
triangulation state, trim-curve polygons, NURBS sample grids) are
malloc/freed ~31.7k times per model — which is also exactly the dlmalloc
global-lock contention that made the parallel path lose. Remove the
allocations and both problems disappear: peak memory drops toward
(retained output + few pooled buffers per thread), and the parallel path
stops fighting a malloc lock — no exotic allocator required, no upstream
dependency.

**Design sketch**

1. **Per-thread scratch arenas.** Each ThreadPool worker (and the main
   thread) owns a reusable bump-allocated arena for all per-face
   tessellation temporaries. Reset (pointer rewind) after each face —
   zero malloc/free in steady state. Rare oversized faces spill to the
   heap via an explicit slow path (counted, logged).
2. **Exact-size commits.** Tessellate into scratch, then perform one
   exact-size allocation (or reservation-backed append) to commit
   triangles into the target CanonicalMesh — eliminating the realloc
   ratchet. Where output size is knowable (grid tessellation), reserve
   up front; where it isn't (CDT), commit from scratch after the fact.
3. **Reservation-aware accumulation.** Size-estimate per-element meshes
   (sum of face estimates) and reserve once; fall back to chunked
   growth with capped over-allocation where estimates are unavailable.
4. **Allocator-agnostic.** Works identically under dlmalloc today and any
   future allocator; independently useful on the Web (single-thread)
   build by cutting allocator pressure and peak memory.

**Constraints / cautions**

- Byte-identical output is the regression bar (digests must not move):
  AFTP changes *where* intermediates live, never the arithmetic or
  ordering of emitted triangles.
- CDT's internal allocations are third-party (external/CDT); phase them
  in via a custom allocator/adapter or accept CDT-internal mallocs
  initially (they are a fraction of the per-face churn).
- Scratch sizing needs telemetry first: instrument per-face temporary
  high-water marks across the STEP+IFC corpus to pick arena sizes and
  quantify the spill rate before committing to numbers.

**Success criteria**

- Peak RSS on Arty_Z7 ≤ ~4× retained geometry (target: hundreds of MB,
  not GBs); no regression on small models.
- Parallel staged tessellation beats serial by ≥1.5× on 4 cores for
  tessellation-heavy models, with `hasScalableAllocator()`-style gating
  replaced by "always on" once allocation-free.
- Digests byte-identical to the serial path across the full regression
  corpus.

**Plan**: telemetry pass → arena + scratch for face tessellation →
exact-size commits → reservation-aware meshes → re-measure parallel
scaling → widen the parallel section (profiles/curves) as a follow-on.

### Telemetry pass results (executed 2026-07-09, emsdk 6.0.2 build)

Instrument: `conway-geom` `structures/alloc_telemetry.{h,cpp}` on branch
`claude/aftp-telemetry` — a thread-local RAII scope around each
`AddFaceToGeometry{,Simple}` interposes the system allocator (wasm-ld
`--wrap`) and records per-face allocator-call counts and peak live bytes,
decomposed into scratch (freed in-scope, arena-sizable) vs escaped
(outlives the face — mesh commits). Opt-in at genie time via the
`CONWAY_ALLOC_TELEMETRY` env var; release/CI builds unchanged.

| model | faces | allocator calls (avg/face, max/face) | per-face peak scratch | escaped/face (avg, max) |
|---|---|---|---|---|
| Arty_Z7.stp (55 MB) | 31,681 | **217.6M** (6,870, 26.5M) | 48.6% <1 KiB, 99.71% <512 KiB, 99.91% <1 MiB; 8 outlier faces up to ~3.9 GB transient | 3.1 KB, 1.5 MB |
| Jetenginestep.stp (19.9 MB) | 5,061 | 14.4M (2,849, 505k) | 81.5% <32 KiB, 97.8% <2 MiB, max 83.6 MB | 50 KB, 24 MB |
| Schependomlaan.ifc / FM_ARC_DigitalHub.ifc | 0 scoped | — | — | — |

**What this says:**

1. **The malloc traffic is enormous and per-face scratch is tiny.** One
   Arty load makes ~218M allocator calls — the dlmalloc global lock gets
   acquired ~218M times, which is the measured reason the parallel staged
   path lost to serial. Meanwhile 99.9% of faces never need more than
   ~1 MiB of transient memory at once.
2. **Arena sizing:** a **1–2 MiB per-thread bump arena** (reset per face)
   absorbs ≥99.9% of faces on Arty and ~98% on the NURBS-dense jet engine;
   a counted heap-spill slow path covers the tail (jet's spill tail reaches
   ~84 MB, Arty has 8 pathological faces that transiently touch GBs —
   worth a follow-up look in their own right).
3. **Escaped bytes are small** (avg 3–50 KB/face) — commits into the target
   mesh are a minor share of in-scope allocation, so the arena + exact-size
   commit design attacks the right target.
4. **Scope note:** `AddFaceToGeometry` is the STEP / IFC-advanced-brep
   path; standard IFC models (extrusions/profiles/CSG — e.g.
   Schependomlaan, DigitalHub) record zero scoped faces. Their tessellation
   entry points need their own scopes in the next telemetry increment
   before IFC gets arena treatment; the STEP path is where the measured
   lock convoy lives, so it goes first.

### Implementation results (executed 2026-07-10, emsdk 6.0.2)

The arena and its wiring landed on `conway-geom:claude/aftp-telemetry`
(conway PR #360 / conway-geom PR #139), byte-identical throughout:

1. **The primitive** — `structures/scratch_arena.h`: a per-thread bump
   `ScratchArena` (counted heap spill for the giant-face tail), a
   nestable checkpoint `ScratchArenaScope` (mark/rewind, not reset-to-zero,
   so tessellation helpers nest safely), a `ScratchAllocator<T>` for typed
   `std::vector` temporaries, and a `ScratchArenaResource : std::pmr::
   memory_resource` so pmr containers draw from the same arena. Standalone
   host test passes clean under ASan/UBSan.

2. **`TriangulateBounds`** (faceted planar path): boundary rings routed
   through `ScratchAllocator`. Byte-identical, but ~0.3% on NURBS models —
   the diagnostic that sent us to the real hot path.

3. **`WingedEdgeMesh` arena-backing** (the win): the per-face tessellation
   mesh — whose `edge_map` allocates a node per edge, plus its growing
   vertex/edge/triangle vectors — is the dominant per-face malloc source.
   Making its four containers `std::pmr` and constructing the three
   `ParameterVertex` surface tessellators (bspline/cylindrical/spherical)
   on `ThreadScratchResource()` under a per-face `ScratchArenaScope` moves
   that traffic to the arena. pmr keeps `WingedEdgeMesh` a single type, so
   `tesselate()`/`appendMeshToGeometry` signatures don't change; the default
   resource stays new/delete so the CSG/manifold and `glm::dvec*` meshes are
   untouched.

   **Measured (Jetenginestep, telemetry build):** allocator calls
   **14,416,593 → 4,710,049** — **−67%** (avg 2,848.6 → 930.7 per face).
   Digests for duplex, AC20-FZK-Haus, haus, ISSUE_126_model, dental_clinic,
   advanced_model, and Jetenginestep all match the committed 6.0.2 baselines
   exactly.

4. **Subdivision candidate heap** (`tesselate()`): the
   `std::priority_queue<CandidateEdge>` runs inside the same per-face scope
   and is backed with a pmr container on the arena. Byte-identical (heap
   order is the comparator's, not the allocator's).

### The payoff: parallel now wins (the point of AFTP)

The whole reason AFTP exists: the staged parallel tessellation path was
built and byte-identical but **gated off**, because on dlmalloc's single
global malloc lock it ran *slower* than serial. With each worker now
tessellating in its own thread-local arena, that lock contention is gone.

**Re-measured on the arena build (Jetenginestep, 4-core container,
interleaved serial vs `CONWAY_FORCE_STAGED_FACES`, geometry ms):**

| round | serial | parallel | speedup |
|---|---|---|---|
| 1 | 12484 | 7778 | 1.60× |
| 2 | 12107 | 7698 | 1.57× |
| 3 | 12604 | 8025 | 1.57× |
| 4 | 12079 | 7981 | 1.51× |

**~1.57× on 4 cores** — and the parallel path is **byte-identical** to serial
(same digest, confirming the thread-local arena is correct under real
pthreads). This *flips* the previous result. Container timing is noisy in
absolute terms, so the definitive number is still the CI perf-three delta on
dedicated runners; but the direction (parallel < serial, previously the
reverse) is unambiguous and consistent across rounds.

**Remaining:** the surviving ~4.7M/face allocs are third-party CDT
internals (`external/CDT`, which doesn't expose an allocator hook — needs a
vendored adapter) plus earcut internals, and the standard-IFC extrusion/CSG
paths (which record zero scoped faces today) — follow-on targets, same
byte-identical gate, to widen the win and push the parallel scaling further.

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

## Where this stood at scoping time (facts as of the 3.1.72 pin)

*(Snapshot from before this PR's Phase 1 landed; kept for the record. The
EMSDK pin below is now 6.0.2 — this PR changes it.)*

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

1. **Does the mimalloc 3.x rewrite (emsdk ≥ 5.0.7) fix the arena fault?**
   This is the sharpest lead from the changelog review below: we only ever
   tested mimalloc **2.x** (it was 2.1.7 around emsdk 3.1.73, and 4.0.23 shipped
   a 2.x port). Emscripten **5.0.7 (2026-04-30) updated mimalloc to 3.3.1**, a
   major rewrite of exactly the arena/heap code where our unaligned-atomic
   fault lived. So the spike should **start at 5.0.7+ (prefer the latest,
   6.0.2)**, not bisect from 4.0.23. Success = a minimal repro (worker threads
   allocating to ~4 GB under `-sMALLOC=mimalloc`) that no longer crashes.
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

## EMSDK changes to account for in testing (3.1.72 → 6.0.x)

We are pinned at **3.1.72 (2024-11-19)**. The current release is **6.0.2
(2026-07-01)** — so an upgrade crosses **three** major bumps (4.0, 5.0, 6.0).
The changes below are the ones that can affect *our* build, bindings, output,
or consumers and therefore need explicit test coverage. "Verify" = confirmed in
the emscripten ChangeLog; "check" = likely-affects-us, confirm during the spike.

### Directly relevant to this effort (allocator / memory / threads)
- **mimalloc 2.1.7 → 3.3.1 (5.0.7).** The whole premise — a major-version
  rewrite of the allocator; target ≥ 5.0.7 (see Unknown #1).
- **`MEMORY64` is no longer experimental (as of 3.1.72); `-m64` is honored as an
  alias for `-sMEMORY64`/`--target=wasm64` (6.0.0).** A real lever if mimalloc's
  per-thread heaps push us into the 4 GB ceiling — but wasm64 is a large change
  (perf, size, browser support) and stays a *separate* spike, not part of the
  default upgrade.
- **`GROWABLE_ARRAYBUFFERS` defaults to `=1` (6.0.2), with `=2` to avoid the
  overhead in multi-threaded builds.** We are a multi-threaded, memory-growth
  build; measure MT memory/perf and consider `=2`.

### Likely to force build/binding changes (test these)
- **Standard memory views `HEAP8`/`HEAP32`/… are no longer exported by default
  (4.0.7),** and **missing entries in `EXPORTED_RUNTIME_METHODS` now *error*
  instead of warn (4.0.7).** conway's TS glue accesses the heap views; expect to
  add the ones we use (e.g. `HEAPU8`, `HEAPF64`, `HEAP32`) to the MT targets'
  `EXPORTED_RUNTIME_METHODS` in `genie.lua`, and expect a hard build error if
  any referenced export is missing rather than a silent warning.
- **`MODULARIZE` factory is `async` (4.0.0) and *always* returns a promise, even
  with async compilation disabled (4.0.12).** We build `MODULARIZE=1
  EXPORT_ES6=1`; confirm every `ConwayGeomWasm*()` instantiation in conway and
  in headless-three awaits the factory.
- **C++ exception ABI moved: `WASM_LEGACY_EXCEPTIONS` toggle added (4.0.0); the
  standard Wasm EH now uses the LLVM backend (4.0.2); C++ exceptions are always
  thrown as `CppException` objects (5.0.5).** We build
  `NO_DISABLE_EXCEPTION_CATCHING` and conway-geom throws internally (e.g. CDT).
  Decide legacy-vs-standard EH and confirm our catch paths still behave.
- **`SINGLE_FILE` binary embedding changed from base64 to UTF-8 string (4.0.18).**
  Our Node MT/`SINGLE_FILE=1` bundles embed the wasm — confirm the single-file
  module still loads and that size/parse time didn't regress.

### Consumer / environment floors (note, don't block)
- **Minimum Node for generated code bumped v12.22 → v18.3.0 (6.0.0).** CI and
  the perf harness run Node 20, so fine — but flag it for any downstream Node
  consumer of `@bldrs-ai/conway`.
- **Minimum browsers raised: Chrome 74→85, Firefox 68→79, Safari 12.2→14.1
  (6.0.0).** Affects the `ConwayGeomWasmWebMT` module and Share; confirm the
  target-browser matrix is still acceptable.

### Cross-cutting consequence
Any of the codegen-affecting changes above (new toolchain, new EH backend,
different allocator) means **generated code and floating-point results will
move** — output will *not* be byte-identical to 3.1.72. This is the driver for
the golden/baseline re-bless in Phase 1, and the reason to bump EMSDK on its own
before touching the allocator.

## Work plan (phased)

**Phase 0 — Spike (answers the unknowns above).** Throwaway branch: bump
`EMSDK_VERSION` to a mimalloc-3.x release (**≥ 5.0.7, prefer 6.0.2**), add the
mimalloc link flags to the MT targets, get it to build (expect to fix the
`HEAP*` exports and possibly the MODULARIZE-async / EH items above), run the
allocator stress repro near 4 GB, and micro-benchmark the parallel path. Go/no-go
gate: only proceed if (1) mimalloc 3.x doesn't crash and (2) the parallel path is
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
