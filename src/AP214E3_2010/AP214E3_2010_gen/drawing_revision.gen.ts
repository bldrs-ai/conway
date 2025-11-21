
import { presentation_set } from "./index"
import { identifier } from "./index"
import { drawing_definition } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class drawing_revision extends presentation_set {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DRAWING_REVISION
  }
  private revision_identifier_? : string
  private drawing_identifier_? : drawing_definition
  private intended_scale_? : string | null

  public get revision_identifier() : string {
    if ( this.revision_identifier_ === void 0 ) {
      this.revision_identifier_ = this.extractString( 0, 0, 1, false )
    }

    return this.revision_identifier_ as string
  }

  public get drawing_identifier() : drawing_definition {
    if ( this.drawing_identifier_ === void 0 ) {
      this.drawing_identifier_ = this.extractElement( 1, 0, 1, false, drawing_definition )
    }

    return this.drawing_identifier_ as drawing_definition
  }

  public get intended_scale() : string | null {
    if ( this.intended_scale_ === void 0 ) {
      this.intended_scale_ = this.extractString( 2, 0, 1, true )
    }

    return this.intended_scale_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === drawing_revision.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for drawing_revision" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DRAWING_REVISION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DRAWING_REVISION
}
