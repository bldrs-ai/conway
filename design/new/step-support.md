# STEP file format support

Plan to take STEP (AP214 / AP203 / AP242) support from "works on the
happy path" to production parity with IFC.

The Nov–Dec 2025 in-flight work (schema detection for `CONFIG_CONTROL_DESIGN`
and explicit AP203 naming in the format detector and loader) has since
**landed on `main`**, along with the semantic-metadata track (see the scope
note below): AP242 detection→AP214 routing, AP214 product-structure + property
extraction (PR #345), and per-instance geometry occurrence-path stamping
exposed through the web-ifc shim (PR #353). This doc's *geometry-parity*
gaps below (AP203 sweep, AP242 gen tree, regression corpus) remain the open
work.

> **Scope note — this doc is about *geometry* parity.** The companion
> [`step-metadata-nist.md`](step-metadata-nist.md) covers the orthogonal
> *semantic metadata* track: extracting product/assembly structure, part
> names, and properties (and later semantic PMI) from STEP so Share's
> NavTree, selection, permalinks, and Properties panel work — using the
> NIST PMI corpus in `test-models/step/nist/`. The metadata work reuses
> this doc's parser/codegen foundation but is independently shippable.

## What's already shipped

- `src/AP214E3_2010/` — full AP214 (`AUTOMOTIVE_DESIGN`, ISO 10303-214):
  parser, scene builder, geometry extraction, material cache, product
  shape map, model/profile/curve helpers
- `src/AP214E3_2010/AP214E3_2010_gen/` — 1,100+ generated entity classes
- `src/AP214E3_2010/ap214_command_line_main.ts` — CLI mirroring
  `ifc_command_line_main.ts`: query by entity ID / type / field, geometry
  output to OBJ + glTF + GLB (Draco-compressed)
- `src/format_detection/model_format_detector.ts` — detects IFC, AP214
  (with or without version brace), and CONFIG_CONTROL_DESIGN → AP203,
  via regex over the quoted entries in `FILE_SCHEMA`
- `src/loaders/conway_model_loader.ts` — `loadModelWithScene()` is the
  single entry point; auto-routes to the right parser, returns
  `[Model, Scene]`
- `src/step/` — generic STEP parsing primitives (header, string/enum/ID
  parsers, vtable, type indexer)
- Per-instance **occurrence-path stamping** on extracted geometry (PR #353):
  each geometry instance from the AP214 assembly walk carries its ordered
  NAUO occurrence path, exposed to consumers as `PlacedGeometry.occurrencePath`
  through the web-ifc shim. This is the geometry-side half of the
  occurrence-identity join documented in
  [`step-metadata-nist.md`](step-metadata-nist.md) §"Occurrence identity".
- Test fixtures in `data/` (9 STEP files): geometry — `a-gear-with-3-inch…`,
  `create-a-tube.step`, `ap214-mapped-item-test.step`; assemblies —
  `as1-assembly.step`, `as1-oc-214.stp` (geometry-rich AS1, occurrence tests);
  schema/header minima — `config-control-design-min.step`,
  `ap203-mim-header-min.step`, `ap242-header-min.step`; properties —
  `nist-ctc-properties.step`

## Gaps to production

| # | Area | Severity | Notes |
|---|------|----------|-------|
| 1 | Public API surface | High | `src/index.ts` exports IFC types only. AP214 model / extraction / parser need stable named exports. |
| 2 | Regression coverage | High | No AP21x analog of `ifc_regression_main.ts` or `ifc_regression_batch_main.ts`. The 47-CSV golden corpus in `regression/test_models/` is IFC-only. |
| 3 | AP203 fall-through correctness | Low (measured) | The loader logs `"AP203 Step Detected, using AP214 loader"` and reuses the AP214 parser. Measured Aug 2026 over all 16 AP203 models in the corpus: 76 of 214,437 instances (0.035%) name a type the AP214 vtable has no slot for, none of them geometry-bearing, and zero errors attributable to the schema alias. See §"AP203 fall-through: measured" (#503). |
| 4 | AP242 | Medium | Not implemented. ISO 10303-242 supersets AP214 and is the modern PMI-bearing target; no detection, no entities, no parser. |
| 5 | Test models | Medium | `data/` now carries 9 STEP fixtures (incl. AP203/AP242 header minima, the AS1 assembly, and a CTC properties reduction). Still need broader *geometry* coverage: real-world AP203 CAD exports, AP242 PMI samples, the full NIST CAx-IF corpus (which lives in `test-models/step/nist/`, not `data/`). |
| 6 | AP214 test depth | Low | The metadata track added `ap214_product_structure_extraction.test` + `ap214_property_extraction.test` (and occurrence-path geometry tests, PR #353) on top of `ap214_step_model.test.ts` / `ap214_geometry_extraction.test.ts`. Still missing equivalents for block extraction and full scene-builder coverage. |
| 7 | Loader test coverage | Low | `conway_model_loader.ts` is exercised only indirectly via format detector tests. |

## Phased rollout

### Phase 1 — Land in-flight schema detection *(landed)*

- [x] Add a positive AP203 detection test — the detector now matches a
      `FILE_SCHEMA` entry starting `AP203` (NIST "AP203 geometry only" files),
      with fixture `data/ap203-mim-header-min.step`. AP242 detection→AP214
      routing also landed (`data/ap242-header-min.step`). See
      [`step-metadata-nist.md`](step-metadata-nist.md) §"Phase 0".
- [ ] Resolve the dropped `console.log(ParseResult[errorCode])` that the
      Nov rewrite removed — confirm nothing downstream depended on it
- [x] Merge the in-flight schema-detection branch → `main`

### Phase 2 — STEP regression infrastructure

> Detailed design: [`step-regression.md`](step-regression.md). Read its
> §"The digest" first — the STEP digest must hash **post-transform,
> assembled** geometry, not per-entity like IFC, or it passes on the #308
> assembly-clustering bug class.

- [ ] `src/AP214E3_2010/ap214_regression_main.ts` mirroring
      `ifc_regression_main.ts`: `-d` (digest CSV) + `-v` (verbose OBJ)
- [ ] `src/AP214E3_2010/ap214_regression_batch_main.ts` mirroring
      `ifc_regression_batch_main.ts`
- [ ] `regression/test_models/` extended with a STEP sub-corpus, or a
      sibling directory — decide layout (see Open Questions)
- [ ] Document the STEP regression command surface in
      `regression/README.md`
- [ ] CI: run STEP regression batch on PR builds, same gating as IFC

### Phase 3 — Public API export

- [ ] Decide the stable surface: e.g. `loadStepModel`, `AP214Model`,
      `AP214Scene`, `AP214GeometryExtraction`, `ModelFormatDetector`,
      `ModelFormatType`
- [ ] Re-export from `src/index.ts` with the agreed names
- [ ] Update `README.md` with a STEP parser tutorial section paralleling
      the IFC one
- [ ] TypeDoc coverage check on every new export

### Phase 4 — AP203 schema sweep

- [x] Enumerate AP203 entities that are not in the AP214 vtable —
      done Aug 2026, both statically and against the corpus. Numbers and
      method in §"AP203 fall-through: measured" below (#503).
- [ ] If divergence is small: extend AP214 model with conditional
      handling keyed off detected schema
- [ ] If divergence is large: generate a parallel `src/AP203_1994/` tree
      from the AP203 EXPRESS schema using the same code-gen pipeline
      that produced `AP214E3_2010_gen/`
- [ ] Acceptance: parse + geometry-extract three independently-sourced
      AP203 CAD exports with no parser errors

The measurement says **neither fork is currently earning its keep** —
the AP214 parser already reads every geometry- and product-structure-
bearing entity these files contain. The cheapest real improvement is
the diagnostic gap the measurement exposed (below), not schema work.

### Phase 5 — AP242 (ISO 10303-242)

- [ ] Source AP242 EXPRESS schema
- [ ] Run the code-gen pipeline against it; output to
      `src/AP242_2014/AP242_2014_gen/`
- [ ] `src/AP242_2014/` parser + scene builder + geometry extraction +
      CLI, mirroring the AP214 layout
- [ ] Format detector entry for `AP242_MANAGED_MODEL_BASED_3D_ENGINEERING`
      and other AP242 schema identifiers
- [ ] Regression coverage at parity with AP214

### Phase 6 — Performance baseline

- [ ] Throughput benchmark on a representative range: 9KB tube → 417KB
      gear → 10MB+ assembly → 100MB+ AP242 model
- [ ] Memory profile during geometry extraction; identify peaks
- [ ] Document expected AP214/IFC ratio at equivalent geometric
      complexity, so future regressions are visible

## STEP geometry semantics — field notes from the Aug 2026 burn-down

Durable findings from the geometry-correctness issue sweep (#458–#502 and
the conway-geom fixes they pulled in). These are spec- and
architecture-level facts that cost real debugging time to establish;
bug-specific history stays on the issues.

### Closed edges span their whole basis curve

An `EDGE_CURVE` whose start and end reference the **same** `VERTEX_POINT`
is a closed edge, and ISO 10303-42 reads it as spanning the *entire*
basis curve — trimming it by its endpoint positions collapses it to a
point. `isWholeCurveEdge` in `ap214_geometry_extraction.ts` gates the
recovery: it originally recognized only a b-spline control-point
heuristic and was extended to identical-vertex edges over any curve type
(#502). This is not exotic input — the OCCT exporter family writes torus
equators exactly this way (`EDGE_CURVE(#v,#v)` over
`SURFACE_CURVE(CIRCLE)`), which is what kept every torus at half
coverage in #461.

Relatedly, closed surfaces are often bounded by **seam edges walked in
both directions**, so the loop's *net* winding around the axis cancels
to zero. Detecting "this bound covers the full turn" needs the winding
*excursion* — running max minus min of the cumulative wrapped deltas —
not the net (conway-geom#169).

### Revolution faces: the sweep angle cannot come from centroids

`TriangulateRevolution`'s fallback measured the swept angle from one
centroid per boundary edge; the centroid of a full circle around the
axis lies **on** the axis and carries no angular information, so a
torus-style face measured a zero span. The recovery (conway-geom#169)
re-measures from the boundary samples themselves — winding excursion
plus `largestCircularGap` over both theta and profile-arclength — and
observes the degenerate-bound convention: a bound with no angular spread
(the seam, or the profile itself) means *covers the whole surface*, the
same convention the sphere's `VERTEX_LOOP` expresses one dimension down
(conway-geom#160). Known limitation: antipodal two-equator bounds tie
the gap choice (conway-geom#173).

### Spherical faces: pole placement decides whether blends survive

conway-geom's planar dual-parameterization projects through a pole; a
bound that touches the pole produces non-finite parameter coordinates,
and the face is dropped (guarded in `manifold_utils.h` — the guard
replaced a wasm-heap-exhausting CDT feed, see conway-geom#171). The
practical consequence: **every ⅛-sphere corner blend** on a filleted box
dies this way — `box-fillet-r8` renders at 79.3% of OCCT's reference
area, missing exactly its 8 corners. This is a triangulation-side
failure; it is *not* the pcurve planar-only gap (#505), which was ruled
out by probing the pcurve reject path against the same fixtures.

### Parser: `INF` literals and error-recovery blast radius

Real exporters write bare `INF` in data lines (observed in the #412
reproducer family). The parser's inline-instance recovery used to stamp
the *current* express ID across the whole accumulated index on that
path, silently corrupting every previously indexed element — one bad
literal poisoned thousands of good entities (#500; 3,116 entities
recovered on the reproducer). The structural fact worth keeping:
`parseDataToModel` builds the model from whatever `itemIndex.elements`
holds *regardless of the ParseResult code*, so index integrity **is**
model integrity — recovery paths must never mutate already-indexed
elements.

### Measuring against OCCT ground truth

bldrs-ai/Create's proof pipeline (`src/proof/` — `catalogue.ts`,
`proofWorker.ts`, `run.ts`) authors STEP fixtures through OCCT and
computes reference measures per fixture; running it writes
`out/proof/proof.json` locally (`out/` is gitignored, so the numbers
are regenerated by the pipeline, not read from a checked-in file —
e.g. `box-fillet-r8` → `occtArea: 3891.398…`). Loading the same STEP
through conway and summing triangle areas + bbox from `dumpToOBJ` gives
a cheap parity number that caught the sphere, torus, and fillet
families in turn. Worth promoting into the Phase 2 regression harness
as a second signal beside digests — which means regenerating or
vendoring the reference numbers as part of the harness, since there is
no checked-in file to read.
One caveat when using it: `Geometry::Reify`'s welder deletes zero-area
triangles, so "the face added triangles" does not imply "the face dumps
geometry" — an empty dump hashes to SHA-1's empty string
(`da39a3ee…`), which is how a face can pass a triangle-count probe and
still be invisible.

### AP203 fall-through: measured

The loader routes both AP203 schema names to the AP214 parser (#503,
and the sibling AP242 alias in #480). Measured Aug 2026; the short
answer is that the alias costs almost nothing, and the interesting
finding is *why* — the two schemas share the same ISO 10303 integrated
resources, so the geometry and product-structure entities a CAD
exporter actually writes are the same entities with the same attribute
order in both.

Note first that "AP203" is two schemas, not one, and the detector
matches both:

- **`CONFIG_CONTROL_DESIGN`** — AP203 edition 1 (ISO 10303-203:1994
  AIM long form). Small: 254 entities.
- **`AP203_CONFIGURATION_CONTROLLED_3D_DESIGN_…_MIM_LF`** — AP203
  edition 2 (ISO/TS 10303-403 MIM long form). Large: 1,006 entities,
  because the MIM pulls in whole modules (procedural/parametric
  representation, sheet metal, the rule/logic schema) that no CAD
  exporter emits.

Both appear in the corpus: of the 16 AP203 models under
`test-models/step/nist/NIST-PMI-STEP-Files/`, 3 are edition 1 and 13
are edition 2.

**Static gap** (schema entity set vs. the 966 names in
`EntityTypesAP214`, i.e. what `step_vtable_builder.ts` can dispatch):

| schema | entities | absent from vtable | of those, geometry/topology-bearing |
|---|---:|---:|---:|
| CONFIG_CONTROL_DESIGN | 254 | 22 | 4 (`WIRE_SHELL`, `VERTEX_SHELL`, `SHELL_BASED_WIREFRAME_MODEL`/`_SHAPE_REPRESENTATION`) |
| AP203e2 MIM_LF | 1,006 | 332 | 131 |

The 332 looks alarming and is almost entirely a MIM-superset artifact —
see the empirical number below before sizing any work off it.

**Attribute-order divergence** — the dangerous class, because a
same-named entity whose attributes are declared in a different order
mis-parses *silently* under positional STEP encoding. Five cases exist
across the two schemas, all outside geometry, and **none of them occurs
in the corpus**:

- `DATED_EFFECTIVITY` — edition 1 declares `(start_date, end_date)`,
  AP214 declares `(end_date, start_date)`. A genuine silent swap; the
  AP214 parser would read an edition-1 file's dates transposed.
  Edition 2 uses the AP214 order, so this is an edition-1-only hazard.
- `AREA_UNIT` / `VOLUME_UNIT` — edition 1 subtypes `named_unit`
  (attribute `dimensions`, one reference); AP214 and edition 2 both
  subtype `derived_unit` (attribute `elements`, an aggregate). Again
  edition-1-only.
- `APPLIED_NAME_ASSIGNMENT` (`item` scalar vs. `items` aggregate) and
  `VECTOR_STYLE` (multiple-inheritance parents declared in the opposite
  order) — edition 2 vs. AP214.

Restricting the comparison to the entity names the corpus actually
instantiates and checking *types* as well as order: 140 shared names
for edition 2, **zero** divergent attribute slots; 63 shared names for
edition 1, 8 slots that differ only by widening (`TEXT` vs `LABEL`,
required vs `OPTIONAL`, an entity reference vs. a select that contains
it) — all safe in the AP203→AP214 direction.

**Empirical gap**, counting every instance in every AP203 model against
the vtable, with the AP242 files as a same-build control:

| corpus | files | instances | naming a type absent from the vtable | distinct such types |
|---|---:|---:|---:|---:|
| AP203 (both editions) | 16 | 214,437 | **76 (0.035%)** | 6 |
| AP242 (control) | 17 | 220,215 | 19,610 (8.90%) | 47 |

The six are `CC_DESIGN_PERSON_AND_ORGANIZATION_ASSIGNMENT` (24),
`CC_DESIGN_APPROVAL` (18), `CC_DESIGN_DATE_AND_TIME_ASSIGNMENT` (12),
`DESIGN_CONTEXT` (8), `MECHANICAL_CONTEXT` (8),
`CC_DESIGN_SECURITY_CLASSIFICATION` (6) — configuration-management and
product-context records. Nothing in `src/` reads any of them (nor the
AP214 `product_context` / `product_definition_context` they specialize),
so dropping them costs nothing conway currently consumes. Eight of the
16 files use none of them at all, including all three edition-1 files:
those write plain `PRODUCT_CONTEXT` / `PRODUCT_DEFINITION_CONTEXT`
despite the `CONFIG_CONTROL_DESIGN` header.

Every AP203 model produces geometry — **zero** zero-geometry loads,
against one in the AP242 control (`nist_ftc_08…-e1-tg`, #480). Total
error volume across all 16: 25 messages, none schema-attributable —
`Unsupported type: GEOMETRIC_SET` ×3 (an unimplemented extraction for
an entity that *is* in the vtable), spherical-pole triangulation
failures ×10, and 16 informational whole-curve-trim recoveries.

Two confounders were controlled explicitly, both of which distorted the
first AP242 measurement in #480: all 16 models were materialized from
Git LFS before measuring (a pointer stub parses as an empty document,
#486), and the run post-dates the #493 select-deserialization fix. A
third is worth naming because it is *not* AP203-specific: the
LOGICAL-read-as-BOOLEAN generator bug (#480) reaches
`B_SPLINE_CURVE`, `B_SPLINE_SURFACE` and `COMPOSITE_CURVE` alike, and
three AP203 files carry 53 `.U.` tokens in those attributes. It does
not fire here only because no AP203 file in the corpus pairs a
`.U.` with an attribute the extractor reads.

**The gap this leaves.** An entity name the vtable cannot resolve is
indexed with an undefined type and dropped with **no diagnostic at
all** — `this.index_.get(...)` in `step_parser.ts` returns `undefined`
and nothing counts it. That is the failure mode #503 was filed about,
and it is real; it is just cheap here (76 instances) and ruinous for
AP242 (19,610). A parse-time tally of unresolved type names, logged
once per name with a count, would turn "silently absent" into a
readable signal for every schema at once. It is deliberately *not*
bundled with this measurement: it adds rows to `errors.csv` for most
of the corpus, IFC included, so it needs its own PR and a baseline
re-bless.

Reproducing: the entity list for each schema comes from the EXPRESS
long forms (edition 1 and edition 2 from the STEPcode `data/` tree,
both carrying their ISO TC184/SC4/WG3 provenance in the file header;
AP214 from `schemas/AP214E3_2010.exp` in the pinned `IFC-gen-internal`
revision, which is the exact input the checked-in `*.gen.ts` were
generated from). The per-model run is
`node --experimental-specifier-resolution=node
compiled/src/AP214E3_2010/ap214_regression_main.js -d <file> <out>`.

### Error accounting

`Logger` dedups on the exact message string, and `errors.csv` carries a
`count` column that sizes each deduped row — a *constant* message
therefore yields one row with an honest count. The pathology runs the
other way: interpolating a per-record value (an express ID, a
coordinate) into the message splits one family into N rows of count 1,
burying the family's true size in noise (#495's motivating case). The
sizing work (#495/#496) added `Logger.error(message, expressID?)` — new
extraction errors should keep the message constant and pass the entity
ID as the second argument, which preserves dedup *and* still makes the
family attributable to specific entities.

## Open questions

- AP203 strategy: indefinite AP214 fall-through, or its own gen tree
  once divergence is measured? Measured under #503 — see §"AP203
  fall-through: measured". The data supports staying on the
  fall-through: 0.035% of instances unresolvable, none geometry-bearing,
  no geometry loss. Still open as a *policy* question, since the
  measurement covers one exporter family (the NIST corpus is CATIA- and
  Creo-sourced) and edition-1 CCD files carry a real
  `DATED_EFFECTIVITY` attribute-order hazard that this corpus never
  exercises.
- Test model storage: checked into `data/`, into a
  `regression/test_models_step/` corpus, or in a separate `test-models`
  repo similar to IFC's? Affects PR-time test budget and licensing.
- AP242 in scope for the first production cut, or follow-up release?
  Drives whether Phase 5 is gating.
- ~~CONFIG_CONTROL_DESIGN routing: verify the AP214 alias isn't
  producing silent parse errors on real CCD files.~~ Answered under
  #503: it isn't. The three CCD files in the corpus resolve every
  entity they contain against the AP214 vtable and load clean. The
  residual risk is the `DATED_EFFECTIVITY` / `AREA_UNIT` /
  `VOLUME_UNIT` attribute-order divergences, which are edition-1-only
  and unexercised here — a CCD file that *does* use them mis-parses
  silently, with no diagnostic.
