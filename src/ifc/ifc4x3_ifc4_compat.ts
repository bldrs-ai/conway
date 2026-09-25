import TypeIndex from '../indexing/type_index'
import { ByteSource, ReadableByteSource } from '../step/parsing/byte_source'
import { ColumnarIndexSink } from '../step/parsing/columnar_index'
import StepParser, { ParseResult, StepHeader } from '../step/parsing/step_parser'
import {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
  StreamingColumnarIndexResult,
} from '../step/parsing/streaming_index_builder'
import EntityTypesIfc, { EntityTypesIfcCount } from './ifc4_gen/entity_types_ifc.gen'
import EntityTypesIfcSearch from './ifc4_gen/entity_types_search.gen'
import DECODE_COMPAT from './ifc4x3_ifc4_compat_gen/decode_compat.gen'
import {
  IFC4_ONLY_KEYWORDS_ALLOWED_IN_IFC4X3,
  IFC4X3_TO_IFC4_TRANSLATIONS,
  Ifc4x3Translation,
} from './ifc4x3_ifc4_translation'
import { selectIfcSchemaKindForHeader } from './ifc_schema_selection'
import IfcStepModel from './ifc_step_model'


/**
 * The IFC4-compatible route for IFC4X3 files: an IFC4X3 file whose content
 * IFC4 can decode correctly is parsed with conway's IFC4 schema and runs
 * through the unchanged IFC4 pipeline. Any other IFC4X3 file is refused,
 * exactly as bldrs-ai/conway#713 refused all of them.
 *
 * ELIGIBILITY. A file is eligible iff every keyword it uses (top-level
 * records, complex-instance parts and inline typed values alike) is one of:
 *
 *  1. an IFC4 keyword in the derived decode-compatibility set
 *     (ifc4x3_ifc4_compat_gen/decode_compat.gen.ts; the rule is in
 *     ifc4x3_decode_compat_derive.ts), or in the explicit IFC4-only
 *     allowlist (IFC4_ONLY_KEYWORDS_ALLOWED_IN_IFC4X3);
 *  2. an IFC4X3-only keyword in the translation table
 *     (IFC4X3_TO_IFC4_TRANSLATIONS), used as the keyword of a simple
 *     top-level record. Translated keywords inside complex instances or as
 *     inline values are refused;
 *  3. an unknown INLINE keyword (e.g. `IFCROADPARTTYPEENUM(.ROADSEGMENT.)`)
 *     that sits inside a translated record at an attribute position the
 *     mask hides. Anywhere else, an unknown keyword refuses the file.
 *
 * WHY THE WHOLE FILE IS INDEXED PRIVATELY FIRST. Eligibility needs the
 * file's full keyword set, and the header alone does not give it.
 * bldrs-ai/conway#713's review history (rounds 2-4) was gates that fired
 * after typed records, preview meshes or `onRecordIndexed` callbacks had
 * already escaped. So an IFC4X3 file is indexed by
 * {@link buildIfc4x3CompatIndex} with a private parser, a private sink and
 * its own record hook. No caller callback, preview channel or caller sink
 * ever sees it. Only once eligibility is decided does the SAME index go to
 * the normal pipeline ({@link ifc4x3CompatModel}); there is no second
 * parse. IFC4X3 files lose progressive preview; IFC4/IFC2x3/STEP files are
 * untouched, because this route is entered only from a header that
 * `selectIfcSchemaKindForHeader` classifies as 'ifc4x3'.
 *
 * Relative to the builder's `onHeaderParsed` seam
 * (streaming_index_builder.ts): every streamed IFC4 entry point still
 * passes a hook that throws {@link Ifc4x3CompatRouteRequired} on a 4X3
 * header, before the IFC4 build emits anything. Entry points that support
 * this route catch that and call {@link buildIfc4x3CompatIndex} instead.
 * Entry points that do not support it (native streamed opens that hand
 * records to caller callbacks as they parse, and the sidecar open, which
 * has no parse at all) let it propagate as a refusal. The private build
 * runs its own hook, {@link assertIfc4x3Header}, from the same seam.
 */


/**
 * A 4X3 file that is not eligible for the IFC4-compatible route. Names
 * IFC4X3 in its message, like every refusal since bldrs-ai/conway#713.
 */
export class Ifc4x3IneligibleError extends Error {

  /**
   * @param reasons Distinct reasons, in first-seen order.
   */
  constructor( public readonly reasons: readonly string[] ) {

    const shown = reasons.slice( 0, MAX_REASONS_IN_MESSAGE ).join( '; ' )
    const more = reasons.length > MAX_REASONS_IN_MESSAGE ?
      ` (+${reasons.length - MAX_REASONS_IN_MESSAGE} more)` : ''

    super(
        'IFC4X3 file is not eligible for IFC4-compatible decoding, and ' +
        'geometry extraction is not yet implemented for the IFC4X3 schema ' +
        `itself (bldrs-ai/conway#280 phase 2b): ${shown}${more}` )
    this.name = 'Ifc4x3IneligibleError'
  }
}

const MAX_REASONS_IN_MESSAGE = 5

/** Cap on collected reasons: a refusal needs a few examples, not all. */
const MAX_REASONS = 64


const TRANSLATION_TARGET_IDS = new Map< string, EntityTypesIfc >(
    Object.entries( IFC4X3_TO_IFC4_TRANSLATIONS ).map( ( [ source, translation ] ) => {

      const target = EntityTypesIfc[ translation.target as keyof typeof EntityTypesIfc ]

      if ( target === void 0 ) {
        throw new Error( `Translation target ${translation.target} is not an IFC4 type` )
      }

      return [ source, target ]
    } ) )

const ALLOWED_IFC4_KEYWORDS = new Set< string >( [
  ...DECODE_COMPAT.compatible,
  ...IFC4_ONLY_KEYWORDS_ALLOWED_IN_IFC4X3,
] )

const ASCII = new TextDecoder( 'latin1' )

const QUOTE = 0x27
const OPEN_PAREN = 0x28
const CLOSE_PAREN = 0x29
const COMMA = 0x2c
const SLASH = 0x2f
const STAR = 0x2a


/**
 * The top-level attribute index of the byte at `at` within a record whose
 * attributes start at `from` (just after the record's opening parenthesis).
 * Commas inside nested parentheses, strings or `/* … *\/` comments do not
 * count (the parser accepts comments wherever it accepts whitespace, and
 * KIT-Simple-Road carries some); a STEP string's `''` escape toggles the
 * in-string state twice, so it needs no special case.
 *
 * @param buffer The record's bytes.
 * @param from Start of the first attribute.
 * @param at The byte to locate.
 * @return {number} The attribute index.
 */
function attributeIndexAt( buffer: Uint8Array, from: number, at: number ): number {

  let depth = 0
  let index = 0
  let inString = false

  for ( let cursor = from; cursor < at; ++cursor ) {

    const byte = buffer[ cursor ]

    if ( !inString && byte === SLASH && buffer[ cursor + 1 ] === STAR ) {

      cursor += 2

      while ( cursor + 1 < at &&
        !( buffer[ cursor ] === STAR && buffer[ cursor + 1 ] === SLASH ) ) {
        ++cursor
      }

      ++cursor
      continue
    }

    if ( byte === QUOTE ) {
      inString = !inString
    } else if ( !inString ) {
      if ( byte === OPEN_PAREN ) {
        ++depth
      } else if ( byte === CLOSE_PAREN ) {
        --depth
      } else if ( byte === COMMA && depth === 0 ) {
        ++index
      }
    }
  }

  return index
}


/** A keyword lookup IFC4 could not resolve (or resolved by translation). */
interface PendingLookup {
  buffer: Uint8Array
  start: number
  end: number
  name: string
  translation?: Ifc4x3Translation
}


/**
 * Collects what eligibility needs during the private index build.
 *
 * Every keyword the parser resolves goes through {@link typeIndex}. Known
 * IFC4 keywords are recorded in a bitmap. Unknown ones are kept as pending
 * lookups until the record they belong to is announced by
 * {@link onRecordIndexed}, which attributes them by position. The window
 * buffer does not slide inside a record, so a lookup whose `end` is at or
 * before the record's attribute start is the record's own keyword, and one
 * at or after it is inline.
 *
 * A grow-and-restart (streaming_index_builder.ts) re-parses the whole file
 * from byte 0 into a freshly allocated window, while a slide keeps the same
 * window buffer. So the first lookup against a new buffer means everything
 * collected so far came from a parse the builder abandoned, and all of it
 * is discarded: the restarted parse looks every keyword up again, and
 * announces every record again. Dropping only the stale PENDING lookups is
 * not enough — the attempt that overflowed may have resolved a truncated
 * identifier at the window's end as a different, known keyword
 * (`IFCPROPERTY` cut out of `IFCPROPERTYSINGLEVALUE`) and marked it seen
 * (codex review of bldrs-ai/conway#718, P2).
 */
class Ifc4x3EligibilityCollector {

  private readonly seen_ = new Uint8Array( EntityTypesIfcCount )
  private pending_: PendingLookup[] = []
  private readonly reasons_ = new Set< string >()
  private window_?: Uint8Array

  /** Decoded-field counts for translated records, by express ID. */
  public readonly fieldMasks = new Map< number, number >()

  public readonly typeIndex: TypeIndex< EntityTypesIfc > = {

    get: ( buffer: Uint8Array, offset?: number, end?: number ) => {

      if ( buffer !== this.window_ ) {
        if ( this.window_ !== void 0 ) {
          this.discardAbandonedParse()
        }
        this.window_ = buffer
      }

      const start = offset ?? 0
      const stop = end ?? buffer.length
      const known = EntityTypesIfcSearch.get( buffer, start, stop )

      if ( known !== void 0 ) {
        this.seen_[ known ] = 1
        return known
      }

      const name = ASCII.decode( buffer.subarray( start, stop ) )
      const translation = IFC4X3_TO_IFC4_TRANSLATIONS[ name ]

      this.pending_.push( { buffer, start, end: stop, name, translation } )

      return translation !== void 0 ? TRANSLATION_TARGET_IDS.get( name ) : void 0
    },
  }

  /**
   * The private build's record hook: attributes pending lookups to this
   * record, and records the mask for a translated one.
   *
   * @param localID Unused.
   * @param expressID The record's express ID.
   * @param typeID The record's type (0 for a complex instance).
   * @param buffer The parse window.
   * @param byteOffset Start of the record's first attribute in `buffer`.
   * @param byteLength The record's length.
   */
  public readonly onRecordIndexed = (
      localID: number,
      expressID: number,
      typeID: EntityTypesIfc | undefined,
      buffer?: Uint8Array,
      byteOffset?: number,
      byteLength?: number ): void => {

    if ( this.pending_.length === 0 ) {
      return
    }

    const pending = this.pending_

    this.pending_ = []

    if ( buffer === void 0 || byteOffset === void 0 || byteLength === void 0 ) {
      this.refuse( `#${expressID}: record bytes unavailable for attribution` )
      return
    }

    let own: PendingLookup | undefined

    for ( const lookup of pending ) {
      if ( lookup.buffer === buffer && lookup.end <= byteOffset ) {
        own = lookup
      }
    }

    // A complex instance (typeID 0) has no own keyword: all of its parts
    // start after byteOffset and are handled as inline below, where a
    // translated or unknown part refuses.
    const translation = typeID !== 0 ? own?.translation : void 0

    if ( own !== void 0 ) {
      if ( translation !== void 0 ) {
        this.fieldMasks.set( expressID, translation.decodedPrefix )
      } else {
        this.refuse( `#${expressID}: keyword ${own.name} is unknown to IFC4 and ` +
          'has no IFC4X3 translation' )
      }
    }

    for ( const lookup of pending ) {

      if ( lookup.buffer !== buffer || lookup.start < byteOffset ) {
        continue
      }

      const masked =
        translation !== void 0 && lookup.translation === void 0 &&
        attributeIndexAt( buffer, byteOffset, lookup.start ) >= translation.decodedPrefix

      if ( !masked ) {
        this.refuse( `#${expressID}: inline keyword ${lookup.name} is unknown to IFC4 ` +
          'and not inside a translated record\'s masked attributes' )
      }
    }
  }

  /** Forget everything a grow-and-restart abandoned (see the class comment). */
  private discardAbandonedParse(): void {
    this.seen_.fill( 0 )
    this.pending_ = []
    this.reasons_.clear()
    this.fieldMasks.clear()
  }

  /**
   * @param reason A reason the file is ineligible.
   */
  private refuse( reason: string ): void {
    if ( this.reasons_.size < MAX_REASONS ) {
      this.reasons_.add( reason )
    }
  }

  /**
   * Decide eligibility over everything indexed.
   *
   * Eligibility is a claim about the WHOLE file, so a parse that stopped
   * short cannot establish it: records past the stop were never looked at,
   * and a keyword lookup whose record never completed was never attributed
   * (codex review of bldrs-ai/conway#718, P1 — a valid record followed by a
   * truncated `#2=IFCALIGNMENT(` came back SYNTAX_ERROR with a one-row index
   * and no reason recorded). IFC4 files keep the builder's warn-and-continue
   * on a partial parse; an IFC4X3 file fails closed instead, because a
   * partial index of it is exactly what #713's refusal exists to prevent.
   *
   * @param result How the private parse ended.
   * @throws {Ifc4x3IneligibleError} If the file is not eligible.
   */
  public decide( result: ParseResult ): void {

    if ( result !== ParseResult.COMPLETE ) {
      this.refuse( `the parse ended ${ParseResult[ result ]} before the whole file ` +
        'was checked' )
    }

    // After a complete parse every lookup has been attributed by a later
    // record's hook (a grow-and-restart re-parses, and so re-attributes, the
    // record it discarded), so a leftover one is a keyword no record owns.
    for ( const lookup of this.pending_ ) {
      this.refuse( `keyword ${lookup.name} was looked up in a record that never completed` )
    }

    this.pending_ = []

    for ( let typeID = 0; typeID < this.seen_.length; ++typeID ) {

      if ( this.seen_[ typeID ] === 0 ) {
        continue
      }

      const name = EntityTypesIfc[ typeID ]

      if ( !ALLOWED_IFC4_KEYWORDS.has( name ) ) {

        const why = DECODE_COMPAT.incompatible[ name ] ??
          'IFC4-only and not in IFC4_ONLY_KEYWORDS_ALLOWED_IN_IFC4X3'

        this.refuse( `${name} does not decode identically under IFC4 (${why})` )
      }
    }

    if ( this.reasons_.size > 0 ) {
      throw new Ifc4x3IneligibleError( [ ...this.reasons_ ] )
    }
  }
}


/**
 * The private build's `onHeaderParsed` hook. The caller routed here from a
 * header it classified as 4X3; this re-checks the header the private parse
 * itself produced, so the two can never disagree.
 *
 * @param header The parsed header.
 * @throws {Error} If the header is not IFC4X3.
 */
export function assertIfc4x3Header( header: StepHeader ): void {

  if ( selectIfcSchemaKindForHeader( header ) !== 'ifc4x3' ) {
    throw new Error( 'IFC4-compatible IFC4X3 route entered for a non-IFC4X3 header' )
  }
}


/** An eligible IFC4X3 file's IFC4 index, and the masks it must be read with. */
export interface Ifc4x3CompatIndex extends StreamingColumnarIndexResult< EntityTypesIfc > {

  /** Decoded-field counts for translated records, by express ID. */
  fieldMasks: ReadonlyMap< number, number >
}


/**
 * Index an IFC4X3 file privately with the IFC4 schema plus translation,
 * and decide eligibility (see the module comment). Nothing the caller can
 * observe runs during the parse.
 *
 * @param source The whole file, from byte 0.
 * @param pool Parse window size.
 * @return {Ifc4x3CompatIndex} The index, on success.
 * @throws {Ifc4x3IneligibleError} If the file is not eligible.
 */
export function buildIfc4x3CompatIndex( source: ByteSource, pool: number ): Ifc4x3CompatIndex {

  const collector = new Ifc4x3EligibilityCollector()
  const parser = new StepParser< EntityTypesIfc >( collector.typeIndex )

  const built = buildColumnarIndexStreaming(
      source, parser, pool, collector.onRecordIndexed,
      new ColumnarIndexSink< EntityTypesIfc >(), assertIfc4x3Header )

  collector.decide( built.result )

  return { ...built, fieldMasks: collector.fieldMasks }
}


/**
 * Cooperative twin of {@link buildIfc4x3CompatIndex}.
 *
 * @param source The whole file, from byte 0 (sync or async).
 * @param pool Parse window size.
 * @param onProgress Optional absolute byte-cursor progress. Byte counts
 * only, never records: safe to report before eligibility is decided.
 * @return {Promise<Ifc4x3CompatIndex>} The index, on success.
 * @throws {Ifc4x3IneligibleError} If the file is not eligible.
 */
export async function buildIfc4x3CompatIndexAsync(
    source: ReadableByteSource,
    pool: number,
    onProgress?: ( absoluteByteCursor: number ) => unknown ): Promise<Ifc4x3CompatIndex> {

  const collector = new Ifc4x3EligibilityCollector()
  const parser = new StepParser< EntityTypesIfc >( collector.typeIndex )

  const built = await buildColumnarIndexStreamingAsync(
      source, parser, pool, collector.onRecordIndexed, onProgress, void 0,
      new ColumnarIndexSink< EntityTypesIfc >(), assertIfc4x3Header )

  collector.decide( built.result )

  return { ...built, fieldMasks: collector.fieldMasks }
}


/**
 * Construct the IFC4 model over an eligible 4X3 index, with its masks
 * applied before anything can read an entity.
 *
 * @param buffer Resident source, or undefined with `provider`.
 * @param index The compat index.
 * @param provider Optional windowed provider (store-backed opens).
 * @return {IfcStepModel} The model.
 */
export function ifc4x3CompatModel(
    buffer: Uint8Array | undefined,
    index: Ifc4x3CompatIndex,
    provider?: ConstructorParameters< typeof IfcStepModel >[ 2 ] ): IfcStepModel {

  const model = new IfcStepModel( buffer, index.columns, provider )

  model.setFieldMasks( index.fieldMasks )

  return model
}


/** Default pool for resident compat builds (matches the streamed opens). */
// eslint-disable-next-line no-magic-numbers
export const IFC4X3_COMPAT_POOL_BYTES = 1024 * 1024


const TARGET_EXPLICIT_COUNTS = new Map< EntityTypesIfc, number >(
    Object.entries( IFC4X3_TO_IFC4_TRANSLATIONS ).map( ( [ source, translation ] ) =>
      [ TRANSLATION_TARGET_IDS.get( source )!, translation.targetExplicitCount ] ) )


/**
 * The raw (web-ifc tape) arguments of a masked record: the decoded prefix
 * kept, every later position `null` (what `$` parses to) up to the IFC4
 * type's explicit-attribute count. web-ifc's generated `FromTape` reads its
 * arguments purely by position, so without this a translated
 * IFCFACILITYPART's `IFCROADPARTTYPEENUM(.ROADSEGMENT.)` would land in
 * IfcBuildingStorey's `Elevation`. The typed getters are masked separately
 * by StepModelBase.setFieldMasks; this is the same mask on the raw path.
 *
 * @param args The record's parsed raw arguments.
 * @param typeID The record's IFC4 type.
 * @param decodedFieldCount The record's mask (StepModelBase.fieldMaskOf).
 * @return {any[]} The masked arguments.
 */
export function maskRawArguments(
    args: readonly unknown[],
    typeID: EntityTypesIfc,
    decodedFieldCount: number ): unknown[] {

  const width = Math.max( TARGET_EXPLICIT_COUNTS.get( typeID ) ?? 0, decodedFieldCount )
  const masked = args.slice( 0, decodedFieldCount )

  while ( masked.length < width ) {
    masked.push( null )
  }

  return masked
}
