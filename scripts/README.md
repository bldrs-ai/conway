# scripts/

Check this index before writing new tooling — most of what a geometry or
performance investigation needs already exists here.

| Script | Use |
|---|---|
| [`debug/model_report.mjs`](debug/README.md) | Why does *this* model look wrong — probes the geometry pipeline and names the entities responsible |
| `render_glb.cjs` | GLB → PNG with a pure-JS software rasterizer. No browser, no native deps, bit-deterministic across machines. `--pair` renders before/after with one shared camera |
| `visual_diff_report.cjs` | Per-model before/after image comparison for a PR's regression run |
| `gen_delta_csv.cjs`, `run_gen_deltas.cjs` | Digest CSV deltas between two conway versions |
| `benchmark.cjs` | Timing sweep over a model corpus |
| `generate_flame_graph.cjs` | Flame graph from a `yarn cli-profile` run |
| `stream_corpus_sweep.mjs` | Streaming-loader sweep across the corpus |
| `m2_consumer_spike.mjs` | What a semantic consumer costs on the streaming parse's record-event path (M2/#393): event-fed vs derived-from-columns, per model |
| `step_nonproduct_survey.py` | Survey of non-product STEP entity usage across the corpus |
| `setup-emsdk.sh`, `build-codex.sh`, `build-gha.sh` | Toolchain and build drivers |
| `code-gen.cjs`, `gen-web-ifc-types.cjs` | Schema code generation |
| `extract-wasm-dependencies.cjs`, `fetch-prebuilt-wasm.cjs`, `fd-patch.cjs` | Build plumbing |
| `check-compiled-fresh.cjs` | Commit-gate guard: names any TypeScript source with no output under `compiled/`. Jest runs over `compiled/`, so an uncompiled test is absent from the run rather than failing it |
| `firestore_*.py`, `upload_to_firestore.py`, `updateVersion.mjs` | Release and corpus-data plumbing |

Scripts here are not covered by `yarn lint`, which runs over `src` only.

# Performance Test

This document provides detailed instructions on how to set up and run the
performance tests for the project.

> Note: the `performance_test.sh` driver below is no longer in this
> directory; the surrounding setup (headless-three cross-linking, the
> `benchmarks/` output layout) still describes how performance runs work.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js and npm
- A Unix-like environment (for running shell scripts)
- Checkout and build https://github.com/bldrs-ai/headless-three
- Checkout a model repo, like https://github.com/bldrs-ai/test-models

## Build headless-three with latest Conway

Conway performance test uses headless-three (H3) for its rendering environment.  So we have to update it to use the latest conway.  H3 accesses conway via the conway-web-ifc-adapter package.  To get these all using the latest conway version locally (without publishing candidate packages) we use yarn link, which symlinks a project's node_modules/{dependency} to a working repo on your machine.

Follow these steps to cross-link your working repos:

 1. In conway repo, build and test conway (see this project's root README)
 2. Run `npm pack` to verify the npm will look good (i.e. is the size you expect, has the right files)
 3. Run `yarn link`, copy the value it gives you
 4. cd to your local root for `conway-web-ifc-adapter`, paste the value and execute that yarn linking command
    1.  `yarn build` (in conway-web-ifc-adapter root)
    2.  `yarn link`, copy the value it gives you
       1.  cd ${headless-three}, paste the value and execute that yarn linking command
       2.  `yarn build` (in headless-three root)
 5. cd ${conway}

Now your local headless-three depends on your local conway-web-ifc-adapter which depends on the new version of conway.

## Run Performance Test

Run the performance test script using the following command:
```
./performance_test.sh <path to headless-three> <path to models directory>
```

For example, with output:
```
conway/scripts> ./performance_test.sh $HOME/c/b/headless-three $HOME/c/b/test-models
ok, 1s, haus.ifc
ok, 0s, box.ifc
error, 1s, bath-csg-solid.ifc
```

This will also leave output in the `../benchmarks` directory (../ relative to scripts) named for the engine and model dir being tested, e.g. `benchmarks/conway0.1.553_test-models`, including:
- performance.csv             Basic status and timings from performance script
- performance-detail.csv      A rollup of detailed stats from the renering server for all models
- $OLD_$NEW_delta.csv         Delta of performance-detail.csv between NEW and OLD versions, e.g. 0.1.500_0.1.490_delta.csv
- performance.err.txt         The error output from the script
- rendering-server.log.txt    Output from the headless-three http server, including model loading problems

There are also per model outputs including .png renders and .txt detailed stats:
```
conway/scripts> ls ../benchmarks/conway0.1.553_test-models | head
171210AISC_Sculpture_param.ifc-fit.png
171210AISC_Sculpture_param.ifc-statistics.txt
AC20-FZK-Haus.ifc-fit.png
AC20-FZK-Haus.ifc-statistics.txt
C20-Institute-Var-2.ifc-fit.png
```

That directory will also have a delta file comparing the new version of conway to the old version (npm latest).

```

```
