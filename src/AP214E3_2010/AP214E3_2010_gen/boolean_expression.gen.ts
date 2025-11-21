
import { expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class boolean_expression extends expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOOLEAN_EXPRESSION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === boolean_expression.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for boolean_expression" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.INTERVAL_EXPRESSION, EntityTypesAP214.BOOLEAN_LITERAL, EntityTypesAP214.BOOLEAN_VARIABLE, EntityTypesAP214.NOT_EXPRESSION, EntityTypesAP214.ODD_FUNCTION, EntityTypesAP214.XOR_EXPRESSION, EntityTypesAP214.EQUALS_EXPRESSION, EntityTypesAP214.AND_EXPRESSION, EntityTypesAP214.OR_EXPRESSION, EntityTypesAP214.COMPARISON_EQUAL, EntityTypesAP214.COMPARISON_GREATER, EntityTypesAP214.COMPARISON_GREATER_EQUAL, EntityTypesAP214.COMPARISON_LESS, EntityTypesAP214.COMPARISON_LESS_EQUAL, EntityTypesAP214.COMPARISON_NOT_EQUAL, EntityTypesAP214.LIKE_EXPRESSION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOOLEAN_EXPRESSION
}
