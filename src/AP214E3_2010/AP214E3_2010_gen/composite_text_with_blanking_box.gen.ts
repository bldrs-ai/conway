
import { composite_text } from "./index"
import { planar_box } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class composite_text_with_blanking_box extends composite_text {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.COMPOSITE_TEXT_WITH_BLANKING_BOX
  }
  private blanking_? : planar_box

  public get blanking() : planar_box {
    if ( this.blanking_ === void 0 ) {
      this.blanking_ = this.extractElement( 2, 2, 3, false, planar_box )
    }

    return this.blanking_ as planar_box
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === composite_text_with_blanking_box.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for composite_text_with_blanking_box" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.COMPOSITE_TEXT_WITH_BLANKING_BOX ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.COMPOSITE_TEXT_WITH_BLANKING_BOX
}
