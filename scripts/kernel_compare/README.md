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
