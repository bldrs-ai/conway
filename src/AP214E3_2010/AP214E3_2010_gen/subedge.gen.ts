
import { edge } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class subedge extends edge {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SUBEDGE
  }
  private parent_edge_? : edge

  public get parent_edge() : edge {
    if ( this.parent_edge_ === void 0 ) {
      this.parent_edge_ = this.extractElement( 3, 3, 3, false, edge )
    }

    return this.parent_edge_ as edge
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === subedge.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for subedge" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SUBEDGE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SUBEDGE
}
