# Native (in-engine) GLB export — shelved, restart notes

> **Status: optional / not scheduled.** This documents work from the
> `glb_local` branch (Aug–Nov 2025), which has been **dropped** rather
> than rebased. Share already produces GLBs by a different, working,
> performant route (see "Why this is shelved"). Keep this as the
> starting point *if and when* an ultra-performant native exporter
> becomes worth a fresh build. The `glb_local` branch was deleted; its
> commits are recoverable from the SHAs below.

## What this was

An attempt to make Conway itself emit a fully self-contained GLB —
geometry **plus** the IFC spatial structure (navtree) **plus**
properties / property-sets — directly from the engine, so a downstream
consumer could load one binary and have everything, with no second pass
in the host app.

Branch tip `5326646c` was ~9 commits / 92 commits behind `main` at
deletion, and was cut **before** the 1.x version scheme (its
`version.ts` still read `v0.22.962`).

## Why this is shelved

Share ended up solving the same problem a different way, and it works:
a GLB drawn mostly from the **three.js scene graph**, with a few
targeted **API calls into Conway** to attach the IFC navtree and
properties + property-sets as glTF extensions. That path is performant
and in production today.

So the in-engine exporter is **redundant for the current need**. The
only reason to revive it is to go *ultra*-performant — emit the binary
straight from native/WASM with no JS scene-graph round-trip — and at
that point a fresh start is likely cleaner than rebasing 6+ months of
drift across a moved `conway-geom` submodule and the 0.x→1.x version
change. These notes exist so that fresh start isn't from zero.

## What was actually built (the learnings)

The work spanned two layers. Most of the heavy lifting was in
`conway-geom` (the C++/WASM exporter) — which is why the TypeScript diff
is small and the branch carried several `conway-geom` submodule bumps.
**The native glTF-extension serialization cannot be fully reconstructed
from the TS side alone**; the matching `conway-geom` commits are the
other half.

### TypeScript side (this repo)

- **`src/core/geometry_aggregator.ts` (+139 lines)** — added
  *walk-order native aggregation*:
  - a `linearGeometry: Array<{ material?, geometry }>` buffer,
  - `appendInOrder(scene)` to collect non-grouped geometry in scene
    walk order (vs. the existing grouped `append()`),
  - `aggregateNativeInOrder(): AggregatedNativeGeometry` to pack that
    geometry into native/WASM vectors for the exporter.

  This is the reusable nugget: getting geometry into native vectors in a
  stable, spatial-walk order is the precondition for any high-throughput
  native export, and is independent of the GLB-specific work.
- **`src/core/geometry_convertor.ts`** — `toGltfs()` gained a scale
  factor argument (passed `1.0` for identity); pairs with the
  "added scale factor to glb export" commit.

### conway-geom side (submodule — not in this repo)

Inferred from commit messages; the implementation lives in the C++
exporter the submodule bumps point at:

- A glTF extension carrying the **IFC spatial structure** embedded in
  the GLB scene graph ("GLB spatial structure", `32453462` / `03a4e272`).
- An **`ExtBldrsPropertiesPayload`** glTF extension carrying IFC
  properties / property-sets (`ec195540`), later extended with
  **compressed properties** (`7d6c6429`). *(No `ExtBldrs*` symbol
  appears in the TS tree on either branch — confirming this lived in
  `conway-geom`.)*

### Commit map (recover with `git show <sha>` / cherry-pick)

| SHA | Date | What |
|-----|------|------|
| `5326646c` | 2025-11-07 | update conway-geom |
| `e004c50f` | 2025-11-04 | added scale factor to glb export |
| `7d6c6429` | 2025-10-30 | support compressed properties |
| `03a4e272` | 2025-10-21 | support glb spatial structure + properties |
| `32453462` | 2025-10-16 | GLB spatial structure WIP |
| `ec195540` | 2025-10-07 | add ExtBldrsPropertiesPayload support to gltf exporter |
| `292d0ac8` | 2025-09-17 | add linear geometry aggregation |
| `e78a3358` | 2025-08-13 | update conway |
| `0d50f81a` | 2025-08-08 | wip — glbs running end to end |

## If/when to restart

Revisit only when the three.js-scene-graph GLB path in Share becomes a
**measured** bottleneck (large models, export latency, memory), not
before. When that day comes:

- [ ] Quantify first: profile Share's current export path and set a
      concrete throughput/latency target the native path must beat.
- [ ] Treat `conway-geom`'s exporter as the design center — the win is
      emitting the binary from native with no JS scene-graph round-trip.
      The TS `aggregateNativeInOrder()` walk-order plumbing is the part
      worth lifting forward; the rest probably wants redesign against
      current `main`.
- [ ] Pin the glTF extension contract up front: agree the extension
      keys and payload schema for spatial structure and properties
      (the `EXT_bldrs…` namespace) so engine output and Share's
      consumer can't drift.
- [ ] Decide compressed-vs-plain properties as a contract decision, not
      an implementation detail (`7d6c6429` compressed them).
- [ ] Land it behind the **GLB snapshot golden** regression first (see
      `glb-snapshot-goldens.md`) — a native exporter is exactly the kind
      of change that silently shifts bytes, and that doc's determinism
      audit + structural diff is the guardrail for it.

## Open questions

- Single self-contained GLB (engine embeds navtree + props) vs. Share's
  current "geometry GLB + API-attached extensions" split — is the
  one-binary goal still wanted, or did the split prove better for
  caching / incremental load?
- Does the native path need to match Share's extension bytes exactly, or
  just be semantically equivalent? Drives whether this is a drop-in or a
  parallel format.
- Where does scale/unit normalization belong — the exporter (this
  branch passed an explicit factor) or upstream, alongside the AP214
  `uniformScaleAffine` unit-conversion work now on `main`?
</content>
</invoke>
