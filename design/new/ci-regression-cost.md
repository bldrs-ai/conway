# CI regression & cost architecture

How conway's CI is tiered so full-corpus regression + performance cost is
paid **once per release candidate** instead of on every push, why it's shaped
that way, and the operational runbook (cutting an rc, re-blessing baselines,
the token, the LFS-budget dependency) for keeping it running.

This is the durable home for decisions that otherwise live only in
`build.yml` / `rc-regression.yml` comments and merged PR descriptions. If you
change the tiering, the triggers, or the cost trade, update this doc.

Operational quick-reference for *running* the regression batch locally lives
in [`../../regression/README.md`](../../regression/README.md); this doc is the
*why* and the CI/release wiring.


## The testing pyramid

Three escalating scopes. Cheap and always-on at the bottom; the expensive
full sweep only at a blessed release point.

| Tier | When | What runs | Gate |
|---|---|---|---|
| **A — fixtures** | every PR + merge | unit tests + `data/` geometry goldens (in `build`) | **hard** — a mismatch fails `build` |
| **B — smoke** | every PR + merge | digest batch over `regression/smoke_models.txt` (~12 models) in `run-ifc-regression` | **hard on failures** — a model that fails to parse/extract blocks; digest *changes* are informational |
| **C — full corpus + perf** | `rc-*` tag | full public+private digest regression (`rc-regression.yml`) **and** the `perf-three-*` headless-three benchmarks (in `build.yml`) | **hard on failures**; digest churn lands in a reviewable baseline PR |

Tier A is hermetic (no `test-models` clone, no token — protects forks too);
see the Tier-A section of `../../regression/README.md`. Tiers B and C share
the same digest batch (`ifc_regression_batch_main.js`), just over different
model sets.

### Why smoke changes don't gate

A smoke digest *change* is informational, not a failure, on purpose:
geometry improvements are supposed to change digests. A crash (`failed.csv`
row) is never intended, so that gates. Intended geometry changes are reviewed
visually (the visual-diff comment) and **blessed at the rc**, not at PR time.


## Why it's tiered this way (the cost rationale)

Every heavy job runs on the `ubuntu-24.04-4vcpu-8gb-150gbssd` runner, billed
as **Actions Linux 16-core at $0.012/min** — that line item is ~100% of the
metered spend (the 2-core `Actions Linux` rows bill $0 inside the included
allotment). So cost ≈ **large-runner minutes**, and the levers are *how often*
and *how many* jobs hit that runner.

Measured per-job wall time on that runner (representative runs):

| job | wall time |
|---|---|
| build (WASM cache hit) | ~2.8 min |
| run-ifc-regression (full corpus, old) | ~5 min |
| **perf-three-private** | **~27 min** |
| **perf-three-public** | **~11 min** |
| smoke batch step (12 models) | **seconds** |

Findings that drove the design:

1. **Perf was the dominant cost** (~55% of spend) and ran on *every merge*.
   Per-commit perf attribution is redundant while perf is actively reviewed
   per-model at PR time, so it moved to `rc-*` tags (#424). Perf **runner size
   is deliberately not reduced**: for a benchmark, the 8-vcpu headroom buys
   low-variance timings, not throughput — frequency is the lever, not size.
2. **The full digest batch ran on every PR** for a whole-corpus signal that a
   ~12-model smoke subset delivers for correctness at a fraction of the cost
   (#443). The full corpus still runs — once, at the rc.
3. **Every PR push spawned a fresh pipeline with no cancellation.** A
   concurrency group now cancels superseded runs (#399, see below).

Net effect: a PR push dropped from ~13 → ~6 large-runner minutes, a merge from
~48 → ~8; the full corpus + perf is paid once per `rc-*` tag.

#554's two-pass gc A/B briefly doubled that rc bill: it ran the whole corpus
**twice** in each `rebless` job — the blessed pass and a gc-off control — which
took the private `rebless` job from ~24 min to ~45 (its digest pass alone is
~20 min per side; public is ~5). **That was a one-time validation, and it is
now opt-in.** It ran once, on
[run 32601886424](https://github.com/bldrs-ai/conway/actions/runs/32601886424),
which priced the retention settle at +2.9% of pass wall-clock on the public
corpus and answered the question the control condition existed to ask; the
settle is always on going forwards, so re-measuring it every release bought no
signal at twice the price of the most expensive job in CI. The control pass and
its comparison now run only under `workflow_dispatch` with `perf_ab: true` —
kept rather than deleted, because a between-run comparison cannot answer this
question (see `design/new/perf-measurement.md` §"The A/B runs as two passes
inside one rc job"), so a future settle change needs this machinery intact. A
release is back to one pass. LFS bandwidth never moved either way — a second
pass reuses the first's checkout — and the two `perf-three-*` jobs are
unchanged at ~27 and ~11 min.

Sizing note for anyone adding per-model work: the private digest pass — the one
that runs on *every* rc — had 5 seconds of headroom under its 20-minute step
cap before the settle in #556 pushed it over, killing that run. Both passes are
capped at 35 min now; see `design/new/perf-measurement.md` §"What the second
pass costs".

**Do not "just run everything on PRs again"** to catch breaks earlier — that
reintroduces the spend this tiering removed. Some delay in finding a break on
a non-smoke model is the accepted trade; the rc pass is the safety net.


## Trigger map

Precise event → jobs (all gates are per-job `if:` in the workflows):

| Event | build | run-ifc-regression (smoke) | visual-diff | perf-three-* | rc-regression (full) | auto-publish |
|---|---|---|---|---|---|---|
| pull_request | ✅ | ✅ | if digest changed | — | — | — |
| push `main` | ✅ | ✅ | — | — | — | ✅ (npm) |
| push `rc-*` tag | ✅ | ✅ | — | ✅ | ✅ | — |
| workflow_dispatch | ✅ | ✅ | — | ✅ | ✅ | — |

`auto-publish` is `push:main` only, so an `rc-*` tag never double-publishes.
The `perf-three-*` jobs live in `build.yml` but gate on
`startsWith(github.ref, 'refs/tags/rc-')`; the full digest corpus + baseline
bless is a separate workflow, `rc-regression.yml`, on the same tag.


## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- Keyed on `github.ref` (`refs/pull/<n>/merge` is unique per PR), so PRs never
  cancel each other — only newer pushes to the *same* PR supersede older ones.
- `cancel-in-progress` is **scoped to `pull_request` only**. Push-to-main runs
  must run to completion: `auto-publish` tags + publishes each main commit to
  npm, and each commit ships its own version, so cancelling a main run
  mid-publish (or skipping a commit's release) is not acceptable. Main runs
  queue rather than cancel.


## Baselines and drift

The digest baselines are committed **in the test-models repos** at
`regression/test_models/*.csv` (one CSV per model, per-Express-ID geometry
hashes). `run-ifc-regression` regenerates digests for the smoke subset and
diffs them against those committed baselines.

**Two-baseline mismatch (the drift you'll see).** The digest gate compares
the PR engine's output against the *pinned test-models baseline*; the
per-PR **visual diff** compares the *published npm engine* against the PR
build. When the baseline hasn't kept pace with released engine changes, a
model shows as digest-changed but renders pixel-identical (the change already
shipped). That churn is baseline drift, not a PR regression — which is why:

- the smoke diff is **scoped to the smoke subset** (a batch that only
  regenerated 12 models would otherwise report every *other* model as
  "resolved" — the phantom "602 resolved" seen on #443's first run); and
- the **visual diff is pixel-thresholded** (`--diff-threshold`, default
  0.05%): identical renders are suppressed to a tally instead of shown as
  no-op rows (#441). Limitation: the threshold is area-only, so a tiny
  high-contrast change could fall below it — tune the threshold or the smoke
  list if that ever bites.

**Re-blessing** regenerates the baselines from the current engine so the
changed-set again means "this PR moved geometry." That happens as part of the
rc pass (below) — merging its baseline PRs *is* the bless.

**Perf baselines are artifact-anchored, not committed.** The `perf-three-*`
jobs diff against the most recent prior `perf-three-{public,private}-<run_id>`
snapshot artifact (see `.github/actions/perf-delta`) — after a blessed rc,
that is the blessed run's numbers until the next rc/dispatch run replaces
them. Only the exact `<prefix><run_id>` snapshot counts (the `-benchdir-`
debug artifact is excluded: it uploads even from failed runs). Two
consequences: artifacts expire after ~90 days, so an rc gap longer than that
degrades the next run to a snapshot-only comment (no delta, by design,
non-fatal); and the baseline is "last successful run", not "last *blessed*
run" — a workflow_dispatch perf run between rcs becomes the new comparison
point. The serial conway-native load timings from `rc-regression.yml`
(`perf-serial-*` artifacts) are informational only; nothing diffs them yet.


## Release-candidate runbook

Continuous release is unchanged: **every green merge to `main` auto-publishes
to npm** (`auto-publish`, version `<major>.<commit>.<issue>-g<shorthash>` — see
the README).
The rc flow is the *separate*, deliberate "this is prod-worthy" gate.

To cut one:

```bash
git tag rc-<name> <sha-on-main>
git push origin rc-<name>
```

On that tag push:

1. **`build`** + **`run-ifc-regression`** run as usual (produce the candidate
   tarball the perf jobs consume).
2. **`perf-three-public` / `perf-three-private`** run the full H3 benchmark on
   the isolated runner (low-variance timings) with a delta vs the previous rc.
3. **`rc-regression.yml`** runs the digest batch over the **entire public and
   private corpora**, **fails red on any `failed.csv` row** (a bad rc stops
   here), and opens a **baseline PR in each test-models repo**. That PR's diff
   *is* the release's regression report.
4. **Review the two baseline PRs and merge** — that blesses the baselines to
   this release. From then on, per-PR smoke diffs are drift-free.

Fixing one broken model costs one fix cycle plus one rc re-run (the batch is
~minutes) — no per-model retest machinery, which isn't worth building at this
corpus size.


## Operational gotchas (learned the hard way)

- **`REBLESS_TOKEN` lives in `conway`'s repo secrets, not the model repos.**
  `rc-regression.yml` runs *in conway* and uses the token to push branches +
  open PRs in `test-models` / `test-models-private`. It's a fine-grained PAT
  with `contents:write` + `pull_requests:write` on **both** model repos
  (org PAT-approval may be required). The default `GITHUB_TOKEN` is
  conway-scoped and cannot push cross-repo; the workflow fails fast (on the
  cheap `setup` job) if the secret is absent.

- **The whole pipeline depends on the test-models Git-LFS budget.** Model
  files are LFS; a fresh checkout must fetch them. When the org's LFS
  *bandwidth* budget is exhausted, `git lfs` fetch is refused
  (`This repository exceeded its LFS budget`) and any fresh pull fails
  (exit 128). `run-ifc-regression` normally survives on a **warm test-models
  cache** (keyed on the test-models SHA) — so the failure is *masked* until
  the cache misses (test-models `main` advances) or a job does a fresh pull
  (the rc run). Symptom: PRs suddenly red at the test-models checkout with no
  code change. Fix: add an LFS data pack to the org (Settings → Billing), or
  as a no-code stopgap set the repo variable `TEST_MODELS_REF` to a SHA whose
  cache is still warm.

- **`matrix` is not available in a job-level `if:`.** `rc-regression.yml`
  selects corpora via a dynamic matrix built by a `setup` job, not a
  job-level `if` on `matrix.*` — the latter is a workflow-validation
  (startup) failure, not a runtime skip.

- **Blessed digests must be byte-reproducible by a later smoke run.**
  `rc-regression.yml` builds conway *from source* with the same pinned
  toolchain + WASM cache key as `run-ifc-regression`. Do **not** switch it to
  install the published npm package — that can lag main's `conway-geom`
  submodule SHA and re-introduce drift the moment it's merged.


## Cross-refs

- Running the batch / digest modes / fixtures: [`../../regression/README.md`](../../regression/README.md)
- STEP digest design (post-transform hashing): [`step-regression.md`](step-regression.md)
- GLB-byte goldens (complementary golden effort): [`glb-snapshot-goldens.md`](glb-snapshot-goldens.md)
- Release/versioning/npm publish: `README.md` §Releases
- Source of truth for wiring: `.github/workflows/build.yml`, `.github/workflows/rc-regression.yml`
