# How to measure browser memory on a real model load

Method, not findings. The findings this was extracted from are in
[load-performance-ledger.md](load-performance-ledger.md) §5–§9; read that for
what a D3D load turned out to be made of, and this for how to measure the next
one.

Written because the obvious approach — print `performance.memory`, take a heap
snapshot — **produces a page of zeros and then OOM-kills the renderer**, and
both failures look like something else. Everything below was measured on
Chromium 141.0.7390.37 (Playwright 1194).


## 0. The one-paragraph version

Launch Chrome with `--enable-precise-memory-info` or every number you print is
a lie. Get the four buckets separately — V8 objects, external ArrayBuffers,
wasm linear memory, renderer RSS — because they have different fixes and only
one of them is reclaimable. Do **not** try to take a heap snapshot of a
multi-hundred-megabyte heap; use the sampling profiler for *where allocations
come from* and `queryObjects` + `.clear()` for *what a fix would actually
save*. Cross-check the two: if they disagree, one of them is measuring
something you did not mean.


## 1. The instruments, and what each actually measures

| what you want | how to get it | what it really is |
|---|---|---|
| Everything (JS + external + wasm) | `performance.memory.usedJSHeapSize` | V8 used heap **plus external memory**. Needs a flag — see §2. |
| V8 objects only | CDP `Runtime.getHeapUsage().usedSize` | Excludes ArrayBuffer backing stores and wasm pages. |
| wasm linear memory | the `WebAssembly.Memory`'s `buffer.byteLength` | Wrap `WebAssembly.Memory` at document start to catch every instance. |
| External non-wasm | subtract: `usedJSHeapSize − getHeapUsage − wasm` | ArrayBuffer backing stores — where geometry vertex/index data lives. |
| What the OS sees | renderer RSS from `/proc/<pid>/status` | The only number that reflects allocator high-water and fragmentation. |

**Get all four.** A single "heap" number cannot distinguish a fix that works
from one that cannot: V8 objects are reclaimable by GC, ArrayBuffers are
reclaimable by dropping references, and **wasm linear memory is not
reclaimable at all** (§4).

Attributing a total to the wrong bucket is an easy and expensive mistake. In
the D3D investigation, ~238 MB of geometry buffers were attributed to the
V8-object bucket when they live in the external bucket; the same data, counted
against the wrong ceiling, implied the wrong fix.


## 2. `performance.memory` is latched unless you pass a flag

**This is the trap that invalidates a whole run.** Without
`--enable-precise-memory-info`, `usedJSHeapSize` returns the value it read
first and never moves. Measured: sampled every 5 s for 113 s while 3.6 GB of
wasm memory was committed in 200 MB steps, it returned **202.18 MB at every
single sample**. `crossOriginIsolated` does not help; only the flag does.
Blink bucketizes and rate-limits the default deliberately, as a side-channel
defence.

End to end on the same build, changing only the flag:

| launch | what the load report printed |
|---|---|
| default | `9.536743 → 9.536743 MB heap`, every stage `+0.000000 MB heap` |
| `--enable-precise-memory-info` | `54.410274 → 133.049745 MB heap`, stages populated |

So `+0.000000 MB` does not mean "this stage allocated nothing". It means
"this browser will not tell me" — and it is printed with six decimal places of
false precision. **Any historical heap number must be treated as unreproducible
until you know which way that flag was set.**

Two more properties worth knowing before you quote a number:

- **It is wasm-inclusive.** A 512 MiB `WebAssembly.Memory`, a 512 MiB
  `ArrayBuffer`, and 512 MiB of ordinary JS objects each move it by ~511.65 MB.
- **It is not a live set.** It counts unreclaimed garbage until a GC runs, so a
  per-stage delta is "allocated and not yet collected during that stage", not
  "needed by that stage". Force a collection before drawing conclusions about
  retention.

**Node intuition does not transfer.** On the Node side `heapUsed + external`
is structurally *blind* to the wasm heap — the opposite of the browser. Both
behaviours are documented in `src/memory/memory.ts`.

**Update (conway#679, Chromium 141.0.7390.37): the flag is not always the
discriminator, and there is a second, independent trap underneath it.**
`--enable-precise-memory-info` moved `usedJSHeapSize` by 226–256 MB for a known
256 MiB allocation *with or without* the flag on this build — it was not what
separated a real reading from a frozen one here, unlike on the build above.
Pass it regardless, but verify per-build with the two-read check in §5 rather
than trusting the flag's mere presence. The trap that did cost a debugging
cycle: **`performance.memory` returns a snapshot object**, not a live view —
capturing it once (`const m = performance.memory`) and reading
`m.usedJSHeapSize` twice reports the same number no matter what happened in
between, indistinguishable from the latch above. Re-access
`performance.memory` itself on every read. Full run in
[load-performance-ledger.md §12.8](load-performance-ledger.md).


## 3. What does not work

### A heap snapshot, above a few hundred MB

`HeapProfiler.takeHeapSnapshot` needs roughly **8–10× the heap it is
describing** in free RAM. Measured: on a settled 1,236 MB V8 heap
(renderer RSS 2.95 GB) the walk drove the renderer to **13.1 GB anon-rss** and
was cgroup-OOM-killed having emitted **zero** `addHeapSnapshotChunk` events —
no partial artifact, no error, just a dead renderer.

The same pipeline on a 46 MB heap produces an 87 MB snapshot in 5.1 s. So it
is a scale wall, not a broken harness — and it fails in the least helpful way,
by dying rather than degrading. **Budget ~10× the V8 heap in free RAM, or plan
not to snapshot.**

`Runtime.queryObjects` is expensive too but survivable: enumerating 656,251
live `Set`s took the renderer to 5.33 GB.

### An in-page probe, through a phase that does not yield

`page.evaluate` needs the main thread. Conway's demand pump does not yield it
during geometry, so an in-page sampler collected 21 samples during a 19 s
download and then **nothing for 72 minutes**. Anything scheduled on the page —
including a loop that also does out-of-band reads — goes blind for the phase
you most want to see.

Use out-of-band sampling (`/proc` from the driving process, on its own timer),
or ride a callback the engine already invokes, or use the sampling profiler
(§4), which survives a starved main thread because V8 collects it internally.


## 4. What does work

### Allocation site — V8's sampling heap profiler

`HeapProfiler.startSampling` (128 KB mean interval) **started before
navigation**. It holds each sampled object through a weak handle and drops the
sample when the object is collected, so a profile read *after a forced GC* is a
live-heap attribution by JS call stack.

- Cost: ~10 % of wall clock on a geometry-heavy load.
- Coverage: its live total came to **99.8 %** of what the CDP counter reported,
  so it accounts for essentially the whole heap rather than a sample of it.
- Survives main-thread starvation, unlike anything scheduled on the page.

Build unminified (`SHARE_CONFIG=playwright`) or the frames carry no useful
names. Cost of doing so was measured at ~3 MB.

### Causal retention — `queryObjects` then `.clear()`

`Runtime.queryObjects` collects before returning, so everything it hands back
is live by construction. Enumerate every `Set`/`Map`, then `.clear()` each
large one with a forced full collection either side and watch
`Runtime.getHeapUsage().usedSize`.

The drop is **not an estimate of what a fix would save — it is what it saves.**
That is the difference between "this cache looks big" and "clearing this cache
returns 396.65 MB", and it is worth the extra effort every time: in the D3D
run, one plausible-looking candidate (`ReleaseEntityCache`) returned
**−0.10 MB**, and was dropped from the plan on that basis alone.

### Cross-validate them

The two instruments are independent — one attributes by allocation stack, the
other by causal removal. Agreement is evidence; disagreement means one of them
is measuring something you did not intend. In the D3D run they agreed on the
largest item to within **0.65 MB**.


## 5. A recipe

1. **Launch with `--enable-precise-memory-info`.** Confirm it took: read
   `usedJSHeapSize`, allocate a known 512 MiB, read again. If it did not move,
   stop — nothing downstream is real.
2. **Wrap `WebAssembly.Memory` at document start** so every instance is
   reachable for size sampling.
3. **Start the sampling profiler before navigating.**
4. **Sample out-of-band during the load** — `/proc` RSS on its own timer, not
   on the page's thread.
5. **At completion, settle and split.** Force two collections. Record V8
   (`getHeapUsage`), wasm (summed `buffer.byteLength`), total
   (`usedJSHeapSize`), RSS. External = total − V8 − wasm.
6. **Attribute.** Read `getSamplingProfile` for allocation sites; use
   `queryObjects` + `.clear()` for the big containers.
7. **Test idle decay.** Re-read after ~120 s idle and after forced collection.
   No decay means the peak is live and the fix is a design change, not a GC
   tuning problem.
8. **Classify each item: steady state, or transient that outlived its use.**
   That distinction is what decides whether the fix is a `.clear()` or a
   redesign, and it is the most useful output of the whole exercise.


## 6. Reading the result

- **Peak, retained, and steady-state are three different numbers.** Peak sets
  whether a file opens at all. Retained sets whether a *second* model can be
  opened in the same tab. Steady state is what the feature genuinely costs.
  A one-line `.clear()` in a finalizer moves retention and does nothing for
  peak if the structure is at its maximum exactly when the load ends.
- **Check retained against the ceiling, not against comfort.** The wasm build
  is 32-bit (`maximum 65536 pages = 4096 MiB`) and `jsHeapSizeLimit` is a
  *separate* ~4 GB cap. A load must fit under both, and committed wasm pages
  never come back.
- **If forced collection recovers almost nothing, the peak is live.** That
  rules out "we just need to GC more" and points at ownership: something is
  holding a reference past its usefulness.
- **Name what you did not measure.** "When during the load did this grow" is a
  different question from "what is standing at the end", and the second does
  not answer the first.


## 7. Known gaps in this method

- **No per-stage attribution yet.** §4's sampling profiler is the missing half:
  reading `getSamplingProfile` at each stage boundary would give the split
  directly, and it survives the starved main thread that defeated the in-page
  sampler. Not yet done.
- **Container identification is inference.** Sizes measured via `queryObjects`
  are exact; deciding *which* `Map` a 228,971-entry map is, from entry count
  and key shape, is not. Record the value shape too if identity matters.
- **The harness does not set the flag by default.** `tools/playwright.config.js`
  has no `--enable-precise-memory-info`, so every measurement run needs it
  passed explicitly until that changes.
