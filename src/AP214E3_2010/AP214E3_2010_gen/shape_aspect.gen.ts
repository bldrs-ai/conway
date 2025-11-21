
import { label } from "./index"
import { text } from "./index"
import { product_definition_shape } from "./index"
import { identifier } from "./index"
import {
  get_id_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class shape_aspect extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SHAPE_ASPECT
  }
  private name_? : string
  private description_? : string | null
  private of_shape_? : product_definition_shape
  private product_definitional_? : boolean

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

  public get of_shape() : product_definition_shape {
    if ( this.of_shape_ === void 0 ) {
      this.of_shape_ = this.extractElement( 2, 0, 0, false, product_definition_shape )
    }

    return this.of_shape_ as product_definition_shape
  }

  public get product_definitional() : boolean {
    if ( this.product_definitional_ === void 0 ) {
      this.product_definitional_ = this.extractBoolean( 3, 0, 0, false )
    }

    return this.product_definitional_ as boolean
  }

  public get id() : string {
    return get_id_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === shape_aspect.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for shape_aspect" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SHAPE_ASPECT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SHAPE_ASPECT
}
