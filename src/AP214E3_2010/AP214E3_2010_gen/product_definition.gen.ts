
import { identifier } from "./index"
import { text } from "./index"
import { product_definition_formation } from "./index"
import { product_definition_context } from "./index"
import { label } from "./index"
import {
  get_name_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class product_definition extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRODUCT_DEFINITION
  }
  private id_? : string
  private description_? : string | null
  private formation_? : product_definition_formation
  private frame_of_reference_? : product_definition_context

  public get id() : string {
    if ( this.id_ === void 0 ) {
      this.id_ = this.extractString( 0, 0, 0, false )
    }

    return this.id_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, true )
    }

    return this.description_ as string | null
  }

  public get formation() : product_definition_formation {
    if ( this.formation_ === void 0 ) {
      this.formation_ = this.extractElement( 2, 0, 0, false, product_definition_formation )
    }

    return this.formation_ as product_definition_formation
  }

  public get frame_of_reference() : product_definition_context {
    if ( this.frame_of_reference_ === void 0 ) {
      this.frame_of_reference_ = this.extractElement( 3, 0, 0, false, product_definition_context )
    }

    return this.frame_of_reference_ as product_definition_context
  }

  public get name() : string {
    return get_name_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === product_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for product_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PRODUCT_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRODUCT_DEFINITION
}
