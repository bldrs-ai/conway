
import { loop } from "./index"
import { vertex } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/vertex_loop.htm */
export  class vertex_loop extends loop {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.VERTEX_LOOP
  }
  private loop_vertex_? : vertex

  public get loop_vertex() : vertex {
    if ( this.loop_vertex_ === void 0 ) {
      this.loop_vertex_ = this.extractElement( 1, false, vertex )
    }

    return this.loop_vertex_ as vertex
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.VERTEX_LOOP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.VERTEX_LOOP
}