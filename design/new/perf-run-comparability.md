# Comparing two perf runs: the noise floor, and the in-job pairing that beats it

Companion to [perf-measurement.md](perf-measurement.md). That file is about
**what** the bench records — which quantity each column holds, why it exists,
and the rule for changing one. This file is about **whether two recorded
numbers may be subtracted at all**, and it is the design record for the change
that made rc-regression's timing delta a measurement instead of a lead.

perf-measurement.md already states the qualitative conclusion in two places
("a between-run comparison is invalid", "a cross-version `*_delta.csv` timing
column is a lead, not a measurement"), on the strength of one anecdote: two rc
runs an hour apart, median 1.55x apart. Everything below is the quantified
version of that sentence, plus the machinery that removes the confound rather
than warning about it. It is a separate file because it is read by a different
question — *can I trust this delta, and why did the delta file change shape* —
and because folding ~400 lines of runner statistics into a document whose
table of contents is a list of columns would bury both.

Every number here is measured. Nothing in this file is an estimate unless it
says so.

## The claim

`rc-regression`'s perf delta compared `engine2` — the corpus timed by **this**
run — against `engine1`, a column of numbers frozen into
`benchmarks/conway<previous>-ci_<repo>/performance-detail.csv` by a **previous
run**, on a different runner, on a different day.

**That cross-run comparison has a noise floor larger than any regression worth
gating on.** The three sections below establish the size of the floor, its
shape, and its cause, in that order.

## Evidence 1 — one job, run twice, 13.7% apart

Run [33128910045][rerun] was re-run, so attempts 1 and 2 are the same
workflow, the same commit `18366f01`, the same
`runs-on: ubuntu-24.04-4vcpu-8gb-150gbssd`. Each attempt opened its own bless
PR against `bldrs-ai/test-models`: `4d2b174` (attempt 1) and `7d7cf39`
(attempt 2).

Diffing the two bless commits: **only the two perf CSVs differ. Every digest
file is byte-identical.** The geometry the two attempts produced is the same
geometry, entity for entity. And `engine1TotalTimeMs` — the frozen baseline
column — is identical in both, as it must be: **0 of 97 rows differ**. So the
only thing that moved between the two files is `engine2`, which is the same
code measured twice.

| corpus | n | median | p10 | p90 | min | max |
|---|---|---|---|---|---|---|
| IFC | 44 | **−13.80%** | −18.52% | −10.55% | −25.71% | −2.88% |
| STEP | 53 | **−13.55%** | −17.32% | −9.38% | −22.04% | −5.47% |

All 97 models were faster on attempt 2. 87% of them by more than 10%. Median
|drift| 13.66%, p95 20.00%.

The regression that same delta *reported* against its frozen baseline had a
median of **9.40%**.

**The signal is smaller than the noise.** Not marginally, and not on the tail:
the median reported regression sits below the median run-to-run drift, so the
central case is already unresolvable. Nothing about that delta's timing
columns was ever a measurement of conway.

[rerun]: https://github.com/bldrs-ai/conway/actions/runs/33128910045

## Evidence 2 — the drift is a uniform scale factor, not interference

The obvious first hypothesis for a whole-corpus speedup is contention: a noisy
neighbour, accumulated descheduling, a page cache that warms as the pass
proceeds. Every one of those predicts drift that **grows with model duration**
— a 27-second model has 2000x more opportunity to be interrupted than a 13 ms
one.

Bucketing the 97 models by their own duration:

| duration bucket | mean drift |
|---|---|
| 13 – 143 ms | −11.43% |
| 144 – 318 ms | −14.04% |
| 332 – 1275 ms | −13.52% |
| 1308 – 27573 ms | −13.88% |

`correlation(log duration, drift%) = **-0.009**`, with a stdev of 3.63 around
a mean of −13.89.

A 13 ms model drifts as much as a 27-second one. That is the signature of a
**multiplicative constant applied to the whole machine** — every instruction
retired a fixed fraction faster — and it rules out accumulated descheduling,
contention and cache warming, all of which are additive in time and would show
as a slope.

The remaining candidate is that attempt 2 simply ran on faster silicon.

## Evidence 3 — the probe: it is the silicon, and the counter that would prove it is masked

`.github/workflows/perf-counter-probe.yml` (runs [33140946078][p1] and
[33141507310][p2], 6 VMs total, 20 timed iterations each = 120 runs of one
fixed workload) was written to ask two questions of the runner pool that
rc-regression actually uses.

[p1]: https://github.com/bldrs-ai/conway/actions/runs/33140946078
[p2]: https://github.com/bldrs-ai/conway/actions/runs/33141507310

### The PMU is masked by the hypervisor, and it is not fixable from inside the VM

The escape hatch from timing noise is to stop measuring time. An instruction
count is a count of *work*, so it is immune to how fast the machine executes
it — the compute analogue of reading heap-used after a forced GC instead of
before it. The probe went looking for one:

- `perf` installed, including `linux-tools-$(uname -r)`, the exactly-matching
  kernel package.
- `perf_event_paranoid` lowered from 4 to 1. **No effect** — which is the
  finding that matters, because it separates "kernel policy forbids this"
  (fixable in a real job, by the same `sysctl`) from "the hardware is not
  there".
- Software events — `task-clock`, `page-faults`, `context-switches` — count
  fine. So `perf` itself works.
- Hardware events — `instructions:u`, `cycles:u` — return
  `<not supported>`. `perf` ran; the event never counted.
- `/sys/bus/event_source/devices/` has **no `cpu` device at all**. Not a
  permissions failure: the PMU is not exposed to the guest.
- `systemd-detect-virt` = `microsoft`.

Azure masks the PMU. Nothing runnable inside the VM changes that, so
instruction counting is unavailable on this pool. The escape routes, both
real, both costly, are in "What was rejected" below.

### Within one job, wall clock is already precise

| metric | value |
|---|---|
| within-job CV(wall), median over 6 jobs | **0.111%** |
| workload checksums | byte-identical across all 120 runs on all 6 machines |

The identical checksums are what license reading the timings as replicates:
every run did the same work, so the only thing the spread describes is the
machine.

**This 0.111% is a property of the probe's workload, not a bound on the rc
gate.** The probe deliberately does no filesystem I/O and runs one small fixed
computation; the paired rc passes read a 3 GiB corpus and run 97 models of
wildly different cost. Quote it only for what it is measured on — the
scheduling-noise term in "What was rejected" below. The paired configuration's
own floor is Evidence 4.

**`task-clock` is not better than wall clock** — wall won 4 of the 6 jobs.
That is the expected result, not a surprise: on single-threaded CPU-bound work
with no I/O, elapsed time and CPU time measure the same interval, and
`task-clock` adds a `perf` fork to do it. The bench keeps wall clock.

### One runner label, three CPU models, two vendors

| CPU model | VMs |
|---|---|
| AMD EPYC 7763 | 2 |
| AMD EPYC 9V74 | 3 |
| Intel Xeon Platinum 8370C | 1 |

`ubuntu-24.04-4vcpu-8gb-150gbssd` is a label, not a machine. It does not even
describe the memory it names: `/proc/meminfo` on the A/A run (Evidence 4)
reports `MemTotal: 16373448 kB` — **15,989 MB, not 8 GB**. Read every part of
the label as an identifier, never as a hardware spec.

| | |
|---|---|
| cross-machine CV of job means | **11.24%** |
| max/min spread | **32.8%** (765.6 ms → 1016.9 ms) |
| between-machine effect vs within-job jitter | **≈ 101x** |

The between-machine factor is two orders of magnitude larger than the
precision available inside a single job. Evidence 1's 13.66% median drift sits
squarely inside the 11.24% cross-machine CV — the re-run landed on a faster
VM, and that is the whole explanation.

### Knowing the CPU model is not enough to normalise

The tempting repair is to record the CPU model and correct for it. The probe
kills that too:

- Two EPYC 9V74 VMs agreed with each other to **0.001%**.
- A third 9V74, in the other run, was **28.9% slower** than those two.
- Each of the three was internally stable to **<0.07%** over its own 20 runs.

So the slow 9V74 was not noisy — it was *consistently* slow, for the entire
life of the job. That is a persistent per-VM condition: a host frequency cap,
or an SMT sibling co-tenant burning the other half of the physical core.
Whatever it is, it is invisible to `/proc/cpuinfo`, constant while the job
runs, and different on the next job. **The identity of the silicon does not
determine its speed.**

## What was rejected, and why

**CPU time (`process.cpuUsage`) does not fix this.** It is not a
machine-independent unit; it reports *seconds of CPU*, so a faster machine
completes the same work in fewer CPU-seconds exactly as it completes it in
fewer wall-seconds. It removes co-tenant *scheduling* noise, which the probe
measured at 0.111% and is not the problem, and leaves the ~11% frequency and
microarchitecture factor, which is. The probe's `task-clock` result is the
direct measurement of this: it lost to wall clock in 4 of 6 jobs.

**Instruction count would work and is unobtainable here.** It counts work, not
time, so it is immune to every effect in Evidence 2 and 3. The PMU is masked
(above). Two escape routes exist, neither taken:

1. **A self-hosted runner** on hardware we control, where the PMU is exposed.
   Buys a genuinely machine-independent metric; costs a machine to own,
   maintain and keep in step with the Actions images.
2. **`valgrind --tool=callgrind`**, which counts instructions in software and
   needs no PMU at all. Deterministic to the instruction. Costs roughly **50x
   slowdown**, which turns the private corpus's ~20-minute pass into ~17
   hours. Viable for a hand-run bisect of one model; not for a corpus gate.

Both stay on the table if pairing ever proves insufficient. Neither is needed
to resolve a 1% regression, which pairing already does.

## The answer: pair both pins inside one job

If the confound is *which machine the job landed on*, and it is a
multiplicative constant applied to everything that machine runs (Evidence 2),
then measuring both engines **on that same machine, in the same job, minutes
apart** cancels it exactly. Not approximately — the factor is common to both
halves of the ratio and divides out.

What is left had to be measured rather than assumed, and Evidence 4 below is
that measurement — an A/A null test of this exact configuration. Its result,
stated here so the claim and its evidence sit together:

- **The whole-corpus aggregate is stable to ~0.2%** under a null.
- **Per model the floor is ~1.4% median |Δ|**, with p10/p90 near ±3–4%.

Those are different quantities, and the difference is the whole of how to read
the gate: a corpus total averages 97 models' independent jitter away, a single
model's row gets no such help. Pairing turns a **13.66%** cross-run floor into
a gate whose **median is stable to under ~0.75%**. That is the win, and it is
now measured rather than inferred.

The **0.111%** figure quoted while this change was being designed — the
perf-counter probe's within-job CV — is *not* a bound on this configuration
and is not used as one anywhere in this document. The probe's workload does no
filesystem I/O by construction; the paired passes read the whole corpus.
Evidence 4 exists because that gap was pointed out in review of #632.

This is not a new idea in this repo; it is the same argument
perf-measurement.md §"The A/B runs as two passes inside one rc job" already
made for the gc-settle A/B, applied to the thing the rc actually gates on.
That section is worth reading for the two residuals it names, both of which
apply here unchanged:

- **Pass order.** Pass 2 runs on a warmer machine, and — correcting what an
  earlier draft of this section said — model file I/O *is* inside one timing
  column. conway#562 moved `loadStartMs` to before `readFileSync`, so
  `totalTimeMs`, the column the gate differences, contains the model read.
  (`parseStartMs` is still taken after it, so `parseTimeMs`, `geometryTimeMs`
  and `parsePlusGeometryMs` do not — which makes the two families a control
  for each other.) The page cache can therefore reach the gate's own column.
  That is exactly what Evidence 4 was built to test, and it measures the
  resulting bias at **0.13%** of corpus total with no per-model signature at
  all. In the pairing implemented here the *current* engine runs first and the
  *previous* pin second, so any residual warming makes the previous pin look
  faster and this release look slower — the delta is biased **toward**
  flagging a regression, which is the safe direction for a gate.
- **No pre-warm, no counterbalancing, no interleave.** Both engines run their
  own whole-corpus pass rather than alternating per model, and no pass is run
  and discarded first. That was an open question until Evidence 4 closed it:
  a pre-warm only earns its cost if pass 1 is cold, and the corpus is
  **already fully page-cache resident before pass 1**, because
  `actions/checkout` with LFS has just written every byte of it through that
  cache into a machine with 16 GB of RAM. A deliberately cold pass costs
  0.13%. So a pre-warm would spend a whole extra corpus pass — ~5 min public,
  ~20 min private, against a 90-minute cap already at ~69 — to remove an
  effect an order of magnitude below the per-model floor, and an interleave
  would spend a new runner mode on the same non-effect. Reach for either only
  if the corpus stops being resident at pass 1; `.github/probe/aa-pass.sh`
  dumps the `vmtouch` residency that says whether it still is.

### What pairing does *not* fix

Pairing cancels the machine. It does not make two *methodologies* comparable.
If the previous pin predates a change to what the bench measures — the #554
settle, the #562 `totalTimeMs` redefinition, the #557 engine-init move — the
paired delta carries that methodology step exactly as the cross-run delta did.
The relevant boundaries are enumerated in perf-measurement.md §"Changelog of
methodology changes" and restated on every blessed snapshot's README; read
them before treating a step-shaped paired delta as an engine change.

## Evidence 4 — the A/A null test: what pairing actually leaves behind

Evidence 1–3 measure the floor pairing *removes*. This one measures the floor
it *leaves*. They are different questions, and only the second one bounds the
gate.

**Why it exists.** In review of #632, codex raised the pass-order objection:
pairing runs the current engine first and the pin second over the same corpus,
`totalTimeMs` contains the model file read since conway#562, and the 0.111%
residual quoted for it came from a probe workload whose own header says it
does "no I/O, no network, no filesystem reads (page-cache state would leak
in)". Every step of that is correct — the number in use could not bound this
configuration. The reasoning was right; whether the effect it predicts is
actually there is only decidable by measurement, and it is not there.

**The test.** [`.github/workflows/perf-aa-null.yml`][aa], run
[33192612782][aarun], on the same `ubuntu-24.04-4vcpu-8gb-150gbssd` label
rc-regression uses. The *identical* engine over the *identical* public corpus
(3.07 GiB of models inside a 7.88 GiB checkout; **99 models walked** under the
batch's exclude, of which **97 are measurable** — see "What the 97 is 97 of"
below), three passes back to back in one job — plus a fourth pass with the
corpus evicted from page cache first. The eviction is
`vmtouch -e` on the corpus only, not `drop_caches`, so node, the wasm Dist and
`node_modules` stay warm and what P3→P4 isolates is the model read and
nothing else.

Every pass is the same invocation, written once in `.github/probe/aa-pass.sh`
so the passes cannot drift apart, and analysed by
`.github/probe/perf-aa-null.cjs`, which reproduces the gate's own statistic
exactly: the median over models of `(later − earlier) / earlier`, no
small-model floor, as `computePercentageChange` in `scripts/gen_delta_csv.cjs`
computes it. So these medians read directly against a real rc paired delta's.

Under a null every delta must be 0. Everything below is what is not 0.

[aa]: https://github.com/bldrs-ai/conway/blob/main/.github/workflows/perf-aa-null.yml
[aarun]: https://github.com/bldrs-ai/conway/actions/runs/33192612782

### The hypothesis is falsified three ways

| | |
|---|---|
| pass wall clock, P1 / P2 / P3 / P4 | 289.85 / 290.56 / 290.55 / 290.44 s |
| max − min across all four, cold pass included | **0.24%** |
| corpus total, warm P3 → evicted P4 | 140.2 s → 140.4 s = **+0.13%** |
| median per-model change, P3 → P4 | **0.000%** |
| corpus page-cache residency before P1 (`vmtouch`) | **2,065,763 / 2,065,763 pages — 7G / 7G** |

1. **The shape is backwards for a cold start.** Median |Δ| of the P1→P2 gap
   divided by the P2→P3 gap is **0.88**: the first gap is *smaller* than the
   second. There is no monotone decline, and P1 came out marginally *faster*
   than P2. A cold-cache story predicts P1 slowest and the sequence
   decreasing; the sign is the other way.
2. **Because there was no cold pass to begin with.** The corpus was **100%**
   page-cache resident before P1 ran. `actions/checkout` with LFS materialises
   every byte of it through the page cache, and the runner holds 15,989 MB of
   RAM against a 3.07 GiB corpus. rc-regression checks out the same way, so
   its first paired pass starts warm for the same reason.
3. **And forcing the cold state costs almost nothing.** P4 puts the corpus in
   the state P1 was assumed to be in: corpus total moves **+0.13%**, the
   median model **0.000%**. Reading ~1.45 GB off SSD rather than out of RAM is
   ~0.6–0.7 s spread across 140 s of compute.

**The direct I/O measurement agrees.** Since #562, `totalTimeMs` starts
*before* `readFileSync` and `parsePlusGeometryMs` starts *after* it, so their
difference isolates the read with no added instrumentation. That difference is
**~1.0 s warm and ~1.6 s cold over the whole corpus**, out of 140 s. Per
model, `totalTimeMs` moved no more than `parsePlusGeometryMs` in any pass
pair, the evicted one included. There is no column-specific I/O signature to
find, because the read is ~1% of the work.

### What the 97 is 97 of

Every pass wrote 97 rows and the analyser paired all 97, which reads like the
whole corpus and is not. The corpus walk finds **99** models at that pin under
the batch's exclude. The two that never appear are lost before any analysis
runs: the per-model perf CSV is named `<stem>.perf.csv`
(`path.parse(ifcPath).name` in `ifc_regression_batch_main.ts`) and written
with an overwrite, so two models sharing a *stem* leave one file between them.
The corpus has two such pairs — `ifc/index.ifc` vs `ifc/bldrs/index.ifc`
([conway#633][i633]), and `step/zoo.dev/a-gear.step` vs its `a-gear.stp`
symlink, which share a stem while their basenames differ.

**No number in this section moves because of that**, and the reason is worth
stating rather than assuming: the two lost models produce no rows *in any
pass*, so they are not silently averaged in anywhere — every median,
percentile and threshold count below is over the same 97 models it always was.
What changes is the denominator those numbers may be quoted against. They are
a floor measured over 97 of 99 models, not over "the corpus".

That distinction was invisible while the analyser seeded its expected models
from the pass outputs, which is the same correlated-loss defect the paired
gate's demand was rewritten to remove: passes that share a driver and a tree
lose the same models together, and a demand read off them cannot notice. The
A/A analyser now takes `--corpus` and `--corpus-exclude` and derives the
demand from `collectCorpusModels()` — the same walk the paired gate uses, not
a second one — reports coverage as its own section above the statistics, and
annotates the job with a `::warning::` on any shortfall. It still exits 0: the
report is the deliverable of four corpus passes and must survive its own bad
news.

[i633]: https://github.com/bldrs-ai/conway/issues/633

### The two floors, which are different numbers

This is the part to quote, and the part not to conflate — and to quote with
the corpus attached, since these were measured on the public one and the
private corpus's own floor is unmeasured ("What this does not bound" below).

| quantity | floor under a null, public corpus (97 of 99 models) |
|---|---|
| **whole-corpus aggregate** (corpus total, pass wall clock) | **0.13% – 0.24%** |
| **per model**, median \|Δ\| over 97 models | **1.27% – 1.58%** |
| per model, p10 / p90 | **≈ −3% / +4%** |
| median % change over the six A/A pairings, all of which must be zero | **0.000% to +0.743%** |

The aggregate is stable because 97 models' independent jitter averages out of
it; a single model's row has nothing to average against. Any sentence quoting
one of these numbers about the other is wrong.

### The consequence that matters: per-model calls under ~5% are noise

Differencing an engine against **itself**, over 97 models:

| models moving more than | count |
|---|---|
| 1% | ~60 of 97 |
| 2% | ~38 of 97 |
| 5% | **10 of 97** |

Ten models "regressed" or "improved" by more than 5% with no code change at
all. The rc job summary prints p10 and p90 beside the paired median exactly
because those tails exist: **at per-model scale they are the noise floor, not
engine signal.** A per-model regression call below ~5% cannot be made from one
paired run, however well the machine cancelled. What the paired gate does
resolve, at high confidence, is the **median over the corpus** — stable to
under ~0.75%.

The remedy for one suspicious model is not a stricter gate, it is repetition:
re-run or hand-bisect that model, where the same pairing argument applies
inside one job at whatever n the question is worth.

### What this does not bound: the private corpus

**Everything above was measured on the public corpus, and the private one is
the corpus that gates a release.** `perf-aa-null.yml` hardcodes
`bldrs-ai/test-models`; it has never run against `bldrs-ai/test-models-private`.
The floors therefore describe 97 public models on that runner label, and three
of the properties they rest on are exactly the ones that differ:

- **Model count and cost profile.** 97 measurable public models at ~140 s of
  total compute against 107 private models at ~20m30s a pass. The per-model
  floor is a distribution over models; a different set of models is a
  different distribution, and the aggregate's stability comes from averaging
  *those* models' independent jitter.
- **Page-cache residency.** The headline result — no cold-start term, because
  `vmtouch` found the corpus 100% resident before P1 — holds *because* 3.07
  GiB fits in 15,989 MB of RAM. That argument does not transfer to a corpus
  that may not fit, and the +0.13% P3→P4 eviction cost is the public corpus's
  answer to a question the private one would answer differently.
- **What the eviction pass measures.** On public, P4 is a small correction. On
  a larger-than-RAM corpus it is the term under test.

So a private snapshot's README must not present these numbers as a bound on
its own file, and since #632 it does not: `renderReadme()` compares the
snapshot's repo against `AA_NULL_CORPUS` and, for any other target, states
that the floor is public-corpus evidence and that this corpus's own floor is
unmeasured.

**What measuring it would cost, honestly.** Four private passes at ~20m30s
(the measured blessed-pass time, rc-regression.yml "THE 35 IS DERIVED") is
**~82 minutes of passes alone**, before the ~2 min build on a warm wasm cache,
the ~1m33s LFS checkout and the census. That is ~87 minutes against this
workflow's 120-minute cap — it fits only while the wasm cache hits, and a cold
wasm build (~30 min) puts it at the cap. **The passes cannot be split across
jobs:** the premise of the whole test is that nothing varies but position in
the sequence, and two jobs are two machines, which is the 11.24% factor this
document exists to remove. It also needs read access to the private repo,
which this workflow does not currently have — it checks out with the default
token, while rc-regression uses a secret.

None of that is a reason to skip it; it is a reason not to describe it as a
quick follow-up. A defensible smaller version exists — three passes and no
eviction is ~62 minutes and still answers the shape question — but the
eviction pass is the one that matters most on a corpus that may exceed RAM, so
the cheap version is the least informative one. Until someone spends the job,
**the private floor is unmeasured**, and that is what the generated README
says.

### What this changed in #632, and what it did not

- **No pre-warm and no counterbalancing were added.** There is no cold-start
  term to counterbalance, and forcing one costs 0.13%. Reasoning in "The
  answer" above.
- **Pass ordering is unchanged**, and so is its bias-direction argument, which
  this result does not touch.
- **The unsupported claim is gone.** "Within-job precision is 0.111%, so a
  sub-1% move is real" has been removed from this document, from the generated
  snapshot README (`scripts/bless_perf_snapshot.cjs`), from `rc-regression.yml`
  and from the rc job summary, and replaced by the two measured floors and the
  ~5% per-model statement above.
- **The pairing logic itself is untouched.** The A/A result bears on how a
  paired delta should be *read*, not on how it is computed.

### The A/A workflow stays, for the same reason the probe does

`perf-aa-null.yml` is kept and stays dispatchable rather than being deleted
now that it has answered. Both experiments in this repo re-test a premise that
will drift without announcing itself:

| workflow | the premise it re-tests | drifts when |
|---|---|---|
| `perf-counter-probe.yml` (runs [33140946078][p1] / [33141507310][p2]) | the runner pool's composition, and that its PMU is masked | GitHub adds or retires host generations, or exposes a PMU |
| `perf-aa-null.yml` (run [33192612782][aarun]) | the paired gate's own noise floor | the corpus outgrows RAM, the runner label changes, harness concurrency changes, or the corpus's cost profile shifts |

The A/A one has a specific trigger to watch for. The whole no-cold-start
finding rests on the corpus fitting in 16 GB *after* checkout has warmed it,
and the private corpus is the larger one. Re-run this experiment before
trusting the floors above on a corpus that no longer fits; the `vmtouch`
residency dump in `.github/probe/aa-pass.sh` is the check, and it prints on
both sides of every pass.

## What changed in rc-regression

Implemented alongside this document.

**The `rebless` job runs a second corpus pass with the previous pin's engine.**
The previous pin is the same one the cross-run delta already used — the newest
`benchmarks/conway<version>-ci_<repo>/` directory sorting strictly below the
version being blessed, resolved by `findPreviousSnapshot()` in
`scripts/bless_perf_snapshot.cjs` with `scripts/version_order.cjs` as the
comparator. `scripts/resolve_previous_pin.cjs` exposes that resolution to the
workflow so the paired pass and the legacy delta can never disagree about
which two engines are being compared.

That engine is materialised as the **published `@bldrs-ai/conway` package** at
that version, and the paired pass runs **that package's own**
`ifc_regression_batch_main.js`. Both halves are therefore the same harness —
the regression child, not headless-three — which is what keeps the delta out
of `gen_delta_csv.cjs`'s cross-harness withholding (perf-measurement.md
§"The matrix has converged"). Its digests go to a scratch directory outside
the models checkout and are never blessed; only its perf CSV is kept.

**Both deltas are emitted.** The paired one is authoritative; the cross-run
one is retained for continuity with the historical archive, which contains
nothing but cross-run rows and cannot be retrofitted.

| file | `engine1TotalTimeMs` means | read it as |
|---|---|---|
| `conway<prev>-ci_<version>_paired_delta.csv` | the previous pin, measured **in this job, on this machine** | the gate |
| `conway<prev>-ci_<version>_delta.csv` | the previous pin, as recorded by **its own release's run** | continuity with the archive only |

Every delta row now carries a **`measurementBasis`** column reading `paired`
or `crossRun`, so a row states its own provenance without a reader having to
know which file it came from. The snapshot README written by
`bless_perf_snapshot.cjs` says the same thing in prose. Both exist because the
failure mode this whole document describes is someone reading a cross-run row
as signal.

The previous pin's own rows are archived beside the deltas as
`performance-detail-paired-conway<prev>.csv`, so the paired `engine1` numbers
are inspectable after the run artifact expires.

### The paired delta is all-or-nothing

A paired delta over a silently reduced corpus is worse than no paired delta,
because everything downstream — the README, the job summary, the release
conversation — presents it as the gate. Two things enforce that it is complete.

**Coverage is checked as a set, and a shortfall degrades the release to
cross-run.** Nothing upstream fails loudly when the paired pass loses models:
a per-model child that times out or is killed leaves no per-file perf CSV,
`aggregatePerfCsvs()` writes the rows that survived, and the batch still exits
0 — so a truncated `perf-paired.csv` is indistinguishable from a complete one
by existence, exit status or row count. `bless_perf_snapshot.cjs` therefore
compares the paired delta's row set against the models it had to cover and, on
any missing model, withholds the paired delta entirely, names the missing
models in the job summary and in the snapshot's README, and falls back to the
cross-run delta. A set, not a count: two failures cancelling two additions
leaves a count intact, and the set difference is what names the models.

**What it has to cover is derived from the corpus, not from either pass.**
The first version of this check read the demand off the blessed pass's own
rows, reasoning that both passes walk the same tree under the same exclude
regex. That is exactly why it was wrong: sharing a driver means sharing its
failure modes. A model whose child dies in *both* passes is absent from both
row sets, the set difference is empty, and a paired median over a quietly
smaller corpus is published looking complete. The demand now comes from
`collectCorpusModels()` walking the models checkout — the one party in this
chain that did not run either pass — mirroring `collectIFCFiles()` in
`ifc_regression_batch_main.ts` and taking the batch's exclude regex via
`--corpus-exclude`. A model counts as covered only when *both* passes measured
it, because that is exactly the set of rows a paired delta contains.

**Anything that makes coverage unverifiable degrades too — an unverifiable
gate is not a gate.** An expected-model list that cannot be read; a corpus walk
that throws; a smoke list whose entries match no corpus file (a
misconfiguration, and narrowing the gate to whatever happened to match is the
failure this check exists to prevent); an expected set that comes out empty,
where nothing can be missing and any paired CSV at all would pass. Each lands
in the same cross-run-only branch, with its own reason on the snapshot's face.

**A basename collision degrades it as well, for now.** Perf rows and digest
stems are keyed on `path.basename()`, so two corpus models sharing a basename
write the same `<stem>.perf.csv`: one row is lost, and a check keyed on the
same basename cannot see it go. The corpus has a live pair — `ifc/index.ifc`
and `ifc/bldrs/index.ifc` are different files — so today this branch fires and
every release falls back to the cross-run delta. That is the honest state:
under-covering in silence is the thing being avoided. The real fix is
path-qualified model identities across the perf CSVs and the digest stems,
which moves the benchmarks layout and needs its own bless cycle; it is tracked
as [conway#633](https://github.com/bldrs-ai/conway/issues/633), and this branch
comes out when it lands.

**A row with only one side is absent, not `N/A`.** `generateDeltaCSV` unions
its two inputs, which is right for `crossRun` — a model added to or dropped
from the corpus between two releases is a fact worth carrying — but in a
`paired` file the label asserts of every row that both engines were timed in
one job on one machine. A one-sided row cannot make that claim, so the paired
delta drops it rather than publishing it with `engine1 = N/A` under a `paired`
stamp. This is what makes the README's "every model outside the smoke subset
has a `crossRun` row and no `paired` row" true rather than aspirational.

### The field-semantics change, recorded

`engine1TotalTimeMs` in the paired file stops meaning "a number from a previous
run" and starts meaning "a number from this run". Per perf-measurement.md
§"The rule for changing fields", redefining a recorded field is fine when the
methodology improves, provided the choice is written down — this section is
that record, and the changelog entry below is its index. The comparable is
carried where it can be: the legacy cross-run file keeps the old semantics
under the old name, unchanged.

### Cost

The paired pass is a second full-corpus pass, so it costs what the blessed
pass costs. Measured step wall times (perf-measurement.md §"What the second
pass costs"):

| | public | private |
|---|---|---|
| blessed pass | 5m15s | ~20m30s |
| paired pass (previous pin) | ~5m15s (est.) | ~20m30s (est.) |
| npm install of the previous pin | <1m (est.) | <1m (est.) |

The private corpus is the binding constraint, as always. A plain rc job goes
from ~48 min to **~69 min**, against a 90-minute job cap that was already sized
for the two-pass `perf_ab` run. The paired pass gets its own 35-minute step
cap, on the same derivation as the blessed pass's.

Two consequences:

- **`perf_ab` and pairing cannot both run in one job.** Four corpus passes is
  ~83 + ~21 = ~104 minutes against a 90-minute cap. The workflow rejects the
  combination up front with an explicit error rather than dying in a step 70
  minutes in. `perf_ab` is opt-in and rare; pairing is the default.
- **`perf_pair: smoke` exists for when the full pass is not worth 20 minutes.**
  It pairs over `regression/smoke_models.txt` — the curated PR-time subset,
  a spread of schemas, exporters, IFC and STEP, deliberately excluding the
  slow models — using the same exclude-regex construction `build.yml` uses.
  It is a **narrower gate, and it says so**: the paired delta then covers ~12
  models instead of 97, and the README records which scope produced it. This
  is offered as an explicit choice, never as a silent fallback.

Once per release, for a delta that is a measurement rather than a lead, the
full pass is the default and the right one.

## Calibration normalisation: strictly worse, and still worth having

Pairing fixes every **future** delta. It does nothing for the archive: every
committed `performance-detail.csv` was measured on an unknown machine, and
those measurements cannot be re-taken.

The only available repair there is **calibration** — run a small fixed
workload on every future job, record its time, and divide each run's numbers
by that machine's calibration figure before comparing across runs. It is
strictly worse than pairing, for reasons the probe measured:

- It corrects for a *scalar* per machine, while the real factor varies by
  workload mix. Evidence 2 says the factor is close to uniform across model
  duration, which is encouraging, but "close to uniform" is not "cancels
  exactly", which is what pairing gets for free.
- It needs the calibration workload to be representative. The probe's own
  workload is not conway.
- It cannot be applied backwards at all: no historical run recorded a
  calibration figure, so the existing archive stays uncorrectable no matter
  what future jobs record.

So: not a substitute for pairing, and not implemented here. Worth recording as
the only known route to making *already-recorded* history comparable, and the
reason a future job might start emitting a calibration column even though its
own deltas do not need one.

## The probe workflow stays

`.github/workflows/perf-counter-probe.yml` is kept rather than deleted. Its
question is answered, but the answer is a property of **GitHub's runner pool**,
not of conway — the pool gained an EPYC 9V74 generation at some point, and it
can gain a PMU-exposing host, or lose the Intel machines, without telling
anyone. The probe is the thing that re-tests the assumption in one dispatch
when a timing result stops making sense.

Its `push:` trigger is removed and it is now **`workflow_dispatch`-only**. The
push trigger existed because a `workflow_dispatch`-only workflow is not
dispatchable until it sits on the default branch; once this lands on `main`
that constraint is gone, and leaving a push trigger on an experiment branch
would re-run a 6-VM matrix on every commit to files it watches.

## Changelog of methodology changes

perf-measurement.md §"Changelog of methodology changes" is the index for the
*columns*. This is the index for the *comparison*:

| when | change | why |
|---|---|---|
| this change | the rc perf delta is computed from two passes **in one job**; `engine1TotalTimeMs` in `*_paired_delta.csv` is measured by this run, not read from a previous one | cross-run drift measured at 13.66% median (97 models, two attempts of run 33128910045, byte-identical digests) against a 9.40% median reported regression — the signal was smaller than the noise. An A/A null test of the paired configuration (run 33192612782, public corpus, 97 of its 99 walked models) puts its own floor at 0.13–0.24% on the corpus aggregate and ~1.4% median \|Δ\| per model, so pairing turns a 13.66% cross-run floor into a gate whose median is stable to under ~0.75% — while per-model calls below ~5% stay inside the floor |
| this change | the legacy cross-run `*_delta.csv` is retained alongside the paired one, and every delta row gains a `measurementBasis` column | the historical archive is cross-run and cannot be retrofitted; a file that keeps both must say on each row which is which |
| this change | `perf-counter-probe.yml` becomes `workflow_dispatch`-only | its question is answered; its subject (the runner pool) can change without notice, so it is kept runnable rather than deleted |
| this change | `perf-aa-null.yml` is added, and kept after answering | it measures the paired gate's own noise floor (Evidence 4), replacing the 0.111% figure that could not bound a configuration doing corpus I/O. Its subject — the corpus, the harness and the runner's RAM — changes without notice too |

## Related

- [perf-measurement.md](perf-measurement.md) — what each column holds, the
  rule for changing one, and the gc-settle A/B whose two-passes-in-one-job
  design this generalises
- [ci-regression-cost.md](ci-regression-cost.md) — CI tiering and the rc /
  re-bless / LFS runbook the added pass is budgeted against
- `.github/workflows/rc-regression.yml` — the `rebless` job, its pass caps and
  the arithmetic behind them
- `.github/workflows/perf-counter-probe.yml` + `.github/probe/perf-counter-probe.mjs`
  — the probe, and how to re-run it
- `.github/workflows/perf-aa-null.yml` + `.github/probe/aa-pass.sh` +
  `.github/probe/perf-aa-null.cjs` — the A/A null test behind Evidence 4, and
  how to re-run it when the corpus or the runner changes
- `scripts/bless_perf_snapshot.cjs`, `scripts/resolve_previous_pin.cjs`,
  `scripts/version_order.cjs` — how the previous pin is resolved, and how the
  two deltas are written
