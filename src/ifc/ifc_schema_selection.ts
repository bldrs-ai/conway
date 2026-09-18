/**
 * Which generated IFC entity schema a file's `FILE_SCHEMA` header selects.
 *
 * 'ifc4' covers everything up to and including IFC4 (and is also the
 * fallback for anything unrecognised — matching this repo's historical,
 * only-ever-IFC4 behaviour). 'ifc4x3' covers the IFC4X3 family: the
 * released RC2, the TC1 corrigendum and the ADD2 addendum this repo
 * generates from (see code-gen-ifc4x3 in package.json).
 */
export type IfcSchemaKind = 'ifc4' | 'ifc4x3'

// The 4X3-family identifiers a real FILE_SCHEMA header can carry.
// IFC4X3_TC1 is included on the assumption that ADD2 — a strict
// addendum to TC1's entity set, not a replacement schema — covers what
// a TC1 file declares; nothing in this repo has verified that against an
// actual TC1-labelled file, so treat it as inferred rather than tested.
const IFC4X3_IDENTIFIERS: ReadonlySet<string> = new Set([
  'IFC4X3',
  'IFC4X3_RC2',
  'IFC4X3_ADD2',
  'IFC4X3_TC1',
])

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
 */
export function selectIfcSchemaKind( fileSchema: string | undefined ): IfcSchemaKind {

  if ( fileSchema === void 0 ) {

    return 'ifc4'
  }

  return IFC4X3_IDENTIFIERS.has( fileSchema.toUpperCase() ) ? 'ifc4x3' : 'ifc4'
}
