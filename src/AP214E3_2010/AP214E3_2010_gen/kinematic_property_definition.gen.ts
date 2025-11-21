
import { property_definition } from "./index"
import { characterized_object } from "./index"
import { product_definition } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_shape } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class kinematic_property_definition extends property_definition {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.KINEMATIC_PROPERTY_DEFINITION
  }
  private ground_definition_? : characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship

  public get ground_definition() : characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship {
    if ( this.ground_definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, 3, 1, false )

      if ( !( value instanceof characterized_object ) && !( value instanceof product_definition ) && !( value instanceof product_definition_relationship ) && !( value instanceof product_definition_shape ) && !( value instanceof shape_aspect ) && !( value instanceof shape_aspect_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.ground_definition_ = value as (characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship)

    }

    return this.ground_definition_ as characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === kinematic_property_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for kinematic_property_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.KINEMATIC_PROPERTY_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.KINEMATIC_PROPERTY_DEFINITION
}
