
import { representation_item } from "./index"
import { representation_map } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class mapped_item extends representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MAPPED_ITEM
  }
  private mapping_source_? : representation_map
  private mapping_target_? : representation_item

  public get mapping_source() : representation_map {
    if ( this.mapping_source_ === void 0 ) {
      this.mapping_source_ = this.extractElement( 1, 1, 1, false, representation_map )
    }

    return this.mapping_source_ as representation_map
  }

  public get mapping_target() : representation_item {
    if ( this.mapping_target_ === void 0 ) {
      this.mapping_target_ = this.extractElement( 2, 1, 1, false, representation_item )
    }

    return this.mapping_target_ as representation_item
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === mapped_item.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for mapped_item" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MAPPED_ITEM ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MAPPED_ITEM
}
