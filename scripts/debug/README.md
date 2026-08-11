# Model debugging

Tools for the question *"why does this model look wrong?"* — as distinct
from *"did this change break anything?"*, which is what the regression
digests and visual diffs in [../README.md](../README.md) answer.

Start here before writing a one-off tracer. The reason this directory
exists is that the AmazingHand STEP investigation (conway#444) burned
most of its wall clock on throwaway instrumentation that was rebuilt from
zero, twice attached to the wrong seam, and never survived the session.

| Tool | Answers |
|---|---|
| [`model_report.mjs`](model_report.mjs) | Which entities produced bad geometry, and at which stage of the pipeline |
| [`../render_glb.cjs`](../render_glb.cjs) | What does the output actually look like (zero-dependency software rasterizer, deterministic, pair mode for before/after) |
| [`../visual_diff_report.cjs`](../visual_diff_report.cjs) | Which regression models changed appearance in this PR |
| The STEP / IFC CLI mains | Query entities by express ID, and export GLB/GLTF/OBJ to feed the renderer |


## Quick start

Needs a built tree — the tools import from `compiled/`, not `src/`:

```
yarn build-incremental              # TypeScript only
yarn build-codex-MT                 # if conway-geom (C++/wasm) changed
```

Then:

```
node scripts/debug/model_report.mjs Right_Hand.step
node scripts/debug/model_report.mjs haus.ifc --stage mesh --top 40
node scripts/debug/model_report.mjs part.step --limit 0.25 --json | jq .
```

To see it, export a GLB and rasterize it. The CLI mains take the model
directly; `yarn cli` / `yarn step` are the same entry points bundled, and
need `yarn bundle-examples` first.

```
STEP=compiled/src/AP214E3_2010/ap214_command_line_main.js   # IFC: compiled/src/ifc/ifc_command_line_main.js

node $STEP Right_Hand.step -g          # writes Right_Hand_test0.glb (+ gltf, draco) to cwd
node scripts/render_glb.cjs Right_Hand_test0.glb hand.png
```

Large models split across several chunk files (`..._test0.glb`,
`..._test1.glb`, ...); pass them comma-separated, because rendering only
the first chunk silently drops the rest of the model.

`render_glb.cjs` also takes `--pair before.glb after.glb outPrefix`, which
frames both sides with one camera on the union of their bounds — the only
way a stray spike reads as an obvious difference rather than two
individually auto-fit, incomparable images.


## The four stages

`model_report.mjs` loads the model through the normal `ConwayModelLoader`
path — so IFC and STEP behave exactly as they do in Share — with probes at
four levels, and reports entities whose output is an outlier against the
rest of the model.

| Stage | Seam | Sees |
|---|---|---|
| `curve` | `extractCurve` (AP214 + IFC) | Per-curve point extent, express ID, entity type, whether it was trimmed |
| `loop` | `ConwayGeometry.getLoop` | Per-loop extent, point-spacing histogram, wrap duplicates, sub-3-point loops |
| `face` | `ConwayGeometry.addFaceToGeometry` | Vertices one face contributed, and how far out they landed |
| `mesh` | scene walk after load | Per-mesh local bounds, attributed to the product entity |
| `displacement` | scene walk after load | Per-mesh distance from the model's robust centre, in world space |

They are deliberately redundant, and that redundancy is the diagnostic:
the *narrowest dirty stage* is where the defect lives.

- `mesh` dirty, `curve` clean → tessellation, CSG or transform.
- `curve` already dirty → curve or geometry interpretation, upstream of
  tessellation. Look at the entity types and the `trimmed` column.
- `loop` clean on extent but showing gaps orders of magnitude below the
  loop's own size → a triangulation-robustness problem, not a placement
  problem.

The `face` stage forces `CONWAY_DISABLE_STAGED_FACES=1`, because staged
faces defer their work to a later batch where a per-call vertex delta is
always zero. That makes runs including `face` slightly slower and changes
triangle *ordering* (not content) versus a default run.


## Worked example: the AmazingHand `same_sense` bug

Pollen Robotics' `Right_Hand.step` — a 0.17 m Onshape AP242 export —
rendered as an exploded mess of half-metre spikes. With the defect
reintroduced, the whole diagnosis is one command:

```
$ node scripts/debug/model_report.mjs Right_Hand.step --quiet --top 4

# Right_Hand.step
  3.58 MB, loaded in 2134 ms, curve,loop,face,mesh

## curve
  2541 calls, 2541 measured, median 0.0522, p90 0.0950, threshold 0.4176 (8x median)
        0.7178  expressID=76 entity=ellipse points=24 trimmed=true
        0.7178  expressID=77 entity=ellipse points=24 trimmed=true
        0.7178  expressID=78 entity=ellipse points=24 trimmed=true
        0.7178  expressID=79 entity=ellipse points=24 trimmed=true
  ... 11 more above threshold

## loop
  1570 calls, 1570 measured, median 0.0502, p90 0.0950, threshold 0.4018 (8x median)
  point gaps: <1e-8 0, <1e-7 0, <1e-6 6, <1e-5 0, rest 49698
  wrap-duplicate loops: 1522, under 3 points: 48
        0.7178  points=95 minGap=0.0001 wrapDuplicate=true
  ... 19 more above threshold

## mesh
  29 calls, 29 measured, median 0.0218, p90 0.4623, threshold 0.1748 (8x median)
        0.7178  expressID=19722 entity=manifold_solid_brep vertices=1697 triangles=3320
  ... 4 more above threshold
```

Read it in this order:

1. **The dirt reaches the earliest stage.** `curve` is already dirty, so
   nothing downstream — tessellation, CSG, transforms — is the cause.
2. **The spread says it is a defect, not a big part.** Median 0.052, p90
   0.095, offenders at 0.718: the honest population is tight and the
   outliers sit 13× above p90. Compare a mesh stage where median 0.02 and
   p90 0.46 overlap the threshold — there, large parts are normal and the
   flags need corroborating.
3. **The columns name the mechanism.** Every offender is a trimmed conic
   (`entity=ellipse`/`circle`, `trimmed=true`, 24 points). Trimmed conics
   going long is the signature of walking the *complement* arc.
4. Open those express IDs in the file —

   ```
   $ node compiled/src/AP214E3_2010/ap214_command_line_main.js Right_Hand.step -e 76 -f expressID type
   |expressID|type|
   |---|---|
   |#76|ELLIPSE|
   ```

   — and the `EDGE_CURVE` referencing them has `same_sense = .F.`, which
   the extractor was ignoring, so it swept the arc the wrong way around a
   circle far larger than the part.

Fixed, the same command reports `no outliers` at every stage in ~1.5 s.

The historical value here is the contrast: this took about thirty minutes
of face-level then curve-level ad-hoc tracing, including two false "0
outliers" readings from probes attached to a seam the model did not take.


## Reading the numbers

- **The baseline is the median**, not the mean — a handful of runaway
  entities drags a mean up far enough to hide itself. `--factor` (default
  8) sets how far above the median counts as an outlier; `--limit` sets an
  absolute threshold instead, which is the right call when you already
  know the model's true size.
- **p90 is the calibration column.** If p90 sits near the threshold, the
  model legitimately has parts of mixed scale and the flags are weak
  evidence — raise `--factor`. If p90 hugs the median, anything flagged is
  real.
- **The `mesh` stage is the noisiest** for exactly that reason: an
  assembly with one large housing and forty small fasteners will flag the
  housing every time. It is still the only stage that can name the
  *product* a defect belongs to.
- **Reach for `displacement` when `mesh` floods.** `mesh` reads
  mesh-LOCAL coordinates, so on an export that writes geometry directly
  in site coordinates with identity placements — common for IFC
  `IfcFacetedBrep` — every honest part's "extent" is really its distance
  from the file origin. `Wiesenplatz 7, 4057 Basel.ifc` flagged 3,955
  meshes that way, of which 3 were real (conway#456). `displacement`
  places each mesh with its transform and scores how far it sits from
  where the model actually is, and names 5 of 37,502 on the same file.
  The tell that you want it: median and p90 both large, with flagged rows
  continuous above the threshold rather than separated from it.
- **They do not subsume each other.** `mesh` still catches a part that is
  internally huge but correctly placed; `displacement` scores that part
  as ordinary. Run both.
- **`wrap-duplicate loops` is usually not a finding.** Most exporters
  repeat the start point as the last point. It is reported because when
  combined with sub-micron gaps it identifies triangulation-failure
  candidates.
- **A `## conway diagnostics` section** appears when the load logged
  warnings or errors, counted by message. Error churn between two runs of
  the same model is itself a regression signal.


## Rules this tooling encodes

Four things cost real time on conway#444. Each has a countermeasure here;
they apply to any new instrumentation you write, not just to this script.

1. **A probe that never fires looks exactly like a clean model.** Every
   stage prints its `fired` count, `model_report.mjs` refuses to run at
   all if a seam it wraps has been renamed, and it exits 2 when a stage
   you named on `--stage` produced nothing. Before believing a null
   result from *any* new probe, run it against a case you know is
   non-zero.
2. **Never hold a `HEAPF32` view across extraction.** Wasm memory growth
   detaches the buffer and a held view silently reads zeroes — one of the
   two false negatives above. Read vertices through `getPoint()` and
   curve points through `get3d()`.
3. **Check `scripts/` before building tooling.** `render_glb.cjs` already
   existed and was rebuilt from scratch as a Playwright + three.js
   harness over about four iterations, for a worse result: the existing
   one needs no browser and is bit-deterministic across machines.
4. **Batch C++ edits per rebuild.** `yarn build-codex-MT` is ~90 s.
   Staging a set of hypotheses and evaluating them in one build beats a
   rebuild per edit, and the TypeScript-only path (`yarn
   build-incremental`) is far cheaper when the change is above the wasm
   boundary.

A fifth is worth stating even though this script can't enforce it: when
verifying a fix, re-run the *whole* corpus subset, not just the model that
motivated it. The finer curve sampling that fixed the hand pushed a
cylinder unwrap into a different CDT path and produced a metre-long
sliver on an unrelated model, caught only because the regression smoke
subset was re-run.
