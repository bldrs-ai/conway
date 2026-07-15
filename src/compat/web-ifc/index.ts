// Public entry for Conway's `web-ifc`-compatible IFC API surface.
//
// This is the engine seam Bldrs Share consumes via its `webIfcShimAlias`
// (it imports `IfcAPI` from `web-ifc`, aliased here at build time). It
// presents the `web-ifc` `IfcAPI` shape — `Init` / `OpenModel` /
// `StreamAllMeshes` / `GetGeometry` / `GetCoordinationMatrix` / a
// `properties` object — backed by the Conway engine, so a single
// dependency on `@bldrs-ai/conway` replaces the separately-versioned
// `@bldrs-ai/conway-web-ifc-adapter` package.
//
// `ifc_api` re-exports the `ifc2x4` type-code constants (IFCWALL,
// IFCPROPERTYSET, IFCRELDEFINESBYPROPERTIES, …), so consumers that read
// those off `web-ifc` resolve them here too.
//
// See design/new/web-ifc-compat-surface.md for scope + the Conway-owned
// constants / AP203 / properties-layer decisions.
export * from './ifc_api'

// Conway extension: the structured progress contract carried by
// `Loadersettings.ON_PROGRESS` / `OpenModelAsync` (issue #301). Exported
// here so shim consumers (Share) can type progress handlers without
// reaching into conway internals.
export {
  ProgressEvent,
  ProgressCallback,
  ProgressPhase,
  ProgressUnit,
} from '../../core/progress'
