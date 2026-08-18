import { StepEntityConstructorAbstract } from '../step_entity_constructor'
import { RecordEventHandler } from './record_event'


/**
 * A per-record event handler: a record's dense `localID` (assigned in parse
 * order from 0), its `expressID`, its `typeID` (0 for external-mapping
 * records), and the record's raw bytes as an un-materialised
 * `(buffer, byteOffset, byteLength)` view over the live parse window.
 * See {@link RecordEventHandler} — in particular, the bytes are only valid
 * for the duration of the call.
 */
export type RecordHandler<TypeIDType> = RecordEventHandler<TypeIDType>


/**
 * Routes the streaming parse's per-record events (M2) to consumers that
 * subscribe by **type set**. A subscription's type set is the subtype closure
 * of the entity constructors it names — the same `query` closure the type
 * index and `expressIDsOfTypes` use (conway #383) — so `on([IfcRoot], …)`
 * matches every product, relationship, property set and quantity, and any
 * future IfcRoot subtype, with no whitelist to maintain.
 *
 * Feed `dispatcher.onRecordIndexed` to `buildIndexStreaming` /
 * `parseDataBlockStreamed`. Handlers run synchronously in the parse path, so
 * they must be cheap (copy ids into a compact structure); anything expensive
 * belongs on a demand queue, not here.
 *
 * Because subscriptions match on the raw parse `typeID`, external-mapping /
 * complex records (typeID 0) are only delivered via `onAnyRecord`. Resolving
 * their concrete types is not this class's job and never was: the columns
 * carry the multi-mapping, so
 * {@link import('./prefix_type_index').PrefixTypeIndex} attributes them
 * correctly without the event stream. For the overwhelming majority of records
 * (simple, one type each) type-set delivery is exact.
 */
export class StreamingRecordDispatcher<TypeIDType extends number> {

  /**
   * Concrete type → the handlers subscribed to it, unioned across
   * subscriptions. Dispatch is one lookup per record no matter how many
   * consumers are attached: the per-record cost of a subscription is the only
   * cost this class has at 9.4 M records, so it must not scale with the
   * subscriber count (issue #393).
   */
  private readonly byType = new Map<TypeIDType, RecordHandler<TypeIDType>[]>()

  private readonly any: RecordHandler<TypeIDType>[] = []

  /**
   * Subscribe to records of the given entity types (including their
   * subtypes).
   *
   * @param types The entity constructors whose subtype closures to match.
   * @param handler Called for each matching record.
   */
  public on(
      types: StepEntityConstructorAbstract<TypeIDType>[],
      handler: RecordHandler<TypeIDType> ): void {

    // Closures overlap between subscriptions (IfcRoot ⊃ IfcProduct, …), so a
    // type may already have handlers; dedupe within one subscription so a
    // constructor named twice doesn't deliver twice.
    for ( const typeID of new Set<TypeIDType>(
        types.flatMap( ( type ) => type.query ) ) ) {

      const handlers = this.byType.get( typeID )

      if ( handlers === void 0 ) {
        this.byType.set( typeID, [ handler ] )
      } else {
        handlers.push( handler )
      }
    }
  }

  /**
   * Subscribe to every record regardless of type (the firehose — including
   * external-mapping records).
   *
   * @param handler Called for every record.
   */
  public onAnyRecord( handler: RecordHandler<TypeIDType> ): void {
    this.any.push( handler )
  }

  /**
   * The per-record callback to hand to the streaming parse. Dispatches each
   * record to the matching subscribers. Bound so it can be passed directly.
   *
   * @param localID The record's dense local ID.
   * @param expressID The record's express ID.
   * @param typeID The record's type ID (0 for external-mapping records).
   * @param buffer The live parse window holding the record's bytes.
   * @param byteOffset Offset of the record's first byte within `buffer`.
   * @param byteLength Length of the record in bytes.
   */
  public readonly onRecordIndexed: RecordHandler<TypeIDType> =
    (
        localID: number,
        expressID: number,
        typeID: TypeIDType | undefined,
        buffer?: Uint8Array,
        byteOffset?: number,
        byteLength?: number ): void => {

      for ( const handler of this.any ) {
        handler( localID, expressID, typeID, buffer, byteOffset, byteLength )
      }

      if ( typeID !== void 0 ) {
        const handlers = this.byType.get( typeID )

        if ( handlers !== void 0 ) {
          for ( const handler of handlers ) {
            handler( localID, expressID, typeID, buffer, byteOffset, byteLength )
          }
        }
      }
    }
}
