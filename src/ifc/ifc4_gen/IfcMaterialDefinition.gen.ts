

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmaterialdefinition.htm */
export abstract class IfcMaterialDefinition extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMATERIALDEFINITION
  }




  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMATERIAL, EntityTypesIfc.IFCMATERIALCONSTITUENT, EntityTypesIfc.IFCMATERIALCONSTITUENTSET, EntityTypesIfc.IFCMATERIALLAYER, EntityTypesIfc.IFCMATERIALLAYERSET, EntityTypesIfc.IFCMATERIALPROFILE, EntityTypesIfc.IFCMATERIALPROFILESET, EntityTypesIfc.IFCMATERIALLAYERWITHOFFSETS, EntityTypesIfc.IFCMATERIALPROFILEWITHOFFSETS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMATERIALDEFINITION
}
