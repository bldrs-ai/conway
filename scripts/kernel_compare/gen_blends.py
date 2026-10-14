#!/usr/bin/env python3
"""T0 blend-family generator for the kernel_compare harness (smlibpy).

    ~/kc-venv/bin/python -I scripts/kernel_compare/gen_blends.py [--out DIR]
        [--only SUBSTR] [--no-render] [--tol-area 1e-4] [--tol-volume 1e-4]

Authors the plan's blend family (design/new/kernel-compare-smlib.md, "Corpus"
T0 and "Blend test (P4)"): three base solids (box, L-bracket, boss-on-plate),
edges rounded circular / G1 / G2 / G3, constant and variable radius, at two
radii each. For every fixture it

  1. writes ``<base>_<radius>_<continuity>[_var].step`` with smlibpy and records
     the in-memory body's exact area, volume, face count, isValid, plus a zebra
     PNG;
  2. isolates the writer (plan step 2): re-imports the STEP through smlibpy AND
     OCCT (occt_measure.measure_file) and checks area, volume, face count
     against the source body. Fixtures that fail get ``writer_ok: false`` and
     are to be EXCLUDED from the conway comparison;
  3. writes ``manifest.json``.

Later steps compare conway against the re-imported values, never the
in-memory ones.

STEP files never go into this repo; default output is outside it.

Determinism: smlibpy's STEP writer stamps ``datetime.now()`` (seconds) into
FILE_NAME. That is the only nondeterministic byte found; this script
rewrites it to a fixed epoch stamp after writing, so the output is
byte-identical run to run (verified by running twice and comparing hashes; see
README "T0 blend family"). Every fixture is also exported a second time to a
scratch file and compared (``deterministic_modulo_stamp`` in the manifest).
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
import tempfile
import warnings
from typing import Any

import smlibpy as sp
from smlibpy import Align, Box, Cylinder, Z

DEFAULT_OUT = "/home/user/kernel-compare-out/t0_blends/"
FIXED_STAMP = "1970-01-01T00:00:00"
_STAMP_RE = re.compile(r"(FILE_NAME\('[^']*',')[^']*(')")

# base -> radii. Radii differ per base because a radius must stay below half
# the thinnest wall it rounds on both sides (L-bracket wall and plate are 10 mm
# thick, so r <= 4 here; the box is 40 mm tall and takes 4 and 8, 8 being Create's
# `box-fillet-r8` radius).
BASES = {
    "box": {"radii": (4.0, 8.0)},
    "lbracket": {"radii": (2.0, 4.0)},
    "bossplate": {"radii": (2.0, 4.0)},
}
# (file tag, smlibpy `continuity=` argument, manifest label)
CONTINUITIES = (("circ", None, "circular"), ("g1", "G1", "G1"), ("g2", "G2", "G2"), ("g3", "G3", "G3"))


# --------------------------------------------------------------------------
# bases
# --------------------------------------------------------------------------


def make_base(name: str):
    if name == "box":
        # 80 x 60 x 40, centred (Create's box-fillet fixture shape class).
        return Box(80, 60, 40)
    if name == "lbracket":
        # 80 x 60 x 10 base plate + 80 x 10 x 50 back wall flush with the +Y edge.
        plate = Box(80, 60, 10, align=(Align.CENTER, Align.CENTER, Align.MIN))
        wall = Box(80, 10, 50, align=(Align.CENTER, Align.MAX, Align.MIN)).translate(0, 30, 0)
        return plate + wall
    if name == "bossplate":
        # 80 x 60 x 10 plate + R15 x 20 boss on top, centred.
        plate = Box(80, 60, 10, align=(Align.CENTER, Align.CENTER, Align.MIN))
        boss = Cylinder(15, 20, align=(Align.CENTER, Align.CENTER, Align.MIN)).translate(0, 0, 10)
        return plate + boss
    raise KeyError(name)


def select_edges(part, variable: bool):
    """Constant radius: every edge of the base (all sharp). Variable radius:
    the edges parallel to Z -- a variable radius cannot be applied to edges
    that meet at a vertex (every combination of `all`/`top4` on the box
    failed with 'radius may be too large'), nor to a closed circular edge with
    start != end (the seam would jump), so boss-on-plate's variable fixture
    rounds only the four plate corners."""
    if variable:
        return part.edges().parallel_to(Z), "edges parallel to Z"
    return part.edges(), "all edges"


# --------------------------------------------------------------------------
# sibling module: occt_measure (loaded by path, because -I drops the script dir
# from sys.path)
# --------------------------------------------------------------------------


def _load_occt():
    here = os.path.dirname(os.path.abspath(__file__))
    spec = importlib.util.spec_from_file_location("occt_measure", os.path.join(here, "occt_measure.py"))
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


# --------------------------------------------------------------------------
# measuring
# --------------------------------------------------------------------------


def _bodies(x) -> list:
    return list(x) if isinstance(x, (list, tuple)) or type(x).__name__ == "ShapeList" else [x]


def smlib_stats(body_or_list) -> dict[str, Any]:
    """Exact area / volume / faces / validity of a Part (or a list of them),
    with kernel warnings captured (e.g. 'faces do not meet exactly')."""
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        bodies = _bodies(body_or_list)
        area = vol = 0.0
        faces = 0
        valid = True
        for b in bodies:
            mp = b.mass_properties()
            area += float(mp.area)
            vol += float(mp.volume)
            faces += len(b.faces())
            valid = valid and bool(b.is_valid())
    return {
        "area": area,
        "volume": vol,
        "faces": faces,
        "valid": valid,
        "bodies": len(bodies),
        "warnings": sorted({str(x.message).split(":")[0][:160] for x in w}),
    }


def occt_stats(occt, path: str) -> dict[str, Any]:
    row = occt.measure_file(path, do_mesh=False)
    return {
        "area": row["exact_area_mm2"],
        "volume": row["exact_volume_mm3"],
        "faces": row["faces"],
        "valid": (row["status"] == "ok" and row["invalid_bodies"] == 0 and row["closed_valid_bodies"] == row["bodies"]),
        "bodies": row["bodies"],
        "closed_valid_bodies": row["closed_valid_bodies"],
        "invalid_bodies": row["invalid_bodies"],
        "bbox_extent_mm": row["bbox_extent_mm"],
        "status": row["status"],
        "error": row["error"],
    }


def _rel(a, b) -> float | None:
    if a is None or b is None:
        return None
    return abs(a - b) / max(abs(b), 1e-300)


def compare(src: dict, re_: dict, tol_area: float, tol_vol: float, label: str) -> list[str]:
    """Reasons `re_` does not match `src` (empty list = match)."""
    out: list[str] = []
    if re_.get("status", "ok") != "ok":
        out.append(f"{label}: status {re_.get('status')} {re_.get('error')}")
        return out
    if re_.get("bodies") != src["bodies"]:
        out.append(f"{label}: bodies {re_.get('bodies')} != {src['bodies']}")
    if re_["faces"] != src["faces"]:
        out.append(f"{label}: faces {re_['faces']} != {src['faces']}")
    ra, rv = _rel(re_["area"], src["area"]), _rel(re_["volume"], src["volume"])
    if ra is None or ra > tol_area:
        out.append(f"{label}: area rel diff {ra} > {tol_area:g} ({re_['area']} vs {src['area']})")
    if rv is None or rv > tol_vol:
        out.append(f"{label}: volume rel diff {rv} > {tol_vol:g} ({re_['volume']} vs {src['volume']})")
    if not re_["valid"]:
        out.append(f"{label}: re-imported body not valid/closed")
    return out


# --------------------------------------------------------------------------
# writing
# --------------------------------------------------------------------------


def _normalise_stamp(path: str) -> bool:
    with open(path, "r", encoding="ascii") as fh:
        text = fh.read()
    new, n = _STAMP_RE.subn(lambda m: f"{m.group(1)}{FIXED_STAMP}{m.group(2)}", text, count=1)
    if n != 1:
        raise RuntimeError(f"FILE_NAME stamp not found in {path}")
    with open(path, "w", encoding="ascii", newline="") as fh:
        fh.write(new)
    return new != text


def _sha(path: str) -> str:
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def _fmt_radius(r: float) -> str:
    return f"r{r:g}"


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Generate the T0 blend family with smlibpy")
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--only", default=None, help="only fixtures whose file name contains this substring")
    ap.add_argument("--no-render", action="store_true", help="skip the zebra PNGs")
    ap.add_argument("--tol-area", type=float, default=1e-4, help="relative area tolerance for the writer check")
    ap.add_argument("--tol-volume", type=float, default=1e-4, help="relative volume tolerance for the writer check")
    args = ap.parse_args(argv)

    out = os.path.abspath(args.out)
    if os.path.commonpath([out, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))]) == \
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")):
        print(f"refusing to write STEP outputs inside the repo: {out}", file=sys.stderr)
        return 2
    os.makedirs(out, exist_ok=True)
    zdir = os.path.join(out, "zebra")
    if not args.no_render:
        os.makedirs(zdir, exist_ok=True)

    occt = _load_occt()
    fixtures: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []
    render_ok: bool | None = None
    render_err: str | None = None

    for base, spec in BASES.items():
        part = make_base(base)
        base_stats = smlib_stats(part)
        for radius in spec["radii"]:
            for variable in (False, True):
                for tag, cont, label in CONTINUITIES:
                    stem = f"{base}_{_fmt_radius(radius)}_{tag}" + ("_var" if variable else "")
                    fname = stem + ".step"
                    if args.only and args.only not in fname:
                        continue
                    edges, edge_desc = select_edges(part, variable)
                    rec: dict[str, Any] = {
                        "file": fname,
                        "base": base,
                        "radius": radius,
                        "radius_start": radius / 2 if variable else radius,
                        "continuity": label,
                        "variable": variable,
                        "edges": f"{len(edges)} edges: {edge_desc}",
                        "smlibpy_call": (
                            f"part.fillet(edges, {('(%g, %g)' % (radius / 2, radius)) if variable else '%g' % radius}"
                            f", continuity={cont!r})"
                        ),
                    }
                    # ---- 1. author ------------------------------------------
                    try:
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore")
                            body = part.fillet(edges, (radius / 2, radius) if variable else radius, continuity=cont)
                        src = smlib_stats(body)
                    except Exception as exc:  # noqa: BLE001 - the gap list wants the message
                        msg = f"{type(exc).__name__}: {str(exc).splitlines()[0][:200]}"
                        rec.update(source=None, reimport_smlib=None, reimport_occt=None, writer_ok=False,
                                   excluded_reason=f"authoring failed: {msg}")
                        gaps.append({"file": fname, "error": msg})
                        fixtures.append(rec)
                        print(f"[fail ] {fname}: {msg}", file=sys.stderr)
                        continue
                    rec["source"] = src
                    rec["base_area"] = base_stats["area"]
                    path = os.path.join(out, fname)
                    sp.export(body, path)
                    # determinism probe: second export, compare modulo stamp
                    with tempfile.TemporaryDirectory() as td:
                        p2 = os.path.join(td, fname)
                        sp.export(body, p2)
                        _normalise_stamp(p2)
                        _normalise_stamp(path)
                        rec["deterministic_modulo_stamp"] = open(path, "rb").read() == open(p2, "rb").read()
                    rec["sha256"] = _sha(path)
                    rec["size_bytes"] = os.path.getsize(path)

                    # zebra
                    rec["zebra"] = None
                    if not args.no_render:
                        zp = os.path.join(zdir, stem + ".png")
                        try:
                            sp.render(body, zebra=True, path=zp)
                            rec["zebra"] = os.path.join("zebra", stem + ".png")
                            render_ok = True if render_ok is None else render_ok
                        except Exception as exc:  # noqa: BLE001
                            render_ok = False
                            render_err = f"{type(exc).__name__}: {str(exc).splitlines()[0][:200]}"
                            rec["zebra_error"] = render_err

                    # ---- 2. writer isolation ----------------------------------
                    failures: list[str] = []
                    try:
                        re_sm = smlib_stats(sp.import_step(path, heal=False))
                    except Exception as exc:  # noqa: BLE001
                        re_sm = {"status": "error", "error": f"{type(exc).__name__}: {str(exc).splitlines()[0][:200]}"}
                    rec["reimport_smlib"] = re_sm
                    failures += compare(src, re_sm, args.tol_area, args.tol_volume, "smlib")
                    re_oc = occt_stats(occt, path)
                    rec["reimport_occt"] = re_oc
                    failures += compare(src, re_oc, args.tol_area, args.tol_volume, "occt")
                    rec["writer_ok"] = not failures
                    if failures:
                        rec["failures"] = failures
                    fixtures.append(rec)
                    print(f"[{'ok   ' if rec['writer_ok'] else 'WRITER'}] {fname}", file=sys.stderr)

    ok = [f for f in fixtures if f["writer_ok"]]
    manifest = {
        "generator": "scripts/kernel_compare/gen_blends.py",
        "versions": {"smlibpy": sp.__version__, **occt._versions()},
        "tolerances": {"area_rel": args.tol_area, "volume_rel": args.tol_volume, "faces": "exact"},
        "stamp_normalised_to": FIXED_STAMP,
        "render_headless": render_ok if not args.no_render else None,
        "render_error": render_err,
        "summary": {
            "fixtures": len(fixtures),
            "writer_ok": len(ok),
            "writer_failed": sum(1 for f in fixtures if not f["writer_ok"] and f.get("source")),
            "authoring_failed": len(gaps),
        },
        "authoring_gaps": gaps,
        "fixtures": fixtures,
    }
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")

    # one-line-per-fixture table to stdout (log), manifest is the product
    print(f"{'file':34} {'ok':5} {'src_area':>12} {'smlib_area':>12} {'occt_area':>12} {'src_vol':>13} {'occt_vol':>13} faces")
    for f in fixtures:
        if not f.get("source"):
            print(f"{f['file']:34} {'AUTH-FAIL':5} {f['excluded_reason']}")
            continue
        s, a, b = f["source"], f["reimport_smlib"], f["reimport_occt"]
        print(f"{f['file']:34} {str(f['writer_ok']):5} {s['area']:12.4f} {a.get('area') or float('nan'):12.4f} "
              f"{b.get('area') or float('nan'):12.4f} {s['volume']:13.3f} {b.get('volume') or float('nan'):13.3f} "
              f"{s['faces']}/{a.get('faces')}/{b.get('faces')}")
    print(json.dumps(manifest["summary"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
