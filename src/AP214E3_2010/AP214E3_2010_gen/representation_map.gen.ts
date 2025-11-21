
import { representation_item } from "./index"
import { representation } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class representation_map extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.REPRESENTATION_MAP
  }
  private mapping_origin_? : representation_item
  private mapped_representation_? : representation

  public get mapping_origin() : representation_item {
    if ( this.mapping_origin_ === void 0 ) {
      this.mapping_origin_ = this.extractElement( 0, 0, 0, false, representation_item )
    }

    return this.mapping_origin_ as representation_item
  }

  public get mapped_representation() : representation {
    if ( this.mapped_representation_ === void 0 ) {
      this.mapped_representation_ = this.extractElement( 1, 0, 0, false, representation )
    }

    return this.mapped_representation_ as representation
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === representation_map.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for representation_map" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.REPRESENTATION_MAP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.REPRESENTATION_MAP
}
