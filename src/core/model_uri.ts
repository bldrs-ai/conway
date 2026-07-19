/**
 * Cross-model entity addressing (M5 / design S3).
 *
 * Federation turns "thousands of cross-referenced files" from a loader problem
 * into an addressing problem: every entity has a **universal address** of a
 * model URI plus an express ID — `https://…/part-B.ifc#4022`. The engine never
 * holds all the files; it holds a registry of models keyed by URI (see
 * {@link ModelRegistry}) and resolves an address to a (model, expressID) pair
 * on demand, opening a sibling loader for a URI it hasn't seen.
 *
 * The URI is opaque to the engine except for its `#expressID` fragment: the
 * scheme, host, path and any version identity live entirely in the model URI,
 * so "many versions side by side" is expressible without an engine change.
 */

/**
 * A universal entity address: which model, and which express ID within it.
 */
export interface EntityAddress {

  /** The model's URI (everything left of the `#expressID` fragment). */
  modelURI: string

  /** The entity's express ID within that model. */
  expressID: number
}


const FRAGMENT = '#'
const RADIX = 10


/**
 * Format a model URI + express ID as a single entity address URI.
 *
 * @param modelURI The model URI (must not itself contain a `#`).
 * @param expressID The express ID (a non-negative integer).
 * @return {string} The `modelURI#expressID` address.
 */
export function formatEntityAddress( modelURI: string, expressID: number ): string {

  if ( modelURI.includes( FRAGMENT ) ) {
    throw new Error( `Model URI must not contain '#': ${modelURI}` )
  }

  if ( !Number.isInteger( expressID ) || expressID < 0 ) {
    throw new Error( `Invalid express ID ${expressID}` )
  }

  return `${modelURI}${FRAGMENT}${expressID}`
}


/**
 * Parse an entity address URI into its model URI and express ID.
 *
 * The split is on the **last** `#`, so a fragment is required; the model URI
 * is everything before it. A missing or non-integer fragment is an error —
 * an address without an express ID isn't an entity address.
 *
 * @param uri The `modelURI#expressID` address.
 * @return {EntityAddress} The parsed address.
 */
export function parseEntityAddress( uri: string ): EntityAddress {

  const hash = uri.lastIndexOf( FRAGMENT )

  if ( hash < 0 ) {
    throw new Error( `Entity address has no '#expressID' fragment: ${uri}` )
  }

  const modelURI = uri.slice( 0, hash )
  const fragment = uri.slice( hash + 1 )

  if ( fragment.length === 0 || !/^\d+$/.test( fragment ) ) {
    throw new Error( `Entity address fragment is not an express ID: ${uri}` )
  }

  return { modelURI, expressID: parseInt( fragment, RADIX ) }
}


/**
 * Resolve a (possibly relative) reference URI against a base model URI, so an
 * `IfcExternalReference.Location` like `../shared/grid.ifc` becomes an absolute
 * model URI addressable in the registry. Absolute references (with a scheme,
 * or protocol-relative) pass through unchanged.
 *
 * Uses the standard URL resolver when the base is absolute; falls back to a
 * plain path join when the base has no scheme (e.g. a bare filename in tests).
 *
 * @param base The base model URI the reference was found in.
 * @param reference The reference URI (absolute or relative).
 * @return {string} The resolved absolute reference URI.
 */
export function resolveReference( base: string, reference: string ): string {

  // Already absolute (has a scheme like `https:` or is protocol-relative).
  if ( /^[a-z][a-z0-9+.-]*:/i.test( reference ) || reference.startsWith( '//' ) ) {
    return reference
  }

  try {
    return new URL( reference, base ).toString()
  } catch {
    // Base isn't a valid absolute URL (bare filename): join paths manually.
    const slash = base.lastIndexOf( '/' )
    const dir = slash < 0 ? '' : base.slice( 0, slash + 1 )

    return normalizePath( dir + reference )
  }
}


/**
 * Collapse `.` / `..` segments in a slash-joined path (used only for the
 * scheme-less fallback in {@link resolveReference}).
 *
 * @param path The path to normalise.
 * @return {string} The normalised path.
 */
function normalizePath( path: string ): string {

  const out: string[] = []

  for ( const segment of path.split( '/' ) ) {
    if ( segment === '..' ) {
      out.pop()
    } else if ( segment !== '.' ) {
      out.push( segment )
    }
  }

  return out.join( '/' )
}
