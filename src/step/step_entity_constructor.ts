import StepEntityBase from './step_entity_base'
import StepEntityInternalReference from './step_entity_internal_reference'
import StepModelBase from './step_model_base'


/**
 * Represents a concrete constructor for a step based entity,
 * as well as the expected static members.
 */
export default interface StepEntityConstructor<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase< EntityTypeIDs > = StepEntityBase< EntityTypeIDs > > {
  new(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypeIDs >,
    model: StepModelBase< EntityTypeIDs, BaseEntity >, 
    multiReference?: StepEntityInternalReference< EntityTypeIDs >[] ) : BaseEntity;

  /**
   * The query for this type (includes the sub-types related to build the query from the
   * inverted type index).
   */
  readonly query: EntityTypeIDs[]

  /**
   * The most concrete entity ID of this.
   */
  readonly expectedType: EntityTypeIDs
}

/**
 * Represents an abstrct step entity constructor function.
 */
type StepEntityConstructorAbstractType<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase< EntityTypeIDs > = StepEntityBase< EntityTypeIDs > > =
    abstract new(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypeIDs >,
      model: StepModelBase< EntityTypeIDs, BaseEntity >, 
      multiReference?: StepEntityInternalReference< EntityTypeIDs >[] ) => BaseEntity

/**
 * Represents abstract and non-abstract Entity types constructors, allowing them to be used for
 * type-safe computation and querying.
 */
export interface StepEntityConstructorAbstract<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase< EntityTypeIDs > = StepEntityBase< EntityTypeIDs > > extends
  StepEntityConstructorAbstractType< EntityTypeIDs, BaseEntity > {
  /**
   * The query for this type (includes the sub-types related to build the query from the
   * inverted type index).
   */
  readonly query: EntityTypeIDs[];

  /**
   * The most concrete entity ID of this.
   */
  readonly expectedType: EntityTypeIDs
}
