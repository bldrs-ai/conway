
import { IfcSweptSurface } from "./index"
import { IfcAxis1Placement } from "./index"
import { IfcLine } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfaceofrevolution.htm */
export  class IfcSurfaceOfRevolution extends IfcSweptSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACEOFREVOLUTION
  }
  private AxisPosition_? : IfcAxis1Placement

  public get AxisPosition() : IfcAxis1Placement {
    if ( this.AxisPosition_ === void 0 ) {
      this.AxisPosition_ = this.extractElement( 2, 2, 4, false, IfcAxis1Placement )
    }

    return this.AxisPosition_ as IfcAxis1Placement
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACEOFREVOLUTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACEOFREVOLUTION
}
