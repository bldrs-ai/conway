/* eslint-disable no-shadow,no-unused-vars,no-magic-numbers */
export enum FieldDescriptionKind {
  SELECT         = 0,
  NUMBER         = 1,
  STRING         = 2,
  BOOLEAN        = 3,
  STEP_REFERENCE = 4,
  ENUM           = 5,
  BINARY_DATA    = 6,
}
/* eslint-enable no-shadow,no-unused-vars,no-magic-numbers */

/**
 * Base field type for an entity described via reflection.
 */
// eslint-disable-next-line no-unused-vars
export interface EntityFieldDescription< EntityTypeIDs extends number > {
  /**
   * The kind of this field.
   */
  kind: FieldDescriptionKind
  /**
   * Defined if this is an array, with the rank (how many nested arrays/dimensions are there)
   */
  rank?: number
  /**
   * Is this field optional? Note, logical fields will be treated as boolean optionals.
   */
  optional: boolean
  /**
   * Is this field derived? i.e. generated from a function.
   */
  derived: boolean
}

/**
 * A required field in reflection.
 */
export interface EntityFieldDescriptionRequired< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  optional: false
}

/**
 * An optional field in reflection.
 */
export interface EntityFieldDescriptionOptional< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  optional: true
}

/**
 * An array field in reflection.
 */
export interface EntityFieldDescriptionArray< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  rank: number
}

/**
 * A scalar field (no array)
 */
export interface EntityFieldDescriptionScalar< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  rank: undefined
}

/**
 * A field representing a select type (has multiple options)
 */
export interface EntitySelectFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.SELECT
  /**
   * The various options that can be selected from.
   */
  options:
    ( ( EntityReferenceFieldDescription< EntityTypeIDs > |
        EntityEnumFieldDescription< EntityTypeIDs > ) &
      EntityFieldDescriptionRequired< EntityTypeIDs > )[]
}

/**
 * A number field.
 */
export interface EntityNumberFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.NUMBER
}

/**
 * A string field.
 */
export interface EntityStringFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.STRING
}

/**
 * A boolean field.
 */
export interface EntityBooleanFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.BOOLEAN
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
  kind: FieldDescriptionKind.STEP_REFERENCE
  /**
   * The type reference for this field as an ID, which can be used to look-up
   * a schema.
   */
  type: EntityTypeIDs
}

/**
 * An enum typed field.
 */
export interface EntityEnumFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.ENUM
  /**
   * The type of the enum.
   */
  type: object
}

/**
 * A boolean field.
 */
export interface EntityBinaryDataFieldDescription< EntityTypeIDs extends number > extends
    EntityFieldDescription< EntityTypeIDs > {
  kind: FieldDescriptionKind.BINARY_DATA
}
