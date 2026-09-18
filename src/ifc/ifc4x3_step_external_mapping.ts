import StepEntityInternalReference from '../step/step_entity_internal_reference'
import StepExternalMapping from '../step/step_external_mapping'
import StepModelBase from '../step/step_model_base'
import EntityTypesIfc4x3 from './ifc4x3_gen/entity_types_ifc4x3.gen'

/**
 * IFC4X3 external step mapping (see ifc_step_external_mapping.ts, its IFC4
 * counterpart — the two are not interoperable, see EntityTypesIfc4x3's
 * doc comment).
 */
export default class Ifc4x3StepExternalMapping extends StepExternalMapping< EntityTypesIfc4x3 > {

  /**
   * Construct this external mapping.
   *
   * @param localID The local ID for this.
   * @param internalReference_ The internal reference matching this.
   * @param model The model matching this.
   */

  constructor(
      localID: number,
      internalReference_: StepEntityInternalReference< EntityTypesIfc4x3 >,
      model: StepModelBase<EntityTypesIfc4x3>) {

    super(localID, internalReference_, model)
  }

  public static readonly query =
    [EntityTypesIfc4x3.EXTERNALMAPPINGCONTAINER]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.EXTERNALMAPPINGCONTAINER
}
