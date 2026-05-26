# STEP file format support

Plan to take STEP (AP214 / AP203 / AP242) support from "works on the
happy path" to production parity with IFC.

This branch (`STEP_support_2nd_stage-codex`) carries in-flight work from
Nov–Dec 2025: schema detection for `CONFIG_CONTROL_DESIGN` and explicit
AP203 naming in the format detector and loader. Merge resumes here.

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
- Test fixtures in `data/`: `a-gear-2-revs-fluted.step` (417KB),
  `create-a-tube.step` (9KB), `config-control-design-min.step` (1KB)

## Gaps to production

| # | Area | Severity | Notes |
|---|------|----------|-------|
| 1 | Public API surface | High | `src/index.ts` exports IFC types only. AP214 model / extraction / parser need stable named exports. |
| 2 | Regression coverage | High | No AP21x analog of `ifc_regression_main.ts` or `ifc_regression_batch_main.ts`. The 47-CSV golden corpus in `regression/test_models/` is IFC-only. |
| 3 | AP203 fall-through correctness | Medium | The loader logs `"AP203 Step Detected, using AP214 loader"` and reuses the AP214 parser. Real AP203 entities may diverge — needs a sweep across known AP203 exports. |
| 4 | AP242 | Medium | Not implemented. ISO 10303-242 supersets AP214 and is the modern PMI-bearing target; no detection, no entities, no parser. |
| 5 | Test models | Medium | Three STEP files in `data/`. Need broader coverage: real-world AP203 CAD exports, AP242 PMI samples, NIST CAx-IF test files. |
| 6 | AP214 test depth | Low | Two unit tests for AP214 (`ap214_step_model.test.ts`, `ap214_geometry_extraction.test.ts`) vs. IFC's six. Missing equivalents for block extraction, property extraction, scene builder. |
| 7 | Loader test coverage | Low | `conway_model_loader.ts` is exercised only indirectly via format detector tests. |

## Phased rollout

### Phase 1 — Land in-flight schema detection

- [ ] Add a positive AP203 detection test (this branch covers
      CONFIG_CONTROL_DESIGN; an explicit AP203-named test is still missing)
- [ ] Resolve the dropped `console.log(ParseResult[errorCode])` that the
      Nov rewrite removed — confirm nothing downstream depended on it
- [ ] Merge `STEP_support_2nd_stage-codex` → `main`

### Phase 2 — STEP regression infrastructure

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
