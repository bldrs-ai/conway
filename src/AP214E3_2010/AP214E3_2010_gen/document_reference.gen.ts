
import { document } from "./index"
import { label } from "./index"
import { object_role } from "./index"
import {
  get_role,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class document_reference extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DOCUMENT_REFERENCE
  }
  private assigned_document_? : document
  private source_? : string

  public get assigned_document() : document {
    if ( this.assigned_document_ === void 0 ) {
      this.assigned_document_ = this.extractElement( 0, 0, 0, false, document )
    }

    return this.assigned_document_ as document
  }

  public get source() : string {
    if ( this.source_ === void 0 ) {
      this.source_ = this.extractString( 1, 0, 0, false )
    }

    return this.source_ as string
  }

  public get role() : object_role {
    return get_role(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === document_reference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for document_reference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DOCUMENT_REFERENCE
}
