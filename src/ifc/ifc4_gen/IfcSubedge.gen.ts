
import { IfcEdge } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsubedge.htm */
export  class IfcSubedge extends IfcEdge {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSUBEDGE
  }
  private ParentEdge_? : IfcEdge

  public get ParentEdge() : IfcEdge {
    if ( this.ParentEdge_ === void 0 ) {
      this.ParentEdge_ = this.extractElement( 2, 2, 3, false, IfcEdge )
    }

    return this.ParentEdge_ as IfcEdge
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSUBEDGE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSUBEDGE
}
