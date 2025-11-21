import {
  EntityEnumFieldDescription,
  EntityFieldDescription,
  EntityReferenceFieldDescription,
  EntitySelectFieldDescription,
} from './entity_field_description'

/**
 * Maps field names to field descriptions.
 */
export interface EntityFieldsDescription< EntityTypeIDs extends number > {
  [ name: string ]:
    EntityFieldDescription< EntityTypeIDs > |
    EntityEnumFieldDescription< EntityTypeIDs > |
    EntitySelectFieldDescription< EntityTypeIDs > |
    EntityReferenceFieldDescription< EntityTypeIDs >;
}

/**
 * Reflection description for a particular entity type.
 */
export interface EntityDescription< EntityTypeIDs extends number > {
  readonly fields: EntityFieldsDescription< EntityTypeIDs >
  readonly depth: number
  readonly typeId: EntityTypeIDs
  readonly isAbstract: boolean
  readonly superType?: EntityTypeIDs
  readonly subTypes?: EntityTypeIDs[]
}
