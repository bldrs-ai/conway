
import { IfcLoop } from "./index"
import { IfcVertex } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcVertexLoop extends IfcLoop {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCVERTEXLOOP
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcVertexLoop.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcVertexLoop" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCVERTEXLOOP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCVERTEXLOOP
}
