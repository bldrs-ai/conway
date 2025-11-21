import {StepIndexEntryBase} from './parsing/step_parser'
import {IndexMark} from './parsing/step_vtable_builder'
import StepEntityBase from './step_entity_base'

/**
 * Represents an internal reference with details to access
 * an object vtable, the buffer the object is in etc.
 */
export default interface StepEntityInternalReference< EntityTypeIDs extends number > extends
  StepIndexEntryBase< EntityTypeIDs > {
  vtableIndex?: IndexMark
  vtableCount?: number
  endCursor?: number
  buffer?: Uint8Array
  vtable?: Uint32Array
  visitedMulti?: boolean
  multiMapping?: StepEntityInternalReference<EntityTypeIDs>[]
  multiEntity?: StepEntityBase< EntityTypeIDs >[]
}

/**
 * Extended private version of the above that references the entity.
 */
export interface StepEntityInternalReferencePrivate<
  EntityTypeIDs extends number,
  BaseEntity extends StepEntityBase< EntityTypeIDs > > extends
  StepEntityInternalReference< EntityTypeIDs > {
  entity?: BaseEntity
  multiEntity?: BaseEntity[]
  multiMapping?: StepEntityInternalReferencePrivate< EntityTypeIDs, BaseEntity >[]
}
