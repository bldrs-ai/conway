
import { geometric_representation_item } from "./index"
import { label } from "./index"
import { text } from "./index"
import { direction } from "./index"
import { cartesian_point } from "./index"
import {
  NVL,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class cartesian_transformation_operator extends geometric_representation_item {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR
  }
  private description_? : string | null
  private axis1_? : direction | null
  private axis2_? : direction | null
  private local_origin_? : cartesian_point
  private scale_? : number | null

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 1, 2, true )
    }

    return this.description_ as string | null
  }

  public get axis1() : direction | null {
    if ( this.axis1_ === void 0 ) {
      this.axis1_ = this.extractElement( 2, 1, 2, true, direction )
    }

    return this.axis1_ as direction | null
  }

  public get axis2() : direction | null {
    if ( this.axis2_ === void 0 ) {
      this.axis2_ = this.extractElement( 3, 1, 2, true, direction )
    }

    return this.axis2_ as direction | null
  }

  public get local_origin() : cartesian_point {
    if ( this.local_origin_ === void 0 ) {
      this.local_origin_ = this.extractElement( 4, 1, 2, false, cartesian_point )
    }

    return this.local_origin_ as cartesian_point
  }

  public get scale() : number | null {
    if ( this.scale_ === void 0 ) {
      this.scale_ = this.extractNumber( 5, 1, 2, true )
    }

    return this.scale_ as number | null
  }

  public get scl() : number {
    return NVL(this?.scale,1.0);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === cartesian_transformation_operator.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for cartesian_transformation_operator" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR, EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR_2D, EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR_3D ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CARTESIAN_TRANSFORMATION_OPERATOR
}
