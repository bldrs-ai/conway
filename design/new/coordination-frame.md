# The coordination frame: where a model lands

`COORDINATE_TO_ORIGIN` recentres a model so its geometry sits near the
origin. That is a float32 story: the GPU vertex format and Share's
BatchedMesh instance-matrix texture are single precision, and float32
quantizes at ~1mm per 1e4 m of coordinate, so a Swiss LV95 model at
~2.6e6 m easting renders on a ~0.3m grid and swims as the camera
rotates (Share#1631). Recentring buys that precision back.

The frame itself is derived once per model, in
`compat/web-ifc/coordination_f64.deriveCoordinationF64`, and reused for
every placement:

```
frame = scale * NormalizeMat * translate(-quantize(firstPlacement * firstVertex))
```

## The anchor is arbitrary; quantizing is what makes it repeatable

This is conway#87 ("Change Coordination Matrix to use Model-zero
offsets", filed 2023): *both web-ifc and current conway pick a
reference point based on model parser order, and this is not a sound
basis for a camera in the permalink.*

`firstPlacement * firstVertex` is **the first geometry the walk
reaches** — whichever element the file happens to declare first, latched
via `_isCoordinated`. Nothing about that element is special. Left raw, a
model's rendered position is therefore a function of its element
*order*, and two things break:

- **Two exports of one object land in different places.** Share#1749:
  the Bldrs logo ships as both `index.ifc` and `index.step`, the IFC
  declares the x=76 block first and the STEP the x=0 one, and the STEP
  rendered 76m — the width of the logo — off the IFC. Auto-framing hides
  this, because it centres whatever it is given; it only shows up when a
  `#c:` camera permalink is applied to both.
- **Re-exporting a model moves it.** Same geometry, shuffled element
  order, and every camera saved against the model is silently wrong.

`quantizeRecentre` answers this in two stages, because the two ranges
want different things.

**Inside `LARGE_COORDINATE_BUDGET_M` (1e4 m), it does not recentre at
all.** There is no float32 benefit below the budget — that constant *is*
the threshold where quantization becomes visible — so a model within
10km of the origin keeps the coordinates its file authored. That is
model-zero, which is what conway#87 asked for, and it makes the frame
*exactly* order-independent for the overwhelming majority of models:
there is no cell boundary to straddle, so twin exports and federated
sets coincide however their elements are ordered.

**Above the budget it snaps to `COORDINATION_SNAP_M` (1 km).** A
georeferenced model has to come back near the origin, and snapping keeps
that repeatable across exports. Half a cell out of a 1e4 m budget costs
~0.05mm of float32 resolution, and a whole-kilometre translation is
exactly representable in float32 where an arbitrary anchor was not, so
the recentre stops contributing rounding of its own.

### What this does not guarantee

Quantizing cannot remove the discontinuity, only move it. Staging moves
it to the budget, and the step *there* is `LARGE_COORDINATE_BUDGET_M`
(1e4), not the grid (1e3) — an anchor at 9900 derives model-zero while
one at 10100 derives −10000, so two anchors 200m apart can produce
frames 10km apart. Above the budget the grid adds its own 1km edges on
top.

Those edges are invisible to the adopted-preview-frame gate, which
re-derives only when a durable placement lands beyond the budget: a
preview anchored at 10100 with a durable first placement at 9900 probes
at ~100m, keeps the preview frame, and renders 10km off a classic open.

The trade is deliberate — a handful of edges out at georeferenced
magnitudes, instead of an edge every kilometre right through the range
where nearly every model lives — but it is a real residual, not an
eliminated one.

The fully general fix is an anchor that is a symmetric function of all
the geometry — the model's bounding box — which the streaming opens
cannot compute before they emit their first batch, and which would have
to be identical across the classic, streamed and preview paths or one
model would render in two places depending on which open ran. conway#87
also points past that, at the XeoKit
[full-precision geometry](https://xeokit.io/blog_full_precision_geometry.html)
approach (relative-to-centre tiles), as the way to stop trading precision
for a single global frame at all.

## Consequences of changing the frame

Every model moves. A near-origin model that used to render recentred on
an interior element now renders where its file puts it; the logo moved
86m, from x ∈ [-76, 10] to x ∈ [0, 86]. So:

- **Saved camera permalinks against existing models are invalidated**,
  including Share's homepage camera. They need re-capturing, and
  Share-side visual baselines shot against those cameras move with them.

- **Regression digests move**, and with them the visual-diff baselines.
  An earlier revision of this doc claimed they would not, reasoning that
  the regression mains never mention `COORDINATE_TO_ORIGIN` and the
  digests hash geometry in file coordinates. CI disproved it: the first
  gated run on this change reported **11 of the 12 smoke models
  digest-changed**, with no failures and no errors. So re-blessing is
  real work — see [regression/README.md](../../regression/README.md).

  What the same run also showed is that the movement is not visible:
  `visual-diff` rendered all 11 and every one came in under the 0.05%
  pixel threshold. A digest that moves *with* a visible diff is still a
  real geometry regression; a digest that moves without one is this
  change.

  The lesson worth keeping: the CLI cannot witness the frame change (see
  the note at the end), but "the CLI can't see it" does not imply "the
  digest can't see it". Verify against a run rather than by reading the
  pipeline.

## Supplying the frame instead of deriving it

`SetCoordinationFrame(modelID, matrix)` hands a deferred model the frame
to apply, rather than letting it derive one. It exists because deriving
is a **per-instance** act, and M3's geometry worker pool runs N instances
over one model: each starts on a different product, so each derives a
different anchor, and the shards reassemble offset by whole grid cells.
Individually plausible placements, a wrong picture.

The workflow is derive-once-then-distribute. A coordinator opens the
model (Share's parse-time preview channel already derives a frame during
open), reads it back with `GetAppliedCoordinationMatrix`, and passes that
matrix to every worker before its first batch. This is what lifts the
`COORDINATE_TO_ORIGIN` refusal in `SetGeometryShard` — see
[streaming-federated-loader.md](streaming-federated-loader.md) § M3.

Three properties are deliberate:

- **A supplied frame is final.** The adopted-preview revalidation above —
  which re-derives when the first durable placement lands beyond the
  budget — is disabled under a supplied frame. A worker that re-derived
  would silently leave the frame its siblings are still using, which is
  the failure this seam exists to prevent, arriving by another road.
- **It must be set before the first batch.** Placements already emitted
  carry whatever frame was in force when they were captured, and nothing
  re-places them.
- **It will not overwrite a frame the model derived for itself.** That
  frame has already placed geometry; replacing it would leave that
  geometry in the old space and everything after it in the new one.

The grid is what makes this hard to test honestly. Shards whose first
products sit tens of metres apart quantize to the *same* frame, so a
per-shard anchor is invisible on every fixture in `data/` — including the
georeferenced one, whose seven products span ~86m inside a single 1km
cell. `data/index_georeferenced_multicell.ifc` spreads them 4km apart for
exactly this reason, and
`src/compat/web-ifc/geometry_shard_coordination.test.ts` asserts that
span rather than assuming it.

## Reading the applied frame back

`GetCoordinationMatrix` cannot answer "where is this model really".
It is pinned at identity on purpose: consumers stamp what it returns
onto the assembled model, so a truthful return there would apply the
recentre a second time on top of placements that already carry it. That
left no way to invert the recentre at all — no measurement in source
coordinates, no georeferenced permalink, no round-tripping export
(Share#1634).

`GetAppliedCoordinationMatrix(modelID)` is the explicit answer. Write
`A` for what it returns. Every emitted `flatTransformation` was composed
as

```
flatTransformation = A * placement [ * translate(geomCentre) ]
```

— `placement` the entity's native world placement in authored space, and
the optional per-leaf `translate(geomCentre)` the IFC path's vertex-buffer
recentre, which the AP214 path omits. Both sit to the right of `A`, so
for any uploaded vertex

```
rendered = A * world       world = inverse(A) * rendered
```

with `world` in the model's authored space: the file's units, Z-up,
un-recentred. Inverting the returned matrix is the whole of it, because
`A` carries all three factors:

```
A = scale(linearScalingFactor) * NormalizeMat * translate(-anchor)
```

innermost first — the recentre in source units and pre-rotation, then
the Z-up → Y-up change of basis, then the scale to metres. A consumer
therefore needs to know neither the file's unit scale nor the engine's
axis convention.

Two traps the accessor's doc comment states and the tests pin:

- **"No offset" is not "identity".** A near-origin model under
  `COORDINATE_TO_ORIGIN` returns a frame whose *translation* is exactly
  zero — model-zero, above — but whose rotation and scale are still the
  `NormalizeMat` and unit scale the placements were composed under.
  Skipping the inverse on that model reads every point in the wrong axis
  convention. Identity is returned only when nothing was composed *and*
  nothing was handed in: recentring off, a shard with no supplied frame,
  or no geometry emitted yet on a model nobody supplied a frame to.
- **A supplied frame reports before it is applied.**
  `SetCoordinationFrame` stores its matrix at call time, so
  `GetAppliedCoordinationMatrix` returns it immediately — before the
  worker has composed a single placement under it. That is the reading
  M3's pool wants (which frame *will* this worker apply), and it is
  sound because a supplied frame is final: the setter refuses to replace
  a frame the model derived for itself, and refuses one at all after the
  first batch. The STEP arm has no such case — it implements no
  `setCoordinationFrame`.
- **Every walk composes under the same frame, not just the first.** More
  than one classic walk of a live model is legal (`StreamAllMeshes` and
  then `LoadAllGeometry`), and each has its own local. Those locals seed
  from the persisted frame, because the derivation guard — correctly —
  stops a second walk re-anchoring, and seeding identity there made it
  emit raw source coordinates while the accessor went on reporting the
  real frame (conway#703). Accessor and emission agreeing is what makes
  the inverse above true of any placement, not just one from the first
  walk.
- **The durable walk is the authority.** A deferred open that adopted its
  preview channel's frame reports that adopted frame from the moment it
  opens — truthfully, since the preview payloads were composed under it —
  and the value can change once, at the first durable batch, if the
  revalidation above rejects it. From derivation or validation onward it
  is fixed for the life of the model.

## What is pinned, and where

| Property | Test |
|---|---|
| Model-zero below the budget, whatever the anchor; anchors either side of a grid line agree; unit-independent snapping above the budget | `src/compat/web-ifc/coordination_f64.test.ts` |
| Near-origin model keeps authored coordinates; georeferenced model still recentres; classic and streamed opens agree | `src/compat/web-ifc/coordination_export_order.test.ts` |
| The cross-format claim — `index.ifc` and `index.step` render in the same world box | Share: `src/Containers/indexStepLogo.spec.ts` |
| A supplied frame is applied exactly, a different one moves the model, and N shards under one frame union to the single instance's placements | `src/compat/web-ifc/geometry_shard_coordination.test.ts` |
| `inverse(GetAppliedCoordinationMatrix)` maps a rendered point back to the fixture's authored LV95 coordinates; zero translation but non-identity frame near the origin; exact identity with recentring off; stable across batches; classic and deferred agree | `src/compat/web-ifc/coordination_baked_geometry.test.ts` |
| A second classic walk of one live model composes under the frame the first derived, and its placements still invert to the authored coordinates (conway#703) | `src/compat/web-ifc/coordination_baked_geometry.test.ts` |
| The same classic/deferred agreement, and the same second-walk rule, on the AP214 arm | `src/compat/web-ifc/ap214_streamed_open.test.ts` |

The cross-format claim is pinned Share-side rather than here because
through this surface the AP214 arm reports its placements at the origin
with the geometry carrying the world transform, so neither placement
bounds nor a fixture pair in two element orders reproduces the defect.
Characterising the AP214 anchor — and pinning it here — is open work.

Note the CLI is not a witness for any of this: `ifc_command_line_main`
and its glTF writer recentre per model and hand the offset back as a
node translation, so summing the two always reconstructs source-world
coordinates whatever the frame did. Only the `compat/web-ifc` surface —
the one Share consumes — shows it.
