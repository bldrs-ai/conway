import { AP214ProductStructureExtraction } from './ap214_product_structure_extraction'
import AP214StepModel from './ap214_step_model'
import { descriptive_representation_item } from './AP214E3_2010_gen/descriptive_representation_item.gen'
import { general_property } from './AP214E3_2010_gen/general_property.gen'
import { general_property_association } from './AP214E3_2010_gen/general_property_association.gen'
import { measure_representation_item } from './AP214E3_2010_gen/measure_representation_item.gen'
import { property_definition } from './AP214E3_2010_gen/property_definition.gen'
import { property_definition_representation } from './AP214E3_2010_gen/property_definition_representation.gen'
import { shape_definition_representation } from './AP214E3_2010_gen/shape_definition_representation.gen'


/**
 * One extracted key/value property row for a part.
 */
export interface ExtractedProperty {

  /** Property key, e.g. `'Modeled By'`, `'volume measure'`. */
  name: string

  /** Stringified value, e.g. `'Engineer'`, `'14644822.6361138'`. */
  value: string

  /** Numeric value for measure properties (volume/area/…); `undefined` for text. */
  numericValue?: number

  /**
   * Grouping label from the owning `property_definition.name` — e.g.
   * `'geometric validation property'` for NIST volume/area validation rows.
   * Empty for plain attribute properties.
   */
  group: string

  /**
   * Express id of the source representation item (the
   * `descriptive_representation_item` / `measure_representation_item`). The
   * compat surface uses it as the property's own express id so the web-ifc
   * `IfcPropertySet.HasProperties` reference handles can be resolved back to
   * this row via `getItemProperties`. `undefined` if the item carried no id.
   */
  expressID?: number
}

/** Properties grouped by the express id of the owning `product_definition`. */
export type ExtractedPropertyMap = Map<number, ExtractedProperty[]>

/** Minimal shape of a representation item needed for property conversion. */
interface RepresentationItemLike {
  name: string
  expressID?: number
}

/**
 * Extracts STEP part properties from a populated {@link AP214StepModel}.
 *
 * Walks the property chain
 * `general_property` → (`general_property_association`) → `property_definition`
 * → `property_definition_representation` → `representation` →
 * `descriptive_representation_item` / `measure_representation_item` into
 * per-part key/value rows. Includes the NIST validation properties
 * (`geometric/attribute validation property`, e.g. volume via
 * `measure_representation_item`).
 *
 * Mirrors the IFC precedent (`src/ifc/ifc_property_extraction.ts`); feeds the
 * web-ifc compat surface `ap214_properties.ts` that Share consumes.
 */
export class AP214PropertyExtraction {

  private readonly generalPropertyNameByDef_ = new Map<number, string>()

  /**
   * @param model The populated AP214/AP242 step model to walk.
   */
  constructor( private readonly model: AP214StepModel ) {
  }

  /**
   * Build the per-part property map.
   *
   * @return {ExtractedPropertyMap} Properties keyed by owning
   * `product_definition` express id. Properties whose owner is a feature
   * (`shape_aspect`, dimensions) rather than a part are skipped at this
   * (Simplified) tier — they belong to the Full PMI tier.
   */
  public extractProperties(): ExtractedPropertyMap {

    this.indexGeneralPropertyNames()

    const result: ExtractedPropertyMap = new Map<number, ExtractedProperty[]>()

    for ( const element of this.model.types( property_definition_representation ) ) {

      // shape_definition_representation is a subtype: its representation holds
      // geometry, not properties — skip it here, geometry extraction owns it.
      if ( element instanceof shape_definition_representation ) {
        continue
      }

      const pdr = element as property_definition_representation

      this.collectFromRepresentation( pdr, result )
    }

    return result
  }

  /**
   * Index general-property names by the express id of the `property_definition`
   * they are associated with, so a property can carry the canonical
   * `general_property` label when one exists.
   */
  private indexGeneralPropertyNames(): void {

    for ( const element of this.model.types( general_property_association ) ) {

      const association = element as general_property_association

      const base = association.base_definition
      const derived = association.derived_definition

      if ( !( base instanceof general_property ) ||
           !( derived instanceof property_definition ) ) {
        continue
      }

      const definitionId = derived.expressID

      if ( definitionId !== void 0 && base.name.length > 0 ) {
        this.generalPropertyNameByDef_.set( definitionId, base.name )
      }
    }
  }

  /**
   * Resolve the part owner and value rows for one
   * `property_definition_representation` and append them to the result map.
   *
   * @param pdr The property-definition representation to walk.
   * @param result The accumulating per-part property map.
   */
  private collectFromRepresentation(
      pdr: property_definition_representation,
      result: ExtractedPropertyMap ): void {

    const propertyDefinition = pdr.definition

    if ( !( propertyDefinition instanceof property_definition ) ) {
      return
    }

    const ownerId =
      AP214ProductStructureExtraction.resolveProductDefinitionId( propertyDefinition.definition )

    if ( ownerId === void 0 ) {
      return
    }

    const definitionId = propertyDefinition.expressID
    const group = propertyDefinition.name
    const fallbackKey =
      ( definitionId !== void 0 ? this.generalPropertyNameByDef_.get( definitionId ) : void 0 ) ??
      ( group.length > 0 ? group : ( propertyDefinition.description ?? '' ) )

    const representation = pdr.used_representation

    if ( representation === void 0 ) {
      return
    }

    for ( const item of representation.items ) {

      const property = AP214PropertyExtraction.toProperty( item, fallbackKey, group )

      if ( property === void 0 ) {
        continue
      }

      let rows = result.get( ownerId )

      if ( rows === void 0 ) {
        rows = []
        result.set( ownerId, rows )
      }

      rows.push( property )
    }
  }

  /**
   * Convert a representation item into a property row, or `undefined` for item
   * kinds that carry no key/value (e.g. a centroid `cartesian_point`).
   *
   * @param item The representation item to convert.
   * @param fallbackKey Key to use when the item itself is unnamed.
   * @param group Grouping label from the owning property definition.
   * @return {ExtractedProperty | undefined} The property row, or `undefined`.
   */
  static toProperty(
      item: RepresentationItemLike,
      fallbackKey: string,
      group: string ): ExtractedProperty | undefined {

    const key = item.name.length > 0 ? item.name : fallbackKey
    const expressID = item.expressID

    if ( item instanceof descriptive_representation_item ) {

      // Skip a descriptive item with no value — it would surface as a blank
      // key/value row in the Properties panel where there is nothing to show.
      if ( item.description.length === 0 ) {
        return void 0
      }

      return { name: key, value: item.description, group, expressID }
    }

    if ( item instanceof measure_representation_item ) {

      // `value_component` is a `measure_value` SELECT: most members carry a
      // numeric `.Value`, but `descriptive_measure` / `context_dependent_measure`
      // carry a string. Only treat a genuinely numeric value as `numericValue`
      // so a textual measure doesn't end up typed as a number downstream.
      const rawValue = ( item.value_component as unknown as { Value: unknown } ).Value

      if ( typeof rawValue === 'number' ) {
        return { name: key, value: String( rawValue ), numericValue: rawValue, group, expressID }
      }

      return { name: key, value: String( rawValue ), group, expressID }
    }

    return void 0
  }
}
