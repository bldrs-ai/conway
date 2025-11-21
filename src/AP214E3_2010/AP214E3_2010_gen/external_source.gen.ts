
import { identifier } from "./index"
import { text } from "./index"
import {
  get_description_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class external_source extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTERNAL_SOURCE
  }
  private source_id_? : identifier

  public get source_id() : identifier {
    if ( this.source_id_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 0, 0, 0, false )

      if ( !( value instanceof identifier ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.source_id_ = value as (identifier)

    }

    return this.source_id_ as identifier
  }

  public get description() : string {
    return get_description_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === external_source.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for external_source" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EXTERNAL_SOURCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTERNAL_SOURCE
}
