# PR regression shards

Digest CI is **at most 10 fixed shards** on free `ubuntu-24.04`, split
by when they run, plus up to two [alsocheck](#alsocheck) jobs on a run
that asks for them. Each shard skip-smudges its corpus and LFS-pulls only
the files in its list, so a 900 MB headline model fits on the 14 GB disk.

| Shard | Job | Runs on | Why |
|---|---|---|---|
| `coverage-1` … `coverage-3` | `regression-shard` | every ready PR, merge, rc | Small/fast public models for schema and exporter spread. Lists union to [`../smoke_models.txt`](../smoke_models.txt). ~180 MB of LFS, cached. |
| `PSB900`, `D3D224`, `ILNA250`, `DOWA418`, `O10`, `BLSN282`, `AHMAC555` | `regression-shard-private` | **merge, rc, opt-in dispatch**; on a PR only the codes its `alsocheck:` line names | One private headline model each. A few-minute load gets its own machine so a regression there cannot hide behind a short coverage batch. ~2.6 GB of LFS, **uncached**. |
| `alsocheck-public`, `alsocheck-private` | `regression-alsocheck` | a ready PR or dispatch whose alsocheck names public paths / non-headline private codes | A list generated per run, never committed. See [alsocheck](#alsocheck). |

## Why the headline shards are not on pull requests

They cannot be cached — see the next section — so every run that
includes them re-pulls ~2.6 GB from `test-models-private`. On a per-push
basis that is the dominant cost of the whole pipeline, and it buys
coverage that did not exist at all before sharding: the old per-PR job
ran the public smoke subset only.

Running them per *landed change* instead keeps the coverage and pays for
it once per merge. The trade is that a headline regression is caught at
merge rather than at review. If that turns out to be too late, the
cheap half is `O10`: 10 MB of the 2.6 GB, and it is the long-running
geometry case (coil spring / helical thread), so it could come back to
the PR path for ~0.4% of the cost. The expensive ones are `PSB900`,
`AHMAC555` and `DOWA418` — the code carries the size, which is why it
is in the code.

Private shards need `TEST_MODELS_PRIVATE_TOKEN`. `resolve-models` fails
loudly if it is missing on a merge, rc or dispatch run that executes
them. On a pull request a missing token is a **skip with a note**, not a
failure: a fork has no secrets, a PR whose head repo was deleted is
treated as a fork, and a same-repo bot PR (Dependabot) gets only
Dependabot secrets. None of them can do anything about it.

The token never touches disk: every git and git-lfs call that needs it
gets it per process, as an `http.extraheader` in `GIT_CONFIG_*`
environment variables scoped to `https://github.com/`. A remote URL
holding it would sit in `models/.git/config`, readable by every later
step, the PR's own code among them.

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
  the model bytes. (It used to hand over the token too, from the remote
  URL in `models/.git/config`; credentials are now passed per process as
  an `http.extraheader` and never written to disk.)
- **Renders.** The public `visual-diff` job renders public models only;
  rendering a private model there would publish it onto this repo's
  `visual-diff-assets` branch. The matrix passes the literal `'false'`
  for `allow-visual-diff` on every private shard, and both the collect
  and upload steps are gated on it. Private models a PR names with
  [alsocheck](#alsocheck) are rendered by `visual-diff-private`, which
  pushes to `bldrs-ai/test-models-private` and nowhere else.
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
left open. These runs are merge/rc only, except where a PR's alsocheck
names a private code: then that PR's run produces them too, the same
exposure by the same mechanism. Note the batch's job log also prints
each model's basename as it starts and finishes it, so for a private
shard the real basename is in that log; that is part of the accepted
log exposure above.

That acceptance covers the **seven headline basenames** and nothing
else. An alsocheck entry may name any code in the manifest, so the
`alsocheck-private` job runs its batch with `by-code`: on
`models/by-code/<CODE><ext>` hard links, so the `Current File:` lines,
the zero-geometry and `failed.csv` printouts, every CSV row, the digest
file and the uploaded artifact all name the code. `git lfs pull` and
`shard_list.py` messages are redacted to codes too. The composite refuses
a private alsocheck list without `by-code`. `visual-diff-private`
renders through the same hard links and passes `--quiet-child-stderr`,
so the engines' error text stays in the private report and out of the
log. Hard links rather than symlinks: a symlink leaves the real path one
`realpath()` away.

What by-code cannot hide is the model's own content. Engine error rows
(express IDs, entity types) are in the job log and artifact as for any
private shard, and a model whose IFC/STEP header names itself still does
so to anything that prints the header. The engines print the
preprocessor and originating system from it, not the file name.

## Codes, not filenames

A private shard list names a **code**: its leading capitals plus its
size in MB (`PSB900`, `AHMAC555`, `O10`). The code to path mapping is
`regression/shard_codes.txt` **in `bldrs-ai/test-models-private`**, so
only a run holding `TEST_MODELS_PRIVATE_TOKEN` can resolve it, and no
private filename is committed to this public repo.

This replaces an earlier draft of this file, which published the seven
filenames and argued the exposure was pre-existing. That argument was
only true for four of them — `PSB`, `D3D`, `Orbiter` and `BLSN` have
their exact filenames on `main` in design docs and
`scripts/debug/README.md`. For the other three it was false: `DOWA` and
`ILNA` appear on `main` only as bare labels, and nothing on `main`
mentioned the seventh (`AHMAC555`) in any form. Codes avoid having to make
that argument at all.

What a code does not hide is the bare label, where `main` already
publishes one. The point is the filename.

`shard_list.py check` enforces the shape in `build`, which has no corpus
to resolve against: every entry in a private list must look like a code,
and a single-entry list must hold the code it is named after (the file
name is the shard id and the matrix entry). A code the manifest cannot
map fails its shard at run time with a message naming the code and the
manifest path — it cannot silently digest nothing.
This is what moved the headline shards off the PR path: the cache is
not available to them, and the uncached traffic was too much to pay per
push. Do not solve it by caching private bytes in a public repo.

## alsocheck

A PR that fixes an error reported on particular models names them on a
line of its own in the description:

```
alsocheck: ILNA250, ifc/foo/bar.ifc
```

and CI runs regression **and** a before/after visual diff on exactly those
models, whether or not they are in a shard list and whether or not their
digest changed. A manual dispatch takes the same list in its `alsocheck`
input.

**Syntax.** The key at the start of a line (at most three leading
spaces), any case; entries separated by commas or spaces; at most **5**.
A line GitHub hides or shows as code is never a request. That covers an
HTML comment (an unclosed `<!--` hides the rest of the body, as on
GitHub), `<pre>`/`<code>`/`<script>`/`<style>`/`<textarea>`/`<template>`,
a fenced block (closed only by the same character at least as long, so
a fence of four backticks can hold one of three, and a backtick fence
can hold a tilde one; an unclosed fence runs to the end), and an indented code block (four spaces or a tab). Any text on
the same line as one of these is ignored too. So is a line containing
a Unicode line or paragraph separator (U+2028, U+2029 and kin), since
GitHub renders it as part of one line. When in doubt the parser ignores
the line, so a PR template's commented example, or a PR that documents
the syntax, selects nothing. An entry is either:

- a **private** model, by its shard **code only** - capitals then the
  size in MB, e.g. `ILNA250` (the map is `regression/shard_codes.txt` in
  `bldrs-ai/test-models-private`). Never a private path or filename:
  this repo is public.
- a **public** model, by its path in `bldrs-ai/test-models` at the run's
  pinned commit, e.g. `ifc/foo/bar.ifc`. Only `.ifc`, `.step` and `.stp`;
  relative, no `..`, no empty segments, characters `[A-Za-z0-9_.+-/]`.
  Double-quote a path with spaces or parentheses:
  `"ifc/misc/Stohr - IFC Test.ifc"`. A single pair of enclosing backticks
  is also accepted.

Anything else fails `resolve-models`, loudly, naming the entry's
**position and reason only** - never its text, nor any part of it,
because the description is
attacker-controlled and an entry rejected for looking like a private path
is exactly the text that must not be repeated. A path is accepted only if
it is a file in the public corpus, which is also what rejects a private
path typed by mistake. The parser is
[`alsocheck.py`](../../.github/actions/regression-shard/alsocheck.py),
tested by `test_alsocheck.py` in `build`.

**When it is read.** On `ready_for_review` (drafts skip regression), on
each push, and on "Re-run all jobs": `resolve-models` reads the
description live from the API, not from the event payload a re-run
replays. Editing the description alone does **not** start a run - the
workflow does not listen for `edited`; see the comment on `types:` in
`build.yml` for why (it would cancel the regression in flight on every
edit, and a gated replacement would report a `skipped` check as green).

**What runs.**

| Entry | Regression | Visual diff |
|---|---|---|
| a headline code (one of the seven) | that entry of the `regression-shard-private` matrix | `visual-diff-private` |
| another private code | `regression-alsocheck` `alsocheck-private` (uncached) | `visual-diff-private` |
| a public path | `regression-alsocheck` `alsocheck-public` | `visual-diff`, its own section, never threshold-suppressed |

The regression gates are the shards' own (failed.csv, zero-geometry),
through the same composite action. The alsocheck jobs add one more,
`require-rows`: every listed model must have a row in `main.csv` or
`failed.csv`, because a batch that never read a model exits 0. TODO: the
fixed shards could take the same check; it is off for them only so it
does not first land on a merge. The PR comment reports these models in
an **alsocheck** section ahead of the fixed shards.

**Unselected headline entries.** The `regression-shard-private` matrix
stays static (`check` reads it), so on an alsocheck PR every entry
starts, and the ones not named stop at their first step and report
success having digested nothing. Their job summary says **not selected**,
the comment lists them as not selected (never as "failed before they
could report"), and `run-ifc-regression` asserts at the artifact level
that exactly the selected shards uploaded results: a selected shard that
skipped, or an unselected one that ran and spent private LFS, fails the
check.

**Private renders** never reach anything public: not this repo's
`visual-diff-assets` branch, not an Actions artifact (`visual-diff-private`
uploads none), not the job log (the renderer sees the models only through
`<CODE>.<ext>` hard links, so its output and PNG names say the code, and
`--quiet-child-stderr` keeps the engines' error text out), and not the
PR comment, which carries codes and **links only** - no embedded image,
no pixel figure. A requested code that renders nothing fails the job.
Models over 300 MB export one engine at a time, with 900 s per export, so
the headline models fit the 16 GB runner. The images and the renderer's
report go to the `visual-diff-assets` branch (orphan) of
`bldrs-ai/test-models-private`:

```
conway/pr-<PR number>/<run id>/<CODE>-before.png
conway/pr-<PR number>/<run id>/<CODE>-after.png
conway/pr-<PR number>/<run id>/README.md      # the full report, relative images
conway/dispatch/<run id>/...                   # a manual dispatch
```

The links open only for people with access to that repo. They name the
branch path, which is unique per run and never rewritten, so the comment
can be built before the push. Pushing needs
**`TEST_MODELS_PRIVATE_WRITE_TOKEN`** (contents: write on
`test-models-private`; `TEST_MODELS_PRIVATE_TOKEN` may be read-only),
stored as a secret of the **`private-renders` GitHub Environment**, not as
a repo secret. That is deliberate:

- A `pull_request` run uses the PR branch's own workflow file, so a repo
  secret can be read by anyone who can push a branch here, simply by
  editing `build.yml` on that branch.
- An environment secret is released only to a job that names the
  environment, and only after that environment's protection rules pass.
  A maintainer can add required reviewers there, or restrict it, without
  another workflow change. Note that a deployment-branch restriction
  would also block PR runs, whose ref is `refs/pull/<n>/merge`.

Inside the job, every step that runs PR code (the engines and their
`npm install`, the renderer, `alsocheck.py`) runs first. The write token
appears in the env of exactly one step, the last. That step runs only
`/usr/bin/git` and `cp`, in an emptied environment with no global or
system git config and no hooks, in a fresh clone. This stops a script
from simply reading the token. It is not a sandbox: earlier PR code can
still poison later steps (GITHUB_ENV, GITHUB_PATH, sudo, a leftover
process). The environment's rules are the real control. The engines'
dependencies are not lockfile-pinned: the npm tarballs ship no lockfile,
and the base engine is a published package with none. They install with
`--ignore-scripts`, and all before the write token exists.

If the write token is absent the private renders are skipped, the
regression still runs, and `visual-diff-private`'s comment and job
summary say so. There is no fallback destination.

**Forks, and PRs without secrets.** A fork PR has no secrets, so its
private entries are dropped with a note in the comment and summary:
skipped, not failed, and never leaked. The same applies to a PR whose
head repo was deleted, and to a same-repo PR whose run has no
`TEST_MODELS_PRIVATE_TOKEN` (Dependabot). Its public entries still run
regression. Two things are not posted for a fork PR, because its
`GITHUB_TOKEN` is read-only: the public visual diff (it could neither
push images nor comment), and the regression comment itself. The report
is in `run-ifc-regression`'s job summary instead, and it says the visual
diff did not run. A maintainer can run either with a dispatch.

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

The `regression-alsocheck` jobs are outside that cap on purpose: the cap
is on the fixed matrices `check` reads, and that matrix is built per run
from the request, has at most two entries, and exists only on a run that
asked for it. `check` reserves the `alsocheck*` ids, so no committed list
can collide with their `regression-shard-alsocheck-*` artifacts. A
generated public list may name corpus **paths** rather than basenames;
`shard_list.py` takes an entry with a `/` as exactly that file.

## Reporting

One commit is pinned for the whole run (the `resolve-models` job), so
shards cannot straddle two corpus states. Each shard writes a
`shard_summary.md` fragment — its `failed.csv` in full, its
`errors.csv` as a delta against that pinned commit, its slowest models
— into its own artifact, and `run-ifc-regression` concatenates them
into the PR comment. A private fragment carries counts only (see
above), and on a pull request there are none unless its alsocheck named
a private code.

The full public+private corpora still run once per `rc-*` tag
(`rc-regression.yml`).
