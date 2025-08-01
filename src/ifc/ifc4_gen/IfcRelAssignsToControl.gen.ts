
import { IfcRelAssigns } from "./index"
import { IfcControl } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstocontrol.htm */
export  class IfcRelAssignsToControl extends IfcRelAssigns {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOCONTROL
  }
  private RelatingControl_? : IfcControl

  public get RelatingControl() : IfcControl {
    if ( this.RelatingControl_ === void 0 ) {
      this.RelatingControl_ = this.extractElement( 6, 6, 3, false, IfcControl )
    }

    return this.RelatingControl_ as IfcControl
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOCONTROL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOCONTROL
}
