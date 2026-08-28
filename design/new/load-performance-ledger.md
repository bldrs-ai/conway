# Load performance ledger: what the M3 work cost, what it bought, and where the wall moved

Companion to [parallel-load-pipeline.md](parallel-load-pipeline.md), which asks
whether O(cores) is reachable and answers it from Node measurements. This doc
asks a different question — **was the complexity worth it, and what should be
built next** — and answers it from the first production load of D3D on the
shipped engine.

Its conclusion is not the one the roadmap assumed: on a real IFC4 model in a
real browser, **geometry is 90 % of the load and parse is 8 %**, so the parse
work that dominated M2/M7/M8 is worth at most 9 % no matter how many cores it
gets. And the binding constraint for the models users are actually bringing is
no longer time at all — it is **peak heap, currently 9.8× file size**.


## 0. The measurement

First production D3D load with the shipped wins. Share `v1.1772.e431cbd`,
conway `v1.1565.608-g18366f01`, uploaded file served from the OPFS cache.

| phase | time | % of load | heap Δ | % of growth |
|---|---:|---:|---:|---:|
| Preparing file | 0.056 s | 0.05 % | 12.5 MB | 0.6 % |
| Hashing model | 0.395 s | 0.34 % | 210.1 MB | 10.4 % |
| Opening model | 0.049 s | 0.04 % | 0.0 MB | 0.0 % |
| **Parsing** | **9.639 s** | **8.28 %** | 778.2 MB | 38.4 % |
| **Geometry** | **104.683 s** | **89.92 %** | 1002.6 MB | 49.4 % |
| Assembling render mesh | 1.602 s | 1.38 % | 25.7 MB | 1.3 % |
| **Total** | **116.424 s** | | 67.9 → **2097.1 MB** | |

Model: 213.6 MB IFC4 (Tekla export), 3,204,852 vertices, 2,453,022 triangles,
units mm. Geometry window held at 197.6 MB.

**The before number is reported, not measured.** Prior behaviour on this model
is recalled as *"700 s+ and something like 6–7 GB"*. Treat it as an order of
magnitude — roughly 6× the time and 3× the peak — not as a baseline. If the
comparison matters for anything load-bearing, re-measure it against a pinned
older conway rather than citing this line.

The bulk of that win is **#616/#617** (adaptive residency in the windowed
pager), which took D3D's aggregate read amplification from 220.9× to 5.1× —
measured in Node at 225.8 s → 75.4 s. Everything else in the M3 batch was
either correctness or an enabler that nothing yet calls.


## 1. The ledger

What the four PRs of the M3 batch cost, and what they return. "Shipped" means a
user sees it today; "enabled" means it is a precondition for something not yet
built.

| change | added (incl. tests/docs) | shipped gain | enabled gain |
|---|---:|---|---|
| #617 adaptive residency | ~100 | **D3D 225.8 s → 75.4 s (Node)** | — |
| #623 v2 sidecar + open-from-index | ~2,700 | 0 — plus a real correctness fix | 16.7× (PSB) / 19.4× (D3D) per *additional* consumer |
| #624 sharded index build | ~3,400 | 0 — no production caller by design | 3.26× on the parse phase, N=4 |
| #622 + #629 | ~1,500 | 0 — correctness | — |

Roughly 7,700 added lines for one shipped speedup, and that speedup came from
the smallest change in the set.

**The pattern in the repo's own data is that waste-elimination beat parallelism
on every axis measured.** #617 got its 3× by not re-reading the same bytes 220
times. #541's 16–19× is the same shape: N workers not re-parsing one file.
Sharding got 3.26× on one phase for 1,175 lines of builder plus a transport
that needed five review rounds and was ultimately demoted to bench code
(see #631).

Two entries deserve their qualifier stated rather than assumed:

- **#623's correctness fix is not incidental.** The v1 sidecar carried only
  `[0, firstInlineElement)`, so a model restored from one resolved every inline
  entity to `null` — surface styles, transparency and measure-valued attributes
  degrading silently on a model that still loaded and looked approximately
  right. Inline share ranges from 0.274 % (MB-Khaya) to 20.995 % (D3D), a 77×
  spread, so whether v1 was safe depended on the exporter. That fix would
  justify a good part of the diff on its own.
- **#624 is speculative inventory.** Its value is entirely contingent on a
  worker pool that does not exist. The shipped artifact — builder plus a merge
  proven byte-identical — has a production caller of exactly zero, and its
  default runner (`inProcessShardRunner`) is sequential with no lifecycle at
  all.


## 2. The production shape retires the parse-first plan for D3D-shaped models

[parallel-load-pipeline.md §8.6](parallel-load-pipeline.md) already computed
that parse parallelism on D3D yields **1.03×** overall. Production says
**1.061×** at the measured 3.26× shard efficiency. The doc was right, and
slightly conservative.

The arithmetic, from the table in §0:

```
parse is 8.28 % of the load
  → Amdahl cap for parallelising parse alone      1.090x   (infinite cores)
  → at the measured 3.26x (N=4)                   1.061x   (116.4 s → 109.7 s)
                                                           5.7 % of wall clock
```

So **M2 buys under six percent on this workload**, and cannot buy more than
nine even in the limit. That is not an argument that M2 was wrong — PSB is a
different shape, and the seam it defines is reusable — but it does mean the
parse phase is finished as a target. Further parse work should be justified by
a model whose profile is not D3D's.

Geometry is where the load is:

```
geometry is 89.92 % of the load
  → Amdahl cap for parallelising geometry alone   9.92x
```

**These projections are unmeasured.** Geometry parallel efficiency has never
been measured in this repo. The figures below assume it, and the assumption is
doing real work in the conclusion:

| configuration | assumed efficiency | geometry | total | speedup |
|---|---|---:|---:|---:|
| geometry N=4 | 0.80 | 32.7 s | 44.5 s | 2.62× |
| geometry N=8 | 0.65 | 20.1 s | 31.9 s | 3.65× |
| geometry N=4 + parse N=4 | 0.80 / 0.857 | — | 37.8 s | **3.08×** |

The efficiency numbers are borrowed from the *parse* measurements, and there is
a reason to think they transfer badly in either direction. Parse sharding
degraded from 0.94 at N=2 to 0.857 at N=4 while a register-bound spin loop held
0.97 — that is a memory-bandwidth signature. Geometry is tessellation:
compute-heavy, working-set-small, and plausibly a *better* scaler. Or worse, if
the wasm heap is the shared resource. **Measure it before planning against it.**


## 3. The wall moved, and it is memory

Peak heap on this load was **2,097 MB for a 213.6 MB file — 9.82×**.

Users are now bringing 2 GB and 3 GB models. At the current amplification:

| model | projected peak |
|---|---:|
| 2 GB | ~19.6 GB |
| 3 GB | ~29.5 GB |

Neither loads. This is not a "slow" outcome, it is a hard failure, and it is
reached long before wall-clock becomes the complaint. **For the large-model
positioning, the amplification factor — not the load time — is the constraint
that decides which files open at all.**

To fit a 2 GB model inside a 4 GB budget, amplification must come down to
**≤ 2×**, a **4.9× reduction** from where it is.

Where the bytes are, from the same load:

| phase | heap Δ | what it is | lever |
|---|---:|---|---|
| Geometry | 1002.6 MB | 49 % of growth. Final mesh is only ~106–132 MB¹, so this is **7.6–9.4× the output** in transient | the largest and least understood term — needs profiling before design |
| Parsing | 778.2 MB | 38 % of growth, for a 213.6 MB file | index + materialised entities; the columnar index is already compact, so this is likely entity objects |
| Hashing | 210.1 MB | 10 % of growth — the file materialised solely to digest it | **already solved but unwired**: #623's `HashingByteSource` folds the digest into the parse's own window pass at zero extra I/O |
| Mesh assembly | 25.7 MB | 1 % | — |

¹ Estimated as `vertices × (24–32 B) + triangles × 12 B` for f32
position+normal(+uv) and u32 indices. If the real vertex format is fatter this
ratio shrinks; it does not change the conclusion that the transient dominates.

The geometry **window** was held at 197.6 MB throughout, so streaming residency
is working as designed. The 1 GB is not the window — it is output plus
transient, and it is the single biggest item on the page.


## 4. What this implies for sequencing

1. **Measure geometry's memory profile before building geometry parallelism.**
   A worker pool that runs N geometry shards concurrently multiplies whichever
   part of that 1 GB is per-shard transient. Parallelising into a memory wall
   makes the 2 GB case worse, not better. This is the one measurement that
   should gate the next design.
2. **Wire `HashingByteSource`.** It exists, is tested, and is unused — every
   call site in the tree is a standalone whole-file pass. Wiring it removes the
   210 MB hash buffer, ~10 % of peak, for no new machinery. Cheapest item on
   this page.
3. **Geometry before parse, for anything D3D-shaped.** 89.92 % versus 8.28 %.
4. **Keep hunting waste.** #617 returned 3× for ~100 lines; #547 (retry-first
   starvation) is filed and still unmeasured; the browser measurement harness
   built for this batch has been used once. On the evidence in §1, one more
   profiling pass has a better expected return than another thousand lines of
   parallel machinery.
5. **Do not land #624 without a scheduled consumer**, or accept it as inventory
   with a carrying cost. The `ShardRunner` seam is the durable asset and it is
   small; the builder is 1,175 lines of proof-carrying merge that nothing calls.


## 5. Open questions

- **Why is geometry 7.6–9.4× its own output?** Unprofiled. Could be per-solid
  scratch not being released, wasm heap fragmentation, or the tessellation
  working set genuinely being that large. Different answers imply very
  different fixes.
- **Does parse's 778 MB scale with file size or with entity count?** D3D is
  20.995 % inline entities, the highest in the corpus. PSB is 0.594 % and four
  times the size — comparing the two would separate the terms.
- **Does geometry parallelise better or worse than parse?** Unmeasured, and
  §2's whole projection rests on it.
- **What is the actual browser ceiling?** If the wasm build is 32-bit, the heap
  is hard-capped at 4 GB regardless of machine memory, which would put a firm
  upper bound on loadable file size at the current amplification. Worth
  confirming before promising anything about 2 GB models.
