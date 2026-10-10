# PR regression shards

Digest CI is **at most 10 shards** on free `ubuntu-24.04`, split by when
they run. Each shard skip-smudges its corpus and LFS-pulls only the
files in its list, so a 900 MB headline model fits on the 14 GB disk.

| Shard | Job | Runs on | Why |
|---|---|---|---|
| `coverage-1` … `coverage-3` | `regression-shard` | every ready PR, merge, rc | Small/fast public models for schema and exporter spread. Lists union to [`../smoke_models.txt`](../smoke_models.txt). ~180 MB of LFS, cached. |
| `psb`, `d3d`, `ilna`, `dowa`, `orbiter`, `blsn`, `hospital` | `regression-shard-private` | **merge, rc, opt-in dispatch** | One private headline model each. A few-minute load gets its own machine so a regression there cannot hide behind a short coverage batch. ~2.6 GB of LFS, **uncached**. |

## Why the headline shards are not on pull requests

They cannot be cached — see the next section — so every run that
includes them re-pulls ~2.6 GB from `test-models-private`. On a per-push
basis that is the dominant cost of the whole pipeline, and it buys
coverage that did not exist at all before sharding: the old per-PR job
ran the public smoke subset only.

Running them per *landed change* instead keeps the coverage and pays for
it once per merge. The trade is that a headline regression is caught at
merge rather than at review. If that turns out to be too late, the
cheap half is `orbiter`: 10 MB of the 2.6 GB, and it is the long-running
geometry case (coil spring / helical thread), so it could come back to
the PR path for ~0.4% of the cost. The expensive ones are `psb`
(900 MB), `hospital` (555 MB) and `dowa` (418 MB).

Private shards need `TEST_MODELS_PRIVATE_TOKEN`. `resolve-models` fails
loudly if it is missing on a run that executes them; a fork never pushes
to `main`, so this cannot fire on one.

## What a private shard may and may not publish

Conway is public. Its Actions caches, artifacts, job logs and PR
comments are all readable by anyone, so "private" here means a specific
list of things that must not reach them — not that a private shard is
invisible.

**Never published:**

- **Model bytes.** Only public corpora are cached. An Actions cache
  written on the default branch is restorable by any `pull_request`
  run, and a `pull_request` run uses the *fork's* workflow file — so a
  fork can add a restore step. A cached private shard would hand over
  both the model bytes and the `TEST_MODELS_PRIVATE_TOKEN` that
  `git remote add` leaves in `models/.git/config`.
- **Renders.** Visual-diff is public coverage only; rendering a private
  model would publish it onto the `visual-diff-assets` branch. The
  matrix passes the literal `'false'` for `allow-visual-diff` on every
  private shard, and both the collect and upload steps are gated on it.
- **Model internals in the PR comment.** A private shard's fragment is
  **counts only** — row totals and how many moved. No engine error
  text, no express IDs, no geometry digests, no timings. This matches
  `perf-three-private`, which builds "aggregate stats (no filenames)"
  for the same reason.

**Published, and accepted as such** (a reviewed decision, not an
oversight): the shard id — so the model basename — the corpus SHA, row
counts, and the
per-shard `regression-shard-*` artifact plus job log, which do carry
`errors.csv` rows. Closing that last one needs BOTH the artifact upload
and the gate steps that `cat failed.csv` into the log; redacting only
the artifact looks like a fix without being one. It costs the ability
to debug a private-model regression from a run, which is why it was
left open. Note these runs are now merge/rc only, so the rows are not
produced on pull requests at all.

On the basenames specifically, because an earlier draft of this file got
it wrong and used it to argue the exposure was pre-existing: four exact
filenames were already public at `main` before sharding — `PSB.ifc`,
`D3D.ifc`, `Orbiter_v1.1_Gear_7.5.step` and `BLSN_007.stp`, in design
docs and `scripts/debug/README.md`. Three were **not**:
`DOWA_AR_DW_4.ifc` (only the bare label "DOWA" appeared),
`ILNA 3D_SIA2040.ifc` (only "ILNA") and
`Autodesk_Hospital_Metric_Architectural_Central.ifc` (nowhere, in any
form). Those three are first published by `regression/shards/*.txt`, and
they appear nowhere else in the change. If any of them must not be
public, the shard list is the one file to change — the argument "it was
already public" does not cover them.

This is what moved the headline shards off the PR path: the cache is
not available to them, and the uncached traffic was too much to pay per
push. Do not solve it by caching private bytes in a public repo.

## Invariants

`build` runs `shard_list.py check` on every PR, draft and fork
included. It enforces: at most ten entries across both matrices, no id
declared twice (two jobs of one name would collide on the artifact), no
model claimed by two shards, coverage shards are public, the coverage
union is exactly [`../smoke_models.txt`](../smoke_models.txt), and each
list's `# corpus:` header matching the job that lists it — so moving a
private model into `regression-shard` is caught, which otherwise both
resolves the wrong repo and renders it onto `visual-diff-assets`. A
list in neither matrix never runs, so that one matters most — which
is why the matrix read is mandatory and never degrades to "no errors".
It prefers PyYAML and falls back to a strict scan of the `include:`
block, because this repo's CI does not install PyYAML; it raises if
neither path works. If you reshape that matrix block and the scan
rejects it, fix the scan rather than letting the check go quiet.

Do not add an 11th shard. If a new headline model needs isolation,
merge two coverage lists or move a small headline into coverage.

## Reporting

One commit is pinned for the whole run (the `resolve-models` job), so
shards cannot straddle two corpus states. Each shard writes a
`shard_summary.md` fragment — its `failed.csv` in full, its
`errors.csv` as a delta against that pinned commit, its slowest models
— into its own artifact, and `run-ifc-regression` concatenates them
into the PR comment. A private fragment carries counts only (see
above), and on a pull request there are none.

The full public+private corpora still run once per `rc-*` tag
(`rc-regression.yml`).
