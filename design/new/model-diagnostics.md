# Model diagnostics

Status: living doc. Tooling shipped (`scripts/debug/model_report.mjs`);
the Share-facing items in §4 are candidates, not commitments.

Two audiences want the same underlying measurements:

- **us**, debugging why one model renders wrong, offline, at any cost in
  time — that is `scripts/debug/model_report.mjs`
  ([guide](../../scripts/debug/README.md));
- **users**, who want to know whether the thing on their screen is what
  they exported, live, at near-zero cost.

This doc is the inventory that connects them: what can be measured, what
each signal means, what it costs, and which ones are worth surfacing in
Share.


## 1. Why this exists

The AmazingHand STEP investigation (conway#444) is the motivating case. A
0.17 m robot-hand assembly rendered as an exploded mess of half-metre
spikes. From the user's side the entire signal was "it's hilariously
misshapen" plus a screenshot. From our side it took about thirty minutes
of ad-hoc instrumentation to reach "561 of 2541 edges have
`same_sense = .F.`, and those are the ones producing 0.7 m curves".

Every number in that sentence was measurable in under two seconds. None
of it was reachable without writing code first. That gap — measurable but
not measured — is what both the tooling and the Share candidates below
are aimed at.

A secondary point the same investigation made: **model defects cluster**.
One bad model surfaced five distinct engine defects (arc complement
selection, CDT constraint handling, absolute-vs-relative deflection
thresholds, a colour-extraction fallback, and non-UTF-8 header strings).
A diagnostic that reports several weak signals at once is more useful
than one that reports a single strong one, because the correlations are
what identify the mechanism.


## 2. The signals

Measured against the whole model, so they carry across formats and scales.
"Cost" is what it takes to compute during a normal load.

| Signal | Means | Cost |
|---|---|---|
| **Extent outliers** — meshes whose local bounds far exceed the median mesh | Geometry flung away from where it belongs: bad curve interpretation, bad transform, bad unit scale | Near-free; bounds are walked anyway |
| **Empty products** — products that produced no geometry | Unsupported representation, or a silently swallowed extraction failure | Free (a counter) |
| **Warning/error churn** — engine diagnostics, counted by message | Per-entity failures. Churn *between versions* of the same model is a regression signal in its own right | Free; already collected |
| **Degenerate loops** — under 3 points, or consecutive points below the coordinate quantum | Triangulation-failure candidates. Often the proximate cause when a face is missing rather than misplaced | Cheap; one pass over loop points |
| **Curve extent outliers** — curves whose points leave the part | The earliest place a placement defect is visible, and the only one that names the curve entity and its trim state | Cheap, but only on the advanced-BREP path |
| **Face vertex attribution** — vertices one face contributed, and how far out | Bridges curve and mesh: which face turned a bad curve into bad triangles | Requires immediate (non-staged) faces; changes triangle ordering |
| **Model extent vs. schema expectation** | Unit-scale error — the mm/m confusion class of bug | Free once bounds exist |
| **Geometry-type breakdown** | Which representations a model leans on; which engine paths a defect could be in | Free; already in the statistics line |

### Reading them

The baseline is always the **median**, never the mean: the thing being
detected is a handful of runaway entities among thousands of sound ones,
and a mean lets them hide themselves. p90 alongside the median is the
calibration — when p90 sits near the outlier threshold the model
legitimately has mixed-scale parts and any flag is weak evidence.

The stages are deliberately redundant, and **the narrowest dirty stage is
the diagnosis**: dirty at `mesh` but clean at `curve` means tessellation,
CSG or transform; dirty already at `curve` means curve interpretation
upstream of all of that.


## 3. Where they come from

Four seams, in pipeline order. The first three are per-schema or shared
extraction points; the last is a post-load walk.

| Seam | Shared by | Yields |
|---|---|---|
| `extractCurve` (AP214, IFC) | per-schema, same signature | curve extent, entity type, trim state |
| `ConwayGeometry.getLoop` | IFC + STEP | loop extent, point spacing |
| `ConwayGeometry.addFaceToGeometry` | IFC + STEP | per-face vertex contribution |
| `Scene.walk()` | IFC + STEP | per-mesh bounds, attributed to the product entity |

That `getLoop` and `addFaceToGeometry` sit **below** the schema layer is
what makes one probe cover both formats — worth preserving. Instrumenting
`extractAdvancedFace` instead misses faces that carry their own styled
geometry, which is one of the two false-negative readings the AmazingHand
investigation lost time to.


## 4. What Share could surface

Ranked by value per unit of work. Nothing here is committed; the point is
that the measurements already exist and the surfaces mostly do too.

### 4.1 Model-health lines in the load report — cheapest, do first

Share's load report ([Share
`design/new/load-log-format.md`](https://github.com/bldrs-ai/Share/blob/main/design/new/load-log-format.md))
already renders one "Warnings & errors" summary line and an engine
statistics line with the geometry-type breakdown. Extent outliers, empty
products and degenerate-loop counts belong on the same footing:

```
Health: 3 parts outside model bounds (max 33x median), 12 products with no geometry
```

The canonical formatter is conway's `src/core/progress_log.ts`, which
Share deep-imports, so the line renders byte-identical in the CLI, the
console, the snackbar expando and the copyable "i" report with no
Share-side work beyond the pin. That shared-formatter property is the
reason to put it there rather than inventing a Share-side panel.

### 4.2 Attach the diagnostic to a bug report — highest leverage for us

The "i" report is already copy-to-clipboard and already reaches Sentry as
load context. Extending it with the machine-readable diagnostic
(`model_report.mjs --json` is the shape) turns "it looks wrong" plus a
screenshot into a report naming the express IDs. That is the single
change that would most reduce the cost of the next AmazingHand: the
thirty minutes went to *reproducing and localizing*, not to fixing.

Needs care on privacy — express IDs and part names are model content.
Opt-in per report, not automatic telemetry.

### 4.3 Robust auto-framing — a user-visible win with no engine fix

Today one runaway part drags the scene bounds and the default camera
frames the spike instead of the model; the hand appeared as a tiny blob
in a large empty view. Framing on a **percentile** of part bounds rather
than the absolute union would have shown a recognizable (if broken) hand.

This is worth doing on its own merits: it improves every malformed model,
including ones whose defects we have not found yet, and it is independent
of any diagnostic UI.

### 4.4 Navigate to flagged parts

Share already has NavTree selection, per-occurrence picking and
permalink cameras. A flagged express ID in the report becomes a link that
selects and frames that part. Small increment on 4.1 + existing
selection, and it is what turns a diagnostic into something a *user* can
act on ("this bracket didn't import — here it is").

### 4.5 Not obviously worth it yet

- A dedicated "model quality" panel or score. The signals are advisory
  and mixed-scale models produce honest false positives; a score invites
  the reading that a number means something absolute.
- Live per-face diagnostics. The `face` stage needs immediate rather
  than staged faces, so it is not free on a normal load.


## 5. Open questions

- **Thresholds across an assembly with genuinely mixed part scales.** 8x
  median is a debugging default a human calibrates with p90; a
  user-facing line needs something that does not cry wolf on a site plan
  next to a door handle. Percentile-of-parts rather than
  multiple-of-median is the likely answer, untested.
- **Attribution below the product level.** Curve and face signals name
  entities; the mesh stage names products. Bridging them (which product
  owns a bad curve) currently means reading the STEP file.
- **Should health signals gate the regression digests?** Extent-outlier
  counts are more stable than triangle counts and would catch a class of
  defect the digests currently only catch as a visual diff.


## See also

- [scripts/debug/README.md](../../scripts/debug/README.md) — the tool, a
  worked example, and how to read the numbers
- [step-regression.md](step-regression.md) — corpus, digests, smoke subset
- [step-support.md](step-support.md) — schema coverage and known gaps
