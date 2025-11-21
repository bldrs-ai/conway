 
export enum FieldDescriptionKind {
  SELECT         = 0,
  NUMBER         = 1,
  STRING         = 2,
  BOOLEAN        = 3,
  STEP_REFERENCE = 4,
  ENUM           = 5,
  BINARY_DATA    = 6,
}
 

/**
 * Base field type for an entity described via reflection.
 */
 
export interface EntityFieldDescription< EntityTypeIDs extends number > {
  /**
   * The kind of this field.
   */
  readonly kind: FieldDescriptionKind
  /**
   * Defined if this is an array, with the rank (how many nested arrays/dimensions are there)
   */
  readonly rank?: number
  /**
   * Is this field optional? Note, logical fields will be treated as boolean optionals.
   */
  readonly optional: boolean
  /**
   * Is this field derived? i.e. generated from a function.
   */
  readonly derived: boolean
  /**
   * For non derived fields, this is the ordinal position of the field
   * within a positional serialization.
   */
  readonly offset?: number
}

/**
 * A required field in reflection.
 */
export interface EntityFieldDescriptionRequired< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly optional: false
}

/**
 * An optional field in reflection.
 */
export interface EntityFieldDescriptionOptional< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly optional: true
}

/**
 * An array field in reflection.
 */
export interface EntityFieldDescriptionArray< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly rank: number
}

/**
 * A scalar field (no array)
 */
export interface EntityFieldDescriptionScalar< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly rank: undefined
}

/**
 * A field representing a select type (has multiple options)
 */
export interface EntitySelectFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.SELECT
  /**
   * The various options that can be selected from.
   */
  readonly options:
    ( ( EntityReferenceFieldDescription< EntityTypeIDs > |
        EntityEnumFieldDescription< EntityTypeIDs > ) &
      EntityFieldDescriptionRequired< EntityTypeIDs > )[]
}

/**
 * A number field.
 */
export interface EntityNumberFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.NUMBER
}

/**
 * A string field.
 */
export interface EntityStringFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.STRING
}

/**
 * A boolean field.
 */
export interface EntityBooleanFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.BOOLEAN
}

/**
 * A logical field.
 */
export type EntityLogicalFieldDescription< EntityTypeIDs extends number > =
  EntityBooleanFieldDescription< EntityTypeIDs > & EntityFieldDescriptionOptional< EntityTypeIDs >

/**
 * A reference field.
 */
export interface EntityReferenceFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.STEP_REFERENCE
  /**
   * The type reference for this field as an ID, which can be used to look-up
   * a schema.
   */
  readonly type: EntityTypeIDs
}

/**
 * An enum typed field.
 */
export interface EntityEnumFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.ENUM
  /**
   * The type of the enum.
   */
  readonly type: object
}

/**
 * A boolean field.
 */
export interface EntityBinaryDataFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  readonly kind: FieldDescriptionKind.BINARY_DATA
}
