#!/usr/bin/env python3
"""smlib-py arm of the kernel-compare harness: one STEP file -> one JSON row.

    ~/kc-venv/bin/python -I scripts/kernel_compare/smlib_measure.py <model.step>
        [--heal true|false] [--tolerance <mm>] [--angle <deg>]

Row contract: scripts/kernel_compare/README.md.  The row is the LAST line of stdout.

smlibpy's only STEP entry point that reads a file is ``import_step(path)``, which
opens the path itself in text mode (``encoding="latin-1"``) and ``read()``s the whole
file into one ``str`` (smlibpy/step_import.py ``import_step``).  There is no
bytes/string entry point, so this arm cannot hand over less-decoded data; the
whole-file decode is the library's.  Python has no 512 MiB string wall, so the limit
here is RAM, not an API ceiling.

Heal: ``import_step(path, heal=...)`` is honoured.  This script's default is
heal=False (the plan's headline setting); smlibpy's own default is heal=True.

Run with ``-I`` (isolated): the venv's site-packages still resolve, the script's
own directory does not go on sys.path.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import resource
import sys
import time
import warnings

T0 = time.perf_counter()
ARM = "smlib-py"

OOM_RE = re.compile(
    r"bad_alloc|Cannot allocate memory|out of memory|MemoryError|allocation failed|Failed to allocate|\bOOM\b",
    re.I,
)


def classify(e: BaseException) -> str:
    if isinstance(e, MemoryError) or OOM_RE.search(f"{type(e).__name__}: {e}"):
        return "oom"
    return "error"


def first_line(e: BaseException) -> str:
    msg = f"{type(e).__name__}: {e}"
    return msg.split("\n")[0][:500]


def rnd(v, d=3):
    if v is None:
        return None
    v = float(v)
    return round(v, d) if v == v and abs(v) != float("inf") else None


def parse_args(argv: list[str]) -> argparse.Namespace:
    def tf(s: str) -> bool:
        s = s.lower()
        if s not in ("true", "false"):
            raise argparse.ArgumentTypeError("takes true|false")
        return s == "true"

    ap = argparse.ArgumentParser(prog="smlib_measure.py")
    ap.add_argument("model")
    ap.add_argument("--heal", type=tf, default=False)
    ap.add_argument("--tolerance", type=float, default=None)
    ap.add_argument("--angle", type=float, default=15.0)
    ap.add_argument("--threads", default=None)  # accepted for runner uniformity, ignored
    a = ap.parse_args(argv)
    if a.tolerance is not None and not a.tolerance > 0:
        ap.error("--tolerance must be > 0 (mm)")
    if not a.angle > 0:
        ap.error("--angle must be > 0 (degrees)")
    return a


def measure(args: argparse.Namespace, row: dict, notes: list[str]) -> None:
    t = time.perf_counter()
    import smlibpy  # noqa: PLC0415  (timed: native kernel load)
    from smlibpy import ModelingError, Part

    notes.append(f"import smlibpy (native kernel load): {rnd((time.perf_counter() - t) * 1000, 1)} ms (not in read_ms)")
    row["versions"]["smlibpy"] = smlibpy.__version__

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")

        # ---- read: open(latin-1).read() -> parse -> B-rep build, all inside import_step -----
        t_read = time.perf_counter()
        try:
            result = smlibpy.import_step(args.model, heal=args.heal)
        except ModelingError as e:
            row["read_ms"] = rnd((time.perf_counter() - t_read) * 1000, 1)
            if "holds no B-rep" in str(e):
                # The library signals "0 bodies" by raising; the contract calls that `empty`.
                row["status"] = "empty"
                row["error"] = first_line(e)
                row["bodies"] = 0
                notes.append("import_step raises ModelingError when the file has no B-rep solids/surfaces; mapped to status=empty")
                return
            raise
        row["read_ms"] = rnd((time.perf_counter() - t_read) * 1000, 1)
        bodies = list(result) if isinstance(result, list) else [result]
        row["bodies"] = len(bodies)
        if not bodies:
            row["status"] = "empty"
            return

        # ---- exact measurement: mass_properties, is_valid, bbox -----------------------------
        t_meas = time.perf_counter()
        faces = 0
        area = 0.0
        volume = 0.0
        closed_valid = 0
        invalid = 0
        sheets = 0
        failures = 0
        first_fail: list[str] = []
        lo = [float("inf")] * 3
        hi = [float("-inf")] * 3
        per_body_tol: list[float] = []
        for b in bodies:
            is_part = isinstance(b, Part)
            try:
                faces += len(b.faces())
                if is_part:
                    props = None
                    try:
                        props = b.mass_properties()  # default accuracy (ACCURACY = 1e-7)
                    except ZeroDivisionError:
                        pass  # zero-volume solid: the centroid division fails
                    if props is None:
                        invalid += 1
                        area += b.area
                        notes.append("a Part has zero volume (mass_properties refuses); counted invalid, area from Part.area")
                    else:
                        area += props.area
                        if b.is_valid():
                            closed_valid += 1
                            volume += props.volume
                        else:
                            invalid += 1
                else:
                    sheets += 1
                    area += b.area
                bb = b.bbox()
                for k in range(3):
                    lo[k] = min(lo[k], float(bb.min.to_tuple()[k]))
                    hi[k] = max(hi[k], float(bb.max.to_tuple()[k]))
                per_body_tol.append(max(float(bb.diagonal) * 1e-3, 1e-6))  # tessellate()'s default, mesh.py
            except BaseException as e:  # noqa: BLE001
                if classify(e) == "oom":
                    raise
                failures += 1
                if len(first_fail) < 3:
                    first_fail.append(first_line(e))
        row["measure_ms"] = rnd((time.perf_counter() - t_meas) * 1000, 1)
        row["faces"] = faces
        row["invalid_bodies"] = invalid
        row["closed_valid_bodies"] = closed_valid
        row["exact_volume_mm3"] = volume if closed_valid > 0 else None
        if failures == 0:
            row["exact_area_mm2"] = area
        else:
            row["exact_area_mm2"] = None
            notes.append(f"exact measurement failed on {failures}/{len(bodies)} bodies ({' | '.join(first_fail)}); partial area sum would be {rnd(area)} mm2, withheld")
        if lo[0] != float("inf") and failures < len(bodies):
            row["bbox_extent_mm"] = [hi[k] - lo[k] for k in range(3)]
            if failures:
                notes.append("bbox_extent_mm covers only the bodies whose measurement succeeded")
        if sheets:
            notes.append(f"{sheets} of {len(bodies)} bodies are open sheets (Shell): area counted, excluded from volume and invalid_bodies (is_valid is Part-only)")
        notes.append("closed_valid_bodies = Part (closed solid by construction) and is_valid(); exact volume is mass_properties().volume at accuracy 1e-7")

        # ---- mesh: one tessellation per body, counted then dropped --------------------------
        t_geom = time.perf_counter()
        tris = 0
        marea = 0.0
        mfail = 0
        mfirst: list[str] = []
        for b in bodies:
            try:
                m = b.mesh(args.tolerance, args.angle)
                tris += len(m)
                marea += m.area
                del m
            except BaseException as e:  # noqa: BLE001
                if classify(e) == "oom":
                    raise
                mfail += 1
                if len(mfirst) < 3:
                    mfirst.append(first_line(e))
        row["geometry_ms"] = rnd((time.perf_counter() - t_geom) * 1000, 1)
        if mfail == 0:
            row["triangles"] = tris
            row["mesh_area_mm2"] = marea
        else:
            row["triangles"] = None
            row["mesh_area_mm2"] = None
            notes.append(f"mesh failed on {mfail}/{len(bodies)} bodies ({' | '.join(mfirst)}); partial: {tris} triangles, {rnd(marea)} mm2, withheld")
        if args.tolerance is not None:
            row["mesh_tolerance_mm"] = args.tolerance
        elif per_body_tol:
            row["mesh_tolerance_mm"] = max(per_body_tol)
            notes.append(
                "mesh tolerance is SMLib's per-body default (0.1% of each body's bbox diagonal, min 1e-6 mm); "
                f"mesh_tolerance_mm is the largest used ({max(per_body_tol)}), smallest {min(per_body_tol)}"
            )
        notes.append(f"mesh angle {args.angle} deg (curve and surface angle tolerance)")

    # Collapse the per-body "faces leave gaps" warnings to a count and the worst uncertainty.
    gap_n = 0
    gap_worst = 0.0
    other: dict[str, int] = {}
    for w in caught:
        msg = str(w.message)
        g = re.search(r"uncertain by about ([0-9.e+-]+) of its value", msg)
        if g:
            gap_n += 1
            gap_worst = max(gap_worst, float(g.group(1)))
        else:
            key = msg.split("\n")[0][:200]
            other[key] = other.get(key, 0) + 1
    if gap_n:
        notes.append(f"smlibpy warned on {gap_n} bodies that their faces leave gaps, so exact volume is uncertain by up to {gap_worst:g} of its value on those (the warning concerns volume only)")
    for msg, n in other.items():
        notes.append(f"smlibpy warning x{n}: {msg}")
    row["status"] = "ok"


def main() -> dict:
    row: dict = {
        "arm": ARM,
        "variant": None,
        "model": sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None,
        "size_bytes": None,
        "status": "error",
        "error": None,
        "read_ms": None,
        "geometry_ms": None,
        "measure_ms": None,
        "total_ms": None,
        "peak_rss_bytes": None,
        "bodies": None,
        "faces": None,
        "triangles": None,
        "mesh_area_mm2": None,
        "exact_area_mm2": None,
        "exact_volume_mm3": None,
        "closed_valid_bodies": None,
        "invalid_bodies": None,
        "bbox_extent_mm": None,
        "mesh_tolerance_mm": None,
        "versions": {"smlibpy": None, "python": sys.version.split()[0]},
        "notes": [],
    }
    notes: list[str] = row["notes"]
    try:
        args = parse_args(sys.argv[1:])
        row["model"] = args.model
        row["variant"] = f"heal={'true' if args.heal else 'false'}"
        row["size_bytes"] = os.path.getsize(args.model)
        notes.append("smlibpy.import_step(path) opens the file as text (latin-1) and read()s the whole file into one str inside the library; no bytes entry point exists")
        measure(args, row, notes)
    except SystemExit as e:  # argparse error: keep going so a row is still emitted
        row["error"] = f"bad arguments (exit {e.code})"
    except BaseException as e:  # noqa: BLE001
        row["status"] = classify(e)
        row["error"] = first_line(e)
    row["total_ms"] = rnd((time.perf_counter() - T0) * 1000, 1)
    row["peak_rss_bytes"] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024  # KiB on Linux
    return row


if __name__ == "__main__":
    out = main()
    sys.stdout.write(json.dumps(out) + "\n")
    sys.stdout.flush()
    os._exit(0)  # skip interpreter teardown of the native kernel
