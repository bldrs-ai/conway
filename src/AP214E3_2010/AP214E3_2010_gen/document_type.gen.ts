
import { label } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document_type extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_TYPE
  }
  private product_data_type_? : string

  public get product_data_type() : string {
    if ( this.product_data_type_ === void 0 ) {
      this.product_data_type_ = this.extractString( 0, 0, 0, false )
    }

    return this.product_data_type_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_type.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_type" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT_TYPE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_TYPE
}
