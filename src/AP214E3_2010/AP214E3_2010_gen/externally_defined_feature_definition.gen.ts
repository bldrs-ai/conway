
import { feature_definition } from "./index"
import { identifier } from "./index"
import { external_source } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class externally_defined_feature_definition extends feature_definition {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTERNALLY_DEFINED_FEATURE_DEFINITION
  }
  private item_id_? : identifier
  private source_? : external_source

  public get item_id() : identifier {
    if ( this.item_id_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 2, 2, false )

      if ( !( value instanceof identifier ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.item_id_ = value as (identifier)

    }

    return this.item_id_ as identifier
  }

  public get source() : external_source {
    if ( this.source_ === void 0 ) {
      this.source_ = this.extractElement( 3, 2, 2, false, external_source )
    }

    return this.source_ as external_source
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === externally_defined_feature_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for externally_defined_feature_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.EXTERNALLY_DEFINED_FEATURE_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTERNALLY_DEFINED_FEATURE_DEFINITION
}
