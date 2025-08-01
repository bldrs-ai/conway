
import { generic_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class expression extends generic_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXPRESSION
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === expression.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for expression" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LENGTH_FUNCTION, EntityTypesAP214.VALUE_FUNCTION, EntityTypesAP214.NUMERIC_VARIABLE, EntityTypesAP214.INT_LITERAL, EntityTypesAP214.REAL_LITERAL, EntityTypesAP214.INT_NUMERIC_VARIABLE, EntityTypesAP214.REAL_NUMERIC_VARIABLE, EntityTypesAP214.ABS_FUNCTION, EntityTypesAP214.MINUS_FUNCTION, EntityTypesAP214.SIN_FUNCTION, EntityTypesAP214.COS_FUNCTION, EntityTypesAP214.TAN_FUNCTION, EntityTypesAP214.ASIN_FUNCTION, EntityTypesAP214.ACOS_FUNCTION, EntityTypesAP214.EXP_FUNCTION, EntityTypesAP214.LOG_FUNCTION, EntityTypesAP214.LOG2_FUNCTION, EntityTypesAP214.LOG10_FUNCTION, EntityTypesAP214.SQUARE_ROOT_FUNCTION, EntityTypesAP214.MINUS_EXPRESSION, EntityTypesAP214.DIV_EXPRESSION, EntityTypesAP214.MOD_EXPRESSION, EntityTypesAP214.SLASH_EXPRESSION, EntityTypesAP214.POWER_EXPRESSION, EntityTypesAP214.ATAN_FUNCTION, EntityTypesAP214.PLUS_EXPRESSION, EntityTypesAP214.MULT_EXPRESSION, EntityTypesAP214.MAXIMUM_FUNCTION, EntityTypesAP214.MINIMUM_FUNCTION, EntityTypesAP214.INTERVAL_EXPRESSION, EntityTypesAP214.BOOLEAN_LITERAL, EntityTypesAP214.BOOLEAN_VARIABLE, EntityTypesAP214.NOT_EXPRESSION, EntityTypesAP214.ODD_FUNCTION, EntityTypesAP214.XOR_EXPRESSION, EntityTypesAP214.EQUALS_EXPRESSION, EntityTypesAP214.AND_EXPRESSION, EntityTypesAP214.OR_EXPRESSION, EntityTypesAP214.COMPARISON_EQUAL, EntityTypesAP214.COMPARISON_GREATER, EntityTypesAP214.COMPARISON_GREATER_EQUAL, EntityTypesAP214.COMPARISON_LESS, EntityTypesAP214.COMPARISON_LESS_EQUAL, EntityTypesAP214.COMPARISON_NOT_EQUAL, EntityTypesAP214.LIKE_EXPRESSION, EntityTypesAP214.INDEX_EXPRESSION, EntityTypesAP214.SUBSTRING_EXPRESSION, EntityTypesAP214.CONCAT_EXPRESSION, EntityTypesAP214.FORMAT_FUNCTION, EntityTypesAP214.STRING_LITERAL, EntityTypesAP214.STRING_VARIABLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXPRESSION
}
