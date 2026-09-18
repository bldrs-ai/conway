import { StepHeader } from '../step/parsing/step_parser'
import { extractFileSchemaEntries } from '../format_detection/model_format_detector'

/**
 * Which generated IFC entity schema a file's `FILE_SCHEMA` header selects.
 *
 * 'ifc4' covers everything up to and including IFC4 (and is also the
 * fallback for anything unrecognised that ISN'T 4X3-family — matching this
 * repo's historical, only-ever-IFC4 behaviour). 'ifc4x3' covers the 4X3
 * spellings this repo has verified are covered by the ADD2 addendum it
 * generates from (see code-gen-ifc4x3 in package.json) — the released RC2
 * and ADD2 itself, but NOT the TC1 corrigendum, which fails closed until a
 * pinned TC1 schema or fixture verifies it (see `IFC4X3_IDENTIFIERS`
 * below).
 *
 * There is no third value for "4X3-family but unrecognised" — that case
 * throws {@link UnrecognizedIfc4x3SchemaError} instead of returning a kind.
 * Falling back to 'ifc4' for it would silently reinterpret the file's
 * reordered 4X3 entity space under IFC4's ordinals, which is the exact
 * defect this module exists to prevent — codex review of
 * bldrs-ai/conway#713 (P1).
 */
export type IfcSchemaKind = 'ifc4' | 'ifc4x3'

// The 4X3-family identifiers this repo has verified are covered by the
// ADD2-generated module. IFC4X3_TC1 is deliberately NOT in this set: the
// generated module comes solely from IFC4X3_ADD2, and while ADD2 is meant
// as a strict addendum to TC1's entity set, nothing in this repo has ever
// checked that against a pinned TC1 schema or a TC1-labelled fixture. A
// changed positional entity layout between TC1 and ADD2 would be read
// with the wrong generated definitions and reported as correctly typed —
// so TC1 falls through to the 4X3-family-prefix branch below and fails
// closed with UnrecognizedIfc4x3SchemaError until that verification
// exists (codex review of bldrs-ai/conway#713, P1, round 3 — explicitly
// decided "fail closed" rather than left speculative).
const IFC4X3_IDENTIFIERS: ReadonlySet<string> = new Set([
  'IFC4X3',
  'IFC4X3_RC2',
  'IFC4X3_ADD2',
])

// Any FILE_SCHEMA identifier in the 4X3 family shares this prefix,
// including spellings this repo does not yet recognise (another
// release-candidate/addendum label, a future corrigendum). Used to tell
// "genuinely not 4X3" (safe to fall back to 'ifc4', matching historical
// behaviour) apart from "4X3-family but unrecognised" (must fail closed).
const IFC4X3_FAMILY_PREFIX = 'IFC4X3'

/**
 * Thrown by {@link selectIfcSchemaKind} for a FILE_SCHEMA identifier that
 * belongs to the IFC4X3 family (starts with 'IFC4X3') but is not one of the
 * specific spellings in {@link IFC4X3_IDENTIFIERS}. Falling back to IFC4
 * parsing/extraction here would silently reinterpret the file's reordered
 * 4X3 entity space under IFC4's ordinals — codex review of
 * bldrs-ai/conway#713 (P1). Callers should let this propagate as a load
 * failure rather than catch-and-continue.
 */
export class UnrecognizedIfc4x3SchemaError extends Error {

  /**
   * @param fileSchema The unrecognised 4X3-family FILE_SCHEMA identifier.
   */
  constructor( public readonly fileSchema: string ) {

    super(
        `FILE_SCHEMA identifier '${fileSchema}' is IFC4X3-family but not ` +
        'one of the spellings this repo has verified compatible ' +
        '(IFC4X3_IDENTIFIERS in ifc_schema_selection.ts). Refusing to ' +
        'silently fall back to IFC4 parsing, which would misidentify this ' +
        "file's reordered 4X3 entity space under IFC4's ordinals." )
    this.name = 'UnrecognizedIfc4x3SchemaError'
  }
}

/**
 * Classify a FILE_SCHEMA identifier into which generated schema module
 * should parse the file.
 *
 * @param fileSchema The unquoted schema identifier, as
 * `extractModelInfo`/`ModelInfo.schema` already extract it from a step
 * file's FILE_SCHEMA header (e.g. 'IFC4', 'IFC4X3_RC2') — this does not
 * parse the raw header itself; that parsing already exists (see
 * loading_utilities.ts's extractModelInfo) and this is deliberately not a
 * second implementation of it.
 * @return {IfcSchemaKind} 'ifc4x3' for a recognised 4X3-family identifier,
 * 'ifc4' otherwise (including when `fileSchema` is undefined).
 * @throws {UnrecognizedIfc4x3SchemaError} If `fileSchema` is 4X3-family
 * (starts with 'IFC4X3') but not a recognised spelling.
 */
export function selectIfcSchemaKind( fileSchema: string | undefined ): IfcSchemaKind {

  if ( fileSchema === void 0 ) {

    return 'ifc4'
  }

  const normalized = fileSchema.toUpperCase()

  if ( IFC4X3_IDENTIFIERS.has( normalized ) ) {

    return 'ifc4x3'
  }

  if ( normalized.startsWith( IFC4X3_FAMILY_PREFIX ) ) {

    throw new UnrecognizedIfc4x3SchemaError( fileSchema )
  }

  return 'ifc4'
}

/**
 * Classify a parsed STEP header's full `FILE_SCHEMA` entry list, rather
 * than a single already-extracted identifier — codex review of
 * bldrs-ai/conway#713 (P2): a header can carry more than one quoted entry
 * (e.g. `FILE_SCHEMA(('IFC4','IFC4X3_ADD2'))`), and `ModelInfo.schema`
 * (what `extractModelInfo` produces, and what plain `selectIfcSchemaKind`
 * is usually called with) only keeps the first. This reuses
 * `ModelFormatDetector`'s own multi-entry extraction rather than parsing
 * the header a third time.
 *
 * @param stepHeader The parsed STEP header.
 * @return {IfcSchemaKind} 'ifc4x3' if ANY entry is a recognised 4X3-family
 * identifier, 'ifc4' otherwise.
 * @throws {UnrecognizedIfc4x3SchemaError} If any entry is 4X3-family but
 * not a recognised spelling — this takes priority over any other entry in
 * the same header being plain 'ifc4', since silently accepting the header
 * would still misroute the 4X3 portion of the file.
 */
export function selectIfcSchemaKindForHeader( stepHeader: StepHeader ): IfcSchemaKind {

  const entries = extractFileSchemaEntries( stepHeader.headers.get( 'FILE_SCHEMA' ) )

  let sawIfc4x3 = false

  for ( const entry of entries ) {

    if ( selectIfcSchemaKind( entry ) === 'ifc4x3' ) {

      sawIfc4x3 = true
    }
  }

  return sawIfc4x3 ? 'ifc4x3' : 'ifc4'
}
