import TypeIndex from '../indexing/type_index'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'


/**
 * IFC4X3-only entity keywords, mapped onto their nearest IFC4 supertype so a
 * file declaring `IFC4X3_RC2` / `IFC4X3` / `IFC4X3_ADD2` in `FILE_SCHEMA`
 * (conway parses every such file with the one generated IFC4 schema —
 * `ifc_step_model.ts` imports `SchemaIfc` from `./ifc4_gen/schema_ifc.gen`
 * unconditionally, there is no 4X3 schema build) still resolves through the
 * spatial-decomposition and product-extraction passes instead of dropping
 * silently. See issue #280 and its 2026-08-14 comment, and #495's
 * `KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc` error rows this is written
 * against.
 *
 * This is deliberately NOT a path toward full IFC4X3_ADD2 coverage — that
 * is a full second generated schema (see `scripts/code-gen.cjs`'s pinned
 * revision, which this must not disturb). It is a narrow, data-driven
 * fallback: entity keywords conway's IFC4 keyword hash
 * (`entity_types_search.gen.ts`) does not know are aliased onto the
 * nearest IFC4 type that has the entity's role, so `IfcRelAggregates` /
 * `IfcRelContainedInSpatialStructure` resolve them as `IfcObjectDefinition`
 * and `extractProductGeometry` sees an `IfcProduct`, exactly as they would a
 * real IFC4 entity of that role.
 *
 * Every keyword below maps to an IFC4 type at the SAME inheritance depth
 * from `IfcProduct` as its true 4X3 supertype, which is what keeps the
 * generated field accessors correct: `ObjectPlacement`/`Representation`
 * (IfcProduct) and, for the spatial pair, `LongName`
 * (IfcSpatialElement)/`CompositionType` (IfcSpatialStructureElement) all
 * read from a fixed offset counted from `IfcRoot`, and every one of these
 * 4X3 types shares that exact prefix with its IFC4 stand-in — only
 * subtype-specific attributes trail it, and those are never read by this
 * pipeline. The STEP tokenizer itself doesn't care either way: it walks a
 * record's attribute list by character class (`attributeMap()` in
 * `step_parser.ts`), not by a per-type declared attribute count, so a 4X3
 * entity's longer real attribute list parses without needing to match the
 * IFC4 type's own field list length.
 *
 * - `IFCROAD`, `IFCFACILITYPART` -> `IFCBUILDINGSTOREY`. Both are 4X3
 *   spatial-structure elements (`IfcRoad` : `IfcFacility` :
 *   `IfcSpatialStructureElement`; `IfcFacilityPart` :
 *   `IfcSpatialStructureElement` directly). `IfcSpatialStructureElement`
 *   itself is IFC4's abstract root of that branch — it has no entry in
 *   the generated schema's `constructors` array (only concrete leaf types
 *   do; verified by reading `schema_ifc.gen.ts`, not assumed), so aliasing
 *   onto it directly builds nothing and every reference to it still
 *   resolves to `undefined`. `IfcBuildingStorey` is the concrete,
 *   attribute-compatible stand-in: same `IfcSpatialStructureElement`
 *   prefix (through `ObjectPlacement`/`Representation`/`LongName`/
 *   `CompositionType`), one trailing optional `Elevation` attribute nothing
 *   in this pipeline reads, and it is what conway's schema actually knows
 *   how to instantiate.
 * - `IFCPAVEMENT`, `IFCKERB` -> `IFCBUILDINGELEMENTPROXY`. Both are 4X3
 *   built elements (-> `IfcBuiltElement` -> `IfcElement`) with ordinary
 *   BREP geometry and no IFC4 counterpart; `IfcBuildingElementProxy` is a
 *   concrete IFC4 type, its designated "an element with geometry and no
 *   more specific type" catch-all, the same role these play here.
 */
export const IFC4X3_SUPERTYPE_ALIASES: ReadonlyMap<string, EntityTypesIfc> = new Map([
  [ 'IFCROAD', EntityTypesIfc.IFCBUILDINGSTOREY ],
  [ 'IFCFACILITYPART', EntityTypesIfc.IFCBUILDINGSTOREY ],
  [ 'IFCPAVEMENT', EntityTypesIfc.IFCBUILDINGELEMENTPROXY ],
  [ 'IFCKERB', EntityTypesIfc.IFCBUILDINGELEMENTPROXY ],
])

/** Decodes a miss from the primary hash back to text, once, to consult the alias table. */
const KEYWORD_DECODER = new TextDecoder()

/**
 * Composes conway's generated IFC4 keyword hash (`entity_types_search.gen`)
 * with {@link IFC4X3_SUPERTYPE_ALIASES}. Consulted only when the primary
 * hash misses, so this changes nothing for any IFC4 (or otherwise fully
 * covered) file — every keyword the generated hash itself recognizes
 * resolves exactly as it did before this class existed.
 */
export class Ifc4X3AliasedTypeIndex implements TypeIndex<EntityTypesIfc> {

  /**
   * @param primary_ The generated schema's own keyword hash.
   * @param aliases_ The fallback table, keyed by upper-case keyword text.
   */
  constructor(
      private readonly primary_: TypeIndex<EntityTypesIfc>,
      private readonly aliases_: ReadonlyMap<string, EntityTypesIfc> = IFC4X3_SUPERTYPE_ALIASES ) {}

  /**
   * @param buffer The buffer holding the keyword text to match.
   * @param offset The keyword's start offset in `buffer` (0 if omitted).
   * @param end The keyword's end offset in `buffer`, exclusive (`buffer.length` if omitted).
   * @return {EntityTypesIfc | undefined} The resolved type, from the
   * primary hash or, failing that, the alias table — undefined if neither
   * recognizes the keyword.
   */
  public get( buffer: Uint8Array, offset?: number, end?: number ): EntityTypesIfc | undefined {

    const primaryResult = this.primary_.get( buffer, offset, end )

    if ( primaryResult !== void 0 ) {
      return primaryResult
    }

    const keyword = KEYWORD_DECODER.decode( buffer.subarray( offset ?? 0, end ?? buffer.length ) )

    return this.aliases_.get( keyword )
  }
}
