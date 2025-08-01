
import { expression } from "./index"
import {
  is_sql_mappable,
  is_int_expr,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class numeric_expression extends expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.NUMERIC_EXPRESSION
  }


  public get is_int() : boolean {
    return is_int_expr(this);
  }

  public get sql_mappable() : boolean {
    return is_sql_mappable(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === numeric_expression.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for numeric_expression" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LENGTH_FUNCTION, EntityTypesAP214.VALUE_FUNCTION, EntityTypesAP214.NUMERIC_VARIABLE, EntityTypesAP214.INT_LITERAL, EntityTypesAP214.REAL_LITERAL, EntityTypesAP214.INT_NUMERIC_VARIABLE, EntityTypesAP214.REAL_NUMERIC_VARIABLE, EntityTypesAP214.ABS_FUNCTION, EntityTypesAP214.MINUS_FUNCTION, EntityTypesAP214.SIN_FUNCTION, EntityTypesAP214.COS_FUNCTION, EntityTypesAP214.TAN_FUNCTION, EntityTypesAP214.ASIN_FUNCTION, EntityTypesAP214.ACOS_FUNCTION, EntityTypesAP214.EXP_FUNCTION, EntityTypesAP214.LOG_FUNCTION, EntityTypesAP214.LOG2_FUNCTION, EntityTypesAP214.LOG10_FUNCTION, EntityTypesAP214.SQUARE_ROOT_FUNCTION, EntityTypesAP214.MINUS_EXPRESSION, EntityTypesAP214.DIV_EXPRESSION, EntityTypesAP214.MOD_EXPRESSION, EntityTypesAP214.SLASH_EXPRESSION, EntityTypesAP214.POWER_EXPRESSION, EntityTypesAP214.ATAN_FUNCTION, EntityTypesAP214.PLUS_EXPRESSION, EntityTypesAP214.MULT_EXPRESSION, EntityTypesAP214.MAXIMUM_FUNCTION, EntityTypesAP214.MINIMUM_FUNCTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.NUMERIC_EXPRESSION
}
