
import { IfcPlacement } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcaxis1placement.htm */
export  class IfcAxis1Placement extends IfcPlacement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAXIS1PLACEMENT
  }
  private Axis_? : IfcDirection | null

  public get Axis() : IfcDirection | null {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 1, 1, 3, true, IfcDirection )
    }

    return this.Axis_ as IfcDirection | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAXIS1PLACEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAXIS1PLACEMENT
}
