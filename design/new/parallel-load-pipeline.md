# Parallel load pipeline: is O(cores) reachable, or is ~30 % the real ceiling?

**Status:** design analysis. Drafted 2026-08-26 by reading code and
committed CSVs; **corrected 2026-08-27 against measurements taken on
`claude/parallel-index-spike`** (`8d2f5cc3`), which refuted two of its
load-bearing numbers and reordered its priorities. The corrections are
shown, not silently applied — §0.1 is the diff.

**Read against:** conway `main` @ `c02b125` (= #605's head, merged as
`3eae7637`), Share `main` @ `6608bdb`, the blessed perf snapshots in
`test-models/benchmarks/`. Line citations were taken at `c02b125` and
drift by a line or two on later heads.

**Every claim below is tagged.**

| tag | means |
|---|---|
| *(verified)* | read in code or in a committed file, with the citation |
| *(measured here)* | measured on `claude/parallel-index-spike`, 2026-08-27, by `scripts/load_phase_report.mjs` or `scripts/index_shard_spike.mjs`; raw JSON in that branch's write-up |
| *(measured elsewhere)* | a number someone else recorded, cited to where |
| *(inference)* | reasoning from those, not itself observed |
| *(unknown)* | nobody has measured it, and I am saying so rather than guessing |

Measurement box for every *(measured here)* number: 4 cores / 16 GB / no
swap, Node 22, prebuilt `ConwayGeomWasmNodeMT` `@bldrs-ai/conway@1.546.1556`,
loadavg stamped per run.

---

## 0. Verdict first

Three things, and the order matters because the third outranks the other
two on the model that shows it.

1. **The parse→geometry barrier is essential, not incidental.** Durable
   geometry correctness depends on *inverse* relationship records
   (`IfcRelVoidsElement`, `IfcRelAssociatesMaterial`, `IfcStyledItem`,
   `IfcRelAggregates`), reachable only through whole-index type queries
   and writable anywhere in the file. No prefix can ever prove that no
   further void is coming. The design doc already says this in as many
   words (`streaming-federated-loader.md:1291-1294`), and the preview
   channel's contract is built on conceding it. So
   `6 + max(15.8, 9.5) + 5.3` is **not** available by wiring the durable
   pump the way the preview pump is wired. **Unchanged by measurement, and
   the measurement raised its stakes** — see point 3.
2. **`parse` need not be one serial term, and now it demonstrably is
   not.** #542's rejection of parse sharding was measured against
   **preview coverage at equal bytes scanned** — equal CPU, not equal
   wall-clock. For the durable path nothing needs a contiguous leading
   prefix. The corrected structure is `prep + parse/N + geometry/N +
   assemble`, and a spike now builds a **byte-identical** merged index
   from N workers at **3.42× on PSB** *(measured here)*.
3. **On a D3D-shaped model none of that is the lever, and this document
   has to say so about itself.** 56.2 % of D3D's 266 s load is
   `AggregateExtractPager.ensureForStep`, reading **47.1 GB from a
   213.6 MB file — 220× amplification**; `agg.step` is another 27.5 %.
   Index build is **1.6 %** and per-product extraction **1.3 %**
   *(measured here)*. Filed as **[#616](https://github.com/bldrs-ai/conway/issues/616)**.
   PSB does not show it at all. **Perfect parallelism in the two phases
   this milestone targets saves under 2 % of a D3D load while #616 burns
   56 %.** The mechanism is measured; it is **not diagnosed**, and this
   document does not speculate a cause as if it were established.

Corrected ceiling, arithmetic in §8: **PSB (Node) 35.34 s → 13.94 s at
N=4** using only measured efficiencies — **2.54×, −60.6 %** — with an
engine-side Amdahl floor of **16.7×**, not the 4.7× this document
originally claimed. The same arithmetic on D3D gives **1.03×**.

**Separately: the Arty ~20 s → ~10 s goal appears to have already been
met, three weeks ago, by work unrelated to any of this.** See §11 — the
repo's own committed delta CSV records `Arty_Z7.stp 19741 ms → 9441 ms,
−52.18 %`. Still worth one confirmation run (M6).

---

## 0.1 What the measurements changed — the correction diff

The 2026-08-26 draft of this document inferred three numbers by
subtraction and built its central claim on them. Two were wrong. They are
recorded here as they were, because a design doc whose arithmetic is
quietly rewritten is not a record of anything.

| # | draft claimed | how it got there | measured | verdict |
|---|---|---|---|---|
| 1 | `prep 6 s + assemble 5.3 s ≈ 11.3 s` = 21 % of baseline; **Amdahl floor 4.7×** | subtraction from #541's browser total; the draft itself flagged it *"estimates of unknown provenance"* and made measuring it item M3 | `prep` **1.05 s**, `assemble` **1.07 s**, whole serial residual **2.12 s = 6.0 %** of a 35.34 s PSB load *(measured here)* | **wrong, by ~5×.** Engine-side floor is **16.7×** |
| 2 | the 12.5 s browser residual is engine work | same subtraction | engine's share of it is ~3.1 s after scaling by the browser/Node parse ratio; **~9.4 s is not engine code** | **reassigned, not deleted** — §8.4. Still on the user's critical path, owned by Share, **unmeasured** |
| 3 | index-build sharding is the cheap route, blocked on a "real, unbudgeted hazard" (boundary resync) and on `η` | inference from `layout_report.mjs`'s doc comment plus #542's structure | byte-identical merged index at N=1,2,4 on three models, **0 boundary repairs**; PSB **3.42×**; **D3D 0.83× at N=2, 1.10× at N=4** *(measured here)* | **confirmed, with a real negative.** §3.5, §8.6 |

Two smaller ones, also folded in:

| | draft claimed | measured |
|---|---|---|
| 4 | *"parse sharding is a go/no-go and `η` is unmeasured"* (M2) | **η = 0.935 at N=4** on PSB against a **0.96** pure-CPU box calibration *(measured elsewhere — #394 comment [5434116919](https://github.com/bldrs-ai/conway/issues/394#issuecomment-5434116919))*. The index build is CPU-bound. §3.4 |
| 5 | merging N sinks is *"mechanical if shards cover disjoint byte ranges and are concatenated in address order"* *(inference)* | **incomplete.** Concatenation is wrong for the inline-entity range and the merge needs a **global** re-unfold, plus three details that each break silently. §3.5 |

**What survived untouched:** §1's essential-barrier analysis, §2's
readiness predicate, §3.1–3.3's argument that #542's rejection does not
bind the durable path, §5's account of what #538 actually shipped, and
§11's Arty finding. Those are the parts of the draft that were read out of
code rather than derived by subtraction, which is itself the lesson.

---

## 1. Where the barrier is

### 1.1 The literal seam

`IfcApiProxyIfc.parseColumnarFromStore` — the path Share runs — is
strictly ordered *(verified)*:

| line | what |
|---|---|
| `ifc_api_proxy_ifc.ts:1206` | `buildIndexStreamingAsync(...)` — the whole windowed parse |
| `:1221` | `const columns = sink.finalize()` |
| `:1246` | `const model = new IfcStepModel( void 0, columns, provider )` |
| `:1252` | `await conwayGeometry.ensureResidentForDemandPrep()` |
| `:1255` | `conwayGeometry.prepareDemandExtraction()` |
| `:1283` | returns `deferred: true` — Share's pump starts here |

The pump's worklist is then built lazily at the first
`ExtractGeometryBatch` (`:2080` → `:2272 ensureDemandWorklists_`), and
`:2411` reads `for (const product of this.model[0].types(IfcProduct))`
*(verified)*. So the durable pump is fed a **finalized** index and asks it
a **whole-model type question** before it extracts anything.

This ordering is also what `scripts/load_phase_report.mjs` times, phase by
phase, by wrapping the shipped prototypes rather than re-implementing the
sequence — a re-implementation drifts from production silently, a wrapper
cannot, because if a call disappears its bucket goes to zero and the
residual grows to match.

### 1.2 Why the preview channel is not a counter-example

The preview channel does work off the growing prefix, and it is tempting
to read that as proof the durable path could too. It is not, and the
difference is written into the code.

`StorePreviewChannel.ensureGeneration_` (`store_preview_channel.ts:546`)
per generation *(verified)*:

- `:611` `const columns = this.sink_.snapshot()` — a **prefix** copy,
  stamped `indexIsPrefix: true` (`columnar_index.ts:177-187`);
- builds a **throwaway** `IfcStepModel` + `IfcGeometryExtraction` over it;
- `:638` `extraction.deferDanglingPlacements = true`;
- `:643` `extraction.prepareDemandExtraction( true )` — the **lightweight**
  form;
- `disposeGeneration_()` throws the previous generation away entirely.

`prepareDemandExtraction`'s own doc comment states what the `true` buys
(`ifc_geometry_extraction.ts:7141-7152`, *verified*):

> *"Preview-only preparation … **skips the relationship sweeps
> (rel-materials, rel-voids)** whose entity materialization dominates
> preparation cost on large models — extracted products then **miss
> openings and rel-bound materials**, which preview consumers accept by
> contract."*

So the preview channel does not solve the readiness problem. It **opts
out of it**, ships knowingly-wrong geometry, and is replaced wholesale by
the durable pump. The design doc says the same at the architecture level
(`streaming-federated-loader.md:1291-1294`, *verified*):

> *"Durable extraction cannot run mid-parse: relationship records
> (rel-voids, rel-materials, styled items) extend to ~92–97 % of real
> files' depth, so any prefix extraction can miss openings/materials."*

I could not find the source of that **92–97 %** figure anywhere in the
repo — `grep` returns exactly that one sentence. Treat it as
**unsourced** *(flagged)*; §10.M1 re-derives it, and re-derives the
*right* version of it, which is not the same statistic (see §2.3).

One footnote that the 2026-08-27 measurements add: *"whose entity
materialization dominates preparation cost on large models"* is, on PSB,
**not true of the sweep timings**. The five sub-sweeps inside `prepMaps`
cost `styledItems` 55, `relMaterials` 21, `linearScale` 3, `relVoids` 2,
`materialDefs` 0 ms — **81 ms total** against `prepPaging`'s 768 ms
*(measured here)*. The sweeps' cost is real but it is *paging*, not
materialization, and the whole of `prep` is 1.05 s. The doc comment's
*claim about relative cost* is what the preview's opt-out is justified by;
the opt-out's *correctness* argument (§1.3) is untouched by this and is
the one that matters.

### 1.3 Essential or incidental — the verdict, by component

| what the durable path needs before extracting product *p* | prefix-decidable? | verdict |
|---|---|---|
| *p*'s forward `#ref` closure | **yes** — this is exactly what the preview's `deferDanglingPlacements` / `extractPlacementStrict_` tests | **incidental** |
| every `IfcRelVoidsElement` targeting *p* (openings) | **no** — inverse; can be written after *p*, and "no more are coming" is undecidable from a prefix | **essential** |
| every `IfcRelAssociatesMaterial` / `IfcStyledItem` reaching *p* | **no** — same shape | **essential** |
| whether *p* is an `IfcRelAggregates` target (per-product pass vs aggregate pass) | **no** — `aggregateTargetLocalIDs()` iterates `this.model.types(IfcRelAggregates)` over the whole index (`ifc_geometry_extraction.ts:6781-6800`) | **essential** |
| project units / `IfcMaterialDefinitionRepresentation` | in practice yes (file head) | incidental |

The aggregate one is the sharpest, and it got sharper.
`ifc_api_proxy_ifc.ts:2400-2417` *(verified)* explains what happens if you
get it wrong: a product extracted by the per-product pass when it should
have gone through the aggregate pass *"would emit their instances with the
uncut/placeholder content and the pass's later replacement would never
reach an incremental consumer (it copies at delivery), while the pass's
second scene instance would draw over the first."* That is a wrong
picture, not a slow one.

**And on D3D that same aggregate pass is 84 % of the load** *(measured
here, §8.6)*. So the row of this table that is hardest to make
prefix-decidable is also, on at least one real model, the row that owns
almost all of the time. Any future attempt at §1.4's speculative overlap
would be attacking the correctness of the pass that #616 says is already
the dominant cost — which is an argument for fixing #616 first on its own
merits, independent of parallelism.

**So: the barrier is essential.** Not because nobody wired it otherwise —
because a growing prefix cannot answer "is this product complete?" for
any inverse relationship, and three separate kinds of inverse
relationship change the geometry.

### 1.4 The one route that does break it — and what it costs

There is a way to overlap anyway: **extract speculatively during parse,
and repair when a late inverse record contradicts you.** Repair means
releasing the product's assets and re-extracting.

That is not free and it is not new. It is *exactly* the failure mode
already measured: `supercap.step` delivers **169 instances against
classic's 101** when a shared geometry is released and a later product
re-extracts it, because `streamNewMeshes_`'s positional watermarks
desynchronise and the scene walk appends fresh nodes (#394 audit comment,
*measured elsewhere*). So speculative-extract-and-repair is **gated on
Part A** — asset-keyed delta capture and refcounted `SharedAssetPool`
retention — which is the open half of M3 and is being built anyway. The
two compose: Part A is the machinery that makes retraction expressible.

Cost of repair is `(fraction of products touched by a relationship record
that arrives after the product's own extraction) × extraction cost`, and
that fraction is still **unmeasured** *(unknown)*. §10.M1 measures it. It
is the single number that decides whether §1.4 is a real option or a trap.

I do **not** recommend it as the first move. §3 gets most of the win on
PSB without touching the barrier at all — and on D3D neither route is the
lever.

---

## 2. The readiness contract

### 2.1 What exists

Preview readiness is: *product `p` is emittable when its whole reference
closure lies inside the scanned prefix.* Implemented as
`deferDanglingPlacements` (`ifc_geometry_extraction.ts:492`, `:8260-8274`)
→ `extractPlacementStrict_` (`:5693`) throwing a tagged
`DanglingPlacementError`, caught by the channel, queued in
`deferredForRetry_` (`store_preview_channel.ts:504`) and retried against a
longer index once the generation is preempted on index growth (`:584`,
`:662`) *(verified)*.

That machinery is sound and reusable. What it does **not** do is answer
the essential half of §1.3.

### 2.2 The durable readiness predicate, stated

```
DurableReady(p, prefix) ≡
      ForwardClosureScanned(p, prefix)                     -- preview already tests this
  ∧   NoFurtherInverseRecordFor(p)                         -- NOT prefix-decidable
  ∧   AggregateRoleKnown(p)                                -- NOT prefix-decidable
```

The second and third conjuncts are only decidable at end-of-parse, or by a
**separate exhaustive scan of the relationship record types**. There is no
third option: a record type's completeness is a global property.

### 2.3 The statistic that actually matters

`streaming-federated-loader.md`'s "~92–97 % of file depth" is the *depth
of the last relationship record*. That is the wrong statistic for this
decision, because it is a max, and one late `IfcStyledItem` sets it to
100 %.

The decision-relevant statistic is a **distribution**:

> For each prefix fraction *x*, what fraction of products have **every**
> inverse record that reaches them (voids, materials, styles, aggregate
> membership) already inside the prefix?

If that curve tracks the diagonal, speculative extraction repairs almost
nothing and §1.4 is cheap. If it is a step at 0.95, §1.4 is a trap.
`scripts/layout_report.mjs` already has the byte scanner, the express-ID
table and the transitive-closure machinery to compute it *(verified,
`layout_report.mjs:1-55`)*; the extension is a new record-type set and an
inverse-direction edge walk. **This is measurement M1, it is still not
done, and it remains the cheapest decisive thing on the list.**

---

## 3. Parse sharding, reconsidered against #542 — and then measured

### 3.1 What #542 actually rejected

#542's table *(measured elsewhere)*:

| model | prefix | N=1 | N=2 | N=4 | N=8 |
|---|---|---|---|---|---|
| DOWA | 70 % | 19,854 | 1 | 1 | 0 |
| MB-Khaya | 70 % | 2,872 | 2 | 1 | 1 |
| BLSN | 40 % | 308 | 0 | 0 | 0 |

Two properties of that experiment decide how far it generalises:

- **The objective is preview coverage** — products emittable from a
  partial scan.
- **The control is "at equal bytes scanned"** — i.e. equal *CPU*, N
  readers advancing together through a fixed total byte budget.

The mechanism is exactly right for that objective: a leading prefix is one
contiguous region, N readers replace it with N regions and N−1 holes, and
any closure spanning a hole is blocked.

### 3.2 Why it does not reach the durable path

For durable throughput:

- **Nothing needs a contiguous prefix.** Every product is extracted
  eventually; the index is consumed only when complete.
- **At completion there are no holes.** The union of N disjoint byte
  ranges covering `[0, L)` is `[0, L)`. Coverage-at-a-prefix is not a
  property of the finished index.
- **"Equal bytes scanned" is the wrong control when the premise is that
  cores are idle.** The whole point of the exercise is to spend more
  cores, not fewer bytes. At equal *wall-clock* with N real cores, a
  sharded reader's leading shard covers exactly what an unsharded reader
  covers (same speed over the same bytes from offset 0), *plus* N−1 other
  regions — and it finishes the whole file N× sooner. That last clause was
  *(inference)* in the draft and depended entirely on parse being
  CPU-bound; §3.4 now measures it.

So **the rejection does not generalise.** I want to be careful here: I am
not saying #542 was wrong. Its conclusion is correct for its objective and
its control. I am saying the durable path has a different objective and
the control that fits it is different.

### 3.3 The repo already said this

`scripts/layout_report.mjs:41-44`, in the same doc comment that reports the
negative sharding curve *(verified)*:

> *"The conclusion that survives: **shard the INDEX BUILD, not the parse
> the preview reads.** An offset/type index has no closure, so it shards
> without penalty, and once it is complete the windowed provider can page
> any closure at any offset — which is what makes file layout stop
> mattering."*

That is precisely the design in §7. It was written down, and the burn-down
that later flattened "parse sharding — rejected on measurement" into the
"Not in this milestone" list dropped the distinction. **The `#394` body's
"Not in this milestone → Parse sharding" bullet should be narrowed to
"parse sharding *as a preview-coverage lever*".**

### 3.4 M2: the index build is CPU-bound

This was the draft's go/no-go, framed with a falsifier: *if efficiency
comes back under ~0.5, parse is bandwidth-bound, #542's control was right
after all, and the whole direction collapses to the burn-down's ~30 %.* It
did not *(measured elsewhere — #394 comment [5434116919](https://github.com/bldrs-ai/conway/issues/394#issuecomment-5434116919))*.

Method: N concurrent processes each build a **full** index of the same
model; each process's own parse time is compared against the solo run.
Replicas rather than slices, deliberately — it avoids record-boundary
handling entirely and measures the same quantity, because splitting one
parse N ways can only pay by as much as N concurrent parses fail to
contend. Parse time is taken after the file read, so it excludes I/O. The
box was calibrated first: 4 pure-CPU processes, 38,885 ms solo →
40,480 / 40,317 / 40,487 / 41,281 ms, **efficiency 0.96**.

**PSB.ifc, 902,472,037 B**, warm baseline median 9,915 ms:

| N | median parse | slowdown vs solo | **efficiency** | aggregate throughput |
|---|---|---|---|---|
| 1 | 9,915 ms | 1.00 | 1.00 | 1.00× |
| 2 | 10,937 ms | 1.10 | **0.907** | 1.81× |
| 4 | 10,608 ms | 1.07 | **0.935** | **3.74×** |

MB-Khaya for contrast: 0.947 at N=2, **0.602** at N=4 — expected at 483 ms
of parse, where process startup and JIT warm-up are a large fraction.

**Establishes:** no shared bottleneck inside conway's index build stops
N-way sharding paying at N=4 on this class of machine.
`prep + parse/N + geometry/N + assemble` is reachable arithmetic.

**Does not establish, and this is the sharp edge:** PSB is 902 MB on a
16 GB box, so after the first read it is entirely in page cache. This
measures CPU and memory bandwidth; it does **not** measure storage I/O. A
browser paging the same model through OPFS is a different system, and
#541's 3.0× browser regression (52.9 s → 159.1 s under `?feature=workers`)
is still unexplained. **M2 rules out the engine's parse as the contended
resource; it does not rule out OPFS.**

### 3.5 M7/M8: the sharded build, actually built

`scripts/index_shard_spike.mjs` *(measured here)*. N worker threads each
index a byte range of one file through the **production** parse loop
(`StepParser.parseDataBlockStreamed` driven by the production moving
window from `streaming_index_builder.ts`) into an independent minimal
sink; the main thread merges the shard columns into one
`StepIndexColumns` and compares it with a single-threaded build. Two
changes to the builder, both named in the source: the parse starts at an
arbitrary absolute offset (via `ParsingBuffer.rebaseWindow`, which is what
keeps `address` file-absolute) instead of after a header parse, and it
stops at the first record boundary at or past its end offset instead of at
`ENDSEC`. Deliberately no grow-and-restart — an over-long record is a hard
failure, not a silent re-scan.

**The boundary hazard, which the draft called "a real, unbudgeted hazard",
is now budgeted and closed.**

*Candidate.* `findBoundaryCandidate` looks for a line-anchored record head
— a `#` that starts a line, followed by digits and `=`, whose preceding
non-whitespace byte is `;` — and returns the offset *just after that `;`*.
That offset is chosen deliberately: it is exactly where the parse loop's
own `onRecordBoundary` fires (`step_parser.ts:860-876`). Identical
definitions on both sides is what makes the next step an equality test
rather than an approximation.

*This candidate is not trustworthy and the script does not trust it.* A
`'`-quoted string or a `/* */` comment containing `";\n#123="` produces a
false positive and nothing local to the scan can tell.

*Verification, by induction — this is the actual proof.* Shard *k* stops
at the first *true* boundary at or past its end offset and reports it.
Shard 0 starts at the data-block start, a true boundary by construction.
So

```
stop(0) is a true boundary
start(k+1) == stop(k)  ⟹  start(k+1) is a true boundary
```

The gate `stop(k) === start(k+1)` at every seam therefore *establishes*
that every shard began on a real record boundary and that the union of the
shards' record sets is the sequential parse's. A candidate that landed
inside a string or a comment cannot satisfy it. On a mismatch the script
re-runs the affected shard from the verified offset and counts the repair;
it never papers over one.

*Evidence.* `--selftest` builds eight adversarial STEP fixtures and, for
each, splits at **every byte offset in the data section** for N=2 and at a
strided sweep of offset pairs for N=3, counting false candidates
separately from benign past-end-of-data ones: **19,905 splits, 2,552 false
candidates produced and every one caught, zero merge mismatches.** Traps
covered: `;#…=` inside a quoted string; a *real newline* inside a quoted
string followed by a record head; the same inside a `/* */` block comment;
the `''` doubled-quote escape; two traps back to back; a trap inside an
inline entity's argument; and — for the merge rather than the scan —
complex instances (`multiMapping`) and descending express IDs.

**On all three real models the candidate was correct at every seam: 0
repairs, N = 2 and 4.** *Known limitation, and it fails loudly rather than
splitting wrongly:* the scan requires records to begin a line. A data
section written without newlines yields no candidate and the run aborts. A
production sharder would need a fallback (scan for `;` and let the gate
arbitrate, at the cost of more repairs).

**The merge is not "mechanical", and correcting that is item 5 of §0.1.**
`StepIndexColumns` is two ranges, not a list: `[0, firstInlineElement)` is
top-level records in parse order, `[firstInlineElement, count)` is inline
entities in the model's unfold order (`columnar_index.ts:8-25`)
*(verified)*. Concatenating finished shard columns end to end interleaves
the two ranges. Concatenating the *inline* ranges per shard is also wrong,
and less obviously so: `ColumnarIndexSink.assemble_` unfolds
breadth-first over the **whole** retained set, so per-shard unfolds
produce a different order. `mergeShards` therefore concatenates only the
top-level ranges, re-keys every retained entry to its merged localID, and
runs one **global** unfold plus the `complexEntries` clone. Three further
details, each covered by a fixture because each fails silently:
`expressID` is sized to the top-level count, not to `count`
(`columnar_index.ts:247`); `complexEntries` is keyed by merged localID;
and `expressIdsSorted` must carry the previous shard's last express ID
across each seam, because each shard's own scan restarts from 0 and is
blind to a descent that happens exactly at a boundary.

**Results.** Equivalence is checked against the single-threaded production
build, and that reference is itself cross-checked against
`buildIndexStreamingAsync` over a `StoreByteSource` — the call
`parseColumnarFromStore` makes (`ifc_api_proxy_ifc.ts:1206`). Both digests
match on all three models, so the gate is against production output rather
than a sync twin of it.

**Gate: PASS on every model at every N — the merged index is
byte-identical**, same SHA-256 over all four columns plus `count`,
`firstInlineElement`, `expressIdsSorted` and `complexEntries.size`.

| model | ref (1T) | N=1 | N=2 | N=4 | merge | worker-boundary cost | repairs |
|---|---:|---:|---:|---:|---:|---:|---:|
| PSB 860.7 MB | 9,478 ms | 9,605 (0.99×) | 4,889 (1.94×) | **2,770 (3.42×)** | 126 ms | 232→147→66 ms | 0 |
| D3D 213.6 MB | 3,740 ms | 7,130 (0.52×) | 4,500 (**0.83×**) | **3,390 (1.10×)** | 509 ms | 3,095→2,163→1,672 ms | 0 |
| MB-Khaya 31.4 MB | 430 ms | 415 (1.04×) | 271 (1.59×) | **229 (1.88×)** | 3 ms | 13→7→5 ms | 0 |

All figures are the warm-pool wall: boundary scan + shard parses + merge,
workers already spawned. Spawning them costs a further **0.47–0.73 s**
(reported as `cold wall`), which is why cold N=4 speedups are 2.71× /
0.92× / 0.49×. A production sharder would keep a warm pool —
`scripts/m3_worker_pool.mjs` already does — but the number is real and is
reported rather than hidden. Boundary scan cost is **0–1 ms** on every
model: it reads 256 KB windows around each split target, not the file.

The parse itself shards well on both large models:

| model | 1 shard parse | worst of 4 shards | shard-only speedup | efficiency |
|---|---:|---:|---:|---:|
| PSB | 9,244 ms | 2,577 ms | 3.59× | **0.90** |
| D3D | 3,522 ms | 1,208 ms | 2.92× | **0.73** |

PSB's 0.90 is consistent with M2's 0.935 and the box's 0.96 pure-CPU
calibration. D3D's 0.73 is partly load (2.4–2.8 during that run) and
partly imbalance — byte-equal shards are not record-equal (703,349 /
678,449 / 685,726 / 644,312 top-level rows).

### 3.6 The negative: D3D, and why it is a transfer problem

D3D's parse gets 2.92× and its end-to-end result is **1.10×**. The gap is
entirely two terms PSB barely pays *(measured here)*:

- **worker-boundary cost 1,672 ms at N=4** (3,095 ms at N=1). The four
  scalar columns cross `postMessage` by *transfer* — zero-copy. The
  retained entries cannot: `inlineEntities` are nested plain objects, so
  they are **structured-cloned**, and D3D has **720,661** of them. The
  cost falls as N rises because the cloning happens in parallel in the
  workers while the main thread's deserialization does not.
- **merge 509 ms**, the global unfold over those same 720,661 entries. On
  PSB (56,020 inline) it is 126 ms; on MB-Khaya, 3 ms.

Together, 2.18 s of a 3.39 s N=4 wall, against a 3.74 s baseline.

Inline shares — the reason this bites unevenly, and the reason D3D is also
the correctness stress case for the merge:

| model | rows | inline rows | inline % |
|---|---:|---:|---:|
| PSB | 9,438,225 | 56,020 | **0.594 %** |
| D3D | 3,432,497 | 720,661 | **20.995 %** |
| MB-Khaya | 620,959 | 1,704 | **0.274 %** |

This is the same inline-entity population that makes a v1 index sidecar
drop 21 % of D3D (#541), which is an independent confirmation of the
figure from the other side.

**The fix is to stop shipping inline entities as objects.** They carry
only `address`, `length`, `typeID` and a parent/nesting link; they could
be packed in the worker into four typed arrays plus a parent-index array
and transferred zero-copy, with the unfold done over indices. That is real
work — the unfold order has to be reproduced over the flat form — but it
is bounded, it is the difference between 1.10× and something near 2.9× on
D3D, and it does not touch the parse. **It should be settled before anyone
commits to sharding the index build**, because as it stands the technique
helps the model that needs it least. *(And see §8.6: on D3D, even fixed,
it is worth 1.6 % of the load.)*

---

## 4. "Worker init is lightweight" — what the record says, plus one new number

**The record still contains no measurement of worker init in a browser.**
Both the user's recollection and the #394 handoff's opposite claim are
attributions, not observations.

Evidence *(verified)*, `scripts/m3_worker_pool.mjs`:

- `:78` `await api.Init()` — and `tOpen = performance.now()` is taken on
  the **next** line, `:80`. So `Init()` is **outside** both `openMs` and
  `geometryMs`. There is no timer around it anywhere in the file.
- The parent's `wall` (`:208`, `:232`) spans `new Worker(...)` through the
  last `message` — so it includes worker spawn, module import, `Init()`,
  **and** the per-geometry SHA-256 payload hashing the harness does inside
  each worker for its union check (`:134-150`), plus the `postMessage` of
  every placement string.

So the #536 claim *"worker startup and wasm init dominate a 4 s geometry
stage"* is derived from a residual that also contains a full SHA-256 pass
over every vertex and index byte in the model. From the published table
*(measured elsewhere, arithmetic mine — inference)*: MB-Khaya N=1
`wall 6.3 − open 0.7 − geom 4.2 = 1.4 s` unattributed; N=4
`4.9 − 0.8 − 2.3 = 1.8 s`. Non-trivial, but **not attributable to
`Init()`** on this harness.

**What is now measured, and it is only half the question:**
`load_phase_report.mjs` times `wasmInit` directly — **184 ms on PSB,
164 ms on D3D, 156 ms on MB-Khaya** *(measured here)*. That is the wasm
module instantiation itself, **in Node, on the main thread**. It says the
engine's own init is small and roughly model-independent, which is
consistent with "lightweight" and inconsistent with "dominates". It says
**nothing** about a browser worker: no module fetch, no per-worker
compile, no structured-clone of the store handle. **#540 still gates any
browser measurement** — `isWebPlatform()` has no Worker branch, so
`Init()` in a browser worker loads the Node wasm and throws; Share#1756
carries a `process`-fabricating workaround *(verified from #540's body)*.

M4 is therefore **partly answered and still open where it matters**.

---

## 5. "Complementary geom query IDs" — what shipped

The brief this document answers reads this as #538's `geometryDispatchKey`
"→ a precomputed column". **A column is explicitly what did *not* ship,
and the code says why** *(verified, `geometry_dispatch.ts`)*.

What shipped:

- `geometryDispatchKey(model, productLocalID)` — walks
  `IfcProduct.Representation → IfcProductDefinitionShape →
  Representations → Items → IfcMappedItem.MappingSource`, returning the
  mapping source's `localID`; falls back to the first representation's
  `localID`, then the product's own. Rethrows
  `StepBufferNotResidentError` rather than swallowing it.
- `computeDispatchKeys(model, localIDs, waveSize=1024)` — returns a
  `Uint32Array` **aligned to the worklist**, not indexed by local ID. On a
  windowed source it pages the walk's four-hop closure in pinned waves
  first, then calls the same `geometryDispatchKey`.
- `shardOfDispatchKey(key, n) = |key| % n`.

The doc comment on `computeDispatchKeys` rejects the column form outright:
*"A column over local IDs would be 37 MB on PSB's 9.4 M records to carry
~24 k useful ones."* (The 9.4 M is now confirmed exactly: **9,438,225
rows**, §3.6.)

**Is it residency-independent?** *(verified, by construction)* Yes, and
that is exactly what the paging pre-pass buys: every worker pages the same
closure and reads the same bytes, so a fallback taken for an unresolvable
attribute is a property of the *file* (all workers agree) rather than of
one worker's LRU. #538's mutation test — remove the paging and all four
windowed-dispatch tests fail — is the evidence.

**Does it support the partition this design needs?** Partly, with three
caveats:

1. **It is worklist-relative, and the worklist requires the finished
   index.** `ensureDemandWorklists_` builds it from
   `model.types(IfcProduct)` minus `aggregateTargetLocalIDs()`
   (`ifc_api_proxy_ifc.ts:2408-2417`). So dispatch keys are **downstream
   of the same barrier** as everything else. Under a sharded *index build*
   (§7) this is fine — the index is complete before dispatch. Under a
   §1.4 overlap design it is not, and keys would have to be computed
   per-prefix-wave with the same regeneration discipline the preview
   channel uses. *(Cost note, now measured: building that worklist is
   21 ms on PSB and 1,010 ms on D3D — small, but not free on the model
   with 47 k products.)*
2. **Affinity is exact on one model and weak on another.** #536's
   published numbers *(measured elsewhere)*: MB-Khaya N=4 duplicated
   assets 9,020 round-robin → **7,193 with this key** = the oracle;
   D3D 83,177 → **81,639** against an oracle of 65,288. The doc names the
   limit: on assembly-heavy models the sharing lives *below* the
   representation (profiles, boolean operands, void geometry) where an
   attribute walk cannot see. #394's correction comment prices this at
   **+15 % total CPU on PSB and +40 % on MB-Khaya** at N=4 — i.e. the
   affinity term is 0–40 % of CPU, and it cuts directly against naive
   modulo sharding. `shardOfDispatchKey` *is* modulo — over keys that are
   representation local IDs, so it is modulo-over-affinity-classes, not
   modulo-over-products. That is the right structure; the residual gap is
   the sub-representation sharing the key cannot see.
3. **`localID` is parse-order-dependent.** Under a sharded index build the
   merged local IDs must be assigned deterministically. §3.5 now shows
   this is achievable and achieved — the merge is address-ordered and the
   result is byte-identical to the single-threaded build, so the keys are
   stable by construction rather than by hope. *(This is the one caveat
   the measurement discharged.)*

---

## 6. The transfer / memory wall

Restating the brief's numbers with what is now verified or measured:

| quantity | value | status |
|---|---|---|
| sidecar size | 24 B header + **20 B per top-level record** | *verified*, `index_sidecar.ts:113-115` per #541's audit |
| PSB rows / inline rows | **9,438,225 / 56,020** ⇒ `firstInlineElement` = **9,382,205** | *(measured here)* — this was the draft's M5, and it is answered |
| ⇒ PSB sidecar | **~187.6 MB** (9,382,205 × 20 B + 24 B) | *inference from a measured count*; the draft's "≤ ~194 MB" stands, refined |
| D3D / MB-Khaya sidecar | ~54.2 MB / ~12.4 MB, same arithmetic | *inference from measured counts* |
| `postMessage` transfer-list semantics | **moves**, so N workers = N structured-clone copies ⇒ ~1.13 GB at N=6 on PSB | *inference* from the sizing; the semantics are standard |
| per-worker columns | ~155 MB × N ≈ 930 MB at N=6 | *inference* |
| measured worker wasm at N=6, PSB, Chrome | **+1,938 MB** (6 × ~323 MB) | *measured elsewhere*, #541 |
| measured total footprint at N=6 | **~4.7 GB vs 1.76 GB baseline** | *measured elsewhere*, #541 |
| single durable PSB load, Node | peak RSS **2,141 MB**, peak wasm **1,284 MB** | *(measured here)* |
| `SharedArrayBuffer` | unavailable — `netlify.toml` omits COEP for `docs.google.com/picker`'s `CORP: same-site` | *measured elsewhere*, #394 comment 5343844967 |

### The draft's per-byte model of transfer cost is the wrong model

The draft assumed transfer cost tracks sidecar **bytes**, and concluded it
is "the same ~194 MB × N either way". §3.6 refutes the shape of that:
PSB's boundary cost at N=4 is **66 ms** for a ~188 MB sidecar's worth of
rows, while D3D's is **1,672 ms** for a ~54 MB one. The cost tracks
**object count** — inline entities, which cannot be transferred and must
be cloned — not byte count. A model with 3.6× fewer sidecar bytes pays 25×
the transfer. Any budget written in MB/s will be wrong by more than an
order of magnitude on the models that matter.

### Does the sharded-parse design avoid the wall?

**No — and the "each worker parses its own shard, so there is no index to
ship" argument does not survive contact with the extraction step.** This
is worth working through carefully because it is the most attractive-
looking escape and it is wrong.

A worker that parsed shard *i* holds the index rows for shard *i*'s byte
range. To extract a product in shard *i* it must resolve that product's
`#ref` closure — placements, points, directions, profiles, styled items —
and **those references are file-global**. An `IfcCartesianPoint` in shard 0
is referenced by a product in shard 3. Reference resolution goes through
`expressID → localID` over the *whole* index. So each worker still needs
the merged index. Sharding the parse changes **who does the scanning
work**, not **who needs the result**.

What sharded parse *does* buy on memory, honestly:

- **Transient parse memory per worker falls to ~1/N** — each shard's
  growing column segments are 1/N of the file's rows. *(inference)*
- **It removes the N redundant *parses*** (the #541 regression's actual
  cause) without adding a transfer that the shared-index design was not
  already going to pay. The transfer cost is the *distribution* problem
  (#541), not the *production* problem — with the shape correction above.

So the wall is **unchanged in kind**, and it is a hard constraint on N,
independent of core count. Options, cheapest first:

1. **Pack inline entities into typed arrays** (§3.6). This is now the
   first item, not a D3D footnote: it is what makes the *distribution*
   cost track bytes again, and it benefits the sidecar path (#541) and the
   sharded-build path identically.
2. **Sidecar via OPFS, not `postMessage`.** Coordinator writes the merged
   sidecar once; each worker reads and deserialises it. No main-thread
   copies, reads happen off the main thread. Listed in #541's scoping
   comment as the fourth option and not costed. *(inference: the right
   default.)*
3. **Part A per worker.** #394's Part A takes single-instance wasm
   high-water 1,956 → 840 MB on PSB by per-batch copy-out + release
   *(measured elsewhere)*. Applied per worker it attacks the 1,938 MB
   term, the largest single line in the 4.7 GB. **This makes Part A a
   precondition for N > ~4 on a 900 MB model, not an independent
   workstream** — the burn-down currently lists it as independent.
4. **A closure-partitioned sparse index** — hand worker *i* only the rows
   its own products' closures need. Speculative; nobody has measured
   closure overlap. Listed for completeness, not proposed.

---

## 7. The proposed pipeline

Names are proposals. `[E]` = engine (conway), `[S]` = Share. **Read §8.6
first if your model looks like D3D** — this pipeline is not that model's
lever.

```
  t=0   ┌──────────────────────────────────────────────────────────────┐
        │ [S] fetch / OPFS write-through          (already streaming)  │
        │ [S] spawn N workers, Init() each        ← overlaps the fetch │
        │     Init() is ~0.18 s in Node; browser worker init unmeasured│
        └──────────────────────────────────────────────────────────────┘
                    │
                    ▼
  PARSE   ┌────────────────────────────────────────────────────────────┐
          │ [E] worker 0: index-build shard 0 = bytes [0, L/N)         │
          │     ── AND ── runs the preview channel over its own prefix │
          │ [E] workers 1..N-1: index-build shards [iL/N, (i+1)L/N)    │
          │                                                            │
          │ boundary discipline: line-anchored candidate + inductive   │
          │   gate stop(k)==start(k+1)      ← PROVEN, 0 repairs on 3   │
          │   models; 19,905-split selftest, 2,552 traps all caught    │
          │ output: N ColumnarIndexSinks                               │
          │ MEASURED: PSB 9.48 s -> 2.77 s at N=4 (3.42x)              │
          └────────────────────────────────────────────────────────────┘
                    │  merge: concatenate TOP-LEVEL ranges only, re-key
                    │  retained entries, ONE GLOBAL unfold, clone
                    │  complexEntries, carry expressIdsSorted across seams
                    │  → byte-identical to the single-threaded build
                    │  coordinator writes merged sidecar to OPFS once
                    ▼
  ═══ THE BARRIER STAYS HERE ═══  (index complete ⇒ inverse-rel closure known)
                    │
                    ▼
  GEOM    ┌────────────────────────────────────────────────────────────┐
          │ each worker: OpenModelFromIndex(store, sidecar)   ← #541    │
          │              SetCoordinationFrame(frame)          ← #538    │
          │              SetGeometryShard({i, N})             ← #536    │
          │              prepareDemandExtraction()   [full, per worker] │
          │              pump ExtractGeometryBatch, copy out, release   │
          │                                              ← #394 Part A  │
          └────────────────────────────────────────────────────────────┘
                    │  transferable vertex/index buffers
                    ▼
  ASM     ┌────────────────────────────────────────────────────────────┐
          │ [S] merge into batched three.js geometry, GPU upload        │
          │     engine's share of this is ~0.6 s on PSB (sceneWalk +    │
          │     copyOut); the REST of it is Share's and is unmeasured   │
          └────────────────────────────────────────────────────────────┘
```

### Readiness contract, stated

- **Index shard *i* is complete** when its byte range is scanned *and* its
  start boundary was validated by the seam gate. *(Now proven, §3.5.)*
- **The merged index is complete** when all shards are complete and the
  merge in §3.5 has run. Byte-identity against the single-threaded build
  is the gate, and it holds at N=1,2,4 on three models.
- **A product is durable-ready** iff the merged index is complete. That is
  the barrier, unchanged, and it is honest — see §1.3.
- **The coordination frame is available before the barrier**: the preview
  channel derives it during parse and the durable pump already adopts it
  (`ifc_api_proxy_ifc.ts:540-541`, `demandCoordination_ ←
  loadState.previewCoordinationMatrix`) *(verified)*, and #538 shipped
  `SetCoordinationFrame` to hand it to workers. So B2 is solved for this
  design; it does not need overlap to be solved.
- **Preview is unaffected in its first `1/N` of wall-clock and finishes
  earlier.** Worker 0's leading shard *is* today's leading prefix, byte for
  byte, so its coverage curve is today's curve up to `L/N` *(inference)*;
  and because the whole parse ends N× sooner, the plateau after `L/N` is
  short. This is the claim §3.2 rests on and it is still the one to
  attack — the spike measured index equivalence, not preview coverage.

### Prerequisites this design now has that the draft did not

- **Inline entities packed as typed arrays** (§3.6). Without it, the
  design's own headline result is 1.10× on a model with 21 % inline rows.
- **A warm worker pool.** Cold spawn is 0.47–0.73 s, which eats MB-Khaya's
  entire win.

### What is NOT in this design

- **No parse↔geometry overlap.** §1.3 says it is essential; §1.4 says the
  escape hatch costs Part A plus a repair budget nobody has measured.
  Explicitly deferred.
- **No `SharedArrayBuffer`.** Off the table while the Picker needs no-COEP.
- **No sub-representation affinity key.** #536's D3D gap stays open.
- **No fix for #616.** Which is why §8.6 says this design is not D3D's
  lever.

---

## 8. Revised ceiling

### 8.1 The draft's arithmetic, and why it is void

The draft reasoned from #541's browser measurement, PSB 860.7 MB, Chrome,
OPFS hit *(measured elsewhere)*:

```
Parsing  15.8 s     Geometry  24.6 s     Total  52.9 s
```

`52.9 − 15.8 − 24.6 = 12.5 s` unattributed, which the #394 burn-down split
as `prep 6 + assemble 5.3 = 11.3`, leaving 1.2 s unexplained. The draft
flagged that split as unsourced — *"I could find no measurement anywhere
of a 'prep' or an 'assemble' stage"* — and then **used it anyway**, as
assumption A3 (`prep + assemble = 11.3 s`, fully serial), producing:

```
T(N)  =  prep + parse/(Nη) + geometry/s_g(N) + assemble + X

N=4, η=1.0:   6 + 15.8/4 + 24.6/2.59 + 5.3 + X  =  24.75 s + X   (2.14x)
N=4, η=0.7:   6 + 5.64   + 9.50      + 5.3 + X  =  26.44 s + X   (2.00x)
N→∞:                                       11.3 s  ⇒  4.7x floor
```

**A3 is false.** Measuring it was the draft's own M3 and the measurement
came back at roughly a fifth of the estimate. Everything in this section
that depended on A3 — the 4.7× floor above all — is void.

### 8.2 The measured decomposition — PSB, Node

`scripts/load_phase_report.mjs`, driving the production store-backed
deferred path (`OpenModelStream` + `DEFER_GEOMETRY` +
`ExtractGeometryBatchAsync`) and timing it by wrapping shipped prototypes
*(measured here)*:

```
phase                        ms       %total  class
wasmInit                        184     0.5  serial
storeOpen                         0     0.0  serial
indexBuild                    10657    30.2  SHARDABLE (§3.5)
indexFinalize                   121     0.3  serial (merge point)
modelConstruct                  257     0.7  serial
prepPaging                      768     2.2  serial
prepMaps (total)                 72     0.2  serial
openTail                         24     0.1  serial
worklist                         21     0.1  serial
geom.prefetch                  1942     5.5  parallelisable*
geom.extract                  20575    58.2  parallelisable*
geom.release                     31     0.1  parallelisable*
sceneWalk (excl copyOut)        311     0.9  serial (per batch)
copyOut                         318     0.9  serial (marshalling)
agg.begin / agg.paging / agg.step  4/1/3  0.0  serial
geom.residual                    33     0.1  unattributed
                              -----
openWall                      11892
geomWall                      23239
TOTAL                         35335
peakRss 2141 MB   peakWasm 1284 MB   io 583 reads / 2754 MB / 1277 ms
```

`*` — the three `geom.*` rows are classed parallelisable **on this
design's authority, not on a measurement taken here**. The efficiency used
for them in §8.3 is #536's, measured elsewhere.

Regrouped into the draft's two terms:

| draft term | what is in it | draft | **measured** |
|---|---|---:|---:|
| `prep` | wasmInit 184 + prepPaging 768 + prepMaps 72 + worklist 21 | 6 s | **1.05 s** |
| `assemble` | indexFinalize 121 + modelConstruct 257 + openTail 24 + sceneWalk 311 + copyOut 318 + aggregate 8 + residual 33 | 5.3 s | **1.07 s** |
| **serial residual** | | **11.3 s (21 %)** | **2.12 s (6.0 %)** |

Six PSB runs across two wasm builds put the residual at 1,997 / 2,074 /
2,117 / 2,187 / 2,321 / 2,770 ms — **5.7–7.2 %, never 21 %**. The spread
is dominated by one term, `indexFinalize` (118–906 ms), which allocates
the 9.4 M-row columns and is therefore allocator- and
contention-sensitive.

### 8.3 The corrected arithmetic, from measured efficiencies only

PSB, using the index-build efficiency measured in §3.5 (3.42× at N=4) and
the geometry efficiency #536 measured (2.59× at N=4, Node, extract-only):

```
T(4) = serial 2.12 + index 10.66/3.42 + geometry 22.55/2.59
     = 2.12       + 3.12              + 8.71               = 13.94 s
```

against **35.34 s: 2.54×, −60.6 %** — versus the draft's "~24.8 s + X,
2.14×, −53 %" and the burn-down's "37 s, −30 %".

**Engine-side Amdahl floor as N→∞ is the 2.12 s serial residual: 16.7×.**

| structure | PSB | vs baseline |
|---|---|---|
| today, Node, deferred store path | 35.34 s | — |
| burn-down's ceiling: shared index, serial parse | — | −30 % |
| draft's estimate, N=4 | ~24.8 s + X | −53 %, 2.14× **(void — A3 false)** |
| **measured efficiencies, N=4** | **13.94 s** | **−60.6 %, 2.54×** |
| **N→∞, engine only** | **2.12 s** | −94 %, **16.7× — the floor** |

Caveats on that number, largest first: the geometry efficiency is not mine
and is extract-only; the draft's `X` (per-worker transfer) is now measured
for the *index* half and is **not** small on inline-heavy models (§3.6);
and **none of it is a browser number**.

### 8.4 The browser residual is reassigned, not deleted — and this is an open question in Share

Node says the engine's whole share of the 12.5 s is **2.12 s**. Scaling by
the browser/Node parse ratio (15.8 / 10.66 = **1.48×**), to allow for
Chrome being slower than Node on identical work, gives **≈3.1 s**
*(inference from two measured numbers)*.

**So of the browser's 12.5 s, roughly 9.4 s is not engine code:** the
fetch, the OPFS write, Share's `'Assembling render mesh...'` three.js
build, and the GPU upload.

Two consequences that point in opposite directions, and both matter:

- **For the engine, the floor is much better than 4.7×** — the term the
  draft said would bind it is 6.0 % of the engine load, not 21 %.
- **The 9.4 s does not vanish because it is Share's.** It is still on a
  user's critical path. It is a *different* piece of work, owned by a
  different repo, and some of it (fetch) already overlaps parse rather
  than serialising with it — so it does not enter Amdahl the way `prep`
  and `assemble` were assumed to.

**Nobody has measured it.** *(unknown)* The instrument exists:
`Share/src/tests/e2e/loadMeasure.ts`, now on Share `main` (merged as
`9d6334e`), censuses the three.js scene per frame and records
`stageTransitions` from `currentLoadLine`. Pointing it at PSB and
splitting the residual into fetch / OPFS write / three.js build / GPU
upload is the next measurement, and **nothing in conway can settle it.**

An honest illustration of what the browser total might do, marked as the
inference chain it is — it rests on the unmeasured 9.4 s being serial and
unimproved, which is exactly the assumption that just cost the draft its
central claim:

```
browser engine-side terms:  15.8 (parse) + 24.6 (geom) + ~3.1 (serial)
at N=4:  3.1 + 15.8/3.42 + 24.6/2.59  =  3.1 + 4.62 + 9.50  =  17.2 s
plus Share's ~9.4 s, if fully serial:                        ≈ 26.6 s
                                              → 52.9 → 26.6 = 1.99x
browser floor if that 9.4 s is fully serial:  3.1 + 9.4 = 12.5 s → 4.23x
```

**Note what that says about the draft.** Its browser-total estimate
(~2.0–2.1×) and its floor (4.7×) come out close to these — *while being
wrong about where the serial time lives.* It attributed ~11.3 s of serial
cost to the engine; the engine's share is ~3.1 s and Share's is ~9.4 s.
The draft got approximately the right total for the wrong reason, and the
difference is not academic: it changes **which repo has to fix it**, and
whether the term is serial at all (fetch overlaps; a three.js build does
not).

### 8.5 What keeps it away from O(cores)

- **Memory bounds N, not cores** (§6). 4.7 GB measured at N=6 on PSB
  against a 1.76 GB baseline. Part A is a precondition for scaling N.
- **The extraction driver's own 1.32-core tax** — 30.5 s CPU for 23.1 s
  wall *(measured elsewhere)* — caps `s_g ≤ cores/1.32`: 3.0× on a 4-core
  box, 6.1× on 8 cores, before affinity duplication (0–40 % of CPU).
- **Transfer, `X`, is paid N times** and on inline-heavy models it is
  large (§3.6).
- **The serial residual is now the *smallest* of these**, which is the
  reframing this section exists to record.

### 8.6 And it is a PSB number. On D3D the same arithmetic gives 1.03×

```
D3D, 213.6 MB, 266.46 s total:
  serial (incl. the whole aggregate pass)  255.72 s
  index build                                4.29 s
  per-product geometry                       6.42 s

T(4) = 255.72 + 4.29/2.92 + 6.42/2.59 = 259.67 s   →  1.03x
```

The decomposition behind it *(measured here)*:

```
phase                        ms       %total
indexBuild                     4293     1.6
worklist                       1010     0.4
geom.prefetch                  2823     1.1
geom.extract                   3553     1.3
sceneWalk                     17204     6.5
agg.begin                      6477     2.4
agg.paging                   149680    56.2   ← AggregateExtractPager.ensureForStep
agg.step                      73186    27.5
geom.residual                  6508     2.4
                             ------
TOTAL                        266461
io 11743 reads / 47056 MB / 63111 ms      192,022 meshes, 4,018 batches
```

Three things fall out, and none is about parallelism:

- **`agg.paging` is 56.2 % of the whole load** — the rel-aggregate pass
  paging its windowed source. The load read **47.1 GB from a 213.6 MB
  file** (220× re-read) and spent 63.1 s inside `readSync`; the other
  ~87 s inside `ensureForStep` is closure walking and pin bookkeeping,
  not I/O. **Filed as #616.**
- **`sceneWalk` is 6.5 %, and it is structurally quadratic.**
  `streamNewMeshes_` re-walks the scene once per batch; 4,018 batches over
  a scene growing to 192,022 meshes. This is the same structure §9's
  delta-capture item is about.
- **The two terms this whole document is about are 1.6 % and 1.3 %.**

The rel-aggregate drain was timed **directly**, not by subtraction — the
demand pump keeps profile counters for its product branch and none for its
aggregate branch, which is part of why this stayed invisible. Two earlier
D3D runs on the older wasm agree: one totalled 253.9 s with `agg.paging`
at 57.0 %; the one that predated the direct instrumentation totalled
234.4 s and put 208.5 s (88.9 %) into the *unattributed* residual — the
same region of the code, which is exactly why the instrumentation was
added rather than left as a subtraction. **Not a one-run artefact.**

**The mechanism is measured and not diagnosed.** #616 lists three
untested hypotheses (per-step re-paging; index-order rather than
address-order visitation; a window sized for the product path's locality)
and says which first step would discriminate between them: instrument the
pager's window requests — offsets, sizes, hit/miss — before changing
anything. This document does not pick one.

MB-Khaya, 31.4 MB, for scale *(measured here)*: `TOTAL 11,313 ms` —
indexBuild 541 (4.8 %), geom.prefetch 3,094 (27.3 %), geom.extract 6,499
(57.4 %), serial residual 965 (8.5 %), aggregate drain 400 (3.5 %). The
residual's *share* rises as the model shrinks because `wasmInit` (156 ms)
is a fixed cost. The aggregate drain sits between PSB's 8 ms and D3D's
229 s — so the aggregate cost is a **model-shape** property, spanning
five orders of magnitude across three files.

**Do not generalise from PSB.** The index build is 30.2 % of PSB's load,
4.8 % of MB-Khaya's and 1.6 % of D3D's. Sharding it is worth roughly
**−21 % on PSB, −3 % on MB-Khaya, −1 % on D3D**. A "parallel load
pipeline" scoped on PSB alone is a fix for one model.

---

## 9. Where it breaks

**#616 outranks everything else here.** On a D3D-shaped model, 84 % of the
load is a pass this design does not touch, does not parallelise, and would
not help. Any plan that sequences the parallel pipeline ahead of #616 is
optimising 3 % while ignoring 84 %.

**Inline-entity transfer.** §3.6. Structured-clone of 720,661 nested
objects turns a 2.92× parse into a 1.10× end-to-end. It is the design's
own headline result failing on a real model, and it is a prerequisite
rather than a follow-up.

**Coordination frame.** Solved, and solved *before* the barrier —
`SetCoordinationFrame` (#538) plus the preview channel's parse-time
derivation. Two live hazards: recentring snaps to a 1 km grid
(`COORDINATION_SNAP_M`), so a shard-disagreement bug is **invisible on any
model inside one cell** — #538 records that its union test passed with the
fix reverted until `index_georeferenced_multicell.ifc` was authored
*(verified from #538's body)*. Any test of this design needs that fixture
or an equivalent. And #537 (a second deferred model on one `IfcAPI` gets
garbage native transforms) is open and lives in exactly this area.

**Shared-asset retention and the definition/occurrence rule.** The
`supercap.step` 169-vs-101 result is the governing counter-example:
releasing a geometry a later product shares makes that product
re-extract and append duplicate scene nodes. This bounds two things at
once — Part A's release policy, and any repair mechanism §1.4 would need.
The fix is the same for both: refcount on the **asset**, not the instance
(`SharedAssetPool`), which is built and unwired.

**Delta capture.** `streamNewMeshes_` uses per-entity **positional**
watermarks and re-walks the entire scene each batch — O(batches × scene).
Now measured at the top of its range: **17.2 s, 6.5 % of D3D's load**,
4,018 walks over a scene growing to 192,022 meshes *(measured here)*; on
PSB it is 311 ms over 23 k instances. A positional cursor cannot survive
an entry vanishing from the sequence it indexes. With N workers each
producing its own delta stream into one merged scene this gets worse, not
better. **Asset-keyed delta capture is a prerequisite of the pool, not
just of Part A.**

**Preview interaction.** The claim in §7 — worker 0's shard reproduces
today's prefix exactly — is load-bearing and **still unmeasured**: the
spike gated on index byte-identity, not on preview coverage. There is a
subtlety on top: today's preview channel also competes with the durable
open for the same main thread, and under this design worker 0 does both
parse-shard-0 and preview, so preview quality on shard 0 could *improve*
(no durable pump contending) or *degrade* (shard 0 also does merge work).
Also `emitSpatialStructureImposters` and the end-of-parse plate refresh
(`store_preview_channel.ts:738+`) assume one model; the merged-index
handover needs to fire exactly once.

**Memory.** §6. The binding constraint on N. Do not scope N by
`navigator.hardwareConcurrency`.

**Boundary resynchronisation.** §3.5. **Downgraded from "the worst failure
shape in this design" to "closed, with a named limit"** — the inductive
gate turns a heuristic into a proof, 19,905 selftest splits caught 2,552
false candidates with zero mismatches, and three real models needed zero
repairs. The residual limit is a newline-free data section, which yields
no candidate and fails loudly.

**Cold worker spawn.** 0.47–0.73 s *(measured here)*. Fatal to any model
under ~100 MB unless the pool is warm.

**#540.** Gates every browser measurement here.

---

## 10. Measurement plan — status

| item | what | status |
|---|---|---|
| **M0** | Settle the Arty baseline | **done** by reading committed CSVs — §11 |
| **M1** | Inverse-relationship arrival curve | **open, still the cheapest decisive thing** |
| **M2** | Is the parse CPU-bound or bandwidth-bound? | **done** — η = 0.935 at N=4 on PSB, box calibration 0.96. §3.4. *Did not falsify.* |
| **M3** | Decompose `prep` and `assemble` | **done for the engine, in Node** — 2.12 s, not 11.3 s. §8.2. **The browser half is now M3b and belongs in Share.** |
| **M3b** | Split the browser's ~9.4 s Share-side residual | **open** — `loadMeasure.ts` on Share `main` (`9d6334e`) is the instrument. §8.4 |
| **M4** | Worker `Init()`, actually timed | **partly done** — 156–184 ms in Node, main thread. Browser worker init still unmeasured and gated by #540. §4 |
| **M5** | `count − firstInlineElement` on PSB | **done** — 9,438,225 / 56,020 ⇒ sidecar ~187.6 MB. §6 |
| **M6** | Confirm Arty on current `main` | **open** — one CLI regression run, whenever one is scheduled anyway. §11 |
| **M7** | Boundary resync correctness | **done** — 19,905 splits, 2,552 traps, 0 mismatches. §3.5 |
| **M8** | Sharded index build, end to end | **done** — byte-identical at N=1,2,4 on three models. §3.5 |
| **M9** | *(new)* Instrument `AggregateExtractPager`'s window requests on D3D | **open, and the highest-value item on this list** — #616 |
| **M10** | *(new)* Preview coverage under a sharded build | **open** — §7's load-bearing claim was never gated |

### M1 — Inverse-relationship arrival curve *(cost: minutes of CPU, no engine, no wasm)*

Extend `scripts/layout_report.mjs` with a fifth curve: for prefix fractions
0.1…1.0, the fraction of products for which **every** `IfcRelVoidsElement`,
`IfcRelAssociatesMaterial`, `IfcStyledItem` and `IfcRelAggregates` record
reaching them is inside the prefix. Run across PSB / DOWA / D3D /
MB-Khaya / BLSN.

- **Why:** byte-scan only, cheapest on the list, and it settles both
  §1.4's viability and whether the doc's unsourced "92–97 %" is the right
  statistic.
- **Falsifies:** nothing in the *proposed* design (§7 does not depend on
  it) — but a curve that tracks the diagonal would mean §1.4's
  speculative-overlap route is *cheap* and would reopen a
  `max(parse, geometry)` structure this document currently rules out. A
  step function near 0.95 closes that route for good.

### M3b — the browser residual *(cost: one Share browser session)*

Run `loadMeasure.ts` on PSB and publish the residual's actual composition:
fetch, OPFS write, wasm `Init()`, demand prep, `'Assembling render
mesh...'`, GPU upload. **Until this exists, §8.4 is reasoning about a term
whose owner is known and whose size is not.**

- **Falsifies:** the ~9.4 s split, and with it every browser number in
  §8.4. Also delivers the browser half of M4.

### M9 — the aggregate pager *(cost: one instrumented D3D load)*

Log the pager's window requests — offsets, sizes, hit/miss — over a D3D
load and read the access pattern **before changing anything**. The 220×
figure says bytes are re-read; it does not say whether the fix is
ordering, window sizing, or retention, and those have very different
costs. #539 ("the classic store open reads aggregate targets before
paging") is in the same area and may be the same root cause or a sibling.

### M10 — preview coverage under a sharded build *(cost: rides on M8's harness)*

The spike gated on index byte-identity. §7 additionally claims worker 0's
leading shard reproduces today's preview coverage curve up to `L/N`.
Nothing has tested that, and it is the claim §3.2 rests on.

**Suggested order: M9 (it outranks the milestone) → M3b (different repo,
runs in parallel) → M1 → M10 → M6 whenever a regression run is scheduled
anyway.**

---

## 11. The Arty ~20 s question — settled, and the answer is surprising

**The ~20 s baseline is the CLI rc-regression perf snapshot**, written by
`ifc_regression_batch_main --perf --concurrency 1` and blessed into
`test-models/benchmarks/<engine>_test-models/performance-detail.csv` by
`scripts/bless_perf_snapshot.cjs`. Not the browser, not the emsdk doc's
dev-container runs.

Committed rows for `Arty_Z7.stp` *(verified — read from the CSVs)*:

| snapshot | date | parse | geometry | total | geometry mem | peak wasm |
|---|---|---|---|---|---|---|
| `conway1.558.1533-ci` | 2026-08-22 | 789 ms | 19,410 ms | **20,199 ms** | 450.1 MB | 995.6 MB |
| `conway1.560.1539-ci` | 2026-08-23 | 779 ms | 18,962 ms | **19,741 ms** | 450.1 MB | 995.6 MB |
| `conway1.588.1550-ci` | 2026-08-25 | 636 ms | 8,805 ms | **9,452 ms** | 138.4 MB | 357.5 MB |

And the repo's own delta file
(`conway1.588.1550-ci_test-models/conway1.560.1539-ci_1.588.1550_delta.csv`)
records it explicitly *(verified)*:

```
Arty_Z7.stp, engine1Total 19741, engine2Total 9441,
parseΔ -143, geometryΔ -10157, totalΔ -10300, -52.18%,
basis stageSum, comparability sameHarness
```

**So `~20 s → ~10 s` on Arty was achieved on 2026-08-25, and it has
nothing to do with parallelism.** Geometry fell 19.0 → 8.8 s, geometry
memory 450 → 138 MB, peak wasm 996 → 357 MB — the signature of
*tessellating less*, not of *tessellating faster*. The plausible causes in
that version window are `4ce9b30` (#567, conway-geom bump for NURBS
convergence), `3b5621e` (#564, floor the deflection target at 1e-5 of the
representation's extent) and `82028ec` (#578, conway-geom bump +
UNSPECIFIED trim representations) — Arty is a NURBS-dense ECAD board, so a
convergence or deflection change is exactly the shape that would do this.
**Attribution is an inference; the 52 % is measured and committed.**

**Reconciling with `emsdk-upgrade-scalable-allocator.md`** (`:39-43`): its
Arty numbers — 67.6 → 49.2 s single-shot, 75.9 vs 70.8 s interleaved —
are from **2026-07-08**, on a **shared 4-core dev container whose absolute
speed the doc itself records as swinging ±18 %** (the same binary
measuring 64.7 s and 92.3 s across three rounds), through a **different
harness**, at an engine version roughly 500 PRs older. They are not
comparable to the CI rc snapshots and they do not contradict them; they
are a different instrument on a different machine measuring a different
build. The doc says as much when it defers to "the perf-three CI delta on
dedicated runners".

**What is still open:**

- The last blessed snapshot is `1.588.1550`; **nobody has measured Arty on
  current `main`.** → M6.
- `totalTimeMs` changed meaning once (#562/#570: it was `parse + geometry`
  by construction on regression children and is now a wall clock). The
  delta above sidesteps this by using `basis: stageSum`. Any *new* number
  must say which basis it is on, or it is not comparable to the 20,199.
- If the ~20 s is in fact a *browser* number, none of the above applies and
  there is no browser Arty measurement at all — Arty is STEP, and Share's
  STEP landing target is `public/index.step`, not Arty.

**Recommendation: do not scope parallel-load work against Arty.** The
target has been hit on the CLI, by a geometry-quality change, and Arty is
not representative of the load shape this design addresses (636 ms parse
against 8.8 s geometry — 93 % geometry, well served by geometry sharding
alone and needing none of §3).

---

## 12. Honest verdict

**Is O(cores) reachable? On the engine's own phases, closer than this
document originally claimed — and on at least one real model it is the
wrong question.**

1. **The biggest number anywhere in these measurements is #616**, not
   anything about parallelism: 56.2 % of a 266 s D3D load in
   `AggregateExtractPager.ensureForStep`, reading 47.1 GB from a 213.6 MB
   file. Measured, **not diagnosed**. On a D3D-shaped model, perfect
   parallelism in the phases this milestone targets saves under 2 %.
   **This reorders the milestone, and the document says so about itself.**
2. **The sharded index build is real, proven byte-identical, and worth
   3.42× on PSB's 30.2 %** — about −21 % of a PSB load on its own. It is
   the cheapest genuine win here. It needs the inline-entity transfer
   format settled first (§3.6), or it is 1.10× on the models with 21 %
   inline rows.
3. **The serial residual is 6.0 %, not 21 %.** The engine-side Amdahl
   floor is **16.7×**, not 4.7×. With measured efficiencies only, PSB Node
   `35.34 s → 13.94 s at N=4` — **2.54×, −60.6 %**.
4. **~9.4 s of the browser load is Share's, and unmeasured.** The draft
   charged it to the engine. That does not make it disappear; it makes it
   someone else's measurement, and `loadMeasure.ts` is the instrument.
   Until M3b runs, no honest browser projection exists.

**The terms that keep it away from O(cores)**, in order of how much they
now bind:

1. **Memory, not cores, bounds N.** 4.7 GB measured at N=6 on PSB against
   a 1.76 GB baseline. Part A is a precondition for scaling N, not a
   parallel workstream.
2. **Transfer of non-transferable index rows** — object count, not byte
   count. 1.67 s at N=4 on D3D against a 3.74 s baseline.
3. **The extraction driver's own 1.32-core tax**, capping `s_g` at
   `cores/1.32`.
4. **Affinity duplication, 0–40 % of CPU**, which `geometryDispatchKey`
   closes on mapped-item models and does not close on assembly-heavy ones.
5. **The serial residual, 6.0 %** — now the *smallest* of these, and the
   reversal is the main correction this revision records.

**What I am confident of without further measurement:**

- The parse→geometry barrier is **essential**. Three independent
  inverse-relationship dependencies, one of which
  (`aggregateTargetLocalIDs`) is documented to produce a visibly wrong
  picture if got wrong — and which owns 84 % of D3D's load.
- **#542's parse-sharding rejection does not generalise to the durable
  path.** `layout_report.mjs`'s own doc comment already said so; the spike
  has now built the thing and gated it on byte-identity. The `#394` body
  should be narrowed to "parse sharding *as a preview-coverage lever*".
- **The "precomputed dispatch-key column" from #538 does not exist**; what
  shipped is a worklist-aligned, wave-paged pre-pass, and the column form
  was explicitly costed and rejected at 37 MB.
- **Arty is already at ~9.4 s on the CLI**, and the ~20 s figure is a
  three-week-old snapshot of the same harness.

**What I would not do again:** re-derive `prep + assemble` by subtraction.
Every version of that number in the record — 6 s, 5.3 s, 11.3 s, 12.5 s —
is a residual, and the two measured directly (1.05 s and 1.07 s) are
nothing like them. The lesson is not that the estimates were careless; it
is that **the residual of a browser load is not an engine quantity at
all**, and a document that builds its central claim on one is one
measurement away from being void — as this one was.

---

## Reproducing anything here

```
node scripts/load_phase_report.mjs            # §8.2, §8.6 — phase decomposition
node scripts/index_shard_spike.mjs            # §3.5, §3.6 — sharded index build
node scripts/index_shard_spike.mjs --selftest # §3.5 — 19,905-split boundary proof
```

Both scripts are on `claude/parallel-index-spike` (`8d2f5cc3`), under
`scripts/`, and **neither is wired into production** — no `IfcAPI`
surface, no loader changes. Raw JSON and console logs for every quoted run
are in that branch's write-up.

**Environment note, since it bit the measurement run:** the container's
`conway-geom` submodule had been rewound from its pinned SHA, and the
stale prebuilt wasm then failed `ap214_sphere_seam_face` (0 vs 2,208
triangles — embind silently drops a value-object field the C++ does not
declare). `yarn wasm-prebuilt --force` fetched
`@bldrs-ai/conway@1.546.1556`, which passes, and every phase number above
was re-measured on it, agreeing with the earlier runs within run-to-run
spread. Another agent held `/home/user/Share` for part of that night
(loadavg to 9.7); every quoted run is stamped with `/proc/loadavg` and the
quoted sets ran at 0.7–4.4.
