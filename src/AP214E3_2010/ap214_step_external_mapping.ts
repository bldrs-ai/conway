import StepEntityInternalReference from '../step/step_entity_internal_reference'
import StepExternalMapping from '../step/step_external_mapping'
import StepModelBase from '../step/step_model_base'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'


/**
 * IFC external step mapping
 */
export default class AP214StepExternalMapping extends StepExternalMapping< EntityTypesAP214 > {

  /**
   * Construct this external mapping.
   *
   * @param localID The local ID for this.
   * @param internalReference_ The internal reference matching this.
   * @param model The model matching this.
   */
   
  constructor(
      localID: number,
      internalReference_: StepEntityInternalReference< EntityTypesAP214 >,
      model: StepModelBase<EntityTypesAP214>) {

    super(localID, internalReference_, model)
  }

  public static readonly query =
    [EntityTypesAP214.EXTERNALMAPPINGCONTAINER]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTERNALMAPPINGCONTAINER
}
