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

`conway-web-ifc-adapter/src/` is **~92 K LOC on paper, but that headline
is misleading** — most of it is not load-bearing and should not be
vendored verbatim. The real surface, on top of Conway:

- `IfcAPI` (`ifc_api.ts`, 725 L) — `Init`, `OpenModel`, `StreamAllMeshes`,
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

It already imports Conway internals it would otherwise re-export
(`ifc_step_model`, `ifc_step_parser`, `ifc_geometry_extraction`,
`ifc_scene_builder`, the `AP214E3_2010/*` equivalents,
`format_detection/model_format_detector`, `parsing/parsing_buffer`,
`memory/memory`, `logging/logger`, `utilities/environment`).

### The schema tables are mostly dead or derivable — do NOT vendor verbatim

The ~92 K headline is dominated by two 42 K-line files and a set of
type-map literals. Audited, they fall into three buckets:

1. **Dead duplicate (~42 K) — delete.** `IFC4x2.ts` is a *byte-identical*
   copy of `ifc2x4_helper.ts` and is imported nowhere. Drop it outright.

2. **Deterministic name↔typecode mapping — code-gen, don't copy.** Three
   hand-maintained views of one name-keyed bijection:
   `ifc2x4.ts` (`NAME → webIfcCode`), `types-map.ts` (`webIfcCode → NAME`),
   and `shimIfcEntityMap` in `shim_schema_mapping.ts`
   (`webIfcCode → EntityTypesIfc`). The last already carries
   `// TODO(nickcastel50): Remove this and add to Code-Gen`. Because both
   sides key on the same uppercase entity name, the entire bridge is
   `webIfcCode → name → EntityTypesIfc[name]`. Conway's codegen already
   emits `src/ifc/ifc4_gen/entity_types_ifc.gen.ts` (note: Conway uses its
   **own sequential indices**, e.g. `IFCACTIONREQUEST = 1`, *not* the
   web-ifc FNV codes like `3821786052`) — extend it to also emit a
   generated `name↔webIfcCode` table, and `shimIfcEntityMap` falls out as
   a derived artifact + a lookup function. (Real `web-ifc` also ships
   `IfcTypesMap`, so the `code↔name` half can be sourced from the
   comparison engine rather than copied.)

3. **The live 42 K (`ifc2x4_helper.ts`) is entity parsing, not a map —
   redundant with Conway but needs a shape boundary.** It defines ~900
   entity classes + `FromTape` constructors that parse raw STEP line
   arguments into **web-ifc's `GetLine` output shape**; it backs the
   properties path (`getItemProperties(id)` → `api.getLine(id)` →
   `FromRawLineData[type]`). Conway already owns the equivalent ~900
   entities natively (`src/ifc/ifc4_gen/Ifc*.gen.ts`), so the *parsing* is
   duplicated — but Conway's native entity shape differs from web-ifc's
   `GetLine` shape that Share's Properties panel consumes. This bucket can
   only shrink by reshaping the properties path onto Conway-native
   entities at the compat boundary (a thin adapter from Conway entity →
   `GetLine` shape), which is the same work as giving Conway a structured
   property surface (it only logs today). **Decision point** — see §
   "Properties layer" below.

## Scope (Conway side)

1. **Vendor the load-bearing code only** → `conway/src/compat/web-ifc/`:
   `ifc_api.ts`, the passthrough/proxy family (`ifc_api_proxy_ifc.ts`,
   `ifc_api_proxy_ap214.ts`, the factory + passthrough), and the property
   extractors (`ifc_properties.ts`, `properties.ts`, `ap214_properties.ts`).
   Rewrite `@bldrs-ai/conway/src/X` imports to relative paths. **Do not
   bring** `IFC4x2.ts` (dead dup). Treat the type-map literals
   (`ifc2x4.ts`, `types-map.ts`, `shim_schema_mapping.ts`) and
   `ifc2x4_helper.ts` per the three buckets above, not as files to copy.
2. **Generate the name↔typecode mapping** (bucket 2) from the existing
   codegen that emits `entity_types_ifc.gen.ts`, replacing the three
   hand-maintained literals with one generated table + a lookup helper.
   This is the `nickcastel50` TODO; doing it here is what keeps the map
   from drifting again. **Conway owns these constants** — add a
   **Conway-internal parity test, opaque to consumers** (web-ifc as a
   Conway `devDependency`) asserting the generated `name → code` table is
   identical to web-ifc's `IfcTypesMap`. Consumers import the constants
   from Conway and never see web-ifc; the test guarantees the values equal
   it, so a future web-ifc schema bump fails Conway CI loudly instead of
   silently diverging. (Decision Q2 from the companion doc.)
3. **Decide the properties layer** (bucket 3) before vendoring
   `ifc2x4_helper.ts` — see "Properties layer" below.
4. **Public entry** `src/compat/web-ifc/index.ts` re-exporting `IfcAPI`,
   the `ifc2x4` type surface, `Loadersettings`, and the `IFC*` schema
   constants Share imports (`IFCPRODUCTDEFINITIONSHAPE`, `IFCPROPERTYSET`,
   `IFCRELDEFINESBYPROPERTIES` — see companion §4.3). These constants come
   from the generated mapping in step 2, not a copied literal.
5. **`package.json#exports`**: add
   `"./web-ifc": { "types": "./compiled/src/compat/web-ifc/index.d.ts",
   "import": "./compiled/src/compat/web-ifc/index.js",
   "require": "…" }`. Keep the existing `"./src/*"` glob.
6. **Build/ship**: include the compat tree in `tsc --build` and the
   `files` allowlist so `compiled/src/compat/web-ifc/**` is in the
   published tarball. The new mapping table is generated at the same point
   as the other `*.gen.ts` (codegen, not on every PR).
7. **Test (new in Conway CI)**: open a fixture IFC **and** a fixture STEP
   through `IfcAPI`; assert `StreamAllMeshes` emits geometry and a
   property read returns structured data. This is the contract the
   standalone adapter never tested — make it a Conway gate.
8. **Versioning**: the compat surface ships with Conway's version; the
   `0.23.x` adapter line is abandoned. Use the new release automation to
   cut the first Conway release carrying `./web-ifc` (a good first real
   exercise of it).

## Properties layer — decision point (bucket 3)

The adapter's live 42 K (`ifc2x4_helper.ts`: ~900 entity classes +
`FromTape` + `FromRawLineData`) exists only to produce web-ifc's `GetLine`
output shape for the properties path. Conway already parses these entities
natively (`src/ifc/ifc4_gen/Ifc*.gen.ts`). Two ways to handle it:

- **(a) Vendor as-is now, reshape later.** Bring `ifc2x4_helper.ts` into
  the compat tree unchanged so behavior is identical to today, and treat
  the native-properties reshape as a follow-up. Fastest path to "Share off
  the adapter, on current Conway"; keeps the duplicate entity layer for
  now. Lowest risk, defers the cleanup.
- **(b) Reshape onto Conway-native entities.** Replace `getLine` →
  `FromRawLineData` with a thin `Conway entity → GetLine shape` adapter
  driven by `model.getElementByExpressID()`, deleting the 42 K duplicate.
  This is the same work as `step-support.md`'s structured public property
  surface — do it once, in Conway, and both the compat `IfcAPI` and a
  native Conway property API consume it. More work; removes the duplication
  for good and is the better end-state.

**Recommendation:** (a) for the first cut (unblocks the release-lag fix
immediately), with (b) scheduled as the property-surface slice shared with
`step-support.md` so the duplicate entity layer doesn't become permanent.

## Cross-references / open items

- **Closes `step-support.md` gap #1**: this `./web-ifc` export is (part
  of) the stable public API surface STEP needs. Coordinate the named
  exports so the STEP work and this surface don't diverge.
- **AP203** (decision Q3 from the companion doc): **route AP203 to the
  AP214 proxy — do not fail loudly.** AP203 through the AP214 engine
  succeeds often, which is why `conway_model_loader` has `case
  ModelFormatType.AP203:` fall through to the AP214 loader (logging "AP203
  Step Detected, using AP214 loader"). But the standalone adapter's
  `IfcApiModelPassthroughFactory` only handles `AP214` / `IFC` /
  `default:error` — it has **no `AP203` case**, so AP203 currently *errors*
  through the adapter even though it works natively (`ModelFormatType.AP203
  = 2` is distinct; the detector returns it for CONFIG_CONTROL_DESIGN). So
  the compat factory should **add** the AP203→AP214 route, matching
  `conway_model_loader` — a small improvement, not a regression.
  Correctness hardening (fall-through vs own AP203 gen tree) stays with
  `step-support.md` Phase 4. The `default` branch still errors on a format
  with no proxy at all — unchanged.
- **Deep-import coupling goes away**: once vendored, Conway can refactor
  the internals the adapter reached into (`ifc_step_model`, etc.) without
  breaking an out-of-repo package it doesn't build.
- **Runtime engine swap (stretch)**: keeping the `IfcAPI` shape means
  Share can later flip between this Conway-backed `IfcAPI` and real
  `web-ifc` at runtime — see companion §5 (gated on the web-ifc
  single-thread pin + dual-wasm bundling, not on this work).
</content>
