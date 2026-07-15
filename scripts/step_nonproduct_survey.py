#!/usr/bin/env python3
"""Survey STEP files for product vs non-product ("below product level") semantics.

Backs the scoping study in design/new/step-nonproduct-semantics.md (issue #351).

For each file, counts product-structure entities (PRODUCT, PRODUCT_DEFINITION,
NEXT_ASSEMBLY_USAGE_OCCURRENCE) against geometry/annotation entities that carry
identity or semantics but have no product identity: named MANIFOLD_SOLID_BREPs,
SHAPE_ASPECTs, and per-face/per-solid STYLED_ITEMs. Handles multi-line records.

Usage: python3 scripts/step_nonproduct_survey.py model.step [more.step ...]
"""
import re
import sys
from collections import Counter, defaultdict

SOLID_TYPES = (
    'MANIFOLD_SOLID_BREP', 'BREP_WITH_VOIDS', 'FACETED_BREP',
    'SHELL_BASED_SURFACE_MODEL',
)

PLACEHOLDER_NAMES = ('', 'NONE', 'UNKNOWN')


def parse_records(path):
    """Yield (id, type_name, body) for each top-level record."""
    with open(path, 'r', errors='replace') as f:
        text = f.read()
    for m in re.finditer(r'#(\d+)\s*=\s*([A-Z_0-9]*)\s*\((.*?)\)\s*;',
                         text, re.S):
        yield int(m.group(1)), m.group(2), m.group(3)


def first_string(body):
    m = re.match(r"\s*'((?:[^']|'')*)'", body)
    return m.group(1) if m else None


def refs(body):
    return [int(x) for x in re.findall(r'#(\d+)', body)]


def is_named(name):
    return bool(name) and name.upper() not in PLACEHOLDER_NAMES


def analyze(path, label):
    counts = Counter()
    names_by_type = defaultdict(list)
    type_by_id = {}
    styled_targets = []
    shape_aspect_names = []

    for eid, etype, body in parse_records(path):
        type_by_id[eid] = etype
        counts[etype] += 1
        if etype in SOLID_TYPES:
            names_by_type[etype].append(first_string(body) or '')
        if etype == 'STYLED_ITEM':
            r = refs(body)
            if r:
                # The styled target is the record's last reference (the `item`).
                styled_targets.append(r[-1])
        if etype == 'SHAPE_ASPECT':
            shape_aspect_names.append(first_string(body) or '')

    styled_by_type = Counter(type_by_id.get(t, '?') for t in styled_targets)

    solids = sum(counts[t] for t in SOLID_TYPES)
    named_solids = [n for t in SOLID_TYPES for n in names_by_type[t]
                    if is_named(n)]
    named_aspects = sum(1 for n in shape_aspect_names if is_named(n))

    products = counts['PRODUCT']

    print(f'=== {label}')
    print(f'  products={products} product_defs={counts["PRODUCT_DEFINITION"]} '
          f'nauo={counts["NEXT_ASSEMBLY_USAGE_OCCURRENCE"]}')
    print(f'  solids={solids} named_solids={len(named_solids)} '
          f'advanced_faces={counts["ADVANCED_FACE"]}')
    print(f'  styled_items={counts["STYLED_ITEM"]} targets={dict(styled_by_type)}')
    print(f'  shape_aspects={counts["SHAPE_ASPECT"]} named_aspects={named_aspects}')
    # >1 solid per product means geometry identity lives below the product level.
    print(f'  solids_per_product={solids / max(1, products):.1f}')
    sample = sorted(set(named_solids))[:12]
    if sample:
        print(f'  sample_solid_names={sample}')
    sample_sa = sorted(set(n for n in shape_aspect_names if is_named(n)))[:8]
    if sample_sa:
        print(f'  sample_aspect_names={sample_sa}')
    print()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    for file_path in sys.argv[1:]:
        file_label = file_path.split('/')[-1]
        try:
            analyze(file_path, file_label)
        except OSError as e:
            print(f'=== {file_label}: ERROR {e}\n')
