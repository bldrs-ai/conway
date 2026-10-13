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
| `bodies` | int\|null | SMLib/OCCT: solid/shell bodies returned. conway: placed instances that carry geometry |
| `faces` | int\|null | B-rep face count (SMLib/OCCT); null for conway |
| `triangles` | int\|null | tessellated triangle count over placed instances |
| `mesh_area_mm2` | number\|null | Σ triangle area over placed instances, mm² |
| `exact_area_mm2` | number\|null | exact surface area (SMLib `massProperties`, OCCT `BRepGProp.SurfaceProperties_s`), mm² |
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
  the transformed triangle, so non-uniform scale is handled. `bodies` counts
  the entries that have at least one triangle. `conway_instances` reports
  walked versus unique geometries, mirrored (det < 0) placements, and
  **coincident duplicates**: one item placed twice under the same transform.
  Duplicates stay in the totals, because the totals are what conway produced,
  and their area is given so a reader can subtract it.
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
  body's diagonal. It is the closest single absolute figure, and an upper
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
