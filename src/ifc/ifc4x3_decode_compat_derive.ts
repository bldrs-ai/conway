import { Ifc4x3Translation } from './ifc4x3_ifc4_translation'


/**
 * Derives which IFC4 STEP keywords decode correctly, under IFC4's own
 * definition, when they appear in an IFC4X3 file. The committed output of
 * this function is `ifc4x3_ifc4_compat_gen/decode_compat.gen.ts`, written by
 * `yarn code-gen-ifc4x3-compat` (scripts/gen_ifc4x3_decode_compat.mjs).
 * ifc4x3_decode_compat_derive.test.ts recomputes it from the two vendored
 * EXPRESS files and requires equality, so the table cannot drift from the
 * schemas.
 *
 * scripts/schemas/IFC4.exp is IFC-gen-internal's schemas/IFC.exp at the
 * revision scripts/code-gen.cjs pins (IFC_GEN_REVISION), byte for byte: the
 * EXPRESS src/ifc/ifc4_gen was generated from. It is vendored because the
 * drift test must run in CI, where that checkout does not exist.
 *
 * THE RULE (the contract any extension must keep). Compare EXPLICIT
 * attributes only, parsed from the EXPRESS sources (scripts/schemas/IFC4.exp
 * and scripts/schemas/IFC4X3_ADD2.exp). Do not use the generated reflection:
 * it lists inverse attributes as positional fields (IFC4
 * IfcObjectPlacement.PlacesObject carries `offset: 0`), with nothing that
 * tells them apart. An entity keyword shared by both schemas is
 * decode-compatible when it is concrete in IFC4, has the same number of
 * explicit attributes, and at every position both schemas agree on whether
 * the attribute is derived (`*`) and on its aggregation rank, and one of:
 *
 *  (a) same kind, same meaning: identical value shape (defined/simple
 *      types), identical enumeration values, or identical reference domain;
 *  (b) IFC4's domain is a superset of ADD2's. That holds for enumerations
 *      (every ADD2 value is an IFC4 value) and for references/selects
 *      (IfcStyledItem.Styles: IFC4's IfcStyleAssignmentSelect contains every
 *      ADD2 IfcPresentationStyle subtype);
 *  (c) ADD2 widens a reference, and every value outside IFC4's domain is
 *      either an IFC4X3-only type, which the runtime gate refuses as an
 *      unknown keyword (or, for a translated type, only when the
 *      translation target lies inside IFC4's domain), or an IFC4 entity that
 *      the typed getter REJECTS LOUDLY. "Loudly" holds for exactly these
 *      generated getter shapes (verified in step_entity_base.ts and the
 *      ifc4_gen getters; pinned by ifc4x3_decode_compat_derive.test.ts):
 *       - a REQUIRED scalar entity reference: `extractElement` with
 *         `optional: false` throws via `unresolvedReferenceError_`;
 *       - an aggregate of entity references: `extractBufferElement` throws
 *         for every entry;
 *       - a select whose IFC4 domain has no enumeration member: the getter
 *         resolves the value untyped (`extractReference` /
 *         `extractBufferReference`), then an `instanceof` chain over the
 *         members throws for anything else, optional or not.
 *      An OPTIONAL scalar entity reference does NOT qualify: `extractElement`
 *      returns `null` for a mistyped target under the default
 *      `nullOnErrors`, a silent mis-decode. Nor does a select with an
 *      enumeration member: those getters fall back through `??` to the enum
 *      deserialiser (see `extractBufferReference`'s doc-comment), so
 *      out-of-domain values are not rejected by construction. Either shape
 *      makes the position incompatible. The cases this admits:
 *      IfcAxis2Placement3D.Location (IfcCartesianPoint -> IfcPoint,
 *      required), and IfcPropertySingleValue.NominalValue /
 *      IfcMeasureWithUnit.ValueComponent (ADD2's IfcValue adds
 *      IfcURIReference, an IFC4 defined type IFC4's IfcValue lacks);
 *  (d) a rename with the same type at the same position
 *      (IfcPropertySingleValue.Description -> Specification). Decoding is by
 *      position, so the value is right; the IFC4 label is what is shown.
 *
 * Also: if ADD2 makes an attribute OPTIONAL that IFC4 requires, the
 * position is incompatible. A `$` there fails an IFC4 required read, and
 * whether that fails loudly depends on the getter shape.
 *
 * Defined types (the keywords of typed values such as `IFCLABEL('x')`) are
 * compatible when both schemas give them the same value shape.
 *
 * Keywords IFC4 does not know at all are not this table's business. The
 * runtime gate (ifc4x3_ifc4_compat.ts) allows only the translation table's
 * entries, and unknown inline typed values only inside a translated
 * record's masked tail.
 */


/** One explicit attribute, as parsed from EXPRESS. */
export interface ExpressAttribute {
  name: string
  optional: boolean
  derived: boolean
  rank: number
  base: string
}

export interface ExpressEntity {
  name: string
  abstract: boolean
  superType?: string
  explicit: ExpressAttribute[]
  derivedRedeclarations: Set<string>
}

export type ExpressType =
  { kind: 'enum', values: Set<string> } |
  { kind: 'select', members: string[] } |
  { kind: 'defined', rank: number, base: string }

export interface ExpressSchema {
  entities: Map<string, ExpressEntity>
  types: Map<string, ExpressType>
  subTypes: Map<string, string[]>
}


const AGGREGATE_PREFIX =
  /^(SET|LIST|ARRAY|BAG)\s*\[[^\]]*\]\s*OF\s+((UNIQUE|OPTIONAL)\s+)*/i

/**
 * Split an EXPRESS attribute/underlying type spec into aggregation rank and
 * base type name.
 *
 * @param spec e.g. `OPTIONAL SET [1:?] OF IfcStyleAssignmentSelect`.
 * @return {object} Rank, base (upper case, sized STRING/BINARY normalised),
 * and whether the spec was OPTIONAL.
 */
function parseTypeSpec( spec: string ): { rank: number, base: string, optional: boolean } {

  let rest = spec.trim()
  let optional = false

  if ( /^OPTIONAL\s+/i.test( rest ) ) {
    optional = true
    rest = rest.replace( /^OPTIONAL\s+/i, '' )
  }

  let rank = 0

  for ( let match = AGGREGATE_PREFIX.exec( rest ); match !== null;
    match = AGGREGATE_PREFIX.exec( rest ) ) {
    ++rank
    rest = rest.slice( match[ 0 ].length )
  }

  // STRING(22) FIXED / BINARY(32) decode the same as their unsized forms.
  const base = rest.trim().toUpperCase().replace( /^(STRING|BINARY)\b.*$/, '$1' )

  return { rank, base, optional }
}


/**
 * Parse the entity and type declarations of an EXPRESS schema. This is not
 * a general EXPRESS parser. It covers the declaration shapes the IFC4 and
 * IFC4X3_ADD2 schemas use, and throws on anything it cannot place rather
 * than guessing.
 *
 * @param text The EXPRESS source.
 * @return {ExpressSchema} Entities, types, and the direct-subtype map.
 */
export function parseExpressSchema( text: string ): ExpressSchema {

  const entities = new Map<string, ExpressEntity>()
  const types = new Map<string, ExpressType>()
  const subTypes = new Map<string, string[]>()

  for ( const match of text.matchAll( /\bTYPE\s+(\w+)\s*=\s*([\s\S]*?);/g ) ) {

    const name = match[ 1 ].toUpperCase()
    const body = match[ 2 ].trim()

    if ( /^ENUMERATION\s+OF/i.test( body ) ) {
      const values = body.replace( /^ENUMERATION\s+OF\s*\(/i, '' ).replace( /\)\s*$/, '' )
      types.set( name, {
        kind: 'enum',
        values: new Set( values.split( ',' ).map( ( v ) => v.trim().toUpperCase() ) ),
      } )
    } else if ( /^SELECT\b/i.test( body ) ) {
      const members = body.replace( /^SELECT\s*\(/i, '' ).replace( /\)\s*$/, '' )
      types.set( name, {
        kind: 'select',
        members: members.split( ',' ).map( ( v ) => v.trim().toUpperCase() ),
      } )
    } else {
      const { rank, base } = parseTypeSpec( body )
      types.set( name, { kind: 'defined', rank, base } )
    }
  }

  for ( const match of text.matchAll( /\bENTITY\s+(\w+)([\s\S]*?)END_ENTITY;/g ) ) {

    const name = match[ 1 ].toUpperCase()
    const body = match[ 2 ]
    const headerEnd = body.indexOf( ';' )
    const header = body.slice( 0, headerEnd )
    const superMatch = /SUBTYPE\s+OF\s*\(\s*(\w+)\s*\)/i.exec( header )
    const superType = superMatch?.[ 1 ].toUpperCase()

    const sections = body.slice( headerEnd + 1 )
        .split( /^\s*(INVERSE|DERIVE|WHERE|UNIQUE)\b/m )

    const explicit: ExpressAttribute[] = []

    for ( const declaration of sections[ 0 ].split( ';' ) ) {

      const flat = declaration.replace( /\s+/g, ' ' ).trim()

      if ( flat.length === 0 ) {
        continue
      }

      const colon = flat.indexOf( ':' )

      if ( colon < 0 || flat.startsWith( 'SELF\\' ) ) {
        throw new Error( `Unhandled explicit declaration in ${name}: '${flat}'` )
      }

      const { rank, base, optional } = parseTypeSpec( flat.slice( colon + 1 ) )

      for ( const attributeName of flat.slice( 0, colon ).split( ',' ) ) {
        explicit.push( {
          name: attributeName.trim(),
          optional,
          derived: false,
          rank,
          base,
        } )
      }
    }

    const derivedRedeclarations = new Set<string>()

    for ( let where = 1; where + 1 < sections.length; where += 2 ) {

      if ( sections[ where ].toUpperCase() !== 'DERIVE' ) {
        continue
      }

      for ( const redeclared of
        sections[ where + 1 ].matchAll( /SELF\\\w+\.(\w+)\s*:/g ) ) {
        derivedRedeclarations.add( redeclared[ 1 ] )
      }
    }

    entities.set( name, {
      name,
      abstract: /\bABSTRACT\b/i.test( header ),
      superType,
      explicit,
      derivedRedeclarations,
    } )

    if ( superType !== void 0 ) {
      let list = subTypes.get( superType )

      if ( list === void 0 ) {
        subTypes.set( superType, list = [] )
      }

      list.push( name )
    }
  }

  return { entities, types, subTypes }
}


/**
 * The positional explicit-attribute layout of an entity, supertypes first,
 * with derived redeclarations (`*` in the file) applied from the entity
 * itself and every supertype down to it.
 *
 * @param schema The parsed schema.
 * @param name Entity name (upper case).
 * @return {ExpressAttribute[]} The layout.
 */
export function flatLayout( schema: ExpressSchema, name: string ): ExpressAttribute[] {

  const chain: ExpressEntity[] = []

  for ( let at: string | undefined = name; at !== void 0; ) {

    const entity = schema.entities.get( at )

    if ( entity === void 0 ) {
      throw new Error( `Unknown supertype ${at}` )
    }

    chain.unshift( entity )
    at = entity.superType
  }

  const layout = chain.flatMap( ( entity ) => entity.explicit.map( ( a ) => ( { ...a } ) ) )

  for ( const entity of chain ) {
    for ( const attribute of layout ) {
      if ( entity.derivedRedeclarations.has( attribute.name ) ) {
        attribute.derived = true
      }
    }
  }

  return layout
}


const SIMPLE_TYPES = new Set( [
  'REAL', 'INTEGER', 'NUMBER', 'BOOLEAN', 'LOGICAL', 'STRING', 'BINARY',
] )

/**
 * How a value of a named type is written and decoded, for types that are
 * not references: the simple base after following defined types, with the
 * total rank. `undefined` for entity/select/enum (compared separately).
 *
 * @param schema The parsed schema.
 * @param base Type name.
 * @param rank Aggregation rank accumulated so far.
 * @return {string | undefined} Shape string, e.g. `2:REAL`.
 */
function valueShape( schema: ExpressSchema, base: string, rank: number ): string | undefined {

  if ( SIMPLE_TYPES.has( base ) ) {
    return `${rank}:${base}`
  }

  const type = schema.types.get( base )

  if ( type?.kind === 'defined' ) {
    return valueShape( schema, type.base, rank + type.rank )
  }

  return void 0
}


/**
 * The set of things a reference-kind position (entity or select) can hold:
 * `E:<concrete entity>` for each concrete entity in the subtype closure, and
 * `T:<defined type>` for each typed-value member of a select. Enum members
 * of a select yield `N:<enum>`.
 *
 * @param schema The parsed schema.
 * @param base Entity or select name.
 * @param into Accumulator.
 * @return {Set<string>} The domain.
 */
function referenceDomain(
    schema: ExpressSchema, base: string, into: Set<string> = new Set() ): Set<string> {

  const entity = schema.entities.get( base )

  if ( entity !== void 0 ) {

    if ( !entity.abstract ) {
      into.add( `E:${base}` )
    }

    for ( const sub of schema.subTypes.get( base ) ?? [] ) {
      referenceDomain( schema, sub, into )
    }

    return into
  }

  const type = schema.types.get( base )

  if ( type?.kind === 'select' ) {
    for ( const member of type.members ) {
      referenceDomain( schema, member, into )
    }
  } else if ( type?.kind === 'defined' ) {
    into.add( `T:${base}` )
  } else if ( type?.kind === 'enum' ) {
    into.add( `N:${base}` )
  } else {
    throw new Error( `Unresolvable select member ${base}` )
  }

  return into
}


type PositionKind = 'value' | 'enum' | 'reference' | 'select'

/**
 * Classify a base type name.
 *
 * @param schema The parsed schema.
 * @param base Type name.
 * @return {PositionKind} Its kind.
 */
function kindOf( schema: ExpressSchema, base: string ): PositionKind {

  if ( schema.entities.has( base ) ) {
    return 'reference'
  }

  const type = schema.types.get( base )

  if ( type?.kind === 'select' ) {
    return 'select'
  }

  if ( type?.kind === 'enum' ) {
    return 'enum'
  }

  if ( valueShape( schema, base, 0 ) !== void 0 ) {
    return 'value'
  }

  throw new Error( `Unresolvable type ${base}` )
}


/** Outcome of comparing one attribute position. */
type PositionOutcome =
  { ok: true, rule: 'a' | 'b' | 'c', note?: string } |
  { ok: false, reason: string }

/**
 * Compare one explicit-attribute position (rules a-c in the module
 * comment; rule d, renames, is reported by the caller).
 *
 * @param ifc4 IFC4 schema.
 * @param add2 ADD2 schema.
 * @param p4 IFC4 attribute.
 * @param p3 ADD2 attribute.
 * @param translations The translation table.
 * @return {PositionOutcome} Whether IFC4 decodes every ADD2 value correctly.
 */
function comparePosition(
    ifc4: ExpressSchema,
    add2: ExpressSchema,
    p4: ExpressAttribute,
    p3: ExpressAttribute,
    translations: Readonly<Record<string, Ifc4x3Translation>> ): PositionOutcome {

  if ( p4.derived !== p3.derived ) {
    return { ok: false, reason: 'derived in one schema only' }
  }

  if ( p4.derived ) {
    return { ok: true, rule: 'a' }
  }

  if ( p4.rank !== p3.rank ) {
    return { ok: false, reason: `rank ${p4.rank} vs ${p3.rank}` }
  }

  if ( p3.optional && !p4.optional ) {
    return { ok: false, reason: 'OPTIONAL in ADD2 but required in IFC4' }
  }

  const k4 = kindOf( ifc4, p4.base )
  const k3 = kindOf( add2, p3.base )

  if ( k4 === 'value' || k3 === 'value' ) {

    const s4 = valueShape( ifc4, p4.base, 0 )
    const s3 = valueShape( add2, p3.base, 0 )

    return s4 !== void 0 && s4 === s3 ?
      { ok: true, rule: 'a' } :
      { ok: false, reason: `value ${p4.base}(${s4}) vs ${p3.base}(${s3})` }
  }

  if ( k4 === 'enum' || k3 === 'enum' ) {

    const e4 = ifc4.types.get( p4.base )
    const e3 = add2.types.get( p3.base )

    if ( e4?.kind !== 'enum' || e3?.kind !== 'enum' ) {
      return { ok: false, reason: `enum ${p4.base} vs non-enum ${p3.base}` }
    }

    const missing = [ ...e3.values ].filter( ( v ) => !e4.values.has( v ) )

    if ( missing.length > 0 ) {
      return {
        ok: false,
        reason: `enum ${p3.base} values ${missing.join( ',' )} not in IFC4 ${p4.base}`,
      }
    }

    return e4.values.size === e3.values.size ?
      { ok: true, rule: 'a' } : { ok: true, rule: 'b', note: `enum ${p4.base} superset` }
  }

  const d4 = referenceDomain( ifc4, p4.base )
  const d3 = referenceDomain( add2, p3.base )
  const extras = [ ...d3 ].filter( ( member ) => !d4.has( member ) ).sort()

  if ( extras.length === 0 ) {
    return d4.size === d3.size && k4 === k3 ?
      { ok: true, rule: 'a' } :
      { ok: true, rule: 'b', note: `${p4.base} domain superset of ${p3.base}` }
  }

  const loud: string[] = []

  for ( const extra of extras ) {

    const [ tag, name ] = extra.split( ':' )

    if ( tag === 'E' && !ifc4.entities.has( name ) ) {

      const translation = translations[ name ]

      if ( translation !== void 0 && !d4.has( `E:${translation.target}` ) ) {
        return {
          ok: false,
          reason: `translated ${name} -> ${translation.target} outside IFC4 ${p4.base}`,
        }
      }

      continue
    }

    if ( tag === 'T' && !ifc4.types.has( name ) ) {
      continue
    }

    // An IFC4-known value outside IFC4's declared domain: admissible only
    // for the getter shapes that reject it loudly (module comment, rule c).
    const loudReference =
      tag === 'E' && k4 === 'reference' && ( !p4.optional || p4.rank > 0 )
    const loudSelect =
      ( tag === 'E' || tag === 'T' ) && k4 === 'select' &&
      ![ ...d4 ].some( ( member ) => member.startsWith( 'N:' ) )

    if ( loudReference || loudSelect ) {
      loud.push( name )
      continue
    }

    return {
      ok: false,
      reason: `${extra} allowed by ADD2 ${p3.base} is outside IFC4 ${p4.base} ` +
        `and would not be rejected loudly`,
    }
  }

  return loud.length > 0 ?
    { ok: true, rule: 'c', note: `${p3.base} widens ${p4.base}; loud: ${loud.join( ',' )}` } :
    { ok: true, rule: 'c', note: `${p3.base} widens ${p4.base} with IFC4X3-only types` }
}


/** The derived, committed compatibility table. */
export interface Ifc4x3DecodeCompat {

  /** Keywords (entities and defined types) IFC4 decodes correctly. */
  compatible: string[]

  /**
   * For compatible keywords that are not position-for-position identical:
   * `<index> <IFC4 name>: <rule> <note>` per relaxed position.
   */
  relaxed: Record<string, string[]>

  /** Shared keywords that are NOT compatible, with the first reason. */
  incompatible: Record<string, string>

  /** Per translation-table entry, the violations found (empty = sound). */
  translationChecks: Record<string, string[]>
}


/**
 * Derive the table. Pure: same inputs, same (sorted) output.
 *
 * @param ifc4Express IFC4 EXPRESS source text.
 * @param add2Express IFC4X3_ADD2 EXPRESS source text.
 * @param translations The translation table.
 * @return {Ifc4x3DecodeCompat} The table.
 */
export function deriveIfc4x3DecodeCompat(
    ifc4Express: string,
    add2Express: string,
    translations: Readonly<Record<string, Ifc4x3Translation>> ): Ifc4x3DecodeCompat {

  const ifc4 = parseExpressSchema( ifc4Express )
  const add2 = parseExpressSchema( add2Express )

  const compatible: string[] = []
  const relaxed: Record<string, string[]> = {}
  const incompatible: Record<string, string> = {}

  for ( const name of [ ...ifc4.entities.keys() ].sort() ) {

    if ( !add2.entities.has( name ) ) {
      continue
    }

    if ( ifc4.entities.get( name )!.abstract ) {
      incompatible[ name ] = 'abstract in IFC4'
      continue
    }

    const l4 = flatLayout( ifc4, name )
    const l3 = flatLayout( add2, name )

    if ( l4.length !== l3.length ) {
      incompatible[ name ] = `explicit attribute count ${l4.length} vs ${l3.length}`
      continue
    }

    const notes: string[] = []
    let failure: string | undefined

    for ( let where = 0; where < l4.length && failure === void 0; ++where ) {

      const outcome = comparePosition( ifc4, add2, l4[ where ], l3[ where ], translations )

      if ( !outcome.ok ) {
        failure = `${where} ${l4[ where ].name}: ${outcome.reason}`
        break
      }

      if ( outcome.rule !== 'a' ) {
        notes.push( `${where} ${l4[ where ].name}: (${outcome.rule}) ${outcome.note}` )
      }

      if ( l4[ where ].name !== l3[ where ].name ) {
        notes.push( `${where} ${l4[ where ].name}: (d) renamed ${l3[ where ].name} in ADD2` )
      }
    }

    if ( failure !== void 0 ) {
      incompatible[ name ] = failure
      continue
    }

    compatible.push( name )

    if ( notes.length > 0 ) {
      relaxed[ name ] = notes
    }
  }

  for ( const [ name, type ] of [ ...ifc4.types ].sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) ) ) {

    const other = add2.types.get( name )

    if ( type.kind !== 'defined' || other?.kind !== 'defined' ) {
      continue
    }

    const s4 = valueShape( ifc4, name, 0 )
    const s3 = valueShape( add2, name, 0 )

    if ( s4 !== void 0 && s4 === s3 ) {
      compatible.push( name )
    } else {
      incompatible[ name ] = `value shape ${s4} vs ${s3}`
    }
  }

  compatible.sort()

  const translationChecks: Record<string, string[]> = {}

  for ( const [ source, translation ] of Object.entries( translations ) ) {

    const problems: string[] = []
    const target = ifc4.entities.get( translation.target )

    if ( ifc4.entities.has( source ) ) {
      problems.push( 'source is an IFC4 keyword; translation would shadow it' )
    }

    if ( !add2.entities.has( source ) ) {
      problems.push( 'source is not an IFC4X3 ADD2 entity' )
    }

    if ( target === void 0 || target.abstract ) {
      problems.push( 'target is not a concrete IFC4 entity' )
    }

    if ( problems.length === 0 ) {

      const l4 = flatLayout( ifc4, translation.target )
      const l3 = flatLayout( add2, source )

      if ( l4.length !== translation.targetExplicitCount ) {
        problems.push( `targetExplicitCount ${translation.targetExplicitCount} but IFC4 ` +
          `${translation.target} has ${l4.length}` )
      }

      if ( translation.decodedPrefix > Math.min( l4.length, l3.length ) ) {
        problems.push( 'decodedPrefix exceeds a layout' )
      } else {
        for ( let where = 0; where < translation.decodedPrefix; ++where ) {
          const outcome = comparePosition( ifc4, add2, l4[ where ], l3[ where ], translations )

          if ( !outcome.ok || l4[ where ].name !== l3[ where ].name ) {
            problems.push( `prefix ${where} ${l4[ where ].name}/${l3[ where ].name}: ` +
              ( outcome.ok ? 'renamed' : outcome.reason ) )
          }
        }
      }

      // Masked positions read as `$` through getOffsetAndEndCursor, which
      // only the scalar getters use. Aggregate getters take getOffsetCursor
      // (no buffer to redirect), so a masked aggregate would throw instead of
      // reading as absent.
      for ( let where = translation.decodedPrefix; where < l4.length; ++where ) {
        if ( !l4[ where ].optional ) {
          problems.push( `masked ${where} ${l4[ where ].name} is required in IFC4` )
        }

        if ( l4[ where ].rank > 0 ) {
          problems.push( `masked ${where} ${l4[ where ].name} is an aggregate` )
        }
      }
    }

    translationChecks[ source ] = problems
  }

  return { compatible, relaxed, incompatible, translationChecks }
}
