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

Above the budget, two anchors either side of a grid line still derive
frames a kilometre apart — and because a 1 km divergence is *inside* the
budget, the adopted-preview-frame gate
(`magnitude > LARGE_COORDINATE_BUDGET_M`) will not re-derive to catch it.
Two georeferenced exports of one site that anchor across a boundary
misalign by a kilometre where before they misaligned by the raw anchor
distance. This is why the staging matters: below the budget, where
almost everything lives, the amplification cannot occur at all.

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

What does **not** move is this repo's regression corpus. The regression
mains never touch the coordination frame — `ifc_regression_main.ts` and
`ifc_regression_batch_main.ts` mention neither `COORDINATE_TO_ORIGIN`
nor the linear scaling factor — and the digests hash curve/profile/mesh
geometry in *file* coordinates, which is the same reason the CLI can't
witness this change at all (see the note at the end). `visual-diff` is
gated on `run-ifc-regression` reporting a non-zero digest count, so with
no digest movement it does not run and has no baselines to re-bless.
Treat a digest that *does* move as a real geometry regression, not as
fallout from this.

## What is pinned, and where

| Property | Test |
|---|---|
| Model-zero below the budget, whatever the anchor; anchors either side of a grid line agree; unit-independent snapping above the budget | `src/compat/web-ifc/coordination_f64.test.ts` |
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
