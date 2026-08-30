import { EntityDescription } from '../core/entity_description'
import { blobEquals } from '../indexing/hashing'
import TypeIndex from '../indexing/type_index'
import StepEntityConstructor from '../step/step_entity_constructor'
import StepEntitySchema from '../step/step_entity_schema'
import StepParser from '../step/parsing/step_parser'
import {
  skipValue,
  stepExtractArrayBegin,
  stepExtractArrayToken,
  stepExtractNumber,
  stepExtractOptional,
} from '../step/parsing/step_deserialization_functions'
import {
  geometric_representation_item,
  shape_representation,
} from './AP214E3_2010_gen'
import EntityTypesAP214, {
  EntityTypesAP214Count,
} from './AP214E3_2010_gen/entity_types_ap214.gen'
import EntityTypesAP214Search from './AP214E3_2010_gen/entity_types_search.gen'
import SchemaAP214 from './AP214E3_2010_gen/schema_ap214.gen'


/*
 * ---------------------------------------------------------------------------
 * A hand-written "shadow schema" for AP242 tessellated part geometry.
 * ---------------------------------------------------------------------------
 *
 * These are the FIRST non-generated STEP entity classes in this repo, so the
 * reason they are hand-written rather than generated belongs in one place:
 *
 *  - The AP214 tree under `AP214E3_2010_gen/` is emitted by
 *    `scripts/code-gen.cjs`, which pins `bldrs-ai/IFC-gen-internal` — a
 *    private repository not reachable from the environments this code is
 *    maintained from. "Just regenerate against AP242" is not an available
 *    option here.
 *  - Even where it is, regenerating renumbers `EntityTypesAP214` across all
 *    1111 generated files. `design/new/step-metadata-nist.md` §"The AP242
 *    wrinkle" records the standing decision this follows: AP242 files are
 *    parsed with the AP214 schema, and the AP242-only entities that matter
 *    are handled explicitly rather than by adopting a second generated tree.
 *
 * So the four entities needed for tessellated part shape are declared here
 * against ids allocated PAST the generated enum (`EntityTypesAP214Count + n`),
 * with a composite type index that consults the generated minimal perfect hash
 * first and this small table only on a miss. Nothing generated is modified: no
 * `.gen.ts` file changes, and no generated class's static `query` is mutated.
 *
 * Attribute access works because it is positional: `getOffsetCursor` reads a
 * record's vtable by slot and never consults the type index, so a hand-written
 * class with the right slot numbers reads a record exactly as a generated one
 * would.
 *
 * Deliberately NOT covered by this cut: `COMPLEX_TRIANGULATED_SURFACE_SET`,
 * `TESSELLATED_CURVE_SET`, `TESSELLATED_GEOMETRIC_SET` and the rest of the
 * annotation tessellation family. In the NIST AP242 PMI corpus those carry PMI
 * annotation geometry rather than part shape, so registering them would leak
 * annotations into the rendered model.
 */

/**
 * Type ids for the shadow-schema entities, allocated past the generated enum
 * so they can never collide with a generated id.
 *
 * A plain object rather than an `enum` because TypeScript will not let one
 * enum extend another — every consumer treats these as `EntityTypesAP214`
 * values, which is what the cast expresses.
 */
export const EntityTypesAP214Tessellated = {
  COORDINATES_LIST: ( EntityTypesAP214Count + 0 ) as EntityTypesAP214,
  COMPLEX_TRIANGULATED_FACE: ( EntityTypesAP214Count + 1 ) as EntityTypesAP214,
  TESSELLATED_SOLID: ( EntityTypesAP214Count + 2 ) as EntityTypesAP214,
  TESSELLATED_SHAPE_REPRESENTATION: ( EntityTypesAP214Count + 3 ) as EntityTypesAP214,
} as const

/**
 * STEP keyword for each shadow type. The parse-time lookup compares against
 * the encoded bytes below; the reverse map exists so diagnostics and the
 * regression CSV print a name instead of `undefined`.
 */
const TESSELLATED_TYPE_NAMES: readonly [ string, EntityTypesAP214 ][] = [
  [ 'COORDINATES_LIST', EntityTypesAP214Tessellated.COORDINATES_LIST ],
  [ 'COMPLEX_TRIANGULATED_FACE', EntityTypesAP214Tessellated.COMPLEX_TRIANGULATED_FACE ],
  [ 'TESSELLATED_SOLID', EntityTypesAP214Tessellated.TESSELLATED_SOLID ],
  [
    'TESSELLATED_SHAPE_REPRESENTATION',
    EntityTypesAP214Tessellated.TESSELLATED_SHAPE_REPRESENTATION,
  ],
]

/**
 * One past the highest shadow type id — the size every type index and
 * type-id loop over the extended schema has to be built with.
 */
export const EntityTypesAP214ExtendedCount =
  EntityTypesAP214Count + TESSELLATED_TYPE_NAMES.length

const TESSELLATED_NAME_ENCODER = new TextEncoder()

const TESSELLATED_TYPE_KEYS: readonly Uint8Array[] =
  TESSELLATED_TYPE_NAMES.map( ( [ name ] ) => TESSELLATED_NAME_ENCODER.encode( name ) )

const TESSELLATED_TYPE_IDS: readonly EntityTypesAP214[] =
  TESSELLATED_TYPE_NAMES.map( ( [ , typeID ] ) => typeID )

const TESSELLATED_TYPE_NAME_BY_ID: ReadonlyMap< number, string > =
  new Map( TESSELLATED_TYPE_NAMES.map( ( [ name, typeID ] ) => [ typeID as number, name ] ) )

/**
 * Inherited-attribute count (`representation_item.name`) and inheritance depth
 * shared by every shadow entity hanging off `geometric_representation_item`.
 * Both only matter for complex (multi-mapped) records, which none of these
 * entities is, but the generated accessors pass them everywhere and these
 * follow the same convention. Depth 2 is
 * representation_item -> geometric_representation_item -> this.
 */
const TESSELLATED_ITEM_BASE_OFFSET = 1
const TESSELLATED_ITEM_DEPTH = 2


/**
 * Name a type id, including the shadow types the generated enum has no reverse
 * mapping for.
 *
 * Every `EntityTypesAP214[ type ]` site that can be handed a shadow-typed
 * element (the load report's geometry breakdown, the regression CSV's type
 * column, the properties shim's arbitrary-entity fallback, the CLI listing)
 * goes through this instead, so none of them prints `undefined`.
 *
 * @param type The type id to name.
 * @return {string} The STEP keyword for the type.
 */
export function ap214TypeName( type: EntityTypesAP214 ): string {

  const generatedName = EntityTypesAP214[ type ] as string | undefined

  return generatedName ?? TESSELLATED_TYPE_NAME_BY_ID.get( type ) ?? `UNKNOWN_TYPE_${type}`
}


/**
 * Shared base for the tessellated geometric representation items, carrying the
 * two list readers they need.
 *
 * Abstract and never registered in the schema's constructor table, so it adds
 * no type id — it exists purely so the readers can reach the protected vtable
 * accessors on `StepEntityBase`.
 */
abstract class tessellated_item extends geometric_representation_item {

  /**
   * Read a `LIST OF LIST OF NUMBER` attribute at a vtable slot — the shape
   * both the strips/fans and the normals lists take.
   *
   * The same loop the generator emits for nested list attributes (see
   * `b_spline_surface.gen.ts` `control_points_list`), with a number rather
   * than a reference as the leaf.
   *
   * @param offset The vtable slot to read.
   * @return {number[][]} The nested list, empty when the attribute is `$`.
   */
  protected extractNumberListList( offset: number ): number[][] {

    let   cursor    =
      this.getOffsetCursor( offset, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH )
    const buffer    = this.buffer
    const endCursor = buffer.length

    if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
      return []
    }

    const value: number[][] = []

    let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
    cursor = Math.abs( signedCursor0 )

    while ( signedCursor0 >= 0 ) {

      const row: number[] = []

      let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor1 )

      while ( signedCursor1 >= 0 ) {

        const element = stepExtractNumber( buffer, cursor, endCursor )

        if ( element === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }

        row.push( element )
        cursor = skipValue( buffer, cursor, endCursor )
        signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )
      }

      value.push( row )
      signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )
    }

    return value
  }

  /**
   * Read a flat `LIST OF NUMBER` attribute at a vtable slot.
   *
   * @param offset The vtable slot to read.
   * @return {number[]} The list, empty when the attribute is `$`.
   */
  protected extractNumberList( offset: number ): number[] {

    let   cursor    =
      this.getOffsetCursor( offset, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH )
    const buffer    = this.buffer
    const endCursor = buffer.length

    if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
      return []
    }

    const value: number[] = []

    let signedCursor = stepExtractArrayBegin( buffer, cursor, endCursor )
    cursor = Math.abs( signedCursor )

    while ( signedCursor >= 0 ) {

      const element = stepExtractNumber( buffer, cursor, endCursor )

      if ( element === void 0 ) {
        throw new Error( 'Value in STEP was incorrectly typed' )
      }

      value.push( element )
      cursor = skipValue( buffer, cursor, endCursor )
      signedCursor = stepExtractArrayToken( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor )
    }

    return value
  }
}


/**
 * AP242 `COORDINATES_LIST` — the shared point table a tessellated solid's
 * faces index into.
 *
 * Attribute slots: 0 name, 1 npoints, 2 points.
 */
export class coordinates_list extends tessellated_item {

  /**
   * @return {EntityTypesAP214} This entity's type id.
   */
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214Tessellated.COORDINATES_LIST
  }

  /**
   * @return {number} The declared number of points in the list.
   */
  public get npoints(): number {
    return this.extractNumber( 1, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH, false )
  }

  /**
   * The coordinate table, materialised in JS.
   *
   * The geometry path does NOT go through this — it hands slot 2's raw STEP
   * text straight to `Geometry::ExtractVertices` via `extractParseBuffer`, so
   * a 1636-point table never becomes 1636 JS arrays during a load. This getter
   * is for tests and diagnostics.
   *
   * @return {number[][]} One `[x, y, z]` row per point.
   */
  public get points(): number[][] {
    return this.extractNumberListList( 2 )
  }

  public static readonly query = [ EntityTypesAP214Tessellated.COORDINATES_LIST ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214Tessellated.COORDINATES_LIST
}


/**
 * AP242 `COMPLEX_TRIANGULATED_FACE` — one face of a tessellated solid, encoded
 * as triangle strips and/or fans over the shared coordinates list.
 *
 * Attribute slots, verified against `nist_ftc_08_asme1_ap242-e1-tg.stp`:
 *
 * | slot | attribute       |
 * |------|-----------------|
 * | 0    | name            |
 * | 1    | coordinates     |
 * | 2    | pnmax           |
 * | 3    | normals         |
 * | 4    | geometric_link  |
 * | 5    | pnindex         |
 * | 6    | triangle_strips |
 * | 7    | triangle_fans   |
 *
 * The hazard is slot 4: `geometric_link` (a `PLANE` or `CYLINDRICAL_SURFACE`
 * reference, or `$`) sits BETWEEN `normals` and `pnindex`. Reading `pnindex`
 * from slot 4 does not throw — it silently shifts every later attribute by one
 * and yields plausible-looking garbage.
 */
export class complex_triangulated_face extends tessellated_item {

  /**
   * @return {EntityTypesAP214} This entity's type id.
   */
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214Tessellated.COMPLEX_TRIANGULATED_FACE
  }

  /**
   * @return {coordinates_list} The point table this face indexes into.
   */
  public get coordinates(): coordinates_list {
    return this.extractElement(
        1, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH, false, coordinates_list )
  }

  /**
   * @return {number} The highest value `pnindex` may take.
   */
  public get pnmax(): number {
    return this.extractNumber( 2, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH, false )
  }

  /**
   * Face normals: a single entry (one normal for the whole face) or one per
   * `pnindex` position. The geometry path does not use them — `Geometry`
   * stores positions only and shades faceted, exactly as the IFC
   * `IfcTriangulatedFaceSet` path already does — but the winding test reads
   * them, because they are the file's own statement of which way each triangle
   * should face.
   *
   * @return {number[][]} One `[x, y, z]` row per normal.
   */
  public get normals(): number[][] {
    return this.extractNumberListList( 3 )
  }

  /**
   * @return {number[]} 1-based indices into the coordinates list, indexed in
   * turn (1-based) by the values in the strips and fans.
   */
  public get pnindex(): number[] {
    return this.extractNumberList( 5 )
  }

  /**
   * @return {number[][]} Triangle strips, as 1-based indices into `pnindex`.
   */
  public get triangle_strips(): number[][] {
    return this.extractNumberListList( 6 )
  }

  /**
   * @return {number[][]} Triangle fans, as 1-based indices into `pnindex`.
   */
  public get triangle_fans(): number[][] {
    return this.extractNumberListList( 7 )
  }

  public static readonly query = [ EntityTypesAP214Tessellated.COMPLEX_TRIANGULATED_FACE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214Tessellated.COMPLEX_TRIANGULATED_FACE
}


/**
 * AP242 `TESSELLATED_SOLID` — the part shape itself, a set of tessellated
 * faces.
 *
 * Attribute slots: 0 name, 1 items, 2 geometric_link.
 */
export class tessellated_solid extends tessellated_item {

  /**
   * @return {EntityTypesAP214} This entity's type id.
   */
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214Tessellated.TESSELLATED_SOLID
  }

  /**
   * @return {complex_triangulated_face[]} The faces making up this solid.
   */
  public get items(): complex_triangulated_face[] {

    let   cursor    =
      this.getOffsetCursor( 1, TESSELLATED_ITEM_BASE_OFFSET, TESSELLATED_ITEM_DEPTH )
    const buffer    = this.buffer
    const endCursor = buffer.length

    if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
      return []
    }

    const value: complex_triangulated_face[] = []

    let signedCursor = stepExtractArrayBegin( buffer, cursor, endCursor )
    cursor = Math.abs( signedCursor )

    while ( signedCursor >= 0 ) {

      const element =
        this.extractBufferElement( buffer, cursor, endCursor, complex_triangulated_face )

      if ( element === void 0 ) {
        throw new Error( 'Value in STEP was incorrectly typed' )
      }

      value.push( element )
      cursor = skipValue( buffer, cursor, endCursor )
      signedCursor = stepExtractArrayToken( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor )
    }

    return value
  }

  public static readonly query = [ EntityTypesAP214Tessellated.TESSELLATED_SOLID ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214Tessellated.TESSELLATED_SOLID
}


/**
 * AP242 `TESSELLATED_SHAPE_REPRESENTATION` — a `shape_representation` whose
 * items are tessellated geometry.
 *
 * It adds no attributes of its own, so it inherits `representation`'s
 * accessors unchanged. Subclassing `shape_representation` is what makes every
 * existing `instanceof shape_representation` / `instanceof representation`
 * test in the extraction walk keep working. What it does NOT give for free is
 * type-index enumeration — `model.types( X )` reads `X.query`, a class static —
 * so this class has to be named explicitly at the free-root scan in
 * `ap214_geometry_extraction.ts`.
 */
export class tessellated_shape_representation extends shape_representation {

  /**
   * @return {EntityTypesAP214} This entity's type id.
   */
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214Tessellated.TESSELLATED_SHAPE_REPRESENTATION
  }

  public static readonly query = [ EntityTypesAP214Tessellated.TESSELLATED_SHAPE_REPRESENTATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214Tessellated.TESSELLATED_SHAPE_REPRESENTATION
}


/**
 * The generated minimal perfect hash, with the shadow types tried on a miss.
 *
 * The miss path is HOT — it runs for every record whose keyword is not in the
 * generated schema, which in the NIST AP242 corpus means thousands of
 * `TESSELLATED_CURVE_SET` records per file — so it compares encoded bytes
 * directly (`blobEquals` rejects on length first) rather than decoding the
 * span to a string and looking that up in a map.
 */
class AP214TessellatedTypeIndex implements TypeIndex< EntityTypesAP214 > {

  /**
   * Look a STEP keyword up, generated schema first.
   *
   * @param name The buffer holding the keyword.
   * @param offset Start of the keyword in the buffer.
   * @param end End (exclusive) of the keyword in the buffer.
   * @return {EntityTypesAP214 | undefined} The type id, if the keyword is known.
   */
  public get(
      name: Uint8Array,
      offset?: number,
      end?: number ): EntityTypesAP214 | undefined {

    const generated = EntityTypesAP214Search.get( name, offset, end )

    if ( generated !== void 0 ) {
      return generated
    }

    const start  = offset ?? 0
    const finish = end ?? name.length

    for ( let keyIndex = 0; keyIndex < TESSELLATED_TYPE_KEYS.length; ++keyIndex ) {

      const key = TESSELLATED_TYPE_KEYS[ keyIndex ]

      if ( blobEquals( name, start, finish, key, 0, key.length ) ) {
        return TESSELLATED_TYPE_IDS[ keyIndex ]
      }
    }

    return void 0
  }
}

/**
 * The composite type index every AP214/AP203/AP242 parse runs through.
 */
export const EntityTypesAP214TessellatedSearch = new AP214TessellatedTypeIndex()


const extendedConstructors =
  [ ...SchemaAP214.constructors ] as
    ( StepEntityConstructor< EntityTypesAP214 > | undefined )[]

const extendedQueries = [ ...SchemaAP214.queries ] as EntityTypesAP214[][]

const extendedReflection =
  [ ...SchemaAP214.reflection ] as EntityDescription< EntityTypesAP214 >[]

/*
 * Reflection deliberately declares no fields of these entities' own:
 * `StepEntityBase.fields` walks `superType`, so a tessellated solid still
 * reflects as a named representation item, while a coordinates list does NOT
 * offer to serialise its (up to thousands of) points into a property value.
 */
for ( const [ constructorRead, superType ] of ( [
  [ coordinates_list, EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM ],
  [ complex_triangulated_face, EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM ],
  [ tessellated_solid, EntityTypesAP214.GEOMETRIC_REPRESENTATION_ITEM ],
  [ tessellated_shape_representation, EntityTypesAP214.SHAPE_REPRESENTATION ],
] as [ StepEntityConstructor< EntityTypesAP214 >, EntityTypesAP214 ][] ) ) {

  const typeID = constructorRead.expectedType

  extendedConstructors[ typeID ] = constructorRead
  extendedQueries[ typeID ] = [ typeID ]
  extendedReflection[ typeID ] = {
    fields: {},
    typeId: typeID,
    depth: TESSELLATED_ITEM_DEPTH,
    isAbstract: false,
    superType: superType,
  }
}

/**
 * `SchemaAP214` plus the shadow entities — what `AP214StepModel` is built on.
 */
const SchemaAP214Tessellated = new StepEntitySchema< EntityTypesAP214 >(
    extendedConstructors,
    new StepParser< EntityTypesAP214 >( EntityTypesAP214TessellatedSearch ),
    extendedQueries,
    extendedReflection )

export default SchemaAP214Tessellated
