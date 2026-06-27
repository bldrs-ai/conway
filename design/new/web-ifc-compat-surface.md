# Publishing a `web-ifc` compat surface from Conway

**Status:** proposal / scope
**Branch:** `claude/conway-web-ifc-adapter-removal-s1olih`
**Companion (consumer side):** [`Share/design/new/adapter-removal.md`](https://github.com/bldrs-ai/share/blob/main/design/new/adapter-removal.md)
**Related:** [`step-support.md`](step-support.md) gap #1 ("Public API surface")

---

## Why

Bldrs Share reaches Conway through `@bldrs-ai/conway-web-ifc-adapter` — a
separately versioned npm package that presents a `web-ifc`-compatible
`IfcAPI` over Conway internals (it deep-imports `@bldrs-ai/conway/src/…`).
That indirection has frozen Share on an old Conway: the adapter pins
Conway `0.23.977`; mainline is `1.22.969`. Every STEP-support and
release-automation improvement landing here is invisible to Share until
the adapter is hand-republished (its README publish flow is fully
manual). The release chain is three hops: Conway → adapter → Share.

The fix is to bring the shim **into Conway** and publish its `IfcAPI` as
part of `@bldrs-ai/conway`. Share then depends on Conway directly; the
adapter package is retired; the chain collapses to Conway → Share. The
full cross-repo rationale, Share's consumption inventory, and the
migration sequencing live in the companion doc — read it first. This doc
covers only the Conway-side work.

## What the adapter does that must move here

`conway-web-ifc-adapter/src/` (~92 K LOC, mostly two 42 K-line generated
IFC schema tables) provides, on top of Conway:

- `IfcAPI` (`ifc_api.ts`) — `Init`, `OpenModel`, `StreamAllMeshes`,
  `GetGeometry`, `GetCoordinationMatrix`, `GetFlatMesh`,
  `LoadAllGeometry`, `GetLine*`, `SetWasmPath`, plus the Conway-only
  `getStatistics` / `getConwayVersion`, plus a `properties` object.
- Format routing **IFC vs AP214 (STEP)** via
  `IfcApiModelPassthroughFactory` → `IfcApiProxyIfc` / `IfcApiProxyAP214`.
  This is how STEP reaches Share through the web-ifc surface today.
- Structured property / property-set / spatial-structure extraction
  (`ifc_properties.ts`, `ap214_properties.ts`) — note Conway's own
  `IfcPropertyExtraction` (`src/ifc/ifc_property_extraction.ts`) currently
  only **logs**; the structured surface is the adapter's.
- web-ifc type-code ↔ Conway `EntityTypesIfc` maps (`types-map.ts`,
  `shim_schema_mapping.ts`, `ifc2x4*.ts`, `IFC4x2.ts`).

It already imports Conway internals it would otherwise re-export
(`ifc_step_model`, `ifc_step_parser`, `ifc_geometry_extraction`,
`ifc_scene_builder`, the `AP214E3_2010/*` equivalents,
`format_detection/model_format_detector`, `parsing/parsing_buffer`,
`memory/memory`, `logging/logger`, `utilities/environment`).

## Scope (Conway side)

1. **Vendor** `conway-web-ifc-adapter/src/*` → `conway/src/compat/web-ifc/`.
   Rewrite `@bldrs-ai/conway/src/X` imports to relative paths.
2. **Public entry** `src/compat/web-ifc/index.ts` re-exporting `IfcAPI`,
   the `ifc2x4` type surface, `Loadersettings`, and the `IFC*` schema
   constants Share imports (`IFCPRODUCTDEFINITIONSHAPE`, `IFCPROPERTYSET`,
   `IFCRELDEFINESBYPROPERTIES` — see companion §4.3).
3. **`package.json#exports`**: add
   `"./web-ifc": { "types": "./compiled/src/compat/web-ifc/index.d.ts",
   "import": "./compiled/src/compat/web-ifc/index.js",
   "require": "…" }`. Keep the existing `"./src/*"` glob.
4. **Build/ship**: include the compat tree in `tsc --build` and the
   `files` allowlist so `compiled/src/compat/web-ifc/**` is in the
   published tarball. No codegen on PR — the gen tables are vendored as-is.
5. **Test (new in Conway CI)**: open a fixture IFC **and** a fixture STEP
   through `IfcAPI`; assert `StreamAllMeshes` emits geometry and a
   property read returns structured data. This is the contract the
   standalone adapter never tested — make it a Conway gate.
6. **Versioning**: the compat surface ships with Conway's version; the
   `0.23.x` adapter line is abandoned. Use the new release automation to
   cut the first Conway release carrying `./web-ifc` (a good first real
   exercise of it).

## Cross-references / open items

- **Closes `step-support.md` gap #1**: this `./web-ifc` export is (part
  of) the stable public API surface STEP needs. Coordinate the named
  exports so the STEP work and this surface don't diverge.
- **AP203** (`step-support.md` Phase 4, undecided): the compat factory
  routes IFC + AP214 — it must **fail loudly**, not silently mis-route,
  on AP203 until that lands.
- **Deep-import coupling goes away**: once vendored, Conway can refactor
  the internals the adapter reached into (`ifc_step_model`, etc.) without
  breaking an out-of-repo package it doesn't build.
- **Runtime engine swap (stretch)**: keeping the `IfcAPI` shape means
  Share can later flip between this Conway-backed `IfcAPI` and real
  `web-ifc` at runtime — see companion §5 (gated on the web-ifc
  single-thread pin + dual-wasm bundling, not on this work).
</content>
