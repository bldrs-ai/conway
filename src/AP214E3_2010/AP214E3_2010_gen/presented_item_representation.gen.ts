
import { presentation_representation } from "./index"
import { presentation_set } from "./index"
import { presented_item } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class presented_item_representation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRESENTED_ITEM_REPRESENTATION
  }
  private presentation_? : presentation_representation | presentation_set
  private item_? : presented_item

  public get presentation() : presentation_representation | presentation_set {
    if ( this.presentation_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof presentation_representation ) && !( value instanceof presentation_set ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.presentation_ = value as (presentation_representation | presentation_set)

    }

    return this.presentation_ as presentation_representation | presentation_set
  }

  public get item() : presented_item {
    if ( this.item_ === void 0 ) {
      this.item_ = this.extractElement( 1, 0, 0, false, presented_item )
    }

    return this.item_ as presented_item
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === presented_item_representation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for presented_item_representation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRESENTED_ITEM_REPRESENTATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRESENTED_ITEM_REPRESENTATION
}
