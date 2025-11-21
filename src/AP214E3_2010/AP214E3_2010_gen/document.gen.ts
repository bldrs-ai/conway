
import { identifier } from "./index"
import { label } from "./index"
import { text } from "./index"
import { document_type } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class document extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT
  }
  private id_? : string
  private name_? : string
  private description_? : string | null
  private kind_? : document_type

  public get id() : string {
    if ( this.id_ === void 0 ) {
      this.id_ = this.extractString( 0, 0, 0, false )
    }

    return this.id_ as string
  }

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 1, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 2, 0, 0, true )
    }

    return this.description_ as string | null
  }

  public get kind() : document_type {
    if ( this.kind_ === void 0 ) {
      this.kind_ = this.extractElement( 3, 0, 0, false, document_type )
    }

    return this.kind_ as document_type
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DOCUMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT
}
