
import { label } from "./index"
import { text } from "./index"
import { document } from "./index"
import { product } from "./index"
import { product_definition_formation } from "./index"
import { product_definition } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document_product_association extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_PRODUCT_ASSOCIATION
  }
  private name_? : string
  private description_? : string | null
  private relating_document_? : document
  private related_product_? : product | product_definition_formation | product_definition

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, true )
    }

    return this.description_ as string | null
  }

  public get relating_document() : document {
    if ( this.relating_document_ === void 0 ) {
      this.relating_document_ = this.extractElement( 2, 0, 0, false, document )
    }

    return this.relating_document_ as document
  }

  public get related_product() : product | product_definition_formation | product_definition {
    if ( this.related_product_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, 0, 0, false )

      if ( !( value instanceof product ) && !( value instanceof product_definition_formation ) && !( value instanceof product_definition ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.related_product_ = value as (product | product_definition_formation | product_definition)

    }

    return this.related_product_ as product | product_definition_formation | product_definition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_product_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_product_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT_PRODUCT_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_PRODUCT_ASSOCIATION
}
