# STEP non-product semantics: scoping for pickable sub-parts in the NavTree

Scoping study for [issue #351](https://github.com/bldrs-ai/conway/issues/351):
the NEMA 23 stepper-motor model surfaces only 4 logical parts in the NavTree
while the scene contains dozens of hover-highlightable sub-parts. Two questions
were posed: (1) is that an extraction gap or genuine non-product geometry, and
(2) how common is significant below-product semantics in real STEP assemblies —
common enough to justify surfacing ephemeral pickable nodes in the tree?

## TL;DR

1. **Not an extraction gap.** The NEMA file contains exactly 3 `product`s and
   5 NAUOs, and `AP214ProductStructureExtraction` returns exactly that tree
   (verified by running the extraction against the file). The motor's internals
   are **10 named `MANIFOLD_SOLID_BREP`s** (SolidWorks multibody names like
   `Boss-Extrude8[1]`, `M3 Tapped Hole2`) plus **254 per-face `STYLED_ITEM`s**
   inside the *single* motor product's shape representation. They have no
   product identity in the file; there is nothing more to extract at the
   product level.
2. **Below-product semantics are common and sometimes dominant.** In a
   12-model survey, 4 models carry significant geometry identity below the
   product level, and in 2 of them (an ECAD board, a monolithic export) the
   product tree collapses to almost nothing while the scene holds hundreds to
   tens of thousands of individually pickable solids. **Recommendation: yes —
   surface an opt-in layer of ephemeral solid-level nodes beneath each
   product**, with lazy expansion / capping for degenerate cases, and do *not*
   surface per-face styling as tree nodes.

## Q1 — the NEMA file: genuine non-product geometry

Model: `test-models/main/step/grabcad/cnc-router-with-nema23-stepper-motor-1.snapshot.2/NEMA 23 - 76mm.STEP`
(SolidWorks 2020 AP214 export, 1.08 MB).

Complete product structure in the file:

| Entity | Count | Contents |
| --- | --- | --- |
| `PRODUCT` / `PRODUCT_DEFINITION` | 3 | assembly `NEMA 23 - 76mm` (#3096), motor part `NEMA 23 - 76mm` (#12021), screw `pan head cross recess screw…` (#388) |
| `NEXT_ASSEMBLY_USAGE_OCCURRENCE` | 5 | NAUO1 assembly→motor, NAUO2–5 assembly→screw ×4 |
| `MANIFOLD_SOLID_BREP` | 11 | 10 in the motor's rep, 1 (`RecessCore`) in the screw's |
| `STYLED_ITEM` | 267 | 254 target `ADVANCED_FACE`, 11 target solids, 2 target whole representations |
| `SHAPE_ASPECT` | 0 | — |

The motor occurrence's shape representation (#11651) reaches, via
`SHAPE_REPRESENTATION_RELATIONSHIP` #6611, an
`ADVANCED_BREP_SHAPE_REPRESENTATION` (#14069) holding ten *named* solids:
`Boss-Extrude7`, `Boss-Extrude8[1..4]`, `Boss-Extrude9[1..4]`,
`M3 Tapped Hole2` — SolidWorks multibody feature/body names. These are the
motor body panels, leads, shaft, and end caps seen as separate
hover-highlightable pieces. None of them is referenced by any `product`,
`product_definition`, or NAUO.

Running `AP214ProductStructureExtraction.extractProductStructure()` on the file
yields precisely the in-file structure — root assembly, one motor occurrence,
four screw occurrences:

```
[product] "NEMA 23 - 76mm" expressID=3096 shapes=[7723]
  [product_occurrence] "NEMA 23 - 76mm" expressID=14107 pd=12021 shapes=[11651]
  [product_occurrence] "pan head cross recess screw_iso_ISO 7045 - M3 x 10 - Z - 10N" expressID=14108 pd=388
  [product_occurrence] … ×3 more screw occurrences (14109, 14110, 14111)
```

So the extraction is complete and correct; the NavTree faithfully mirrors the
file's product semantics. The richness the user sees in the viewport comes from
the geometry pipeline, which already emits **one canonical mesh per solid**
(`extractManifoldSolidBrep` keys the mesh by the brep's own localID) — which is
exactly why the sub-parts are individually hover-highlightable despite not
being in the tree.

## Q2 — survey: how common is below-product semantics?

12 models surveyed with `scripts/step_nonproduct_survey.py` (NEMA + 11 from
`bldrs-ai/test-models`, spanning SolidWorks/CATIA/Fusion MCAD, ECAD board
exports, NIST AP242 PMI parts, generated parts, and lab-equipment exports):

| Model | Products | NAUOs | Solids | Solids/product | Styled faces | Named shape aspects |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| NEMA 23 (SolidWorks assembly) | 3 | 5 | 11 (all named) | 3.7 | 254 | 0 |
| as1-oc-214 (classic AP214) | 9 | 13 | 5 | 0.6 | 0 | 0 |
| a-gear (zoo.dev generated) | 1 | 0 | 1 | 1.0 | 0 | 0 |
| supercap (electronics) | 4 | 22 | 2 | 0.5 | 0 | 0 |
| ultrasound probe | 1 | 0 | 1 | 1.0 | 0 | 0 |
| syringe pump system | 9 | 0 | 9 | 1.0 | 0 | 0 |
| gearbox (rx1 servo) | 18 | 30 | 13 (named) | 0.7 | 3 | 0 |
| jet engine (GrabCAD) | 10 | 148 | 9 | 0.9 | 0 | 0 |
| driver-board PCB | 320 | 319 | 279 | 0.9 | 0 | 0 |
| **nist_ctc_02 AP242 (PMI/MBD)** | 1 | 0 | 3 (named) | 3.0 | 637 | 5 (`MBD_A`…`MBD_ABC`) |
| **Arty Z7 (ECAD board)** | 55 | 102 | **1,242** | **22.6** | 3,919 | 0 |
| **DSA2 (monolithic export)** | 1 | 0 | **28,674** | **28,674** | 28,674 | 0 |

Key distribution detail for Arty Z7: two shape representations hold 535 and 654
solids respectively — i.e. **~96 % of the board's geometry lives under 2 of its
55 products** (bare-board + merged-components products, a very common ECAD
export shape). For DSA2, the *entire 110 MB model is one product*: the NavTree
would show a single node for 28,674 individually styled solids.

Patterns observed, by exporter/domain:

1. **MCAD multibody parts** (SolidWorks, CATIA): a part-level product whose
   representation holds several *named* solids — the names carry real feature /
   body semantics (`Boss-Extrude7`, `PartBody`, `Fill.1`, `Split.1`). This is
   the NEMA case.
2. **ECAD exports**: product structure stops at the board / component-group
   level; hundreds of unnamed but individually *colored* solids below
   (Arty Z7). Some ECAD exporters do model product-per-component (driver-board:
   320 products, clean) — it varies by tool, so the tree can't rely on it.
3. **AP242 PMI / MBD parts**: semantics attach to faces via `SHAPE_ASPECT`
   (named datums `MBD_A`, `MBD_B`, …) and thousands of styled annotation
   curves — meaningful identity below the product with *zero* assembly
   structure.
4. **Monolithic exports**: whole model in one product (DSA2). Degenerate but
   real; also the case where a product-only tree is most useless.

Meanwhile the "clean" cohort (as1, jet engine, gearbox, supercap, syringe pump,
generated parts) shows ~1 solid per product — for those files the current tree
is already the right answer and an ephemeral layer would add nothing (and
should therefore not clutter them: only emit ephemeral nodes where a product
has ≥2 solids, or a solid has a name).

**Bottom line: 4 of 12 real-world models carry significant non-product
semantics, and for 2 of them the product tree is effectively empty relative to
the scene. That is common enough to justify surfacing ephemeral pickable
nodes.**

## Recommendation

Extend `getSpatialStructure` (via `AP214ProductStructureExtraction`) with an
**opt-in ephemeral solid layer**:

- **What becomes a node**: each top-level solid representation item
  (`manifold_solid_brep`, `brep_with_voids`, `faceted_brep`,
  `shell_based_surface_model`) reached from a product's shape representation —
  including through `shape_representation_relationship` indirection (the NEMA
  motor's solids are only reachable that way). One node per solid, as a child
  of the owning product/occurrence node.
- **Node shape**: `type: 'solid'` plus an `ephemeral: true` flag so Share can
  render them lighter-weight (selectable-but-not-product). Name from the
  solid's own name when non-empty/non-`NONE` (`Boss-Extrude7`), else a
  positional fallback (`Solid 3 of 10`).
- **Identity**: `(occurrencePath, solid expressID)` — the occurrence path
  disambiguates instances of a multibody part used twice, and the solid's
  express id is stable in-file, satisfying the permalink requirement from the
  occurrence-identity work. No new identity scheme is needed.
- **Pick ⇄ tree round-trip is nearly free**: the geometry pipeline already
  emits one canonical mesh keyed by the solid's own localID, so an ephemeral
  node maps 1:1 onto an existing pickable scene mesh.
- **Suppress the layer where it adds nothing**: only emit ephemeral children
  when a product has ≥2 solids or a named solid, so clean product-per-part
  models (as1, jet engine, …) are unchanged.
- **Guard the degenerate cases**: DSA2 puts 28,674 solids under one product.
  Children of a single product should be lazily expanded and/or capped
  (e.g. materialize the first N with a "… 28,574 more" sentinel) rather than
  built eagerly into the tree payload.
- **Do not surface per-face styling as nodes**: 254 styled faces (NEMA) to
  28,674 (DSA2) would be pure noise; faces stay hover/pick-only. Named
  `shape_aspect`s (MBD datums) are a worthwhile *future* second ephemeral kind
  for AP242 PMI files, behind the same flag.

Estimated cost is small: `indexShapeRepresentations` already walks
`shape_definition_representation`s; the additions are a
`shape_representation_relationship` traversal and solid enumeration per
representation. No geometry-pipeline changes are required.

## Reproducing the survey

```
python3 scripts/step_nonproduct_survey.py path/to/model.step [more.step …]
```

Models used: `nema.step` plus `as1-oc-214.stp`, `a-gear.step`, `supercap.step`,
`Equiptment_UltrasoundProbe.step`, `Equiptment_SyringePumpSystem.step`,
`nist_ctc_02_asme1_ap242-e2.stp`, `Assem_gearbox_v4 v3.step`,
`driver board.step`, `Jetenginestep.stp`, `Arty_Z7.stp`, `DSA2.step` from
[bldrs-ai/test-models](https://github.com/bldrs-ai/test-models).
