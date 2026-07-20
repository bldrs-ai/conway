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
2. **Grow-only wasm geometry heap.** ~2 GB on PSB at steady state.
   Geometry is extracted eagerly for the whole model and stays resident in
   the wasm heap even after the GLB/scene is built.
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
- **Type index** (today's `MultiIndexSet`, built incrementally instead of
  at end of parse).
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
  subscription; type index, names skeleton, roots registry, header become
  incremental consumers; `ON_MODEL_INFO` fires from first window. Exit:
  spatial tree UI populates while PSB still parsing; props capture works
  pre-geometry. (First task: scope conway-geom per-product native
  geometry free — it gates M3.)
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
  - **M2b — standard consumers (next).** Incremental type index
    (multi-mapping-aware), spatial names skeleton, property-roots + header
    consumers; wire `ON_MODEL_INFO` from the first window. This is where
    the "spatial tree populates while parsing" exit criterion lands, plus
    the conway-geom per-product-free scoping that gates M3.
- **M3 — Demand-driven geometry.** Work queue + budgeted arena +
  per-product wasm reclaim; load-time progressive materialisation
  (viewport-ordered). Exit: PSB time-to-first-pixel < 25 % of full-load
  time; steady-state wasm heap under a configured budget (e.g. 512 MB)
  with the full model *navigable* (tiles fill/evict on demand).
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
    a reshape). Inline / multi-mapping children are a v2 extension
    (`hasChildren` flags the records the v1 format under-describes).
    `RangeByteSource` (a `StepExternalByteStore`) models an HTTP-Range /
    block store: it returns exactly the requested bytes while accounting
    for the wider block-aligned fetch it would really incur, so
    index-first open can read back from `stats` how little of the file it
    touched. *Remaining for M4b: the OPFS/HTTP sidecar cache round-trip in
    Share and the wired index-first open path over `RangeByteSource`.*
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
