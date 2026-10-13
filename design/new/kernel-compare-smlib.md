# conway vs SMLib (vs OCCT) — side-by-side test plan

Status: **plan, not yet run.** Written 2026-10-13, the day NVIDIA's SMLib
landed as open source and AWV Informatik shipped `smlibpy` /
`@classcad/smlibwasm` on top of it. The results section at the bottom is
empty on purpose; fill it in from the harness, don't paraphrase.

## Why this doc exists

SMLib is now an Apache-2.0 NURBS B-rep kernel
([NVIDIA-Omniverse/usd-brep](https://github.com/NVIDIA-Omniverse/usd-brep)),
with an MIT TypeScript/WASM wrapper (`@classcad/smlibwasm`, ~1.8 MB brotli)
and a Python one (`smlibpy`). The launch pitch compares it with OCCT
on **authoring** — G2/G3 curvature-continuous blends where OCCT only has
G1 rolling-ball fillets. That is a modeling operation; conway does not
author, so it does not compare directly.

What *does* overlap with conway is **reading STEP**: SMLib reads AP203 /
AP214 / AP242 B-rep data and tessellates it, and it is now a free,
in-process JS kernel anyone can drop into a browser viewer. So the
questions worth answering with numbers are:

1. **Scale** — at what file size does SMLib's STEP path stop working,
   and does conway keep going past it? (Our moat claim, tested against
   a new entrant instead of asserted.)
2. **Fidelity** — on models both can open, how close are conway's
   tessellated area / bbox / body count to SMLib's exact values, and to
   OCCT's? Where conway is off, is SMLib right?
3. **Blends** — do SMLib-authored G2/G3 blends survive the round trip
   into conway at the same fidelity as circular fillets?
4. **Cost** — wall time and peak memory, same runtime (Node), same file.
5. **Oracle** — can SMLib replace (or join) the OCCT ground truth
   currently borrowed from bldrs-ai/Create's proof pipeline
   ([`step-support.md`](step-support.md) §"Measuring against OCCT ground
   truth")? It is in-process JS, Apache/MIT, and integrates surfaces
   exactly instead of summing triangles.

IFC is out of scope: neither SMLib nor OCCT reads it.

## What we know before running anything

From reading `awv-informatik/smlibpy` at `0aaa37f` (v0.2.3):

- **The STEP reader is not in the C++ kernel.** It is a hand-written
  parser in the wrapper — `src/smlibpy/step_reader.py` (~1,000 lines)
  and its port `js/src/step_reader.ts` (~1,400 lines). Both decode the
  **whole file into one string** and scan it with regexes into an
  in-memory entity dictionary, then build kernel bodies. No streaming,
  no paging, no partial results.
- `fromStep(data)` / `import_step(path)` return a body or a list of
  bodies, in **millimetres**, with **assembly placements applied**,
  names and colours kept. There is no product tree / occurrence-path
  equivalent of conway's `PlacedGeometry.occurrencePath`.
- `heal=true` by default: bodies that come out invalid are repaired.
  This can make SMLib look better than conway on broken files for
  reasons unrelated to reading. Run both settings.
- Documented gaps: wireframe topology (`EDGE_BASED_WIREFRAME_MODEL`),
  external references, PMI, and **assembly placements that mirror a
  part** are not read.
- Their importer is checked against OpenCASCADE on 400+ files (NX,
  CATIA, Creo, SolidWorks, Inventor, Onshape, FreeCAD, KiCad, CAx-IF).
  None of that says anything about large files.
- The STEP *writer* emits blends as `B_SPLINE_SURFACE_WITH_KNOTS` /
  `RATIONAL_B_SPLINE_SURFACE` (plus the analytic surfaces), so an
  SMLib G2 blend reaches conway through its ordinary B-spline path.
- Measurements available: `Part.massProperties(density, accuracy)`
  (exact surface/volume integration, ~7 digits by default), `bbox`,
  `isValid`, `faces()`, tessellation via `mesh(tolerance, angle)` /
  `toGlb`. The renderer has zebra stripes and curvature maps over the
  exact surfaces — useful for the blend test.

## Predictions (write down, then grade)

| # | Prediction | Falsified if |
|---|---|---|
| P1 | SMLib-JS cannot open any STEP file whose text exceeds V8's maximum string length (~512 MiB): it fails before parsing starts. conway opens the same files. | smlibwasm opens a > 512 MiB file, or conway fails on one smlibwasm opens |
| P2 | Below that wall, SMLib-JS's peak memory grows to a large multiple of file size (string + regex-built entity dict + kernel bodies), and it hits the Node heap limit well before 512 MiB. Conway's peak/file ratio is lower on every file > 50 MB. | SMLib peak/file ≤ conway's on any > 50 MB file |
| P3 | On T0/T1, SMLib exact area is within 0.1% of OCCT. Conway tessellated area is within 1% of both, **except** the known conway gaps (e.g. `box-fillet-r8` at 79.3% from dropped ⅛-sphere corner blends). | Conway within 1% on `box-fillet-r8` (gap fixed), or SMLib > 0.1% off OCCT on a healthy solid |
| P4 | SMLib-authored G2/G3 blends read through conway within 1% area of SMLib's exact value, the same as their circular-fillet twins. | G2/G3 fixtures read worse than their circular twins |
| P5 | Body counts disagree on assemblies with mirrored placements (SMLib drops them) and on wireframe-only content; otherwise they match. | Count mismatch with no mirror / wireframe explanation |
| P6 | No confident prediction on small-file wall time. | — |

## Arms

All arms run one model per process, with the same timeout and the same
`--max-old-space-size` for the two Node arms.

| Arm | What | Runtime | Measures |
|---|---|---|---|
| **conway** | `ConwayModelLoader` → scene walk (same path as `scripts/debug/model_report.mjs`) | Node, NodeMT wasm (also run once single-thread for a like-for-like with smlibwasm) | status, parse ms, geometry ms, peak RSS, placed-instance count, triangle count, Σ triangle area, bbox extents |
| **smlib-js** | `@classcad/smlibwasm` `fromStep` → `massProperties` + `mesh` | Node | status, read ms, peak RSS, body count, face count, exact area, exact volume (closed bodies), bbox extents, mesh triangle count and area at a matched tolerance, `isValid` per body |
| **smlib-py** *(optional)* | `smlibpy.import_step` | CPython | same as smlib-js; only to check the JS port isn't the bottleneck |
| **occt** | T0: Create's proof pipeline reference numbers. T1+: `cadquery-ocp` `STEPControl_Reader` + `BRepGProp` *(optional)* | CPython | status, read ms, peak RSS, area, volume, bbox |

Peak memory: `process.resourceUsage().maxRSS` at exit for Node,
`resource.getrusage` for Python. Also record conway's own
`stats_memoryUsed` equivalent so the number lines up with what Share
reports to GA.

## Comparison rules (easy to get wrong)

- **Compare bbox extents, not positions.** conway recentres
  (`COORDINATE_TO_ORIGIN`; see [`coordination-frame.md`](coordination-frame.md)),
  SMLib doesn't. Extents also absorb origin-only differences.
- **Units.** SMLib is always mm. Normalise conway's output to mm before
  comparing.
- **Instances, not definitions.** SMLib applies placements, so a part
  used 8 times is 8 bodies. Sum conway over placed instances, not over
  unique geometry.
- **Area is the primary fidelity signal; volume is secondary.** Conway's
  welder drops zero-area triangles and open shells are common, so
  volume is only meaningful where both sides report a closed, valid
  body. An empty conway dump hashes to `da39a3ee…` and can still pass
  a triangle-count probe (see `step-support.md`).
- **Tessellation tolerance.** When comparing mesh-to-mesh (triangle
  counts, mesh area), set SMLib's `tolerance` to conway's effective
  chord tolerance for that model, or the comparison is measuring two
  quality settings, not two readers. Exact area is tolerance-free.
- **heal.** Report SMLib with `heal=true` and `heal=false`. Headline
  numbers use `heal=false`, which matches conway's no-repair behaviour.
- **Failure taxonomy.** `ok` / `error` (message) / `timeout` / `oom`
  (Node heap or `RangeError: Invalid string length`) / `crash`. An
  `ok` with 0 bodies is reported as `empty`, not `ok`.

## Corpus

| Tier | Contents | Purpose |
|---|---|---|
| **T0 synthetic** | Create's proof catalogue (`box-fillet-r8` etc.) plus a new **blend family** authored with smlibpy: the same base solid (box, L-bracket, boss-on-plate) with edges rounded `continuity=None` / `"G1"` / `"G2"` / `"G3"`, constant and variable radius, at 2 radii. Check the generator script in next to the harness; the STEP outputs go to test-models, not this repo. | P3, P4; exact references on both sides |
| **T1 smoke** | The STEP entries in `regression/smoke_models.txt` (`nist_ctc_01_asme1_rd.stp`, `nist_ctc_02_asme1_rc.stp`, `create-a-tube.step`, `supercap.step`, `driver board.step`, `Right_Hand.step`) | Fast fidelity across exporters |
| **T2 RC** | The STEP files excluded from smoke as slow (SKYLARK, Snowdon, Arty_Z7, Jetenginestep, DSA2, nist_ftc_08…) and the rest of the public STEP corpus | Cost on real assemblies; P5 |
| **T3 scale ladder** | Private large STEP files, sorted by size, with at least one file in each band: < 50 MB, 50–200, 200–500, **500–600 (straddling the string limit)**, > 600 MB, and the largest we have | P1, P2. Private corpus never leaves the machine; results table records size band, not filename |

Run T3 in ascending size order and stop each SMLib arm after its first
two consecutive failures, so a known wall doesn't cost an hour of
timeouts.

## Blend test (P4) in more detail

For each T0 blend fixture:

1. smlibpy writes `<name>_<continuity>.step` and records exact area,
   volume, face count, and a zebra render (`render(zebra=True)`).
2. conway reads the STEP; record Σ area, bbox, triangle count, and a GLB.
3. `scripts/render_glb.cjs --pair` against smlibwasm's `toGlb` of the
   same body, one camera on the union bounds.
4. Pass: conway area within 1% and visually indistinguishable at the
   pair render. G2/G3 must not do worse than the circular twin.

Zebra continuity in Share is a follow-up, not part of this pass:
`render_glb.cjs` has no zebra mode, and whether highlight lines stay
smooth in Share is a normals-interpolation question (renderer), not a
reading one.

## Harness

Proposed layout — on-demand tooling, not CI:

```
scripts/kernel_compare/
  README.md            how to run, pinned versions
  conway_measure.mjs   one model → one JSON row (imports from compiled/)
  smlib_measure.mjs    one model → one JSON row (@classcad/smlibwasm)
  smlib_measure.py     optional Python arm
  occt_measure.py      optional OCCT arm (cadquery-ocp)
  gen_blends.py        T0 blend family generator (smlibpy)
  run.mjs              corpus walk, one process per (model, arm), timeout, ascending size
  join.mjs             rows → compare.csv + summary.md (ratios, failure table)
```

- `@classcad/smlibwasm` goes in `devDependencies`, pinned (0.2.3 at time
  of writing). MIT wrapper + Apache-2.0 kernel are compatible with
  conway's AGPL-3.0, and it never reaches the published bundle.
- Output goes **outside** `regression/`, like `--perf` output, so the
  regression git-diff step never sees machine-specific timings.
- Record conway commit, smlibwasm version, Node version, machine, and
  thread mode in every CSV header.

## How to read the outcome

| If… | Then… |
|---|---|
| P1/P2 hold | We have a measured, citable version of "opens what others can't", against the newest open kernel, not just OCCT. That goes in the positioning docs with the size bands. |
| P1 fails (SMLib opens > 512 MiB) | Find out how before anything else — that changes the competitive picture for in-browser STEP. |
| P3: SMLib and OCCT agree and conway is off | Each disagreement is a conway bug with a free, exact reference. File it with the ratio. |
| P3: SMLib and OCCT disagree | Neither is ground truth on that model; note it, don't file against conway. |
| SMLib-js tracks OCCT within 0.1% across T0/T1 | Propose replacing the Create-proof OCCT dependency in the regression area signal with in-process SMLib (closes the "no checked-in reference file" gap in `step-support.md`). Separate PR. |
| P4 fails | conway's B-spline face path has a blend-specific defect; route through `face_health.mjs` / `seam_census.mjs`. |

What this does **not** settle: whether Create should author on SMLib
instead of replicad/OCCT. That is a separate spike (blend quality,
boolean robustness, WASM size in-browser); the T0 blend family is
reusable input for it.

## Results

_Empty. Fill from `summary.md`._

| Tier | Models | conway ok | smlib-js ok | Median area ratio conway/SMLib | Median peak RSS ratio conway/SMLib | Notes |
|---|---|---|---|---|---|---|
| T0 | | | | | | |
| T1 | | | | | | |
| T2 | | | | | | |
| T3 | | | | | | |
