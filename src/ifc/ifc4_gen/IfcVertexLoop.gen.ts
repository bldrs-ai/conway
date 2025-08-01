
import { IfcLoop } from "./index"
import { IfcVertex } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvertexloop.htm */
export  class IfcVertexLoop extends IfcLoop {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVERTEXLOOP
  }
  private LoopVertex_? : IfcVertex

  public get LoopVertex() : IfcVertex {
    if ( this.LoopVertex_ === void 0 ) {
      this.LoopVertex_ = this.extractElement( 0, 0, 3, false, IfcVertex )
    }

    return this.LoopVertex_ as IfcVertex
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVERTEXLOOP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVERTEXLOOP
}
