import { EntityAddress, resolveReference } from '../../core/model_uri'
import { RecordHandler } from './streaming_record_dispatcher'


/**
 * Reads the `Location` string of a cross-reference entity by express ID.
 * Implemented over the finished (or partially materialised) model — a thin
 * seam so the registry's link resolution is testable without a full model.
 * `IfcExternalReference.Location` is the canonical field; STEP AP242's external
 * references expose their location the same way.
 */
export interface ReferenceLocationReader {

  /**
   * @param expressID The cross-reference entity's express ID.
   * @return {string | null | undefined} Its `Location`, or null/undefined when
   * absent.
   */
  locationOf( expressID: number ): string | null | undefined
}


/**
 * An outbound federation link discovered from a cross-reference: the
 * referencing entity in this model, the raw location it declared, and — once
 * resolved against the model's own URI — the absolute URI (and, if the
 * location carried a `#expressID` fragment, the entity address) it points at.
 */
export interface CrossReferenceLink {

  /** Express ID of the referencing entity in the source model. */
  fromExpressID: number

  /** The raw `Location` string as authored in the file. */
  location: string

  /** The location resolved to an absolute URI against the source model URI. */
  targetURI: string

  /** The target entity address, when the location carried a `#expressID`. */
  targetEntity?: EntityAddress
}


const FRAGMENT = '#'
const RADIX = 10


/**
 * Collects a model's **outbound cross-model references** during the streaming
 * parse and, once locations are readable, resolves them into navigable
 * federation links (M5 / design S3).
 *
 * The links come from IFC's own reference entities — `IfcExternalReference`
 * and its subtypes (`IfcDocumentReference`, `IfcClassificationReference`,
 * `IfcLibraryReference`) — and, for STEP AP242, its external references. Two
 * phases, matching M2's "identify while parsing, resolve on demand":
 *
 *  1. **Identify** — subscribe {@link handler} to a
 *     {@link StreamingRecordDispatcher} for the reference types
 *     (`dispatcher.on([IfcExternalReference], reg.handler)`); it records the
 *     express ID of every such record as it streams past. Cheap and idempotent
 *     (a `Set`), so the rare grow-restart is harmless.
 *  2. **Resolve** — after parse, {@link resolve} reads each reference's
 *     `Location` via a {@link ReferenceLocationReader} and resolves it against
 *     the source model URI, yielding {@link CrossReferenceLink}s the UI renders
 *     as links. Visiting one opens the target model in the `ModelRegistry`.
 *
 * The location read is deferred because the event stream carries only
 * `(localID, expressID, typeID)` — not attribute strings; pulling `Location`
 * needs the entity's fields, which is a model read, not a parse event.
 */
export class CrossReferenceRegistry<TypeIDType extends number> {

  private readonly fromExpressIDs_ = new Set<number>()

  /**
   * @param sourceURI_ The URI of the model these references were found in —
   * the base for resolving relative locations.
   */
  constructor( private readonly sourceURI_: string ) {}

  /**
   * Record one cross-reference entity. Bind to a dispatcher subscription
   * filtered to the reference types; every record it is handed is taken to be
   * a cross-reference (the dispatcher does the type filtering).
   *
   * @param localID Unused (kept for the RecordHandler shape).
   * @param expressID The reference entity's express ID.
   * @param typeID Unused (the dispatcher already matched the type set).
   */
  public readonly handler: RecordHandler<TypeIDType> =
    ( localID: number, expressID: number, typeID: TypeIDType | undefined ): void => {
      this.fromExpressIDs_.add( expressID )
    }

  /**
   * @return {number} The number of cross-references collected.
   */
  public get count(): number {
    return this.fromExpressIDs_.size
  }

  /**
   * @return {IterableIterator<number>} The express IDs of the collected
   * reference entities.
   */
  public expressIDs(): IterableIterator<number> {
    return this.fromExpressIDs_.keys()
  }

  /**
   * Resolve the collected references into navigable links by reading each
   * one's `Location` and resolving it against the source model URI. References
   * whose location is absent (null / empty) are skipped — they carry no link.
   *
   * @param reader Reads the `Location` of an express ID.
   * @return {CrossReferenceLink[]} The resolved outbound links.
   */
  public resolve( reader: ReferenceLocationReader ): CrossReferenceLink[] {

    const links: CrossReferenceLink[] = []

    for ( const fromExpressID of this.fromExpressIDs_ ) {

      const location = reader.locationOf( fromExpressID )

      if ( location === null || location === void 0 || location.length === 0 ) {
        continue
      }

      const resolved = resolveReference( this.sourceURI_, location )
      const link: CrossReferenceLink = { fromExpressID, location, targetURI: resolved }

      // A location may itself address a specific entity (model.ifc#42).
      const hash = resolved.lastIndexOf( FRAGMENT )

      if ( hash >= 0 && /^\d+$/.test( resolved.slice( hash + 1 ) ) ) {
        link.targetEntity = {
          modelURI: resolved.slice( 0, hash ),
          expressID: parseInt( resolved.slice( hash + 1 ), RADIX ),
        }
      }

      links.push( link )
    }

    return links
  }
}
