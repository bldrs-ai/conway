
import { presentation_area } from "./index"
import { presentation_set } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class area_in_set extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.AREA_IN_SET
  }
  private area_? : presentation_area
  private in_set_? : presentation_set

  public get area() : presentation_area {
    if ( this.area_ === void 0 ) {
      this.area_ = this.extractElement( 0, 0, 0, false, presentation_area )
    }

    return this.area_ as presentation_area
  }

  public get in_set() : presentation_set {
    if ( this.in_set_ === void 0 ) {
      this.in_set_ = this.extractElement( 1, 0, 0, false, presentation_set )
    }

    return this.in_set_ as presentation_set
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === area_in_set.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for area_in_set" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.AREA_IN_SET ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.AREA_IN_SET
}
