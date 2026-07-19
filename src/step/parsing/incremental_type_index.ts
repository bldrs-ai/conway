import { StepEntityConstructorAbstract } from '../step_entity_constructor'
import { RecordHandler } from './streaming_record_dispatcher'


/**
 * A type index built **incrementally** from the streaming parse's per-record
 * events (M2), rather than from the finished element array. Feed its
 * {@link handler} to a {@link StreamingRecordDispatcher} (or directly to
 * `buildIndexStreaming`'s `onRecordIndexed`) and it accumulates, per concrete
 * type, the set of express IDs seen — so the moment parsing reaches a record
 * it is queryable, without waiting for end-of-parse.
 *
 * Queries take entity constructors and expand to their subtype closure via
 * the generated `query` (conway #383), so `expressIDsOfTypes(IfcProduct)`
 * unions every product subtype exactly as the resident model's type index
 * does.
 *
 * Express IDs are held in per-type `Set`s, so the consumer is idempotent
 * under the streaming builder's rare grow-and-restart (records re-fire from
 * localID 0): re-adding an express ID is a no-op. Memory is O(records) — the
 * same order as the element index it mirrors.
 *
 * Scope: membership is keyed on the raw parse `typeID`. External-mapping /
 * complex records (typeID 0) are therefore not attributed to their mapped
 * classes here — resolving those needs the record's `multiMapping`, which the
 * event stream doesn't carry; that's the model's construction-time index. For
 * the overwhelming majority of records (simple, one type each) this index is
 * exact, which the parity test pins.
 */
export class IncrementalTypeIndex<TypeIDType extends number> {

  /** Concrete typeID → express IDs of records of exactly that type. */
  private readonly byType_ = new Map<TypeIDType, Set<number>>()

  /**
   * Record one indexed entity. Bound as {@link handler} for direct use as a
   * dispatcher subscription / `onRecordIndexed` callback.
   *
   * @param localID Unused (kept for the RecordHandler shape).
   * @param expressID The record's express ID.
   * @param typeID The record's concrete type ID (undefined / 0 records are
   * ignored — they carry no concrete queryable type here).
   */
  public readonly handler: RecordHandler<TypeIDType> =
    ( localID: number, expressID: number, typeID: TypeIDType | undefined ): void => {

      if ( typeID === void 0 ) {
        return
      }

      let ids = this.byType_.get( typeID )

      if ( ids === void 0 ) {
        ids = new Set<number>()
        this.byType_.set( typeID, ids )
      }

      ids.add( expressID )
    }

  /**
   * The distinct concrete type IDs seen so far.
   *
   * @return {IterableIterator<TypeIDType>} The concrete types.
   */
  public concreteTypes(): IterableIterator<TypeIDType> {
    return this.byType_.keys()
  }

  /**
   * Lazily iterate the express IDs of all records of the given types
   * (including subtypes).
   *
   * @param types The entity constructors to query (subtype closures unioned).
   * @return {IterableIterator<number>} Express IDs of matching records.
   * @yields {number} Each matching express ID.
   */
  public* expressIDsOfTypes(
      ...types: StepEntityConstructorAbstract<TypeIDType>[] ):
      IterableIterator<number> {

    const typeSet = types.length === 1 ? types[0].query :
      new Set<TypeIDType>( types.flatMap( ( type ) => type.query ) )

    for ( const typeID of typeSet ) {
      const ids = this.byType_.get( typeID as TypeIDType )

      if ( ids !== void 0 ) {
        yield* ids
      }
    }
  }

  /**
   * Count records of the given types (including subtypes) seen so far.
   *
   * @param types The entity constructors to count.
   * @return {number} The number of matching records.
   */
  public count( ...types: StepEntityConstructorAbstract<TypeIDType>[] ): number {

    const typeSet = types.length === 1 ? types[0].query :
      new Set<TypeIDType>( types.flatMap( ( type ) => type.query ) )

    let total = 0

    for ( const typeID of typeSet ) {
      total += this.byType_.get( typeID as TypeIDType )?.size ?? 0
    }

    return total
  }
}
