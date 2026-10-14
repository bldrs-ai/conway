# conway vs SMLib (vs OCCT) — side-by-side test plan

Status: **first full run done 2026-10-14** (harness in
[`scripts/kernel_compare/`](../../scripts/kernel_compare/README.md)).
Results, prediction grades and the defects it found are in
[§Results](#results) at the bottom. The plan above it is kept as
written, so the predictions can be read against what they were. Where
the run proved a pre-run statement wrong, the result section says so.
Written 2026-10-13, the day NVIDIA's SMLib landed as open source and
AWV Informatik shipped `smlibpy` / `@classcad/smlibwasm` on top of it.

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

Run T3 in ascending size order, and run **at least one file from every
size band** in every arm, whatever happened in the bands below it. A
failure in a small band can be content-specific (an unsupported
construct, a parse error, a timeout), and stopping on it would skip the
500–600 MiB and > 600 MiB bands that P1 is about, then misreport an
unrelated failure as a size wall. Within a band, an arm may skip that
band's remaining files only after a size-monotonic failure: `RangeError:
Invalid string length`, or a Node heap OOM on a file whose next-smaller
neighbour in the same arm also OOM'd.

## Blend test (P4) in more detail

For each T0 blend fixture:

1. smlibpy writes `<name>_<continuity>.step` and records exact area,
   volume, face count, and a zebra render (`render(zebra=True)`).
2. **Isolate the writer.** Re-import the emitted STEP through smlibpy
   (and OCCT, when that arm is set up) and check that area, volume and
   face count still match the source body. If they don't, the fixture
   is bad: an SMLib STEP-export defect, not a conway result. Record it
   and drop the fixture from the conway comparison. Every later step
   compares against the **re-imported** body, not the in-memory one.
3. conway reads the STEP; record Σ area, bbox, triangle count, and a GLB.
4. `scripts/render_glb.cjs --pair` against smlibwasm's `toGlb` of the
   re-imported body, one camera on the union bounds.
5. Pass: conway area within 1% and visually indistinguishable at the
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
| P4 fails on a fixture that passed the writer check | conway's B-spline face path has a blend-specific defect; route through `face_health.mjs` / `seam_census.mjs`. A fixture that failed the writer check says nothing about conway. |

What this does **not** settle: whether Create should author on SMLib
instead of replicad/OCCT. That is a separate spike (blend quality,
boolean robustness, WASM size in-browser); the T0 blend family is
reusable input for it.

## Results

First full run, 2026-10-13/14.

**Versions:**
- conway `2d6ff58` (NodeMT and single-thread Node, both built from that tree)
- `@classcad/smlibwasm` 0.2.3
- `cadquery-ocp` 8.0.1.1.0
- Node 22.22.0, CPython 3.13

**Machine:** a cloud container, 4 × Xeon @ 2.1 GHz, 15.7 GiB, cgroup memory cap about 13.7 GB.

**How the run was done:**
- One process per (model, arm), sequential, `--max-old-space-size=8192` for both Node arms.
- Two passes: the first pass, then a re-run of the conway and OCCT arms after the triage harness fixes (`2d6ff58`).
- The T3 rows that overlapped the triage runs were re-timed.

**Treat timings as indicative.** A shared VM is not a citable benchmark machine; re-run on a quiet, named machine before quoting a time. Peak RSS and every geometric number are deterministic.

Corpus as run:

| Tier | Contents |
|---|---|
| T0 | 48 smlibpy blend fixtures. All passed the writer check: re-import through smlibpy and OCCT agrees on area/volume to ≤ 1.3e-7, faces exact. |
| T1 | The 6 smoke STEP models |
| T2 | 55 public and private STEP files < 50 MiB |
| T3 | 3 real files (55, 106, 269 MiB) plus 7 synthetic assemblies from `gen_scale.mjs` (48 MiB to 1.1 GiB) |

There is no `box-fillet-r8`: Create's proof catalogue was not available to this run.

### Headline table

From `summary.md`. Headline arms are `conway:mt` vs `smlib-js:heal=false`. Medians are over models where both are `ok`.

| Tier | Models | conway ok | smlib-js ok | Median area ratio conway/SMLib | Median peak RSS ratio conway/SMLib | Notes |
|---|---|---|---|---|---|---|
| T0 | 48 | 48/48 | 48/48 | 1.0000 | 1.97 | conway's wasm/pthread start-up dominates tiny files |
| T1 | 6 | 6/6 | 6/6 | 1.0096 | 0.88 | ratio inflated by conway#731/#732/#735 |
| T2 | 55 | 53/55 | 51/55 | 1.0001 | 1.14 | 2 empty in all arms (no faces); SMLib: 1 tessellated-only empty, 1 whole-file error |
| T3 | 10 | 9/10 | 5/10 | 1.0002 | 0.45 | see the ladder below |

`heal=true` and `heal=false` gave identical area and body counts on every model. The `heal=false` headline costs SMLib nothing.

### Scale ladder (T3): P1, P2

Peak RSS (MiB) / peak-RSS-per-file-byte / status. "syn" marks a synthetic assembly: K renumbered copies of NIST ctc_01, the "K unique parts, no instancing" worst case.

| File | conway:mt | smlib-js | OCCT |
|---|---|---|---|
| 48 MiB syn | 736 / 15.4 / ok | 1,708 / 35.8 / ok | 1,239 / 26.0 / ok |
| 55 MiB real | 937 / 16.9 / ok | 1,680 / 30.3 / ok | 1,340 / 24.1 / ok |
| 106 MiB real | 963 / 9.1 / ok | 1,669 / 15.8 / ok | 1,081 / 10.2 / ok |
| 191 MiB syn | 2,279 / 12.0 / ok | 6,158 / 32.3 / ok | 3,878 / 20.3 / ok |
| 269 MiB real (private) | 1,958 / 7.3 / ok | 4,381 / 16.3 / ok | 2,049 / 7.6 / ok |
| 382 MiB syn | 4,956 / 13.0 / ok | 9,308 / — / **`std::bad_alloc`** | 7,443 / 19.5 / ok |
| 512.0 MiB syn, 14 KB under the string limit | 6,502 / 12.7 / ok | 11,191 / — / **`std::bad_alloc`** | 9,796 / 19.1 / ok |
| 512.3 MiB syn, 265 KB over | 6,512 / 12.7 / ok | — / **`RangeError: Invalid string length`** after 26 s | 9,802 / 19.1 / ok |
| 700 MiB syn | 8,879 / 12.7 / ok | — / **`RangeError`** after 26 s | 13,010 / 18.6 / ok |
| 1.1 GiB syn | **OOM-killed** at 13.4 GB | skipped (band rule) | **OOM-killed** at 13.6 GB |

**SMLib-JS has two walls, not one.**

1. **The string wall P1 predicted.**
   - The limit on Node 22 is 2²⁹−24 = 536,870,888 characters (`buffer.constants.MAX_STRING_LENGTH`).
   - `_text()` in smlibwasm's `dist/step_import.js` builds the whole file as one Latin-1 string, byte for byte, so the wall is on bytes regardless of encoding. `parse()` makes two more whole-file copies.
   - It fails before parsing starts.
2. **A 4 GiB kernel heap, which sits below the string wall.**
   - `smlibwasm.wasm` is wasm32 with a declared maximum of 65,536 pages.
   - With the instance's `WebAssembly.Memory` captured during import:
     - the 191 MiB file (756 bodies) succeeds with a 3,549 MiB heap;
     - the 382 MiB file fails at 4,095.9 MiB with cause `std::bad_alloc`.
   - SMLib surfaces this as `KernelError: … the file may hold faces the kernel cannot rebuild`: `kernelCall` attaches that hint to any kernel runtime error. It is a memory wall, not a geometry failure. Every copy is the same part, and that part rebuilds at 191 MiB.

**conway's wall is machine RAM.**
- On these synthetic files it peaks at about 12–13 bytes per file byte. That is in line with the 9.8× figure in [`load-performance-ledger.md`](load-performance-ledger.md); the synthetic content is mostly analytic B-rep with no instancing.
- So on a 16 GB machine it is cut off somewhere between 700 MiB and 1.1 GiB. OCCT is cut off at the same point. Real files sat lower: 7–17×.

Unlike SMLib's two walls, conway's moves with RAM. "Opens what others can't" has to be stated with that size band and that machine, not as unbounded.

### Fidelity (T0–T2): P3, P4

Per-copy conway area is conway's area minus the coincident re-emissions the harness identifies (conway#731, #733), divided by OCCT's exact area.

| Tier | conway within 1% of OCCT, raw | per-copy | median per-copy | SMLib within 1e-3 of OCCT |
|---|---|---|---|---|
| T0 | 48/48 | 48/48 | 0.99997 (worst 0.026%) | 48/48 (≤ 1.4e-8) |
| T1 | 4/6 | 4/6 | 1.0051 | 5/6 |
| T2 | 29/53 | 42/53 | 1.00001 | 38/51 (all 38 within 1.2e-4) |

**Every SMLib-vs-OCCT disagreement is attributed** (triage, with causal tests where marked):

| Count | Who is wrong | Cause |
|---|---|---|
| 10 NIST AP242 files | SMLib | Each saved view (`DRAUGHTING_MODEL` → `MAPPED_ITEM`) becomes a coincident copy of the part, 2–19×. Causal test on 2 files. |
| 1 (ctc_04_rd) | SMLib | Supplemental-geometry planes counted as bodies, +4.7% |
| 1 (Right_Hand) | SMLib | One solid rebuilt differently per placement, −19% on 2 of 4 instances |
| 1 (ctc_02_ap203) | SMLib | Two closed B-spline faces with no outer bound |
| 1 (an ultrasound probe part) | OCCT | `BRepGProp` unstable on one B-spline face. Now flagged as `exact_area_unstable`. |

The kernel's exact integration was never the problem: all five SMLib causes are in the STEP reader wrapper. A write-up for upstream (awv-informatik/smlibpy), with file:line references, has been drafted but not filed from here.

**Every remaining conway outlier is attributed except one:**

| Models | Cause | Issue |
|---|---|---|
| ~9 NIST models | solid re-emitted through SHAPE_ASPECT → PROPERTY_DEFINITION → SDR | [#731](https://github.com/bldrs-ai/conway/issues/731) |
| supercap ×3 | OVER_RIDING_STYLED_ITEM faces emitted standalone; folded tori | [#732](https://github.com/bldrs-ai/conway/issues/732) |
| 11 NIST AP242 | saved views re-emitted as part geometry | [#733](https://github.com/bldrs-ai/conway/issues/733) |
| stc_06 (0.345 per copy) | FACE_OUTER_BOUND on the inner loop | [#734](https://github.com/bldrs-ai/conway/issues/734) |
| ftc_06_rd, stc_06, Right_Hand | spherical faces on the complementary side | [#735](https://github.com/bldrs-ai/conway/issues/735) |
| ctc_01_e1, ctc_02 ×3, ftc_11_e2, one private | apex cones, folded tori, circle+B-spline cylinders, closed B-spline faces many times their area | [#736](https://github.com/bldrs-ai/conway/issues/736) |
| supercap, one private | BREP_WITH_VOIDS void shells never extracted | [#737](https://github.com/bldrs-ai/conway/issues/737) |
| ftc_08_tg (0.983) | SHAPE_ASPECT-only geometry not emitted for the tessellated twin, while the B-rep twin emits it via #731's route | not filed (low); bears on the scope of #731's fix |
| ultrasound probe (+2.3%) | **unexplained**: two B-spline faces about 2% high with intact boundaries | — |

**The tessellation floor, not a defect:**
- Circle and ellipse edges always get 24 samples (23 chords), so a planar face bounded by a full circle keeps 0.98761 of its area (−1.24%). That was measured exactly on several models.
- Cylinders lose about 0.19%.
- **conway has no chord tolerance to match.** It refines relative to each face's and curve's own size. The plan's "set SMLib's tolerance to conway's chord tolerance" rule cannot be applied. Mesh-to-mesh triangle counts are indicative only; mesh-to-exact area is the fidelity signal.

### Speed (P6)

Medians in ms, over models where all arms are `ok`:

| Tier | conway:st read | conway:st read+geometry | smlib-js read | smlib-js read+mesh | OCCT read | OCCT read+mesh | conway:st total | smlib-js total | OCCT total |
|---|---|---|---|---|---|---|---|---|---|
| T0 (48) | 10 | 95 | 116 | 168 | 56 | 70 | 973 | 288 | 304 |
| T1 (6) | 45 | 728 | 5,373 | 9,721 | 413 | 683 | 1,724 | 10,498 | 4,266 |
| T2 (51) | 39 | 327 | 1,130 | 1,803 | 211 | 363 | 1,222 | 2,075 | 931 |

- conway's `total` includes about 1 s of wasm start-up, which dominates tiny files.
- OCCT is native C++ through Python, so it is not a browser number. Don't set its speed beside the two wasm arms.
- SMLib's read (its JS regex parser plus B-rep build) is the slowest step on real files: about 3.5× (T2) to 7× (T1) conway's whole read + geometry.

### Prediction grades

| # | Grade | Why |
|---|---|---|
| P1 | **Holds** | Both over-limit files fail with `RangeError: Invalid string length` inside smlibwasm after 26 s, before parsing; conway opens both. conway fails at 1.1 GiB, but only from machine RAM, on a file SMLib also can't open. |
| P2 | **Holds, mechanism wrong** | SMLib's peak/file exceeds conway's on every file > 50 MB that either opened (1.7–2.7×). The early failure is **not** the Node heap, though: it is the 4 GiB wasm32 heap at 382 MiB. |
| P3 | **Partly falsified** | SMLib is > 0.1% off OCCT on a healthy solid (Right_Hand), from its reader. On T0 it holds to 1e-8. conway is within 1% on T0 and on 4/6 of T1. The T1 misses are new conway defects (#731, #732), not the predicted `box-fillet-r8` gap, which was not tested. |
| P4 | **Holds** | G2 and G3 are never worse than the circular twin (0/12 each), and all 48 are within 0.026%. G1 constant-radius is worse on 4/6 by at most 0.007 points. Area cannot see curvature continuity: zebra comparison in conway is not done. |
| P5 | **Falsified** | 17/51 body-count mismatches on T2, none from mirrors or wireframe (the corpus has no mirrored placement). Causes: SMLib saved views and supplemental planes, conway re-emissions. Also, SMLib does not "drop" a mirrored placement: `_buildBody` throws for the whole import (reading of source; untested). |
| P6 | — | See Speed. |

### Corrections to "What we know before running anything"

- **Mirrored placements** are an error for the whole import, not a silent drop. A mirrored `CARTESIAN_TRANSFORMATION_OPERATOR_3D` *is* probably skipped silently by the `MAPPED_ITEM` handler's `catch { continue }` (reading of source).
- **Measurements in smlibpy** have different names: `mass_properties`, `is_valid()`, `tessellate(tolerance, angle)`, `import_step` / `read_step`. The names in the plan are the JS API.
- **SMLib's default mesh tolerance** is per body: `max(0.001 × bbox diagonal, 1e-6)` mm at 15°.
- **SMLib also fails, besides the size walls:**
  - one unrebuildable body fails the whole file (1 private T2 model);
  - tessellated-only AP242 files read as empty.

### Oracle (question 5)

**Not as proposed.** SMLib's *kernel* matches OCCT to 1e-8 wherever its reader is right, and it is exact by construction on fixtures it authored. That makes the T0 blend family, with its smlibpy manifest values, a clean regression reference that needs no OCCT.

Its *STEP reader*, though, is wrong on 13 of 51 T2 models, mostly the NIST AP242 PMI set that is our best exporter coverage. Replacing the borrowed OCCT ground truth for read-from-STEP comparisons would import those errors. Keep OCCT as the reading reference, and use SMLib for authored fixtures.
