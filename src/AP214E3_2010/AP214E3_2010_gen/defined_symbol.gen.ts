
import { geometric_representation_item } from "./index"
import { pre_defined_symbol } from "./index"
import { externally_defined_symbol } from "./index"
import { symbol_target } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class defined_symbol extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DEFINED_SYMBOL
  }
  private definition_? : pre_defined_symbol | externally_defined_symbol
  private target_? : symbol_target

  public get definition() : pre_defined_symbol | externally_defined_symbol {
    if ( this.definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 1, 2, false )

      if ( !( value instanceof pre_defined_symbol ) && !( value instanceof externally_defined_symbol ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.definition_ = value as (pre_defined_symbol | externally_defined_symbol)

    }

    return this.definition_ as pre_defined_symbol | externally_defined_symbol
  }

  public get target() : symbol_target {
    if ( this.target_ === void 0 ) {
      this.target_ = this.extractElement( 2, 1, 2, false, symbol_target )
    }

    return this.target_ as symbol_target
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === defined_symbol.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for defined_symbol" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DEFINED_SYMBOL ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DEFINED_SYMBOL
}
