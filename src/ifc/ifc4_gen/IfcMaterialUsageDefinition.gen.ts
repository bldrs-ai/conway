

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialusagedefinition.htm */
export abstract class IfcMaterialUsageDefinition extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALUSAGEDEFINITION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIALLAYERSETUSAGE, EntityTypesIfc.IFCMATERIALPROFILESETUSAGE, EntityTypesIfc.IFCMATERIALPROFILESETUSAGETAPERING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALUSAGEDEFINITION
}
