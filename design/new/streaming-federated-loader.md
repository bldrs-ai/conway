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

- **M0 — Streaming-input spike (go/no-go).** Feed
  `parseDataBlockIncremental` from a moving window over a `ByteSource`
  with straddle carry; parse SKYLARK + PSB from a stream with a 64 MB
  pool. Exit: identical index columns (byte-for-byte vs. buffer parse) on
  the corpus; peak JS heap during PSB parse < index + pool + slack. No
  API changes.
- **M1 — Write-through open path.** `OpenModelStream(source)` in the shim:
  stream → OPFS write-through → windowed provider from t=0; delete the
  post-parse spill step in Share. Exit: PSB opens with no full-source
  moment (heap-snapshot verified); regression corpus byte-identical.
- **M2 — Record events + incremental consumers.** Event bus with type-set
  subscription; type index, names skeleton, roots registry, header become
  incremental consumers; `ON_MODEL_INFO` fires from first window. Exit:
  spatial tree UI populates while PSB still parsing; props capture works
  pre-geometry. (First task: scope conway-geom per-product native
  geometry free — it gates M3.)
- **M3 — Demand-driven geometry.** Work queue + budgeted arena +
  per-product wasm reclaim; load-time progressive materialisation
  (viewport-ordered). Exit: PSB time-to-first-pixel < 25 % of full-load
  time; steady-state wasm heap under a configured budget (e.g. 512 MB)
  with the full model *navigable* (tiles fill/evict on demand).
- **M4 — Range ByteSource + index sidecar.** S2. Exit: second visit to a
  remote PSB with sidecar reaches first pixel without fetching > 10 % of
  the file; property panel opens with < 1 MB fetched.
- **M5 — Federation MVP.** Two cross-referenced files, shared budgets,
  link navigation, composed skeleton. Exit: a 2-file project browses
  under the same memory budget as either file alone.

M0–M2 are conway-internal and regression-gated (byte-identical index and
GLB output are the invariants CI already checks). M3 changes *when* work
happens, not *what* it produces — the per-product mesh digests must stay
identical, which keeps the visual-diff harness authoritative. M4/M5 add
new surface and need new test rigs (range-request mock server; two-file
fixture project).

## Key design decisions to settle early

1. **Where does the lexer live?** Today JS. Streaming doesn't change
   that, but S1/S2 tempt a wasm lexer. Decision: keep JS through M2
   (generator machinery + progress plumbing already there, and the lexer
   has never been the bottleneck); revisit with profiles after M3.
2. **Worker placement.** Parse+index on a worker with the byte store, or
   on-main with cooperative yields (today's model)? The scheduling.js
   throttling lesson says: background-tab robustness favors a worker;
   OPFS sync-access handles *require* a worker. Lean worker-first for the
   M1 open path, keep the main-thread driver for tests/node.
3. **Eviction unit for geometry** — product, representation-item, or
   spatial tile? Product is the natural IFC unit and matches the element
   map; tiles composite better for dense storeys. Start product-level
   (M3), tile later if draw-call/eviction overhead demands.
4. **Sidecar format**: version-stamped, little-endian typed-array dump of
   the SoA columns + serialized MultiIndexSet + skeleton + roots + extern
   refs, gzip'd. Explicitly *not* a public interchange format at first —
   it's a cache with a hash handshake; we can stabilise it once exporters
   care.
5. **Multi-mapped/complex records** (the AP214 multibody work, #376):
   record events carry localID + mapping, and consumers must tolerate
   one-address-many-entities — the same contract `expressIDsOfTypes`
   documents. Bake this into the event payload from day one.

## Non-goals

- Replacing the GLB cache path — it remains the fast revisit path; tiles
  extend it rather than replace it.
- Writing/round-tripping STEP — read-only browser semantics throughout.
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
