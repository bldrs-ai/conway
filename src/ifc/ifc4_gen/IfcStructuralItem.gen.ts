
import { IfcProduct } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralitem.htm */
export abstract class IfcStructuralItem extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVECONNECTION, EntityTypesIfc.IFCSTRUCTURALPOINTCONNECTION, EntityTypesIfc.IFCSTRUCTURALSURFACECONNECTION, EntityTypesIfc.IFCSTRUCTURALCURVEMEMBER, EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBER, EntityTypesIfc.IFCSTRUCTURALCURVEMEMBERVARYING, EntityTypesIfc.IFCSTRUCTURALSURFACEMEMBERVARYING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALITEM
}
