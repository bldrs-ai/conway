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
