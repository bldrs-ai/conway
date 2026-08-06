# AGENTS.md

Conway — IFC/STEP CAD engine: a TypeScript schema/extraction layer over
the [conway-geom](https://github.com/bldrs-ai/conway-geom) C++/wasm core,
consumed by [Share](https://github.com/bldrs-ai/Share).

## Build and test

Do not try and run `yarn setup` again. It has already been run in the
environment setup.

To build, run `yarn build-codex-MT`. To test, run `yarn test`. If only
making changes to the TypeScript code in conway, you can run `yarn
build-incremental`. If making changes to conway-geom, you need to run a
full `yarn build-codex-MT`.

Run `chmod +x` on `scripts/build-codex.sh` before trying to call `yarn
build-codex-MT`.

`yarn build-codex-MT` takes roughly 90 seconds. When iterating on
conway-geom, stage a set of edits and evaluate them in one build rather
than rebuilding per edit.

This repo uses yarn 1.22.22.

## Debugging a bad model

When a model renders wrong — spikes, missing parts, exploded assemblies —
**start with `scripts/debug/model_report.mjs`, not with a new tracer.** It
loads the model through the normal loader with probes at four levels of
the geometry pipeline, and names the entities responsible:

```
node scripts/debug/model_report.mjs Right_Hand.step
```

Full guide, a worked example against a real defect
(`EDGE_CURVE.same_sense`, conway#444), and how to read the numbers:
[scripts/debug/README.md](scripts/debug/README.md).

Two rules from that page are worth repeating here, because ignoring them
is what made that investigation slow:

- **A probe that never fires looks exactly like a clean model.** Validate
  any new instrumentation against a case you know is non-zero before
  believing a null result from it.
- **Never hold a `HEAPF32` view across extraction.** Wasm memory growth
  detaches the buffer and the held view silently reads zeroes. Read
  vertices via `getPoint()` and curve points via `get3d()`.

Check `scripts/` before building tooling — see
[scripts/README.md](scripts/README.md) for what is already there.

## Where to read more

| Topic | Doc |
|---|---|
| Debugging one model's geometry; render and diff tooling | [scripts/debug/README.md](scripts/debug/README.md) |
| What is in `scripts/`, and performance testing | [scripts/README.md](scripts/README.md) |
| Geometry-quality signals, and which ones Share should surface to users | [design/new/model-diagnostics.md](design/new/model-diagnostics.md) |
| Regression corpus, digest CSVs, smoke subset vs RC pass | [regression/README.md](regression/README.md), [design/new/step-regression.md](design/new/step-regression.md) |
| CI tiering, cost rationale, rc/re-bless/LFS runbook | [design/new/ci-regression-cost.md](design/new/ci-regression-cost.md) |
| STEP support: schemas, coverage, known gaps | [design/new/step-support.md](design/new/step-support.md) |
| STEP product structure and metadata (the AP242 wrinkle, NIST) | [design/new/step-metadata-nist.md](design/new/step-metadata-nist.md) |
| Native GLB export from the CLI | [design/new/glb-native-export.md](design/new/glb-native-export.md) |
| Memory residency, streaming and federated loading | [design/new/memory-residency.md](design/new/memory-residency.md), [design/new/streaming-federated-loader.md](design/new/streaming-federated-loader.md) |
| emsdk version, wasm build environment | [design/new/web-build-environment.md](design/new/web-build-environment.md), [design/new/emsdk-upgrade-scalable-allocator.md](design/new/emsdk-upgrade-scalable-allocator.md) |

Add a row here when you write a doc future assistants should find — this
table is the index, not the filesystem.
