
import { label } from "./index"
import { text } from "./index"
import { security_classification_level } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class security_classification extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SECURITY_CLASSIFICATION
  }
  private name_? : string
  private purpose_? : string
  private security_level_? : security_classification_level

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get purpose() : string {
    if ( this.purpose_ === void 0 ) {
      this.purpose_ = this.extractString( 1, 0, 0, false )
    }

    return this.purpose_ as string
  }

  public get security_level() : security_classification_level {
    if ( this.security_level_ === void 0 ) {
      this.security_level_ = this.extractElement( 2, 0, 0, false, security_classification_level )
    }

    return this.security_level_ as security_classification_level
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === security_classification.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for security_classification" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SECURITY_CLASSIFICATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SECURITY_CLASSIFICATION
}
