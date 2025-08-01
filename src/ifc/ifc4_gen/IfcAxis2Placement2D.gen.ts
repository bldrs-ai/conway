
import { IfcPlacement } from "./index"
import { IfcDirection } from "./index"
import {
  IfcBuild2Axes,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcaxis2placement2d.htm */
export  class IfcAxis2Placement2D extends IfcPlacement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAXIS2PLACEMENT2D
  }
  private RefDirection_? : IfcDirection | null

  public get RefDirection() : IfcDirection | null {
    if ( this.RefDirection_ === void 0 ) {
      this.RefDirection_ = this.extractElement( 1, 1, 3, true, IfcDirection )
    }

    return this.RefDirection_ as IfcDirection | null
  }

  public get P() : Array<IfcDirection> {
    return IfcBuild2Axes(this?.RefDirection);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAXIS2PLACEMENT2D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAXIS2PLACEMENT2D
}
