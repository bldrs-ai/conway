import StepEntityBase from './step_entity_base'
import StepModelBase from './step_model_base'
import StepEntityInternalReference from './step_entity_internal_reference'

/**
 * Implements the external mapping functionality.
 */
export default abstract class StepExternalMapping<
    EntityTypeIDs extends number
  > extends StepEntityBase<EntityTypeIDs> {

  private items_?: StepEntityBase<EntityTypeIDs>[]

  /**
   * Get the type of this entity (0 is always external mapping)
   *
   * @return {number} The type code of this.
   */
  public get type(): EntityTypeIDs {
    return 0 as EntityTypeIDs
  }

  /**
   * Construct this external mapping.
   *
   * @param localID The local ID for this.
   * @param internalReference_ The internal reference matching this.
   * @param model The model matching this.
   */
  // eslint-disable-next-line no-useless-constructor
  constructor(
      localID: number,
      internalReference_: StepEntityInternalReference<EntityTypeIDs>,
      model: StepModelBase<EntityTypeIDs>) {

    super(localID, internalReference_, model)
  }

  /**
   * Get the externally mapped elements in this.
   *
   * @return {StepEntityBase} The inline elements of this.
   */
  public get items(): StepEntityBase<EntityTypeIDs>[] {

    if ( this.items_ === void 0 ) {

      this.items_ = []

      const inlineEntities = this.internalReference_.inlineEntities

      if ( inlineEntities !== void 0 ) {

        for ( const inlineItem of inlineEntities ) {

          const inlineElement =
            this.model.getInlineElementByAddress( inlineItem.address )

          if ( inlineElement === void 0 ) {
            continue
          }

          this.items_.push( inlineElement )
        }
      }
    }

    return this.items_
  }

  public static readonly query: number[] = [0]

  public static readonly expectedType: number = 0
}
