
import { geometric_representation_item } from "./index"
import { boolean_operator, boolean_operatorDeserializeStep } from "./index"
import { solid_model } from "./index"
import { half_space_solid } from "./index"
import { sphere } from "./index"
import { block } from "./index"
import { right_angular_wedge } from "./index"
import { torus } from "./index"
import { right_circular_cone } from "./index"
import { right_circular_cylinder } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class boolean_result extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.BOOLEAN_RESULT
  }
  private operator_? : boolean_operator
  private first_operand_? : solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result
  private second_operand_? : solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result

  public get operator() : boolean_operator {
    if ( this.operator_ === void 0 ) {
      this.operator_ = this.extractLambda( 1, 1, 2, boolean_operatorDeserializeStep, false )
    }

    return this.operator_ as boolean_operator
  }

  public get first_operand() : solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result {
    if ( this.first_operand_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 1, 2, false )

      if ( !( value instanceof solid_model ) && !( value instanceof half_space_solid ) && !( value instanceof sphere ) && !( value instanceof block ) && !( value instanceof right_angular_wedge ) && !( value instanceof torus ) && !( value instanceof right_circular_cone ) && !( value instanceof right_circular_cylinder ) && !( value instanceof boolean_result ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.first_operand_ = value as (solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result)

    }

    return this.first_operand_ as solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result
  }

  public get second_operand() : solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result {
    if ( this.second_operand_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, 1, 2, false )

      if ( !( value instanceof solid_model ) && !( value instanceof half_space_solid ) && !( value instanceof sphere ) && !( value instanceof block ) && !( value instanceof right_angular_wedge ) && !( value instanceof torus ) && !( value instanceof right_circular_cone ) && !( value instanceof right_circular_cylinder ) && !( value instanceof boolean_result ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.second_operand_ = value as (solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result)

    }

    return this.second_operand_ as solid_model | half_space_solid | sphere | block | right_angular_wedge | torus | right_circular_cone | right_circular_cylinder | boolean_result
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === boolean_result.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for boolean_result" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.BOOLEAN_RESULT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.BOOLEAN_RESULT
}
