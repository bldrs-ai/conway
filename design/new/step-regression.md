# STEP (AP214) regression testing

Detailed design for the STEP regression infrastructure that
[`step-support.md`](step-support.md) §"Phase 2" calls out as gap #2 (and
that gaps #5/#6 lean on). The companion to the IFC regression system, with
**one deliberate difference in what it hashes** — see §"The digest" below.

This doc exists because the obvious move (clone the IFC runner, swap the
parser) produces a STEP regression that passes on the exact bug class STEP
files are most prone to. Read §"The digest" before writing any code.


## Background: how IFC regression works today

- `ifc_regression_main.ts -d <file> <out>` parses one IFC file, extracts
  geometry, and writes `<out>.csv` — one row per geometry item, keyed by
  **expressID**, value = `sha1` of that item's **OBJ serialization**
  (`geometryHashes()` in `ifc_model_geometry_node.ts`, which iterates
  `IfcModelGeometry.objs()`).
- `ifc_regression_batch_main.ts` recursively walks a folder (filtering to
  `.ifc`, lines ~361/507), shells each file through the main with a timeout,
  then `sha1`s each `<out>.csv` into a `file,hash,errors` index. The index is
  diffed against the checked-in baseline under
  `test-models/regression/test_models/`; any drift surfaces as the
  failed.csv / errors.csv the PR comment shows.
- CI (`.github/workflows/build.yml`, `run-ifc-regression` job) clones
  `test-models` at a pinned SHA, runs the batch, and posts the diff.

The IFC digest hashes geometry **per entity, before scene assembly**. That
is correct for IFC, where the bug surface is per-item mesh generation.


## The digest (the one design decision that matters)

STEP assemblies fail differently. The #308 "port cluster" was a bug in
**assembly transform composition** (`doTransforms` scaling the translation
of a relationship placement during mixed-unit conversion), not in any single
item's mesh. A per-entity, pre-assembly digest — the IFC approach ported
verbatim — would hash each sub-part's local geometry, see no change, and
**pass while every part is collapsed onto the origin**.

So the STEP digest must hash **post-transform, assembled** geometry:

```
scene            = AP214GeometryExtraction(...).extractAP214GeometryData()[1]
aggregator       = new GeometryAggregator(wasm, { maxGeometrySize })
aggregator.append(scene)
aggregated       = aggregator.aggregateNative()        // world-space vertices
// aggregated.geometry : NativeVectorGeometryCollection (StdVector<GeometryCollection>)
for each collection in aggregated.geometry:
    for each GeometryObject g in that collection:
        hash = sha1( new GeometryConvertor(wasm).toObj(g) )
```

`aggregateNative()` is the same path the `-g` CLI flag feeds to glTF/GLB
export, so its vertex buffers are the world-space coordinates a viewer
actually draws. A clustering regression moves those vertices → the OBJ text
changes → the hash changes → the batch diff flags it. This reuses the exact
two proven primitives the IFC path uses — `GeometryConvertor.toObj()` and
`sha1` — only at the assembled level instead of the per-entity level.

### Determinism

The IFC digest is keyed by a stable expressID, so row order is irrelevant.
The aggregated STEP geometry has **no per-row stable key** — chunk/collection
order depends on scene-walk and aggregation iteration order. Two mitigations,
in order of preference:

1. **Sort the hash set.** Emit the per-`GeometryObject` `sha1`s sorted
   lexicographically, one per row, with no positional index. Order-independent;
   a clustering regression still changes the multiset of hashes. Loses
   per-chunk localization but keeps the gate stable. **Recommended for v1.**
2. If localization matters later, key rows by a content-derived id (e.g. the
   owning AP214 `product`/`shape_representation` expressID threaded through
   the scene), not by aggregation position.

This shares the determinism concerns catalogued in
[`glb-snapshot-goldens.md`](glb-snapshot-goldens.md) §"What's missing"
(Map iteration order, float reduction order, Draco). The OBJ-text digest
sidesteps the Draco/glTF-header sources that doc worries about — prefer OBJ
over GLB bytes for the regression gate, and leave GLB-byte goldens to that
separate effort.


## Two tiers

### Tier 1 — hermetic, fast (lives in conway, no test-models)

A tiny mixed-unit **assembly** fixture in `data/`, exercised in-process by
Jest, asserting sub-component world positions are **not** collapsed to the
origin. This is the cheap guard that would have caught #308 in `yarn test`
(husky precommit + CI `build`), with no test-models round-trip.

- **Helper-level coverage (done):** `uniformScaleBasis` unit tests in
  `ap214_geometry_extraction.test.ts` (PR adding them refs #308/#334) pin the
  rigid-transform invariant directly — basis scaled, translation preserved —
  and contrast it against `uniformScaleAffine`.
- **Fixture-level coverage (todo):** a `data/ap214-mixed-unit-assembly.step`
  with two trivial solids in **different** length units joined by a
  `representation_relationship_with_transformation` carrying a nonzero
  assembly translation — the exact `doTransforms` `needsScale` path
  (`ap214_geometry_extraction.ts` ~L4315–4344). The test aggregates the scene
  and asserts the two parts' world-space bounding boxes are separated by ~the
  assembly offset (not coincident at origin). This needs a **real geometry
  source** — hand-authoring two BREP solids with referential integrity is
  error-prone; prefer a minimal CAD export (mm + inch parts) or a referential
  reduction of the Arty fixture, validated with the `step` CLI before
  committing.

### Tier 2 — golden corpus (Arty + future STEP models, in test-models)

Mirror the IFC heavy job. **Extend the existing runner by extension dispatch
rather than fork a parallel one** — reuse the clone/cache, CSV diff, timeout,
and PR-comment plumbing already built. The only genuinely new code is the
post-transform digest (above).

Concrete changes (apply in a runnable env; the digest's runtime behaviour
needs validation against Arty before the CI gate is enabled):

1. **`src/AP214E3_2010/ap214_regression_main.ts`** — new file. CLI mirroring
   `ifc_regression_main.ts`'s contract: positional `<file> <out>`, `-d`
   digest flag, optional `--perf <path>`. Parses via `AP214StepParser`,
   extracts via `AP214GeometryExtraction` (mirror the proven sequence in
   `ap214_command_line_main.ts` `geometryExtraction()`), aggregates, writes
   the sorted-hash `<out>.csv`, and emits a one-row perf CSV when asked.
   Watch the lint gate: `no-magic-numbers` is **error-level** (only −10..10
   ignored; `ignoreArrayIndexes`/const-initializers exempt) and jsdoc
   `@param`/`@return` descriptions are required — name your constants.
2. **`ifc_regression_batch_main.ts`** — in both walk sites (~L361, ~L507) add
   a `.stp`/`.step` branch alongside `.ifc`; route those to a `runForFileStep`
   that spawns `ap214_regression_main.js` instead of `ifc_regression_main.js`.
   Keep the `.ifc` path byte-identical — it is the load-bearing green gate.
   (Or generalize `runForFile` to take the main's path by extension.)
3. **Bundling** — add an `ap214_regression_*` entry to the bundle scripts only
   if the batch is invoked from the published package; for CI-only use the
   compiled `./compiled/...` path is enough.
4. **Golden storage** — `test-models/regression/step_models/` (sibling to
   `test_models/`), or a `step/` subtree walked by the same job. Arty lives at
   `test-models/step/grabcad/.../Arty_Z7.stp`; it is **slow** (tens of
   seconds of geometry) — heavy job only, never the in-`build` hermetic gate.
5. **`build.yml`** — add a step (or extend the existing invocation) to walk
   the STEP subtree. **Do not enable this until the `step_models` baselines
   exist** in test-models, or the job diffs against nothing and the gate is
   meaningless. This is the one ordering dependency between the two repos.

### test-models side (out of scope for adapter-removal sessions)

`test-models` is not in the adapter-removal session's repo allowlist. The
conway-side pieces (Tier 1 + items 1–3, 5-as-`build.yml`) land here; the
following land in `test-models` (or `test-models-private` for the private
corpus, same shape):

- [ ] Add Arty (+ any other STEP models) under a `step/` tree.
- [ ] Generate `step_models/` baselines by running the new batch once and
      committing the resulting index/CSVs.
- [ ] Confirm the baselines were generated from a Conway build that includes
      the #334 basis-only fix (else the golden bakes in the cluster bug).


## Status / cross-refs

- #308 root cause + fix: `ap214_geometry_extraction.ts` `doTransforms` /
  `uniformScaleBasis`; conway PR #334.
- step-support.md Phase 2 is the parent checklist; this doc is its detailed
  design. Update that checklist as items land.
- glb-snapshot-goldens.md is the complementary (GLB-byte) golden effort;
  shares determinism concerns, different artifact.
