import { AP214ProductStructureExtraction } from './ap214_product_structure_extraction'
import AP214StepModel from './ap214_step_model'
import { descriptive_representation_item } from './AP214E3_2010_gen/descriptive_representation_item.gen'
import { general_property } from './AP214E3_2010_gen/general_property.gen'
import { general_property_association } from './AP214E3_2010_gen/general_property_association.gen'
import { measure_representation_item } from './AP214E3_2010_gen/measure_representation_item.gen'
import { property_definition } from './AP214E3_2010_gen/property_definition.gen'
import { property_definition_representation } from './AP214E3_2010_gen/property_definition_representation.gen'
import { shape_definition_representation } from './AP214E3_2010_gen/shape_definition_representation.gen'
import Logger from '../logging/logger'


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
   * A `property_definition_representation` whose chain cannot be typed against
   * the AP214 schema is skipped with a warning rather than propagating — see
   * the comment on the `try` below.
   *
   * @param pdr The property-definition representation to walk.
   * @param result The accumulating per-part property map.
   */
  private collectFromRepresentation(
      pdr: property_definition_representation,
      result: ExtractedPropertyMap ): void {

    // Two getters in this chain throw on AP242 files, which route through the
    // AP214 loader by design (design/new/step-metadata-nist.md §"The AP242
    // wrinkle"), so AP242-only entities reach here routinely. Both are
    // observed on the NIST PMI corpus, from bldrs-ai/test-models#61:
    //
    // - `representation.items`: `extractBufferElement`
    //   (src/step/step_entity_base.ts) throws `unresolvedReferenceError_`
    //   ("Value in STEP was incorrectly typed") when an item names a type the
    //   schema has no class for — `#4319=REPRESENTATION('',(#4270,…),#4351)`
    //   over `INTEGER_REPRESENTATION_ITEM` user-attribute counters.
    // - `property_definition.definition`: the generated `characterized_
    //   definition` SELECT narrows to AP214's member list and throws
    //   ("Value in STEP was incorrectly typed for field") otherwise —
    //   `#4344=PROPERTY_DEFINITION('pmi validation property','',#13)`, where
    //   `#13` is the complex `CHARACTERIZED_OBJECT | CHARACTERIZED_
    //   REPRESENTATION | DRAUGHTING_MODEL | REPRESENTATION` PMI model.
    //
    // Uncaught, either one took down the whole property map — and with it the
    // spatial structure built alongside it — for 16 of the 17 NIST AP242 PMI
    // files. Skipping the offending `pdr` is what the design doc's Phase 0
    // already promises: structure + properties come through "with unknowns
    // skipped". Rows accumulate in a local array and are merged only on
    // success, so a skip is all-or-nothing for one `pdr` and can never leave
    // half a representation's rows in `result`.
    //
    // Nothing this tier would have surfaced is lost, checked over the corpus.
    // The skips are of exactly two kinds. Either the representation's items
    // are wholly AP242-only (the INTEGER_REPRESENTATION_ITEM PMI counters —
    // no mixed typeable/untypeable representation occurs), or the throw is on
    // the *owner* side, where the `characterized_definition` is an AP242-only
    // member — `CHARACTERIZED_ITEM_WITHIN_REPRESENTATION` for a PMI linear
    // size, the complex draughting model above. Those own feature-level PMI,
    // and `resolveProductDefinitionId` returns `void 0` for anything that is
    // not a `product_definition` or `product_definition_shape`, so this
    // (Simplified) tier already dropped them before the fix — see the note on
    // `extractProperties`.
    try {

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

      const rows: ExtractedProperty[] = []

      for ( const item of representation.items ) {

        const property = AP214PropertyExtraction.toProperty( item, fallbackKey, group )

        if ( property === void 0 ) {
          continue
        }

        rows.push( property )
      }

      if ( rows.length === 0 ) {
        return
      }

      const existing = result.get( ownerId )

      if ( existing === void 0 ) {
        result.set( ownerId, rows )
      } else {
        existing.push( ...rows )
      }

    } catch ( error ) {

      // toString(), not localID — localID is the dense internal index and
      // means nothing against the source file; the reference is what a reader
      // can go look up. Same idiom as populateStyledItemsMap() in
      // ap214_geometry_extraction.ts.
      Logger.warning(
          `Skipping property definition representation that is untypeable in AP214: ${error}`,
          pdr.toString() )
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
