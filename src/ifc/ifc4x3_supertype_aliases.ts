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

/**
 * IFC4X3 type identity does not survive past {@link Ifc4X3AliasedTypeIndex}:
 * once a record is indexed as `IFCBUILDINGSTOREY` or `IFCBUILDINGELEMENTPROXY`,
 * the entity's own `.type` getter (fixed by its constructor — see the
 * generated `IfcBuildingStorey`/`IfcBuildingElementProxy` classes) answers
 * that IFC4 type and nothing else; there is no side channel carrying "this
 * was really IFCROAD" forward, because the alias is resolved at the keyword
 * lookup itself, before any localID exists to key a side table on.
 *
 * That is harmless for extraction and the spatial tree (issue #280's
 * target) — every reader there wants "an IfcObjectDefinition"/"an
 * IfcProduct" and gets one. It stops being harmless the moment a caller
 * asks for the record's own attribute VALUES under that borrowed type:
 * `IfcApiProxyIfc.getRawLineData` (`ifc_api_proxy_ifc.ts`) exports
 * `shimIfcEntityReverseMap[element.type]` as the web-ifc "type" code, and
 * `getLine`'s `FromRawLineData[type]` converter then reads the record's
 * REAL argument tape positionally against the IFC4 type's field layout.
 * `IfcFacilityPart`'s real argument 9 (`PredefinedType`) is a longer
 * argument list than `IfcBuildingStorey`'s — `FromTape` (`ifc2x4_helper.ts`)
 * reads it as `Elevation` and drops `UsageType` (argument 10) entirely.
 * Reproduced against `KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc`: express ID
 * 37 (`IfcFacilityPart`) comes back from `getLine()` with
 * `Elevation: {type:3, value:"ROADSEGMENT"}` (its real `PredefinedType`
 * enum, misread as a length measure) and no `UsageType` field at all.
 * Since `USE_WEBIFC_SHIM=true` is Share's real build, this is the path an
 * actual property panel reads — codex's review of #706 caught it (P1).
 *
 * {@link originalIfc4x3Keyword} recovers the distinction the ONLY way
 * left after indexing: by reading the keyword text straight back off the
 * source, backward from the record's own address, via
 * `StepModelBase.rawBytesIfResident` — a read-only, best-effort recovery
 * that answers "can't tell" (`undefined`) rather than guessing wrong on a
 * spilled/windowed source that hasn't paged the keyword in.
 */
const ALIAS_TARGET_TYPES: ReadonlySet<EntityTypesIfc> = new Set(
    IFC4X3_SUPERTYPE_ALIASES.values() )

/**
 * Bytes read backward from a record's address, searching for its keyword.
 * Generous margin over the longest keyword this table aliases
 * (`IFCFACILITYPART`, 15 chars) plus `IFCBUILDINGELEMENTPROXY` itself (23
 * chars, the longest thing a match can legitimately turn out to be) and
 * the `(`/whitespace between keyword and first attribute.
 */
const KEYWORD_SCAN_WINDOW = 48

/** Reads the backward-scanned window as text, once per candidate record. */
const WINDOW_DECODER = new TextDecoder()

const isStepWhitespace = ( c: string ): boolean =>
  c === ' ' || c === '\t' || c === '\n' || c === '\r'

const isIdentifierChar = ( c: string ): boolean => /[A-Za-z0-9_]/.test( c )

/**
 * Model surface {@link originalIfc4x3Keyword} needs — the subset of
 * `IfcStepModel` (`StepModelBase`) it reads, kept narrow so this stays
 * testable without constructing a full model.
 */
export interface Ifc4X3KeywordSourceModel {
  recordAddress( localID: number ): number | undefined
  rawBytesIfResident( address: number, length: number ): Uint8Array | undefined
}

/**
 * Recover a record's real IFC4X3 keyword if {@link IFC4X3_SUPERTYPE_ALIASES}
 * mapped it onto `resolvedType` at parse time — `undefined` for a record
 * that genuinely IS `resolvedType`, that isn't one of the two alias target
 * types at all, or whose keyword bytes can't be read back right now.
 *
 * Fast-exits before touching the source for every entity that isn't even a
 * candidate (`resolvedType` not an alias target) — the overwhelming
 * majority of a typical model, so this costs nothing on the hot property
 * -read path for ordinary IFC4 entities.
 *
 * @param model The model `localID` belongs to.
 * @param localID The record to check.
 * @param resolvedType The type conway resolved it to (an entity's `.type`).
 * @return {string | undefined} The real keyword (e.g. `'IFCROAD'`), or
 * undefined per the cases above.
 */
export function originalIfc4x3Keyword(
    model: Ifc4X3KeywordSourceModel,
    localID: number,
    resolvedType: EntityTypesIfc ): string | undefined {

  if ( !ALIAS_TARGET_TYPES.has( resolvedType ) ) {
    return void 0
  }

  const address = model.recordAddress( localID )

  if ( address === void 0 ) {
    return void 0
  }

  const start = Math.max( 0, address - KEYWORD_SCAN_WINDOW )
  const bytes = model.rawBytesIfResident( start, address - start )

  if ( bytes === void 0 || bytes.length === 0 ) {
    return void 0
  }

  const text = WINDOW_DECODER.decode( bytes )

  // Walk backward: optional whitespace, the '(' that opens the record's
  // attribute list (address is defined as right after it — see
  // step_parser.ts's parseInlineElement/the top-level record loop), more
  // optional whitespace, then the keyword itself.
  let i = text.length - 1

  while ( i >= 0 && isStepWhitespace( text[ i ] ) ) { --i }

  if ( i < 0 || text[ i ] !== '(' ) {
    return void 0
  }

  --i
  while ( i >= 0 && isStepWhitespace( text[ i ] ) ) { --i }

  const keywordEnd = i + 1

  while ( i >= 0 && isIdentifierChar( text[ i ] ) ) { --i }

  const keyword = text.slice( i + 1, keywordEnd ).toUpperCase()

  return IFC4X3_SUPERTYPE_ALIASES.has( keyword ) ? keyword : void 0
}

/**
 * Synthetic web-ifc "type" codes for the four keywords
 * {@link IFC4X3_SUPERTYPE_ALIASES} covers, used ONLY by the compat layer
 * (`ifc_api_proxy_ifc.ts`'s `getRawLineData`) once {@link originalIfc4x3Keyword}
 * has told it a record is one of these. Deliberately NOT real web-ifc type
 * hashes (which are all unsigned CRC32-style values, i.e. always positive —
 * none of these entities have one, since web-ifc has never heard of
 * IFC4X3) and deliberately NOT `-1`: `IfcApiProxyIfc.getLine` special-cases
 * exactly `-1` as "no type at all" and drops the record, while any OTHER
 * value with no `FromRawLineData` entry hits its normal
 * "no converter — return the raw, unconverted argument tape" fallback,
 * which is what these want: safer than confidently misreading the
 * argument tape as some other type's fields (codex's review of #706 — see
 * the block comment above), and strictly better than dropping the record
 * outright. `280` for the issue this all traces back to.
 */
export const IFC4X3_WEBIFC_TYPE_CODES: Readonly<Record<string, number>> = {
  IFCROAD: -280001,
  IFCFACILITYPART: -280002,
  IFCPAVEMENT: -280003,
  IFCKERB: -280004,
}
