
import { configuration_item } from "./index"
import { product_definition } from "./index"
import { product_definition_formation } from "./index"
import { label } from "./index"
import { text } from "./index"
import {
  get_name_value,
  get_description_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class configuration_design extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.CONFIGURATION_DESIGN
  }
  private configuration_? : configuration_item
  private design_? : product_definition | product_definition_formation

  public get configuration() : configuration_item {
    if ( this.configuration_ === void 0 ) {
      this.configuration_ = this.extractElement( 0, 0, 0, false, configuration_item )
    }

    return this.configuration_ as configuration_item
  }

  public get design() : product_definition | product_definition_formation {
    if ( this.design_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof product_definition ) && !( value instanceof product_definition_formation ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.design_ = value as (product_definition | product_definition_formation)

    }

    return this.design_ as product_definition | product_definition_formation
  }

  public get name() : string {
    return get_name_value(this);
  }

  public get description() : string {
    return get_description_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === configuration_design.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for configuration_design" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.CONFIGURATION_DESIGN ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.CONFIGURATION_DESIGN
}
