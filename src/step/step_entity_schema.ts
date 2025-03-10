import StepParser from './parsing/step_parser'
import { EntityDescription } from '../core/entity_description'
import StepEntityBase from './step_entity_base'
import StepEntityConstructor from './step_entity_constructor'

/**
 * A schema specified for entities to be parsed from step.
 */
export default class StepEntitySchema<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase< EntityTypeIDs > =
    StepEntityBase< EntityTypeIDs > > {
  /**
   * Construct the schema
   *
   * @param constructors The constructor array matching the entity type IDs for this entity.
   * @param parser The STEP parser used to extract entities that matches this schema.
   * @param queries The set of queries including subtypes to be able to read data from a type index.
   */
  /* Note that ES lint doesn't parse the typescript meaning of this constructor
   * correctly. */
  /* eslint-disable no-useless-constructor, no-empty-function */
  constructor(
    public readonly constructors: ReadonlyArray<
      StepEntityConstructor< EntityTypeIDs, BaseEntity > | undefined >,
    public readonly parser: StepParser< EntityTypeIDs >,
    public readonly queries: ReadonlyArray< ReadonlyArray< EntityTypeIDs > >,
    public readonly reflection: ReadonlyArray< EntityDescription< EntityTypeIDs > > ) {}
  /* eslint-enable no-useless-constructor, no-empty-function */
}
