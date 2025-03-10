import StepEntityInternalReference from '../step/step_entity_internal_reference'
import StepExternalMapping from '../step/step_external_mapping'
import StepModelBase from '../step/step_model_base'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'

/**
 * IFC external step mapping
 */
export default class IfcStepExternalMapping extends StepExternalMapping< EntityTypesIfc > {

  /**
   * Construct this external mapping.
   * @param localID The local ID for this.
   * @param internalReference_ The internal reference matching this.
   * @param model The model matching this.
   */
   
  constructor(
      localID: number,
      internalReference_: StepEntityInternalReference< EntityTypesIfc >,
      model: StepModelBase<EntityTypesIfc>) {

    super(localID, internalReference_, model)
  }

  public static readonly query =
    [EntityTypesIfc.EXTERNALMAPPINGCONTAINER]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.EXTERNALMAPPINGCONTAINER
}
