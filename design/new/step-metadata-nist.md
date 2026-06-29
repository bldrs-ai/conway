# STEP semantic metadata → Share NavTree (NIST PMI corpus)

**Status:** proposal / plan
**Branch:** `claude/nist-step-metadata-plan-ew2ere`
**Companions:**
[`step-support.md`](step-support.md) (geometry parity + AP203/AP242 rollout),
[`step-regression.md`](step-regression.md) (geometry regression digest),
[`web-ifc-compat-surface.md`](web-ifc-compat-surface.md) (the API seam Share consumes)
**Corpus:** `bldrs-ai/test-models` → `step/nist/` (NIST MBE PMI files, added Mar 2024 / this branch)

---

## Why

Conway's STEP path produces **geometry only**. When Share loads a STEP
file the NavTree is effectively empty/flat and parts can't be named,
selected, permalinked, or commented — the thing that makes a model
*useful* in Share. The IFC path gets this for free because Conway emits a
spatial structure + properties; STEP does not.

Concretely, the gap is **not** in Share. Share's NavTree, selection,
permalink URL scheme, Properties panel, and type filter are all
format-agnostic — they consume whatever `getSpatialStructure()` /
`getItemProperties()` Conway returns, keyed on `expressID`
(`Share/src/Components/NavTree/NavTreePanel.jsx`,
`Share/src/Containers/CadView.jsx`). They light up automatically the
moment Conway returns a real tree with real names.

The gap is two Conway facts:

1. **No product-structure / property extraction.** AP214 emits a
   geometry scene (`AP214SceneBuilder`) and a product↔shape map
   (`AP214ProductShapeMap`, populated only during geometry extraction).
   The assembly tree (`next_assembly_usage_occurrence`), part names
   (`product.name`), and the property chains
   (`general_property` → `property_definition` →
   `descriptive_representation_item`) are **parsed into entity classes
   but never traversed.** There is no AP214 analog of
   `ifc_property_extraction.ts`.

2. **The compat surface Share reads is a stub.**
   `src/compat/web-ifc/ap214_properties.ts` —
   `getSpatialStructure()` returns `products[0]` as the only root and
   pushes **every** `shape_definition_representation` as a flat,
   nameless `'shape_definition'` child. No hierarchy, no `Name`,
   no `LongName`. `getPropertySets()`, `getAllItemsOfType()`,
   `getTypeProperties()`, `getMaterialsProperties()` all return `[]`.
   `getItemProperties()` returns the raw entity line.

So a Share NavTree over any STEP file today is a single un-named root
with a flat list of un-named shape nodes. That is the whole problem.

This plan adds the missing extraction in Conway, exposes it through the
existing compat surface, references the NIST corpus as fixtures, and
structures the work into a **Simplified** tier (1.0 — navigable,
selectable, basic attributes) and a **Full** tier (1.x — semantic PMI /
GD&T), mirroring how NIST splits its own corpus.

---

## What NIST gives us

The NIST MBE PMI Validation & Conformance corpus (now under
`test-models/step/nist/NIST-PMI-STEP-Files/`, Git LFS) is purpose-built
to exercise model semantics, and NIST already tiers it for us.

### Test-case families

| Family | Files | What it is |
|---|---|---|
| **CTC** Combined Test Case | `nist_ctc_01..05` | Five distinct part geometries; a *combination* of PMI, **not** fully toleranced. The gentle tier. |
| **FTC** Fully-Toleranced Test Case | `nist_ftc_06..11` | Every feature fully controlled by GD&T against datum reference frames. The comprehensive tier. |
| **STC** Simplified Test Case | `nist_stc_06..10` | FTC with the complex/rare PMI removed (no datum targets). NIST's own "simplified" cut. AP242-e3. |

### File variants per case (the metadata ladder)

| Variant (folder / suffix) | Geometry | Product structure | PMI | Use for |
|---|---|---|---|---|
| `AP203 geometry only/ *_rb/rc/rd.stp` | B-rep | ✅ | none | Structure + naming baseline |
| `AP203 with PMI/ *_ap203.stp` | B-rep | ✅ | **graphical** (presentation) | + human-readable annotation geometry |
| `*_ap242-e1/e2/e3.stp` | B-rep | ✅ | **semantic** (representation) + graphical | + machine-readable GD&T |
| `*_ap242-e1-tg.stp` (ftc_08) | tessellated | ✅ | none | tessellated-geometry path |
| `as1-oc-214.stp` | B-rep | ✅ **multi-level assembly** | none | the canonical assembly-tree fixture |

- **Graphical PMI** = `draughting_callout`, `annotation_plane`,
  `tessellated_annotation_occurrence`, … — annotation *geometry* (curves
  + text) preserving exact appearance. Render-time, not tree metadata.
- **Semantic PMI** = `datum`, `datum_system`, `dimensional_size`,
  `tolerance_value`, geometric-tolerance entities — machine-readable, the
  Full tier.

`as1-oc-214.stp` (AP214 `AUTOMOTIVE_DESIGN`) is the classic AS1
assembly: 18 `product_definition`, 13 `next_assembly_usage_occurrence`,
nested sub-assemblies (`rod-assembly`, `nut-bolt-assembly`,
`l-bracket-assembly`) over leaf parts (`nut`, `bolt`, `rod`, `plate`,
`l-bracket`). It is the single best fixture for the assembly-tree walker
and should be the first thing the NavTree renders correctly.

---

## The STEP semantic model (what we must extract)

All line numbers below are from
`test-models/step/nist/.../nist_ctc_01_asme1_ap242-e1.stp` and
`as1-oc-214.stp`.

### A. Product / assembly structure → the NavTree

```
PRODUCT(id, name, description, frame_of_reference)
   ▲                                   #41=PRODUCT('rod-assembly','rod-assembly','',(#42))
PRODUCT_DEFINITION_FORMATION(id, description, of_product → PRODUCT)
   ▲
PRODUCT_DEFINITION(id, description, formation → PDF, frame_of_reference → PD_CONTEXT)
   │                                #5=PRODUCT_DEFINITION('design','',#6,#9)
   ├── NEXT_ASSEMBLY_USAGE_OCCURRENCE(id, name, description,
   │        relating_PD (parent), related_PD (child), reference_designator)
   │                          #751=NEXT_ASSEMBLY_USAGE_OCCURRENCE('1','nut_1','',#39,#742,$)
   │      (subtype of assembly_component_usage ⊂ product_definition_usage)
   └── PRODUCT_DEFINITION_SHAPE → SHAPE_DEFINITION_REPRESENTATION → shape_representation (geometry)

child placement in parent:
   CONTEXT_DEPENDENT_SHAPE_REPRESENTATION + ITEM_DEFINED_TRANSFORMATION
```

**Tree-build algorithm** (standard): nodes = `product_definition`s;
edges = NAUO `relating_PD → related_PD`. Roots = PDs that never appear as
a `related_PD`. Node label = `product.name` (fall back to NAUO `name` /
`reference_designator` for the occurrence). The same PD can occur
multiple times (instances) — each NAUO is a distinct tree occurrence with
its own placement, exactly the per-instance identity Share's picking
already models.

### B. Part attributes / properties → the Properties panel

```
GENERAL_PROPERTY(id, name, description)                 #4296=GENERAL_PROPERTY('','Modeled By',$)
   ▲  GENERAL_PROPERTY_ASSOCIATION → PROPERTY_DEFINITION
PROPERTY_DEFINITION(name, description, definition → PD)  #4331=PROPERTY_DEFINITION('Modeled By',$,#4368)
   ▼  PROPERTY_DEFINITION_REPRESENTATION
REPRESENTATION → DESCRIPTIVE_REPRESENTATION_ITEM(name, value)
                                                        #4346=DESCRIPTIVE_REPRESENTATION_ITEM('','Engineer')
```

Yields user-facing key/values: `Modeled By = Engineer`,
`CAGE Code = 64JW1`, `Company = ACME`. Plus NIST **validation
properties** carried as `property_definition`s:
`geometric validation property` (`volume`, `wetted area`, centroid via
`measure_representation_item`), `attribute validation property`,
`pmi validation property`. These map cleanly to property rows.

### C. Semantic PMI / GD&T → Full tier (per-feature metadata + nodes)

```
SHAPE_ASPECT(name, …, of_shape → product_definition_shape)   feature anchor
   ├── DATUM_FEATURE / DATUM / DATUM_SYSTEM                   #37=DATUM('',$,#4269,.F.,'A')
   ├── DIMENSIONAL_SIZE / DIMENSIONAL_LOCATION
   │       → DIMENSIONAL_CHARACTERISTIC_REPRESENTATION → SHAPE_DIMENSION_REPRESENTATION
   ├── *_geometric_tolerance(...) → DATUM_SYSTEM
   └── TOLERANCE_VALUE / PLUS_MINUS_TOLERANCE                 #58=TOLERANCE_VALUE(#72,#71)
```

These attach to features (`shape_aspect`) of a part and become either
selectable annotation nodes under the part or a structured PMI table on
the part's Properties panel.

---

## Coverage: have vs. gap

Mirrors the [IFC Coverage wiki](https://github.com/bldrs-ai/conway/wiki/IFC-Coverage)
approach (entity-by-entity status), grouped by tier. Legend:
✅ parsed **and** extracted · 🟡 parsed into entity class, **not**
traversed/extracted · ❌ not parsed (schema/detector gap).

### Simplified tier (1.0 target)

| Entity | AP214 | AP242 | Status today | Needed for |
|---|---|---|---|---|
| `product` (name/desc) | gen ✅ | ❌* | 🟡 | tree labels |
| `product_definition` | gen ✅ | ❌* | 🟡 | tree nodes |
| `product_definition_formation` | gen ✅ | ❌* | 🟡 | versioning row |
| `next_assembly_usage_occurrence` (125) | gen ✅ | ❌* | 🟡 | tree edges |
| `assembly_component_usage` / `reference_designator` | gen ✅ | ❌* | 🟡 | occurrence names |
| `product_definition_shape` | gen ✅ | ❌* | 🟡 (geom only) | node→geometry link |
| `shape_definition_representation` | gen ✅ | ❌* | ✅ geom / 🟡 tree | node→geometry link |
| `context_dependent_shape_representation` + `item_defined_transformation` | gen ✅ | ❌* | ✅ (geom xform) | occurrence placement |
| `general_property` (+`_association`) | gen ✅ | ❌* | 🟡 | properties |
| `property_definition` (+`_representation`) | gen ✅ | ❌* | 🟡 | properties |
| `descriptive_representation_item` | gen ✅ | ❌* | 🟡 | property values |
| `measure_representation_item` (validation) | gen ✅ | ❌* | 🟡 | volume/area rows |

\* **AP242 detection/parse is itself a gap** — see §"The AP242 wrinkle".
The entity *names* in the AP242 MIM overlap AP214 heavily, so most of the
above parse through the AP214 vtable once detection routes AP242 there;
the table's AP242 ❌ is "not yet *reached*," not "fundamentally absent."

### Full tier (1.x target)

| Entity group | Status | Notes |
|---|---|---|
| `shape_aspect` / `composite_shape_aspect` | 🟡 | feature anchors |
| `datum` / `datum_feature` / `datum_system` / `datum_reference_compartment` | 🟡 | GD&T datums |
| `dimensional_size` / `dimensional_location` / `dimensional_characteristic_representation` / `shape_dimension_representation` | 🟡 | dimensions |
| `*_tolerance` (geometric tolerance family) | 🟡 | GD&T callouts |
| `tolerance_value` / `plus_minus_tolerance` | 🟡 | ± tolerances |
| graphical PMI (`draughting_callout`, `annotation_plane`, `tessellated_annotation_occurrence`, …) | 🟡 | render as annotation geometry (separate effort) |

The first deliverable is a **measured** version of these tables — see
Phase 0.

---

## Target architecture

Two new Conway extraction modules, mirroring the IFC precedent
(`src/ifc/ifc_property_extraction.ts`), feeding the **existing** compat
surface — nothing new in Share.

```
AP214StepModel  (parsed entities — already exists)
   │
   ├── AP214ProductStructureExtraction        (NEW)
   │      walks product / product_definition / NAUO  → assembly tree
   │      resolves product.name + reference_designator → labels
   │      links PD → product_definition_shape → shape_representation → scene geometry
   │      → ProductStructureTree { expressID, type, name, children, shapeIds }
   │
   ├── AP214PropertyExtraction                 (NEW)
   │      walks general_property / property_definition_representation
   │      → Map<productDefExpressID, {name, value}[]>  (+ validation props)
   │
   └── AP214PmiExtraction                       (NEW, Full tier)
          walks shape_aspect / datum* / dimensional* / tolerance*
          → Map<featureExpressID, PmiCallout[]>

src/compat/web-ifc/ap214_properties.ts   (REWRITE the stub)
   getSpatialStructure() → ProductStructureTree  (named, nested, expressID-keyed)
   getItemProperties(id) → entity line + merged extracted properties
   getPropertySets(id)   → property + validation + PMI rows for that element
   getAllItemsOfType()   → back by the type index

→ reaches Share via the web-ifc compat surface (web-ifc-compat-surface.md).
   Share renders it unchanged.
```

**Why this shape**
- `getSpatialStructure` node contract is already what Share wants:
  `{ expressID, type, Name|LongName, children }`
  (`Share/src/loader/bldrsSpatialTree.js` `serializeNode` preserves
  exactly these). Emit `Name` from `product.name`.
- `expressID` is the selection/permalink key end-to-end. The product
  **occurrence** (NAUO), not just the product, must carry a stable
  expressID so two instances of the same part are distinct nodes and
  distinct permalinks. Reconcile this with the geometry path's
  `relatedElementLocalId` / `TriangleElementMap` so a NavTree click
  highlights the right instance and a viewport pick selects the right
  tree node. **This identity reconciliation is the main correctness risk
  — call it out in review.**
- The product↔shape data already exists in `AP214ProductShapeMap`; the
  new extractor should consume/extend it rather than re-derive.

### The AP242 wrinkle

`format_detection/model_format_detector.ts` knows only
`AUTOMOTIVE_DESIGN → AP214` and `CONFIG_CONTROL_DESIGN → AP203`. The NIST
files are `FILE_SCHEMA('AP242_MANAGED_MODEL_BASED_3D_ENGINEERING_MIM_LF…')`
— **undetected today**, so they don't load through the model loader at
all. There is no AP242 entity tree (step-support.md Phase 5).

For metadata 1.0 we do **not** need full AP242. The product-structure and
`general_property` entities we need are shared with AP214's MIM. Pragmatic
path (mirrors the existing AP203→AP214 fall-through):

1. Add AP242 schema detection → route to the AP214 parser as an interim.
2. Phase 0 measures what actually survives that routing on the real NIST
   files (which entities `MISSING_TYPE`, whether structure + properties
   come through with unknowns skipped).
3. If structure+properties survive (likely — they're MIM-standard), 1.0
   ships on the AP214 parser. AP242-only semantic-PMI entities that don't
   parse are deferred to the Full tier / the real AP242 gen tree
   (step-support.md Phase 5).

This keeps 1.0 scoped to "navigable + selectable + basic attributes" on
the **whole NIST corpus + real AP203/AP214 assemblies**, without blocking
on an AP242 codegen.

---

## Fixtures: referencing the NIST corpus

Two tiers, matching `step-regression.md`.

### Hermetic (in conway `data/`, runs in `yarn test` / precommit)

Small, checked-in, no `test-models` round-trip:

- [ ] `data/as1-assembly.step` — a referential reduction of
      `as1-oc-214.stp` (or the file itself if size allows). Drives the
      assembly-tree unit test: assert the walker yields the
      nut/bolt/rod/plate/l-bracket hierarchy with correct nesting and
      names, and that instance occurrences are distinct nodes.
- [ ] `data/nist-ctc-properties.step` — a reduction of a CTC AP242 file
      keeping the `general_property` chain. Drives the property-extraction
      unit test: `Modeled By=Engineer`, `CAGE Code=64JW1`, `Company=ACME`,
      and a `volume` validation property.
- [ ] (Full tier) `data/nist-ftc-pmi.step` — minimal datum + tolerance
      chain for the PMI extractor.

Reductions must be validated with the `ap214` CLI before commit
(referential integrity is easy to break by hand) — same caution
`step-regression.md` raises for the mixed-unit fixture.

### Golden corpus (in `test-models`, heavy CI job)

The NIST files already live at
`test-models/step/nist/NIST-PMI-STEP-Files/` (Git LFS). Extend the STEP
regression plan (`step-regression.md` Tier 2) with a **metadata digest**
alongside the geometry digest:

- [ ] New digest = stable serialization of the extracted tree
      (`expressID`,`name`,`parentExpressID` sorted) + the property
      key/values. Hash it like the geometry digest; diff against a
      checked-in baseline.
- [ ] Walk `test-models/step/nist/**` in the heavy job (NIST AP203 +
      AP242 variants give natural matrix coverage).
- [ ] `test-models` side: generate + commit baselines once the extractor
      is correct (out of scope for conway-only sessions — see
      step-regression.md "test-models side").

A metadata regression (tree collapses to flat, names drop, a property
chain stops resolving) then fails CI the same way a geometry cluster
regression does.

---

## Phased plan

Ordered so the first user-visible win (a real, named, navigable tree for
`as1` and the NIST CTCs) lands as early as possible.

### Phase 0 — Measure (the coverage spike)
- [ ] Wire the NIST corpus + `as1-oc-214.stp` as conway fixtures (LFS pull
      or reductions).
- [ ] Add AP242 schema detection → AP214-parser routing (interim).
- [ ] Run every NIST variant + `as1` through the loader; record per-file:
      parse result, `MISSING_TYPE` entities, product/PD/NAUO counts,
      `general_property` counts, what `getSpatialStructure` returns today.
- [ ] Publish the result as the **measured** coverage tables above (the
      STEP analog of the IFC Coverage wiki). This *is* the
      "compare against what we support" deliverable.

### Phase 1 — Simplified tier: assembly tree + names (1.0 core)
- [ ] `AP214ProductStructureExtraction`: product/PD/NAUO walk → nested
      tree; roots = PDs never a `related_PD`; labels from `product.name`
      / `reference_designator`.
- [ ] Reconcile occurrence `expressID` with geometry
      `relatedElementLocalId` / `TriangleElementMap` for pick↔tree
      round-trip.
- [ ] Rewrite `ap214_properties.ts::getSpatialStructure` to return the
      real nested, named tree (drop the flat `shape_definition` stub).
- [ ] Hermetic `as1` tree test.

### Phase 2 — Simplified tier: properties
- [ ] `AP214PropertyExtraction`: `general_property` /
      `property_definition_representation` /
      `descriptive_representation_item` → key/values; validation
      properties (volume/area).
- [ ] Implement `getItemProperties` (merge) + `getPropertySets` (real
      rows) in the compat layer; back `getAllItemsOfType` with the type
      index.
- [ ] Hermetic CTC property test.

### Phase 3 — Wire through to Share + verify
- [ ] Confirm the metadata reaches Share through the web-ifc compat
      surface (depends on `web-ifc-compat-surface.md` publishing path /
      adapter republish — see "Cross-repo seam").
- [ ] Verify in Share against the live NIST files in `test-models`:
      NavTree shows named hierarchy, click ⇄ pick, permalink to a part,
      comment on a part, Properties panel populated.
- [ ] GLB-cache parity: `bldrsSpatialTree.js` /
      `bldrsElementProperties.js` already serialize the generic node +
      property shapes — confirm the STEP tree/properties survive a cache
      round-trip.

### Phase 4 — Metadata regression gate
- [ ] Metadata digest in the STEP regression runner (extends
      `step-regression.md`); baselines in `test-models`; heavy-job CI.

### Phase 5 — Full tier: semantic PMI (1.x)
- [ ] `AP214PmiExtraction`: `shape_aspect` / `datum*` / `dimensional*` /
      `tolerance*` → per-feature PMI; surface as annotation nodes and/or a
      PMI table on the part.
- [ ] Decide whether full semantic PMI needs the real AP242 gen tree
      (step-support.md Phase 5) — likely yes for AP242-only entities the
      AP214 vtable can't parse.
- [ ] STC files (NIST's own "simplified" PMI) are the gentle on-ramp;
      FTC files are the full target.

### Phase 6 — Graphical PMI (separate, optional)
- [ ] Render `draughting_callout` / `tessellated_annotation_occurrence`
      as annotation geometry. This is a rendering effort, not tree
      metadata; sequence after the semantic tiers.

---

## Cross-repo seam (release-chain dependency)

Conway metadata only reaches Share through the `web-ifc`-compatible
`IfcAPI` (`IfcApiProxyAP214` → `ap214_properties.ts`). Today Share reaches
Conway via the separately-versioned `conway-web-ifc-adapter`, **pinned to
an old Conway** (`web-ifc-compat-surface.md`): improvements here are
invisible to Share until either the adapter is republished or the
compat-surface-in-Conway migration lands. **Phases 1–2 (Conway
extraction) are independent and can land first**; Phase 3 (Share
visibility) is gated on that release path. Track it as the one ordering
dependency, exactly as `step-regression.md` tracks the test-models
baseline dependency.

---

## Open questions / decisions

- **1.0 line.** Recommend: 1.0 = Simplified tier (Phases 0–4) — navigable,
  named, selectable, basic + validation properties — across the full NIST
  corpus and real AP203/AP214 assemblies. Full semantic PMI (Phase 5) is
  1.x. (This answers step-support.md's "AP242 in scope for first cut?"
  open question: *detection + structure subset yes; full AP242 PMI no.*)
- **AP242 strategy.** Interim AP214-parser routing for 1.0 vs. waiting on
  the AP242 gen tree. Recommend interim routing, gated on the Phase 0
  measurement of what survives.
- **Occurrence identity.** What stable `expressID` does a NAUO occurrence
  expose, and how does it reconcile with `TriangleElementMap` so
  tree↔viewport selection is bidirectional? This is the load-bearing
  design decision in Phase 1.
- **PMI presentation in Share.** Annotation nodes in the tree vs. a PMI
  table on the Properties panel vs. rendered callouts — UX decision for
  Phase 5/6, deferrable.
