
import { presentation_view } from "./index"
import { presentation_area } from "./index"
import { area_in_set } from "./index"
import { planar_box } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class presentation_size extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRESENTATION_SIZE
  }
  private unit_? : presentation_view | presentation_area | area_in_set
  private size_? : planar_box

  public get unit() : presentation_view | presentation_area | area_in_set {
    if ( this.unit_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof presentation_view ) && !( value instanceof presentation_area ) && !( value instanceof area_in_set ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.unit_ = value as (presentation_view | presentation_area | area_in_set)

    }

    return this.unit_ as presentation_view | presentation_area | area_in_set
  }

  public get size() : planar_box {
    if ( this.size_ === void 0 ) {
      this.size_ = this.extractElement( 1, 0, 0, false, planar_box )
    }

    return this.size_ as planar_box
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === presentation_size.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for presentation_size" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRESENTATION_SIZE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRESENTATION_SIZE
}
