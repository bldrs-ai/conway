
import { identifier } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class representation_context extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.REPRESENTATION_CONTEXT
  }
  private context_identifier_? : string
  private context_type_? : string

  public get context_identifier() : string {
    if ( this.context_identifier_ === void 0 ) {
      this.context_identifier_ = this.extractString( 0, 0, 0, false )
    }

    return this.context_identifier_ as string
  }

  public get context_type() : string {
    if ( this.context_type_ === void 0 ) {
      this.context_type_ = this.extractString( 1, 0, 0, false )
    }

    return this.context_type_ as string
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === representation_context.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for representation_context" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.REPRESENTATION_CONTEXT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.REPRESENTATION_CONTEXT
}
