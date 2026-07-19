import { StepIndexEntry } from './step_parser'


/**
 * Index sidecar (M4): a compact, version-stamped binary serialisation of a
 * model's parse index, so a revisit (or a first visit with a server-provided
 * sidecar) can open **index-first** — reconstruct the entity index without
 * re-scanning the source, then fetch only the byte ranges demand asks for
 * (see RangeByteSource).
 *
 * Layout (all little-endian):
 *
 *   'CIDX'            4  magic
 *   version           u32
 *   sourceByteLength  f64  (length of the source the index was built from)
 *   sourceHash        u32  (hash of the source bytes — the handshake)
 *   recordCount       u32
 *   address[]         f64 × recordCount  (file-absolute; f64 tolerates >4 GB)
 *   length[]          u32 × recordCount
 *   typeID[]          i32 × recordCount  (−1 = undefined type)
 *   expressID[]       u32 × recordCount
 *
 * This carries the top-level record columns — enough to answer type/express
 * queries and locate every record's bytes. Inline / multi-mapping child
 * serialisation is a v2 extension (records with children re-materialise their
 * children from the record bytes on demand); `hasChildren` flags which
 * records the sidecar under-describes so a consumer can fall back for them.
 *
 * The sidecar is a **cache, not an interchange format**: it is only trusted
 * after `sourceHash` + `sourceByteLength` match the actual source. A mismatch
 * means fall back to a cold scan — never serve wrong bytes. Production should
 * swap the placeholder 32-bit hash for a strong digest (e.g. SHA-256); the
 * format reserves a fixed slot so that is a version bump, not a reshape.
 */

const MAGIC = 0x58444943 // 'CIDX' little-endian
const VERSION = 1
const UNDEFINED_TYPE = -1

// FNV-1a 32-bit parameters (see hashSource).
const FNV_OFFSET_BASIS = 2166136261
const FNV_PRIME = 16777619
const HEX = 16

// Byte sizes of the fixed header fields, in order.
const HEADER_BYTES =
  4 + // magic
  4 + // version
  8 + // sourceByteLength (f64)
  4 + // sourceHash (u32)
  4   // recordCount (u32)

const ADDRESS_BYTES = 8
const LENGTH_BYTES = 4
const TYPEID_BYTES = 4
const EXPRESSID_BYTES = 4


/**
 * The decoded sidecar: the source identity it was built against, plus the
 * reconstructed top-level element index.
 */
export interface DecodedSidecar<TypeIDType extends number> {
  version: number
  sourceByteLength: number
  sourceHash: number
  elements: StepIndexEntry<TypeIDType>[]

  /**
   * True for records the sidecar under-describes (they had inline / multi
   * children the v1 format doesn't serialise). Same order as `elements`.
   */
  hasChildren: boolean[]
}


/**
 * A placeholder strong-ish hash of the source bytes (FNV-1a, 32-bit). Stands
 * in for a production digest (SHA-256); only the fixed slot matters to the
 * format. Sufficient to demonstrate the mismatch → cold-scan handshake.
 *
 * @param source The source bytes.
 * @return {number} A 32-bit unsigned hash.
 */
export function hashSource( source: Uint8Array ): number {
  let hash = FNV_OFFSET_BASIS >>> 0

  for ( let where = 0; where < source.length; ++where ) {
    hash ^= source[ where ]
    hash = Math.imul( hash, FNV_PRIME ) >>> 0
  }

  return hash >>> 0
}


/**
 * Serialise a model's top-level element index to a sidecar blob.
 *
 * @param elements The top-level element index.
 * @param sourceByteLength The length of the source it was built from.
 * @param sourceHash The source hash (see {@link hashSource}).
 * @return {Uint8Array} The sidecar bytes.
 */
export function serializeIndexSidecar<TypeIDType extends number>(
    elements: StepIndexEntry<TypeIDType>[],
    sourceByteLength: number,
    sourceHash: number ): Uint8Array {

  const recordCount = elements.length

  const total =
    HEADER_BYTES +
    recordCount * ( ADDRESS_BYTES + LENGTH_BYTES + TYPEID_BYTES + EXPRESSID_BYTES )

  const bytes = new Uint8Array( total )
  const view = new DataView( bytes.buffer )

  let offset = 0

  view.setUint32( offset, MAGIC, true ); offset += 4
  view.setUint32( offset, VERSION, true ); offset += 4
  view.setFloat64( offset, sourceByteLength, true ); offset += 8
  view.setUint32( offset, sourceHash >>> 0, true ); offset += 4
  view.setUint32( offset, recordCount, true ); offset += 4

  // Column-major: better compression locality than row-major, and it mirrors
  // the SoA columns the model rebuilds.
  for ( const element of elements ) {
    view.setFloat64( offset, element.address, true ); offset += ADDRESS_BYTES
  }
  for ( const element of elements ) {
    view.setUint32( offset, element.length, true ); offset += LENGTH_BYTES
  }
  for ( const element of elements ) {
    const typeID = element.typeID
    view.setInt32(
        offset, typeID === void 0 ? UNDEFINED_TYPE : ( typeID as number ), true )
    offset += TYPEID_BYTES
  }
  for ( const element of elements ) {
    view.setUint32( offset, element.expressID, true ); offset += EXPRESSID_BYTES
  }

  return bytes
}


/**
 * Deserialise a sidecar blob back to the top-level element index.
 *
 * @param bytes The sidecar bytes.
 * @return {DecodedSidecar} The decoded source identity + element index.
 */
export function deserializeIndexSidecar<TypeIDType extends number>(
    bytes: Uint8Array ): DecodedSidecar<TypeIDType> {

  const view = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength )

  let offset = 0

  const magic = view.getUint32( offset, true ); offset += 4

  if ( magic !== MAGIC ) {
    throw new Error( `Not a sidecar: bad magic 0x${magic.toString( HEX )}` )
  }

  const version = view.getUint32( offset, true ); offset += 4

  if ( version !== VERSION ) {
    throw new Error( `Unsupported sidecar version ${version}` )
  }

  const sourceByteLength = view.getFloat64( offset, true ); offset += 8
  const sourceHash = view.getUint32( offset, true ); offset += 4
  const recordCount = view.getUint32( offset, true ); offset += 4

  const addressBase = offset
  const lengthBase = addressBase + recordCount * ADDRESS_BYTES
  const typeIDBase = lengthBase + recordCount * LENGTH_BYTES
  const expressIDBase = typeIDBase + recordCount * TYPEID_BYTES

  const elements: StepIndexEntry<TypeIDType>[] = new Array( recordCount )
  const hasChildren: boolean[] = new Array( recordCount ).fill( false )

  for ( let where = 0; where < recordCount; ++where ) {
    const typeID = view.getInt32( typeIDBase + where * TYPEID_BYTES, true )

    elements[ where ] = {
      address: view.getFloat64( addressBase + where * ADDRESS_BYTES, true ),
      length: view.getUint32( lengthBase + where * LENGTH_BYTES, true ),
      typeID: ( typeID === UNDEFINED_TYPE ? void 0 : typeID ) as TypeIDType,
      expressID: view.getUint32( expressIDBase + where * EXPRESSID_BYTES, true ),
    }
  }

  return { version, sourceByteLength, sourceHash, elements, hasChildren }
}


/**
 * Validate a decoded sidecar against the actual source identity. The
 * index-first open path calls this before trusting the sidecar; on false it
 * must fall back to a cold scan.
 *
 * @param sidecar The decoded sidecar.
 * @param sourceByteLength The actual source length.
 * @param sourceHash The actual source hash.
 * @return {boolean} True if the sidecar matches the source.
 */
export function sidecarMatchesSource<TypeIDType extends number>(
    sidecar: DecodedSidecar<TypeIDType>,
    sourceByteLength: number,
    sourceHash: number ): boolean {

  return sidecar.sourceByteLength === sourceByteLength &&
    sidecar.sourceHash === ( sourceHash >>> 0 )
}
