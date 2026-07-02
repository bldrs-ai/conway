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
| 3 | AP203 fall-through correctness | Medium | The loader logs `"AP203 Step Detected, using AP214 loader"` and reuses the AP214 parser. Real AP203 entities may diverge — needs a sweep across known AP203 exports. |
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

- [ ] Enumerate AP203 entities that are not in the AP214 vtable (walk
      via `step_vtable_builder.ts`)
- [ ] If divergence is small: extend AP214 model with conditional
      handling keyed off detected schema
- [ ] If divergence is large: generate a parallel `src/AP203_1994/` tree
      from the AP203 EXPRESS schema using the same code-gen pipeline
      that produced `AP214E3_2010_gen/`
- [ ] Acceptance: parse + geometry-extract three independently-sourced
      AP203 CAD exports with no parser errors

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

## Open questions

- AP203 strategy: indefinite AP214 fall-through, or its own gen tree
  once divergence is measured? Decision needed before Phase 4 work
  starts.
- Test model storage: checked into `data/`, into a
  `regression/test_models_step/` corpus, or in a separate `test-models`
  repo similar to IFC's? Affects PR-time test budget and licensing.
- AP242 in scope for the first production cut, or follow-up release?
  Drives whether Phase 5 is gating.
- CONFIG_CONTROL_DESIGN routing: currently aliases to AP214, but it's
  a profile of AP203, not AP214 — verify this isn't producing silent
  parse errors on real CCD files.
