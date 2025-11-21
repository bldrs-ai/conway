
import { document } from "./index"
import { label } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document_usage_constraint extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_USAGE_CONSTRAINT
  }
  private source_? : document
  private subject_element_? : string
  private subject_element_value_? : string

  public get source() : document {
    if ( this.source_ === void 0 ) {
      this.source_ = this.extractElement( 0, 0, 0, false, document )
    }

    return this.source_ as document
  }

  public get subject_element() : string {
    if ( this.subject_element_ === void 0 ) {
      this.subject_element_ = this.extractString( 1, 0, 0, false )
    }

    return this.subject_element_ as string
  }

  public get subject_element_value() : string {
    if ( this.subject_element_value_ === void 0 ) {
      this.subject_element_value_ = this.extractString( 2, 0, 0, false )
    }

    return this.subject_element_value_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_usage_constraint.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_usage_constraint" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT_USAGE_CONSTRAINT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_USAGE_CONSTRAINT
}
