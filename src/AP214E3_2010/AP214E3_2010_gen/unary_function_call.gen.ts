
import { unary_numeric_expression } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class unary_function_call extends unary_numeric_expression {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.UNARY_FUNCTION_CALL
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === unary_function_call.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for unary_function_call" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ABS_FUNCTION, EntityTypesAP214.MINUS_FUNCTION, EntityTypesAP214.SIN_FUNCTION, EntityTypesAP214.COS_FUNCTION, EntityTypesAP214.TAN_FUNCTION, EntityTypesAP214.ASIN_FUNCTION, EntityTypesAP214.ACOS_FUNCTION, EntityTypesAP214.EXP_FUNCTION, EntityTypesAP214.LOG_FUNCTION, EntityTypesAP214.LOG2_FUNCTION, EntityTypesAP214.LOG10_FUNCTION, EntityTypesAP214.SQUARE_ROOT_FUNCTION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.UNARY_FUNCTION_CALL
}
