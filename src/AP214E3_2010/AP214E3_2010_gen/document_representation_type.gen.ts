
import { label } from "./index"
import { document } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document_representation_type extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_REPRESENTATION_TYPE
  }
  private name_? : string
  private represented_document_? : document

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get represented_document() : document {
    if ( this.represented_document_ === void 0 ) {
      this.represented_document_ = this.extractElement( 1, 0, 0, false, document )
    }

    return this.represented_document_ as document
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_representation_type.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_representation_type" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT_REPRESENTATION_TYPE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_REPRESENTATION_TYPE
}
