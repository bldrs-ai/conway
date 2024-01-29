
import { label } from "./index"
import { text } from "./index"
import { document } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document_relationship extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_RELATIONSHIP
  }
  private name_? : string
  private description_? : string | null
  private relating_document_? : document
  private related_document_? : document

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, true )
    }

    return this.description_ as string | null
  }

  public get relating_document() : document {
    if ( this.relating_document_ === void 0 ) {
      this.relating_document_ = this.extractElement( 2, false, document )
    }

    return this.relating_document_ as document
  }

  public get related_document() : document {
    if ( this.related_document_ === void 0 ) {
      this.related_document_ = this.extractElement( 3, false, document )
    }

    return this.related_document_ as document
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT_RELATIONSHIP ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_RELATIONSHIP
}
