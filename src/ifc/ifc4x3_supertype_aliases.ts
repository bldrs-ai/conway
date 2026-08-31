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
 * lookup itself, before any localID exists to key a side table on. (A
 * localID-keyed side table populated from THAT call site was considered —
 * see the "provenance capture" note below for why it was not used.)
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
 * {@link checkIfc4x3Provenance} recovers the distinction the ONLY way left
 * after indexing: by reading the keyword text straight back off the
 * source, backward from the record's own address, via
 * `StepModelBase.rawBytesIfResident` — a read-only, synchronous,
 * best-effort recovery.
 *
 * **Provenance capture, considered and rejected (codex's #706 follow-up,
 * P2, option (b)):** could `Ifc4X3AliasedTypeIndex.get()` record the alias
 * decision itself, keyed by something available at that call site, instead
 * of reconstructing it later? No localID exists yet there (`get()` fires
 * during keyword lookup, before the record's local ID is assigned), and
 * the only thing available is the keyword's OWN byte offset — which does
 * NOT correlate 1:1 with the record it belongs to: `get()` is ALSO the
 * call site `step_parser.ts` uses for an INLINE typed value inside the
 * SAME record's attribute list (`IFCROADPARTTYPEENUM(.ROADSEGMENT.)` on
 * `IfcFacilityPart` — reproduced: it fires a second `get()` call between
 * the outer record's own lookup and its `pushEntry`). A queue correlating
 * "the Nth alias hit" to "the Nth record indexed" is wrong on exactly the
 * records this table covers. The only sound version threads `expressID`
 * through `step_parser.ts`'s generic `TypeIndex.get()` call — a shared,
 * heavily-used core interface serving STEP/AP214 too — for an IFC4X3-only
 * need. Not attempted as disproportionate to the fix; see AGENTS.md on
 * keeping a diff minimal and scoped.
 *
 * **Paging the preceding range, considered and partially used (option
 * (a)):** the residency mismatch codex named is real (reproduced below) —
 * `ensureResidentByExpressID`/`ensureLineResident` page only a record's
 * OWN `[address, address+length)`, never bytes before it, so on a
 * spilled/windowed model the keyword can be nonresident even once the
 * record itself is paged in. Paging it INSIDE the scan itself would make
 * `checkIfc4x3Provenance` async, which `getRawLineData`/`getLine` (the web-ifc-
 * compatible surface, synchronous by contract, matching upstream web-ifc)
 * cannot become without a breaking API change — not attempted, same
 * reasoning as above. Widening the SHARED `ensureResidentByLocalID` to
 * always page a margin before every record was also rejected: it is the
 * hot per-record residency path for every STEP/IFC/AP214 read, and the
 * benefit is IFC4X3-alias-specific. Instead, {@link ifc4x3KeywordScanRange}
 * is exposed so `IfcApiProxyIfc.ensureLineResident` — the compat layer's
 * OWN existing async residency hook, already documented as "call this
 * before a synchronous read on a spilled source" and already scoped to
 * IFC — can pre-page the keyword window too, for the two candidate types
 * only. That fixes resolution for every consumer that follows the
 * documented sequencing (which real streaming/windowed loads do).
 *
 * **The backstop, and the part that is NOT optional:** a consumer that
 * skips `ensureLineResident`, or a keyword whose neighbourhood genuinely
 * can't be parsed (long whitespace runs and STEP `/* *\/` comments are
 * both legal there and neither is recognized by this scanner's plain
 * character-class walk — `step_parser.ts`'s own `whitespace()` treats
 * comments as whitespace-equivalent via `commentParser`, which this
 * intentionally does NOT replicate, so a comment there reads as "not a
 * `(`" and correctly falls to `unknown` rather than misparsing), still
 * must not resolve to "confirmed genuine" by default. Reproduced: spilling
 * `KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc` to a 32-byte-chunked external
 * store and paging ONLY the target record's own range (exactly what
 * `ensureResidentByExpressID` does) makes this scanner answer `undefined`
 * for a real `IfcFacilityPart` — indistinguishable, under the OLD two-
 * valued `originalIfc4x3Keyword` contract, from a genuine
 * `IfcBuildingStorey`, which sent `webIfcTypeOf_` straight back to the
 * borrowed converter and reopened the exact corruption #706 fixed, on
 * precisely the large/windowed/spilled models where it is hardest to
 * notice. {@link checkIfc4x3Provenance} therefore returns a THIRD,
 * explicit `'unknown'` outcome the caller must treat as unsafe — see
 * `IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE`.
 */
const ALIAS_TARGET_TYPES: ReadonlySet<EntityTypesIfc> = new Set(
    IFC4X3_SUPERTYPE_ALIASES.values() )

/** The real IFC4 keyword for each alias TARGET type, for a strict match. */
const GENUINE_KEYWORD_BY_TARGET_TYPE: ReadonlyMap<EntityTypesIfc, string> = new Map(
    [ ...ALIAS_TARGET_TYPES ].map( ( entityType ) => [ entityType, EntityTypesIfc[ entityType ] ] ) )

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
 * Model surface {@link checkIfc4x3Provenance} needs — the subset of
 * `IfcStepModel` (`StepModelBase`) it reads, kept narrow so this stays
 * testable without constructing a full model.
 */
export interface Ifc4X3KeywordSourceModel {
  recordAddress( localID: number ): number | undefined
  rawBytesIfResident( address: number, length: number ): Uint8Array | undefined
}

/**
 * The byte range {@link checkIfc4x3Provenance} needs resident to give a
 * definite answer for `localID` — `undefined` when `resolvedType` isn't
 * even a candidate (every ordinary IFC4 entity), so a caller can use this
 * to decide whether pre-paging is worth doing at all. See
 * `IfcApiProxyIfc.ensureLineResident`, the one real consumer: it pages
 * this range (cheaply — two entity types out of ~900, not a hot path)
 * ahead of a synchronous `getLine`, the same "ensure before you read"
 * sequencing it already does for the record's own range.
 *
 * @param model The model `localID` belongs to.
 * @param localID The record that might need its keyword window paged.
 * @param resolvedType The type conway resolved it to (an entity's `.type`).
 * @return {[number, number] | undefined} `[address, length]` to page, or
 * undefined when there is nothing worth pre-paging.
 */
export function ifc4x3KeywordScanRange(
    model: Pick<Ifc4X3KeywordSourceModel, 'recordAddress'>,
    localID: number,
    resolvedType: EntityTypesIfc ): [ number, number ] | undefined {

  if ( !ALIAS_TARGET_TYPES.has( resolvedType ) ) {
    return void 0
  }

  const address = model.recordAddress( localID )

  if ( address === void 0 ) {
    return void 0
  }

  const start = Math.max( 0, address - KEYWORD_SCAN_WINDOW )

  return start === address ? void 0 : [ start, address - start ]
}

/**
 * The three things {@link checkIfc4x3Provenance} can establish about a
 * record whose resolved type is an alias target:
 *
 * - `'aliased'` — confirmed: the source keyword is one of
 *   {@link IFC4X3_SUPERTYPE_ALIASES}'s four. `keyword` names which.
 * - `'genuine'` — confirmed: the source keyword IS `resolvedType`'s own
 *   real IFC4 name (e.g. `'IFCBUILDINGSTOREY'`) — a real IFC4 entity that
 *   happens to share a type with this alias's targets, not an alias hit.
 * - `'unknown'` — NOT confirmed either way (bytes unresident, or the
 *   scan couldn't parse what precedes the record). Callers MUST NOT treat
 *   this as `'genuine'` — that is the exact regression codex's #706
 *   follow-up (P2) named. Route it to a converter-less sentinel instead
 *   (see `IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE`): a real entity losing its
 *   converted property view is a visible, debuggable degradation; silently
 *   misreading an aliased one's fields is not.
 */
export type Ifc4x3Provenance =
  | { readonly status: 'aliased', readonly keyword: string }
  | { readonly status: 'genuine' }
  | { readonly status: 'unknown' }

/**
 * Establish whether a record whose resolved type is an alias target
 * ({@link IFC4X3_SUPERTYPE_ALIASES}'s two IFC4 targets) really is that
 * IFC4 type, or is one of the four IFC4X3 keywords this table aliased
 * onto it — see {@link Ifc4x3Provenance} for the three-way result and its
 * safety contract, and the block comment above this section for why a
 * two-valued "keyword, or nothing" contract (this function's previous
 * shape) was the actual bug codex's #706 follow-up (P2) found.
 *
 * Fast-exits before touching the source for every entity that isn't even
 * a candidate (`resolvedType` not an alias target) — the overwhelming
 * majority of a typical model, so this costs nothing on the hot property
 * -read path for ordinary IFC4 entities. For a genuine record of one of
 * the two target types, this DOES read `resolvedType`'s own name back
 * from the source to distinguish `'genuine'` from `'unknown'` — cheap
 * (bytes usually already resident) but not free; still only paid by the
 * two candidate types.
 *
 * @param model The model `localID` belongs to.
 * @param localID The record to check.
 * @param resolvedType The type conway resolved it to (an entity's `.type`).
 * @return {Ifc4x3Provenance} The established provenance — callers that
 * only care about alias targets at all can check `ALIAS_TARGET_TYPES` (or
 * simply call this and branch) before calling.
 */
export function checkIfc4x3Provenance(
    model: Ifc4X3KeywordSourceModel,
    localID: number,
    resolvedType: EntityTypesIfc ): Ifc4x3Provenance {

  if ( !ALIAS_TARGET_TYPES.has( resolvedType ) ) {
    return { status: 'genuine' }
  }

  const range = ifc4x3KeywordScanRange( model, localID, resolvedType )

  // No margin to scan (record sits at the very start of the source) is
  // not itself inconclusive — there is nothing there but the keyword,
  // same as any other case; fall through to the read below with a
  // zero-length range, which the byte-availability check handles.
  const [ start, length ] = range ?? [ model.recordAddress( localID ), 0 ]

  if ( start === void 0 ) {
    return { status: 'unknown' }
  }

  const bytes = model.rawBytesIfResident( start, length )

  if ( bytes === void 0 ) {
    return { status: 'unknown' }
  }

  const text = WINDOW_DECODER.decode( bytes )

  // Walk backward: optional whitespace, the '(' that opens the record's
  // attribute list (address is defined as right after it — see
  // step_parser.ts's parseInlineElement/the top-level record loop), more
  // optional whitespace, then the keyword itself. Deliberately NOT
  // comment-aware (see the block comment above) — a comment in either gap
  // makes this fall to 'unknown', not misparse.
  let i = text.length - 1

  while ( i >= 0 && isStepWhitespace( text[ i ] ) ) { --i }

  if ( i < 0 || text[ i ] !== '(' ) {
    return { status: 'unknown' }
  }

  --i
  while ( i >= 0 && isStepWhitespace( text[ i ] ) ) { --i }

  const keywordEnd = i + 1

  while ( i >= 0 && isIdentifierChar( text[ i ] ) ) { --i }

  const keyword = text.slice( i + 1, keywordEnd ).toUpperCase()

  if ( IFC4X3_SUPERTYPE_ALIASES.has( keyword ) ) {
    return { status: 'aliased', keyword }
  }

  if ( keyword === GENUINE_KEYWORD_BY_TARGET_TYPE.get( resolvedType ) ) {
    return { status: 'genuine' }
  }

  // Read something, but it matched neither the four aliases nor
  // resolvedType's own name — stay conservative rather than guess.
  return { status: 'unknown' }
}

export const IFC4X3_WEBIFC_TYPE_CODES: Readonly<Record<string, number>> = {
  IFCROAD: -280001,
  IFCFACILITYPART: -280002,
  IFCPAVEMENT: -280003,
  IFCKERB: -280004,
}

/**
 * Reverse of {@link IFC4X3_WEBIFC_TYPE_CODES}: synthetic web-ifc type
 * code -> real IFC4X3 keyword. Derived, never hand-duplicated, so the two
 * tables cannot drift.
 *
 * Consumed by `getIfcType` (`properties.ts`'s `Properties` — `IfcAPI`'s
 * shared, schema-agnostic instance — and `ifc_properties.ts`'s
 * `IfcProperties`, the per-model passthrough) so the TYPE LABEL Share
 * renders for one of these entities (`entityTypeName()` in
 * `itemProperties.jsx`, via `prettyType()`) is the real keyword —
 * `'IFCROAD'` -> "Road", `'IFCFACILITYPART'` -> "Facility Part" — rather
 * than falling through to Share's generic empty/'Element' label. Before
 * this table existed, `IfcTypesMap[type]` (the plain web-ifc-derived
 * lookup both implementations otherwise use) had no entry at all for a
 * synthetic sentinel and answered `undefined` — verified directly against
 * `IfcTypesMap[-280001]` before this change existed.
 *
 * Read-direction only: this is consulted from a numeric TYPE CODE to a
 * NAME, the same direction `IfcTypesMap` itself is read in throughout the
 * compat layer (`ifc_properties.ts`, `properties.ts`) — nothing in conway
 * reads `IfcTypesMap`/`IfcElements` the other way (name -> code), so
 * adding these four keyword strings as `getIfcType` outputs cannot feed a
 * consumer that tries to round-trip a name back to a code conway would
 * then have to recognize.
 */
export const IFC4X3_WEBIFC_TYPE_NAMES: Readonly<Record<number, string>> =
  Object.fromEntries(
      Object.entries( IFC4X3_WEBIFC_TYPE_CODES ).map(
          ( [ keyword, code ] ) => [ code, keyword ] ) )

/**
 * Synthetic web-ifc "type" code for a record whose resolved type is an
 * alias target ({@link IFC4X3_SUPERTYPE_ALIASES}'s two IFC4 targets) but
 * whose provenance {@link checkIfc4x3Provenance} could NOT establish
 * (`{status: 'unknown'}`) — a nonresident keyword window on a
 * spilled/windowed source, or a comment/whitespace shape the scan can't
 * parse. Distinct from every entry in {@link IFC4X3_WEBIFC_TYPE_CODES}
 * (those are for a CONFIRMED alias hit) and, like them, has no
 * `FromRawLineData` entry and is not `-1`, so `getLine` falls back to the
 * raw, unconverted argument tape — the same safe behaviour a confirmed
 * alias gets, for the same reason: a converter for the WRONG type is
 * worse than no converter. Deliberately absent from
 * {@link IFC4X3_WEBIFC_TYPE_NAMES} too — `getIfcType` should answer
 * "don't know" (falls through to `IfcTypesMap`, which has no entry
 * either) rather than confidently label an unconfirmed record, mirroring
 * the property-read side's refusal to guess.
 */
export const IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE = -280099
