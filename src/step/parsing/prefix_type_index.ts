import { extractOneHotLow } from '../../indexing/bit_operations'
import { MultiIndexSet } from '../../indexing/multi_index_set'
import { StepTypeIndexer } from '../indexing/step_type_indexer'
import { StepEntityConstructorAbstract } from '../step_entity_constructor'
import { ColumnarIndexSink, StepIndexColumns } from './columnar_index'


/** Default record growth between automatic rebuilds — see the class docs. */
const DEFAULT_GROWTH_FACTOR = 2.0

/** Below this many records a rebuild is cheap enough not to bother pacing. */
const DEFAULT_MINIMUM_RECORDS = 1024


/**
 * A type index over the records parsed **so far** (M2, issue #393): the same
 * membership the finished model exposes as `typeIndex`, available while the
 * streaming parse is still running.
 *
 * It is a *derivation over the columnar index*, not a consumer of the
 * per-record event stream — deliberately, and this is the M2 design decision
 * that the 2026-08-18 spike settled (`scripts/m2_consumer_spike.mjs`; issue
 * #393 for the tables). Pushing every record into per-type `Set`s cost +88 %
 * of parse wall-clock and +254 MB on PSB (9.4 M records) and *still* produced
 * the wrong answer — 83 concrete types against the production indexer's 95,
 * because complex records arrive on the event stream as `typeID 0` with their
 * mapped classes stripped. Rebuilding from a prefix snapshot through
 * {@link StepTypeIndexer.createFromColumns} instead costs 121 ms on the same
 * file, sees the complex entries' mapped subtypes, and is membership-identical
 * to the finished model's index by construction — it is literally the same
 * indexer call the model makes.
 *
 * The consequence for callers is that incrementality is a **cadence knob**
 * rather than an architecture. Nothing happens per record; a rebuild happens
 * when someone asks for a view that is more than `growthFactor` stale (14
 * rebuilds over a PSB parse at the default 2.0, +7.2 % if you query
 * continuously, ~0 if you query rarely). Callers that want a specific moment —
 * a preview generation, a progress tick — call {@link refresh} themselves.
 *
 * Queries are only ever answered from a built index, so a caller that has
 * never queried has paid nothing.
 */
export class PrefixTypeIndex<TypeIDType extends number> {

  private index_: MultiIndexSet<TypeIDType> | undefined = void 0

  private columns_: StepIndexColumns<TypeIDType> | undefined = void 0

  private builtAtRecords_ = 0

  private generation_ = 0

  private readonly growthFactor_: number

  private readonly minimumRecords_: number

  /**
   * @param sink_ The sink the streaming parse is filling. Held live: each
   * rebuild takes a fresh {@link ColumnarIndexSink.snapshot} of it.
   * @param indexer_ The schema's type indexer — the same instance kind the
   * model builds its own `typeIndex` with, which is what makes the two
   * membership-identical.
   * @param options Rebuild pacing.
   * @param options.growthFactor How much the record count must grow past the
   * last build before a query rebuilds (default 2.0).
   * @param options.minimumRecords The record count below which growth pacing
   * is skipped — small parses just rebuild.
   */
  constructor(
    private readonly sink_: ColumnarIndexSink<TypeIDType>,
    private readonly indexer_: StepTypeIndexer<TypeIDType>,
    options?: { growthFactor?: number, minimumRecords?: number } ) {

    this.growthFactor_ = options?.growthFactor ?? DEFAULT_GROWTH_FACTOR
    this.minimumRecords_ = options?.minimumRecords ?? DEFAULT_MINIMUM_RECORDS
  }

  /**
   * How many rebuilds have happened. A caller pacing its own UI can use this
   * to tell a genuinely new view from a repeat query.
   *
   * @return {number} The generation counter, 0 before the first build.
   */
  public get generation(): number {
    return this.generation_
  }

  /**
   * The record count the current view was built at (0 if never built) — not
   * the parse's current count, which is `sink.count`.
   *
   * @return {number} Records covered by the current view.
   */
  public get recordCount(): number {
    return this.builtAtRecords_
  }

  /**
   * Rebuild the view over everything parsed so far, unconditionally. This is
   * the expensive call — O(records) — and it is the caller's choice of when.
   */
  public refresh(): void {
    this.columns_ = this.sink_.snapshot()
    this.index_ = this.indexer_.createFromColumns( this.columns_ )
    this.builtAtRecords_ = this.sink_.topLevelCount
    ++this.generation_
  }

  /**
   * Rebuild only if the parse has moved far enough past the current view (or
   * there is no view yet). Every query goes through this.
   */
  private ensureFresh(): void {
    const parsed = this.sink_.topLevelCount

    if ( this.index_ === void 0 ) {
      this.refresh()
      return
    }

    // A count that went BACKWARDS means the sink was reset — the streaming
    // builder's grow-and-restart. The current view then describes records the
    // restarted parse has not reached again, and growth pacing would never
    // catch it (the new parse may finish below the old threshold), so it is
    // rebuilt immediately rather than paced.
    if ( parsed < this.builtAtRecords_ ) {
      this.refresh()
      return
    }

    const stale = parsed > Math.max(
        this.minimumRecords_, this.builtAtRecords_ * this.growthFactor_ )

    if ( stale ) {
      this.refresh()
    }
  }

  /**
   * The distinct types present in the current view, including the mapped
   * classes of complex entries.
   *
   * @return {IterableIterator<TypeIDType>} The types.
   */
  public types(): IterableIterator<TypeIDType> {
    this.ensureFresh()

    return this.index_!.types()
  }

  /**
   * Express IDs of every record of the given types (subtype closures unioned
   * via the generated `query`, conway #383) among the records parsed so far.
   *
   * @param types The entity constructors to query.
   * @return {IterableIterator<number>} Matching express IDs, in parse order.
   * @yields {number} Each matching express ID.
   */
  public* expressIDsOfTypes(
      ...types: StepEntityConstructorAbstract<TypeIDType>[] ):
      IterableIterator<number> {

    const distinct = types.length === 1 ?
      types[ 0 ].query :
      new Set( types.flatMap( ( type ) => type.query ) )

    yield* this.expressIDsOfTypeIDs( ...distinct )
  }

  /**
   * Express IDs of records whose concrete (or mapped) type is one of the
   * given raw type IDs — no subtype expansion. The closure-expanding
   * {@link expressIDsOfTypes} is the caller-facing form; this is for callers
   * that already hold type IDs.
   *
   * @param typeIDs The raw type IDs to union.
   * @return {IterableIterator<number>} Matching express IDs, in parse order.
   * @yields {number} Each matching express ID.
   */
  public* expressIDsOfTypeIDs( ...typeIDs: TypeIDType[] ): IterableIterator<number> {
    this.ensureFresh()

    const columns = this.columns_!
    const expressIDs = columns.expressID
    const firstInlineElement = columns.firstInlineElement
    const cursor = this.index_!.cursor( ...typeIDs )

    while ( cursor.step() ) {
      const high = cursor.high

      let low = cursor.low

      while ( low !== 0 ) {
        const lowestOneHot = extractOneHotLow( low )

        low ^= ( 1 << lowestOneHot )

        const localID = high | lowestOneHot

        // Inline entities carry no express ID — the same guard the model's
        // expressIDsOfTypes applies over its own columns.
        if ( localID < firstInlineElement ) {
          yield expressIDs[ localID ]
        }
      }
    }
  }

  /**
   * Upper-bound count of records of the given types in the current view (see
   * {@link MultiIndexSet.count} for why it is an upper bound).
   *
   * @param types The entity constructors to count.
   * @return {number} The count.
   */
  public count( ...types: StepEntityConstructorAbstract<TypeIDType>[] ): number {
    this.ensureFresh()

    const distinct = types.length === 1 ?
      types[ 0 ].query :
      [ ...new Set( types.flatMap( ( type ) => type.query ) ) ]

    return this.index_!.count( ...distinct )
  }
}
