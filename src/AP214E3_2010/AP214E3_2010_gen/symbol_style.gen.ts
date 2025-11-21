
import { founded_item } from "./index"
import { label } from "./index"
import { symbol_colour } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class symbol_style extends founded_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.SYMBOL_STYLE
  }
  private name_? : string
  private style_of_symbol_? : symbol_colour

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 1, false )
    }

    return this.name_ as string
  }

  public get style_of_symbol() : symbol_colour {
    if ( this.style_of_symbol_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 1, false )

      if ( !( value instanceof symbol_colour ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.style_of_symbol_ = value as (symbol_colour)

    }

    return this.style_of_symbol_ as symbol_colour
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === symbol_style.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for symbol_style" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.SYMBOL_STYLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.SYMBOL_STYLE
}
