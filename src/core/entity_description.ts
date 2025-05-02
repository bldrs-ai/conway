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
  fields: EntityFieldsDescription< EntityTypeIDs >
  typeId: EntityTypeIDs
  isAbstract: boolean
  superType?: EntityTypeIDs
  subTypes?: EntityTypeIDs[]
}
