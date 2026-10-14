#!/usr/bin/env python3
"""OCCT arm of the kernel_compare harness (cadquery-ocp).

    ~/kc-venv/bin/python -I scripts/kernel_compare/occt_measure.py <model.step>
        [--tolerance <mm>] [--angle <deg>] [--gprop-eps <rel>] [--parallel]
        [--heal true|false]

Prints exactly one JSON row (see README.md "Row contract") on the LAST line of
stdout. Everything the OCCT C++ side writes to stdout during the run is
redirected to stderr (file descriptor level), so the row is never glued to
library chatter.

Also importable (gen_blends.py does): ``measure_file(path, ...)`` returns the
row dict, ``measure_shape(shape, ...)`` measures an already-built TopoDS_Shape.
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys
import time
from typing import Any

ARM = "occt"

# Default mesh settings. smlibpy's own default is 0.1 % of the bbox diagonal and
# 15 degrees (smlibpy/mesh.py `tessellate`), so the OCCT arm uses the same
# unless told otherwise, to keep the arms like-for-like.
DEFAULT_REL_TOL = 1e-3
DEFAULT_ANGLE_DEG = 15.0
DEFAULT_GPROP_EPS = 1e-6


def _ms(t0: float) -> float:
    return (time.perf_counter() - t0) * 1000.0


def _peak_rss_bytes() -> int:
    # Linux: ru_maxrss is KiB.
    return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) * 1024


def _first_line(msg: str) -> str:
    return (msg.strip().splitlines() or [""])[0][:500]


def _is_memory_shaped(exc: BaseException) -> bool:
    if isinstance(exc, MemoryError):
        return True
    m = f"{type(exc).__name__} {exc}".lower()
    return "bad_alloc" in m or "outofmemory" in m or "out of memory" in m or "std::bad_alloc" in m


def _versions() -> dict[str, str]:
    v: dict[str, str] = {"python": sys.version.split()[0]}
    try:
        import importlib.metadata as md

        v["ocp"] = md.version("cadquery-ocp")
    except Exception:  # pragma: no cover - metadata missing
        try:
            import OCP  # type: ignore

            v["ocp"] = str(getattr(OCP, "__version__", "unknown"))
        except Exception:
            v["ocp"] = "unknown"
    return v


def _empty_row(model: str, variant: str) -> dict[str, Any]:
    try:
        size = os.path.getsize(model)
    except OSError:
        size = None
    return {
        "arm": ARM,
        "variant": variant,
        "model": model,
        "size_bytes": size,
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
        "bbox_extent_all_mm": None,
        "exact_area_unstable": None,
        "mesh_tolerance_mm": None,
        "versions": _versions(),
        "notes": [],
    }


# --------------------------------------------------------------------------
# reading
# --------------------------------------------------------------------------


def read_step_shape(path: str, notes: list[str] | None = None):
    """STEPControl_Reader -> TransferRoots -> OneShape, forced to mm.

    Returns (shape, n_roots_transferred). ``xstep.cascade.unit`` only exists
    after ``STEPControl_Controller.Init_s()`` -- before that ``CVal_s`` returns
    "" and ``SetCVal_s`` returns False -- so the controller is initialised
    first and the setting is verified, not assumed.
    """
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.Interface import Interface_Static
    from OCP.STEPControl import STEPControl_Controller, STEPControl_Reader

    notes = notes if notes is not None else []
    STEPControl_Controller.Init_s()
    if not Interface_Static.SetCVal_s("xstep.cascade.unit", "MM"):
        raise RuntimeError("could not set xstep.cascade.unit=MM")
    got = Interface_Static.CVal_s("xstep.cascade.unit")
    if got != "MM":
        raise RuntimeError(f"xstep.cascade.unit is {got!r} after forcing MM")

    reader = STEPControl_Reader()
    status = reader.ReadFile(path)
    if status != IFSelect_RetDone:
        raise RuntimeError(f"STEPControl_Reader.ReadFile status {status}")

    try:
        sys_unit = reader.SystemLengthUnit()
    except Exception:
        sys_unit = None
    if sys_unit is not None and abs(sys_unit - 1.0) > 1e-12:
        raise RuntimeError(f"system length unit is {sys_unit} mm, expected 1.0")
    try:
        from OCP.collections import Sequence_TCollection_AsciiString as _Seq  # type: ignore

        ln, an, sn = _Seq(), _Seq(), _Seq()
        reader.FileUnits(ln, an, sn)
        names = sorted({ln.Value(i).ToCString() for i in range(1, ln.Length() + 1)})
        notes.append(
            f"file length unit(s): {', '.join(names) or '(none declared)'}; "
            "converted to mm by OCCT (xstep.cascade.unit=MM, system length unit 1.0 mm)"
        )
    except Exception:
        notes.append("file length unit: not introspectable; OCCT converts to mm (xstep.cascade.unit=MM)")

    n = reader.TransferRoots()
    shape = reader.OneShape()
    return shape, int(n)


# --------------------------------------------------------------------------
# measuring
# --------------------------------------------------------------------------


def _cast(kind: str, shape):
    """TopoDS.Solid / TopoDS.Face downcast: this OCP build exposes `TopoDS.Solid`,
    older ones `TopoDS.Solid_s`."""
    from OCP.TopoDS import TopoDS

    fn = getattr(TopoDS, kind, None) or getattr(TopoDS, kind + "_s")
    return fn(shape)


def _indexed_map():
    """TopTools_IndexedMapOfShape under whichever name this OCP build exposes."""
    try:
        from OCP.TopTools import TopTools_IndexedMapOfShape  # type: ignore

        return TopTools_IndexedMapOfShape()
    except ImportError:
        from OCP.collections import IndexedMap_TopoDS_Shape_TopTools_ShapeMapHasher  # type: ignore

        return IndexedMap_TopoDS_Shape_TopTools_ShapeMapHasher()


def _explore(shape, kind, avoid=None):
    from OCP.TopExp import TopExp_Explorer

    ex = TopExp_Explorer(shape, kind) if avoid is None else TopExp_Explorer(shape, kind, avoid)
    while ex.More():
        yield ex.Current()
        ex.Next()


def _unique(shape, kind) -> list:
    from OCP.TopExp import TopExp

    m = _indexed_map()
    TopExp.MapShapes_s(shape, kind, m)
    return [m.FindKey(i) for i in range(1, m.Extent() + 1)]


def _solid_is_closed(solid) -> bool:
    """Every shell of the solid is closed.

    Do NOT call BRep_Tool.IsClosed_s on the solid itself: in this OCCT build it
    returns False for every solid, including a freshly made BRepPrimAPI_MakeBox
    (verified), so a closed-check written that way silently zeroes
    closed_valid_bodies. On a shell it works (True for the box shell, False for
    a sewn 5-face open shell, verified). Note BRepCheck_Analyzer reports that
    open shell as *valid*, so validity alone does not imply closed.
    """
    from OCP.BRep import BRep_Tool
    from OCP.TopAbs import TopAbs_SHELL

    n = 0
    for sh in _explore(solid, TopAbs_SHELL):
        n += 1
        if not BRep_Tool.IsClosed_s(sh):
            return False
    return n > 0


def _bbox_extent(shapes, *, use_triangulation: bool = False) -> list[float] | None:
    """Axis-aligned extents of one shape or a list of shapes (union box).

    ``use_triangulation=False`` is the headline setting (exact surfaces). It
    leaves the box void for faces that carry only a triangulation and no
    surface (STEP tessellated geometry, e.g. nist_ftc_08_asme1_ap242-e1-tg.stp):
    those need ``use_triangulation=True``.
    """
    from OCP.Bnd import Bnd_Box
    from OCP.BRepBndLib import BRepBndLib

    box = Bnd_Box()
    # AddOptimal_s, not Add: Add inflates by edge/vertex tolerance and by
    # control-polygon hulls. useTriangulation=False so a prior mesh can't leak in.
    for sh in (shapes if isinstance(shapes, list) else [shapes]):
        BRepBndLib.AddOptimal_s(sh, box, use_triangulation, False)
    if box.IsVoid():
        return None
    if box.GetGap() != 0.0:
        raise RuntimeError(f"bbox gap is {box.GetGap()}, expected 0 with useShapeTolerance=False")
    lo, hi = box.CornerMin(), box.CornerMax()
    # CornerMin/CornerMax are the raw bounds; Get() would include the gap
    # (and is ambiguous in this binding).
    return [hi.X() - lo.X(), hi.Y() - lo.Y(), hi.Z() - lo.Z()]


def _mesh_stats(faces: list) -> tuple[int, float, int]:
    """(triangles, area_mm2, faces_without_triangulation) over unique face
    instances, with each face's TopLoc_Location applied."""
    import numpy as np
    from OCP.BRep import BRep_Tool
    from OCP.TopLoc import TopLoc_Location
    tris = 0
    area = 0.0
    missing = 0
    for f in faces:
        face = _cast("Face", f)
        loc = TopLoc_Location()
        poly = BRep_Tool.Triangulation_s(face, loc)
        if poly is None or poly.NbTriangles() == 0:
            missing += 1
            continue
        nn, nt = poly.NbNodes(), poly.NbTriangles()
        nodes = np.empty((nn, 3))
        for i in range(1, nn + 1):
            p = poly.Node(i)
            nodes[i - 1] = (p.X(), p.Y(), p.Z())
        t = np.empty((nt, 3), dtype=np.int64)
        for i in range(1, nt + 1):
            t[i - 1] = poly.Triangle(i).Get()
        t -= 1
        if not loc.IsIdentity():
            trsf = loc.Transformation()
            m = np.array([[trsf.Value(r, c) for c in range(1, 5)] for r in range(1, 4)])
            # Value() includes the scale factor, so this is the full transform.
            nodes = nodes @ m[:, :3].T + m[:, 3]
        a, b, c = nodes[t[:, 0]], nodes[t[:, 1]], nodes[t[:, 2]]
        area += float(0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1).sum())
        tris += nt
    return tris, area, missing


# A mesh is inscribed in the surface, so its area is at or just below the exact
# area on every healthy model. Over the 115 other OCCT rows in the first pass
# mesh/exact is 0.9983 .. 1.0000809 (the top is nist_ftc_09 / stc_09, 8e-5 high
# from the chord tolerance); Equiptment_UltrasoundProbe.step is 1.00265. 5e-4
# sits ~6x above the benign maximum and ~5x below the known case, and under the
# 1e-3 SMLib/OCCT threshold the triage used, so a flagged exact area is one that
# could change that comparison.
EXACT_AREA_UNSTABLE_REL = 5e-4


def _check_exact_area_stable(row: dict[str, Any]) -> None:
    """Set ``exact_area_unstable`` from mesh area vs exact area.

    GProp's reported error is not reliable on some B-spline faces (the adaptive
    integrator can stop early with a small reported error and a wrong value),
    and nothing in the integration says so. The mesh is an independent estimate
    that should fall short of the surface, so mesh > exact x (1 + EXACT_AREA_UNSTABLE_REL)
    means the exact figure is wrong. Null when there is no mesh to compare.
    """
    exact, mesh = row.get("exact_area_mm2"), row.get("mesh_area_mm2")
    if not (exact and mesh):
        return
    ratio = mesh / exact
    row["exact_area_unstable"] = ratio > 1.0 + EXACT_AREA_UNSTABLE_REL
    if row["exact_area_unstable"]:
        row["notes"].append(
            f"exact area unstable: OCCT mesh area {mesh:.6g} mm2 exceeds exact area {exact:.6g} mm2 by "
            f"{(ratio - 1.0):.3g} (> {EXACT_AREA_UNSTABLE_REL:g}); an inscribed mesh should not be larger "
            "than the surface, so BRepGProp's adaptive integration did not converge here even though it "
            "reports a small error. exact_area_mm2 is wrong by an unknown amount (in either direction, per "
            "face) and exact_volume_mm3 may be too. Exclude this row from exact-area comparisons; "
            "mesh_area_mm2 is the better OCCT figure"
        )


def measure_shape(
    shape,
    row: dict[str, Any],
    *,
    tolerance: float | None = None,
    angle_deg: float = DEFAULT_ANGLE_DEG,
    gprop_eps: float = DEFAULT_GPROP_EPS,
    parallel: bool = False,
    do_mesh: bool = True,
) -> None:
    """Fill the measurement fields of ``row`` from ``shape`` (in mm)."""
    import math

    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepGProp import BRepGProp
    from OCP.BRepMesh import BRepMesh_IncrementalMesh
    from OCP.GProp import GProp_GProps
    from OCP.TopAbs import TopAbs_FACE, TopAbs_SHELL, TopAbs_SOLID

    notes: list[str] = row["notes"]

    # ---- topology census -------------------------------------------------
    solids = _unique(shape, TopAbs_SOLID)
    # Shells not contained in any solid. TopExp_Explorer with ToAvoid=SOLID
    # skips every shell below a solid; what remains are free shells. Unique via
    # IsSame (TShape+Location), so a shell instanced twice counts twice.
    free_shells = []
    seen: list = []
    for s in _explore(shape, TopAbs_SHELL, TopAbs_SOLID):
        if not any(s.IsSame(o) for o in seen):
            seen.append(s)
            free_shells.append(s)
    faces = _unique(shape, TopAbs_FACE)
    face_occurrences = sum(1 for _ in _explore(shape, TopAbs_FACE))
    from OCP.TopExp import TopExp

    in_body = _indexed_map()
    for body in solids + free_shells:
        TopExp.MapShapes_s(body, TopAbs_FACE, in_body)
    row["bodies"] = len(solids) + len(free_shells)
    row["faces"] = len(faces)
    notes.append(
        f"bodies = {len(solids)} solids + {len(free_shells)} free shells (shells not inside a solid); "
        "each placed instance counts separately (TopoDS IsSame = TShape+Location); "
        "loose faces and wireframe are not bodies"
    )
    loose = len(faces) - in_body.Extent()
    if loose > 0:
        notes.append(f"{loose} faces belong to no solid or shell (loose faces; counted in `faces`, not in `bodies`)")
    if face_occurrences != len(faces):
        notes.append(
            f"face occurrences by TopExp_Explorer = {face_occurrences} vs {len(faces)} unique; "
            "exact_area uses occurrences (SkipShared=False), mesh numbers use unique faces"
        )

    # ---- bbox (exact, before meshing so the mesh cannot influence it) -----
    # bbox_extent_mm covers the same bodies counted in `bodies` (solids + free
    # shells), NOT the whole shape: the whole shape also carries wireframe
    # (GEOMETRIC_CURVE_SET etc., e.g. nist_ctc_01: 1170x650 with wireframe vs
    # 800x450 for the solid) which conway and SMLib do not read.
    body_list = solids + free_shells
    bbox_targets = body_list or faces
    if body_list:
        row["bbox_extent_mm"] = _bbox_extent(body_list)
        notes.append("bbox_extent_mm = union over the counted bodies (solids + free shells), "
                     "via BRepBndLib.AddOptimal_s(useTriangulation=False, useShapeTolerance=False)")
    elif faces:
        row["bbox_extent_mm"] = _bbox_extent(faces)
        notes.append("bbox_extent_mm = union over loose faces (no solids or shells in the file)")
    else:
        row["bbox_extent_mm"] = None
        notes.append("bbox_extent_mm null: no solids, shells or faces")
    if row["bbox_extent_mm"] is None and bbox_targets:
        # Exact-geometry bbox is void when no face has a surface (tessellated-
        # only STEP). Fall back to the faces' own triangulation (the reader's,
        # not a BRepMesh result: meshing happens below).
        row["bbox_extent_mm"] = _bbox_extent(bbox_targets, use_triangulation=True)
        if row["bbox_extent_mm"] is not None:
            notes.append("bbox_extent_mm from triangulation (BRepBndLib.AddOptimal_s useTriangulation=True): "
                         "the exact-geometry box was void because the faces carry no surface "
                         "(tessellated-only STEP)")
        else:
            notes.append("bbox_extent_mm null: void with and without triangulation")
    row["bbox_extent_all_mm"] = _bbox_extent(shape)
    if row["bbox_extent_all_mm"] is None and shape is not None:
        row["bbox_extent_all_mm"] = _bbox_extent(shape, use_triangulation=True)
    if row["bbox_extent_all_mm"] != row["bbox_extent_mm"]:
        notes.append(f"bbox_extent_all_mm (whole transferred shape, incl. wireframe/other) differs: "
                     f"{row['bbox_extent_all_mm']}")

    # ---- exact area / volume ----------------------------------------------
    t0 = time.perf_counter()
    props = GProp_GProps()
    if gprop_eps and gprop_eps > 0:
        err = BRepGProp.SurfaceProperties_s(shape, props, gprop_eps, False)
        notes.append(f"exact area: BRepGProp.SurfaceProperties_s adaptive eps={gprop_eps:g}, reached rel err {err:.3g}")
    else:
        BRepGProp.SurfaceProperties_s(shape, props)
        notes.append("exact area: BRepGProp.SurfaceProperties_s non-adaptive Gauss (default)")
    row["exact_area_mm2"] = props.Mass()

    vol = 0.0
    n_cv = 0
    n_nonpos = 0
    for s in solids:
        sol = _cast("Solid", s)
        if not (_solid_is_closed(sol) and BRepCheck_Analyzer(sol).IsValid()):
            continue
        vp = GProp_GProps()
        if gprop_eps and gprop_eps > 0:
            BRepGProp.VolumeProperties_s(sol, vp, gprop_eps, True)
        else:
            BRepGProp.VolumeProperties_s(sol, vp, True)
        v = vp.Mass()
        if not (v > 0.0) or not math.isfinite(v):
            n_nonpos += 1
            continue
        vol += v
        n_cv += 1
    gprop_ms = _ms(t0)
    row["measure_ms"] = gprop_ms
    row["closed_valid_bodies"] = n_cv
    row["exact_volume_mm3"] = vol if n_cv else None
    if n_nonpos:
        notes.append(
            f"{n_nonpos} closed+valid solids had non-positive volume and were excluded from exact_volume "
            "(not counted in closed_valid_bodies)"
        )
    notes.append(
        "exact_volume over solids whose every shell is closed (BRep_Tool.IsClosed_s per shell) AND BRepCheck_Analyzer.IsValid; free shells never contribute"
    )

    # ---- validity (separate from measure_ms; included in total_ms) -------
    n_invalid = 0
    for b in solids + free_shells:
        if not BRepCheck_Analyzer(b).IsValid():
            n_invalid += 1
    row["invalid_bodies"] = n_invalid

    # ---- mesh ---------------------------------------------------------------
    if do_mesh:
        if tolerance is None:
            ext = row["bbox_extent_mm"] or [0, 0, 0]
            diag = math.sqrt(sum(e * e for e in ext))
            tolerance = DEFAULT_REL_TOL * diag if diag > 0 else 0.1
            notes.append(f"mesh tolerance defaulted to {DEFAULT_REL_TOL:g} x bbox diagonal (matches smlibpy default)")
        t0 = time.perf_counter()
        mesher = BRepMesh_IncrementalMesh(shape, float(tolerance), False, math.radians(angle_deg), bool(parallel))
        row["geometry_ms"] = _ms(t0)
        row["mesh_tolerance_mm"] = float(tolerance)
        notes.append(
            f"BRepMesh_IncrementalMesh lin={tolerance:g} mm absolute, ang={angle_deg:g} deg, "
            f"{'parallel' if parallel else 'serial'}; IsDone={mesher.IsDone() if hasattr(mesher, 'IsDone') else '?'}"
        )
        tris, marea, missing = _mesh_stats(faces)
        row["triangles"] = tris
        row["mesh_area_mm2"] = marea if tris else None
        if missing:
            notes.append(f"{missing} of {len(faces)} faces have no triangulation after meshing")
        _check_exact_area_stable(row)


def _finish_status(row: dict[str, Any], do_mesh: bool = True) -> None:
    bodies, tris = row["bodies"], row["triangles"]
    loose = any("loose faces" in n for n in row["notes"])
    if (bodies or loose) and (tris or not do_mesh):
        row["status"] = "ok"
    else:
        row["status"] = "empty"


def _preload() -> None:
    """Import every OCP module the measurement touches, so the ~0.7 s of
    binding/shared-library load is not billed to read_ms (measured: importing
    OCP.STEPControl alone is 0.67 s; Init_s, ReadFile and TransferRoots on a
    9 KB file are ~5 ms together). Import time is outside total_ms too."""
    import numpy  # noqa: F401
    from OCP import (BRep, BRepBndLib, BRepCheck, BRepGProp, BRepMesh, Bnd, GProp,  # noqa: F401
                     IFSelect, Interface, STEPControl, TopAbs, TopExp, TopLoc, TopoDS, TopTools)
    try:
        from OCP import collections  # noqa: F401
    except ImportError:
        pass


def measure_file(
    path: str,
    *,
    tolerance: float | None = None,
    angle_deg: float = DEFAULT_ANGLE_DEG,
    gprop_eps: float = DEFAULT_GPROP_EPS,
    parallel: bool = False,
    do_mesh: bool = True,
    ignored_heal: bool = False,
) -> dict[str, Any]:
    """Read ``path`` and return one contract row. Never raises."""
    variant = f"mesh={'parallel' if parallel else 'serial'}"
    row = _empty_row(path, variant)
    try:
        _preload()
    except BaseException as exc:  # noqa: BLE001
        row["error"] = _first_line(f"{type(exc).__name__}: {exc}")
        row["peak_rss_bytes"] = _peak_rss_bytes()
        row["total_ms"] = 0.0
        return row
    t_start = time.perf_counter()
    try:
        if ignored_heal:
            row["notes"].append("--heal ignored: OCCT arm does no healing (STEPControl_Reader defaults only)")
        t0 = time.perf_counter()
        try:
            shape, n_roots = read_step_shape(path, row["notes"])
        finally:
            row["read_ms"] = _ms(t0)
        row["notes"].append(f"TransferRoots transferred {n_roots} roots")
        if shape is None or shape.IsNull():
            row["bodies"] = 0
            row["faces"] = 0
            row["status"] = "empty"
            row["error"] = None
        else:
            measure_shape(
                shape, row, tolerance=tolerance, angle_deg=angle_deg, gprop_eps=gprop_eps,
                parallel=parallel, do_mesh=do_mesh,
            )
            _finish_status(row, do_mesh)
    except BaseException as exc:  # noqa: BLE001 - a row must always come out
        if isinstance(exc, (KeyboardInterrupt, SystemExit)):
            raise
        row["status"] = "oom" if _is_memory_shaped(exc) else "error"
        row["error"] = _first_line(f"{type(exc).__name__}: {exc}")
    row["total_ms"] = _ms(t_start)
    row["peak_rss_bytes"] = _peak_rss_bytes()
    return row


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def _parse_bool(s: str) -> bool:
    if s.lower() in ("true", "1", "yes"):
        return True
    if s.lower() in ("false", "0", "no"):
        return False
    raise argparse.ArgumentTypeError(f"expected true|false, got {s!r}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="OCCT arm: one STEP model -> one JSON row on the last stdout line")
    ap.add_argument("model")
    ap.add_argument("--tolerance", type=float, default=None,
                    help="mesh chord tolerance in mm (default 0.1%% of bbox diagonal)")
    ap.add_argument("--angle", type=float, default=DEFAULT_ANGLE_DEG, help="mesh angular deflection, degrees")
    ap.add_argument("--gprop-eps", type=float, default=DEFAULT_GPROP_EPS,
                    help="adaptive GProp relative eps; 0 = OCCT default non-adaptive Gauss")
    ap.add_argument("--parallel", action="store_true", help="BRepMesh in parallel (default serial)")
    ap.add_argument("--heal", type=_parse_bool, default=None, help="accepted for runner uniformity; ignored")
    args = ap.parse_args(argv)

    # Route fd 1 to fd 2 for the whole run, including interpreter exit: OCCT's
    # messenger writes to C++ stdout and its buffer can flush after main()
    # returns (seen: an "ERR StepReaderData" line landing *after* the row).
    # The row goes straight to the saved original fd, and fd 1 is never
    # restored, so nothing can follow it on stdout.
    sys.stdout.flush()
    real_out = os.dup(1)
    os.dup2(2, 1)
    row = measure_file(
        args.model, tolerance=args.tolerance, angle_deg=args.angle, gprop_eps=args.gprop_eps,
        parallel=args.parallel, ignored_heal=args.heal is not None,
    )
    try:
        import ctypes

        ctypes.CDLL(None).fflush(None)  # drain C stdio (and the synced C++ cout) into stderr
    except Exception:
        pass
    sys.stdout.flush()
    sys.stderr.flush()
    os.write(real_out, ("\n" + json.dumps(row) + "\n").encode("utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
