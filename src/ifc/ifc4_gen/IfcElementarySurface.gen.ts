
import { IfcSurface } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementarysurface.htm */
export abstract class IfcElementarySurface extends IfcSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTARYSURFACE
  }
  private Position_? : IfcAxis2Placement3D

  public get Position() : IfcAxis2Placement3D {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 0, 0, 3, false, IfcAxis2Placement3D )
    }

    return this.Position_ as IfcAxis2Placement3D
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCYLINDRICALSURFACE, EntityTypesIfc.IFCPLANE, EntityTypesIfc.IFCSPHERICALSURFACE, EntityTypesIfc.IFCTOROIDALSURFACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTARYSURFACE
}
