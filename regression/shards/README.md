# PR regression shards

Ready-PR digest CI is **at most 10 shards** on free `ubuntu-24.04`.
Each shard skip-smudges its corpus and LFS-pulls only the files in its
list, so a 900 MB headline model fits on the 14 GB disk.

| Shard | Corpus | Why |
|---|---|---|
| `coverage-1` … `coverage-3` | public `test-models` | Small/fast models for schema and exporter spread. Lists union to [`../smoke_models.txt`](../smoke_models.txt). |
| `psb`, `d3d`, `ilna`, `dowa`, `orbiter`, `blsn`, `hospital` | private `test-models-private` | One headline model each. A few-minute load gets its own machine so a regression there cannot hide behind a short coverage batch. |

Private shards need `TEST_MODELS_PRIVATE_TOKEN`. A **fork** has no
access to it, so its private shards skip and public coverage still
runs. An **internal** run (a same-repo PR, a push, a dispatch) without
the token fails in `resolve-models` instead: every private step would
otherwise skip, the matrix would still reduce to `success` on the
strength of the public entries, and a push to `main` could reach
`auto-publish` having tested none of the seven headline models.

## Nothing private leaves the private repo

Conway is public, and both of the places a run could stash model bytes
are readable by anyone who can open a PR:

- **Visual-diff is public coverage only.** Rendering a private model
  would publish it onto the `visual-diff-assets` branch.
- **Only public corpora are cached.** An Actions cache written on the
  default branch is restorable by any `pull_request` run, and a
  `pull_request` run uses the *fork's* workflow file — so a fork can
  add a restore step. A cached private shard would hand over both the
  model bytes and the `TEST_MODELS_PRIVATE_TOKEN` that `git remote add`
  leaves in `models/.git/config`.

The cost of the second rule is real: a ready-PR run re-pulls ~2.6 GB of
private LFS rather than restoring it. If that starts hurting the LFS
budget, cut the number of private shards per PR or move them to
merge/rc — do not cache private bytes in a public repo.

## Invariants

`build` runs `shard_list.py check` on every PR, draft and fork
included. It enforces: at most ten lists, no model claimed by two
shards, coverage shards are public, the coverage union is exactly
[`../smoke_models.txt`](../smoke_models.txt), and each list's
`# corpus:` header matches its `regression-shard` matrix entry. A list
with no matrix entry never runs, so that last one matters most — which
is why the matrix read is mandatory and never degrades to "no errors".
It prefers PyYAML and falls back to a strict scan of the `include:`
block, because this repo's CI does not install PyYAML; it raises if
neither path works. If you reshape that matrix block and the scan
rejects it, fix the scan rather than letting the check go quiet.

Do not add an 11th shard. If a new headline model needs isolation,
merge two coverage lists or move a small headline into coverage.

## Reporting

One commit is pinned for the whole run (the `resolve-models` job), so
ten shards cannot straddle two corpus states. Each shard writes a
`shard_summary.md` fragment — its `failed.csv` in full, its
`errors.csv` as a delta against that pinned commit, its slowest models
— into its own artifact, and `run-ifc-regression` concatenates the ten
into the PR comment.

The full public+private corpora still run once per `rc-*` tag
(`rc-regression.yml`).
