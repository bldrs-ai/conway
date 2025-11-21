
import { boolean_expression } from "./index"
import { generic_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class unary_boolean_expression extends boolean_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.UNARY_BOOLEAN_EXPRESSION
  }
  private operand_? : generic_expression

  public get operand() : generic_expression {
    if ( this.operand_ === void 0 ) {
      this.operand_ = this.extractElement( 0, 0, 3, false, generic_expression )
    }

    return this.operand_ as generic_expression
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === unary_boolean_expression.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for unary_boolean_expression" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.NOT_EXPRESSION, EntityTypesAP214.ODD_FUNCTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.UNARY_BOOLEAN_EXPRESSION
}
