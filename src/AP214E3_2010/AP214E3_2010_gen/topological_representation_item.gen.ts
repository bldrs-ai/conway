
import { representation_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class topological_representation_item extends representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TOPOLOGICAL_REPRESENTATION_ITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === topological_representation_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for topological_representation_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TOPOLOGICAL_REPRESENTATION_ITEM, EntityTypesAP214.VERTEX, EntityTypesAP214.EDGE, EntityTypesAP214.FACE_BOUND, EntityTypesAP214.FACE, EntityTypesAP214.CONNECTED_EDGE_SET, EntityTypesAP214.CONNECTED_FACE_SET, EntityTypesAP214.LOOP, EntityTypesAP214.EDGE_CURVE, EntityTypesAP214.ORIENTED_EDGE, EntityTypesAP214.SUBEDGE, EntityTypesAP214.FACE_SURFACE, EntityTypesAP214.SUBFACE, EntityTypesAP214.ORIENTED_FACE, EntityTypesAP214.CLOSED_SHELL, EntityTypesAP214.OPEN_SHELL, EntityTypesAP214.VERTEX_LOOP, EntityTypesAP214.EDGE_LOOP, EntityTypesAP214.POLY_LOOP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TOPOLOGICAL_REPRESENTATION_ITEM
}
