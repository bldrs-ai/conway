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
frame = scale * NormalizeMat * translate(-snap(firstPlacement * firstVertex))
```

## The anchor is arbitrary; the snap is what makes it repeatable

`firstPlacement * firstVertex` is **the first geometry the walk
reaches** — whichever element the file happens to declare first, latched
via `_isCoordinated`. Nothing about that element is special. Without the
snap, a model's rendered position is therefore a function of its element
*order*, and two things break:

- **Two exports of one object land in different places.** Share#1749:
  the Bldrs logo ships as both `index.ifc` and `index.step`, the IFC
  declares the x=76 block first and the STEP the x=0 one, and the STEP
  rendered 76m — the width of the logo — off the IFC. Auto-framing hides
  this, because it centres whatever it is given; it only shows up when a
  `#c:` camera permalink is applied to both.
- **Re-exporting a model moves it.** Same geometry, shuffled element
  order, and every camera saved against the model is silently wrong.

`snapRecentre` rounds the recentre to `COORDINATION_SNAP_M` (1 km), so
the frame depends on *where* the anchor is rather than *which* anchor it
is. Any two anchors in the same cell derive the same frame. Near-origin
models — the overwhelming majority — snap to zero and keep the
coordinates their file authored, which is both the most predictable
behaviour and what makes twin exports coincide by construction.

The grid is 1/10th of `LARGE_COORDINATE_BUDGET_M`, the engine's own
"this frame failed to recentre" threshold. Snapping spends at most half
a cell (500m) of a 1e4 m budget — about 0.05mm of float32 resolution —
while LV95 eastings still recentre to within half a kilometre. A snapped
translation is also exactly representable in float32, where an arbitrary
anchor was not, so the recentre stops contributing rounding of its own.

### What this does not guarantee

Two anchors that straddle a cell boundary still derive frames a
kilometre apart. This converts an exact order-dependence into a coarse
one; it does not eliminate it. The fully general fix is an anchor that
is a symmetric function of all the geometry — the model's bounding box —
which the streaming opens cannot compute before they emit their first
batch, and which would have to be identical across the classic,
streamed and preview paths or one model would render in two places
depending on which open ran.

## Consequences of changing the frame

Every model moves. A near-origin model that used to render recentred on
an interior element now renders where its file puts it; the logo moved
86m, from x ∈ [-76, 10] to x ∈ [0, 86]. So:

- **Saved camera permalinks against existing models are invalidated**,
  including Share's homepage camera. They need re-capturing.
- **Regression digests and visual-diff baselines shift** for any model
  whose anchor was not already at the origin, and need re-blessing —
  see [regression/README.md](../../regression/README.md).

## What is pinned, and where

| Property | Test |
|---|---|
| Anchors in one cell derive one frame; unit-independence; budget | `src/compat/web-ifc/coordination_f64.test.ts` |
| Near-origin model keeps authored coordinates; georeferenced model still recentres; classic and streamed opens agree | `src/compat/web-ifc/coordination_export_order.test.ts` |
| The cross-format claim — `index.ifc` and `index.step` render in the same world box | Share: `src/Containers/indexStepLogo.spec.ts` |

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
