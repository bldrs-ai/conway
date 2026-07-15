# Conway memory residency: parse, geometry, and property-source

**Status:** Living doc. Geometry/allocator arc **shipped** (see
`emsdk-upgrade-scalable-allocator.md`); parse-index + property-source
residency **shipped through conway 1.374.1181**; next conway-side lever
(roots-only property iteration) **proposed, not started**.

**Owner:** Pablo (with Claude).

**Companion doc:** [`bldrs-ai/Share` → `design/new/lazy-properties-memory.md`](https://github.com/bldrs-ai/Share/blob/main/design/new/lazy-properties-memory.md).
That doc owns the *product* goal (open a 100 MB–1 GB model in a browser tab
without OOM) and the Share-side wiring; this doc owns the *engine*
primitives conway exposes to make that possible. Read them together.

**Related PRs (this doc ↔ code):**
- conway #372 — SoA entity descriptors (parse-index residency). *shipped 1.372*
- conway #373 — `getSpatialStructure(_, 'names')` + `ReleaseEntityCache`. *shipped 1.373*
- conway #374 — windowed `StepBufferProvider` + OPFS source spill. *shipped 1.374*
- conway #360 / conway-geom #139 — AFTP tessellation arena (see allocator doc). *shipped*
- Share #1588, #1589 — the consumers of #373/#374 on the Share side.


## Why this exists

A returning visitor should open a previously-shared model in ~1 s, and a
first-time load of a large model (Snowdon ~50 MB, PSB / `sp-946MB` class
100 MB–1 GB) should complete in a browser tab **without exhausting the
renderer's memory**. In practice we hit two distinct memory walls, and they
need different fixes:

1. **Transient peak during geometry extraction** — the wasm heap grows to
   hold per-face tessellation scratch + output. On pathological models this
   spiked into the multi-GB range and tripped the browser's renderer OOM
   (Chrome "Aw, Snap — Error code 5"). This is a *wasm-heap* problem.
2. **Post-load resident** — after render, memory that stays pinned for the
   whole session: the parsed entity index, per-entity descriptor caches, and
   **the raw STEP/IFC source buffer**. This is mostly a *JS-heap* problem
   (plus the source bytes). It's what makes a second model, or a long
   property-browsing session, fall over.

Conway is the engine under Share's viewer, so both walls are conway's to
provide primitives for. The measured reference model throughout is **PSB**
(`16929-00`, IFC4): 9.19 M vertices, 11.98 M triangles, 448 MB GLB,
~2.8–2.9 GB JS heap at load, 533 MB geometry memory.


## Where the memory goes (the residency map)

| Sink | Lives in | Rough scale (PSB) | Lifetime | Addressed by |
| --- | --- | --- | --- | --- |
| Per-face tessellation scratch | wasm heap | multi-GB transient (pre-fix) | during geometry extract | AFTP arena (#360/#139), non-finite CDT guards |
| Geometry output (verts/tris) | wasm heap → JS typed arrays | 533 MB | session (it's the model) | inherent; freed the redundant wasm copy after reify (#358-era) |
| Parsed entity index | JS heap | ~1 GB (7.8 M-entity model, pre-SoA) | session | SoA descriptors (#372) |
| Per-entity descriptor cache | JS heap | O(touched entities) | until `invalidate()` | `ReleaseEntityCache` (#373) |
| **Raw STEP/IFC source buffer** | JS heap | 100s of MB (≈ source size) | session (pinned for property reads) | windowed `StepBufferProvider` + OPFS spill (#374) |

The geometry (top two rows) is covered in depth by
`emsdk-upgrade-scalable-allocator.md` and the memory-sweep work; this doc
concentrates on the bottom three rows — the **parse-index and
property-source residency** — which is the current active track.


## What shipped

### 1. SoA entity descriptors — conway #372 (1.372)

The parsed element index used to be one heterogeneous JS object per entity,
retained for the model's whole life (~135 B each; SKYLARK's 7.8 M / PSB's
9.4 M entities → ~1 GB+ that nothing could reclaim). It's now
**structure-of-arrays**: persistent scalar fields (`address`, `length`,
`typeID`, `expressID`) in parallel typed-array columns (~16 B/entity), with
a descriptor object materialised lazily on demand into a cache that
`invalidate()` clears.

**Measured:** post-`invalidate` JS heap on a 7.8 M-entity model
**1055 MB → 24 MB (−98%)**; peak unchanged; geometry byte-identical.

This is the foundation: it makes the descriptor cache *reclaimable*, which
the next two items depend on.

### 2. `'names'` spatial tree + `ReleaseEntityCache` — conway #373 (1.373)

Two public surfaces on the web-ifc-compatible shim:

- `getSpatialStructure(modelID, 'names')` returns per-node
  `Name`/`LongName`/`GlobalId` value handles only — no recursive property
  inlining. The eager `true` mode flattened and retained every spatial
  node's full attribute record; `'names'` carries just what a NavTree /
  search index needs, and everything else stays behind the on-demand
  property API.
- `IfcAPI.ReleaseEntityCache(modelID)` drops the materialised
  entity/descriptor cache (calls `invalidate(true)`), returning the #372
  memory. Entities rematerialise transparently on next access.

### 3. Windowed source-buffer provider + OPFS spill — conway #374 (1.374)

The last big session-resident item is the **raw source buffer**. Parse and
geometry extraction need it, but afterwards property access only ever
touches a tiny fraction of it — yet the whole buffer stayed pinned.

`#374` introduces a `StepBufferProvider` seam between the descriptors
(which index the source by absolute `[address, address+length)` byte
ranges — the SoA `address_`/`length_` columns) and the bytes themselves:

- **`ResidentStepBufferProvider`** — the default; wraps the full buffer at
  offset 0. Bit-for-bit the historical behaviour.
- **`WindowedStepBufferProvider`** — pages fixed-size chunks (default 4 MiB,
  LRU-capped at 16) from a `StepExternalByteStore`. Records inside one chunk
  are served zero-copy; straddling records get a per-record merged copy.
  Eviction is *advisory* — a descriptor that captured a chunk keeps it alive,
  so correctness never depends on the residency set, only memory does.
- **API:** `IfcAPI.SpillModelSource(modelID, store, chunkBytes?, maxResidentChunks?)`
  releases the resident buffer and switches to windows. Sync extraction of a
  non-resident range throws `StepBufferNotResidentError` (a sequencing bug,
  not a data condition); async surfaces call `ensureLineResident(expressID)`
  first. The shim's property APIs already `ensureResident` internally; AP214
  primes its indexes pre-spill.

**Contract for the embedder:** the external store must hold exactly the
model's source bytes (Share already keeps the source in OPFS). Spill only
*after* every synchronous sweep — parse, geometry extract, and any bulk
property capture — has finished.


## Priorities / what's next (conway side)

1. **Roots-only / GlobalId-filtered iteration (proposed).** The Share
   streaming property capture (Share #1589) does a linear scan calling
   `getLine` on **every** parsed entity (9.7 M on PSB) just to find the
   ~341 k `IfcRoot`-derived entities it keeps — materialising, then
   dropping, ~9.4 M geometric-primitive descriptors. If conway exposed an
   iterator that yields only entities with a `GlobalId` (or by a type-code
   predicate) straight off the parse columns, the consumer would skip the
   geometric backbone entirely. This is the highest-leverage remaining
   conway-side property-memory (and time) lever. **Not started.**
2. **`ensureResident` batch/prefetch for closure walks.** `getLine(id,
   recursive=true)` on a spilled model follows references synchronously and
   only the root record is ensured; recursive flattening needs the closure
   resident. No current consumer uses recursive reads, but if one appears
   we need a batch `ensureResident(ids[])`. Documented in #374, deferred.
3. **Telemetry.** `residentSourceBytes` / `residentChunkCount` are exposed
   but not yet surfaced in the perf-three memory columns. Adding them would
   let CI track the spill's effect per model.

## Non-goals

- Changing geometry output or the GLB contract (that's byte-stable and
  regression-gated).
- Draco / mesh compression — that's the *geometry-bytes* lever, tracked on
  the Share side, not a conway-residency concern.
- A formal public API for the adapter internals the streaming capture
  reaches (`getPassthrough().model[0]`). Acknowledged coupling; the
  roots-only iterator (item 1) is the chance to formalise it.


## Cross-references

- Geometry / wasm-heap allocator arc: `design/new/emsdk-upgrade-scalable-allocator.md`
- STEP support & regression: `design/new/step-support.md`, `design/new/step-regression.md`
- web-ifc compat surface (where these APIs live): `design/new/web-ifc-compat-surface.md`
- Share-side product goals & wiring: [Share `design/new/lazy-properties-memory.md`](https://github.com/bldrs-ai/Share/blob/main/design/new/lazy-properties-memory.md)
