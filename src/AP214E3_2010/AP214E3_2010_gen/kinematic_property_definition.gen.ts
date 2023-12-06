
import { property_definition } from "./index"
import { characterized_object } from "./index"
import { product_definition } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_shape } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/kinematic_property_definition.htm */
export  class kinematic_property_definition extends property_definition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.KINEMATIC_PROPERTY_DEFINITION
  }
  private ground_definition_? : characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship

  public get ground_definition() : characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship {
    if ( this.ground_definition_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > =
        this.extractReference( 3, false )

      if ( !( value instanceof characterized_object ) && !( value instanceof product_definition ) && !( value instanceof product_definition_relationship ) && !( value instanceof product_definition_shape ) && !( value instanceof shape_aspect ) && !( value instanceof shape_aspect_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.ground_definition_ = value as (characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship)

    }

    return this.ground_definition_ as characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.KINEMATIC_PROPERTY_DEFINITION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.KINEMATIC_PROPERTY_DEFINITION
}