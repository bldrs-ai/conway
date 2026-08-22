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

## PR lifecycle

Several PRs are usually in flight at once, and the CI runners are a
shared, capped resource (4 concurrent jobs). A PR that runs the full
suite on every push while it is still being reworked starves the PRs
that are actually ready. So work moves through these five steps, in
order:

1. **Open the PR as a draft.** Not "open it and mark it draft" —
   `create_pull_request` takes `draft: true`. Heavy CI is gated on
   draft state (see below), so a draft costs a build, not a full
   regression pass.
2. **Leave it in draft until `/review` has run and every finding is
   handled.** Handled means fixed, or answered in the PR thread with
   why it is not a defect. Do not flip to ready with open findings.
3. **Flip it out of draft** (`update_pull_request` with
   `draft: false`). That fires `ready_for_review`, which is what
   triggers the gated jobs — this is the point where CI actually runs.
4. **Drive CI to green.** If fixing CI changed the diff in any way
   beyond a trivial revert, `/review` again — the reviewed diff is not
   the merged diff otherwise.
5. **Then land it:** bring the PR description up to date with what the
   change actually became, merge, and close or narrow the issues it
   resolves. An issue that is only partly addressed gets a comment
   saying what is left, not a close.

### What the draft gate covers

| Job | Draft PR | Ready PR |
|---|---|---|
| `build` (compile + unit tests) | runs | runs |
| `run-ifc-regression` | **skipped** | runs |
| `visual-diff` | **skipped** | runs (when digests changed) |

`build` is deliberately left ungated: it is the cheap compile and
unit-test signal you want while a draft is still moving.

Mechanics worth knowing before you edit `.github/workflows/build.yml`
— each of these is load-bearing, so don't prune the list to make it
tidier:

- The gate is a **job-level `if:`**, not a trigger filter. A
  skipped-by-if job reports a conclusion and satisfies a required
  status check; a workflow that never triggers reports nothing and
  leaves the PR waiting forever. This is the same trap the
  `paths-ignore` note in that file warns about.
- `ready_for_review` and `converted_to_draft` must stay in the
  `pull_request` `types:` list. Without the first, flipping a draft to
  ready fires no event at all and step 3 above silently does nothing.
  The second is what lets pulling a PR *back* to draft cancel a
  regression that is already mid-flight, via the workflow's
  `cancel-in-progress` group — otherwise it runs to completion for a PR
  you have explicitly withdrawn. Note the replacement run re-runs
  `build` (which is ungated) before stopping — cheap on a wasm cache
  hit, but a full emcc compile if you withdraw *during* a cold-cache
  build, since `actions/cache` saves in a post-job step the cancelled
  job never reaches. Free in Share, where every job is gated.
- The `github.event_name != 'pull_request' ||` clause in each gate is
  defensive, not load-bearing: Actions coerces mismatched `==` operands
  to numbers, so `null == false` is already true on push and
  `workflow_dispatch`. Keep it anyway — merges (and `auto-publish`,
  which needs the regression) should not hinge on that coercion.

The same lifecycle and the same gate shape apply in
[Share](https://github.com/bldrs-ai/Share) — see its `AGENTS.md` for
which jobs are gated there.

## Issue-queue burndowns: sub-agents and the rubric

Sizeable issue queues (triage passes, bug burndowns) are worked by a
coordinator session that plans, defines issues and manages the queue,
dispatching one sub-agent per issue for the hands-on work — issue
handling, PR authoring, review and release lifecycle. Use a
Fable-class model for the coordinator and Opus-class for the
sub-agents. This is the org direction, not a one-repo experiment;
Share carries the same guidance
([design/new/agent-workflow.md](https://github.com/bldrs-ai/Share/blob/main/design/new/agent-workflow.md)).
Sequence agents that share a branch or files; parallelize only across
disjoint trees.

A dispatch brief must carry: the branch and its current state, the
verification bar as numbers (the suite/test/lint counts the tree meets
today), the issue's full context — and an instruction to read the live
issue thread before coding, with explicit license to stop and report
if the thread has retracted the premise. Premises rot; never assert an
issue's triage state in a brief without having read its comments. (The
Aug 2026 burndown lost one dispatch exactly this way, and the agent
that refused to ship against the dead premise was right.)

The rubric every sub-agent is held to — written after reviewing a PR
that failed most of these (#508), then applied across
#485/#504/#505/#503:

1. **Read the thread first.** If comments retract the premise, stop
   and report rather than ship.
2. **Path evidence before claim.** A fix for a specific failure must
   show the failing path reaches the changed code — entity chain,
   stack, or captured diagnostic. "Consistent with" is not "caused
   by".
3. **Claim discipline.** State what the change establishes vs. what it
   hopes. No closing keywords, and no `(#N)` in a title, for unproven
   fixes of flaky or statistical bugs — auto-close has burned #485
   twice.
4. **Description ≡ diff.** PR and commit text describe the code as it
   is, not an earlier draft's intent.
5. **No speculative defenses.** Every guard corresponds to a state
   something can actually produce; cite what can throw.
6. **Tests pin the change, not the language.** Prove it: run the new
   tests against a stash/revert of the source change and show them
   fail.
7. **Verify environment assumptions empirically.** Emscripten flags,
   glue behaviour, schema revisions — read the built artifact or the
   pinned source, never memory of a different configuration.
8. **Diagnosis before defense** on silent-corruption and flaky bugs. A
   change that makes a symptom vanish without establishing mechanism
   closes an issue while keeping the bug.
9. **Digest discipline.** Byte-identical output for every model the
   change shouldn't touch, and a precise enumeration of the models it
   legitimately changes — those baselines need re-blessing.
10. **Report honestly.** Exact counts, verified vs. unverified,
    confounders named (LFS stubs, wasm-prebuilt drift, upstream
    fixes already landed).

Reviewers hold the same bar, in this order: verify claims against the
diff (not the description), against repo history, then against the
actual failure path — and grade findings by evidence, not
plausibility.

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
| What the perf bench measures and why: peak vs retention, the three distinct native quantities, why `heapUsed + external` is not a stand-in for RSS, GC settling, and the rule for changing recorded fields | [design/new/perf-measurement.md](design/new/perf-measurement.md) |
| Memory residency, streaming and federated loading | [design/new/memory-residency.md](design/new/memory-residency.md), [design/new/streaming-federated-loader.md](design/new/streaming-federated-loader.md) |
| emsdk version, wasm build environment | [design/new/web-build-environment.md](design/new/web-build-environment.md), [design/new/emsdk-upgrade-scalable-allocator.md](design/new/emsdk-upgrade-scalable-allocator.md) |
| Where a model lands in world space: `COORDINATE_TO_ORIGIN`, why the recentre snaps to a grid, why two exports of one object used to land 76m apart, what a frame change costs in re-blessing and saved cameras | [design/new/coordination-frame.md](design/new/coordination-frame.md) |

Add a row here when you write a doc future assistants should find — this
table is the index, not the filesystem.
