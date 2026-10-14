# kernel_compare — conway vs SMLib vs OCCT

On-demand harness for the plan in
[design/new/kernel-compare-smlib.md](../../design/new/kernel-compare-smlib.md).
Not CI. Output goes outside `regression/` (default `../kernel-compare-out/`).

## Pinned versions

| Arm | Package | Version |
|---|---|---|
| smlib-js | `@classcad/smlibwasm` (devDependency) | 0.2.3 |
| smlib-py | `smlibpy` (pip, own venv) | 0.2.3 |
| occt | `cadquery-ocp` (pip, own venv) | 8.0.1.1.0 |

Python arms run from a venv outside the repo:

```
python3 -m venv ~/kc-venv
~/kc-venv/bin/pip install smlibpy==0.2.3 cadquery-ocp==8.0.1.1.0
```

## Row contract

Every `*_measure.*` script takes **one model path** and prints **exactly one
JSON object on the last line of stdout** (anything earlier on stdout, and all
of stderr, is log). One model per process, so peak RSS is that model's.

```
node scripts/kernel_compare/<arm>_measure.mjs <model.step> [--heal true|false] [--threads mt|st]
~/kc-venv/bin/python -I scripts/kernel_compare/<arm>_measure.py <model.step> [--heal true|false]
```

Fields (null when the arm cannot measure it — never 0 as a stand-in):

| Field | Type | Meaning |
|---|---|---|
| `arm` | string | `conway` / `smlib-js` / `smlib-py` / `occt` |
| `variant` | string | arm-specific setting, e.g. `mt`, `st`, `heal=false`, `heal=true` |
| `model` | string | path as given |
| `size_bytes` | int | file size |
| `status` | string | `ok` / `empty` / `error` / `timeout` / `oom` / `crash` (taxonomy below) |
| `error` | string\|null | first line of the error message |
| `read_ms` | number | file read + parse (+ B-rep build for SMLib/OCCT) |
| `geometry_ms` | number\|null | tessellation / geometry extraction (conway: geometry phase; SMLib: `mesh`; OCCT: `BRepMesh`) |
| `measure_ms` | number\|null | exact mass-property integration time (SMLib/OCCT) |
| `total_ms` | number | wall time from process start of measurement to row emit |
| `peak_rss_bytes` | int | `process.resourceUsage().maxRSS * 1024` (Node) / `ru_maxrss * 1024` (Python, Linux) |
| `bodies` | int\|null | SMLib/OCCT: solid/shell bodies returned. conway: placements of solid/shell items (`manifold_solid_brep`, `brep_with_voids`, `faceted_brep`, `shell_based_surface_model`, `tessellated_solid`/`_shell`, `boolean_result`, extruded solids), whether or not they produced triangles. Per-face styled meshes are not bodies (`conway_instances.styled_face_meshes`) |
| `faces` | int\|null | B-rep face count (SMLib/OCCT); null for conway |
| `triangles` | int\|null | tessellated triangle count over placed instances |
| `mesh_area_mm2` | number\|null | Σ triangle area over placed instances, mm² |
| `exact_area_mm2` | number\|null | exact surface area (SMLib `massProperties`, OCCT `BRepGProp.SurfaceProperties_s`), mm² |
| `exact_area_unstable` | bool\|null | OCCT only (extra field): `true` when OCCT's own mesh area exceeds its exact area by more than 5e-4 relative, which an inscribed mesh should not do, so `exact_area_mm2` is not trustworthy and comparisons against it should exclude the row (`compare.csv` column `occt_exact_area_unstable`). `false` when checked and fine, null when there is no mesh to compare |
| `exact_volume_mm3` | number\|null | exact volume summed over bodies that are closed **and** valid; null if none |
| `closed_valid_bodies` | int\|null | how many bodies contributed to `exact_volume_mm3` |
| `invalid_bodies` | int\|null | bodies failing `isValid` / `BRepCheck_Analyzer` |
| `bbox_extent_mm` | [dx,dy,dz]\|null | axis-aligned extents in mm of the placed union (extents, never positions) |
| `mesh_tolerance_mm` | number\|null | chord tolerance used for the mesh numbers |
| `versions` | object | `{conway: <git sha>, smlibwasm: ..., node: ..., python: ..., ocp: ...}` as applicable |
| `notes` | string[] | anything a reader must know to interpret the row (units scale applied, bodies skipped, heal repairs, ...) |

### Failure taxonomy

- `ok` — loaded and produced ≥ 1 body / placed instance with geometry.
- `empty` — loaded without error but 0 bodies / 0 triangles. Never report this as `ok`.
- `error` — a thrown error that is not memory-shaped; `error` holds the message.
- `oom` — Node heap OOM, `RangeError: Invalid string length`, wasm `memory access out of bounds` / allocation failure, Python `MemoryError`.
- `timeout` — killed by the runner (`run.mjs`); the measure script never emits this itself.
- `crash` — process died without emitting a row and stderr is not memory-shaped (runner classifies).

A measure script catches what it can and still emits a row. `run.mjs`
synthesises the row (with `peak_rss_bytes: null`) when the child dies
without one.

## Units

Everything in the row is millimetres. A conway or OCCT model in metres is
scaled before the row is written, and the scale applied goes in `notes`.

## Running

```
# whole ladder, default arms (conway:mt, conway:st, smlib-js:heal=false/true, occt)
node scripts/kernel_compare/run.mjs --out ~/kernel-compare-out
# a subset
node scripts/kernel_compare/run.mjs --tiers T1,T2 --arms conway:mt,smlib-js:heal=false
node scripts/kernel_compare/run.mjs --dry-run            # print the plan only
node scripts/kernel_compare/join.mjs --out ~/kernel-compare-out   # -> compare.csv, summary.md
```

`run.mjs` runs one process per (model, arm/variant), strictly one at a time,
ascending size within a tier, and appends one row per run (plus `tier`,
`band` for T3, `run_id`) to `<out>/rows.jsonl`. It is resumable: re-running
the same command skips every (model, arm, variant) already present with a
status other than `crash`; `--force` re-runs them (`join.mjs` keeps the last
row per key). `<out>/run_header.json` records the conway commit, smlibwasm
version, node/python versions, CPU, memory, thread modes and every invocation.

Useful flags: `--timeout <s>` (default 1800; the process group is killed),
`--max-old-space <MB>` (default 8192, the same for **both** Node arms),
`--tolerance <mm>` (passed to every arm), `--python <path>` (default
`~/kc-venv/bin/python`, run with `-I`), `--public` / `--private` corpus roots,
`--only <substring>`, `--arms smlib-py:heal=false` to add the optional Python
arm. `/usr/bin/time -v` is used when present so a crashed child still has a
max RSS; if it is absent those rows have `peak_rss_bytes: null`.

Tiers (sizes in MiB; 50 MiB is the T2/T3 boundary):

| Tier | Files |
|---|---|
| T0 | `<out>/t0_blends/manifest.json` entries with `writer_ok: true` (skipped, with a message, if the manifest is absent) |
| T1 | STEP entries of `regression/smoke_models.txt`, resolved by basename under the public corpus (unresolved entry = error) |
| T2 | every other `.step`/`.stp` below 50 MiB in the public + private corpora |
| T3 | every STEP file of 50 MiB or more in the corpora (T1 excluded) plus every STEP file in `<out>/t3_synthetic/` |

Synthesised rows: `timeout` when the timer fired and no row was printed;
`oom` on a heap-OOM / `Invalid string length` / `Cannot allocate` /
`MemoryError` stderr, or on SIGKILL with no timer (probably the kernel OOM
killer, noted in the row); `crash` otherwise. If a child printed its row and
then hung on exit (a never-terminated pthread pool), the row is kept and a
note records that the runner killed the process. `skipped` rows (not a
failure) are written for Git LFS pointer stubs and for the T3 band rule.

T3 band rule (bands < 50, 50-200, 200-500, 500-600, > 600 MiB; 600 MiB
exactly is still 500-600): every arm runs the smallest file of every band.
Within a band an arm skips the remaining files only after
`RangeError: Invalid string length`, or an `oom` on a file whose next-smaller
neighbour in the same band and arm was also `oom`. The state is per
(arm/variant, band), so `conway:mt` and `conway:st` are tracked separately,
and it is rebuilt from `rows.jsonl` on resume.

`summary.md` labels anything from the private corpus root or `t3_synthetic`
as `T<tier>-<band>#<n>` (n = rank by size among such files in that tier and
band) and scrubs their paths and basenames from error text, so it can be
pasted into `design/new/kernel-compare-smlib.md`. `compare.csv` keeps full
paths and must stay outside the repo.

## Synthetic scale ladder

The real corpora stop at 282 MB, so T3's 500–600 MiB and > 600 MiB bands
come from `gen_scale.mjs`: one source part replicated as K distinct product
occurrences under one assembly root, written in 8 MiB chunks (never one JS
string).

```
node scripts/kernel_compare/gen_scale.mjs --source <part.step> --out <file.step> \
    (--copies K | --target-bytes N|max-string [--fit nearest|at-most|above]) [--spacing sx,sy] [--plan]
```

- **Structure.** Copy *i* is the source's whole DATA section with every id
  shifted by *i* × (largest source id) and the top PRODUCT's id/name
  suffixed `_<i+1>`, so each copy has its own PRODUCT, PRODUCT_DEFINITION,
  shape representation and B-rep entities. The root links each copy the way
  CAx-IF / OCCT exporters do (`nist/as1-oc-214.stp`): NAUO → PDS
  ('Placement') → CONTEXT_DEPENDENT_SHAPE_REPRESENTATION → (RR(child, root)
  RRWT SRR) → ITEM_DEFINED_TRANSFORMATION(child's own axis placement,
  grid placement). An assembly, not K root products, because K unplaced
  roots all land at the origin, and real files this size are assemblies.
- **Grid.** ⌈√K⌉ columns in XY, pitch = 1.25 × the extent of every 3D
  `CARTESIAN_POINT` in the source (2 significant digits, source units).
  The union extent is ((cols−1)·sx + ex, (rows−1)·sy + ey, ez).
- **Size.** Planned exactly before writing (and checked against the bytes
  written). `--target-bytes max-string` is this Node's
  `buffer.constants.MAX_STRING_LENGTH` (536,870,888 on Node 22 = 2²⁹−24);
  `--fit at-most` / `above` put the file on either side of it. Output is
  LF-only and byte-reproducible (fixed FILE_NAME timestamp).
- **The string wall.** smlibwasm 0.2.3's `_text()` decodes the bytes as
  Latin-1 by `text += String.fromCharCode(...)`, so its string length is
  the **byte** count, whatever the encoding; the wall throws
  `RangeError: Invalid string length`. (`Buffer.toString()` /
  `TextDecoder` throw `ERR_STRING_TOO_LONG: Cannot create a string longer
  than 0x1fffffe8 characters` instead.) Keep the source pure ASCII anyway:
  the generator warns when it is not.
- **Separate wall.** `fs.readFileSync` refuses files ≥ 2 GiB
  (`ERR_FS_FILE_TOO_LARGE`) in both Node arms. Above that, a failure is
  not P1.

The ladder as generated (source `nist_ctc_01_asme1_rd.stp`, read by all
three arms; output in `../kernel-compare-out/t3_synthetic/`):

```
S="…/AP203 geometry only/nist_ctc_01_asme1_rd.stp"; O=…/t3_synthetic
node scripts/kernel_compare/gen_scale.mjs --source "$S" --target-bytes max-string --fit at-most --out $O/ctc01_strlim_below.stp
node scripts/kernel_compare/gen_scale.mjs --source "$S" --target-bytes max-string --fit above   --out $O/ctc01_strlim_above.stp
node scripts/kernel_compare/gen_scale.mjs --source "$S" --target-bytes 734003200  --out $O/ctc01_700mib.stp
node scripts/kernel_compare/gen_scale.mjs --source "$S" --target-bytes 1181116006 --out $O/ctc01_1100mib.stp
```

## conway arm

`conway_measure.mjs` loads through `ConwayModelLoader.loadModelWithScene`
(as `scripts/debug/model_report.mjs` does) and walks the scene. It needs a
built `compiled/` and a fresh `Dist/` for the variant it runs (checked through
`scripts/wasmProvenance.cjs`, and a stale build gives an `error` row with exit
3; set `CONWAY_ALLOW_STALE_WASM=1` to measure an old engine on purpose).

- **`--threads`.** `mt` loads `ConwayGeomWasmNodeMT`. `st` sets
  `FORCE_SINGLE_THREAD=true`, which `pThreadsAllowed()` in
  `dependencies/conway-geom/interface/conway_geometry.ts` reads at the first
  `initialize()`, so the Node single-thread glue is loaded instead. The row's
  `conway_wasm` records the glue conway-geom loaded (`wasmType`), whether the
  heap is a `SharedArrayBuffer`, and the process's OS thread count. A mismatch
  with the flag is an `error` row.
- **Timing.** `read_ms` is the file read plus the parser's `parseHeader` and
  `parseDataToModel`. `geometry_ms` is `extractAP214GeometryData`, the same
  call the loader times for its own statistics. `conway_phases` splits these
  out and adds `load_other_ms` (wasm init and the loader's bookkeeping) and
  `walk_ms` (this script's measurement walk).
- **Placed instances.** Every walk entry is one placement of one
  representation item. Triangles, area and bounds are summed per entry, with
  the entry's absolute transform applied to each vertex. Area is the area of
  the transformed triangle, so non-uniform scale is handled.
- **`bodies`.** The walk entries whose item (`model.getElementByLocalID(mesh.localID)`,
  named by `ap214TypeName`) is a solid or shell: `MANIFOLD_SOLID_BREP`,
  `BREP_WITH_VOIDS`, `FACETED_BREP`, `SHELL_BASED_SURFACE_MODEL`,
  `TESSELLATED_SOLID`, `TESSELLATED_SHELL`, `BOOLEAN_RESULT`,
  `BOOLEAN_CLIPPING_RESULT`, `EXTRUDED_AREA_SOLID`, `EXTRUDED_FACE_SOLID`, one per
  placement, **whether or not the item produced triangles** (a solid whose faces
  all carry their own STYLED_ITEM has none: `nist_ctc_01_asme1_ap242-e1` is 1 body, 117
  face meshes). A face with its own STYLED_ITEM becomes a separate placed mesh, and is
  counted in `conway_instances.styled_face_meshes` (`ADVANCED_FACE`, `FACE_SURFACE`,
  `FACE`, `COMPLEX_TRIANGULATED_FACE`, `TRIANGULATED_FACE`), not in `bodies`. Any other
  item type is `other_items`, listed by keyword in `other_item_types` (so an unlisted
  solid type shows up there rather than silently missing from `bodies`). `triangles`,
  `mesh_area_mm2` and the bbox cover all three kinds.
- **`conway_instances`** reports walked versus unique geometries, mirrored
  (det < 0) placements, `styled_face_meshes`, `other_items`, and the
  **coincident placements**: one item placed twice under the same transform.
  They stay in the totals, because the totals are what conway produced, and their
  area is given so a reader can subtract it. The owner element (walk entry
  [4]) and occurrence path (entry [5], from `walkWithOccurrence()`) split them:
  - `coincident_occurrences` (+ `_area_mm2`): same owner, different occurrence
    path. Two assembly occurrences of one part at one place. **Model content**:
    OCCT and SMLib count it too. Do not subtract it.
  - `coincident_reemissions` (+ `_area_mm2`): a different owner, or the same
    owner and path again. One item placed through two representations
    (conway#731, #733). **The defect**; subtract this area for a per-copy ratio.
  - `coincident_duplicates` / `coincident_duplicate_area_mm2`: the sum of the two,
    kept for the first-pass rows (which called all of it a defect).
  - `nonfinite_vertices`, `nonfinite_triangles_skipped`: see below.
- **Non-finite vertices.** A native vertex with a NaN/Inf coordinate is left out of
  the reification centre, and any triangle touching one (its cross product is
  non-finite) is skipped, so it adds to no total. The rest of the geometry is kept.
  `nonfinite_vertices` is counted once per unique geometry, `nonfinite_triangles_skipped`
  per placement; both are 0 on most models, and a note is written when either is not.
  A geometry whose vertices are *all* non-finite is still `unreadable`.
- **Triangles are the reified mesh**, the welded mesh with zero-area
  triangles removed that consumers render. There is no per-triangle
  accessor, so the index and float vertex streams are copied out of fresh
  `wasmHeapView`s after extraction. No view is held across a wasm call. Each
  geometry is reified about its own bbox centre, and that centre is added
  back in double, so float32 costs no precision far from the origin.
- **Units.** conway's AP214 world space is metres. Each walk root carries a
  metres-per-file-unit scale (conway#458), so lengths are ×1000 and areas
  ×10⁶. `notes` lists the root unit scales seen. It also flags roots that
  declare no length unit and placements with no transform: those stay in
  file units, so the ×1000 is a guess.
- **Tolerance.** `mesh_tolerance_mm` is always null, because conway has no
  absolute chord tolerance. Surfaces refine to 0.1% of each face's own bbox
  diagonal (floored at 1e-5 × its representation's extent). B-spline curves
  refine to 0.1% of their control-hull diagonal. Circle and ellipse edges
  take a fixed 24 samples per arc whatever its sweep, which is 23 chords:
  about 15.7° per chord on a full circle, a sag of 0.93% of the radius.
  `conway_tessellation.tolerance_upper_bound_mm` is 1e-3 × the median placed
  mesh's diagonal (every placement with triangles, face meshes included). It is the closest single absolute figure, and an upper
  bound on conway's per-face target. `--tolerance` is accepted, recorded in
  `notes` and has no effect.
- **Memory.** `peak_rss_bytes` follows the contract (end of process, so it
  includes the walk). `conway_memory` adds the loader's own statistics
  (`wasm_heap_peak_mb`, `geometry_memory_mb` and the `Memory Statistics`
  string the loader logs) and `load_peak_rss_bytes`, the high-water mark read
  between the load and the walk.
- **Failures.** A thrown error matching a memory pattern (`out of memory`,
  `Invalid string length`, `Array buffer allocation failed`, wasm
  `memory access out of bounds`, `Cannot enlarge memory`, `Aborted(OOM)`,
  `bad_alloc`) is `oom`. Any other thrown error is `error`. 0 triangles is
  `empty`. A V8 heap OOM kills the process before it can emit, so `run.mjs`
  classifies that one. The script calls `process.exit` after emitting,
  because the MT pthread pool is never terminated.

## SMLib arms

`smlib_measure.mjs` (smlib-js) and `smlib_measure.py` (smlib-py) take
`<model.step> [--heal true|false] [--tolerance <mm>] [--angle <deg>]`
(the `.mjs` also accepts and ignores `--threads`). Default is `--heal false`,
the plan's headline setting; SMLib's own default is `true`.

- **Entry point and the string wall.** JS passes the file to `fromStep` as an
  undecoded `Buffer` (the least-decoded form its `string | Uint8Array`
  signature takes). The library then decodes the whole file to one JS string
  itself (`_text()` in `dist/step_import.js`: `String.fromCharCode` in 32 KiB
  chunks appended with `+=`, then `.replace(/\r\n?/g, '\n')`), so a
  `RangeError: Invalid string length` in a row is the library's. Python's only
  file entry point is `import_step(path)`, which `open(..., encoding="latin-1").read()`s
  the whole file into one `str`; no bytes entry point exists, and Python has no
  512 MiB string cap.
- **Heal.** `{heal}` / `heal=` is honoured and only gates `part.heal()` on a closed
  body that fails the soundness check; seam insertion and orientation flipping run
  either way.
- **Counting.** `closed_valid_bodies` = `Part` (a closed solid by construction; open
  shells become `Shell`) and `isValid()`. `Shell` bodies add to area, not to volume
  or `invalid_bodies`. Exact numbers come from `massProperties()` at its default
  accuracy (1e-7); `measure_ms` covers `massProperties`, `isValid`, `bbox` and face
  counting.
- **Mesh.** One `mesh(tolerance, angle)` call per body (default tolerance is per
  body, `max(0.001 * body bbox diagonal, 1e-6)` mm, angle 15 deg);
  `mesh_tolerance_mm` is the largest used and the notes give the smallest. If any
  body fails to mesh, `triangles` and `mesh_area_mm2` are null (partial sums go
  in `notes`), as are `exact_area_mm2` on measurement failure.
- **Zero-body files.** `fromStep` / `import_step` throw "holds no B-rep solids or
  surfaces"; the scripts map that to `status: "empty"`.
- **Gap warnings.** Bodies whose faces leave gaps make SMLib warn that the volume is
  uncertain; the scripts collapse these to one note with the count and worst value.

## OCCT arm

```
~/kc-venv/bin/python -I scripts/kernel_compare/occt_measure.py <model.step> \
    [--tolerance <mm>] [--angle <deg>] [--gprop-eps <rel>] [--parallel] [--heal true|false]
```

`STEPControl_Reader` -> `TransferRoots` -> `OneShape()` (placements applied).
Facts verified against `cadquery-ocp` 8.0.1.1 (do not assume them for another build):

- **Units.** `xstep.cascade.unit` exists only after `STEPControl_Controller.Init_s()`
  (before that `CVal_s` is `""` and `SetCVal_s` returns `False`). The script inits,
  forces `MM`, and fails the row if it cannot verify it. `Right_Hand.step`
  (`SI_UNIT($,.METRE.)`) reads as 132 x 195 x 158 mm, so the conversion happens.
- **`bodies`** = solids + free shells (shells not inside any solid), each placed
  instance counted separately (`IsSame` = TShape + Location). Loose faces and
  wireframe are not bodies; loose faces are noted.
- **`bbox_extent_mm`** covers those same bodies (`BRepBndLib.AddOptimal_s`,
  `useTriangulation=False`, `useShapeTolerance=False`, gap asserted 0). That box is
  void when no face has a surface (tessellated-only STEP, e.g.
  `nist_ftc_08_asme1_ap242-e1-tg.stp`); then it is recomputed with
  `useTriangulation=True` from the reader's triangulation, and a note says so (the
  box is the reader's triangles, 311.59 x 222.69 x 48.26 there, matching conway).
  The bbox **excludes wireframe**: on `nist_ctc_01_asme1_rd.stp` it is 800x450x150, whereas the
  whole transferred shape (`bbox_extent_all_mm`, an extra non-contract field) is
  1170x650x150 because of `GEOMETRIC_CURVE_SET` content.
- **Closed check.** `BRep_Tool.IsClosed_s(solid)` returns `False` for *every* solid
  (including a fresh `BRepPrimAPI_MakeBox`); the first version of this script used it
  and reported `closed_valid_bodies: 0` on all six smoke models. Closed is now
  "every shell of the solid passes `BRep_Tool.IsClosed_s`" (True for the box shell,
  False for a sewn 5-face shell, which `BRepCheck_Analyzer` still calls *valid*).
  `invalid_bodies` was likewise checked to fire (a bow-tie face is invalid).
- **Exact area/volume** use the adaptive `GProp` overloads, `--gprop-eps` default
  `1e-6` (`0` = OCCT's fixed-order Gauss); the reached error is in `notes`.
  `BRepGProp`'s reported error is not reliable on every B-spline face
  (`Equiptment_UltrasoundProbe.step`: reports 6.9e-7, body total off by about 0.4 % against a fine mesh, and a
  tighter eps does not converge to the right value either). `exact_area_unstable`
  is `true` when the mesh area exceeds the exact area by more than 5e-4 relative
  (an inscribed mesh should not); the first-pass rows put every other OCCT model
  between 0.9983 and 1.0000809, this one at 1.00265. A flagged row also gets a note.
  `measure_ms` is that integration only; `BRepCheck_Analyzer` time is in `total_ms`.
- **Mesh.** Default chord tolerance is 0.1 % of the body bbox diagonal at 15 deg,
  the same defaults as smlibpy's `tessellate`; pass `--tolerance` to match conway.
  Serial by default (`--parallel` for `BRepMesh` threads). Triangle area applies each
  face's `TopLoc_Location` (Value() includes scale).
- **Timing.** Python-side `import OCP.*` (~0.7 s) is done before the clock starts and
  is in neither `read_ms` nor `total_ms`. The machine is shared, so `measure_ms` on the
  larger models varied up to ~2x between runs: treat timings as indicative.
- OCCT writes diagnostics (`*** ERR StepReaderData ...`) to C++ stdout, possibly after
  `main()` returns. fd 1 is redirected to stderr for the whole run and the row is
  written to the saved original fd, so the row really is the last stdout line.
- `--heal` is accepted and ignored (noted); there is no OCCT healing step.
- Also importable: `measure_file(path, do_mesh=False)` is what `gen_blends.py` uses.

## T0 blend family

```
~/kc-venv/bin/python -I scripts/kernel_compare/gen_blends.py [--out DIR] [--only SUBSTR] [--no-render]
                                                             [--tol-area 1e-4] [--tol-volume 1e-4]
```

Default `--out` is `/home/user/kernel-compare-out/t0_blends/`; the script refuses an
output directory inside the repo. About 70 s for all fixtures.

Fixtures: 3 bases x 2 radii x {circular, G1, G2, G3} x {constant, variable} = 48,
named `<base>_r<R>_<circ|g1|g2|g3>[_var].step`.

| Base | Shape | Radii (mm) | Constant: edges | Variable (R/2 -> R): edges |
|---|---|---|---|---|
| `box` | 80x60x40 | 4, 8 | all 12 | 4 parallel to Z |
| `lbracket` | 80x60x10 plate + 80x10x50 back wall | 2, 4 | all 18 (incl. concave inner edge) | 6 parallel to Z |
| `bossplate` | 80x60x10 plate + R15x20 boss | 2, 4 | all 14 (incl. both boss circles) | 4 plate corners |

smlibpy API (read from source, `Part.fillet(edges, radius, *, continuity=None, fullness=1.0)`):
`continuity` `None` = circular, `"G1"`/`"G2"`/`"G3"` = blend (`1`/`2`/`3` also accepted);
`radius` as `(start, end)` = linear variable radius along each edge. All four
continuities exist for constant and for variable radius.

Gaps found while choosing edge sets (not fixtures; all raise `KernelError ... radius may be too large`):

- variable radius on edges that meet at a vertex (all 12 box edges, or the 4 top edges);
- variable radius with start != end on a closed circular edge (seam jump), at any
  continuity; start == end works for circular, and for G2 only on the convex boss edge.

Writer isolation: each STEP is re-imported through smlibpy (`heal=False`, so repair cannot
mask a writer defect) and through OCCT (`occt_measure.measure_file`, no mesh). Checks:
bodies equal, **faces exact**, area and volume within **1e-4 relative** (flags to change),
body valid/closed. Failing fixtures get `writer_ok: false`, the reasons in `failures`,
and must be excluded from the conway comparison. Later steps compare conway with
`reimport_smlib` / `reimport_occt`, not `source`.

`manifest.json`: per fixture `{file, base, radius, radius_start, continuity, variable, edges,
smlibpy_call, source, reimport_smlib, reimport_occt, writer_ok, failures?, sha256, size_bytes,
deterministic_modulo_stamp, zebra}`; top level has versions, tolerances, `render_headless`,
`summary` and `authoring_gaps`. `continuity` is `circular|G1|G2|G3`.

Determinism: smlibpy's `write_step` stamps `datetime.now()` (seconds) into `FILE_NAME`,
and derives the product/solid names from the file name. With the same name, the stamp
is the only differing byte (verified by diff); the script rewrites it to
`1970-01-01T00:00:00`, after which every STEP, PNG and the manifest are byte-identical
across separate processes (sha256 compared).

Zebra PNGs (`render(zebra=True)`) work headless and land in `zebra/`.
