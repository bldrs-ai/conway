
import { IfcGeometricRepresentationItem } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurface.htm */
export abstract class IfcSurface extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACE
  }


  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCURVEBOUNDEDPLANE, EntityTypesIfc.IFCCURVEBOUNDEDSURFACE, EntityTypesIfc.IFCRECTANGULARTRIMMEDSURFACE, EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS, EntityTypesIfc.IFCRATIONALBSPLINESURFACEWITHKNOTS, EntityTypesIfc.IFCCYLINDRICALSURFACE, EntityTypesIfc.IFCPLANE, EntityTypesIfc.IFCSPHERICALSURFACE, EntityTypesIfc.IFCTOROIDALSURFACE, EntityTypesIfc.IFCSURFACEOFLINEAREXTRUSION, EntityTypesIfc.IFCSURFACEOFREVOLUTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACE
}
