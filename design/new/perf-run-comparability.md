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

`ubuntu-24.04-4vcpu-8gb-150gbssd` is a label, not a machine.

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

What is left is the within-job precision: **0.111%**. That is a gate that
resolves sub-1% regressions, against a previous gate whose noise floor was
13.66%.

This is not a new idea in this repo; it is the same argument
perf-measurement.md §"The A/B runs as two passes inside one rc job" already
made for the gc-settle A/B, applied to the thing the rc actually gates on.
That section is worth reading for the two residuals it names, both of which
apply here unchanged:

- **Pass order.** Pass 2 runs on a warmer machine. Model file I/O is outside
  every timing column (`parseStartMs` is taken after `readFileSync`), so the
  page cache cannot reach them; what pass 2 gets is warmer node and wasm
  module loads. In the pairing implemented here the *current* engine runs
  first and the *previous* pin second, so any residual warming makes the
  previous pin look faster and this release look slower — the delta is biased
  **toward** flagging a regression, which is the safe direction for a gate.
- **A block design, not an interleave.** Both engines run their own whole-
  corpus pass rather than alternating per model. Interleaving would remove the
  warming residual too, but at 0.111% within-job CV the residual it removes is
  smaller than a rounding error on the gate, and it would need a new runner
  mode. Reach for `--interleave` only if a movement of that size ever needs
  explaining.

### What pairing does *not* fix

Pairing cancels the machine. It does not make two *methodologies* comparable.
If the previous pin predates a change to what the bench measures — the #554
settle, the #562 `totalTimeMs` redefinition, the #557 engine-init move — the
paired delta carries that methodology step exactly as the cross-run delta did.
The relevant boundaries are enumerated in perf-measurement.md §"Changelog of
methodology changes" and restated on every blessed snapshot's README; read
them before treating a step-shaped paired delta as an engine change.

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
| this change | the rc perf delta is computed from two passes **in one job**; `engine1TotalTimeMs` in `*_paired_delta.csv` is measured by this run, not read from a previous one | cross-run drift measured at 13.66% median (97 models, two attempts of run 33128910045, byte-identical digests) against a 9.40% median reported regression — the signal was smaller than the noise. Within-job CV is 0.111%, so pairing turns a 13.66% floor into a sub-1% gate |
| this change | the legacy cross-run `*_delta.csv` is retained alongside the paired one, and every delta row gains a `measurementBasis` column | the historical archive is cross-run and cannot be retrofitted; a file that keeps both must say on each row which is which |
| this change | `perf-counter-probe.yml` becomes `workflow_dispatch`-only | its question is answered; its subject (the runner pool) can change without notice, so it is kept runnable rather than deleted |

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
- `scripts/bless_perf_snapshot.cjs`, `scripts/resolve_previous_pin.cjs`,
  `scripts/version_order.cjs` — how the previous pin is resolved, and how the
  two deltas are written
