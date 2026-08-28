# Streaming, fixed-memory STEP/IFC loader — toward a CAD browser

**Status:** Scoping doc (300–400 level). Nothing here is implemented; this
is the architecture we intend to live with. Prerequisite primitives
(random-access source, SoA index, type-filtered iteration) **shipped**
through conway 1.383 — see "Where we are".

**Owner:** Pablo (with Claude).

**Companion docs:**
- `design/new/memory-residency.md` — the shipped residency primitives this
  builds on (windowed `StepBufferProvider`, OPFS spill, SoA index,
  roots-only iteration).
- `design/new/emsdk-upgrade-scalable-allocator.md` — wasm-heap allocator
  arc (AFTP arenas); the transient-peak side of geometry memory.
- [Share `design/new/lazy-properties-memory.md`](https://github.com/bldrs-ai/Share/blob/main/design/new/lazy-properties-memory.md)
  — product-side consumers (props capture, GLB cache, spill wiring).


## Vision

Two motivations, one architecture:

1. **Really large single models.** PSB-class files (900 MB source, ~10 M
   records) should open in a browser tab with memory bounded by *what the
   user is looking at*, not by file size. Today we get through PSB by
   spilling the source *after* a full-buffer parse and by keeping property
   sweeps lazy — but the parse itself still requires the whole source
   resident once, and the wasm geometry heap still grows with the model.

2. **A CAD *browser*.** Real projects aren't one file: they're thousands
   of cross-referenced files storing parts and versions separately. The
   end state treats models as effectively infinite federated hypermedia —
   we *visit* parts of a project the way a web browser visits pages,
   materialising only what's on screen (plus prefetch), and letting go of
   what isn't. No individual IFC/STEP file is "infinite", but the
   federation is, so the engine must never assume it can hold "the model".

The unifying invariant: **every stage of the pipeline is streaming /
demand-driven, with an explicit memory budget; nothing is O(file size) or
O(federation size) except external storage.** A happy side effect is
latency hiding: if parse, indexing, and geometry materialisation are all
incremental, first pixels can appear while bytes are still arriving.


## Where we are (shipped inventory, conway 1.383)

What we can already rely on:

| Primitive | Shipped in | What it gives the streaming loader |
| --- | --- | --- |
| SoA entity index (`address_`/`length_`/`typeID_`/`expressID_` columns) | #372 | O(entities) index (~16 B/record ≈ 155 MB on PSB) fully decoupled from source bytes; descriptors lazy |
| Windowed `StepBufferProvider` + external byte store + OPFS spill | #374, Share #1591 | Random-access *source* semantics: sync `acquire` over resident windows, async `ensureResident`, LRU eviction, pin refcounts |
| Scratch-buffer release (`releaseScratchParsingBuffer`) | #378 | No hidden O(source) pins after parse |
| Roots-only / type-filtered iteration (`expressIDsOfTypes`, `RootExpressIDs`) | #383 | Semantic enumeration straight off the index — consumers subscribe by type set instead of scanning |
| Incremental parse core (`parseDataBlockIncremental` generator + sync/async drivers) | #381 | The parse loop already yields control cooperatively and reports progress; only its *input* is non-streaming |
| Progress API (`ON_PROGRESS`/`ON_MODEL_INFO`, `OpenModelAsync`) | #381 | Event plumbing from engine to UI already exists |
| AFTP tessellation arenas | #360 / conway-geom #139 | Bounded per-face scratch; geometry *transient* is tamed (the grow-only heap is not) |
| Streaming GLB property writer + names-only tree (Share) | #1588/#1589 | Proof that downstream consumers can run O(reachable) instead of O(model) |

The remaining structural residencies — the things this doc exists to kill:

1. **Parse-time source residency.** `parseDataToModel` needs the entire
   source as one contiguous buffer. The spill only happens *post*-parse.
   Peak = source + index. This is the "constant-memory parse" gap.
2. **Grow-only wasm geometry heap.** 1283 MB on PSB at steady state
   (measured 2026-08-18; earlier ~2 GB figures included a measurement
   harness's own leaked native clones). Geometry is extracted eagerly for
   the whole model and stays resident in the wasm heap even after the
   GLB/scene is built — see the M3 status below, where per-batch release
   takes this to 342 MB at batch 256 and 84 MB at batch 32.
3. **Eager whole-model geometry extraction.** Even with a bounded heap,
   extracting *everything up front* is O(model) time before first pixel
   and O(model) scene memory after.

(3) is where "fixed memory" becomes "CAD browser": the fix isn't a
smaller buffer, it's *not doing the work* until a viewport/query asks.


## Target architecture

```
                    ┌────────────────────────────────────────────────┐
                    │                ByteSource                      │
                    │  file / OPFS / HTTP-Range / (HDF5 later)       │
                    │  read(offset, length) → bytes   [async]        │
                    └───────┬────────────────────────────────────────┘
                            │ sequential windows (parse)  /  random windows (demand)
                    ┌───────▼───────┐
                    │  Window pool  │  fixed budget, LRU, pinning
                    │ (StepBuffer-  │  (exists today: #374)
                    │   Provider)   │
                    └───────┬───────┘
              parse stream  │
        ┌───────────────────▼──────────────────┐
        │  Chunked index builder               │  carry-over lexer state across
        │  (parseDataBlockIncremental over a   │  window boundaries; emits index
        │   moving window, not a whole buffer) │  columns + record events
        └───────┬──────────────────────────────┘
                │ record events: (typeID, expressID, address, length)
        ┌───────▼──────────────────────────────┐
        │  Semantic consumers (subscribed by   │  header, type index, spatial
        │  type set via EntityTypesIfc query   │  skeleton (roots), property
        │  closures — #383 machinery)          │  roots, external-ref registry
        └───────┬──────────────────────────────┘
                │ readiness events: "product P's representation closure is resolvable"
        ┌───────▼──────────────────────────────┐
        │  Demand-driven materialiser          │  viewport/query-driven work
        │  (geometry tiles: extract →          │  queue; budgeted wasm arena;
        │   tessellate → upload → EVICT)       │  meshes are cache entries,
        └──────────────────────────────────────┘  not model state
```

### API surface: new engine API, not more shim

The streaming loader is where conway's API **moves out of the web-ifc
compat shim**. Everything above ships as a new first-class surface —
working names:

```ts
conway.openStream(source: ByteSource, opts): ModelStream
modelStream.on(types, handler)            // record / readiness events
modelStream.index                          // incremental SoA + type index
modelStream.demand                         // geometry work queue handle
modelStream.budget                         // window pool + wasm budgets
```

The shim (`IfcAPI.OpenModel`, `GetLine`, and the transitional extensions
we added along the way — `SpillModelSource`, `RootExpressIDs`,
`ensureLineResident`) remains as a **compat facade implemented on top of
this engine API**, for web-ifc-shaped consumers and for Share until it
migrates. New capabilities land on the engine API only; the shim gets no
new surface. (This is the formalisation `memory-residency.md` promised
when it acknowledged the `getPassthrough().model[0]` coupling.)

Three architectural commitments, in decreasing order of certainty:

### 1. Streaming parse (constant-memory index build)

The parse core is already an incremental generator; the change is feeding
it **windows instead of a buffer**:

- `ParsingBuffer` (or a successor `StreamingParsingBuffer`) reads through
  the window pool. Parse is sequential, so this is a forward-moving window
  with a small carry-over: a record that straddles a window boundary is
  re-lexed from its start address in a merged view (the straddle machinery
  from #374's `WindowedStepBufferProvider` already does exactly this for
  reads; parse needs the writer-side equivalent).
- Bytes arriving from the network/file are **written through to the byte
  store (OPFS) as they arrive**, so the store *is* the source of truth
  from t=0 — no post-hoc spill step, no full-source moment, ever.
- Output is exactly today's SoA columns plus an event stream. Peak JS
  memory during load: `window pool budget + index columns`, independent
  of file size.
- Both STEP lexing properties that make this safe hold already: records
  are newline/semicolon-delimited with no back-references at the lexical
  level, and the index build needs only `(address, length, typeID,
  expressID)` per record — attribute parsing stays lazy exactly as today.

Semantic wrinkle to design for: **forward references.** STEP files
routinely reference records that appear later in the file. The index
builder doesn't care (it's lexical), but semantic consumers do. The
resolution: consumers receive record events immediately but treat
reference resolution as *deferred until the index pass completes OR the
referenced id is already indexed* — a "resolvable" notification, not a
"parsed" one. A pending-refs table (id → waiters) makes this cheap, and
degenerates to "everything resolvable at end of stream" for hostile
orderings.

### 2. Event-triggered semantic consumers

Generic record/descriptor events with type-set subscription, built on the
`query` closures #383 formalised:

```ts
indexStream.on([IfcProject, IfcProduct, IfcRelAggregates], (rec) => ...)
indexStream.on(IfcRoot, ...)          // everything GlobalId-bearing
indexStream.onAnyRecord(...)          // the firehose, for tools
```

Standard consumers we'd ship:
- **Header + units + schema** (available within the first window — this
  is what makes progressive UI honest).
- **Type index** (today's `MultiIndexSet`, available before end of parse).
  *Correction, 2026-08-18:* not an event consumer. Since the index is
  columnar from birth (M7 — which postdates this section), the cheap and
  correct way to have it early is to run the production indexer over a
  prefix snapshot of the columns. Pushing records into per-type sets cost
  +88 % of parse and +254 MB on PSB and missed the complex records'
  mapped classes outright. See M2b under Milestones for the measurements.
- **Spatial skeleton**: project → site → building → storey → product
  *names* tree (the `'names'` mode from #373), emitted as it becomes
  resolvable. This is the browser's "sitemap".
- **Property roots registry**: the #383 roots set, so props capture and
  the Properties panel work before (or without) geometry.
- **External-reference registry**: records that point outside this file
  (see Federation below) — collected during the same pass.

Backpressure: consumers are sync and cheap (they mostly copy ids into
their own compact structures). Anything expensive (geometry!) must NOT
run in the event path — it goes through the demand queue below. This is
the lesson from the props-sweep regressions: keep the hot pass free of
churn.

The sharper form of that rule, after the 2026-08-18 spike: **only put a
consumer on the event path if it needs the record's bytes while the
window still holds them.** Everything else — membership, counts, ids —
is already in the columns and is cheaper (and, for complex records, only
*correct*) when derived from a prefix snapshot at whatever cadence the
consumer actually needs. The event payload is
`(localID, expressID, typeID, buffer, byteOffset, byteLength)`, with the
byte view left un-materialised so a handler that ignores it pays nothing;
the bytes are valid only for the duration of the call.

### 3. Demand-driven, evictable geometry (the browser part)

Invert today's model: geometry extraction stops being a load phase and
becomes a **cache fill** keyed by product (or product-tile):

- A **work queue** ordered by demand: viewport frustum + distance,
  explicit selection, prefetch hints (storey the camera is in, federation
  links the user hovers). The queue consumes "resolvable" products from
  the semantic layer — which is what makes load-time incremental
  materialisation fall out for free: as the stream advances, resolvable
  products enter the queue and the model *appears progressively*.
- Extraction/tessellation runs in a **budgeted wasm arena** (AFTP gave us
  the arena discipline): extract → tessellate → upload to GPU/scene →
  **release the wasm-side intermediates**. The grow-only heap becomes a
  bounded working set. This likely wants `conway-geom` API for "free this
  product's native geometry" — today's wasm heap has no per-product
  reclaim; scoping that C++ surface is milestone M2's first task.
- Scene meshes themselves become **evictable tiles** (LRU by
  screen-space contribution) once the federation goal is real. For single
  files this is optional; for "infinite" projects it is the point.
- The GLB cache stays: a visited tile can be persisted per-file/per-tile
  so revisits are `O(1)` loads. Today's whole-model GLB is the degenerate
  single-tile case.

**Parallelism / multi-core.** The work queue is also the engine's
scheduler, and the thread plan is **workers for everything — the main
thread is already overloaded and is reserved for UI**:

- **Parse/index worker** (one): owns the ByteSource, the OPFS
  sync-access handle (which *requires* a worker anyway), the window
  pool, and the index build. Emits record/readiness events and
  transferable index snapshots to subscribers.
- **Geometry worker pool** (N ≈ cores − 2): each holds a conway-geom
  wasm instance (the MT/pthreads builds exist today) with its own
  budgeted arena; the demand queue dispatches products to idle workers.
  Products are naturally independent at tessellation time, so this
  parallelises without shared mutable state — the AFTP arena work
  already proved ~2.8× on this shape of parallelism.
- **Main thread**: UI, scene graph, GPU uploads (transferables /
  `postMessage` of vertex buffers), demand-priority computation from the
  camera. Never lexing, never tessellating, never sweeping.
- Index columns are typed arrays, so sharing them read-only with
  consumer threads via `SharedArrayBuffer` (COOP/COEP permitting) or
  transferable snapshots is a packaging decision, not an architectural
  one — start with transferables, upgrade hot paths to SAB if profiles
  demand.
- Staging: the worker split lands **with M1's open path** (the OPFS
  write-through wants the sync handle, hence a worker, on day one);
  the geometry pool lands with M3. The main-thread cooperative driver
  survives for node/tests only.

## Stretch goals

### S1 — Zero-copy resident path

Once the file is resident (OPFS or memory), attribute extraction should
operate on **views, not copies**: `acquire()` already returns
`{buffer, offset}` views; the remaining copies are the merged straddle
buffers (unavoidable, bounded) and wasm-boundary marshalling of geometry
attribute arrays (`IfcCartesianPointList3D` etc.). The realistic win is
passing source byte ranges into wasm and parsing numeric lists
C++-side, rather than JS-side materialisation → copy-in. Scope as an
optimization pass after M1; measure before committing — the SoA descriptor
work already removed the worst copy tier.

### S2 — Network pull-parser (leave the file on the network)

`ByteSource = HTTP Range requests`. Two operating modes:

- **Cold scan:** the streaming parse *is* a sequential range fetch; we
  build the index while writing bytes through to OPFS. First visit costs
  one full download but never holds the file in memory — and geometry
  starts appearing at first-window, not last-byte.
- **Index-first (the real prize):** skip the scan when an **index
  sidecar** exists — a compact serialisation of the SoA columns + type
  index + spatial skeleton + property-roots + external refs (call it
  `.conway-idx`; it's ~16 B/record + tables, so ~1–2 % of source size).
  With a sidecar, the loader fetches *only* the byte ranges demand asks
  for: property panels pull a few KB; a storey pulls its products'
  geometry ranges. Well-organised exporters (product/property records
  up-front, geometry bulk later) make range locality excellent, and the
  same access pattern maps directly onto network HDF5 (chunked datasets +
  B-tree index) later.
  - Sidecars can be produced by us on first visit (write-back next to the
    GLB cache), by a server-side indexer, or eventually by exporters.
  - Versioning/integrity: sidecar records source length + strong hash;
    mismatch → fall back to cold scan. (Same degradation contract as the
    OPFS spill: never wrong bytes, at worst slower.)

### S3 — Federation: models as hypermedia

The addressing model that makes "thousands of cross-referenced files" a
browser problem instead of a loader problem:

- **Model URI + expressID** as the universal entity address
  (`https://…/part-B.ifc#4022`), with per-model loader instances sharing
  one global window-pool/geometry budget (the budgets must be *per
  browser*, not per model, or federation re-introduces O(N) memory).
- IFC's own links (`IfcDocumentReference`, `IfcExternalReference`, and
  in practice vendor conventions in long-form projects) and STEP AP242's
  external references populate the external-reference registry during
  parse; the UI renders them as navigable links — visiting one opens a
  sibling loader with its own sidecar/stream.
- Cross-file spatial composition (site plan referencing per-building
  files) composes the spatial skeletons; geometry tiles from different
  files coexist in one scene under the shared budget.
- Versioning across files (many versions stored side by side) is an
  addressing concern, not an engine concern: the URI scheme must carry
  version identity; the engine just sees more models.

## Milestones

Deliberately small first step; each has a measurable exit.

- **M0 — Streaming-input spike (go/no-go). ✅ DONE — GO.** Fed
  `parseDataBlockIncremental` from a moving window over a `ByteSource`
  with straddle carry, sliding the window at top-level record boundaries
  (`ParsingBuffer.rebaseWindow` + a boundary hook on the parse
  generator; coordinator in `streaming_index_builder.ts`). The one
  subtlety: the parser recorded `address` as the raw buffer cursor,
  which is only file-absolute when `initialOffset` is 0 — changed the
  record-start capture to `input.address` (a no-op for every resident
  caller, file-absolute under a sliding window). Verified byte-identical
  index (address/length/typeID/expressID over top-level + inline + multi
  entries) against the resident parse.

  **Pool sweep (SKYLARK, 400 MB, 7.82 M records; node fd source, so the
  source is never JS-resident):**

  | mode | index checksum | parse | slides | window | RSS |
  | --- | --- | --- | --- | --- | --- |
  | resident (whole-buffer) | `2955602042` | 17.6 s | — | 382 MB | 1531 MB |
  | stream, 128 KB pool | `2955602042` | 6.9 s | 6081 | 0.1 MB | 713 MB |
  | stream, 1 MB pool | `2955602042` | 6.5 s | 762 | 1.0 MB | 758 MB |
  | stream, 64 MB pool | `2955602042` | 6.2 s | 10 | 64 MB | 720 MB |

  Hypothesis confirmed: pool size costs only ~10 % wall-clock (128 KB
  vs 64 MB), dominated by the linear lex; the sliding memmove is cheap
  even at 6081 slides. Byte-identical index at all three pool sizes.
  Peak memory is bounded by `index + pool`: the ~382 MB source drops out
  of RSS entirely (1531 → ~720 MB), and the residual is the O(entities)
  element-object index — the same term the resident parse holds, and
  the one M1/M3 later compact to SoA columns. Largest single record on
  the corpus: 25.7 KB (so 128 KB never needs the grow-restart valve,
  which is unit-tested separately). Exit criteria all met; no public API
  changes (the shim is untouched; the added surface is internal).
- **M1 — Write-through open path.** `OpenModelStream(source)` in the shim:
  stream → OPFS write-through → windowed provider from t=0; delete the
  post-parse spill step in Share. Exit: PSB opens with no full-source
  moment (heap-snapshot verified); regression corpus byte-identical.

  *Scope note (decided 2026-07): the "no full-source moment" collides
  with the synchronous geometry-extraction pass, which needs its record
  ranges resident and accesses records across the whole file — that
  residency is M3's demand-driven rework. M1 is therefore split:*
  - **M1a — engine core (in progress).** `IfcStepParser.parseStreamToModel(
    source, store)` — stream the index (M0, bounded parse memory) and back
    the model with a windowed provider over `store` instead of a resident
    buffer, so the source is never held fully resident. `source` is the
    synchronous parse feed (OPFS sync-access handle on a worker; fd/buffer
    in node); `store` is the async model-access store (OPFS `File.slice()`).
    Property/index access works via `ensureResident` + the async surfaces;
    geometry still needs residency until M3. `StepModelBase`/`IfcStepModel`
    gained an optional pre-built-provider constructor arg for this.
    Byte-identical record decode vs the resident parse (test).
  - **M1b — Share open path (#1602).** OPFS write-through from t=0 + the
    parse/index worker + drop the post-parse spill. Lands the shim
    `OpenModelStream`. Full "no full-source moment" for the geometry phase
    waits on M3.
- **M2 — Record events + incremental consumers.** Event bus with type-set
  subscription; names skeleton on the event stream, type index / roots /
  header derived from the prefix columns; `ON_MODEL_INFO` fires from first
  window. Exit: spatial tree UI populates while PSB still parsing; props
  capture works pre-geometry.
  - **M2a — event core (in progress).** The streaming parse now emits a
    per-record event `(localID, expressID, typeID)` live as each top-level
    record is indexed (`parseDataBlockStreamed` / `buildIndexStreaming`
    `onRecordIndexed` hook). `StreamingRecordDispatcher` routes events to
    consumers subscribed by type set — the subtype closure via the
    generated constructor `query` (#383), so `on([IfcRoot], …)` matches
    products, rels, psets, quantities and future subtypes. Handlers run
    sync in the parse path (cheap only). localIDs are dense/ascending;
    a grow-restart re-fires from 0, so consumers must be idempotent by
    localID/expressID (the standard ones are). Verified: a roots registry
    built live from the stream equals `expressIDsOfTypes(IfcRoot)` on the
    finished model. External-mapping records (typeID 0) reach `onAnyRecord`
    only; concrete-type resolution for them is the incremental type-index
    consumer (M2b).
  - **M2b — standard consumers (re-shaped & finished 2026-08-18).**
    Header/`ON_MODEL_INFO` from the first window landed with the open
    paths. The rest split in two by *what the consumer needs*, which the
    spike below settled:
    - **Membership-shaped consumers — type index, roots, property-roots —
      derive from a prefix column snapshot** (`ColumnarIndexSink.snapshot()`
      → `StepTypeIndexer.createFromColumns`), not from the event stream.
      `PrefixTypeIndex` is that consumer; incrementality is a cadence knob
      (rebuild when a query is more than a growth factor stale), so a
      caller that never queries pays nothing. This gets end-of-parse
      parity *by construction* — it is the same indexer call the model
      makes — including the complex entries' mapped classes.
    - **Byte-shaped consumers stay on the event stream**, because they
      need a record's bytes while the window still holds them. The
      spatial **names skeleton** is the one standard consumer that
      genuinely does (Name / LongName / GlobalId + the spatial rel edges);
      it is what carries the "spatial tree populates while parsing" exit
      criterion, and it deletes Share's post-parse `'names'` sweep.
      `IfcSpatialSkeleton` subscribes to `IfcObjectDefinition` for names
      and to the two containment relationships for edges, reading fields
      straight out of the window through `RecordFieldCursor` (the
      production tokenizer over the record's bytes — no model, no entity,
      nothing allocated per record). Edges are appended as integer pairs
      and only linked into a tree when `tree()` is called, which is what
      makes "resolvable" mean "present when you asked" rather than a
      pending-reference table. Measured on PSB: **+1.6 %** parse
      (min-of-3, 8,191 → 8,326 ms) and ~5 MB, for 13.5 k nodes and 7.9 k
      edges available *during* the parse. The cost is dominated by having
      subscriptions attached at all, not by the skeleton's own work — a
      pair of subscriptions that merely count measured the same — which
      is why the dispatcher now resolves a record's handlers with one
      `Map` lookup regardless of how many consumers are attached.
    - **Forward references need no pending-refs table.** With the skeleton
      resolving edges at snapshot time, "resolvable" is "present in this
      generation", and a hostile ordering degenerates to "resolvable at
      end of stream" — the behaviour M2 asked for, with nothing to
      maintain.
    - **Struck:** the conway-geom per-product-free scoping. The 2026-08-16
      triage measured eviction-into-freelists returning ~0 RSS, and M3 is
      re-scoped to bounded high-water via per-batch copy-out + native
      release. It no longer gates M3 and is not M2's work.

    **Spike (2026-08-18, `scripts/m2_consumer_spike.mjs`).** PSB.ifc,
    9,382,205 records, node, 4-core sandbox; baseline is the production
    columnar streaming parse (8,236 ms / 237 MB retained):

    | consumer shape | parse | vs base | retained | concrete types |
    | --- | --- | --- | --- | --- |
    | empty event handler | 8,307 ms | +0.9 % | 214 MB | — |
    | type-set subscription + compact capture | 8,324 ms | +1.1 % | 220 MB | — |
    | event-fed `Set`-per-type index | 15,481 ms | **+88.0 %** | 491 MB | **83** |
    | derived once from finished columns | 8,253 ms | +0.2 % | 318 MB | **95** |
    | derived at 2× growth (14 rebuilds, queryable mid-parse) | 8,780 ms | +7.2 % | 323 MB | **95** |

    Three findings. (1) The event-fed type index was not merely expensive
    but **wrong** — 83 types against the production indexer's 95, because
    complex records arrive on the stream as `typeID 0` with their mapped
    classes stripped; it failed M2's own "identical to end-of-parse
    construction" gate and has been removed. (2) The seam was charging
    every consumer for bytes nobody read: both emission sites allocated a
    per-record `subarray` for `recordBytes` (argument evaluation is
    skipped when the hook is `undefined`, so the no-consumer baseline
    never paid it and it stayed invisible) — 9.4 M allocations, +5.7 %
    wall-clock and +46 MB. The event now hands over
    `(buffer, byteOffset, byteLength)` and a handler materialises the view
    only if it wants the bytes; the +0.9 % row above is post-fix.
    (3) Type-set dispatch over the #383 `query` closures costs nothing at
    9.4 M records — that half of M2 is vindicated as designed.
- **M3 — Demand-driven geometry.** Work queue + budgeted arena +
  per-product wasm reclaim; load-time progressive materialisation
  (viewport-ordered). Exit: PSB time-to-first-pixel < 25 % of full-load
  time; steady-state wasm heap under a configured budget (e.g. 512 MB)
  with the full model *navigable* (tiles fill/evict on demand).

  **Status 2026-08-18 — machinery shipped, discipline not in the
  production path; re-scoped to bounded high-water.** Every part exists
  and is tested (`DemandGeometryQueue`, `ChunkedPool` →
  `SharedAssetPool` → `GeometryTilePool`, the C++ `TilePool` twin +
  `createWasmTileBackend`, `IfcTileAssetExtractor`, the per-product
  `extractProductGeometryByLocalID` seam), and outside tests nothing
  consumes any of it: Share runs the shim's durable batch pump, which
  extracts every product into `model.geometry` and holds it for the life
  of the tab. Measured with `scripts/m3_pump_spike.mjs` (child process
  per phase; placements and payloads hashed per phase so "M3 changes
  *when*, not *what*" is a check, not a claim).

  **PSB.ifc — 902 MB, node, 4-core sandbox, batch = 256:**

  | phase | open | geometry | total | wasm peak | RSS | JS retained |
  | --- | --- | --- | --- | --- | --- | --- |
  | `classic` — `OpenModel` + `StreamAllMeshes` | 48 s | 8 s | 56 s | **1283 MB** | 3577 MB | 1566 MB |
  | `pump` — deferred, batched, no copy-out | 13 s | 35 s | 48 s | 1283 MB | 2827 MB | 1255 MB |
  | `copyout` — + per-batch payload copy-out | 13 s | 33 s | 46 s | 1283 MB | 3025 MB | 1597 MB |
  | `bounded` — + per-batch native release | 13 s | 25 s | **38 s** | **342 MB** | 2048 MB | 1589 MB |

  Every payload-carrying phase **holds** its copied vertex and index
  buffers until it reports (40 356 typed arrays, 334 MB on PSB), because
  a consumer building a navigable scene keeps them — hashing and
  dropping them would report a JS working set nobody actually has, and
  would hide the GC pressure of holding it. They are retained exactly as
  `GetVertexArray`/`GetIndexArray` return them: those already hand back
  owning copies (`getSubArray` ends with `slice(0)`), so a defensive
  `.slice()` on top would double every payload and leave the first
  generation as garbage — inflating the very columns this table reports. Compare rows within this
  table only: absolute wall-clock on this box moves ±25 % between runs,
  so the cross-run deltas that matter are the memory columns, which are
  stable and reproduce.

  Identical placement and payload digests across `classic`, `copyout`
  and `bounded` **on PSB, the model this table measures** — corpus-wide
  the deferred phases match `classic` on 11 of 12 models and each other
  on all 12; see the smoke-corpus paragraph below for the
  `supercap.step` exception. Four readings:

  1. **The geometry residency is the entire wasm heap.** The deferred
     open reaches end-of-parse at **16 MB** of wasm; classic is already
     at 1283 MB when `OpenModel` returns. Parsing costs no meaningful
     wasm — so a parse-phase memory regression is never wasm-side, which
     also redirects the Share-side "+1.7 GB parsing" hunt away from wasm
     ArrayBuffers.
  2. **The tab holds ~4× the geometry it delivers.** 23 454 instances
     over 20 178 distinct geometries are **334 MB** of vertex+index
     payload against a 1283 MB high-water. The gap is never releasing,
     not the model.
  3. **Reading vertices costs no extra wasm.** `pump` (no copy-out) and
     `copyout` peak identically at 1283 MB, so serving a consumer its
     own geometry is free on the wasm side — the payload is copied out
     to JS and the native is untouched. An earlier version of this
     section claimed `GetGeometry` cost +672 MB; that was the spike
     harness leaking, not the engine. `GetGeometry` returns
     `geometryObject.clone()` — an *owning* native copy — and the
     harness never deleted it, so it accumulated one clone per geometry
     inside the heap it was measuring. Consumers of this API must delete
     what it hands them; conway's own paths already do.
  4. **Releasing costs nothing measurable.** `bounded` is the fastest
     row here, but the spread between rows (~24 %) sits inside this
     box's run-to-run wall-clock variance (~25 %), so the honest claim is
     the negative one: **no release overhead is distinguishable from
     noise**, across every run taken. Establishing that release is
     genuinely *faster* would need repeated timings with the variance
     separated out, which nothing here depends on — the memory columns
     are the result, and they are stable.

  **The high-water becomes O(batch), which is the whole point.**
  `bounded` at batch = 32 reaches **84 MB** (identical digests) against
  342 MB at batch = 256. The residency now tracks the in-flight
  working set the way the design says it should, rather than the model:
  1283 MB → 342 MB → 84 MB as the batch shrinks, at no wall-clock cost.

  Release is keyed on what the extractor **creates**, not on what it
  delivers. The two differ: natives are built that never reach a
  consumer as a payload — void and opening geometry consumed by a
  boolean — and a release keyed on delivered payloads leaves those
  resident for the life of the model. On PSB that is 403 of 20 581
  assets, and on MB-Khaya 3 347 of 8 947 (37 %). Correcting it is what
  moves the batch-32 row from 100 MB to 84 MB; the batch-256 row is
  unchanged at 342 MB, because at that size the in-flight set dominates
  the residue. (An earlier version of this section reported 100 MB and
  checked only that every *copied* geometry was freed — a check that
  cannot see this class of leak at all.)

  **Implementation, first landed piece — the delta capture is
  incremental (2026-08-18).** `streamNewMeshes_` re-walked the WHOLE
  scene on every pump call, using per-entity watermarks to suppress
  instances it had already emitted, so the capture cost
  O(batches x scene). The scene array is append-only, so one cursor into
  it carries the same information every per-entity watermark did, and
  the walk becomes O(new nodes). `IfcSceneBuilder` gained
  `walkFrom`/`walkNode`/`nodeCount`, with all three walk forms resolving
  a node through one private helper so the incremental and whole-scene
  forms cannot drift — a drift there would place geometry differently
  depending on batch size.

  `walkFrom` deliberately yields nodes whose geometry does NOT resolve,
  with their index, because a cursor passes each index once: the
  whole-scene walk picked such a node up on a later pass and a cursor
  would lose it forever. Geometry does appear after its node — a product
  re-extracting geometry an earlier release freed is exactly that case —
  so those indices are parked and retried.

  Measured with a minimal driver (`ExtractGeometryBatch` with a counting
  callback, no payload copies, no digests) so the numbers are the
  engine's, not the harness's:

  | model | batch | before | after |
  | --- | --- | --- | --- |
  | **PSB.ifc** (23 454 instances) | 8 | 37.0 s | **25.3 s** (1.47x) |
  | PSB.ifc | 64 | 27.3 s | 25.1 s (1.09x) |
  | **D3D.ifc** (562 367 instances) | 64 | 198.6 s | **66.8 s** (2.97x) |
  | D3D.ifc | 256 | 102.2 s | 69.9 s (1.46x) |
  | D3D.ifc | 8 | not run | 68.8 s |

  Identical delta-mesh counts across every run (PSB 7 764, D3D 192 022),
  and identical placement and payload digests on the smoke corpus and
  the shared-representation fixture.

  Two consequences beyond the raw speedup:

  1. **Batch size is now nearly free in time.** D3D runs 69.9 / 66.8 /
     68.8 s at batch 256 / 64 / 8, where before it went 102 s -> 199 s
     from 256 to 64 alone. The memory knob the milestone specifies can
     therefore be turned without buying memory with wall-clock, which
     is what the phase table above appeared to show.
  2. **Share is at the worst point of the old curve.** It pumps at batch
     8 (`DEMAND_EXTRACT_BATCH_SIZE` / `ASYNC_DEMAND_EXTRACT_BATCH_SIZE`),
     so this lands directly on its Geometry stage rather than on a
     wasm-side figure its load log cannot see.

  The D3D batch-8 *before* row is deliberately absent rather than
  extrapolated: at ~8x the batch-64 cost it is a ~25-minute run, and an
  extrapolation printed beside measurements reads as one.

  **The re-extraction tax, and why release is not yet refcounted.** The
  spike's `bounded` phase frees everything a batch created. The
  `data/mapped_shared_representation.ifc` fixture — one
  `IfcRepresentationMap` mapped by two products 15 apart, so any batch
  size from 2 to 15 separates them — was built to test whether that
  loses instances. **It does not**: identical instances and identical
  digests, because the later product simply re-extracts. What it costs
  is that re-extraction, and the fixture prices it exactly (15 assets
  without release, 16 with).

  On real models the tax is large, and it grows as the batch shrinks —
  the opposite direction from the memory it buys:

  | model | batch | assets, no release | assets, naive release | tax |
  | --- | --- | --- | --- | --- |
  | MB-Khaya.ifc | 256 | 7 193 | 9 289 | +29.1 % |
  | MB-Khaya.ifc | 64 | 7 193 | 11 699 | +62.6 % |
  | MB-Khaya.ifc | 32 | 7 193 | 12 653 | +75.9 % |
  | D3D.ifc | 256 | 59 098 | 89 770 | +51.9 % |
  | D3D.ifc | 64 | 59 098 | 106 048 | +79.4 % |
  | PSB.ifc | 256 | 20 511 | 20 779 | +1.3 % |
  | PSB.ifc | 32 | 20 511 | 21 040 | +2.6 % |

  PSB is the wrong model to design this on: at +1.3 % it says naive
  release is free. MB-Khaya and D3D reuse representations heavily and
  pay 30-79 %. Note this is the SAME phenomenon as the +27 % duplication
  round-robin sharding produced (Part 3 below) — shared representation
  geometry rebuilt because whoever needed it was not holding it — so one
  mechanism should address both.

  Open, and next: the policy that keeps the memory without the tax. A
  refcount over `IfcRepresentationMap` usage is one candidate; an LRU
  eviction that fires only when live asset bytes exceed the configured
  budget is another, needs no dependency graph, and is the shape conway
  already uses for chunks (`ChunkedPool`/`SharedAssetPool`). The budget
  cannot be driven off `wasmHeapByteLength` — that heap is grow-only, so
  it never observes a release — so it has to track live asset bytes via
  `GetVertexDataSize`/`GetIndexDataSize`. Which policy wins is a
  measurement the existing harness can run before any engine change.

    **Implementation, second landed piece — a resident-geometry budget
  (2026-08-18).** M3's items 1 and 2, "per-product wasm reclaim" and the
  "budgeted arena", in the production pump rather than a harness.
  `GeometryResidency` (`src/ifc/geometry_residency.ts`) holds an LRU over
  both of a model's geometry stores against a byte ceiling, evicting at
  each batch boundary. Configured at open (`GEOMETRY_BUDGET_MB`) or after
  (`SetGeometryBudget`), and **unlimited by default**, because eviction
  changes a contract: an evicted asset is gone from `GetGeometry` until
  something re-extracts it, which is safe for a consumer that copies
  payloads at delivery (Share#1640) and unsafe for one that fetches
  lazily later.

  **PSB.ifc at batch 8 — the size Share pumps at:**

  | budget | live | wasm peak | delta meshes | geometry |
  | --- | --- | --- | --- | --- |
  | none | — | **1284 MB** | 7 764 | 25.7 s |
  | **64 MB** | 64.0 MB | **298 MB** | 7 764 | **23.6 s** |
  | 256 MB | 256.0 MB | 803 MB | 7 764 | 23.4 s |

  MB-Khaya at batch 64: 102 → 85 MB under an 8 MB budget, and a 32 MB
  budget never binds (live is 17.8 MB). D3D at batch 64: 52.5 s against
  53.1 s unbudgeted, live held at 64.0 MB, 2.8 % more assets rebuilt.
  **This is the memory gate, met on the production path at no wall-clock
  cost** — and note the heap runs 3-4x the live budget, so a 512 MB heap
  target means a budget nearer 128-192 MB. The budget's unit is each
  native's `getAllocationSize` (vertices, triangles, edges, the
  triangle-edge structures, the float vertex mirror), NOT the vertex+index
  payload `calculateGeometrySize` reports; the remaining 3-4x is allocator
  overhead and fragmentation. An earlier version of this section
  attributed the whole gap to overhead, which double-counted structures
  the budget already charges for.

  **Why LRU rather than release-on-emit, decided by measurement.** The
  harness gained an `lru` phase beside `bounded` so the two could be run
  on the same models. Freeing everything a batch created is *correct* —
  see the fixture below — but rebuilds geometry a later product still
  maps: **+62.6 %** assets on MB-Khaya at batch 64, **+79.4 %** on D3D.
  Evicting only what does not fit costs a fraction of that: MB-Khaya at an
  8 MB budget rebuilds **47** assets against 7 193 (**+0.65 %**), and D3D
  at 64 MB rebuilds +2.8 %. Extraction order has enough locality that
  recency predicts reuse, where creation order does not.

  **The bug that eviction exposed, which predates it.** A native geometry
  can be cached under more than one local ID — 1 448 of 23 692 adds on
  D3D, 6 % — and `IfcModelGeometry.delete` freed it unconditionally. So
  evicting one entry left its siblings pointing at freed memory, and
  everything sharing that native re-extracted; a second eviction of the
  same native aborted the load with a `BindingError`. The byte accounting
  had the matching defect, charging per key rather than per native, so a
  budget bound several times tighter than it read. **Residency is
  therefore refcounted on the native object itself**, and the store asks
  before freeing.

  Two things worth keeping from how that was found. It presented as a
  64 MB D3D load still running after an hour against 53 s unbudgeted, and
  the obvious reading — the working set does not fit, LRU is thrashing —
  was wrong: with correct accounting the working set fits in 64 MB
  exactly. A "working-set floor" written to handle that supposed thrash
  never fired on any model, including an absurd 1 MB budget on MB-Khaya
  (38 % more rebuilds, no thrash), and was removed. And the first
  published figures were *flattering* rather than merely wrong —
  MB-Khaya's peak read 71 MB where it is really 85 MB, the difference
  being natives freed while still referenced. **The hazard is not
  specific to the budget**: any mass delete has it, `ReleaseModelGeometry`
  included. Eviction is only the first caller to delete enough entries to
  reach it.

  Pinned by two tests (`ifc_api_deferred_open.test.ts`): a budget binds
  and delivers the same placements as classic, and the default budget-free
  path tracks nothing, frees nothing, and leaves every delivered geometry
  fetchable. Both mutation-verified — disabling eviction on the
  synchronous pump fails the first with `Expected <= 2048, Received
  19440`, which is the bug the first version of this shipped by wiring
  only the async pump.

  **Still open in M3 after this:** evict/refill under *navigation* (this
  measures a drain-once pass; the chunk region exists for churn, where a
  general allocator fragments), viewport-ordered materialisation (the
  pump extracts in file order), and the time-to-first-pixel gate itself.

    **This clears M3's memory gate on PSB** — "steady-state wasm heap
  under a configured budget (e.g. 512 MB) with the full model
  navigable" — with room to spare, and *without* the dedicated chunk
  region. That does not retire the chunk region: this measures a single
  drain-once pass, and the region exists for what happens under
  evict/refill *churn*, where a general allocator fragments and never
  gives the pages back. But the ordering changes — the pump discipline
  alone reaches the gate, and the region is what keeps it there.

  (An earlier version of this section reported 840 MB and 727 MB for
  these two rows and concluded batch size was not a lever. Both figures
  were inflated by the harness's leaked `GetGeometry` clones, which
  accumulated with the number of geometries rather than with the batch
  and so masked the batch's effect entirely.)

  **Release did not break delivery anywhere in the smoke corpus.** With
  every instance's product, geometry, transform, colour and
  `occurrencePath` hashed, and **every delivered vertex and index byte
  fed to SHA-256** (at report time, so it costs the timings nothing —
  and over raw bytes rather than quantised values, so a small
  tessellation change cannot land in the same bucket; two runs that
  deliver different geometry agreeing would require a SHA-256
  collision, which is the honest bound — an earlier 32-bit rolling hash
  could not support the "cannot compare equal" wording this paragraph
  used to carry), `bounded` is identical to `classic` on 11 of
  12 models — same instances, same payloads, same placement — and
  identical to **`copyout` on all 12**, with each run also asserting
  that release actually happened (every copied geometry freed — a
  release path that threw would otherwise produce the same agreement
  while releasing nothing). That second comparison is the
  one the release policy rests on: `copyout` and `bounded` run the same
  deferred extraction and differ *only* in that `bounded` releases, so
  agreement means release changed nothing, while checking each against
  `classic` alone cannot tell — on the one model where the deferred path
  itself diverges, a release regression would hide inside a difference
  that is already expected. So the corpus provides **no evidence that
  per-batch release changes what a consumer receives**, which is the M3
  invariant, and the 342 MB / 84 MB rows are a real result rather than
  one bought by dropping geometry.

  An earlier version of this section claimed the opposite — that
  retain-nothing delivered 169 instances against 101 on `supercap.step`,
  making retention a *measured* correctness prerequisite. That figure
  came from a stale harness state and does not reproduce. Retracted.

  **Retention is still required, but as a design argument, not a
  measured one.** The mechanism is unchanged and real: the scene walk
  resolves geometry through `model.geometry.getByLocalID` and skips what
  it cannot find, so releasing an asset a later product shares makes
  that product miss the cache and re-extract, appending duplicate scene
  nodes — and `streamNewMeshes_`'s *positional* per-entity watermarks
  cannot survive an entry vanishing from the sequence they index. This
  corpus simply never triggers it at batch 64: shared geometry is copied
  and released within the same batch that emits all of its instances.
  A model that instances one definition across widely separated products
  would, and finding or building that fixture is the next thing this
  harness needs. The shippable policy is unchanged —
  refcount-on-asset (`SharedAssetPool`, already written) plus an
  **asset-keyed delta capture**, which also deletes the pump's
  O(batches × scene) re-walk — but it is now justified by the code path
  rather than by a number.

  **The 12th model exposes something else, and it is a production bug.**
  On `supercap.step` (AP214) the *deferred pump itself* diverges from
  the classic walk before any release is involved: `ExtractGeometryBatch`
  delivers **21 instances over 2 geometries** where `StreamAllMeshes`
  delivers **101 over 6**. `copyout` — which releases nothing — diverges
  exactly as `bounded` does, so release is not implicated. It is
  deterministic across runs, reproduces before this branch merged M2,
  and reproduces with the harness's native-clone handling removed. Since
  the deferred pump is the path Share's demand/tiled rendering runs, an
  AP214 assembly losing four fifths of its placed instances there is a
  correctness bug in the production path, tracked separately from M3.

  **The worker pool is a live lever, and the MT result never tested it
  (measured 2026-08-18).** Two different parallelism axes were being
  conflated. What conway-geom#148 measured is *pthreads inside one wasm
  instance*: the C++ pool splits work **within** a product's
  tessellation, on a **shared** heap, fed by **one serial JS driver** —
  and its three suspects (main-thread `Atomics.wait` busy-spin,
  `memory.grow` stalling every thread, pool oversubscription) are all
  properties of that shape. What this doc's "Parallelism / multi-core"
  section actually specifies is the other axis: N workers, each with its
  **own** instance and heap and driver, pulling **disjoint products**.
  Every one of those suspects is structurally absent there — separate
  linear memories, and a worker may legally block — and #148's own
  listed fix is "run extraction in a dedicated worker".

  Measured by sharding the product worklist round-robin across N
  independent processes (own instance, own heap, own driver — a worker
  minus the postMessage plumbing), single-threaded wasm so one worker
  means one core, on a 4-core box:

  | model | N=1 | N=2 | N=3 | N=4 | total CPU N=1 → N=4 |
  | --- | --- | --- | --- | --- | --- |
  | **PSB.ifc** geometry | 23.1 s | 12.6 s (1.84×) | 9.8 s (2.37×) | **8.9 s (2.59×)** | 30.5 s → 35.2 s (+15 %) |
  | **MB-Khaya.ifc** geometry | 4.0 s | 2.9 s (1.37×) | 2.8 s (1.41×) | 2.9 s (1.39×) | 7.2 s → 10.1 s (+40 %) |

  **PSB scales.** 2.59× on 4 cores is 86 % of what this box can give:
  one extraction process already burns 1.32 cores (main thread plus V8
  GC/JIT — the allocation-heavy JS driver's own tax), which caps the
  achievable speedup at 4 / 1.32 ≈ 3.0×. Per-worker wasm peak also falls
  with N (1283 → 364 MB), so sharding is a **memory** lever as well as a
  time one, and it composes with the bounded pump rather than competing.

  **MB-Khaya does not**, and the reason is visible in the CPU column
  rather than the wall-clock: sharding it costs +40 % total CPU against
  PSB's +15 %. A small model that reuses representations heavily has
  products that are *not* independent — round-robin scatters shared
  geometry across every shard and each one re-extracts it. Contiguous
  sharding, which preserves file-order locality, duplicates less and
  scales better (1.52× vs 1.39×).

  **The partition wants affinity by shared asset**, not by product — the
  same definition/occurrence boundary `SharedAssetPool` draws for
  retention. One boundary, two payoffs. Measured rather than assumed:
  `scripts/m3_affinity_spike.mjs` captures the real product↔asset graph
  (one instrumented extraction pass recording, per product, which assets
  it created, which it reused, and how long it took), replays candidate
  partitions against it, and can emit any of them as per-shard product
  lists so the **real extractor** runs the partition the simulation
  scored.

  **MB-Khaya, N=4, single-threaded shards, against a one-shard baseline
  of 4.3 s / 7.5 s CPU / 6851 assets:**

  | partition | geometry | total CPU | assets created |
  | --- | --- | --- | --- |
  | round-robin | 3.2 s | 11.2 s | 8678 (**+27 %**) |
  | affinity — hash the product's primary asset | 2.3 s | **7.5 s** | **6851** (+0 %) |
  | claim — first worker to touch an asset owns it | **2.2 s** | 7.8 s | **6851** (+0 %) |

  Both asset-aware partitions eliminate the duplication **completely**:
  four shards create exactly the assets one shard does, and total CPU
  returns to the serial baseline, so nothing is wasted. The wall-clock
  follows — 2.2 s against round-robin's 3.2 s at the same shard count,
  which is 1.95× against the serial baseline where round-robin manages
  1.34×. Per-worker wasm peak drops too (83 → 33 MB), because a shard
  that doesn't re-extract shared geometry doesn't hold it either.

  **What this validates, precisely: a precomputed partition.** Both
  strategies are scored and emitted *offline*, from a captured graph
  that already knows every product's created/reused assets and its
  measured cost before anything is dispatched. That is an oracle. It
  establishes the ceiling — the duplication is entirely addressable by
  placement, and asset-aware placement reaches the serial CPU floor —
  but it is not yet a scheduler.

  **What it does not validate: an online first-touch rule.** A live
  worker cannot know that a pending product follows an existing owner
  until it has discovered that product's assets, and discovering them by
  extracting is exactly the duplication the rule exists to avoid. So
  "first worker to touch an asset owns it" needs a **dispatch-time key**
  — something derivable from the index without extracting, i.e. the
  product's representation / mapped-source ID read straight from the
  columns. That key is cheap and it is the natural candidate; whether it
  partitions as well as the oracle is the next measurement, not a
  settled result. Until it is taken, the honest statement is: asset
  affinity is worth ~27 % of CPU and ~1.5× of wall-clock on a
  representation-heavy model, and an online scheduler that approximates
  it is the thing to design.

  Three caveats the numbers carry. The partition table above was
  produced twice, and the first version was wrong in two ways worth
  recording rather than quietly fixing. It reported that neither
  asset-aware partition changed anything — because the harness's
  assignment path had been dropped in an unrelated edit, so every
  "partition" was silently running round-robin; the tell was two
  different partitions producing *byte-identical* asset counts. And the
  sweep's own N=1 row, when an assignment was active, handed the
  baseline child one shard's products while treating it as the whole
  model, so the ratios those runs printed were nonsense (the published
  figures came from a separate unassigned baseline, which is the only
  reason the conclusion survived). Both are fixed; the lesson is the one
  this file keeps relearning, that a measurement which cannot fail is
  not a measurement. Each shard also pays its own parse here, so
  only the geometry phase is comparable; the shipping design parses once
  and hands workers transferable index columns, which is exactly what
  M2/M7's columns-from-birth index made possible (before it, sharding
  meant shipping an object-form index or letting the event stream
  schedule). Even so, end-to-end wall with four redundant parses still
  falls 39.4 s → 26.9 s. And a 4-core box cannot answer how this scales
  at 8–16 cores; it can only show the axis is real.

  **What a shard claim refused, and why both refusals are now lifted.**
  The first shipping pool (conway#536) accepted a shard only on a
  resident source with `COORDINATE_TO_ORIGIN` off. Neither restriction
  was arbitrary, and neither survived contact with Share: Share opens
  through `OpenModelStream` over OPFS — windowed — and it recentres. The
  pool was therefore correct, tested, and unable to serve the one
  consumer it exists for.

  - **Windowed sources.** The dispatch key walks attribute records
    (`product.Representation → Representations → Items → MappingSource`),
    and on a windowed source whether a hop resolves depends on which
    chunks *that worker* holds. A worker short of a page fell back to the
    product's own local ID, so two workers computed different keys for
    one product — and the modulo then selected it twice or not at all.
    That is not weaker affinity, it is a broken partition, and a union
    check over resident buffers cannot see it. The fix is to make the key
    a function of the *file*: `computeDispatchKeys` pages the walk's own
    closure — four hops, in pinned waves — before evaluating it, so every
    worker reads the same bytes. Attribute failures still take the
    documented fallback (every worker sees those); a **non-resident read
    now propagates** instead of being swallowed, because a fallback taken
    for a paging accident is the exact silent disagreement being removed.
  - **`COORDINATE_TO_ORIGIN`.** The recentre anchor comes from the first
    geometry an instance captures, so N workers derive N frames. The fix
    is to stop deriving: `SetCoordinationFrame` makes the frame an
    *input*. A coordinator derives it once — Share's parse-time preview
    channel already does, and `GetAppliedCoordinationMatrix` reports it —
    and hands the same matrix to every worker. A supplied frame is final:
    the adopted-preview revalidation is disabled under it, since a worker
    that re-derived would silently leave the frame its siblings still use.

  Worth recording how nearly the test for the second one measured
  nothing. Recentring **snaps to a 1 km grid** (`COORDINATION_SNAP_M`),
  so shards whose first products sit tens of metres apart quantize to the
  *same* frame and agree by accident — a per-shard anchor is observable
  only on a model spanning more than one cell, which is what the original
  refusal said and what no fixture in `data/` provided. Against
  `index_georeferenced.ifc` the union test passed with the fix reverted.
  `data/index_georeferenced_multicell.ifc` (the same model, its seven
  products spread 4 km apart) is what makes it fail, and the test asserts
  that span rather than trusting it.

  Scope moved out by measurement rather than by preference:
  **demand ordering** (Share-side
  priority into a queue that exists; does not gate the memory result),
  and the **per-product native free blocker** (`IfcModelGeometry.delete`
  already frees the native, and freeing into the general heap returns ~0
  RSS — the missing piece was policy and retention, never a C++
  surface). The time-to-first-pixel exit criterion predates the
  streaming preview channel and is re-aimed at the preview→durable
  handover, tracked Share-side.
- **M4 — Range ByteSource + index sidecar.** S2. Exit: second visit to a
  remote PSB with sidecar reaches first pixel without fetching > 10 % of
  the file; property panel opens with < 1 MB fetched.
  - **M4a — sidecar + range source (engine core, landed).** A
    version-stamped binary sidecar (`index_sidecar.ts`) serialises the
    top-level SoA columns (address / length / typeID / expressID,
    column-major) with a source-length + hash header; deserialise
    reconstructs the entity index byte-identically (round-trip test vs a
    resident parse of `index.ifc`). The sidecar is a **cache, not an
    interchange format** — `sidecarMatchesSource` gates trust on the
    hash+length handshake and falls back to a cold scan on any mismatch
    (the placeholder FNV-1a hash swaps for SHA-256 as a version bump, not
    a reshape). Inline / multi-mapping children were a v2 extension —
    **since delivered, see M4c.**
    `RangeByteSource` (a `StepExternalByteStore`) models an HTTP-Range /
    block store: it returns exactly the requested bytes while accounting
    for the wider block-aligned fetch it would really incur, so
    index-first open can read back from `stats` how little of the file it
    touched. *Remaining for M4b: the OPFS/HTTP sidecar cache round-trip in
    Share and the wired index-first open path over `RangeByteSource`.*
  - **M4c — sidecar v2 + open-from-index (engine core, landed; conway#541).**
    Two things, and the first is a correctness fix rather than a feature.

    **v2 carries the whole index**, `[0, count)`, not just the top-level
    range: the inline-entity range and the multi-mapping holders too. What
    v1 dropped was not exotic — inline entities are ordinary typed values
    written inside an attribute list, and a restored model's
    `inlineAddressMap_` was empty, so `StepEntityBase.extractReference`
    resolved every one of them to `null` under the default `nullOnErrors`.
    Measured share of the index: MB-Khaya 0.274 %, PSB 0.594 %, DOWA
    5.414 %, **D3D 20.995 % (720,661 rows)** — a 77× spread across
    exporters, so whether v1 was safe depended on who wrote the file. The
    symptom is surface styles, transparency and measure-valued attributes
    quietly degrading on a model that otherwise loads and looks right.
    `complexEntries` is 0 on every corpus model, so v1's own framing
    (multi-mapping holders) was watching the right column for the wrong
    risk. v1 blobs are rejected by version, never reinterpreted. Two
    smaller repairs ride along: `address` is stored as u32 to match the
    `Uint32Array` column it restores into (v1 wrote f64 and truncated in
    silence above 4 GiB — now a throw at both ends), and
    `sidecarMatchesSource` takes a structural `SidecarSourceIdentity` so
    the columns path reaches it without the `as any` the repo's own test
    used to need.

    **`openIfcModelFromIndex` / `IfcAPI.OpenModelFromIndex`** consume that
    index instead of building one. The seam is narrow by construction:
    everything after the columns — `WindowedStepBufferProvider` →
    `IfcStepModel` → demand prep → extraction — is index-agnostic and is
    now literally one shared body (`IfcApiProxyIfc.finishWindowedOpen`).
    The header comes off the same bounded 64 KiB prefix the store open
    already reads for format detection, so the load report's `Model` line
    stays real on this path. There is **no internal cold-parse fallback**:
    `OpenModelFromIndex` returns `-1` and the caller falls back to
    `OpenModelStream` explicitly, because silently re-parsing would spend
    exactly the cost the call exists to avoid and make a stale index
    invisible. An index-first open has no live parse, so it has no preview
    channel and no derived coordination frame — fine for a worker, which
    takes the coordinator's via `SetCoordinationFrame`, and the reason
    index-first must not silently become the coordinator's own path.

    **The trust gate has two halves now**, because one full verify per
    consumer is the N-way I/O a shared index exists to remove.
    `HashingByteSource` folds the digest into the parse's own window pass
    — `src/indexing/hashing.ts`'s `fnv1a` is range-scoped and resumable
    with the same basis and prime, so chaining it reproduces `hashSource`
    byte for byte at zero extra I/O — and consumers check `byteLength`
    alone (`sidecarMatchesSourceLength`). Full verification stays for the
    revisit case behind `VERIFY_INDEX_SOURCE_HASH`, where a persisted
    sidecar really may describe a file that has since changed.
- **M5 — Federation MVP.** Two cross-referenced files, shared budgets,
  link navigation, composed skeleton. Exit: a 2-file project browses
  under the same memory budget as either file alone.
  - **M5a — addressing + registry + composition (engine core, landed).**
    The addressing spine and the cross-file read side, all engine-side
    and pure TS. `model_uri.ts` — the universal `modelURI#expressID`
    {@link EntityAddress}, with format/parse and relative-reference
    resolution (an `IfcExternalReference.Location` like `../shared/grid.ifc`
    resolves against the containing model's URI). `shared_byte_budget.ts` —
    the **per-browser** `SharedByteBudget` every model's queue/pool draws
    from, so N federated files stay bounded (reserve/release/`overageFor`);
    this is the invariant that keeps federation from re-growing memory
    O(N). `model_registry.ts` — `ModelRegistry` keying open models by URI
    and resolving an address to `(model, expressID)` (an unregistered URI
    is the cue to open a sibling loader). `cross_reference_registry.ts` —
    a streaming consumer that collects a model's outbound reference
    entities (`IfcExternalReference` subtype closure) via the M2
    dispatcher, then resolves their `Location`s into navigable
    `CrossReferenceLink`s once readable (two-phase: identify while
    parsing, resolve on demand — the event stream carries IDs, not
    attribute strings). `composed_model_skeleton.ts` — `ComposedModelSkeleton`
    fans a type query across every registered model and yields universal
    addresses, so "every `IfcWall` in the project" spans files. *Remaining
    for M5b: register streamed models here from the loader, wire the
    shared budget into M3's `DemandGeometryQueue`, merge cross-file spatial
    containment, and the UI link layer.*

M0–M2 are conway-internal and regression-gated (byte-identical index and
GLB output are the invariants CI already checks). M3 changes *when* work
happens, not *what* it produces — the per-product mesh digests must stay
identical, which keeps the visual-diff harness authoritative. M4/M5 add
new surface and need new test rigs (range-request mock server; two-file
fixture project).

### Landed engine-core stack (for sequential review)

The whole sequence is up as a **stack of PRs**, each branch based on the
previous, each a self-contained tested increment — reviewable and mergeable
in order. Every part is engine-side and pure TS (no wasm, no Share
dependency), so each rests on the invariants CI already enforces; the
subsystem-coupled halves (the `Xb` items above) are scoped and deferred,
not stubbed:

| Milestone | Landed core | Deferred (subsystem-coupled) |
|-----------|-------------|------------------------------|
| **M0** | streaming window parse, byte-identical index | — |
| **M1a** | `parseStreamToModel` (windowed-source model) | M1b: Share OPFS worker |
| **M2a** | record events + type-set dispatcher | — |
| **M2b** | incremental type index | multi-mapping (typeID 0) attribution |
| **M3** | demand-geometry queue (budget + eviction); chunked tile pool + refcounted assets (`src/core/mem/`) | conway-geom C++ tile-pool twin (surface narrowed — see "Resident memory: two regimes") |
| **M4a** | index sidecar + `RangeByteSource` | M4b: Share sidecar cache + index-first open |
| **M5a** | model-URI, shared budget, registry, cross-ref, composition | M5b: loader registration, budget wiring, UI links |
| **M7** | columns-first index build (no object phase); sidecar ⇄ columns identity | resident `parseDataToModel` still object-form (unchanged by design — CI byte-parity anchor) |
| **Phase B** | wasm tile-pool bindings typing + `createWasmTileBackend` (TS accounting over the physical pool, budgets mirrored) + `DemandResidencyPump` (async `ensureResident` → sync extract admission) + segment-walk payload reader | B2: `TileAssetExtractor` over the real extraction pipeline (per-product wasm extract → `commitGeometryTile`); Phase C: Share camera priorities + GPU upload/dispose |

**M7 — columns-first index (landed).** The corpus sweep exposed the last
structural memory problem on the parse plane: the streamed build still
materialised the index as one JS object per record (~90 B each) before the
model compacted them to SoA columns — ~1 GB of transient objects on a
PSB-class file to produce ~200 MB of columns. M7 gives the parser an
optional `StepIndexSink`; `ColumnarIndexSink` encodes each completed
top-level record **straight into chunked-segment typed-array columns**
(the rare records with inline children / multi-mappings keep their object
form, exactly the set the model retains today), and `StepModelBase` /
`StepTypeIndexer` gained from-columns construction that adopts the
columns without any object walk. `parseStreamToModel` now uses this path.
Parity is pinned test-for-test against the object path — byte-identical
internal columns and type index on IFC and on AP214 inline/multi-mapping
fixtures. The sidecar converged with the in-memory layout: serialize
reads columns directly (blob byte-identical to the object-form
serializer) and `deserializeIndexSidecarToColumns` restores columns with
**no per-record objects anywhere between sidecar bytes and a constructed
model** — the zero-rebuild index-first open. Sweep (retained heap, GC'd):
Arty 90.6 → 44.5 MB, Schependomlaan 107.6 → 32.5 MB vs the object-streamed
path; columnar is also the fastest build on Arty. Extrapolated PSB-class:
index build working set drops from ~1 GB to roughly the columns
themselves (~200 MB).

The recurring shape: **settle the deterministic engine policy against a
mock/synthetic backend now, so the queue/format/addressing is correct and
reviewable independently of the wasm and Share work it will later drive.**
The two named blockers on the critical path are the conway-geom
per-product native reclaim (gates M3's production `GeometryTiles`) and the
Share OPFS/HTTP integration (gates M1b/M4b).

## Key design decisions (settled with Pablo, 2026-07)

1. **Lexer stays TS/JS.** ✓ Decided — primarily for ease of working in
   TS with the schemas we generate from EXPRESS + antlr; the generated
   type/query machinery is TS-native and the lexer has never been the
   bottleneck. Long-term a C++ lexer remains possible (S1/S2 might
   motivate it) but is explicitly not this arc.
2. **Workers for everything.** ✓ Decided — main thread is already
   overloaded and is reserved for UI. Staged as necessary: parse/index
   worker lands with M1 (the OPFS sync-access handle requires it),
   geometry worker pool with M3. See "Parallelism / multi-core" above.
   Main-thread cooperative driver survives for node/tests only.
3. **Eviction unit = product.** ✓ Decided — the natural IFC unit, and
   deliberately the same unit as **editing** (see "Toward editing"
   below): the boundary where referential integrity is strongest should
   be the boundary for both eviction and CRUD. Tiles can composite
   products later if draw-call/eviction overhead demands.
4. **Sidecar format**: ✓ version-stamped, little-endian typed-array dump
   of the SoA columns + serialized MultiIndexSet + skeleton + roots +
   extern refs, gzip'd. Explicitly *not* a public interchange format at
   first — it's a cache with a hash handshake; stabilise it once
   exporters care.
5. **Multi-mapped/complex records** (the AP214 multibody work, #376):
   ✓ record events carry localID + mapping, and consumers must tolerate
   one-address-many-entities — the same contract `expressIDsOfTypes`
   documents. Baked into the event payload from day one.
6. **Resident geometry = explicit chunked pool, not per-product `free()`.**
   ✓ Decided 2026-07-19 — see "Resident memory: two regimes" below. This
   resolves the M3 blocker's allocation question and narrows the
   conway-geom C++ surface to a small tile pool.


## Resident memory: two regimes (settled with Pablo, 2026-07-19)

The M3 blocker ("conway-geom needs a per-product native free") hid an
allocation-policy question: free *into what*? The answer decides whether
eviction actually returns memory.

**Why the general allocator is the wrong tool here.** Wasm linear memory
grows and never shrinks — `free()` returns bytes to mimalloc's freelists,
not to the browser, and there is no page decommit (`madvise`/decommit are
native-allocator tools wasm doesn't have; `memory.discard` isn't shipped).
So the tab pays the heap's **high-water mark forever**, and external
fragmentation under evict/refill churn isn't a throughput nuisance, it's a
permanent leak: one live allocation above a sea of freed tile space keeps
it all committed. Per-product `free()` into the general heap — the "modern
allocators are good now" answer that works natively — fails here.

**The two regimes.** Geometry memory has two structured flows with
different lifetime shapes, and each gets the allocator that matches:

- **Phase-bounded scratch** (tessellation temporaries): lives for one
  product's extraction, dies at commit. Already engineered: the AFTP
  per-thread bump arenas with chunked growth and exact-size commits.
  Bump/reset, never freed piecemeal. Unchanged by this design.
- **Demand-bounded residents** (committed tiles, alive until evicted):
  lifetime is driven by the viewport, unbounded and interleaved — the
  regime where pools historically break down and people punt to malloc.
  Instead: **one dedicated region carved into fixed-size chunks**
  (order 256 KB–1 MB) with a freelist. Commit copies exact-size results
  from the scratch arena into acquired chunks (the copy already exists —
  AFTP phase 2 — just redirected); evict pushes chunks back. High-water
  mark **is the budget by construction**; fragmentation reduces to
  bounded internal waste in each asset's last chunk.

The general allocator keeps only the residual it is actually good at:
small, messy-lifetime control structures. Engineer the 95 % with
structure; punt the 5 % without.

**The abstraction ladder (`src/core/mem/`).** This is high-value code
we expect to reuse (property caches, sidecar caches, texture-like data),
so the system is layered general → narrow, with the general layers kept
deliberately domain-free:

    ChunkedPool        chunks and bytes: budget, freelist, chunk-rounding
    SharedAssetPool    refcounted *assets* resident in those chunks
    GeometryTilePool   the geometry narrowing (src/core/): products ⇄ assets
    DemandGeometryQueue  demand ordering + logical budget (M3, unchanged)

The **instance ⇄ asset** relationship in `SharedAssetPool` is the general
form of product ⇄ representation (the definition/occurrence split that
recurs across CAD — AP214 literally says "occurrence"). Storage is keyed
and refcounted on the asset, so the mapped-item correctness rule holds
structurally: evicting product A can never free the representation
product B still renders; chunks return only on the last release.

**Accounting: two views, one invariant.** The queue charges each
instance the full chunk-rounded cost of every asset it references
(sharing double-charged — deliberately conservative), while the pool
counts physical chunks (shared assets stored once). Summed logical
charges therefore always cover physical use, so with queue budget ≤ pool
budget an acquire can never fail mid-extract — an invariant the composed
tests pin. Heavy sharing under-utilises the logical budget; widen it
once measured, safe direction first.

**The narrowed C++ surface (conway-geom).** What M3 production actually
needs from wasm shrinks to a mechanical tile pool mirroring the TS spec:
`tilePool.init(budgetBytes, chunkBytes)` /
`commitTile(assetID, scratchPtr, byteSize) → chunks` /
`retainTile(assetID)` / `releaseTile(assetID)` — plus the existing
extract-into-scratch. No allocator surgery, no arena changes. The TS
classes are the executable spec and policy layer; the C++ twin owns the
bytes. GPU-side buffers (three.js) are outside the wasm heap and already
reclaim on delete — the grow-only trap this design defuses is wasm-side
specifically.


## Toward editing: product-level CRUD

Read-mostly, not read-only. The browser architecture should *contemplate*
editing from the start, because the right edit unit is the same product
boundary the demand/eviction system is built on — where referential
integrity is strongest. Scoping posture (design constraints now,
implementation a later arc):

- **Unit of edit = product**, with **cut/copy/paste as the primitive
  semantics**. Cut/copy is the read side: extract a product's closure
  (the entity subgraph it owns — representation, placement, psets)
  *minus* shared resources (materials, profiles, contexts), which are
  referenced, not copied — the same ownership analysis the props capture
  already does with `GEOMETRIC_FIELD_NAMES` and the ref-closure walk.
  Paste/delete is the write side: **unlinking** a product means editing
  the small set of relationship records that point at it
  (`IfcRelContainedInSpatialStructure`, `IfcRelAggregates`,
  `IfcRelDefines*`), not touching the bulk.
- **Edits are an overlay, not a rewrite.** The source bytes stay
  immutable (they may be remote, range-fetched, shared); the index gains
  a mutable overlay: tombstones for deleted/unlinked records, an append
  journal for new/modified records (new express IDs from a reserved
  range), and patched relationship rows. Every reader (events, demand
  queue, props) sees index ∘ overlay. This composes with everything
  above — sidecars describe the base file; overlays are per-session (or
  per-user, persisted like the GLB cache) and are what a future sync
  layer would exchange.
- **Federation makes this natural**: paste-across-models is the same
  operation as paste-within — copy a closure, rebind shared-resource
  references to the target model's equivalents (or import them), link
  into the target's spatial structure. The model-URI + expressID
  addressing already names both ends.
- **Serialisation back to STEP** (materialising base + overlay as a new
  file) is the eventual export path; it's append-friendly by
  construction since STEP records are independent lines. Full-fidelity
  round-trip of *unmodified* regions is trivially exact — they're the
  original bytes.

## Non-goals

- Replacing the GLB cache path — it remains the fast revisit path; tiles
  extend it rather than replace it.
- *Implementing* editing in this arc. But NOT read-only-forever: the
  architecture must support product-level CRUD via the index overlay
  (see "Toward editing") — decisions in M0–M5 that would preclude the
  overlay (e.g. assuming the index is immutable, or that express IDs are
  dense) are bugs against this doc. Whole-file STEP re-serialisation is
  deferred to the editing arc as its export step.
- A generic HDF5 driver now — S2's design keeps the door open (range
  reads + chunk index are HDF5-shaped); implementation waits for a real
  corpus.
- Draco/meshopt — orthogonal geometry-bytes lever, tracked Share-side.

## Risks

- **Straddle/carry correctness** in the chunked lexer — mitigated by M0's
  byte-identical-index exit gate over the full regression corpus.
- **Per-product wasm reclaim** may fight mimalloc arena assumptions from
  the AFTP work — that's why M2 front-loads the conway-geom API scoping.
- **Demand-driven rendering changes UX semantics** (things pop in). The
  names skeleton arriving first (M2) is the mitigation: structure renders
  instantly, geometry streams into it — the "browser" feel, made honest.
- **Sidecar staleness/poisoning** — hash handshake + fall-back-to-scan;
  never trust a sidecar over the bytes.


## Cross-references

- Residency primitives: `design/new/memory-residency.md`
- Allocator/wasm-heap arc: `design/new/emsdk-upgrade-scalable-allocator.md`
- STEP support & regression gates: `design/new/step-support.md`,
  `design/new/step-regression.md`
- Compat surface these APIs land on: `design/new/web-ifc-compat-surface.md`
- Share consumers & product goals: [Share `design/new/lazy-properties-memory.md`](https://github.com/bldrs-ai/Share/blob/main/design/new/lazy-properties-memory.md)


## Status addendum — 2026-07-21 (post-launch + browser-MT spike)

**Shipped and launched.** The parse/index plane (M0–M2, M4, M7) and the
demand machinery (M3, mem system, C++ TilePool + bindings, per-product
extraction seam, `IfcTileAssetExtractor`, residency pump) are merged and
released. Share consumes the streamed columnar open in production
(default-on `OpenModelStreamed` via the compat shim, `disableStreamOpen`
revert). Packaging landed as plane namespaces —
`@bldrs-ai/conway/stream`, `/demand`, `/mem` — with the shim reframed as
a retiring adapter. PSB (860 MB, 9.7 M records) measured on the shipped
path: parse 13.4 s / +376 MB where the object phase used to blow up the
heap; whole clean-tab load 52.6 s.

**Browser-MT finding (Share #1610, conway-geom #148).** The assumption
that flipping cross-origin isolation would buy ~2.8× on load-time
geometry is refuted for the browser: profiled on PSB, that phase is
~75 % serial JS extraction driver (record deserialization, parameter
marshalling, dedup hashing) — the wasm the pthread pool can parallelize
is a minority slice — and the MT build pays a ~35 % main-thread tax,
netting zero-to-negative on real machines. Node/CLI keeps a ~1.5× MT
win. Isolation infrastructure is proven and parked (Share #1612).

**Consequence — milestone reordering.** Demand-driven, budgeted
extraction (this doc's M3 plane consumed by the renderer) is promoted
from memory work to the primary *performance* milestone: it deletes
load-time whole-model extraction and the merged-geometry build instead
of accelerating them. Revised order: (1) demand/tiled rendering in
Share; (2) OPFS-windowed open from birth (needs the cooperative native
open, #420); (3) JS extraction-driver shrink (conway-geom #148);
(4) sidecar revisit path; (5) extraction off the main thread;
(6) revisit browser MT/isolation after (3)/(5).

**Parse-time preview channel (slice A2).** Durable extraction cannot
run mid-parse: relationship records (rel-voids, rel-materials, styled
items) extend to ~92–97 % of real files' depth, so any prefix
extraction can miss openings/materials. The shipped design accepts
that: `ColumnarIndexSink.snapshot()` produces prefix columns between
the cooperative parse's yields, and a `StreamedPreviewChannel`
(deferred opens with `ON_PREVIEW_MESH`) builds throwaway prefix
models/extractions in growing generations, emitting self-contained,
byte-capped payload copies — first meshes within the first second of a
large parse (measured: 583 ms into Schependomlaan's 1.2 s parse). The
post-parse durable pump re-extracts everything and replaces the
preview, so final parity is untouched; the channel pins the
coordination frame the pump then adopts.
