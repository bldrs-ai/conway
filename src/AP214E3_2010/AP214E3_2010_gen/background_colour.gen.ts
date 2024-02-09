
import { colour } from "./index"
import { presentation_area } from "./index"
import { presentation_view } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class background_colour extends colour {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BACKGROUND_COLOUR
  }
  private presentation_? : presentation_area | presentation_view

  public get presentation() : presentation_area | presentation_view {
    if ( this.presentation_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, false )

      if ( !( value instanceof presentation_area ) && !( value instanceof presentation_view ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.presentation_ = value as (presentation_area | presentation_view)

    }

    return this.presentation_ as presentation_area | presentation_view
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.BACKGROUND_COLOUR ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BACKGROUND_COLOUR
}
