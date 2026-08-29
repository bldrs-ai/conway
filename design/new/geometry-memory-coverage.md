# What memory machinery protects a geometry load? An audited matrix

Companion to [`emsdk-upgrade-scalable-allocator.md`](emsdk-upgrade-scalable-allocator.md)
(the AFTP work that built the scratch arena) and to the still-unmerged
`load-performance-ledger.md` / `browser-memory-analysis.md` on
`claude/github-issue-394-sqdt6b` in bldrs-ai/conway, which this doc's audit
was commissioned to check (conway#637, sub-issue of conway#635). Read this
doc, not the ledger, for the current, verified state of arena coverage — the
ledger's §7 claim about scope is superseded below.

**Scope of this doc.** Audit and policy (conway#637 items 1 and 4), plus the
measurement those commissioned (item 2 — see
[Measured](#measured-d3ds-allocation-profile-item-2)). Extending arena
coverage (item 3) is still out of scope here, and the measurement below
changes what item 3 should be.

**Method.** Every claim below is either **[code]** — read from the pinned
`dependencies/conway-geom` revision, cited file:line, verified by grep and by
reading the function body, not by trusting a comment or a commit message — or
**[inferred]** — reasoned from adjacent code without a direct read of the
executing path. Nothing here is asserted from memory of a previous audit.
Pinned revision: `conway-geom@6d7c054` (submodule HEAD as checked out for
this audit, 2026-08-28).

## Verified: the arena is at four sites, not two

conway#637 states `ScratchArenaScope` appears "at exactly two sites in
production code, both in `mesh_utils.h`." **That undercounts by half.** A
full-repo grep for `ScratchArenaScope` construction against the pinned
revision finds:

| # | Site | Function | Covers |
|---|---|---|---|
| 1 | `conway_geometry/operations/mesh_utils.h:2628` | `TriangulateConicalSurface()` | per-face `WingedEdgeMesh<ParameterVertex>` for conical surfaces |
| 2 | `conway_geometry/operations/mesh_utils.h:3014` | `TriangulateCylindricalSurface()` | same, cylindrical surfaces |
| 3 | `conway_geometry/operations/mesh_utils.h:5298` | `TriangulateBspline()` | same, B-spline/NURBS surfaces |
| 4 | `conway_geometry/operations/geometry_utils.h:767` | `TriangulateBounds()` | the earcut scratch (`std::vector` over `conway::ScratchAllocator`) for **planar** bound polygons |

(Three more constructions exist in
`conway_geometry/structures/scratch_arena_test.cpp` — unit-test code, not a
production path, correctly excluded from the issue's count.)

Sites 1–3 all landed in one commit,
`49dede4 "AFTP phase 2: arena-back WingedEdgeMesh — 67% fewer allocator calls"`,
whose own message says "the three ParameterVertex surface tessellators
(bspline / cylindrical / spherical)" — a second drift worth flagging: the
commit message names *spherical*, but `TriangulateSphericalSurface()`
(`mesh_utils.h:1324`) has no `ScratchArenaScope` and never constructs a
`WingedEdgeMesh<ParameterVertex>` — it builds `WingedEdgeMesh<glm::dvec3>` on
the default heap resource (**[code]**, read in full: lines 1324–1655 —
`TriangulateSphericalSurface()`'s own span, ending where
`TriangulateToroidalSurface()` begins at `:1656` — contain no
`ScratchArenaScope`, no `ThreadScratchResource`). The commit's *code* covers
conical, not spherical; the commit's *prose* says the opposite. Site 4
(`TriangulateBounds`) landed separately, in `2afcf37 "AFTP phase 2: wire
TriangulateBounds scratch to the arena"`.

**Consequence for the issue's central claim.** conway#637 says the ledger's
"scoped to `AddFaceToGeometry`" line is wrong, and that the real scope is
narrower — "two curved-surface triangulators... A planar-faced BREP gets
nothing either." Site 4 directly refutes the second half: **a planar-faced
BREP face *does* get arena coverage**, via `TriangulateBounds`. So the
corrected picture is not "two sites, planar gets nothing" — it is "four
sites, and the gap is elsewhere." See the matrix below for where.

**`TriangulateBounds` is called from two places, and only the second one
makes the claim above true** (**[code]**). Reading just the first is the
natural way to conclude the opposite, and a review round did exactly that
(#639), so both are spelled out here:

1. `ConwayGeometryProcessor.cpp:705-711` — the `!parameters.advancedBrep`
   branch. This covers planar **non-advanced** faces only.
2. `ConwayGeometryProcessor.cpp:745-748` — the **fall-through `else` at the
   end of the `advancedBrep` branch**, after the seven
   `surface.<kind>.Active` tests. This is the one a planar advanced face
   reaches.

A planar `IfcAdvancedFace` / `advanced_face` takes route 2: the extractors
set `advancedBrep: true` (`ifc_geometry_extraction.ts:5083`,
`ap214_geometry_extraction.ts:4774`), and `extractSurface` for an `IfcPlane`
sets only `nativeSurface.transformation` (`ifc_geometry_extraction.ts:5101-5103`)
— never any of the seven `Active` flags, which each default to `false`
(`IfcGeometryReps.h`). With no curved-surface flag set, the chain is
`advancedBrep: true` → the `else` at :711 → every `Active` false → the
final `else` at :745 → `TriangulateBounds` → the `ScratchArenaScope` at
`geometry_utils.h:767`.

**Do not reason about this from the `AllocSite` tag.** Both call sites tag
their work `AllocSite::TriBounds`, so the telemetry cannot separate "planar
non-advanced" from "planar advanced, fallen through" — a distinction that
matters precisely when deciding whether the advanced-BREP path is covered.

## The dispatcher and its eight tagged paths

`AddFaceToGeometry` (`ConwayGeometryProcessor.cpp:674`) is the single
entry point for advanced-BREP face tessellation, shared identically by the
STEP (AP214) and IFC front ends — both call the same compiled function
through the wasm binding. It classifies each face by surface type and
dispatches to one of eight `Triangulate*` functions, each already wrapped in
an `AllocTagScope` telemetry tag (`ConwayGeometryProcessor.cpp:705-750`) —
the AFTP instrument built exactly to attribute allocations per surface kind.
Cross-referencing those eight tags against arena coverage (**[code]**, each
row read from the named function body):

| `AllocSite` tag | Function | `WingedEdgeMesh` variant | Arena-covered? |
|---|---|---|---|
| `TriBounds` | `TriangulateBounds` | n/a (earcut over `ScratchAllocator` vectors) | **yes** — site 4 |
| `TriBspline` | `TriangulateBspline` | `<ParameterVertex>` on `ThreadScratchResource()` | **yes** — site 3 |
| `TriCylinder` | `TriangulateCylindricalSurface` | `<ParameterVertex>` on `ThreadScratchResource()` | **yes** — site 2 |
| `TriConical` | `TriangulateConicalSurface` | `<ParameterVertex>` on `ThreadScratchResource()` | **yes** — site 1 |
| `TriSphere` | `TriangulateSphericalSurface` | `<glm::dvec3>`, default heap | **no** |
| `TriToroidal` | `TriangulateToroidalSurface` | `<glm::dvec3>`, default heap | **no** |
| `TriRevolution` | `TriangulateRevolution` | `<glm::dvec3>`, default heap | **no** |
| `TriExtrusion` | `TriangulateExtrusion` (surface-of-linear-extrusion tessellator) | `<glm::dvec3>` main body; delegates to `TriangulateBounds` on several fallback branches | **partially** — main algorithm no, several named fallbacks yes |

Four of eight advanced-BREP surface tags are arena-covered; four are not.
This is a materially different — and more precise — picture than "two
sites" in either direction: more sites are covered than the issue states,
and the uncovered set is bigger than "everything except cones and
cylinders" (it also includes spheres, tori, revolution surfaces, and most of
extrusion-surface tessellation).

**A naming trap worth flagging explicitly**: `TriangulateExtrusion` in
`mesh_utils.h` (an `ExtrusionSurface`-typed advanced-BREP face — rare) is a
different function from `Extrude()` in `geometry_utils.h` (the solid
sweep behind `IfcExtrudedAreaSolid` — the common case). Same word, disjoint
call graphs, opposite arena status (see next section). Don't conflate them
when reading either the code or this doc.

## The path the issue is actually about: IFC extrusion/profile/CSG

D3D's geometry is "a Tekla IFC4 export" of ordinary extrusions — not
advanced-BREP faces at all. That path does not go through
`AddFaceToGeometry`:

- `IfcExtrudedAreaSolid` → `ifc_geometry_extraction.ts:2359`
  `extractExtrudedAreaSolid` → `conwayModel.getExtrudedAreaSolid()` →
  `ConwayGeometryProcessor::getExtrudedAreaSolid`
  (`ConwayGeometryProcessor.cpp:3248`) → `Extrude()`
  (`geometry_utils.h:1043`) (**[code]**, full call chain read).
- `Extrude()` builds its cap polygons as
  `std::vector<std::vector<Point>>` (default `std::allocator`, not
  `conway::ScratchAllocator`) and calls `mapbox::earcut<uint32_t>` directly
  — **[code]**, read in full, lines 1043–1200+. No `ScratchArenaScope`, no
  `ThreadScratchResource`, anywhere in the function.
- CSG/boolean composition (`manifold_utils.h` and the rest of
  `conway_geometry/operations` outside `mesh_utils.h`/`geometry_utils.h`)
  has **zero** `ScratchArenaScope` or `ScratchAllocator` occurrences —
  **[code]**, repo-wide grep, confirmed empty outside the two files already
  covered above.

So: **IFC extrusion/profile/CSG — the path that produced #635's numbers —
has no arena coverage anywhere in its call graph**, confirming the issue's
premise for this specific path. But the *reason* is not "planar BREP gets
nothing" (refuted above); it's that solid extrusion is a structurally
separate code path from `AddFaceToGeometry` altogether, sharing only the
word "extrusion" and the underlying earcut library with the one advanced-BREP
tag (`TriBounds`) that does have coverage.

One corroborating detail: `AllocTelemetryScope`, the instrument the AFTP
telemetry pass reads (`structures/alloc_telemetry.h:17`), is placed only
around `AddFaceToGeometry`/`AddFaceToGeometrySimple`
(`ConwayGeometryProcessor.cpp:676`, `:624`). `StageFaceToGeometrySimple`
(`:807`) has no telemetry scope of its own. It never wraps
`getExtrudedAreaSolid`/`Extrude()`. So "the AFTP telemetry pass recorded zero
scoped faces on ordinary extrusion/profile/CSG IFC models" is expected on
architectural grounds alone — the instrument was never placed on that call
graph — independent of whether the arena mechanism would help there. This
doesn't change the coverage conclusion (already independently confirmed by
reading `Extrude()`), but it does mean the "zero" reading is not itself
evidence of anything beyond "the instrument wasn't there" — worth naming so
nobody later treats that zero as a measurement of the extrusion path's
per-face allocation cost. It isn't one.

Format note: both AP214 (STEP) and IFC extraction call
`getExtrudedAreaSolid` for their respective extruded-solid entities
(**[code]**, `ap214_geometry_extraction.ts:2409-2415` mirrors
`ifc_geometry_extraction.ts:2385-2391`) — same compiled `Extrude()`, same
gap, both formats. The split that matters is *solid extrusion vs.
advanced-BREP face*, not *STEP vs. IFC*.

## Geometry budget (`GEOMETRY_BUDGET_MB`, `GeometryResidency`) — IFC-only, not cross-format

conway#637 says the geometry budget "appears to apply across formats —
worth confirming rather than assuming." **It does not; it is IFC-only.**

- `GeometryResidency` (`src/ifc/geometry_residency.ts`) is instantiated
  exactly once, as `IfcStepModel.geometryResidency`
  (`src/ifc/ifc_step_model.ts:29`) — **[code]**. `IfcStepModel` is conway's
  IFC-over-STEP-physical-file model class (the class handles IFC's schema;
  "Step" in the name refers to the SPF encoding IFC files use, not the
  AP214 mechanical-CAD format).
- The AP214 (STEP mechanical) model class, `AP214StepModel`
  (`src/AP214E3_2010/ap214_step_model.ts:21`), holds
  `geometry = new AP214ModelGeometry()` (`ap214_step_model.ts:25`) —
  **[code]**, and `AP214ModelGeometry`
  (`src/AP214E3_2010/ap214_model_geometry.ts`) has no `residency`,
  `budget`, or `evict` member at all — repo-grep over that file is empty
  for all three terms. There is no AP214 analogue of `GeometryResidency`.
  `AP214ModelGeometry` does have `delete(localID)` and
  `deleteTemporaries()` (`ap214_model_geometry.ts:59,77`), and
  `deleteTemporaries()` is called on the AP214 load path
  (`ap214_geometry_extraction.ts:6746`), the exact mirror of the IFC call
  at `ifc_geometry_extraction.ts:8649` — so AP214 does shed CSG/boolean
  temporaries the same way IFC does. What it lacks is specifically a
  *budgeted LRU over retained meshes*: no cap, no recency tracking, no
  byte ceiling, nothing driven by `GEOMETRY_BUDGET_MB`, and no
  `GeometryResidency` registration.
- The `GEOMETRY_BUDGET_MB` open setting wires in only through
  `ifc_api_proxy_ifc.ts:437-440` (`model.geometryResidency.setBudgetBytes(...)`),
  which only exists on the IFC front end
  (`ifc_api_proxy_ap214.ts` has no matching code — **[code]**, grepped
  empty).

So `demandGeometry` (the issue's name for this mechanism) does not exist
under that literal name anywhere in the tree (**[code]**, repo-wide grep is
empty); the actual API is `GeometryResidency.evictToBudget()` /
`.setBudgetBytes()`, called from `ifc_api_proxy_ifc.ts` only. **A STEP
(AP214) load sheds its CSG/boolean temporaries via `deleteTemporaries()`,
same as IFC, but has no budgeted LRU, no recency tracking, and no byte
ceiling over the meshes it retains** — nothing driven by
`GEOMETRY_BUDGET_MB`, and no `GeometryResidency` registration. This is a
real gap, and a bigger one than "does the budget apply to STEP too" — STEP
has no comparable retained-mesh eviction policy to apply, even though it
does clean up transients the way IFC does.

## Adaptive residency (#616/#617) — a shared class, but wiring decides who gets it

`WindowedStepBufferProvider` (`src/step/step_buffer_provider.ts:354`) is
constructed inside `StepModelBase.spillSourceToExternalStore`
(`src/step/step_model_base.ts:811`, construction at `:822`) — **[code]**.
(There is no `StepModelBase.openStreamed` — grepped empty.)
`StepModelBase` is the common ancestor of both `IfcStepModel` and
`AP214StepModel` (both `extends StepModelBase<...>` — `ifc_step_model.ts:21`,
`ap214_step_model.ts:21`), and `spillSourceToExternalStore` itself is
format-agnostic — the *class* is shared. But every **open-time**
construction of `WindowedStepBufferProvider` in the tree is IFC-side
(`ifc_step_parser.ts:118,159`, `ifc_stream_open.ts:129,211`,
`ifc_api_proxy_ifc.ts:1245`); `src/AP214E3_2010/` constructs none, and has
no `ap214_stream_open` — AP214 reaches the mechanism only if a caller
explicitly spills via `ifc_api_proxy_ap214.ts:213` →
`spillSourceToExternalStore`.

**The first-order gate is the open mode, not the format** — a correction
this doc's own earlier revision got wrong by framing it as IFC-versus-AP214
(**[code]**, and raised in review on #639). Two sibling paths in
`ifc_api_proxy_ifc.ts` make it plain:

| Open | Model construction | Windowed? |
|---|---|---|
| buffer-backed (`:1054`) | `new IfcStepModel(data, columns)` | **no** — the source stays resident |
| store-backed (`:1245`) | `new WindowedStepBufferProvider(store)` → `new IfcStepModel(void 0, columns, provider)` | yes |

The same split is in the parser: `parseDataToModel` /
`parseDataToModelAsync` construct `new IfcStepModel(input.buffer, …)` with a
resident buffer (`ifc_step_parser.ts:48-71`), while only the
`parseStreamToModel` / `parseStreamToModelAsync` pair installs a provider
(`:118`, `:159`). **So an ordinary buffer-backed IFC open gets no adaptive
source residency either.** It is not that IFC windows by default and AP214
does not.

Two qualifications stack, and both belong on any claim about this
mechanism:

1. **Open mode** — buffer-backed opens, in either format, are unwindowed.
2. **Format** — IFC additionally has an *open-time* store-backed path that
   installs the provider (`ifc_stream_open.ts:129,211`,
   `ifc_api_proxy_ifc.ts:1245`); `src/AP214E3_2010/` constructs none and has
   no `ap214_stream_open`, so AP214 reaches the mechanism only when a caller
   explicitly spills.

Once a provider is installed the policy is identical for both formats —
the same thrash detection and doubling behaviour described in
`step_buffer_provider.ts:58-115`. The *class* is genuinely shared; the
*wiring* is not, and the wiring is what decides whether a given load is
protected.

On D3D specifically: per conway#635, adaptive residency grows the window to
the whole 213.6 MB file "by design," so on this model it *costs* ~150 MB
rather than saving any — a documented, measured cost (ledger, not re-verified
here since it's outside this audit's scope), not a bug in the mechanism.

## `geometry_residency.ts` (the 8 MB / 85 MB figure)

This is the same `GeometryResidency` class discussed above (the file *is*
`src/ifc/geometry_residency.ts`) — not a separate mechanism. The 8 MB live
set under an 85 MB heap on MB-Khaya (10.6×) is documented in the file's own
header comment (lines ~24-50) as the measured effect of its LRU eviction
policy. Same IFC-only scope as the budget section above: this number
describes `IfcModelGeometry`'s cache behaviour and has no AP214 counterpart.

## The matrix, per geometry path

| Path | Scratch arena | Geometry budget / residency (extracted-mesh cache) | Adaptive residency (source window) — **gated on open mode, see below** |
|---|---|---|---|
| IFC extrusion / profile (`IfcExtrudedAreaSolid` → `Extrude()`) | **no** — [code] | yes (IFC-only) | only on a **store-backed** open — [code] |
| IFC CSG / boolean composition | **no** — [code] | yes (IFC-only) | only on a **store-backed** open — [code] |
| IFC advanced BREP, planar face | yes, via `TriBounds` — [code] | yes (IFC-only) | only on a **store-backed** open — [code] |
| IFC advanced BREP, conical/cylindrical/B-spline face | yes — [code] | yes (IFC-only) | only on a **store-backed** open — [code] |
| IFC advanced BREP, spherical/toroidal/revolution/extrusion-surface face | **no** (main body) — [code] | yes (IFC-only) | only on a **store-backed** open — [code] |
| STEP (AP214) solid extrusion (`Extrude()`) | **no** — [code] | **no AP214 analogue exists** — [code] | only if a caller **explicitly spills** — [code] |
| STEP (AP214) advanced BREP, planar face | yes, via `TriBounds` — [code] | **no** — [code] | only if a caller **explicitly spills** — [code] |
| STEP (AP214) advanced BREP, curved face | same per-surface split as IFC (shared compiled function) — [code] | **no** — [code] | only if a caller **explicitly spills** — [code] |

The scratch-arena column is identical for STEP and IFC on every advanced-BREP
row because `AddFaceToGeometry` is one compiled function shared by both
front ends — coverage there was never a format question, only a
surface-type question. The geometry-budget column is the one that actually
splits by format, and it splits because the mechanism was built once, for
`IfcStepModel`, and never given an AP214 counterpart — not because AP214
was evaluated and excluded.

## Measured: D3D's allocation profile (item 2)

conway#637 item 2 asked for D3D's per-face allocation profile, to test the
ledger's hypothesis that extending the arena is "the single largest identified
lever". It has now been run. **The hypothesis is refuted for the extrusion
path and redirected to CSG.**

**Method.** The `AllocTelemetryScope` / `AllocSite` instrument was extended to
the two call graphs the audit above found uninstrumented — `Extrude()` /
`Sweep()` / `SweepCircular()` (solid sweeps) and `BoolSubtract()` (CSG/boolean
composition) — and every scope now names its *kind*, so a swept solid's
numbers are bucketed separately from a BREP face's instead of averaging into
one meaningless per-"face" population. Built with `CONWAY_ALLOC_TELEMETRY=1`
(`yarn build-codex-MT`) and run through `ifc_regression_main` on
`D3D.ifc` (213.6 MB, Tekla IFC4 export), which is the model conway#635's
numbers come from.

**Probe validation first, per the rule this instrument violated once already.**
`block.ifc`, `index.ifc`, `index_georeferenced.ifc` and `grid_placement.ifc`
still report zero units — and that null is now explained rather than trusted:
those models carry only `IfcPolygonalFaceSet` (vertices and indices given
directly, no tessellation) or `IfcBlock` (a directly-constructed box). Where
extrusion *is* present the unit count matches the entity count exactly:
`mapped_shared_representation.ifc` has 15 `IFCEXTRUDEDAREASOLID` and records
15 `extrude_solid` units; `aggregate_master_voids.ifc` has 2 plus one
`IFCRELVOIDSELEMENT` and records 3 `extrude_solid` units and 1 `csg_boolean`.

### The profile

Allocator calls made inside each instrumented scope, one D3D load:

| Scope kind | Units | Alloc calls | Share | Cumulative bytes/unit (avg) | Live peak/unit (avg) |
|---|---:|---:|---:|---:|---:|
| `csg_boolean` | 6,466 | **43,185,966** | **98.77 %** | 2.73 MB | 108 KB |
| `extrude_solid` | 22,429 | 508,934 | 1.16 % | 4.9 KB | 2.1 KB |
| `sweep_solid` | 325 | 27,784 | 0.06 % | 62 KB | 39 KB |
| `advanced_face` | 320 | 2,464 | 0.01 % | 1.0 KB | 0.7 KB |
| **total** | **29,540** | **43,725,148** | | | |

Within `csg_boolean`, by site: `csg_kernel` (the `csg.run()` calls) 33.2 M
calls / 16.76 GB gross bytes; `csg_operand_prep` (`Geometry::Cleanup()` on the
operands) 9.86 M calls / 863 MB. Within `extrude_solid`: `extrude_cap` 77.8 %,
`earcut` 15.3 %, the side-wall pass 6.9 %.

For scale on the same run: `peakWasmHeapMb` 610.9, `geometryMemoryMb` 175.1,
geometry stage 31.6 s of a 35.3 s load.

### Three things this settles

1. **The "zero scoped faces" reading was an instrument artifact, and the
   artifact was enormous.** The pre-existing instrumentation saw 2,464 of
   D3D's 43.7 M in-scope allocator calls — **0.006 %**. 98.9 % of the
   instrumented units (29,220 of 29,540) are on call graphs that had no scope
   at all. Any conclusion previously drawn from that null described the
   instrument, not the model.
2. **Extrusion is not the lever.** Solid extrusion is 1.16 % of D3D's
   allocator traffic, at 4.9 KB cumulative allocation per swept solid — small,
   shallow, and already nearly free. Arena-backing `Extrude()` would remove
   roughly one percent of the allocator calls on the model the work was scoped
   around.
3. **CSG is, by roughly two orders of magnitude.** `BoolSubtract` accounts for
   98.8 % of in-scope allocator calls.

All three rest on **counts**, which are the one thing this instrument measures
without qualification. The byte columns do not carry the same weight, for two
independent reasons set out next.

### The byte columns are not yet trustworthy, and here is exactly why

Both of these were raised in review of conway#651 / conway-geom#192, verified
against source, and are recorded here rather than quietly dropped — the next
person would otherwise re-derive the same broken numbers.

**1. The instrument does not track allocation ownership.** `onFree`
(`alloc_telemetry.cpp`) subtracts *every* free that happens inside a scope from
the in-scope live counter, including frees of memory allocated **before** the
scope began. It cannot tell the two apart, because it does not record which
pointers it handed out. So `liveBytes` — and therefore the per-unit peak and
the retained figure at scope exit — is corrupted whenever a pre-scope free
lands inside a unit. The clamp at that site only stops the counter going
negative; it does not stop the corruption, and where it fires it is erasing
bytes that really were live in scope.

The instrument now counts the clamp firings so the exposure is quantified per
path rather than left as a general suspicion. Measured on D3D:

| Scope kind | In-scope frees | Clamped frees | Clamped bytes | Peak / retained |
|---|---:|---:|---:|---|
| `csg_boolean` | 42,593,806 | **878,669** | 30.9 MB | **unreliable** |
| `extrude_solid` | 464,076 | 0 | 0 | usable |
| `sweep_solid` | 27,156 | 0 | 0 | usable |
| `advanced_face` | 2,400 | 0 | 0 | usable |

So the defect bites exactly where the numbers are largest — CSG, where
`Cleanup()` and the kernel free operand buffers allocated before the
composition began — and nowhere else. Note the clamp count is a **lower
bound** on the occurrences: a pre-scope free smaller than the current live
counter corrupts it silently without clamping. The fix is pointer-ownership
tracking (subtract a free only if this scope allocated that pointer); until
that exists, `csg_boolean`'s peak and retained columns should not be quoted.

**2. Retained bytes include reusable global scratch, on every path.**
`Geometry.cpp:30` declares a file-scope `VertexWelder welder;`. Its containers
are `clear()`/`resize()`/`reserve()`d in `weld()` and **never**
`shrink_to_fit`, so capacity grown inside a scope is still live when the scope
closes and is counted as retained *output* when it is in fact reusable
scratch. `CSGMesher::reset()` has the same shape. This makes the retained
figure depend on which unit last grew the cache — a warm cache reports less
retained than a cold one for identical work. Deriving retained bytes from the
returned geometry, rather than from what is still live at scope exit, would
fix this.

### Arena sizing needs cumulative bytes, not the live peak

An earlier draft of this section cited "98.1 % of boolean compositions peak
under 256 KiB" as evidence that CSG transients are arena-shaped. **That was
the wrong distribution.** `ScratchArena` makes deallocation a no-op until the
enclosing scope rewinds, so what an arena must hold for one unit is every byte
that unit allocated, not the most it held at once. On a path that recycles
heavily the two differ by more than an order of magnitude.

The instrument now records both. For `csg_boolean` on D3D:

| Cumulative allocation per composition | Cumulative % of units |
|---|---:|
| < 128 KiB | 4.6 % |
| < 1 MiB | 53.2 % |
| < 4 MiB | 92.8 % |
| < 8 MiB | 98.3 % |
| < 128 MiB | 100 % |

Average 2.73 MB, **maximum 85 MB**, against a live-peak average of 108 KB —
a 25× gap on the average and far more in the tail. A 256 KiB arena would cover
about 5 % of compositions; covering 93 % needs ~4 MB, and covering all of them
needs ~128 MB. That is a materially different proposition from what the
live-peak histogram implied, and it is a real constraint on the rescope below
rather than a footnote.

`extrude_solid`, for contrast, is genuinely small on this distribution too:
100 % of swept solids allocate under 32 KiB cumulatively.

### One comparison this does *not* license

The peak-to-retained ratios this instrument produces are **not** comparable to
the 60× quoted for Arty_Z7, and now for three reasons rather than one. The
original: this column is Σ(per-unit transient peak) / Σ(per-unit retained),
both accumulated inside scopes, whereas the Arty_Z7 60× is a whole-process
figure (~75 MB retained under a ~4.5 GB heap peak) whose denominator includes
everything a load holds. The two added above: ownership is untracked, and
retained includes global scratch. A whole-process ratio for D3D would need the
perf harness's peak/retained columns, not this instrument.

What *is* directly comparable, and unaffected by all three, is the
allocator-call churn: 43.7 M malloc/free-shaped calls against 610.9 MB of peak
wasm heap, with 16.76 GB of gross bytes cycled through the allocator by the
CSG kernel alone. The churn the arena was built to remove is real here. It is
simply not where item 3 was pointed.

## Still unmeasured, and what it would take

- **Whether an arena would actually help CSG, as opposed to being merely
  where the calls are.** The measurement above sizes the opportunity in
  allocator calls and in cumulative bytes; it does not establish that
  `csg.run()`'s allocations are scope-lifetime (freed before the composition
  closes) rather than structures that outlive it. That is a code question
  about the CSG kernel's internals, and it should be answered before any arena
  is placed there — a bump arena rewound at scope exit is only correct for
  allocations that die inside the scope.
- **Trustworthy byte columns**, which need pointer-ownership tracking in
  `onFree` and a retained figure derived from returned geometry rather than
  from what is live at scope exit. Both are described above. Until then the
  count columns are the load-bearing ones.
- **A whole-process peak-vs-retained figure for D3D**, comparable to
  Arty_Z7's 60×. See the caveat above: this instrument cannot produce one.
- **Whether an AP214-side `GeometryResidency` analogue is wanted at all.**
  This audit establishes that none exists, not whether AP214's load profile
  needs one — STEP mechanical-CAD models may have a different retained-vs-
  transient shape than IFC's per-product extraction pattern. That's a
  measurement question for whoever picks up the budget-coverage gap, not
  answered here.

## The policy

Today, whether a geometry path gets memory machinery is an accident of which
function happened to get profiled (curved advanced-BREP faces, because
Arty_Z7 surfaced them) rather than a property anyone decided a tessellation
entry point should have. Stating the policy so the next entry point inherits
it by default:

1. **Every per-face or per-solid tessellation scratch structure (temporary
   mesh, edge map, candidate heap, boundary-polygon buffer) is
   arena-backed by construction, not by retrofit.** The pattern already
   exists and is cheap to apply: construct on `conway::ThreadScratchResource()`
   under a `ScratchArenaScope` (or `conway::ScratchAllocator<T>` for a bare
   `std::vector`) immediately before the scratch structure it covers, as
   sites 1–4 above do — at the top of the function for sites 1–3, or, for
   site 4, at the top of the branch that actually allocates
   (`geometry_utils.h:767`, inside `TriangulateBounds`'s
   `else if (bounds.size() > 0)` arm, not the function's top-level
   `if` at `:743`). The scope should sit as close to its allocation as the
   function's control flow allows, not necessarily at the function's own
   entry. A new `Triangulate*` function, a new CSG entry point, or a new solid-sweep
   helper should default to this rather than needing someone to notice its
   allocation profile first. The four currently-uncovered advanced-BREP
   tags (`TriSphere`, `TriToroidal`, `TriRevolution`, `TriExtrusion`) and
   the two currently-uncovered non-advanced-BREP paths (`Extrude()`, CSG)
   are the concrete backlog this principle names — extending them is
   conway#637 item 3, gated on the item-2 measurement above.
2. **Telemetry attribution (`AllocTagScope`/`AllocSite`) is added at the
   same time as the scratch structure, not after.** It's what makes the
   next audit possible without re-deriving this matrix by hand. Every
   tessellation or CSG entry point should carry a tag whether or not it is
   yet arena-backed — an untagged path is invisible to the AFTP telemetry
   pass by construction, which is exactly the trap `Extrude()` fell into.
3. **The extracted-geometry residency budget (`GeometryResidency`) is a
   per-model-class decision, not an IFC-specific one, and any future format
   front end should decide it explicitly rather than inherit silence.**
   If AP214 stays unbudgeted, that should be a stated choice (e.g. "STEP
   mechanical-CAD assemblies don't show IFC's cold-representation pattern,
   measured on corpus X") recorded here or in a successor doc, not an
   absence nobody chose.
4. **The STEP-source adaptive residency window (#616/#617) is
   format-agnostic in its *class* but not in its *wiring*, and the wiring
   is what protects a load.** Inheriting `StepModelBase` does **not** get a
   format windowed automatically: the provider is installed by the open
   path, so a buffer-backed open is unwindowed in either format, and AP214
   has no open-time installation at all. The policy ask is therefore the
   mirror of item 3's: **state which open modes are expected to be
   windowed, and make an unwindowed open of a large source a deliberate,
   recorded choice rather than a property of which entry point the caller
   happened to call.** Sharing a base class is where this mechanism is
   ahead of the other two; it is not yet where it needs to be.
5. **Byte-identical is the bar for any coverage extension**, per conway#637's
   verification section: an arena or a residency policy changes *where*
   something lives, never *what* is computed. Digest re-blessing is only
   for models whose output legitimately changes (there should be none), and
   any digest churn on an extension is a bug in the extension, not an
   accepted cost.

## Summary of what changed by doing this audit

- The issue's site count (2) is revised to **4** production
  `ScratchArenaScope` constructions, plus one nested subdivision-heap
  allocation (`tesselation_utils.h:409`) that rides inside three of those
  four scopes rather than opening its own.
- The issue's inherited claim that "a planar-faced BREP gets nothing" is
  **refuted**: `TriangulateBounds` (site 4) covers exactly that case.
- The issue's "worth confirming" on cross-format geometry budget is
  **resolved: it does not apply across formats.** AP214 has no residency
  or budget mechanism at all, not a differently-tuned one.
- The issue's characterization of the IFC extrusion/CSG gap is
  **confirmed** by reading `Extrude()` and the CSG call graph directly —
  genuinely zero arena coverage there, for a different structural reason
  (separate call graph, not "planar BREP") than the ledger implied.
- The "largest lever" framing was a **hypothesis** when the audit was
  written; item 2 has since **measured it and found it misdirected**.
  Extending the arena to the extrusion path — the work the ledger called the
  largest lever — would reach 1.2 % of D3D's allocator traffic. The 98.8 % is
  in CSG/boolean composition.
- The instrument itself now covers the solid-sweep and CSG call graphs, and
  every scope names its kind, so the "zero scoped faces" failure mode cannot
  recur silently on those paths. `src/ifc/alloc_telemetry_coverage.test.ts`
  pins the placements by matching each function body, not by grepping for the
  enum name.
- Two defects in the instrument's **byte** accounting — untracked allocation
  ownership in `onFree`, and reusable global scratch counted as retained —
  are now documented and, for the first, quantified per path by a clamp
  counter. The **count** columns are unaffected, and they are what the
  conclusions above rest on.
