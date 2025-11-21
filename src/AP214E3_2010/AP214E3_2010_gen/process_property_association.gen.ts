
import { label } from "./index"
import { text } from "./index"
import { property_process } from "./index"
import { property_definition } from "./index"
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
export  class process_property_association extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PROCESS_PROPERTY_ASSOCIATION
  }
  private name_? : string
  private description_? : string
  private process_? : property_process
  private property_or_shape_? : property_definition | product_definition_shape | shape_aspect | shape_aspect_relationship

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get process() : property_process {
    if ( this.process_ === void 0 ) {
      this.process_ = this.extractElement( 2, 0, 0, false, property_process )
    }

    return this.process_ as property_process
  }

  public get property_or_shape() : property_definition | product_definition_shape | shape_aspect | shape_aspect_relationship {
    if ( this.property_or_shape_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 3, 0, 0, false )

      if ( !( value instanceof property_definition ) && !( value instanceof product_definition_shape ) && !( value instanceof shape_aspect ) && !( value instanceof shape_aspect_relationship ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.property_or_shape_ = value as (property_definition | product_definition_shape | shape_aspect | shape_aspect_relationship)

    }

    return this.property_or_shape_ as property_definition | product_definition_shape | shape_aspect | shape_aspect_relationship
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === process_property_association.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for process_property_association" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.PROCESS_PROPERTY_ASSOCIATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PROCESS_PROPERTY_ASSOCIATION
}
