# GLB snapshot regression goldens

Plan to extend the regression system with GLB-level snapshot goldens.
Today's regression hashes a CSV digest of OBJ-serialized geometry; a GLB
golden adds coverage for the binary that downstream consumers (the Share
viewer) actually load.

## Why

`ifc_regression_main.ts -d` hashes OBJ-serialized meshes, curves,
profiles and materials. It catches mesh and material changes but misses:

- Scene-graph structure: parent/child hierarchies, transforms, instancing
- glTF extension data: Draco, KHR/EXT extras, the BLDRS properties payload
- Material/texture serialization as it ends up in glTF (PBR factors,
  baseColor textures, samplers)
- Binary determinism of the exact bytes shipped to the viewer

A GLB-level golden gives one hash that exercises the full export
pipeline a downstream consumer actually uses.

## What already exists

- `src/core/geometry_convertor.ts` — `toGltf()` / `toGltfs()` with a
  generator pattern; chunked binary output via WASM
- `src/ifc/ifc_command_line_main.ts` — `--glb`, `--gltf`, `--glb-draco`,
  `--gltf-draco` flags
- `src/AP214E3_2010/ap214_command_line_main.ts` — `-g` flag emits OBJ
  + glTF + GLB together
- `src/rendering/threejs/` — Three.js viewer scene (can load the emitted
  GLBs, but no headless render path)
- `benchmarks/conway0.3.695_test-models/` — historical PNG snapshots
  from a now-dormant render pipeline (referenced in
  `rendering-server.log.txt`); useful as a reference for what a visual
  diff used to look like

## What's missing

- No determinism guarantee for `toGltfs()` output. Draco encoder,
  scene-assembly Map iteration order, generator tooling strings, and
  floating-point reduction order can all vary.
- No golden storage for binary GLBs; `regression/test_models/` holds
  CSVs only.
- No diff tool for GLB beyond byte-equality.
- No CI integration.

## Phased rollout

### Phase 1 — Determinism audit

- [ ] Run `toGltfs()` on the same IFC file twice from a clean process,
      byte-compare both runs
- [ ] If non-deterministic, identify sources:
  - [ ] Draco encoder configuration (random seeding, quantization order)
  - [ ] JS `Map` iteration order in scene assembly
  - [ ] Generator / tooling strings in the glTF header
  - [ ] Float reduction order (parallel mesh aggregation)
- [ ] Add a `deterministic: true` flag on `GeometryConvertor` that
      normalizes the offenders without changing released output
- [ ] Acceptance: 10 repeat runs of `toGltfs(index.ifc)` produce
      identical SHA-256

### Phase 2 — Golden hash files

- [ ] Decide storage layout (see Open Questions)
- [ ] `*.glb.sha256` files alongside the existing `*.csv` digests, or
      under `regression/glb/`
- [ ] CLI: `node compiled/src/ifc/ifc_regression_main.js --glb-golden
      <file>` emits the golden hash for a single model
- [ ] Batch: extend `ifc_regression_batch_main.ts` with a `--glb` flag
      that produces a master GLB manifest mirroring the CSV manifest

### Phase 3 — Structural diff for failure messages

A bytewise hash tells you *that* something changed, not *what*. When a
hash fails:

- [ ] Extract the glTF JSON section from both GLBs; diff with stable
      key ordering
- [ ] Binary chunk: report by-buffer-view byte-range deltas grouped by
      attribute (positions / normals / UVs / indices)
- [ ] Draco-compressed meshes: decode then compare uncompressed
      attributes
- [ ] Output: a short text report next to the failing golden, similar
      to how CSV-digest diffs are reported today

### Phase 4 — CI integration

- [ ] PR job: GLB regression on the standard `test_models` set; fail
      on hash mismatch with the structural diff attached
- [ ] Nightly job: large-model corpus (the 100MB+ models that don't
      fit in PR-time budget)
- [ ] Failure artifact: structural diff report uploaded to GitHub
      Actions artifacts

### Phase 5 — Visual snapshot (optional follow-up)

The dormant benchmark PNG pipeline suggests a prior headless renderer
at `:8001`. If pixel-level diff becomes valuable (catches viewer
regressions, not just data regressions):

- [ ] Drive `src/rendering/threejs/` from a headless runner (Puppeteer
      or node-canvas + WebGL shim)
- [ ] Fixed camera and lighting per test model for reproducibility
- [ ] `jest-image-snapshot` or equivalent with tolerance
- [ ] Goldens as PNGs under `regression/test_models/*.snapshot.png`

This stage is large enough to deserve its own design doc when it's the
next priority.

## Open questions

- Storage: binary GLBs in git are heavy; hashes-only is light but loses
  the structural diff capability for past failures. Likely answer:
  hashes in this repo, binaries in a sibling `test-models` repo.
- Scope: GLB only, or both GLB and glTF? GLB is what ships; glTF is
  the JSON-textured cousin. Recommend GLB-only initially.
- Format-agnostic from day one, or IFC-first then extended? STEP needs
  the same coverage (see `step-support.md` Phase 2) — if we structure
  the goldens infra parameterized by format, both come along.
- Draco vs. uncompressed goldens: Draco compression is non-trivial to
  diff. Storing the uncompressed glTF alongside the Draco GLB may be
  worth it for diagnostics.
