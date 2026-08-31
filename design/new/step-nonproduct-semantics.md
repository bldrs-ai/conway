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
2. **Below-product semantics are common, and the tree-worthy signal is
   *named* sub-solids.** In a 12-model survey, 4 models carry significant
   geometry identity below the product level, but they split into two very
   different shapes: MCAD multibody parts whose solids carry meaningful *names*
   (the NEMA case), and large *anonymous* solid dumps (ECAD merged-component
   products, tessellated surface soup) that carry no navigable semantics.
   **Implemented: a layer of ephemeral solid-level nodes beneath each
   multibody product** (on by default since conway#628) — named solids
   surface with their file names, small unnamed sets get positional labels,
   oversized all-unnamed sets are suppressed (with the count reported), and
   per-face styling stays pick-only. Each such node, and the geometry under
   it, is keyed by an occurrence path ending in the solid's own express id.

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

Two distribution details matter (confirmed against Share's rendering of both
models):

- **Arty Z7 decomposes well at the product level** — its 55 products / 102
  NAUOs are the components (switches, jacks, LEDs, headers), and the NavTree is
  already rich. The below-product mass is concentrated in two representations
  holding 535 and 654 *unnamed* solids (bare-board / merged-group products, a
  common ECAD export shape). Those dumps carry no names and no navigable
  semantics — promoting them would flood an otherwise-good tree.
- **DSA2 is a single keyboard key** whose handful of logical parts (a few
  fasteners, the key faces) are modeled as *nothing nameable*: the whole
  110 MB model is one product over 28,674 unnamed single-face
  `SHELL_BASED_SURFACE_MODEL`s. There is no identity in-file to promote; the
  NavTree shows one node, and any per-solid layer must not change that.

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
semantics. Named sub-solids (the MCAD multibody pattern) deserve tree nodes;
anonymous solid dumps do not.**

## Implemented: the ephemeral solid layer

> **Updated by conway#628 (test-models-private#98).** The layer is now
> **on by default**, its per-product hard cap is gone, and a solid node's
> occurrence path ends with the solid's own express id. What forced all
> three: `BLSN_007.stp`, a 281 MB Rhino 7 / ST-DEVELOPER hull export that is
> **one product, zero NAUOs, zero CDSRs and 2,268 individually named
> bodies** — the multibody pattern as the *entire* model rather than a
> detail of one part in an assembly. With the layer opt-in, Share got a
> one-node tree; with the path carrying no per-body segment, all 2,268 hull
> bodies collapsed onto two selections; with a 256 cap, seven eighths of them
> would have had no node even so, while Autodesk's viewer lists every one. See
> §"conway#628: identity below the product" below for the resulting rules.

`AP214ProductStructureExtraction.extractProductStructure` and the compat
surface's `getSpatialStructure` take a
`ProductStructureOptions.includeSolids` /
`SpatialStructureOptions.includeSolids` option (default **true**; pass
`false` for a products-only outline):

- **What becomes a node**: each solid representation item
  (`manifold_solid_brep` — covering `brep_with_voids` / `faceted_brep` —
  `shell_based_surface_model`, `face_based_surface_model`) reached from a
  product's `shape_definition_representation`, including through *plain*
  `shape_representation_relationship` indirection (the NEMA motor's solids are
  only reachable that way). Transformation-bearing relationship variants are
  assembly placements and are excluded — following them would leak every child
  part's solids into its parent assembly.
- **Node shape**: `type: 'solid'`, `ephemeral: true`, as children of each
  owning product/occurrence node, so Share can render them lighter-weight
  (selectable-but-not-product). Name from the solid's own name when meaningful
  (`Boss-Extrude7`), else a positional fallback (`Solid 3 of 10`).
- **Identity**: the `occurrencePath` alone — the parent occurrence's NAUO
  chain (which disambiguates instances of a multibody part used twice) plus
  the solid's own express id as a final segment (which disambiguates the
  bodies of one instance). The express id is stable in-file, satisfying the
  permalink requirement from the occurrence-identity work. This was the
  `(occurrencePath, expressID)` *pair* until conway#628; a pair is not what
  the scene stamps on a mesh, so a pick could not be resolved by path
  comparison alone.
- **Pick ⇄ tree round-trip is nearly free**: the geometry pipeline already
  emits one canonical mesh keyed by the solid's own localID, so an ephemeral
  node maps 1:1 onto an existing pickable scene mesh.
- **Heuristics** (the survey's two shapes, encoded), all-or-nothing per
  product:
  - a product with fewer than 2 solids gets no children — the product node
    already maps 1:1 onto its body (as1, jet engine, … are unchanged);
  - an *all-unnamed* set larger than `maxUnnamedSolidsPerProduct`
    (default 32) is suppressed entirely — anonymous dumps carry no navigable
    semantics (Arty's mega-products, DSA2's shells) — and reports the count
    via the node's `droppedSolids`, so a consumer can render an "N more…"
    affordance instead of silently truncating;
  - a *named* set is emitted in full however large it is. The 256-solid
    `maxSolidsPerProduct` cap that used to bound it is gone: partial
    emission is not a smaller tree but a broken one, because the geometry
    walk stamps a per-body path for the same set the tree emits, so the
    capped-off bodies keep paths that resolve to no node. Either every body
    of a product is addressable or the product node is what a pick on any of
    them resolves to.
- **Not nodes**: per-face styling (254 styled faces on NEMA, 28,674 on DSA2)
  stays hover/pick-only. Named `shape_aspect`s (MBD datums, e.g. `MBD_A` in
  the NIST PMI files) are a worthwhile *future* second ephemeral kind, behind
  the same flag.

Verified against the survey corpus with `includeSolids: true`:

| Model | Product nodes | Solid nodes added | Dropped (reported) |
| --- | ---: | ---: | ---: |
| NEMA 23 | 6 (unchanged) | 10 named bodies under the motor occurrence | 0 |
| Arty Z7 | 124 (unchanged) | 13 (small multibody components) | 1,189 across the 2 mega-products |
| DSA2 | 1 (unchanged) | 0 | 28,674 on the single root |
| BLSN_007 | 1 (unchanged) | 2,268 named hull bodies (1,884 breps + 384 shells) | 0 |

Hermetic coverage lives in `data/ap214-multibody-part.step` +
`ap214_product_structure_extraction.test.ts` (named multibody, per-occurrence
duplication, single-solid gate, transformation-relationship exclusion,
unnamed-soup suppression, all-or-nothing emission, tree/geometry identity-set
agreement) and `ap214_properties.test.ts` (compat-surface default + opt-out,
identity-row resolution, and the arbitrary-entity fallback for a body with no
node of its own).


## conway#628: identity below the product

BLSN_007 broke the layer's two standing assumptions at once — that the
product tree is the interesting part of a STEP file, and that a body's
identity is a *pair* the consumer assembles rather than something conway
emits. Three rules came out of it. They are stated in terms of what a
consumer can rely on, because that is what makes them testable.

**1. The occurrence path is the whole selection key.** Every geometry
instance the scene emits carries one, and it equals the path of the tree
node that instance belongs to. The path is NAUO ids, ending in the body's
own express id when the body is individually addressable. Nothing else is
ever a segment — in particular a plain `shape_representation_relationship`
is not, because it binds a part to its own detail representation and the
tree has no node for it. (It used to be one: NEMA motor bodies carried
`[14107, 6611]`, a NAUO followed by a relationship, which resolved to no
node and was the *same* path for all ten bodies.)

**2. One decision, read by both sides.**
`identityBearingSolidExpressIDs()` names the bodies that get their own
segment; `extractProductStructure` emits a node for exactly that set, and
`AP214GeometryExtraction.prepareDemandExtraction` consults it in its item
loop. This is why the heuristics above are all-or-nothing: any rule that
emits a node for some of a product's bodies and not others makes the
suppressed bodies' paths unresolvable. `ap214_product_structure_extraction.test.ts`
pins the two sides against each other directly.

Being read on every load, that scan is also held to the geometry walk's
containment bar: a record whose getters throw — a dangling reference (the
normal state of a mid-parse prefix model), or a representation holding an
item type the AP214 enum has no id for, which is *every* tessellated entity
— skips, rather than failing the model. `items` is read all-or-nothing per
representation, so a representation that cannot be enumerated contributes
to neither side and its bodies simply stay part of the product's selection.
`data/ap214-recoverable-scan-records.step` carries all three shapes.

**3. An SDR-bound representation is never the child of a plain relationship
edge.** BLSN_007 writes the same kind of relation both ways round — three
edges as `(product rep, detail rep)` and 308 as `(detail rep, product rep)`.
Read literally, those 308 make the product's own representation a child of
308 free wireframe representations, so it becomes 308 walk roots and the
whole model is re-walked and re-placed once per root: **698,544 scene nodes
for 2,268 bodies, sharing 616 paths**. The geometry walk therefore orients
such an edge by SDR-boundness (the SDR-bound side is the shape *of* a part,
so it is the parent) — but only when the relationship carries no
transformation, since reversing a placement without evidence would move
geometry, and a duplicated placement is the lesser failure. After the fix:
2,268 scene nodes, 2,268 distinct paths, 2,268 tree leaves, paths equal.
`data/ap214-inverted-srr-multibody.step` is that shape reduced to three
bodies and three inverted edges.

The reorientation is **single-hop**: it asks whether each side of the edge
is *directly* SDR-bound, not whether it can reach a PDS transitively the
way `resolvePdsLocalID` (the conway#597 machinery) does. An inverted chain
two or more edges long is therefore left as written. That is a decision,
not an oversight — no file in the corpus has that shape (BLSN_007's 308
edges are all one hop off the product representation), and past one hop
both sides usually reach *some* PDS, so the question stops being "which
side is SDR-bound" and becomes a distance comparison carrying the same
equidistant ambiguity `resolvePdsLocalID` deliberately refuses to guess at.
If a real file ever needs it, that function is what to build on, and it
needs a fixture before it needs code.

None of this changes tessellation: the regression digest is one row per
canonical mesh, so BLSN_007's 2,268-row baseline is byte-identical across
the change (verified), as are as1, NEMA and the multibody fixture.

## Reproducing the survey

```
python3 scripts/step_nonproduct_survey.py path/to/model.step [more.step …]
```

Models used: `nema.step` plus `as1-oc-214.stp`, `a-gear.step`, `supercap.step`,
`Equiptment_UltrasoundProbe.step`, `Equiptment_SyringePumpSystem.step`,
`nist_ctc_02_asme1_ap242-e2.stp`, `Assem_gearbox_v4 v3.step`,
`driver board.step`, `Jetenginestep.stp`, `Arty_Z7.stp`, `DSA2.step` from
[bldrs-ai/test-models](https://github.com/bldrs-ai/test-models).
