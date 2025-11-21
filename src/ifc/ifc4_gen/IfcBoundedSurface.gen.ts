
import { IfcSurface } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboundedsurface.htm */
export abstract class IfcBoundedSurface extends IfcSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOUNDEDSURFACE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVEBOUNDEDPLANE, EntityTypesIfc.IFCCURVEBOUNDEDSURFACE, EntityTypesIfc.IFCRECTANGULARTRIMMEDSURFACE, EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS, EntityTypesIfc.IFCRATIONALBSPLINESURFACEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOUNDEDSURFACE
}
